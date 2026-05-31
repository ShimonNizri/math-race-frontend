import React, { memo, useState } from "react";
import Button from "../ui/Button.jsx";
import { FaShareNodes } from "react-icons/fa6"; /* הוסר ה-FaXmark */
import { FaCheck, FaCopy } from "react-icons/fa";
import myLogo from "../../../public/logo.png";
import { QRCode } from 'react-qrcode-logo';

import './RaceLobby.css';
import RaceHeaderHost from "./RaceHeaderHost.jsx";
import RaceHeaderPlayer from "./RaceHeaderPlayer.jsx";

const PlayerAvatar = memo(({ player }) => { /* הוסרו isHost ו-onKick מהפרופס כי הם כבר לא בשימוש כאן */
    const isOnline = player.online !== false;
    const initial = player.nickname ? player.nickname.charAt(0).toUpperCase() : '?';

    const avatarStyle = {
        border: `4px solid ${player.carColor || 'var(--blue)'}`,
        boxShadow: `0 6px 0 ${player.carColor || 'var(--blue)'}`,
        backgroundColor: 'var(--code-bg)',
    };

    return (
        <div className="player-avatar-wrapper">
            <div className="avatar-circle" style={avatarStyle}>
                {initial}
                {/* כפתור ה-Kick (ה-X האדום) הוסר מכאן */}
            </div>

            <div className="avatar-names">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <span className="avatar-nickname">{player.nickname}</span>
                    {/* הוספת המחלקות שתואמות ל-CSS כדי לקבל את האפקט של ההבהוב */}
                    <div className={`status-dot ${isOnline ? 'online' : 'offline'}`}></div>
                </div>

                {player.userName ? (
                    <span className="avatar-username username-blue">@{player.userName}</span>
                ) : (
                    <span className="avatar-username username-ghost">-Ghost-</span>
                )}
            </div>
        </div>
    );
});


