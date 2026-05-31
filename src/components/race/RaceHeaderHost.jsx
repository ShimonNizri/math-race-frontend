import React, { useState, useEffect, useRef } from 'react';
import { FaRegCopy, FaCheck } from "react-icons/fa6";
import RaceSettingsHost from './RaceSettingsHost.jsx';
import './RaceHeaderHost.css';

const formatTime = (ms) => {
    if (typeof ms !== 'number' || isNaN(ms) || ms <= 0) {
        return "0:00";
    }
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const RaceHeaderHost = ({ raceState, livePlayers, localTimeLeft, onPlayerClick, onKickPlayer, onPauseRace, onResumeRace, onCancelRace, onChangeNickname, onChangeRaceName }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [isPlayersMenuOpen, setIsPlayersMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterMode, setFilterMode] = useState("ALL");
    const [sortOrder, setSortOrder] = useState("DESC");
    const [isCopied, setIsCopied] = useState(false);

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

    const raceStatus = raceState?.status || 'IN_PROGRESS';
    const isPending = raceStatus === 'PENDING';
    const isPaused = raceStatus === 'PAUSED';

    const validTimeLeft = (typeof localTimeLeft === 'number' && !isNaN(localTimeLeft)) ? localTimeLeft : 0;
    const totalTime = raceState.totalDurationMillis || 1;
    const timePercent = Math.max(0, Math.min(100, (validTimeLeft / totalTime) * 100));

    // מניעת אזהרת זמן אדום בזמן Pending
    const isDanger = validTimeLeft <= 10000 && validTimeLeft > 0 && !isPending;

    let statusClass = 'active';
    let statusLabel = 'Active';
    if (isPending) {
        statusClass = 'pending';
        statusLabel = 'Pending';
    } else if (isPaused) {
        statusClass = 'paused';
        statusLabel = 'Paused';
    }

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
        const code = raceState.roomCode;
        if (code) {
            navigator.clipboard.writeText(code);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    return (
        <div className={`custom-race-header ${isOpen ? '' : 'closed'}`}>
            <div className={`header-collapse-wrapper ${isPlayersMenuOpen ? 'dropdown-open' : ''}`}>
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

                    <div className="header-info-group host-left-group">
                        <div className="header-actions" ref={dropdownRef}>
                            <button
                                className="players-toggle-btn"
                                onClick={() => setIsPlayersMenuOpen(!isPlayersMenuOpen)}
                            >
                                👥 רשימת שחקנים
                            </button>
                            <div className="participants-info">
                                <span className="participants-label">משתתפים מחוברים:</span>
                                <span className="participants-count">{livePlayers.filter(p => p.online).length}/{livePlayers.length}</span>
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

            <div className="header-bottom-tabs-container">
                <div className="tabs-side tabs-left">
                    <RaceSettingsHost
                        currentNickname={raceState.host?.nickname}
                        currentRaceName={raceState.name}
                        isPaused={isPaused}
                        isPending={isPending}
                        onChangeNickname={onChangeNickname}
                        onChangeRaceName={onChangeRaceName}
                        onPauseRace={onPauseRace}
                        onResumeRace={onResumeRace}
                        onCancelRace={onCancelRace}
                    />
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
    );
};

export default RaceHeaderHost;