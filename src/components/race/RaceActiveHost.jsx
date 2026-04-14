import React, { memo } from 'react';
import './RaceActiveHost.css';

const PlayerNode = ({ player, targetScore, trackType }) => {
    const progress = Math.min((player.currentScore / targetScore) * 100, 100);

    return (
        <div
            className="player-node"
            title={`${player.nickname} - Score: ${player.currentScore}`}
            style={{
                left: `${progress}%`,
                transform: `translate(-50%, -50%)` // מרכוז על הכביש
            }}
        >
            {player.nickname.charAt(0).toUpperCase()}
        </div>
    );
};

const Track = ({ title, players, targetScore, typeClass }) => {
    return (
        <div className={`track-container ${typeClass}`}>
            <h4 className="track-title">{title}</h4>
            <div className="road-visual">
                <div className="road-divider"></div>
                <div className="finish-line"></div>
                <div className="players-track-area">
                    {players.map(player => (
                        <PlayerNode
                            key={player.id}
                            player={player}
                            targetScore={targetScore}
                            trackType={typeClass}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

function RaceActiveHost({ raceState, onFinishRace }) {
    if (!raceState) return <div className="loading-screen">Loading...</div>;

    const tracks = {
        AUTOSTRADA: raceState.players.filter(p => p.trackState === 'AUTOSTRADA'),
        REGULAR: raceState.players.filter(p => p.trackState === 'REGULAR' || !p.trackState),
        DIRT_ROAD: raceState.players.filter(p => p.trackState === 'DIRT_ROAD')
    };

    return (
        <div className="race-host-container">
            <header className="host-header">
                <div className="race-info">
                    <h1>{raceState.name}</h1>
                    <span className="target-info">Target: {raceState.targetScore}</span>
                </div>
                <button className="finish-btn" onClick={onFinishRace}>
                    Finish Race
                </button>
            </header>

            <div className="tracks-wrapper">
                <Track
                    title="Highway (Fast)"
                    players={tracks.AUTOSTRADA}
                    targetScore={raceState.targetScore}
                    typeClass="autostrada"
                />

                <Track
                    title="Regular Track"
                    players={tracks.REGULAR}
                    targetScore={raceState.targetScore}
                    typeClass="regular"
                />

                <Track
                    title="Dirt Road (Slow)"
                    players={tracks.DIRT_ROAD}
                    targetScore={raceState.targetScore}
                    typeClass="dirt_road"
                />
            </div>
        </div>
    );
}

export default RaceActiveHost;
