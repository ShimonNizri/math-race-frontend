import React, { memo } from 'react';


const PlayerRow = memo(({ player, targetScore }) => {

    const progress = Math.min((player.currentScore / targetScore) * 100, 100);

    return (
        <div >
            <div >
                <strong >{player.nickname}</strong>
                <span>{player.currentScore} points</span>
            </div>

            <div >
                <div


                ></div>
            </div>
        </div>
    );
});

function RaceActiveHost({ raceState }) {
    return (
        <div >
            <header >
                <h1 >{raceState.name} - The Race is On!</h1>
                <h3 >Target Score to Win: {raceState.targetScore}</h3>
            </header>

            <div >
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