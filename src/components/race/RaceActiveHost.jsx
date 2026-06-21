import React, {useEffect, useRef, useState} from 'react';
import { useWebSocket } from "../../services/webSocket/WebSocketContext.js";
import './RaceActiveHost.css';
import RaceHeaderHost from "./RaceHeaderHost.jsx";
import TrackGroup from './TrackGroup.jsx';

function RaceActiveHost({ raceState, joinToken, timeOffset = 0, onKickPlayer, onSendMessageToPlayer, onPauseRace, onResumeRace, onCancelRace ,onChangeNickname, onChangeRaceName}) {
    const { isConnected, subscribe } = useWebSocket();
    const [livePlayers, setLivePlayers] = useState(raceState.players);
    const [localTimeLeft, setLocalTimeLeft] = useState(raceState.remainingTimeMs);
    const lastSyncTimeRef = useRef(raceState.fullSyncTimestamp || 0);

    useEffect(() => {
        if (!raceState || raceState.remainingTimeMs == null) return;
        if (raceState.status !== 'IN_PROGRESS') {
            setLocalTimeLeft(raceState.remainingTimeMs);
            return;
        }

        const validOffset = isNaN(timeOffset) ? 0 : timeOffset;
        const safeReceivedAt = raceState.receivedAt || (Date.now() - validOffset);
        const raceEndTime = safeReceivedAt + raceState.remainingTimeMs;

        const intervalId = setInterval(() => {
            const currentServerTime = Date.now() - validOffset;
            const remaining = Math.max(0, raceEndTime - currentServerTime);
            setLocalTimeLeft(isNaN(remaining) ? 0 : remaining);
            if (remaining <= 0) clearInterval(intervalId);
        }, 100);

        const initialServerTime = Date.now() - validOffset;
        setLocalTimeLeft(Math.max(0, raceEndTime - initialServerTime));

        return () => clearInterval(intervalId);
    }, [raceState.receivedAt, raceState.remainingTimeMs, raceState.status, timeOffset]);

    useEffect(() => {
        const isFullSync = Boolean(raceState.fullSyncTimestamp && raceState.fullSyncTimestamp !== lastSyncTimeRef.current);

        if (isFullSync) {
            lastSyncTimeRef.current = raceState.fullSyncTimestamp;
        }

        setLivePlayers(prevLive => {
            return raceState.players.map(parentPlayer => {
                const existing = prevLive.find(p => p.id === parentPlayer.id);

                if (existing) {
                    if (isFullSync) {
                        return {
                            ...existing,
                            ...parentPlayer,
                            bubbleEvent: existing.bubbleEvent,
                            clearInputTrigger: existing.clearInputTrigger
                        };
                    } else {
                        return {
                            ...existing,
                            online: parentPlayer.online,
                            nickname: parentPlayer.nickname,
                            currentScore: Math.max(existing.currentScore || 0, parentPlayer.currentScore || 0),
                        };
                    }
                }
                return parentPlayer;
            });
        });
    }, [raceState.players, raceState.fullSyncTimestamp]);

    useEffect(() => {
        if (!isConnected) return;
        const queue = `/user/queue/race/host`;

        const unsubscribe = subscribe(queue, (data) => {
            console.log(data);
            setLivePlayers(prevPlayers => {
                const targetPlayerId = data.type === 'NEW_HOST_MESSAGE' ? data.data.to : data.data.playerId;

                return prevPlayers.map(p => {
                    if (p.id !== targetPlayerId) return p;

                    const updatedPlayer = { ...p };
                    const bubbleId = Date.now();

                    switch (data.type) {
                        case 'NEW_HOST_MESSAGE':
                            updatedPlayer.bubbleEvent = { type: 'MESSAGE', id: bubbleId };
                            updatedPlayer.clearInputTrigger = bubbleId;
                            break;
                        case 'PLAYER_ANSWERED_CORRECTLY':
                            updatedPlayer.currentScore += data.data.score;
                            updatedPlayer.currentQuestion = null;
                            updatedPlayer.bubbleEvent = { type: 'CORRECT', id: bubbleId };
                            break;
                        case 'PLAYER_ANSWERED_INCORRECTLY':
                            updatedPlayer.currentScore += data.data.score;
                            updatedPlayer.currentQuestion = null;
                            updatedPlayer.bubbleEvent = { type: 'INCORRECT', id: bubbleId };
                            break;
                        case 'PLAYER_TIMEOUT':
                            updatedPlayer.currentScore += data.data.score;
                            updatedPlayer.currentQuestion = null;
                            updatedPlayer.bubbleEvent = { type: 'TIMEOUT', id: bubbleId };
                            break;
                        case 'QUESTION_SENT':
                            updatedPlayer.currentQuestion = {
                                id: data.data.questionId,
                                expression: data.data.expression,
                                options: data.data.options,
                                timeLimitMillis: data.data.timeLimitMillis,
                                questionRemainingTimeMillis: data.data.questionRemainingTimeMillis,
                                score: data.data.score,
                                canAskHint : data.data.canAskHint,
                                hint: data.data.hint,
                                receivedAt:data.data.sentAt
                            };
                            updatedPlayer.currentJunction = null;
                            updatedPlayer.bubbleEvent = { type: 'QUESTION', id: bubbleId };
                            break;

                        case 'QUESTION_HINT' :
                            if (updatedPlayer.currentQuestion) {
                                updatedPlayer.currentQuestion = {
                                    ...updatedPlayer.currentQuestion,
                                    canAskHint: false,
                                    hint: data.data.hint,
                                };
                            }
                            updatedPlayer.bubbleEvent = { type: 'HINT', id: bubbleId };
                            break;
                        case 'JUNCTION_OFFERED_TO_PLAYER':
                            updatedPlayer.trackState = data.data.state;
                            updatedPlayer.currentJunction = {
                                expression: data.data.expression,
                                offer1: data.data.offer1,
                                offer2: data.data.offer2,
                                timeLimitMillis: data.data.timeLimitMillis,
                                questionRemainingTimeMillis: data.data.questionRemainingTimeMillis,
                                receivedAt: data.data.sentAt,
                            };
                            updatedPlayer.currentQuestion = null;
                            updatedPlayer.bubbleEvent = { type: 'JUNCTION', id: bubbleId };
                            break;
                        case 'TRACK_STATE_CHANGED_FOR_PLAYER':
                        case 'JUNCTION_CHOOSE_FOR_PLAYER':
                        case 'JUNCTION_TIMEOUT_FOR_PLAYER':
                            updatedPlayer.trackState = data.data.state;
                            updatedPlayer.currentJunction = null;
                            break;
                        default:
                            return p;
                    }
                    return updatedPlayer;
                });
            });
        }, joinToken);

        return () => { if (unsubscribe) unsubscribe(); };
    }, [isConnected, subscribe, joinToken]);

    const tracks = { AUTOSTRADA: [], REGULAR: [], DIRT_ROAD: [] };
    livePlayers.forEach(p => {
        const currentTrack = p.trackState === 'WAITING_FOR_CHOICE' ? 'REGULAR' : (p.trackState || 'REGULAR');
        if (tracks[currentTrack]) {
            tracks[currentTrack].push(p);
        }
    });

    const [highlightedPlayerId, setHighlightedPlayerId] = useState(null);

    const handleHighlightPlayer = (playerId) => {
        setHighlightedPlayerId(playerId);
        setTimeout(() => {
            setHighlightedPlayerId(null);
        }, 2000);
    };

    return (
        <div>
            <RaceHeaderHost
                raceState={raceState}
                livePlayers={livePlayers}
                localTimeLeft={localTimeLeft}
                onPlayerClick={handleHighlightPlayer}
                onKickPlayer={onKickPlayer}
                onPauseRace={onPauseRace}
                onResumeRace={onResumeRace}
                onCancelRace={onCancelRace}
                onChangeNickname={onChangeNickname}
                onChangeRaceName={onChangeRaceName}
            />

            <div className="race-arena">
                <TrackGroup
                    trackType="AUTOSTRADA"
                    players={tracks.AUTOSTRADA}
                    targetScore={raceState.targetScore}
                    highlightedPlayerId={highlightedPlayerId}
                    onSendMessageToPlayer={onSendMessageToPlayer}
                    raceStatus={raceState.status}
                />
                <TrackGroup
                    trackType="REGULAR"
                    players={tracks.REGULAR}
                    targetScore={raceState.targetScore}
                    highlightedPlayerId={highlightedPlayerId}
                    onSendMessageToPlayer={onSendMessageToPlayer}
                    raceStatus={raceState.status}
                />
                <TrackGroup
                    trackType="DIRT_ROAD"
                    players={tracks.DIRT_ROAD}
                    targetScore={raceState.targetScore}
                    highlightedPlayerId={highlightedPlayerId}
                    onSendMessageToPlayer={onSendMessageToPlayer}
                    raceStatus={raceState.status}
                />
            </div>
        </div>
    );
}

export default RaceActiveHost;