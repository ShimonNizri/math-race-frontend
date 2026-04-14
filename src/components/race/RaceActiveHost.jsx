import React, { useEffect, memo } from 'react';
import { useWebSocket } from "../../services/webSocket/WebSocketContext.js";

const PlayerRow = memo(({ player, targetScore }) => {
    const progress = Math.min((player.currentScore / targetScore) * 100, 100);

    return (
        <div>
            <div>
                <strong>{player.nickname}</strong>
                <span>{player.currentScore} points</span>
                {/* אפשר להציג כאן אינדיקציה אם השחקן אופליין */}
                {!player.online && <span style={{ color: 'red', marginLeft: '10px' }}>(Offline)</span>}
            </div>
            <div>
                <div style={{ width: `${progress}%`, backgroundColor: 'blue', height: '10px' }}></div>
            </div>
        </div>
    );
});

function RaceActiveHost({ raceState, setRaceState, roomCode, joinToken }) {
    const { isConnected, subscribe } = useWebSocket();

    useEffect(() => {
        if (!isConnected) return;

        const queue = `/user/queue/race/host`;

        const unsubscribe = subscribe(queue, (data) => {
            console.log("קיבלנו עדכון זמן-אמת (בילד):", data);

            if (['PLAYER_ANSWERED_CORRECTLY', 'PLAYER_ANSWERED_INCORRECTLY', 'PLAYER_TIMEOUT'].includes(data.type)) {
                setRaceState(prevState => {
                    if (!prevState) return null;
                    return {
                        ...prevState,
                        players: prevState.players.map(p =>
                            p.id === data.data.playerId ? {
                                ...p,
                                currentScore: p.currentScore + data.data.score,
                            } : p
                        )
                    };
                });
            }
        }, joinToken);

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [isConnected, roomCode, subscribe, joinToken, setRaceState]);

    return (
        <div>
            <header>
                <h1>{raceState.name} - The Race is On!</h1>
                <h3>Target Score to Win: {raceState.targetScore}</h3>
            </header>

            <div>
                {raceState.players.map(player => (
                    <PlayerRow
                        key={player.id}
                        player={player}
                        targetScore={raceState.targetScore}
                    />
                ))}
            </div>
        </div>
    );
}

export default RaceActiveHost;