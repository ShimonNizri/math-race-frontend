import React, {memo} from 'react';
import Card from "../ui/Card.jsx";

import './RaceLobby.css';

const RaceHeader = memo(({name, roomCode}) => {
    return (
        <header>
            <h1>{name}</h1>
            <p>Invite players to join using the code:</p>
            <div className="room-code-display">
                {roomCode}
            </div>
        </header>
    );
});

const PlayerCard = memo(({player}) => {
    const isOnline = player.online;

    return (
        <div className="player-badge">
            <span className="player-name">{player.nickname}</span>
            <div className={`status-dot ${isOnline ? 'online' : 'offline'}`}></div>
        </div>
    );
});

function RaceLobby({raceState, onStartRace, isHost}) {
    return (
        <div className={`lobby-wrapper ${isHost ? 'is-host' : ''}`}>
            <Card className="game-card-styled theme-blue room-info-card">
                <RaceHeader name={raceState.name} roomCode={raceState.roomCode}/>
            </Card>

            <Card className="game-card-styled theme-yellow players-card">
                <div className="players-container">
                    <h3 className="players-header">
                        Players in Lobby: {raceState.players.length}
                    </h3>

                    {raceState.players.length === 0 ? (
                        <div className="empty-state">
                            <p>No players in the room yet. Waiting...</p>
                        </div>
                    ) : (
                        <div className="players-grid">
                            {raceState.players.map(player => (
                                <PlayerCard key={player.id} player={player}/>
                            ))}
                        </div>
                    )}
                </div>

                {!isHost && (
                    <div className="waiting-msg">
                        <p>Waiting for the host to start the game...</p>
                    </div>
                )}
            </Card>

            {isHost && (
                <Card className="game-card-styled theme-green admin-card">
                    <div style={{textAlign: 'center'}}>
                        <h4 style={{marginTop: 0}}>Admin Panel</h4>
                        <p>When everyone is ready, start the race!</p></div>
                    <div style={{ marginTop: 'auto' }}>
                        <button onClick={onStartRace} disabled={raceState.players.length === -1}>
                            Start the Race!
                        </button>
                    </div>
                </Card>
            )}
        </div>
    );
}

export default RaceLobby;