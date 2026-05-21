import React, { useState, useEffect, useRef, memo } from 'react';
import './RaceActivePlayer.css';
import { useWebSocket } from "../../services/webSocket/WebSocketContext.js";
import RaceHeaderPlayer from './RaceHeaderPlayer';

const BUTTON_COLORS = ['bg-red', 'bg-blue', 'bg-green', 'bg-yellow'];

const TRACK_INFO = {
    REGULAR: { text: "Regular Track", color: "var(--blue)" },
    WAITING_FOR_CHOICE: { text: "Crossroads", color: "var(--yellow)" },
    AUTOSTRADA: { text: "Autostrada", color: "var(--red)" },
    DIRT_ROAD: { text: "Dirt Road", color: "var(--green)" }
};

// ---------------------------------------------------------
// 1. קומפוננטת תגית המסלול
// ---------------------------------------------------------
const TrackBadge = ({ trackState, currentQ, totalQ }) => {
    const info = TRACK_INFO[trackState] || TRACK_INFO.REGULAR;
    return (
        <div className="track-state-badge" style={{ backgroundColor: info.color }}>
            {info.text}
            {currentQ && totalQ ? ` (${currentQ}/${totalQ})` : ''}
        </div>
    );
};

// ---------------------------------------------------------
// 2. קומפוננטת טיימר השאלה (מוגן מפני NaN)
// ---------------------------------------------------------
const RaceTimer = memo(({ questionTimeLeft, totalTime, isQuestionActive }) => {
    const safeTimeLeft = (typeof questionTimeLeft === 'number' && !isNaN(questionTimeLeft)) ? questionTimeLeft : 0;
    const remainingSeconds = Math.ceil(safeTimeLeft / 1000);
    const formattedMinutes = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds % 60).padStart(2, '0');

    const safeTotalTime = totalTime > 0 ? totalTime : 1;
    const progressWidth = (safeTimeLeft / safeTotalTime) * 100;
    const isCriticalTime = progressWidth < 25;

    return (
        <div style={{ visibility: isQuestionActive ? 'visible' : 'hidden' }}>
            <div className="timer-wrapper">
                <div className="timer-labels">
                    <span className="timer-title">Time Left:</span>
                    <span className={`timer-clock ${isCriticalTime ? 'text-critical' : ''}`}>
                        {formattedMinutes}:{formattedSeconds}
                    </span>
                </div>
                <div className="timer-container">
                    <div className={`timer-bar ${isCriticalTime ? 'critical' : ''}`} style={{ width: `${Math.max(0, Math.min(100, progressWidth))}%` }} />
                </div>
            </div>
        </div>
    );
});

