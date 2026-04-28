const unsubscribeQueue = subscribe(queue, (data) => {
        console.log("קיבלנו הודעה חדשה מהסוקט:", data);
        if (data.type === 'RACE_FULL_STATE') {

            const myPlayer = data.data.players.find(p => p.id === data.data.yourAccountId);

            setRaceState({
                name: data.data.name,
                roomCode: data.data.roomCode,
                targetScore: data.data.targetScore,
                status: data.data.status,
                totalDurationMillis: data.data.totalDurationMillis,
                remainingTimeMs: data.data.remainingTimeMs,
                receivedAt: Date.now(),

                myAccount: myPlayer ? {
                    id: myPlayer.id,
                    userName: myPlayer.userName,
                    nickname: myPlayer.nickname,
                    carColor: myPlayer.carColor,
                    currentScore: myPlayer.currentScore,
                    online: myPlayer.online,
                    trackState: myPlayer.trackState,

                    currentQuestion: myPlayer.currentQuestion ? {
                        expression: myPlayer.currentQuestion.expression,
                        options: myPlayer.currentQuestion.options,
                        timeLimitMillis: myPlayer.currentQuestion.timeLimitMillis,
                        questionRemainingTimeMillis: myPlayer.currentQuestion.questionRemainingTimeMillis,
                        score: myPlayer.currentQuestion.score,
                        receivedAt: Date.now()
                    } : null,

                    currentJunction: myPlayer.currentJunction ? {
                        expression: myPlayer.currentJunction.expression,
                        offer1: myPlayer.currentJunction.offer1,
                        offer2: myPlayer.currentJunction.offer2,
                        timeLimitMillis: myPlayer.currentJunction.timeLimitMillis,
                        questionRemainingTimeMillis: myPlayer.currentJunction.questionRemainingTimeMillis,
                        receivedAt: Date.now()
                    } : null

                } : null,

                host: {
                    id: data.data.host.id,
                    userName: data.data.host.userName,
                    nickname: data.data.host.nickname,
                    online: data.data.host.online
                },

                players: data.data.players
                    .filter(player => player.id !== data.data.yourAccountId)
                    .map(player => ({
                        id: player.id,
                        userName: player.userName,
                        nickname: player.nickname,
                        carColor: player.carColor,
                        currentScore: player.currentScore,
                        online: player.online,
                    }))
            });











        } else if (data.type === 'JUNCTION_OFFERED') {
            // השחקן קיבל הצעת צומת!
            setRaceState(prevState => {
                if (!prevState) return null;
                return {
                    ...prevState,
                    players: prevState.players.map(player => {
                        if (player.id === accountId) {
                            return {
                                ...player,
                                currentQuestion: null, // מוודאים שאין שאלה
                                currentJunctionOffer: data.data, // שומרים את ההצעה!
                                trackState: data.data.state,
                            };
                        }
                        return player;
                    })
                };
            });
        } else if (data.type === 'JUNCTION_CHOOSE' || data.type === 'JUNCTION_TIMEOUT') {
            // השחקן סיים לבחור (או שנגמר הזמן)
            setRaceState(prevState => {
                if (!prevState) return null;
                return {
                    ...prevState,
                    players: prevState.players.map(player => {
                        if (player.id === accountId) {
                            return {
                                ...player,
                                currentJunctionOffer: null, // מנקים את ההצעה
                                trackState: data.data.state, // מעדכנים את המסלול החדש (אופציונלי, אבל מומלץ לתצוגה)
                                totalTrackQuestions: data.data.totalTrackQuestions,
                            };
                        }
                        return player;
                    })
                };
            });
        } else if (data.type === 'TRACK_STATE_CHANGED') {
            // השרת הודיע שחזרנו למסלול הרגיל (או עברנו מסלול)
            setRaceState(prevState => {
                if (!prevState) return null;
                return {
                    ...prevState,
                    players: prevState.players.map(player => {
                        if (player.id === accountId) {
                            return {
                                ...player,
                                trackState: data.data.state,
                                totalTrackQuestions: data.data.totalTrackQuestions,
                            };
                        }
                        return player;
                    })
                };
            });
        } else if (data.type === 'NEW_QUESTION') {
            setRaceState(prevState => {
                if (!prevState) return null;
                return {
                    ...prevState,
                    players: prevState.players.map(player => {
                        if (player.id === accountId) {
                            return {
                                ...player,
                                currentQuestion: data.data
                            };
                        }
                        return player;
                    })
                };
            });
        }else if (data.type === 'CORRECT_ANSWER' || data.type === 'WRONG_ANSWER' || data.type === 'TIMEOUT') {
            setRaceState(prevState => {
                if (!prevState) return null;
                return {
                    ...prevState,
                    players: prevState.players.map(player => {
                        if (player.id === accountId) {
                            return {
                                ...player,
                                currentQuestion: null,
                                currentScore: player.currentScore + data.data.score
                            };
                        }
                        return player;
                    })
                };
            });
        }else if (data.type === 'ERROR') {
            alert(data.content);
        }
    }
);




const topic = `/topic/race/${roomCode}/updates`;

const unsubscribeTopic = subscribe(topic, (data) => {
        console.log("קיבלנו הודעה חדשה מהסוקט:", data);
        if (data.type === 'PLAYER_JOINED') {
            setRaceState(prevState => {
                if (!prevState) return null;

                const isPlayerExists = prevState.players.some(player => player.id === data.data.player.id);

                if (isPlayerExists) {
                    return prevState;
                }

                return {
                    ...prevState,
                    players: [...prevState.players, data.data.player]
                };
            });
        } else if (data.type === 'PLAYER_CONNECTION') {
            setRaceState(prevState => {
                if (!prevState) return null;
                return {
                    ...prevState,
                    players: prevState.players.map(p =>
                        p.id === data.data.id ? {
                            ...p,
                            online: data.data.online,
                            nickname : data.data.nickname
                        } : p
                    )
                };
            });
        } else if (data.type === 'HOST_CONNECTION') {
            setRaceState(prevState => {
                if (!prevState) return null;
                return {
                    ...prevState,
                    host : {
                        ...prevState.host,
                        online: data.data.online,
                        nickname: data.data.nickname
                    }
                };
            });
        } else if (data.type === 'RACE_START' || data.type === 'RACE_PAUSED' || data.type === 'RACE_RESUMED' ||
            data.type === 'RACE_CANCELLED') {
            setRaceState(prevState => {
                if (!prevState) return null;
                return {
                    ...prevState,
                    status: data.data.status
                }
            })
        } else if (data.type === 'RACE_COMPLETED'){
            setRaceState(prevState => {
                if (!prevState) return null;
                return {
                    ...prevState,
                    status: data.data.status,
                    players: data.data.players
                }
            })
        }

    }, joinToken
);