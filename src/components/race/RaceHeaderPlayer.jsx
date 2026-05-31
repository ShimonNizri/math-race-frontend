import React, {useCallback, useState} from 'react';
import './RaceHeaderPlayer.css';
import ConfirmModal from '../ui/ConfirmModal';
import RaceMessages from "./RaceMessages.jsx";
import { FaRegCopy, FaCheck } from "react-icons/fa6";
import RaceSettingsPlayer from "./RaceSettingsPlayer.jsx";

const formatTime = (ms) => {
    if (typeof ms !== 'number' || isNaN(ms) || ms <= 0) {
        return "0:00";
    }
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const RaceHeaderPlayer = ({ raceState, localPlayer, localTimeLeft, onChangeNickname, onLeaveRace, messages }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [isOpen, setIsOpen] = useState(true);
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

    const raceStatus = raceState?.status || 'IN_PROGRESS';
    const isPending = raceStatus === 'PENDING';
    const isPaused = raceStatus === 'PAUSED';

    const validTimeLeft = (typeof localTimeLeft === 'number' && !isNaN(localTimeLeft)) ? localTimeLeft : 0;
    const totalTime = raceState.totalDurationMillis || 1;
    const timePercent = Math.max(0, Math.min(100, (validTimeLeft / totalTime) * 100));

    const isDanger = validTimeLeft <= 10000 && validTimeLeft > 0 && !isPending;

    const totalPlayers = (raceState.players?.length || 0) + 1;

    let statusClass = 'active';
    let statusLabel = 'Active';
    if (isPending) {
        statusClass = 'pending';
        statusLabel = 'Pending';
    } else if (isPaused) {
        statusClass = 'paused';
        statusLabel = 'Paused';
    }

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

                        <div className="header-info-group">
                            <div className="room-details">
                                <div className="room-name-and-code">
                                    <h2>{raceState.name}</h2>
                                    <div className="room-code-box">
                                        <span className="code-text">{raceState.roomCode || '---'}</span>
                                        <button className="copy-btn" onClick={handleCopyCode} title="העתק קוד">
                                            {isCopied ? <FaCheck style={{ color: 'var(--green)' }} /> : <FaRegCopy style={{ color: 'var(--text-h)' }} />}
                                        </button>
                                    </div>
                                </div>

                                <div className={`race-status-badge ${statusClass}`}>
                                    <span className="status-text">Status: {statusLabel}</span>
                                    <span className="status-circle"></span>
                                </div>
                            </div>
                            <div className="vertical-separator"></div>
                            <div className="host-details">
                                <div className="host-nickname-wrapper">
                                    <span className="host-nickname-large">{raceState.host?.nickname || 'מנהל'}</span>
                                    <span className={`status-dot ${raceState.host?.online ? 'online' : 'offline'}`} title={raceState.host?.online ? 'מחובר' : 'מנותק'}></span>
                                </div>
                                {raceState.host?.userName ? (
                                    <span className="host-username blue-text">@{raceState.host.userName}</span>
                                ) : (
                                    <span className="host-username gray-text">-Guest-</span>
                                )}
                            </div>
                        </div>

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
                                    <span className="host-nickname-large">{localPlayer?.nickname || 'שחקן'}</span>
                                    <span className={`status-dot ${localPlayer?.online ? 'online' : 'offline'}`} title={localPlayer?.online ? 'מחובר' : 'מנותק'}></span>
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

                <div className="header-bottom-tabs-container">

                    <div className="tabs-side tabs-left">
                        <RaceSettingsPlayer
                            currentNickname={localPlayer?.nickname}
                            onChangeNickname={onChangeNickname}
                            onLeaveRace={handleLeaveClick}
                        />
                        <RaceMessages messages={messages} />
                    </div>

                    <button
                        className="header-toggle-btn"
                        onClick={() => setIsOpen(!isOpen)}
                        title={isOpen ? "הסתר כותרת" : "הצג כותרת"}
                    >
                        {isOpen ? '▲' : '▼'}
                    </button>

                    <div className="tabs-side tabs-right"></div>

                </div>

            </div>

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