// ---------------------------------------------------------
// 3. קומפוננטת הקלף המתהפך (Flip Card - תומך ב-waiting)
// ---------------------------------------------------------
const RaceFlipCard = memo(({ flipCount, faces, feedbackType, scoreDiff }) => {

    const renderFace = (content) => {
        if (!content) return null;

        if (content.type === 'QUESTION') {
            const isJunc = !!content.data?.offer1;
            return (
                <>
                    <TrackBadge trackState={content.track} currentQ={content.currentQ} totalQ={content.totalQ} />
                    {!isJunc && content.data?.score && (
                        <div className="points-tag">{content.data.score} pts</div>
                    )}
                    <div className="question-text">{content.data?.expression}</div>
                </>
            );
        }

        if (content.type === 'RETURN_TRACK') {
            return (
                <>
                    <TrackBadge trackState="REGULAR" />
                    <div className="returned-track-msg">
                        The special track has ended.<br/>You returned to the main track!
                    </div>
                </>
            );
        }

        return (
            <>
                <TrackBadge trackState={content.track} currentQ={content.currentQ} totalQ={content.totalQ} />
                <div className="feedback-content">
                    {feedbackType === 'waiting' ? (
                        <div className="feedback-status text-neutral">Waiting for next question...</div>
                    ) : feedbackType === 'junction-chosen' ? (
                        <div className="feedback-status text-neutral">Preparing for track...</div>
                    ) : (
                        <>
                            <div className={`feedback-status text-${feedbackType}`}>
                                {feedbackType === 'positive' ? 'Correct!' : feedbackType === 'negative' ? 'Wrong' : "Time's up"}
                            </div>
                            {feedbackType !== 'timeout' && (
                                <div className={`feedback-score-anim text-${feedbackType}`}>
                                    {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </>
        );
    };

    return (
        <div className="flip-card-container">
            <div className="flip-card-inner" style={{ transform: `rotateY(${flipCount * 180}deg)` }}>
                <div className="flip-card-face face-0">
                    {renderFace(faces.face0)}
                </div>
                <div className="flip-card-face face-1">
                    {renderFace(faces.face1)}
                </div>
            </div>
        </div>
    );
});

// ---------------------------------------------------------
// 4. קומפוננטת אזור הכפתורים
// ---------------------------------------------------------
const RaceOptions = memo(({ isQuestionActive, isJunctionView, activeEvent, isSubmitting, questionTimeLeft, onAnswer, onChooseJunction }) => {
    if (!isQuestionActive || !activeEvent) return <div className="options-wrapper" />;

    const getTrackName = (offerCode) => {
        return TRACK_INFO[offerCode]?.text || offerCode;
    };

    return (
        <div className="options-wrapper">
            <div className="options-grid">
                {isJunctionView ? (
                    <>
                        <button className="option-btn bg-red" disabled={isSubmitting || questionTimeLeft <= 0} onClick={() => onChooseJunction(activeEvent.offer1)}>
                            {getTrackName(activeEvent.offer1)}
                            <span className="btn-desc">High risk, fast progress</span>
                        </button>
                        <button className="option-btn bg-green" disabled={isSubmitting || questionTimeLeft <= 0} onClick={() => onChooseJunction(activeEvent.offer2)}>
                            {getTrackName(activeEvent.offer2)}
                            <span className="btn-desc">Safe and steady</span>
                        </button>
                    </>
                ) : (
                    activeEvent.options.map((opt, i) => (
                        <button
                            key={i}
                            className={`option-btn ${BUTTON_COLORS[i % 4]}`}
                            onClick={() => onAnswer(opt)}
                            disabled={isSubmitting || questionTimeLeft <= 0}
                        >
                            {opt}
                        </button>
                    ))
                )}
            </div>
        </div>
    );
});


// ---------------------------------------------------------
// קומפוננטת האם הראשית (RaceActivePlayer)
// ---------------------------------------------------------
function RaceActivePlayer({ raceState, joinToken, timeOffset = 0, onAnswerQuestion, onChooseJunction , onNicknameChange, onLeaveRace}) {
    const {isConnected, subscribe} = useWebSocket();
    const [localPlayer, setLocalPlayer] = useState(raceState.myAccount);

    useEffect(() => {
        if (raceState.myAccount) setLocalPlayer(raceState.myAccount);
    }, [raceState.myAccount, raceState.receivedAt]);

    const activeEvent = localPlayer?.currentQuestion || localPlayer?.currentJunction;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [questionTimeLeft, setQuestionTimeLeft] = useState(0);
    const [globalTimeLeft, setGlobalTimeLeft] = useState(0);

    const [isJustReturned, setIsJustReturned] = useState(false);
    const [scoreDiff, setScoreDiff] = useState(0);
    const [feedbackType, setFeedbackType] = useState('waiting'); // ברירת מחדל לזמן המתנה בהתחלה

    const prevEventRef = useRef(activeEvent);
    const prevTrackRef = useRef(localPlayer?.trackState);
    const prevScoreRef = useRef(localPlayer?.currentScore || 0);

    // האזנה לתורים האישיים של השחקן
    useEffect(() => {
        if (!isConnected) return;
        const queue = `/user/queue/race/feedback`;

        const unsubscribe = subscribe(queue, (data) => {
            setLocalPlayer(prevPlayer => {
                if (!prevPlayer) return null;
                const updatedPlayer = {...prevPlayer};

                if (data.type === 'JUNCTION_OFFERED') {
                    updatedPlayer.currentJunction = {
                        expression: data.data.expression,
                        offer1: data.data.offer1,
                        offer2: data.data.offer2,
                        timeLimitMillis: data.data.timeLimitMillis,
                        questionRemainingTimeMillis: data.data.questionRemainingTimeMillis,
                        receivedAt: data.data.sentAt,
                    };
                    updatedPlayer.currentQuestion = null;
                    updatedPlayer.trackState = data.data.state;

                } else if (data.type === 'JUNCTION_CHOOSE' || data.type === 'JUNCTION_TIMEOUT') {
                    updatedPlayer.currentJunction = null;
                    updatedPlayer.trackState = data.data.state;

                } else if (data.type === 'TRACK_STATE_CHANGED') {
                    updatedPlayer.trackState = data.data.state;

                } else if (data.type === 'NEW_QUESTION') {
                    updatedPlayer.currentJunction = null;
                    updatedPlayer.currentQuestion = {
                        expression: data.data.expression,
                        options: data.data.options,
                        timeLimitMillis: data.data.timeLimitMillis,
                        questionRemainingTimeMillis: data.data.questionRemainingTimeMillis,
                        score: data.data.score,
                        receivedAt: data.data.sentAt,
                    };

                } else if (data.type === 'CORRECT_ANSWER' || data.type === 'WRONG_ANSWER' || data.type === 'TIMEOUT') {
                    updatedPlayer.currentQuestion = null;
                    updatedPlayer.currentScore = prevPlayer.currentScore + (data.data.score || 0);
                }

                return updatedPlayer;
            });
        }, joinToken);

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [isConnected, subscribe, joinToken]);

    // ניהול פידבקים והמתנה לשאלה הבאה (תוקן)
    useEffect(() => {
        if (!activeEvent) {
            if (prevEventRef.current) {
                const diff = (localPlayer?.currentScore || 0) - prevScoreRef.current;
                setScoreDiff(diff);
                if (prevEventRef.current.offer1) setFeedbackType('junction-chosen');
                else if (diff > 0) setFeedbackType('positive');
                else if (isSubmitting) setFeedbackType('negative');
                else setFeedbackType('timeout');
            } else {
                setFeedbackType('waiting'); // אם אין שאלה קודמת ואנחנו ממתינים
            }
        }
        prevEventRef.current = activeEvent;
        prevScoreRef.current = localPlayer?.currentScore || 0;
    }, [activeEvent, localPlayer?.currentScore, isSubmitting]);

    useEffect(() => {
        if (localPlayer?.trackState === 'REGULAR' && prevTrackRef.current && prevTrackRef.current !== 'REGULAR' && prevTrackRef.current !== 'WAITING_FOR_CHOICE') {
            setIsJustReturned(true);
        }
        prevTrackRef.current = localPlayer?.trackState;
    }, [localPlayer?.trackState]);

    useEffect(() => {
        if (activeEvent) {
            setIsJustReturned(false);
            setIsSubmitting(false);
        }
    }, [activeEvent]);

    // ניהול טיימר השאלה הדינמית (מוגן מסנכרון ו-NaN)
    useEffect(() => {
        if (!activeEvent || activeEvent.questionRemainingTimeMillis == null) return;

        const validOffset = isNaN(timeOffset) ? 0 : timeOffset;
        const serverEndTime = activeEvent.receivedAt + activeEvent.questionRemainingTimeMillis;

        const initialServerTime = Date.now() - validOffset;
        const initialRemaining = Math.max(0, serverEndTime - initialServerTime);
        setQuestionTimeLeft(isNaN(initialRemaining) ? 0 : initialRemaining);

        // 2. הפעלת הלולאה שממשיכה לעדכן
        const intervalId = setInterval(() => {
            const currentServerTime = Date.now() - validOffset;
            const remaining = Math.max(0, serverEndTime - currentServerTime);
            setQuestionTimeLeft(isNaN(remaining) ? 0 : remaining);

            if (remaining <= 0) clearInterval(intervalId);
        }, 100);

        return () => clearInterval(intervalId);
    }, [activeEvent, timeOffset]);

    // ניהול טיימר המרוץ הכללי (מוגן מ-NaN וחישוב חלופי)
    useEffect(() => {
        if (!raceState || raceState.remainingTimeMs == null) return;

        const validOffset = isNaN(timeOffset) ? 0 : timeOffset;
        const safeReceivedAt = raceState.receivedAt || (Date.now() - validOffset);
        const raceEndTime = safeReceivedAt + raceState.remainingTimeMs;

        const initialServerTime = Date.now() - validOffset;
        const initialRemaining = Math.max(0, raceEndTime - initialServerTime);
        setGlobalTimeLeft(isNaN(initialRemaining) ? 0 : initialRemaining);

        const intervalId = setInterval(() => {
            const currentServerTime = Date.now() - validOffset;
            const remaining = Math.max(0, raceEndTime - currentServerTime);
            setGlobalTimeLeft(isNaN(remaining) ? 0 : remaining);

            if (remaining <= 0 || raceState.status !== 'IN_PROGRESS') clearInterval(intervalId);
        }, 100);

        return () => clearInterval(intervalId);
    }, [raceState.receivedAt, raceState.remainingTimeMs, raceState.status, timeOffset]);

    // ניהול מנגנון הקלף המתהפך
    const [flipCount, setFlipCount] = useState(0);
    const [faces, setFaces] = useState({
        face0: {type: 'QUESTION', data: activeEvent, track: localPlayer?.trackState},
        face1: null
    });

    let targetType = 'FEEDBACK';
    if (activeEvent) targetType = 'QUESTION';
    else if (isJustReturned) targetType = 'RETURN_TRACK';

    const targetStateId = activeEvent ? `Q-${activeEvent.expression}` : (isJustReturned ? 'RETURN' : 'FEEDBACK');
    const [currentFaceId, setCurrentFaceId] = useState(targetStateId);

    useEffect(() => {
        if (targetStateId !== currentFaceId) {
            const nextFaceContent = {
                type: targetType,
                data: activeEvent,
                track: localPlayer?.trackState,
                totalQ: localPlayer?.totalTrackQuestions,
                currentQ: localPlayer?.totalTrackQuestions && localPlayer?.specialQuestionsRemaining ? (localPlayer.totalTrackQuestions - localPlayer.specialQuestionsRemaining + 1) : null
            };

            setFlipCount(c => c + 1);
            setFaces(prev => {
                if (flipCount % 2 === 0) return {...prev, face1: nextFaceContent};
                else return {...prev, face0: nextFaceContent};
            });
            setCurrentFaceId(targetStateId);
        }
    }, [targetStateId, targetType, activeEvent, localPlayer?.trackState, localPlayer?.totalTrackQuestions, localPlayer?.specialQuestionsRemaining, flipCount, currentFaceId]);

    if (!localPlayer) return <div>Loading player data...</div>;

    const isQuestionActive = targetType === 'QUESTION';
    const isJunctionView = !!activeEvent?.offer1;

    return (
        <>
            <RaceHeaderPlayer
                raceState={raceState}
                localPlayer={localPlayer}
                localTimeLeft={globalTimeLeft}
                onChangeNickname={onNicknameChange}
                onLeaveRace={onLeaveRace}
            />

            <div className="race-layout-container">
                <RaceTimer
                    questionTimeLeft={questionTimeLeft}
                    totalTime={activeEvent?.timeLimitMillis}
                    isQuestionActive={isQuestionActive}
                />

                <RaceFlipCard
                    flipCount={flipCount}
                    faces={faces}
                    feedbackType={feedbackType}
                    scoreDiff={scoreDiff}
                />

                <RaceOptions
                    isQuestionActive={isQuestionActive}
                    isJunctionView={isJunctionView}
                    activeEvent={activeEvent}
                    isSubmitting={isSubmitting}
                    questionTimeLeft={questionTimeLeft}
                    onAnswer={(opt) => {
                        setIsSubmitting(true);
                        onAnswerQuestion(opt);
                    }}
                    onChooseJunction={(choice) => {
                        setIsSubmitting(true);
                        onChooseJunction(choice);
                    }}
                />
            </div>
        </>
    );
}

export default memo(RaceActivePlayer);