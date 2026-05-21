import React, { useState, useEffect, useRef } from 'react';
import ConfirmModal from '../ui/ConfirmModal';
import './RaceHeaderHost.css';

const formatTime = (ms) => {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const RaceHeaderHost = ({ raceState, livePlayers, localTimeLeft, onPlayerClick, onKickPlayer, onPauseRace, onResumeRace, onCancelRace, roomCode }) => {
    const [isPlayersMenuOpen, setIsPlayersMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterMode, setFilterMode] = useState("ALL");
    const [sortOrder, setSortOrder] = useState("DESC");
    const [isCopied, setIsCopied] = useState(false);

    // סטייט עבור מודאל האישור
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, actionType: null });

    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsPlayersMenuOpen(false);
            }
        };

        if (isPlayersMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isPlayersMenuOpen]);

    const totalTime = raceState.totalDurationMillis || 1;
    const timePercent = Math.max(0, Math.min(100, (localTimeLeft / totalTime) * 100));
    const isDanger = localTimeLeft <= 10000 && localTimeLeft > 0;

    const getFilteredAndSortedPlayers = () => {
        return livePlayers
            .filter(player => {
                if (filterMode === 'ONLINE' && !player.online) return false;
                if (filterMode === 'OFFLINE' && player.online) return false;

                if (searchQuery.trim() !== "") {
                    const query = searchQuery.toLowerCase();
                    const nickMatch = player.nickname?.toLowerCase().startsWith(query);
                    const userMatch = player.userName?.toLowerCase().startsWith(query);

                    if (!nickMatch && !userMatch) return false;
                }
                return true;
            })
            .sort((a, b) => {
                if (sortOrder === 'DESC') {
                    return b.currentScore - a.currentScore;
                } else {
                    return a.currentScore - b.currentScore;
                }
            });
    };

    const displayPlayers = getFilteredAndSortedPlayers();

    const toggleFilterMode = (e) => {
        e.stopPropagation();
        setFilterMode(prev => prev === 'ALL' ? 'ONLINE' : prev === 'ONLINE' ? 'OFFLINE' : 'ALL');
    };

    const toggleSortOrder = (e) => {
        e.stopPropagation();
        setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC');
    };

    const handleCopyCode = () => {
        const code = raceState.roomCode || roomCode;
        if (code) {
            navigator.clipboard.writeText(code);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    // פונקציות טיפול במודאל
    const openConfirmModal = (actionType) => {
        setConfirmModal({ isOpen: true, actionType });
    };

    const closeConfirmModal = () => {
        setConfirmModal({ isOpen: false, actionType: null });
    };

    const executeConfirmedAction = () => {
        if (confirmModal.actionType === 'PAUSE') onPauseRace();
        else if (confirmModal.actionType === 'RESUME') onResumeRace();
        else if (confirmModal.actionType === 'CANCEL') onCancelRace();

        closeConfirmModal();
    };

    // פונקציה לייצור הודעת המודאל הדינמית
    const getModalMessage = () => {
        switch (confirmModal.actionType) {
            case 'PAUSE': return 'האם אתה בטוח שברצונך להשהות את המירוץ?';
            case 'RESUME': return 'האם אתה בטוח שברצונך להמשיך את המירוץ?';
            case 'CANCEL': return 'האם אתה בטוח שברצונך לבטל את המירוץ לחלוטין? כל ההתקדמות תאבד (פעולה זו בלתי הפיכה!).';
            default: return '';
        }
    };

    const isPaused = raceState.status === 'PAUSED';

    return (
        <>
            <div className="custom-race-header">
                <div className="header-top-row">

                    {/* צד ימין (פרטי חדר ומנהל) */}
                    <div className="header-info-group">
                        <div className="room-details">
                            <h2>{raceState.name}</h2>
                            <div className="room-code-wrapper">
                                <span className="room-code-label">קוד:</span>
                                <div className="room-code-box">
                                    <span className="code-text">{raceState.roomCode || roomCode || '---'}</span>
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

                    {/* אמצע (טיימר) */}
                    <div className="header-timer-area">
                        <div className="timer-text">
                            <span>זמן נותר:</span>
                            <span className={`time-value ${isDanger ? 'danger-text' : ''}`}>
                                {formatTime(localTimeLeft)}
                            </span>
                        </div>
                        <div className={`progress-bar-container ${isDanger ? 'danger-border' : ''}`}>
                            <div className={`progress-bar-fill ${isDanger ? 'danger-fill' : ''}`} style={{ width: `${timePercent}%` }}></div>
                        </div>
                        <div className="title-separator"></div>
                        <span className="target-score">יעד נקודות: {raceState.targetScore}</span>
                    </div>

                    {/* צד שמאל: כפתורים */}
                    <div className="header-left-group">
                        <div className="race-control-buttons">
                            <button
                                className="control-btn orange-btn"
                                onClick={() => openConfirmModal(isPaused ? 'RESUME' : 'PAUSE')}
                            >
                                {isPaused ? '▶ המשך מירוץ' : '⏸ עצור מירוץ'}
                            </button>
                            <button
                                className="control-btn red-btn"
                                onClick={() => openConfirmModal('CANCEL')}
                            >
                                ✖ בטל מירוץ
                            </button>
                        </div>

                        <div className="header-actions" ref={dropdownRef}>
                            <button
                                className="players-toggle-btn"
                                onClick={() => setIsPlayersMenuOpen(!isPlayersMenuOpen)}
                            >
                                👥 רשימת שחקנים
                            </button>
                            <div className="title-separator"></div>
                            <div className="participants-info">
                                <span className="participants-label">משתתפים:</span>
                                <span className="participants-count">{livePlayers.length}</span>
                            </div>

                            {isPlayersMenuOpen && (
                                <div className="players-dropdown">
                                    <div className="dropdown-tools">
                                        <input type="text" className="dropdown-search-input" placeholder="חיפוש לפי כינוי/יוזר..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus />
                                        <button className="dropdown-filter-btn sort-btn" onClick={toggleSortOrder} title={sortOrder === 'DESC' ? 'מיון: מהגבוה לנמוך' : 'מיון: מהנמוך לגבוה'}>
                                            {sortOrder === 'DESC' ? '⬇️' : '⬆️'}
                                        </button>
                                        <button className="dropdown-filter-btn" onClick={toggleFilterMode} title={filterMode === 'ALL' ? 'הכל' : filterMode === 'ONLINE' ? 'רק מחוברים' : 'רק מנותקים'}>
                                            {filterMode === 'ALL' ? '🌐' : filterMode === 'ONLINE' ? '🟢' : '⚫'}
                                        </button>
                                    </div>
                                    <div className="players-list">
                                        {displayPlayers.length > 0 ? (
                                            displayPlayers.map(player => (
                                                <div key={player.id} className={`player-row clickable-row ${!player.online ? 'row-offline' : ''}`} style={{ borderRight: `6px solid ${player.carColor}` }} onClick={() => { onPlayerClick(player.id); setIsPlayersMenuOpen(false); }}>
                                                    <div className="player-identity">
                                                        <div className="player-name-wrapper">
                                                            <span className={`status-dot ${player.online ? 'online' : 'offline'}`} title={player.online ? 'מחובר' : 'מנותק'}></span>
                                                            <span className="player-nickname">{player.nickname}</span>
                                                        </div>
                                                        {player.userName ? <span className="player-username blue-text">@{player.userName}</span> : <span className="player-username gray-text">-Guest-</span>}
                                                    </div>
                                                    <div className="player-score">{player.currentScore} נק'</div>
                                                    <button className="kick-btn" title="הסר שחקן" onClick={(e) => { e.stopPropagation(); onKickPlayer(player.id); }}>✖</button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="no-players-found">לא נמצאו שחקנים התואמים לחיפוש</div>
                                        )}
                                    </div>
                                    <div className="players-count-footer">
                                        <span>סה"כ מציג: {displayPlayers.length} שחקנים</span>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            {/* קומפוננטת המודאל הגנרית שלנו */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                message={getModalMessage()}
                onConfirm={executeConfirmedAction}
                onCancel={closeConfirmModal}
            />
        </>
    );
};

export default RaceHeaderHost;