import React, { memo, useState, useEffect } from 'react';
import { FaLightbulb } from "react-icons/fa6";
import './RaceFlipCard.css';

export let TRACK_INFO;
TRACK_INFO = {
    REGULAR: {text: "Regular Track", color: "var(--blue)"},
    WAITING_FOR_CHOICE: {text: "Crossroads", color: "var(--yellow)"},
    AUTOSTRADA: {text: "Autostrada", color: "var(--red)"},
    DIRT_ROAD: {text: "Dirt Road", color: "var(--green)"}
};

const TrackBadge = ({ trackState, currentQ, totalQ }) => {
    const info = TRACK_INFO[trackState] || TRACK_INFO.REGULAR;
    return (
        <div className="track-state-badge" style={{ backgroundColor: info.color }}>
            {info.text}
            {currentQ && totalQ ? ` (${currentQ}/${totalQ})` : ''}
        </div>
    );
};

const REPORT_OPTIONS = [
    "Logical error",
    "Syntax error",
    "Spelling mistake",
    "Wrong answer",
    "Other"
];

const RaceFlipCard = memo(({ flipCount, faces, feedbackType, scoreDiff, onHintClick, canRequestHint, hasHintAlready, isPaused, onReportTemplate }) => {

    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportedQId, setReportedQId] = useState(null);
    const [selectedReportOptions, setSelectedReportOptions] = useState([]);
    const [reportText, setReportText] = useState('');
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    const [isFlipping, setIsFlipping] = useState(false);

    useEffect(() => {
        if (flipCount === 0) return;

        setIsFlipping(true);

        const timer = setTimeout(() => {
            setIsFlipping(false);
        }, 600);

        return () => clearTimeout(timer);
    }, [flipCount]);

    const handleOpenReport = (questionId) => {
        setReportedQId(questionId);
        setSelectedReportOptions([]);
        setReportText('');
        setIsReportModalOpen(true);
    };

    const handleCloseReport = () => {
        setIsReportModalOpen(false);
        setReportedQId(null);
    };

    const toggleReportOption = (option) => {
        setSelectedReportOptions(prev =>
            prev.includes(option)
                ? prev.filter(o => o !== option)
                : [...prev, option]
        );
    };

    const handleSubmitReport = () => {
        const reasons = selectedReportOptions.join(", ");
        const fullComment = `${reasons}${reasons && reportText ? ' | ' : ''}${reportText}`;

        if (onReportTemplate && reportedQId) {
            onReportTemplate(reportedQId, fullComment);
        }

        handleCloseReport();

        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 2500);
    };

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

                    {!isJunc && !hasHintAlready && (
                        <button
                            className="hint-btn"
                            onClick={onHintClick}
                            disabled={!canRequestHint || isPaused}
                            title={!canRequestHint ? "רמז לא זמין בשאלה זו" : (isPaused ? "המירוץ מושהה" : "קבל רמז")}
                        >
                            <FaLightbulb /> Hint
                        </button>
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

    const isFace0Active = flipCount % 2 === 0;

    const currentFaceContent = isFace0Active ? faces.face0 : faces.face1;
    const isCurrentJunc = !!currentFaceContent?.data?.offer1;

    const isQuestionFace = currentFaceContent?.type === 'QUESTION';
    const activeQuestionId = (isQuestionFace && !isCurrentJunc) ? currentFaceContent.data?.id : null;

    const shouldShowReportBtn = activeQuestionId && !isFlipping;

    return (
        <>
            <div className="flip-card-container">
                <div className="flip-card-inner" style={{ transform: `rotateY(${flipCount * 180}deg)` }}>
                    <div
                        className="flip-card-face face-0"
                        style={{ pointerEvents: isFace0Active ? 'auto' : 'none' }}
                    >
                        {renderFace(faces.face0)}
                    </div>
                    <div
                        className="flip-card-face face-1"
                        style={{ pointerEvents: !isFace0Active ? 'auto' : 'none' }}
                    >
                        {renderFace(faces.face1)}
                    </div>
                </div>

                {shouldShowReportBtn && (
                    <button
                        className="report-question-btn"
                        onClick={() => handleOpenReport(activeQuestionId)}
                    >
                        Report Question
                    </button>
                )}
            </div>

            {isReportModalOpen && (
                <div className="report-modal-overlay" onClick={handleCloseReport}>
                    <div className="report-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="report-close-x" onClick={handleCloseReport}>&times;</button>
                        <h3 className="report-modal-title">Report Question</h3>

                        <div className="report-checkbox-grid">
                            {REPORT_OPTIONS.map((option, idx) => (
                                <label key={idx} className="report-checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={selectedReportOptions.includes(option)}
                                        onChange={() => toggleReportOption(option)}
                                    />
                                    {option}
                                </label>
                            ))}
                        </div>

                        <textarea
                            className="report-textarea"
                            placeholder="Additional details (optional)..."
                            value={reportText}
                            onChange={(e) => setReportText(e.target.value)}
                            maxLength={900}
                        />

                        <button className="report-submit-btn" onClick={handleSubmitReport}>
                            Submit Report
                        </button>
                    </div>
                </div>
            )}

            {showSuccessToast && (
                <div className="report-success-toast">
                    Report sent!
                </div>
            )}
        </>
    );
});

export default RaceFlipCard;