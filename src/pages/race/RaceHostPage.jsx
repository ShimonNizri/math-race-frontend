import React, { useEffect, useState } from "react";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import { useWebSocket } from "../../services/webSocket/WebSocketContext.js";
import RaceLobby from "../../components/race/RaceLobby";
import RaceResults from "../../components/race/RaceResults";
import RaceActiveHost from "../../components/race/RaceActiveHost.jsx";
import { ClipLoader } from "react-spinners";
import {joinRace} from "../../services/raceService.js";

function RaceHostPage() {
    const location = useLocation();
    const { roomCode } = useParams();
    const navigate = useNavigate();

    const { isConnected, reactivateConnection,error, clearError, sendMessage, subscribe } = useWebSocket();
    const [activeJoinToken, setActiveJoinToken] = useState(location.state?.joinToken || null);
    const [isSubscriptionBlocked, setIsSubscriptionBlocked] = useState(false);

    const [raceState, setRaceState] = useState(null);

    const [modalConfig, setModalConfig] = useState(null);
    const [isReconnecting, setIsReconnecting] = useState(false);

    const formatPlayer = (player) => ({
        id: player.id,
        nickname: player.nickname,
        currentScore: player.currentScore,
        online: player.online,
        userName: player.userName,
        carColor: player.carColor,
        trackState: player.trackState,

        currentQuestion: player.currentQuestion ? {
            expression: player.currentQuestion.expression,
            options: player.currentQuestion.options,
            timeLimitMillis: player.currentQuestion.timeLimitMillis,
            questionRemainingTimeMillis: player.currentQuestion.questionRemainingTimeMillis,
            score: player.currentQuestion.score
        } : null,

        currentJunction: player.currentJunction ? {
            expression: player.currentJunction.expression,
            offer1: player.currentJunction.offer1,
            offer2: player.currentJunction.offer2,
            timeLimitMillis: player.currentJunction.timeLimitMillis,
            questionRemainingTimeMillis: player.currentJunction.questionRemainingTimeMillis
        } : null
    });



    useEffect(() => {
        if (!isConnected || isSubscriptionBlocked) return;

        const queue = `/user/queue/race/host`;
        const topic = `/topic/race/${roomCode}/updates`;

        const unsubscribeTopic = subscribe(topic, (data) => {
            console.log("קיבלנו הודעת Topic (באבא):", data);

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

            } else if (data.type === 'PLAYER_CONNECTION' || data.type === 'HOST_CONNECTION') {
                setRaceState(prevState => {
                    if (!prevState) return null;

                    // תיקון חריגה 2: טיפול מלא במנהל כולל שינוי שם אם קרה
                    if (data.type === 'HOST_CONNECTION' && prevState.host.id === data.data.id) {
                        return {
                            ...prevState,
                            host: {
                                ...prevState.host,
                                online: data.data.online,
                                nickname: data.data.nickname || prevState.host.nickname
                            }
                        };
                    }

                    // טיפול בשחקנים
                    return {
                        ...prevState,
                        players: prevState.players.map(p =>
                            p.id === data.data.id ? {
                                ...p,
                                online: data.data.online,
                                nickname: data.data.nickname || p.nickname
                            } : p
                        )
                    };
                });

            } else if (data.type === 'PLAYER_KICKED') {
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
                        status: data.data.status, // ENUM
                        remainingTimeMs: data.data.remainingTimeMs, // עודכן: מסנכרן את הזמן שנותר מהשרת
                        receivedAt: Date.now()

                    };
                });

                if (data.type === 'RACE_RESUMED') {
                    console.log("מבקש סנכרון נתונים פרטי מהשרת...");
                    sendMessage(`/app/race/${roomCode}/host/sync`, {});
                }

            } else if (data.type === 'RACE_COMPLETED') {
                setRaceState(prevState => {
                    if (!prevState) return null;
                    return {
                        ...prevState,
                        status: data.data.status, // ENUM: 'FINISHED'

                        // מיפוי רשימת השחקנים (PlayerProgressDTO)
                        players: data.data.players ? data.data.players.map(player => ({
                            id: player.id,
                            userName: player.userName,
                            nickname: player.nickname,
                            carColor: player.carColor,
                            currentScore: player.currentScore,
                            online: player.isOnline !== undefined ? player.isOnline : player.online, // Jackson serializes 'isOnline' usually as 'online'
                            trackState: player.trackState,

                            currentQuestion: player.currentQuestion ? {
                                expression: player.currentQuestion.expression,
                                options: player.currentQuestion.options,
                                timeLimitMillis: player.currentQuestion.timeLimitMillis,
                                questionRemainingTimeMillis: player.currentQuestion.questionRemainingTimeMillis,
                                score: player.currentQuestion.score,
                                receivedAt: Date.now()
                            } : null,

                            currentJunction: player.currentJunction ? {
                                expression: player.currentJunction.expression,
                                offer1: player.currentJunction.offer1,
                                offer2: player.currentJunction.offer2,
                                timeLimitMillis: player.currentJunction.timeLimitMillis,
                                questionRemainingTimeMillis: player.currentJunction.questionRemainingTimeMillis,
                                receivedAt: Date.now()
                            } : null
                        })) : prevState.players,

                        // מיפוי הסטטיסטיקות (RaceStatisticsDTO)
                        statistics: data.data.statistics ? {
                            accuracyPercentage: data.data.statistics.accuracyPercentage,
                            autostradaPercentage: data.data.statistics.autostradaPercentage,
                            dirtRoadPercentage: data.data.statistics.dirtRoadPercentage,
                            averageResponseTimeMs: data.data.statistics.averageResponseTimeMs,
                            totalJunctionsOffered: data.data.statistics.totalJunctionsOffered,

                            streakMasterId: data.data.statistics.streakMasterId,
                            streakMasterAmount: data.data.statistics.streakMasterAmount,

                            accuracyKingId: data.data.statistics.accuracyKingId,
                            accuracyKingPercentage: data.data.statistics.accuracyKingPercentage,

                            speedDemonId: data.data.statistics.speedDemonId,
                            speedDemonTimeMs: data.data.statistics.speedDemonTimeMs
                        } : null
                    };
                });
            }
        }, activeJoinToken);

        // האזנה לערוץ הפרטי - רק עבור הסנכרון ההתחלתי של המנהל
        const unsubscribeQueue = subscribe(queue, (data) => {
            if (data.type === 'RACE_FULL_STATE') {
                console.log("סנכרון מלא מהשרת:", data.data);
                setModalConfig(null);
                setIsReconnecting(false);

                setRaceState({
                    // שדות מתוך RaceStateDTO
                    name: data.data.name,
                    roomCode: data.data.roomCode,
                    targetScore: data.data.targetScore,
                    status: data.data.status, // ENUM: 'PENDING', 'IN_PROGRESS', 'PAUSED', 'FINISHED', 'CANCELLED'
                    totalDurationMillis: data.data.totalDurationMillis,
                    remainingTimeMs: data.data.remainingTimeMs,
                    receivedAt: Date.now(),

                    // מיפוי אובייקט ה-HostDetailsDTO
                    host: {
                        id: data.data.host.id,
                        userName : data.data.host.userName,
                        nickname: data.data.host.nickname,
                        online: data.data.host.online // BOL: true / false
                    },

                    // מיפוי רשימת ה-PlayerProgressDTO
                    players: data.data.players.map(player => ({
                        id: player.id,
                        userName: player.userName,
                        nickname: player.nickname,
                        carColor: player.carColor,
                        currentScore: player.currentScore,
                        online: player.online, // BOL: true / false
                        trackState: player.trackState, // ENUM: 'REGULAR', 'WAITING_FOR_CHOICE', 'AUTOSTRADA', 'DIRT_ROAD'

                        currentQuestion: player.currentQuestion ? {
                            expression: player.currentQuestion.expression,
                            options: player.currentQuestion.options, // Array of Strings
                            timeLimitMillis: player.currentQuestion.timeLimitMillis,
                            questionRemainingTimeMillis: player.currentQuestion.questionRemainingTimeMillis,
                            score: player.currentQuestion.score,
                            receivedAt: Date.now()
                        } : null,

                        currentJunction: player.currentJunction ? {
                            expression: player.currentJunction.expression,
                            offer1: player.currentJunction.offer1,
                            offer2: player.currentJunction.offer2,
                            timeLimitMillis: player.currentJunction.timeLimitMillis,
                            questionRemainingTimeMillis: player.currentJunction.questionRemainingTimeMillis,
                            receivedAt: Date.now()
                        } : null
                    }))
                });
            }
        }, activeJoinToken,() => {
            console.log("מבקש סנכרון התחלתי בבטחה...");
            sendMessage(`/app/race/${roomCode}/host/sync`, {});
        });

        //if (!hasSynced.current) {
        //    sendMessage(`/app/race/${roomCode}/host/sync`, {});
        //    hasSynced.current = true;
        //}

        return () => {
            if (unsubscribeTopic) unsubscribeTopic();
            if (unsubscribeQueue) unsubscribeQueue();
        };
    }, [isConnected, roomCode, sendMessage, subscribe, activeJoinToken,isSubscriptionBlocked]);

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
            setIsSubscriptionBlocked(true);
            if (reactivateConnection)
                reactivateConnection();
            
            if (error === "USER_NOT_IN_ANY_RACE" || error === "NOT_REGISTERED_FOR_RACE") {
                setModalConfig({
                    title: "Access denied",
                    message: "You are not registered for this race. You will be redirected to the homepage in 5 seconds...",
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
            } else if (error === "DUPLICATE_RACE_CONNECTION") {

                setModalConfig({
                    title: "Connected Elsewhere",
                    message: "Your account is currently active on another device or tab. Do you want to take over the connection and use it here?",
                    showLoading: false, // לא מציגים ספינר בהתחלה
                    buttons: [
                        {
                            label: "Home",
                            styleType: "outline",
                            onClick: () => { setModalConfig(null); navigate("/"); }
                        },
                        {
                            label: "Use Here", // הכפתור שמפעיל את החיבור מחדש
                            styleType: "primary",
                            onClick: () => handleTakeover()
                        }
                    ]
                });
            }

            clearError();
        }
    }, [error, navigate, clearError]);

    useEffect(() => {
        if (!modalConfig?.autoAction) return;

        const timer = setTimeout(() => {
            modalConfig.autoAction.action();
        }, modalConfig.autoAction.delayMs);

        return () => clearTimeout(timer);
    }, [modalConfig]);

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
                return <RaceLobby raceState={raceState} onStartRace={handleStartRace} isHost={true} />;
            case 'PAUSED':
            case 'IN_PROGRESS':
                return (
                    <RaceActiveHost
                        raceState={raceState}
                        setRaceState={setRaceState}
                        roomCode={roomCode}
                        joinToken={activeJoinToken}
                        onKickPlayer={handleKickPlayer}
                        onSendMessageToPlayer={handleSendMessageToPlayer}
                        onPauseRace={handlePauseRace}
                        onResumeRace={handleResumeRace}
                        onCancelRace={handleCancelRace}
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

            {/* תוכן המרוץ */}
            {renderRaceContent()}

            {/* המודל הדינמי */}
            {modalConfig && (
                <div style={overlayStyle}>
                    <div style={modalStyle}>
                        <h2 style={{ marginTop: 0, fontSize: '2rem', marginBottom: '10px' }}>
                            {modalConfig.title}
                        </h2>
                        <p style={{ fontSize: '1.2rem', marginBottom: '30px', opacity: 0.9, textAlign: 'center' }}>
                            {modalConfig.message}
                        </p>

                        {/* רינדור כפתורים אם קיימים */}
                        {modalConfig.buttons && modalConfig.buttons.length > 0 && (
                            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                {modalConfig.buttons.map((btn, index) => (
                                    <button
                                        key={index}
                                        onClick={btn.onClick}
                                        disabled={isReconnecting}
                                        style={{
                                            ...(buttonStyles[btn.styleType] || buttonStyles.primary),
                                            opacity: isReconnecting ? 0.7 : 1
                                        }}
                                    >
                                        {isReconnecting && btn.styleType === "primary" ? "Loading..." : btn.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {(!modalConfig.buttons || modalConfig.buttons.length === 0 || modalConfig.showLoading) && (
                            <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <ClipLoader size={40} color="#ffffff" speedMultiplier={0.8} />
                                {modalConfig.showLoading && (
                                    <span style={{ marginTop: '15px', fontSize: '1rem', opacity: 0.9, fontWeight: 'bold' }}>
                                        Auto-reconnecting...
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const overlayStyle = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
};

const modalStyle = {
    backgroundColor: '#dc3545',
    color: '#ffffff',

    fontFamily: "'Rubik', 'Heebo', 'Assistant', 'Segoe UI', Tahoma, sans-serif",

    minHeight: '25vh',
    width: '50vw',
    minWidth: '320px',
    maxWidth: '800px',

    borderRadius: '24px',
    border: '4px solid #ffffff',

    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 30px',
    boxSizing: 'border-box',
    boxShadow: '0 20px 50px rgba(0,0,0,0.4)'
};

const baseButtonStyle = {
    padding: '12px 30px',
    borderRadius: '50px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
    border: 'none',
    fontFamily: "inherit",
    transition: 'all 0.3s ease'
};

const buttonStyles = {
    primary: {
        ...baseButtonStyle,
        backgroundColor: '#ffffff',
        color: '#dc3545', // טקסט אדום על כפתור לבן
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
    },
    outline: {
        ...baseButtonStyle,
        backgroundColor: 'transparent',
        color: '#ffffff',
        border: '2px solid #ffffff'
    }
};
export default RaceHostPage;