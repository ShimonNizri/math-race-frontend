import {useLocation, useNavigate, useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {useWebSocket} from "../../services/webSocket/WebSocketContext.js";
import RaceLobby from "../../components/race/RaceLobby.jsx";
import RaceResults from "../../components/race/RaceResults.jsx";
import RaceActivePlayer from "../../components/race/RaceActivePlayer.jsx";
import {ClipLoader} from "react-spinners";

function RacePlayerPage() {
    const location = useLocation();
    const { roomCode } = useParams();
    const navigate = useNavigate();

    const { isConnected, reactivateConnection, error, clearError, sendMessage, subscribe } = useWebSocket();
    const [activeJoinToken, setActiveJoinToken] = useState(location.state?.joinToken || null);
    const [isSubscriptionBlocked, setIsSubscriptionBlocked] = useState(false);

    const [raceState, setRaceState] = useState(null);

    const [modalConfig, setModalConfig] = useState(null);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [topAlert, setTopAlert] = useState(null);


    useEffect(() => {
        if (!isConnected || isSubscriptionBlocked) return;

        const queue = `/user/queue/race/feedback`;
        const topic = `/topic/race/${roomCode}/updates`;

        const unsubscribeTopic = subscribe(topic, (data) => {
                console.log("קיבלנו הודעה חדשה מהסוקט:", data);

                if (data.type === 'PLAYER_JOINED') {
                    setRaceState(prevState => {
                        if (!prevState) return null;

                        const isPlayerExists = prevState.players.some(player => player.id === data.data.player.id);

                        if (isPlayerExists) {
                            return prevState;
                        }

                        return {
                            ...prevState,
                            players: [...prevState.players, data.data.player]
                        };
                    });
                } else if (data.type === 'PLAYER_CONNECTION') {
                    setRaceState(prevState => {
                        if (!prevState) return null;
                        return {
                            ...prevState,
                            players: prevState.players.map(p =>
                                p.id === data.data.id ? {
                                    ...p,
                                    online: data.data.online,
                                    nickname : data.data.nickname
                                } : p
                            )
                        };
                    });
                } else if (data.type === 'HOST_CONNECTION') {
                    setRaceState(prevState => {
                        if (!prevState) return null;
                        return {
                            ...prevState,
                            host : {
                                ...prevState.host,
                                online: data.data.online,
                                nickname: data.data.nickname
                            }
                        };
                    });
                } else if (data.type === 'RACE_START' || data.type === 'RACE_PAUSED' || data.type === 'RACE_RESUMED' ||
                    data.type === 'RACE_CANCELLED') {
                    setRaceState(prevState => {
                        if (!prevState) return null;
                        return {
                            ...prevState,
                            status: data.data.status
                        }
                    })
                } else if (data.type === 'RACE_COMPLETED'){
                    setRaceState(prevState => {
                        if (!prevState) return null;
                        return {
                            ...prevState,
                            status: data.data.status,
                            players: data.data.players
                        }
                    })
                }

            }, activeJoinToken
        );

        const unsubscribeQueue = subscribe(queue, (data) => {
            console.log("קיבלנו הודעה חדשה מהסוקט:", data);
            if (data.type === 'RACE_FULL_STATE') {

                const myPlayer = data.data.players.find(p => p.id === data.data.yourAccountId);

                setRaceState({
                    name: data.data.name,
                    roomCode: data.data.roomCode,
                    targetScore: data.data.targetScore,
                    status: data.data.status,
                    totalDurationMillis: data.data.totalDurationMillis,
                    remainingTimeMs: data.data.remainingTimeMs,
                    receivedAt: Date.now(),

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
                            receivedAt: Date.now()
                        } : null,

                        currentJunction: myPlayer.currentJunction ? {
                            expression: myPlayer.currentJunction.expression,
                            offer1: myPlayer.currentJunction.offer1,
                            offer2: myPlayer.currentJunction.offer2,
                            timeLimitMillis: myPlayer.currentJunction.timeLimitMillis,
                            questionRemainingTimeMillis: myPlayer.currentJunction.questionRemainingTimeMillis,
                            receivedAt: Date.now()
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
                        .map(player => ({
                            id: player.id,
                            userName: player.userName,
                            nickname: player.nickname,
                            carColor: player.carColor,
                            currentScore: player.currentScore,
                            online: player.online,
                        }))
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
    }, [isConnected, roomCode, sendMessage, subscribe, activeJoinToken]);

    useEffect(() => {
        if (lastMessage) {
            alert(lastMessage.type);
            clearLastMessage();
            navigate("/")
        }

    },[lastMessage,navigate,clearLastMessage]);

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

    if (!raceState) {
        return (
            <div>
                <ClipLoader/>
                <p>Loading race data...</p>
            </div>
        );
    }

    switch (raceState.status) {
        case 'PENDING':
            return <RaceLobby raceState={raceState}  isHost={false} />;
        case 'PAUSED':
        case 'IN_PROGRESS':
            return <RaceActivePlayer raceState={raceState} accountId={raceState.myAccount.id} onAnswerQuestion={handleAnswerQuestion} onChooseJunction={handleChooseJunction}/>;
        case 'FINISHED':
            return <RaceResults raceState={raceState} currentPlayerId={raceState.myAccount.id} />;
        default:
            return <div>Invalid race status: {raceState.status}</div>;    }
}

export default RacePlayerPage;