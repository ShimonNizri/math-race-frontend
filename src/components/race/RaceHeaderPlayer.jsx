import React, {useCallback, useState} from 'react';
import './RaceHeaderPlayer.css';
import RaceSettings from './RaceSettings';
import ConfirmModal from '../ui/ConfirmModal';

const formatTime = (ms) => {
    if (typeof ms !== 'number' || isNaN(ms) || ms <= 0) {
        return "0:00";
    }
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const RaceHeaderPlayer = ({ raceState, localPlayer, localTimeLeft, onChangeNickname, onLeaveRace }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [isOpen, setIsOpen] = useState(true);

    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

    const validTimeLeft = (typeof localTimeLeft === 'number' && !isNaN(localTimeLeft)) ? localTimeLeft : 0;
    const totalTime = raceState.totalDurationMillis || 1;
    const timePercent = Math.max(0, Math.min(100, (validTimeLeft / totalTime) * 100));
    const isDanger = validTimeLeft <= 10000 && validTimeLeft > 0;

    const totalPlayers = (raceState.players?.length || 0) + 1;

    const handleCopyCode = () => {
        if (raceState.roomCode) {
            navigator.clipboard.writeText(raceState.roomCode);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const handleLeaveClick = useCallback(() => {
        setIsLeaveModalOpen(true);
    }, []);

    const confirmLeave = useCallback(() => {
        setIsLeaveModalOpen(false);
        if (onLeaveRace) onLeaveRace();
    }, [onLeaveRace]);

    const cancelLeave = useCallback(() => {
        setIsLeaveModalOpen(false);
    }, []);

    return (
        <>
            <div className={`custom-race-header ${isOpen ? '' : 'closed'}`}>

                <div className="header-collapse-wrapper">
                    <div className="header-top-row">
                        {/* צד ימין */}
                        <div className="header-info-group">
                            <div className="room-details">
                                <h2>{raceState.name}</h2>
                                <div className="room-code-wrapper">
                                    <span className="room-code-label">קוד:</span>
                                    <div className="room-code-box">
                                        <span className="code-text">{raceState.roomCode || '---'}</span>
                                        <button className="copy-btn" onClick={handleCopyCode} title="העתק קוד">
                                            {isCopied ? '✅' : '📋'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="vertical-separator"></div>
                            <div className="host-details">
                                <div className="host-nickname-wrapper">
                                    <span className={`status-dot ${raceState.host?.online ? 'online' : 'offline'}`} title={raceState.host?.online ? 'מחובר' : 'מנותק'}></span>
                                    <span className="host-nickname-large">{raceState.host?.nickname || 'מנהל'}</span>
                                </div>
                                {raceState.host?.userName ? (
                                    <span className="host-username blue-text">@{raceState.host.userName}</span>
                                ) : (
                                    <span className="host-username gray-text">-Guest-</span>
                                )}
                            </div>
                        </div>

                        {/* אמצע */}
                        <div className="header-timer-area">
                            <div className="timer-text">
                                <span>זמן נותר:</span>
                                <span className={`time-value ${isDanger ? 'danger-text' : ''}`}>
                                    {formatTime(validTimeLeft)}
                                </span>
                            </div>
                            <div className={`progress-bar-container ${isDanger ? 'danger-border' : ''}`}>
                                <div className={`progress-bar-fill ${isDanger ? 'danger-fill' : ''}`} style={{ width: `${timePercent}%` }}></div>
                            </div>
                            <div className="title-separator"></div>
                            <span className="target-score">יעד נקודות: {raceState.targetScore}</span>
                        </div>

                        {/* צד שמאל */}
                        <div className="header-info-group player-self-group">
                            <div className="player-stats-wrapper">
                                <div className="score-row">
                                    <span className="score-label">My Score:</span>
                                    <span className="score-value">{localPlayer?.currentScore || 0}</span>
                                </div>
                                <div className="participants-row">
                                    <span className="participants-label">Participants:</span>
                                    <span className="participants-count">{totalPlayers}</span>
                                </div>
                            </div>
                            <div className="vertical-separator"></div>
                            <div className="host-details">
                                <div className="host-nickname-wrapper">
                                    <span className={`status-dot ${localPlayer?.online ? 'online' : 'offline'}`} title={localPlayer?.online ? 'מחובר' : 'מנותק'}></span>
                                    <span className="host-nickname-large">{localPlayer?.nickname || 'שחקן'}</span>
                                </div>
                                {localPlayer?.userName ? (
                                    <span className="host-username blue-text">@{localPlayer.userName}</span>
                                ) : (
                                    <span className="host-username gray-text">-Guest-</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* כפתור פתיחה/סגירה מרכזי */}
                <button
                    className="header-toggle-btn"
                    onClick={() => setIsOpen(!isOpen)}
                    title={isOpen ? "הסתר כותרת" : "הצג כותרת"}
                >
                    {isOpen ? '▲' : '▼'}
                </button>

                {/* כפתור ההגדרות בצד שמאל */}
                <RaceSettings
                    currentNickname={localPlayer?.nickname}
                    onChangeNickname={onChangeNickname}
                    onLeaveRace={handleLeaveClick} /* כאן החלפנו את הפונקציה כדי שקודם ייפתח מודאל */
                />

            </div>

            {/* שילוב קומפוננטת המודאל שלנו */}
            <ConfirmModal
                isOpen={isLeaveModalOpen}
                title="עזיבת המירוץ"
                message="האם אתה בטוח שברצונך לעזוב את המירוץ? תתנתק מהחדר הנוכחי."
                confirmText="כן, עזוב"
                cancelText="הישאר במירוץ"
                onConfirm={confirmLeave}
                onCancel={cancelLeave}
            />
        </>
    );
};

export default RaceHeaderPlayer;