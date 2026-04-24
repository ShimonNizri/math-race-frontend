import {useLocation, useNavigate, useParams} from "react-router-dom";
import {useEffect, useRef, useState} from "react";
import {useWebSocket} from "../../services/webSocket/WebSocketContext.js";
import RaceLobby from "../../components/race/RaceLobby.jsx";
import RaceResults from "../../components/race/RaceResults.jsx";
import RaceActivePlayer from "../../components/race/RaceActivePlayer.jsx";
import {ClipLoader} from "react-spinners";

function RacePlayerPage() {
    const location = useLocation();
    const joinToken = location.state?.joinToken || null;
    const { roomCode } = useParams();
    const [accountId, setAccountId] = useState(null);

    const navigate = useNavigate();
    const { isConnected, lastMessage,clearLastMessage, sendMessage, subscribe} = useWebSocket();
    const [raceState, setRaceState] = useState(null);
    const hasSynced = useRef(false);


    useEffect(() => {
        const queue = `/user/queue/race/feedback`;

        const unsubscribeQueue = subscribe(queue, (data) => {
                console.log("קיבלנו הודעה חדשה מהסוקט:", data);
                if (data.type === 'RACE_FULL_STATE') {
                    setAccountId(data.data.players.at(-1).id);
                    setRaceState(data.data);
                } else if (data.type === 'JUNCTION_OFFERED') {
                // השחקן קיבל הצעת צומת!
                setRaceState(prevState => {
                    if (!prevState) return null;
                    return {
                        ...prevState,
                        players: prevState.players.map(player => {
                            if (player.id === accountId) {
                                return {
                                    ...player,
                                    currentQuestion: null, // מוודאים שאין שאלה
                                    currentJunctionOffer: data.data, // שומרים את ההצעה!
                                    trackState: data.data.state,
                                };
                            }
                            return player;
                        })
                    };
                });
            } else if (data.type === 'JUNCTION_CHOOSE' || data.type === 'JUNCTION_TIMEOUT') {
                // השחקן סיים לבחור (או שנגמר הזמן)
                setRaceState(prevState => {
                    if (!prevState) return null;
                    return {
                        ...prevState,
                        players: prevState.players.map(player => {
                            if (player.id === accountId) {
                                return {
                                    ...player,
                                    currentJunctionOffer: null, // מנקים את ההצעה
                                    trackState: data.data.state, // מעדכנים את המסלול החדש (אופציונלי, אבל מומלץ לתצוגה)
                                    totalTrackQuestions: data.data.totalTrackQuestions,
                                };
                            }
                            return player;
                        })
                    };
                });
            } else if (data.type === 'TRACK_STATE_CHANGED') {
                // השרת הודיע שחזרנו למסלול הרגיל (או עברנו מסלול)
                setRaceState(prevState => {
                    if (!prevState) return null;
                    return {
                        ...prevState,
                        players: prevState.players.map(player => {
                            if (player.id === accountId) {
                                return {
                                    ...player,
                                    trackState: data.data.state,
                                    totalTrackQuestions: data.data.totalTrackQuestions,
                                };
                            }
                            return player;
                        })
                    };
                });
            } else if (data.type === 'NEW_QUESTION') {
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

        if (!hasSynced.current) {
            sendMessage(`/app/race/${roomCode}/player/sync`, {});
            hasSynced.current = true;
        }


        return () => {
            if (unsubscribeQueue){
                unsubscribeQueue();
            }
            if (unsubscribeTopic){
                unsubscribeTopic();
            }

            hasSynced.current = false;
        };

    }, [isConnected, roomCode, sendMessage, subscribe, joinToken, accountId]);

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
            return <RaceActivePlayer raceState={raceState} accountId={accountId} onAnswerQuestion={handleAnswerQuestion} onChooseJunction={handleChooseJunction}/>;
        case 'FINISHED':
            return <RaceResults raceState={raceState} currentPlayerId={accountId} />;
        default:
            return <div>Invalid race status: {raceState.status}</div>;    }
}

export default RacePlayerPage;