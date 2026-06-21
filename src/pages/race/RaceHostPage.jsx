import React, { useEffect, useState } from "react";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import { useWebSocket } from "../../services/webSocket/WebSocketContext.js";
import RaceLobby from "../../components/race/RaceLobby";
import RaceResults from "../../components/race/RaceResults";
import RaceActiveHost from "../../components/race/RaceActiveHost.jsx";
import { ClipLoader } from "react-spinners";
import { joinRace } from "../../services/raceService.js";
import DynamicModal from "../../components/ui/DynamicModal.jsx";
import TopAlertBanner from "../../components/ui/TopAlertBanner.jsx";

function RaceHostPage() {
    const location = useLocation();
    const { roomCode } = useParams();
    const navigate = useNavigate();

    const { isConnected, reactivateConnection, error, clearError, sendMessage, subscribe } = useWebSocket();
    const [activeJoinToken, setActiveJoinToken] = useState(location.state?.joinToken || null);
    const [isSubscriptionBlocked, setIsSubscriptionBlocked] = useState(false);

    const [raceState, setRaceState] = useState(null);
    const [timeOffset, setTimeOffset] = useState(0);

    const [modalConfig, setModalConfig] = useState(null);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [topAlert, setTopAlert] = useState(null);

    const showRedirectModal = (title, message) => {
        setModalConfig({
            title: title,
            message: message,
            autoAction: {
                delayMs: 5000,
                action: () => {
                    setModalConfig(null);
                    navigate("/");
                }
            },
            buttons: [
                {
                    label: "Home",
                    styleType: "outline",
                    onClick: () => {
                        setModalConfig(null);
                        navigate("/");
                    }
                }
            ]
        });
    };

    const formatPlayer = (player) => ({
        id: player.id,
        nickname: player.nickname,
        currentScore: player.currentScore,
        online: player.online,
        userName: player.userName,
        carColor: player.carColor,
        trackState: player.trackState,

        currentQuestion: player.currentQuestion ? {
            id: player.currentQuestion.questionId,
            expression: player.currentQuestion.expression,
            options: player.currentQuestion.options,
            timeLimitMillis: player.currentQuestion.timeLimitMillis,
            questionRemainingTimeMillis: player.currentQuestion.questionRemainingTimeMillis,
            score: player.currentQuestion.score,
            canAskHint : player.currentQuestion.canAskHint,
            hint: player.currentQuestion.hint,
            receivedAt: player.currentQuestion.sentAt,
        } : null,

        currentJunction: player.currentJunction ? {
            expression: player.currentJunction.expression,
            offer1: player.currentJunction.offer1,
            offer2: player.currentJunction.offer2,
            timeLimitMillis: player.currentJunction.timeLimitMillis,
            questionRemainingTimeMillis: player.currentJunction.questionRemainingTimeMillis,
            receivedAt: player.currentJunction.sentAt,
        } : null
    });

    useEffect(() => {
        if (!isConnected || isSubscriptionBlocked) return;

        const queue = `/user/queue/race/host`;
        const topic = `/topic/race/${roomCode}/updates`;

        const unsubscribeTopic = subscribe(topic, (data) => {

            if (data.type === 'PLAYER_JOINED') {
                setRaceState(prevState => {
                    if (!prevState) return null;
                    const isPlayerExists = prevState.players.some(p => p.id === data.data.player.id);
                    if (isPlayerExists) return prevState;

                    return {
                        ...prevState,
                        players: [...prevState.players, formatPlayer(data.data.player)]
                    };
                });

            } else if (data.type === 'PLAYER_CONNECTION' || data.type === 'HOST_CONNECTION' || data.type === 'CHANGE_NICKNAME') {
                setRaceState(prevState => {
                    if (!prevState) return null;

                    if (prevState.host?.id === data.data.id) {
                        return {
                            ...prevState,
                            host: {
                                ...prevState.host,
                                online: data.data.online,
                                nickname: data.data.nickname
                            }
                        };
                    }

                    return {
                        ...prevState,
                        players: prevState.players.map(p =>
                            p.id === data.data.id ? {
                                ...p,
                                online: data.data.online,
                                nickname: data.data.nickname
                            } : p
                        )
                    };
                });

            } else if (data.type === 'PLAYER_KICKED' || data.type === 'PLAYER_LEFT') {
                setRaceState(prevState => {
                    if (!prevState) return null;
                    return {
                        ...prevState,
                        players: prevState.players.filter(p => p.id !== data.data.playerId)
                    };
                });
            } else if (['RACE_START', 'RACE_PAUSED', 'RACE_RESUMED', 'RACE_CANCELLED'].includes(data.type)) {
                setRaceState(prevState => {
                    if (!prevState) return null;
                    return {
                        ...prevState,
                        status: data.data.status,
                        remainingTimeMs: data.data.remainingTimeMs,
                        receivedAt: data.data.sentAt,
                    };
                });

                if (data.type === 'RACE_RESUMED') {
                    sendMessage(`/app/race/${roomCode}/host/sync`, {});
                }

                if (data.type === 'RACE_CANCELLED') {
                    setIsSubscriptionBlocked(true);
                    if (reactivateConnection)
                        reactivateConnection();

                    setModalConfig({
                        title: "Race Cancelled",
                        message: "המירוץ בוטל על ידי המנהל. תועבר לדף הבית בעוד 5 שניות...",
                        autoAction: {
                            delayMs: 5000,
                            action: () => {
                                setModalConfig(null);
                                navigate("/");
                            }
                        },
                        buttons: [
                            {
                                label: "Home",
                                styleType: "outline",
                                onClick: () => { setModalConfig(null); navigate("/"); }
                            }
                        ]
                    });
                }

            } else if (data.type === 'RACE_COMPLETED') {
                setIsSubscriptionBlocked(true);
                if (reactivateConnection)
                    reactivateConnection();

                setRaceState(prevState => {
                    if (!prevState) return null;
                    return {
                        ...prevState,
                        status: data.data.status,
                        players: data.data.players ? data.data.players.map(player => ({
                            id: player.id,
                            userName: player.userName,
                            nickname: player.nickname,
                            carColor: player.carColor,
                            currentScore: player.currentScore,
                            online: player.online,
                        })) : prevState.players,

                        statistics: data.data.statistics ? {
                            ...data.data.statistics
                        } : null
                    };
                });
            }else if (data.type === 'CHANGE_RACE_NAME') {
                setRaceState(prevState => {
                    if (!prevState) return null;
                    return {
                        ...prevState,
                        name:data.data.raceName,
                    }
                })
            }

        }, activeJoinToken);

        const unsubscribeQueue = subscribe(queue, (data) => {
            if (data.type === 'RACE_FULL_STATE') {
                setModalConfig(null);
                setIsReconnecting(false);
                setTimeOffset(Date.now() - data.data.sentAt);

                setTopAlert(prev => {
                    if (prev && prev.type === 'error') {
                        setTimeout(() => setTopAlert(null), 1500);
                        return { type: 'success', message: "The connection was successfully renewed!", isLoading: false };
                    }
                    return null;
                });

                setRaceState({
                    name: data.data.name,
                    roomCode: data.data.roomCode,
                    targetScore: data.data.targetScore,
                    status: data.data.status,
                    totalDurationMillis: data.data.totalDurationMillis,
                    remainingTimeMs: data.data.remainingTimeMs,
                    receivedAt: data.data.sentAt,
                    fullSyncTimestamp: Date.now(),
                    host: {
                        id: data.data.host.id,
                        userName : data.data.host.userName,
                        nickname: data.data.host.nickname,
                        online: data.data.host.online
                    },

                    players: data.data.players.map(formatPlayer),
                });
            }
        }, activeJoinToken,() => {
            sendMessage(`/app/race/${roomCode}/host/sync`, {});
        });

        return () => {
            if (unsubscribeTopic) unsubscribeTopic();
            if (unsubscribeQueue) unsubscribeQueue();
        };
    }, [isConnected, roomCode, sendMessage, subscribe, activeJoinToken, isSubscriptionBlocked, reactivateConnection, navigate]);

    const handleTakeover = async () => {
        setIsReconnecting(true);

        try {
            const response = await joinRace({ roomCode: roomCode, nickname: raceState?.host?.nickname || null });

            if (response.success) {
                const newToken = response.data.joinToken;

                setActiveJoinToken(newToken);
                setIsSubscriptionBlocked(false)

            } else {
                alert("Failed to takeover the connection.");
                setIsReconnecting(false);
            }
        } catch (error) {
            alert("Network error while trying to reconnect.");
            setIsReconnecting(false);
        }
    };

    useEffect(() => {
        if (error) {

            if (raceState?.status === 'FINISHED'){
                //אין צורך לטפל בשגיאות
            }else if (error === "Session closed."){
                setTopAlert({
                    type: 'error',
                    message: "Connection lost. Trying to reconnect...",
                    isLoading: true
                });
            } else {

                setIsSubscriptionBlocked(true);
                if (reactivateConnection)
                    reactivateConnection();

                if (error === "USER_NOT_IN_ANY_RACE" || error === "NOT_REGISTERED_FOR_RACE") {
                    showRedirectModal(
                        "Access denied",
                        "You are not registered for this race. You will be redirected to the homepage in 5 seconds..."
                    );
                } else if (error === "NOT_RACE_HOST") {
                    showRedirectModal(
                        "Access denied",
                        "You are not the host of this race. You will be redirected to the homepage in 5 seconds..."
                    );
                } else if (error === "DUPLICATE_RACE_CONNECTION") {
                    setModalConfig({
                        title: "Connected Elsewhere",
                        message: "Your account is currently active on another device or tab. Do you want to take over the connection and use it here?",
                        showLoading: false,
                        buttons: [
                            {
                                label: "Home",
                                styleType: "outline",
                                onClick: () => {
                                    setModalConfig(null);
                                    navigate("/");
                                }
                            },
                            {
                                label: "Use Here",
                                styleType: "primary",
                                onClick: () => handleTakeover()
                            }
                        ]
                    });
                }

            }

            clearError();
        }
    }, [error, navigate, clearError, raceState?.status, reactivateConnection]);

    const handleStartRace = () => {
        sendMessage(`/app/race/${roomCode}/host/start`, {});
    };

    const handleKickPlayer = (playerId) => {
        sendMessage(`/app/race/${roomCode}/host/kick`, {playerId: playerId});
    };

    const handleSendMessageToPlayer = (playerId,messageInput) => {
        sendMessage(`/app/race/${roomCode}/host/message-to-player`,
            {playerId: playerId, message: messageInput});
    };

    const handlePauseRace = () => {
        sendMessage(`/app/race/${roomCode}/host/pause`, {});
    };

    const handleResumeRace = () => {
        sendMessage(`/app/race/${roomCode}/host/resume`, {});
    };

    const handleCancelRace = () => {
        sendMessage(`/app/race/${roomCode}/host/cancel`, {});
    };

    const handleChangeNickname = (nickname) => {
        sendMessage(`/app/race/${roomCode}/host/change-nickname`, {
            nickname : nickname
        });
    };

    const handleChangeRaceName = (name) => {
        sendMessage(`/app/race/${roomCode}/host/change-race-name`, {
            raceName : name
        });
    };

    const renderRaceContent = () => {
        if (!raceState) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
                    <ClipLoader />
                    <p>Loading race data...</p>
                </div>
            );
        }

        switch (raceState.status) {
            case 'PENDING':
                return <RaceLobby raceState={raceState} onStartRace={handleStartRace} isHost={true}
                                  onKickPlayer ={handleKickPlayer} onCancelRace={handleCancelRace}
                                  onChangeRaceName = {handleChangeRaceName} onChangeNickname = {handleChangeNickname}
                />;
            case 'PAUSED':
            case 'IN_PROGRESS':
                return (
                    <RaceActiveHost
                        raceState={raceState}
                        joinToken={activeJoinToken}
                        timeOffset={timeOffset}
                        onKickPlayer={handleKickPlayer}
                        onSendMessageToPlayer={handleSendMessageToPlayer}
                        onPauseRace={handlePauseRace}
                        onResumeRace={handleResumeRace}
                        onCancelRace={handleCancelRace}
                        onChangeNickname={handleChangeNickname}
                        onChangeRaceName={handleChangeRaceName}
                    />
                );
            case 'FINISHED':
                return <RaceResults raceState={raceState} />;
            default:
                return <div>Invalid race status: {raceState.status}</div>;
        }
    };

    return (
        <div style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>

            {renderRaceContent()}

            <TopAlertBanner alertConfig={topAlert} />

            <DynamicModal
                config={modalConfig}
                isProcessing={isReconnecting}
            />
        </div>
    );
}

export default RaceHostPage;