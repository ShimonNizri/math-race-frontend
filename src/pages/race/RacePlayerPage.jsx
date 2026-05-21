import {useLocation, useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {useWebSocket} from "../../services/webSocket/WebSocketContext.js";
import RaceLobby from "../../components/race/RaceLobby.jsx";
import RaceResults from "../../components/race/RaceResults.jsx";
import RaceActivePlayer from "../../components/race/RaceActivePlayer.jsx";
import {ClipLoader} from "react-spinners";
import TopAlertBanner from "../../components/ui/TopAlertBanner.jsx";
import DynamicModal from "../../components/ui/DynamicModal.jsx";
import {joinRace} from "../../services/raceService.js";

function RacePlayerPage() {
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

    const formatOtherPlayer = (player) => ({
        id: player.id,
        userName: player.userName,
        nickname: player.nickname,
        carColor: player.carColor,
        currentScore: player.currentScore,
        online: player.online
    });


    useEffect(() => {
        if (!isConnected || isSubscriptionBlocked) return;

        const queue = `/user/queue/race/feedback`;
        const topic = `/topic/race/${roomCode}/updates`;

        const unsubscribeTopic = subscribe(topic, (data) => {
                console.log("קיבלנו הודעה חדשה מהסוקט:", data);

                if (data.type === 'PLAYER_JOINED') {
                    setRaceState(prevState => {
                        if (!prevState) return null;

                        if (prevState.myAccount?.id === data.data.player.id ||
                            prevState.players.some(player => player.id === data.data.player.id)) {
                            return prevState;
                        }

                        return {
                            ...prevState,
                            players: [...prevState.players, formatOtherPlayer(data.data.player)]
                        };
                    });
                } else if (data.type === 'PLAYER_CONNECTION' || data.type === 'HOST_CONNECTION') {
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

                        if (prevState.myAccount?.id === data.data.id) {
                            return {
                                ...prevState,
                                myAccount: {
                                    ...prevState.myAccount,
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
                }else if (['RACE_START', 'RACE_PAUSED', 'RACE_RESUMED', 'RACE_CANCELLED'].includes(data.type)) {
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
                        console.log("מבקש סנכרון נתונים פרטי מהשרת...");
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
                                    onClick: () => {
                                        setModalConfig(null);
                                        navigate("/");
                                    }
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
                }
            }, activeJoinToken
        );

        const unsubscribeQueue = subscribe(queue, (data) => {
            if (data.type === 'RACE_FULL_STATE') {
                console.log("סנכרון מלא מהשרת:", data.data);
                setModalConfig(null);
                setIsReconnecting(false);
                setTimeOffset(Date.now() - data.data.sentAt);

                setTopAlert(prev => {
                    if (prev && prev.type === 'error') {
                        setTimeout(() => setTopAlert(null), 1500);
                        return { type: 'success', message: "החיבור חודש בהצלחה!", isLoading: false };
                    }
                    return null;
                });

                const myPlayer = data.data.players.find(p => p.id === data.data.yourAccountId);

                setRaceState({
                    name: data.data.name,
                    roomCode: data.data.roomCode,
                    targetScore: data.data.targetScore,
                    status: data.data.status,
                    totalDurationMillis: data.data.totalDurationMillis,
                    remainingTimeMs: data.data.remainingTimeMs,
                    receivedAt: data.data.sentAt,

                    myAccount: myPlayer ? {
                        id: myPlayer.id,
                        userName: myPlayer.userName,
                        nickname: myPlayer.nickname,
                        carColor: myPlayer.carColor,
                        currentScore: myPlayer.currentScore,
                        online: myPlayer.online,
                        trackState: myPlayer.trackState,

                        currentQuestion: myPlayer.currentQuestion ? {
                            expression: myPlayer.currentQuestion.expression,
                            options: myPlayer.currentQuestion.options,
                            timeLimitMillis: myPlayer.currentQuestion.timeLimitMillis,
                            questionRemainingTimeMillis: myPlayer.currentQuestion.questionRemainingTimeMillis,
                            score: myPlayer.currentQuestion.score,
                            receivedAt: myPlayer.currentQuestion.sentAt,
                        } : null,

                        currentJunction: myPlayer.currentJunction ? {
                            expression: myPlayer.currentJunction.expression,
                            offer1: myPlayer.currentJunction.offer1,
                            offer2: myPlayer.currentJunction.offer2,
                            timeLimitMillis: myPlayer.currentJunction.timeLimitMillis,
                            questionRemainingTimeMillis: myPlayer.currentJunction.questionRemainingTimeMillis,
                            receivedAt: myPlayer.currentJunction.sentAt,
                        } : null

                    } : null,

                    host: {
                        id: data.data.host.id,
                        userName: data.data.host.userName,
                        nickname: data.data.host.nickname,
                        online: data.data.host.online
                    },

                    players: data.data.players
                        .filter(player => player.id !== data.data.yourAccountId)
                        .map(formatOtherPlayer)
                });
            }
        },activeJoinToken,() => {
            console.log("מבקש סנכרון התחלתי בבטחה...");
            sendMessage(`/app/race/${roomCode}/player/sync`, {});
        });


        return () => {
            if (unsubscribeQueue) unsubscribeQueue();
            if (unsubscribeTopic) unsubscribeTopic();
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
            console.error("Takeover error:", error);
            alert("Network error while trying to reconnect.");
            setIsReconnecting(false);
        }
    };

    useEffect(() => {
        if (error) {
            console.log("הגיע", error);

            if (raceState?.status === 'FINISHED'){
                //אין צורך לטפל בשגיאות
            }else if (error === "Session closed."){
                setTopAlert({
                    type: 'error',
                    message: "החיבור אבד. מנסה להתחבר שוב...",
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
                } else if (error === "NOT_RACE_PLAYER") {
                showRedirectModal(
                    "Access denied",
                    "You are not a player in this race. You will be redirected to the homepage in 5 seconds..."
                );
                } else if (error === "PLAYER_KICKED") {
                    showRedirectModal(
                        "Removed from Race",
                        "You have been removed from this race by the host. You will be redirected to the homepage in 5 seconds..."
                    );
                }else if (error === "PLAYER_LEFT"){
                    showRedirectModal(
                        "Player left",
                        "You have chosen to leave the race. You will be redirected to the homepage in 5 seconds..."
                    );
                }else if (error === "DUPLICATE_RACE_CONNECTION") {
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

    const handleAnswerQuestion = (selectedAnswer) => {
        sendMessage(`/app/race/${roomCode}/player/submit`, {
            answer: selectedAnswer
        });
    };

    const handleChooseJunction = (selectedTrack) => {
        sendMessage(`/app/race/${roomCode}/player/junction/choose`, {
            choice: selectedTrack
        });
    };

    const handleLeaveRace = () => {
        sendMessage(`/app/race/${roomCode}/player/left`, {});
    };

    const handleNicknameChange = () => {
        sendMessage(`/app/race/${roomCode}/player/change-nickname`, {});
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
                return <RaceLobby raceState={raceState}  isHost={false} />;
            case 'PAUSED':
            case 'IN_PROGRESS':
                return <RaceActivePlayer raceState={raceState} joinToken={activeJoinToken} timeOffset={timeOffset}
                                         onAnswerQuestion={handleAnswerQuestion} onChooseJunction={handleChooseJunction}
                                         onNicknameChange ={handleNicknameChange} onLeaveRace = {handleLeaveRace}/>;
            case 'FINISHED':
                return <RaceResults raceState={raceState} currentPlayerId={raceState.myAccount.id} />;
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

export default RacePlayerPage;