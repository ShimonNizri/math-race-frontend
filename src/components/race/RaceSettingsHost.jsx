import React, { useState, useRef, useEffect, memo } from 'react';
import { FaGear, FaCheck, FaPause, FaPlay, FaXmark } from "react-icons/fa6";
import ConfirmModal from '../ui/ConfirmModal';
import './RaceSettingsHost.css';

const RaceSettingsHost = ({currentNickname, currentRaceName, isPaused, isPending,
                              onChangeNickname, onChangeRaceName, onPauseRace,
                              onResumeRace, onCancelRace}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [nicknameInput, setNicknameInput] = useState("");
    const [raceNameInput, setRaceNameInput] = useState("");
    const [confirmAction, setConfirmAction] = useState(null);
    const [localError, setLocalError] = useState("");

    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                if (!confirmAction) {
                    setIsOpen(false);
                    setLocalError("");
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [confirmAction]);

    const handleOpenToggle = () => {
        if (!isOpen) {
            setNicknameInput(currentNickname || "");
            setRaceNameInput(currentRaceName || "");
            setLocalError("");
        }
        setIsOpen(!isOpen);
    };

    const validateName = (name, fieldName) => {
        if (!name || name.trim() === "") return `${fieldName} is required`;
        if (name.length > 15) return `${fieldName} cannot exceed 15 characters`;
        if (!/^(?:.*\S){3}.*$/.test(name)) return `${fieldName} must contain at least 3 actual characters`;
        if (!/^\S.*\S$/.test(name)) return `${fieldName} must not start or end with a space`;
        return null;
    };

    const handleUpdateNickname = (e) => {
        e.preventDefault();
        setLocalError("");

        const error = validateName(nicknameInput, "Nickname");
        if (error) {
            setLocalError(error);
            return;
        }

        if (nicknameInput !== currentNickname) {
            if (onChangeNickname) onChangeNickname(nicknameInput);
            setIsOpen(false);
        }
    };

    const handleUpdateRaceName = (e) => {
        e.preventDefault();
        setLocalError("");

        const error = validateName(raceNameInput, "Race Name");
        if (error) {
            setLocalError(error);
            return;
        }

        if (raceNameInput !== currentRaceName) {
            if (onChangeRaceName) onChangeRaceName(raceNameInput);
            setIsOpen(false);
        }
    };

    const executeConfirmedAction = () => {
        if (confirmAction === 'PAUSE') onPauseRace();
        else if (confirmAction === 'RESUME') onResumeRace();
        else if (confirmAction === 'CANCEL') onCancelRace();

        setConfirmAction(null);
        setIsOpen(false);
    };

    const getModalMessage = () => {
        switch (confirmAction) {
            case 'PAUSE': return 'Are you sure you want to pause the race?';
            case 'RESUME': return 'Are you sure you want to resume the race?';
            case 'CANCEL': return 'Are you sure you want to completely cancel the race? All progress will be lost (this action cannot be undone!).';
            default: return '';
        }
    };

    return (
        <div className="race-settings-wrapper" ref={wrapperRef}>
            <button className={`settings-tab-btn ${isOpen ? 'active' : ''}`} onClick={handleOpenToggle} title="Host Settings">
                <FaGear className="gear-icon" />
            </button>

            {isOpen && (
                <div className="settings-dropdown-panel game-card">
                    <h3 className="settings-title">Host Settings</h3>

                    {localError && <div style={{ color: 'red', fontSize: '12px', marginBottom: '10px', textAlign: 'center' }}>{localError}</div>}

                    <div className="settings-section">
                        <label className="settings-label">Change Host Nickname:</label>
                        <form className="nickname-input-group" onSubmit={handleUpdateNickname}>
                            <input
                                type="text"
                                className="nickname-input"
                                value={nicknameInput}
                                onChange={(e) => setNicknameInput(e.target.value)}
                                placeholder="New nickname..."
                                required
                                minLength={3}
                                maxLength={15}
                                pattern={"^\\S.*\\S$"}
                                title="Nickname must be 3-15 characters and cannot start or end with a space"
                            />
                            <button type="submit" className="nickname-update-btn" title="Update nickname">
                                <FaCheck />
                            </button>
                        </form>
                    </div>

                    <div className="settings-section">
                        <label className="settings-label">Change Race Name:</label>
                        <form className="nickname-input-group" onSubmit={handleUpdateRaceName}>
                            <input
                                type="text"
                                className="nickname-input"
                                value={raceNameInput}
                                onChange={(e) => setRaceNameInput(e.target.value)}
                                placeholder="New race name..."
                                required
                                minLength={3}
                                maxLength={15}
                                pattern={"^\\S.*\\S$"}
                                title="Race name must be 3-15 characters and cannot start or end with a space"
                            />
                            <button type="submit" className="nickname-update-btn" title="Update race name">
                                <FaCheck />
                            </button>
                        </form>
                    </div>

                    <div className="settings-divider"></div>

                    <div className="settings-section host-actions-section">
                        {!isPending && (
                            <button
                                className="settings-action-btn orange-btn"
                                onClick={() => setConfirmAction(isPaused ? 'RESUME' : 'PAUSE')}
                            >
                                {isPaused ? <><FaPlay className="action-icon"/> Resume Race</> : <><FaPause className="action-icon"/> Pause Race</>}
                            </button>
                        )}
                        <button
                            className="settings-action-btn red-btn"
                            onClick={() => setConfirmAction('CANCEL')}
                        >
                            <FaXmark className="action-icon"/> Cancel Race
                        </button>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={!!confirmAction}
                message={getModalMessage()}
                onConfirm={executeConfirmedAction}
                onCancel={() => setConfirmAction(null)}
            />
        </div>
    );
};

export default memo(RaceSettingsHost);