function RaceLobby({
                       raceState,
                       onStartRace,
                       isHost,
                       onKickPlayer,
                       onCancelRace,
                       onChangeRaceName,
                       onChangeNickname,
                       onLeaveRace,
                       messages = []
                   }) {
    const inviteLink = `${window.location.origin}/race/join?code=${raceState.roomCode}`;

    const [copyCodeSuccess, setCopyCodeSuccess] = useState(false);
    const [shareCopySuccess, setShareCopySuccess] = useState(false);

    const displayPlayers = [...(raceState.players || [])];
    if (!isHost && raceState.myAccount) {
        const isMeInList = displayPlayers.some(p => p.id === raceState.myAccount.id);
        if (!isMeInList) {
            displayPlayers.unshift(raceState.myAccount);
        }
    }

    const performCopy = async (textToCopy) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(textToCopy);
                return true;
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = textToCopy;
                textArea.style.position = "fixed";
                textArea.style.opacity = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    return true;
                } catch (err) {
                    console.error('Fallback copy failed', err);
                    document.body.removeChild(textArea);
                    return false;
                }
            }
        } catch (err) {
            console.error('Failed to copy text: ', err);
            return false;
        }
    };

    const handleCopyCodeClick = async () => {
        const success = await performCopy(raceState.roomCode);
        if (success) {
            setCopyCodeSuccess(true);
            setTimeout(() => setCopyCodeSuccess(false), 2000);
        }
    };

    const handleShareClick = async () => {
        const shareData = {
            title: '🏎️ Join the Math Race!',
            text: `🏎️ *Join the Math Race!*\n\nA new room is open and waiting for players in the lobby! 🏆\nLet's see who wins.\nRoom Code: ${raceState.roomCode}`,
            url: inviteLink
        };

        const fallbackText = inviteLink;

        if (navigator.share && window.isSecureContext) {
            try {
                await navigator.share(shareData);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    const success = await performCopy(fallbackText);
                    if (success) {
                        setShareCopySuccess(true);
                        setTimeout(() => setShareCopySuccess(false), 2000);
                    }
                }
            }
        } else {
            const success = await performCopy(fallbackText);
            if (success) {
                setShareCopySuccess(true);
                setTimeout(() => setShareCopySuccess(false), 2000);
            } else {
                alert("Could not share or copy link.");
            }
        }
    };

    return (
        <>
            {isHost ? (
                <RaceHeaderHost
                    raceState={raceState}
                    livePlayers={raceState.players}
                    localTimeLeft={raceState.totalDurationMillis}
                    onKickPlayer={onKickPlayer}
                    onCancelRace={onCancelRace}
                    onChangeNickname={onChangeNickname}
                    onChangeRaceName={onChangeRaceName}
                />
            ) : (
                <RaceHeaderPlayer
                    raceState={raceState}
                    localPlayer={raceState.myAccount}
                    localTimeLeft={raceState.totalDurationMillis}
                    onChangeNickname={onChangeNickname}
                    onLeaveRace={onLeaveRace}
                    messages={messages}
                />
            )}

            <div className="lobby-fullscreen-layout">
                {/* אזור מרכזי - רשימת שחקנים */}
                <main className="lobby-center-arena">
                    <div className="arena-header">
                        <h2>Players Joined <span className="player-count-badge">{displayPlayers.length}</span></h2>
                    </div>

                    <div className="players-scroll-area">
                        {displayPlayers.length === 0 ? (
                            <div className="empty-arena">
                                <p>No players yet. Waiting...</p>
                            </div>
                        ) : (
                            <div className="avatars-grid">
                                {displayPlayers.map(player => (
                                    <PlayerAvatar
                                        key={player.id}
                                        player={player}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                {/* בר צד ימין - הזמנה וברקוד */}
                <aside className="lobby-sidebar right-sidebar">
                    <div className="invite-dashed-box">
                        <p className="invite-title">Invite Players</p>
                        <h2 className="massive-code">{raceState.roomCode}</h2>

                        <div className="qr-wrapper">
                            <QRCode
                                value={inviteLink}
                                size={160}
                                logoImage={myLogo}
                                logoWidth={45}
                                logoHeight={22}
                                logoOpacity={1}
                                removeQrCodeBehindLogo={true}
                                logoPadding={4}
                                qrStyle="squares"
                                ecLevel="M"
                                eyeRadius={8}
                                quietZone={10}
                                bgColor="#FFFFFF"
                                fgColor="#1e293b"
                            />
                        </div>

                        <div className="invite-actions">
                            <Button
                                onClick={handleCopyCodeClick}
                                title="Copy Code"
                                className={copyCodeSuccess ? "success-btn" : ""}
                            >
                                {copyCodeSuccess ? (
                                    <><FaCheck style={{ marginRight: '6px' }} /> Copied!</>
                                ) : (
                                    <><FaCopy style={{ marginRight: '6px' }} /> Copy</>
                                )}
                            </Button>

                            <Button
                                onClick={handleShareClick}
                                title="Share Room"
                                className={shareCopySuccess ? "success-btn" : ""}
                            >
                                {shareCopySuccess ? (
                                    <><FaCheck style={{ marginRight: '6px' }} /> Link Copied!</>
                                ) : (
                                    <><FaShareNodes style={{ marginRight: '6px' }} /> Share</>
                                )}
                            </Button>
                        </div>

                        {/* החלק החדש של השליטה בתחתית הפאנל */}
                        <div className="lobby-action-section">
                            {isHost ? (
                                <Button
                                    className="start-massive-btn"
                                    onClick={onStartRace}
                                    disabled={raceState.players.length < 2} /* מוודא שיש לפחות 2 שחקנים סה"כ */
                                >
                                    Start Race
                                </Button>
                            ) : (
                                <div className="waiting-for-host-msg">
                                    Waiting for host to start the game...
                                </div>
                            )}
                        </div>

                    </div>
                </aside>
            </div>
        </>
    );
}

export default RaceLobby;