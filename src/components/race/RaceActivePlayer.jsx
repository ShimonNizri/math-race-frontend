import React, { memo, useState, useEffect } from 'react';
import Button from "../ui/Button.jsx";

function RaceActivePlayer({ raceState, accountId , onAnswerQuestion}) {
    const player = raceState.players.find(p => p.id === accountId);
    const question = player?.currentQuestion;
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (!question || question.questionRemainingTimeMillis == null) return;

        setIsSubmitting(false);

        const endTime = Date.now() + question.questionRemainingTimeMillis;
        let intervalId;

        const updateTimer = () => {
            const remaining = Math.max(0, endTime - Date.now());
            setTimeLeft(remaining);

            if (remaining <= 0) {
                clearInterval(intervalId);
            }
        };

        updateTimer();

        intervalId = setInterval(updateTimer, 100);

        return () => clearInterval(intervalId);

    }, [question]);

    if (!player) return <div>טוען נתוני שחקן...</div>;
    if (!question) return <div>ממתין לשאלה הבאה...</div>;

    // המרות ממילי-שניות לשניות שלמות לתצוגה יפה
    const totalSeconds = Math.round(question.timeLimitMillis / 1000);
    const remainingSeconds = Math.ceil(timeLeft / 1000);
    const isTimeUp = timeLeft <= 0;

    return (
        <div>
            <div>
                <h1>{"name : " + raceState.name + " | target : " + raceState.targetScore}</h1>
                <p>{"nickname : " + player.nickname }</p>
                <p>{"current Score : " + player.currentScore }</p>
            </div>

            <div className={`timer-container ${isTimeUp ? 'blink-red' : ''}`}>
                <h2 style={{ color: isTimeUp ? 'red' : 'inherit' }}>
                    זמן: {remainingSeconds} / {totalSeconds}
                </h2>
            </div>

            <div>
                <h1>{"question : " + question.expression}</h1>
            </div>

            <div>
                {
                    question.options.map((option, index) => (
                        <Button
                            key={index}
                            onClick={() => {
                                setIsSubmitting(true);
                                onAnswerQuestion(option);
                            }}
                            disabled={isTimeUp || isSubmitting}
                        >
                            {option}
                        </Button>
                    ))
                }
            </div>

        </div>
    );
}

export default memo(RaceActivePlayer);