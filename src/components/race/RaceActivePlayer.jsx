import React, { useState, useEffect, useRef, memo } from 'react';
import './RaceActivePlayer.css';
import { useWebSocket } from "../../services/webSocket/WebSocketContext.js";
import RaceHeaderPlayer from './RaceHeaderPlayer';
import RaceFlipCard from './RaceFlipCard';
import QuestionOptions from './QuestionOptions';
import QuestionTimer from "./QuestionTimer.jsx";
import QuestionHint from "./QuestionHint.jsx";

function RaceActivePlayer({ raceState, joinToken, timeOffset = 0, onAnswerQuestion, onChooseJunction , onNicknameChange, onLeaveRace, onHintClick,onReportTemplate}) {
    const {isConnected, subscribe} = useWebSocket();
    const [localPlayer, setLocalPlayer] = useState(raceState.myAccount);
    const [messages, setMessages] = useState([]);

    const activeEvent = localPlayer?.currentQuestion || localPlayer?.currentJunction;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [questionTimeLeft, setQuestionTimeLeft] = useState(0);
    const [globalTimeLeft, setGlobalTimeLeft] = useState(0);

    const [isJustReturned, setIsJustReturned] = useState(false);
    const [scoreDiff, setScoreDiff] = useState(0);
    const [feedbackType, setFeedbackType] = useState('waiting');

    const prevEventRef = useRef(activeEvent);
    const lastQuestionTimeRef = useRef(0);
    const lastAccountRef = useRef(raceState.myAccount);
    const prevTrackRef = useRef(localPlayer?.trackState);
    const prevScoreRef = useRef(localPlayer?.currentScore || 0);

    useEffect(() => {
        if (!raceState.myAccount) return;

        if (lastAccountRef.current !== raceState.myAccount) {
            const isJustStatusUpdate =
                lastAccountRef.current?.currentQuestion === raceState.myAccount.currentQuestion &&
                lastAccountRef.current?.currentJunction === raceState.myAccount.currentJunction &&
                lastAccountRef.current?.currentScore === raceState.myAccount.currentScore;

            if (isJustStatusUpdate) {
                setLocalPlayer(prev => ({
                    ...prev,
                    nickname: raceState.myAccount.nickname,
                    online: raceState.myAccount.online
                }));
            } else {
                setLocalPlayer(raceState.myAccount);
            }
            lastAccountRef.current = raceState.myAccount;
        }
    }, [raceState.myAccount]);

    useEffect(() => {
        if (!isConnected) return;
        const queue = `/user/queue/race/feedback`;

        const unsubscribe = subscribe(queue, (data) => {
            if (data.type === 'HOST_MESSAGE') {
                setMessages(prevMessages => [...prevMessages, {
                    text: data.data.message,
                    sender: data.data.from,
                    timestamp: data.data.sentAt
                }]);
            } else {
                setLocalPlayer(prevPlayer => {
                    if (!prevPlayer) return null;
                    const updatedPlayer = {...prevPlayer};

                    if (data.type === 'JUNCTION_OFFERED') {
                        updatedPlayer.currentJunction = {
                            expression: data.data.expression,
                            offer1: data.data.offer1,
                            offer2: data.data.offer2,
                            timeLimitMillis: data.data.timeLimitMillis,
                            questionRemainingTimeMillis: data.data.questionRemainingTimeMillis,
                            receivedAt: data.data.sentAt,
                        };
                        updatedPlayer.currentQuestion = null;
                        updatedPlayer.trackState = data.data.state;
                    } else if (data.type === 'JUNCTION_CHOOSE' || data.type === 'JUNCTION_TIMEOUT') {
                        updatedPlayer.currentJunction = null;
                        updatedPlayer.trackState = data.data.state;
                    } else if (data.type === 'TRACK_STATE_CHANGED') {
                        updatedPlayer.trackState = data.data.state;
                    } else if (data.type === 'NEW_QUESTION') {
                        updatedPlayer.currentJunction = null;
                        updatedPlayer.currentQuestion = {
                            id: data.data.questionId,
                            expression: data.data.expression,
                            options: data.data.options,
                            timeLimitMillis: data.data.timeLimitMillis,
                            questionRemainingTimeMillis: data.data.questionRemainingTimeMillis,
                            score: data.data.score,
                            canAskHint : data.data.canAskHint,
                            hint: data.data.hint,
                            receivedAt: data.data.sentAt,
                        };
                    } else if (data.type === 'CORRECT_ANSWER' || data.type === 'WRONG_ANSWER' || data.type === 'TIMEOUT') {
                        updatedPlayer.currentQuestion = null;
                        updatedPlayer.currentScore = prevPlayer.currentScore + (data.data.score || 0);
                    } else if (data.type === 'QUESTION_HINT') {
                        updatedPlayer.currentQuestion = {
                            ...prevPlayer.currentQuestion,
                            canAskHint: false,
                            hint: data.data.hint,
                        };
                    }
                    return updatedPlayer;
                });
            }
        }, joinToken);

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [isConnected, subscribe, joinToken]);

    useEffect(() => {
        if (!activeEvent) {
            if (prevEventRef.current) {
                const diff = (localPlayer?.currentScore || 0) - prevScoreRef.current;
                setScoreDiff(diff);
                if (prevEventRef.current.offer1) setFeedbackType('junction-chosen');
                else if (diff > 0) setFeedbackType('positive');
                else if (isSubmitting) setFeedbackType('negative');
                else setFeedbackType('timeout');
            } else {
                setFeedbackType('waiting');
            }
        }
        prevEventRef.current = activeEvent;
        prevScoreRef.current = localPlayer?.currentScore || 0;
    }, [activeEvent, localPlayer?.currentScore, isSubmitting]);

    useEffect(() => {
        if (localPlayer?.trackState === 'REGULAR' && prevTrackRef.current && prevTrackRef.current !== 'REGULAR' && prevTrackRef.current !== 'WAITING_FOR_CHOICE') {
            setIsJustReturned(true);
        }
        prevTrackRef.current = localPlayer?.trackState;
    }, [localPlayer?.trackState]);

    useEffect(() => {
        if (activeEvent) {
            setIsJustReturned(false);
            setIsSubmitting(false);
        }
    }, [activeEvent]);

    useEffect(() => {
        if (!activeEvent || activeEvent.questionRemainingTimeMillis == null) return;

        if (raceState.status !== 'IN_PROGRESS') {
            const frozenTime = lastQuestionTimeRef.current > 0
                ? lastQuestionTimeRef.current
                : activeEvent.questionRemainingTimeMillis;

            setQuestionTimeLeft(frozenTime);
            return;
        }

        const validOffset = isNaN(timeOffset) ? 0 : timeOffset;
        const serverEndTime = activeEvent.receivedAt + activeEvent.questionRemainingTimeMillis;

        const intervalId = setInterval(() => {
            const currentServerTime = Date.now() - validOffset;
            const remaining = Math.max(0, serverEndTime - currentServerTime);

            setQuestionTimeLeft(remaining);
            lastQuestionTimeRef.current = remaining;

            if (remaining <= 0) clearInterval(intervalId);
        }, 100);

        const initialServerTime = Date.now() - validOffset;
        const initialRemaining = Math.max(0, serverEndTime - initialServerTime);
        setQuestionTimeLeft(initialRemaining);
        lastQuestionTimeRef.current = initialRemaining;

        return () => clearInterval(intervalId);
    }, [activeEvent, timeOffset, raceState.status]);

    useEffect(() => {
        if (!raceState || raceState.remainingTimeMs == null) return;
        if (raceState.status !== 'IN_PROGRESS') {
            setGlobalTimeLeft(raceState.remainingTimeMs);
            return;
        }

        const validOffset = isNaN(timeOffset) ? 0 : timeOffset;
        const safeReceivedAt = raceState.receivedAt || (Date.now() - validOffset);
        const raceEndTime = safeReceivedAt + raceState.remainingTimeMs;

        const intervalId = setInterval(() => {
            const currentServerTime = Date.now() - validOffset;
            const remaining = Math.max(0, raceEndTime - currentServerTime);
            setGlobalTimeLeft(isNaN(remaining) ? 0 : remaining);
            if (remaining <= 0) clearInterval(intervalId);
        }, 100);

        const initialServerTime = Date.now() - validOffset;
        setGlobalTimeLeft(Math.max(0, raceEndTime - initialServerTime));

        return () => clearInterval(intervalId);
    }, [raceState.receivedAt, raceState.remainingTimeMs, raceState.status, timeOffset]);

    const [flipCount, setFlipCount] = useState(0);
    const [faces, setFaces] = useState({
        face0: {type: 'QUESTION', data: activeEvent, track: localPlayer?.trackState},
        face1: null
    });

    let targetType = 'FEEDBACK';
    if (activeEvent) targetType = 'QUESTION';
    else if (isJustReturned) targetType = 'RETURN_TRACK';

    const targetStateId = activeEvent ? `Q-${activeEvent.expression}` : (isJustReturned ? 'RETURN' : 'FEEDBACK');
    const [currentFaceId, setCurrentFaceId] = useState(targetStateId);

    useEffect(() => {
        if (targetStateId !== currentFaceId) {
            const nextFaceContent = {
                type: targetType,
                data: activeEvent,
                track: localPlayer?.trackState,
                totalQ: localPlayer?.totalTrackQuestions,
                currentQ: localPlayer?.totalTrackQuestions && localPlayer?.specialQuestionsRemaining ? (localPlayer.totalTrackQuestions - localPlayer.specialQuestionsRemaining + 1) : null
            };
            setFlipCount(c => c + 1);
            setFaces(prev => {
                if (flipCount % 2 === 0) return {...prev, face1: nextFaceContent};
                else return {...prev, face0: nextFaceContent};
            });
            setCurrentFaceId(targetStateId);
        }
    }, [targetStateId, targetType, activeEvent, localPlayer?.trackState, localPlayer?.totalTrackQuestions, localPlayer?.specialQuestionsRemaining, flipCount, currentFaceId]);

    if (!localPlayer) return <div>Loading player data...</div>;

    const isQuestionActive = targetType === 'QUESTION';
    const isJunctionView = !!activeEvent?.offer1;

    return (
        <>
            <RaceHeaderPlayer
                raceState={raceState}
                localPlayer={localPlayer}
                localTimeLeft={globalTimeLeft}
                onChangeNickname={onNicknameChange}
                onLeaveRace={onLeaveRace}
                messages={messages}
            />

            <div className="race-layout-container">
                <QuestionTimer
                    questionTimeLeft={questionTimeLeft}
                    totalTime={activeEvent?.timeLimitMillis}
                    isQuestionActive={isQuestionActive}
                />

                <RaceFlipCard
                    flipCount={flipCount}
                    faces={faces}
                    feedbackType={feedbackType}
                    scoreDiff={scoreDiff}
                    onHintClick={onHintClick}
                    canRequestHint={activeEvent?.canAskHint === true}
                    hasHintAlready={!!activeEvent?.hint}
                    isPaused={raceState.status !== 'IN_PROGRESS'}
                    onReportTemplate={onReportTemplate}
                />

                <QuestionHint
                    hintText={activeEvent?.hint}
                    isVisible={isQuestionActive && !!activeEvent?.hint}
                />

                <QuestionOptions
                    isQuestionActive={isQuestionActive}
                    isJunctionView={isJunctionView}
                    activeEvent={activeEvent}
                    isSubmitting={isSubmitting || raceState.status !== 'IN_PROGRESS'}
                    questionTimeLeft={questionTimeLeft}
                    onAnswer={(opt) => {
                        setIsSubmitting(true);
                        onAnswerQuestion(opt);
                    }}
                    onChooseJunction={(choice) => {
                        setIsSubmitting(true);
                        onChooseJunction(choice);
                    }}
                />
            </div>
        </>
    );
}

export default memo(RaceActivePlayer);