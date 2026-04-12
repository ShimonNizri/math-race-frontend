import {useNavigate} from "react-router-dom";
import {useWebSocket} from "../../services/webSocket/WebSocketContext.js";
import {useEffect, useRef, useState} from "react";
import RaceLobby from "../../components/race/RaceLobby";
import RaceResults from "../../components/race/RaceResults";
import RaceActiveHost from "../../components/race/RaceActiveHost.jsx";
import {ClipLoader} from "react-spinners";

function RaceHostPage({roomCode, joinToken}) {
    const navigate = useNavigate();
    const {isConnected, lastMessage, clearLastMessage, sendMessage, subscribe} = useWebSocket();
    const [raceState, setRaceState] = useState(null);
    const hasSynced = useRef(false);

    useEffect(() => {
        const queue = `/user/queue/race/host`;

        const unsubscribe = subscribe(queue, (data) => {
            console.log("קיבלנו הודעה חדשה מהסוקט:", data);
            if (data.type === 'RACE_FULL_STATE') {
                setRaceState(data.data);
            } else if (data.type === 'PLAYER_JOINED') {
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
                                nickname: data.data.nickname
                            } : p
                        )
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
            } else if (data.type === 'RACE_COMPLETED') {
                setRaceState(prevState => {
                    if (!prevState) return null;
                    return {
                        ...prevState,
                        status: data.data.status,
                        players: data.data.players
                    }
                })
            } else if (data.type === 'PLAYER_ANSWERED_CORRECTLY' || data.type === 'PLAYER_ANSWERED_INCORRECTLY' || data.type === 'PLAYER_TIMEOUT') {
                setRaceState(prevState => {
                    if (!prevState) return null;
                    return {
                        ...prevState,
                        players: prevState.players.map(p =>
                            p.id === data.data.playerId ? {
                                ...p,
                                currentScore: p.currentScore + data.data.score,
                            } : p)
                    };
                });
            }
        }, joinToken);

        if (!hasSynced.current) {
            sendMessage(`/app/race/${roomCode}/host/sync`, {});
        }

        return () => {
            if (unsubscribe) unsubscribe();
            hasSynced.current = false;
        };
    }, [isConnected, roomCode, sendMessage, subscribe, joinToken]);

    useEffect(() => {
        if (lastMessage) {
            setTimeout(() => {
                alert(lastMessage.type);
                console.log(lastMessage.type);
                clearLastMessage();
                navigate("/");
            }, 50);
        }
    }, [lastMessage, navigate, clearLastMessage]);

    const handleStartRace = () => {
        sendMessage(`/app/race/${roomCode}/host/start`, {});
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
            return <RaceLobby raceState={raceState} onStartRace={handleStartRace} isHost={true}/>;
        case 'PAUSED':
        case 'IN_PROGRESS':
            return <RaceActiveHost raceState={raceState}/>;
        case 'FINISHED':
            return <RaceResults players={raceState.players}/>;
        default:
            return <div>Invalid race status: {raceState.status}</div>;
    }
}

export default RaceHostPage;