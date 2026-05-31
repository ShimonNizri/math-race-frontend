import React, {useState, useRef, useEffect, memo} from 'react';
import { FaGear, FaRightFromBracket, FaCheck } from "react-icons/fa6";
import './RaceSettingsPlayer.css';

const RaceSettingsPlayer = ({ currentNickname, onChangeNickname, onLeaveRace }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [nicknameInput, setNicknameInput] = useState("");
    const [localError, setLocalError] = useState("");
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                setLocalError("");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleOpenToggle = () => {
        if (!isOpen) {
            setNicknameInput(currentNickname || "");
            setLocalError("");
        }
        setIsOpen(!isOpen);
    };

    const validateName = (name) => {
        if (!name || name.trim() === "") return "Nickname is required";
        if (name.length > 15) return "Nickname cannot exceed 15 characters";
        if (!/^(?:.*\S){3}.*$/.test(name)) return "Nickname must contain at least 3 actual characters";
        if (!/^\S.*\S$/.test(name)) return "Nickname must not start or end with a space";
        return null;
    };

    const handleUpdate = (e) => {
        if (e) e.preventDefault();
        setLocalError("");

        const error = validateName(nicknameInput);
        if (error) {
            setLocalError(error);
            return;
        }

        if (nicknameInput !== currentNickname) {
            if (onChangeNickname) onChangeNickname(nicknameInput);
        }

        setIsOpen(false);
    };

    // פונקציה חדשה שתופסת את האנטר בצורה ישירה
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // מונע קפיצות או ריענון
            handleUpdate(e);
        }
    };

    return (
        <div className="race-settings-wrapper" ref={wrapperRef}>
            <button className={`settings-tab-btn ${isOpen ? 'active' : ''}`} onClick={handleOpenToggle} title="Settings">
                <FaGear className="gear-icon" />
            </button>

            {isOpen && (
                <div className="settings-dropdown-panel game-card">
                    <h3 className="settings-title">Settings</h3>

                    {localError && <div style={{ color: 'red', fontSize: '12px', marginBottom: '10px', textAlign: 'center', fontWeight: 'bold' }}>{localError}</div>}

                    <div className="settings-section">
                        <label className="settings-label">Change Nickname:</label>

                        {/* שינוי חשוב: הפכנו את ה-form ל-div והעברנו את השליטה המלאה לידיים שלנו */}
                        <div className="nickname-input-group">
                            <input
                                type="text"
                                className="nickname-input"
                                value={nicknameInput}
                                onChange={(e) => setNicknameInput(e.target.value)}
                                onKeyDown={handleKeyDown} /* קורא לפונקציה שבודקת האם נלחץ אנטר */
                                placeholder="New nickname..."
                            />
                            <button type="button" className="nickname-update-btn" onClick={handleUpdate} title="Update">
                                <FaCheck />
                            </button>
                        </div>
                    </div>

                    <div className="settings-divider"></div>

                    <div className="settings-section">
                        <button type="button" className="settings-leave-btn" onClick={onLeaveRace}>
                            <FaRightFromBracket style={{ marginRight: '8px' }}/>
                            Leave Race
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default memo(RaceSettingsPlayer);