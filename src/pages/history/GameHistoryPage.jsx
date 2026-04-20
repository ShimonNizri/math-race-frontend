import React, { useEffect, useState } from 'react';
import { myHistory, myFullHistory } from '../../services/userProfileService';

import styles from './GameHistoryPage.module.css';

function GameHistoryPage() {
    const [historyList, setHistoryList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [expandedGameId, setExpandedGameId] = useState(null);
    const [expandedGameData, setExpandedGameData] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await myHistory();
                if (response.success) {
                    setHistoryList(response.data);
                }
            } catch (err) {
                setError("Failed to load game history.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const handleGameClick = async (gameId) => {
        if (expandedGameId === gameId) {
            setExpandedGameId(null);
            setExpandedGameData(null);
            return;
        }

        setExpandedGameId(gameId);
        setExpandedGameData(null);
        setLoadingDetails(true);

        try {
            const response = await myFullHistory(gameId);
            if (response.success) {
                setExpandedGameData(response.data);
            }
        } catch (err) {
            console.error("Failed to load game details", err);
        } finally {
            setLoadingDetails(false);
        }
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    // 2. עדכון הפונקציה שתחזיר את המחלקות מתוך אובייקט ה-styles
    const getRankBadgeClass = (rank) => {
        if (rank === 1) return styles.rankGold;
        if (rank === 2) return styles.rankSilver;
        if (rank === 3) return styles.rankBronze;
        return styles.rankRegular;
    };

    if (loading) return <div className={styles.historyStatus}>Loading history...</div>;
    if (error) return <div className={`${styles.historyStatus} ${styles.error}`}>{error}</div>;
    if (historyList.length === 0) return <div className={styles.historyStatus}>No games played yet!</div>;

    return (
        <div className={styles.gameHistoryContainer}>
            <h2 className={styles.historyTitle}>Game History</h2>

            <div className={styles.historyList}>
                {historyList.map((game) => (
                    <div
                        key={game.id}
                        // שילוב של מחלקות דינמיות
                        className={`${styles.historyCard} ${expandedGameId === game.id ? styles.expanded : ''}`}
                        onClick={() => handleGameClick(game.id)}
                    >
                        <div className={styles.historyCardHeader}>
                            <div className={styles.historyInfoMain}>
                                <h3>{game.name}</h3>
                                <span className={styles.historyDate}>{formatDate(game.createdAtMs)}</span>
                            </div>
                            <div className={styles.historyInfoStats}>
                                <div className={`${styles.rankBadge} ${getRankBadgeClass(game.rank)}`}>
                                    #{game.rank}
                                </div>
                                <div className={styles.scoreBadge}>
                                    Target: {game.targetScore}
                                </div>
                            </div>
                        </div>

                        {expandedGameId === game.id && (
                            <div className={styles.historyCardDetails} onClick={(e) => e.stopPropagation()}>
                                <hr className={styles.detailsDivider} />

                                {loadingDetails ? (
                                    <div className={styles.detailsLoading}>Loading game stats...</div>
                                ) : expandedGameData ? (
                                    <div className={styles.detailsContent}>

                                        <div className={styles.statsGrid}>
                                            <div className={styles.statBox}>
                                                <span className={styles.statLabel}>Accuracy</span>
                                                <span className={styles.statValue}>{expandedGameData.accuracyPercentage}%</span>
                                            </div>
                                            <div className={styles.statBox}>
                                                <span className={styles.statLabel}>Avg. Time</span>
                                                <span className={styles.statValue}>{(expandedGameData.averageResponseTimeMs / 1000).toFixed(1)}s</span>
                                            </div>
                                            <div className={styles.statBox}>
                                                <span className={styles.statLabel}>Participants</span>
                                                <span className={styles.statValue}>{expandedGameData.summary.totalParticipants}</span>
                                            </div>
                                            <div className={styles.statBox}>
                                                <span className={styles.statLabel}>Host</span>
                                                <span className={styles.statValue}>{expandedGameData.summary.hostNickname}</span>
                                            </div>
                                        </div>

                                        <h4 className={styles.leaderboardTitle}>Match Leaderboard</h4>
                                        <div className={styles.matchLeaderboard}>
                                            {expandedGameData.playerHistory.map((player, idx) => (
                                                <div key={idx} className={`${styles.leaderboardRow} ${player.nickname === game.userName ? styles.isMe : ''}`}>
                                                    <div className={styles.playerRank}>#{player.rank}</div>
                                                    <div className={styles.playerName}>
                                                        {player.nickname}
                                                        {player.streakMaster && ' 🔥'}
                                                    </div>
                                                    <div className={styles.playerScore}>{player.finalScore} pts</div>
                                                </div>
                                            ))}
                                        </div>

                                    </div>
                                ) : (
                                    <div className={styles.detailsError}>Failed to load detailed stats.</div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default GameHistoryPage;