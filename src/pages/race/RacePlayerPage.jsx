import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {useWebSocket} from "../../services/webSocket/WebSocketContext.js";
import RaceLobby from "../../components/race/RaceLobby.jsx";
import RaceActiveHost from "../../components/race/RaceActiveHost.jsx";
import RaceResults from "../../components/race/RaceResults.jsx";
import RaceActivePlayer from "../../components/race/RaceActivePlayer.jsx";

function RacePlayerPage({ roomCode, joinToken, accountId }) {
    const navigate = useNavigate();
    const { isConnected, lastMessage,clearLastMessage, sendMessage, subscribe} = useWebSocket();
    const [raceState, setRaceState] = useState(null);


    useEffect(() => {
        // צריך בקשה לשלוח את כל הנתונים כל המירוץ קודם כל
        const queue = `/user/queue/race/feedback`;

        const unsubscribeQueue = subscribe(queue, (data) => {
                console.log("קיבלנו הודעה חדשה מהסוקט:", data);
                if (data.type === 'RACE_FULL_STATE') {
                    setRaceState(data.data);
                }else if (data.type === 'NEW_QUESTION') {
                    setRaceState(prevState => {
                        if (!prevState) return null;
                        return {
                            ...prevState,
                            players: prevState.players.map(player => {
                                if (player.id === accountId) {
                                    return {
                                        ...player,
                                        currentQuestion: data.data
                                    };
                                }
                                return player;
                            })
                        };
                    });
                }else if (data.type === 'CORRECT_ANSWER' || data.type === 'WRONG_ANSWER' || data.type === 'TIMEOUT') {
                    setRaceState(prevState => {
                        if (!prevState) return null;
                        return {
                            ...prevState,
                            players: prevState.players.map(player => {
                                if (player.id === accountId) {
                                    return {
                                        ...player,
                                        currentQuestion: null,
                                        currentScore: player.currentScore + data.data.score
                                    };
                                }
                                return player;
                            })
                        };
                    });
                }else if (data.type === 'ERROR') {
                    alert(data.content);
                }
            }
        );

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

            }, joinToken
        );

        sendMessage(`/app/race/${roomCode}/player/sync`, {});

        return () => {
            if (unsubscribeQueue){
                unsubscribeQueue();
            }
            if (unsubscribeTopic){
                unsubscribeTopic();
            }
        };

    }, [isConnected, roomCode, sendMessage, subscribe,joinToken]);

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

    if (!raceState) return <div>טוען נתוני מרוץ...</div>;

    switch (raceState.status) {
        case 'PENDING':
            return <RaceLobby raceState={raceState}  isHost={false} />;
        case 'PAUSED':
        case 'IN_PROGRESS':
            return <RaceActivePlayer raceState={raceState} accountId={accountId} onAnswerQuestion={handleAnswerQuestion}/>;
        case 'FINISHED':
            return <RaceResults players={raceState.players} />;
        default:
            return <div>סטטוס מירוץ לא חוקי: {raceState.status}</div>;
    }
}

export default RacePlayerPage;