import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { WebSocketContext } from './WebSocketContext.js';
import { cookieService } from '../cookieService.js';
import {createGuestToken} from "../authService.js";

function WebSocketProvider({ children }) {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const [error, setError] = useState(null);
    const [authToken, setAuthToken] = useState(cookieService.getAuthToken());
    const [guestToken, setGuestToken] = useState(cookieService.getGuestToken());

    const clientRef = useRef(null);
    const hasRecovered = useRef(false);

    const updateAuthToken = useCallback((newToken, dayToSave) => {
        if (newToken) {
            console.log("New Auth-Token Update", newToken);
            cookieService.setAuthToken(newToken, dayToSave);
        } else {
            cookieService.removeAuthToken();
        }
        setAuthToken(newToken);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);
    const clearLastMessage = useCallback(() => {
        setLastMessage(null);
    }, []);

    const updateGuestToken = useCallback((newGuestToken,dayToSave) => {
        if (newGuestToken) {
            console.log("New Guest-Token Update", newGuestToken);
            cookieService.setGuestToken(newGuestToken, dayToSave);
        } else {
            cookieService.removeGuestToken();
        }
        setGuestToken(newGuestToken);
    }, []);



    useEffect(() => {
        //if (!authToken && !guestToken) return;

        const client = new Client({
            brokerURL: 'ws://localhost:8085/api/ws-race',
            connectHeaders: {
                Authorization: authToken ? `Bearer ${authToken}` : '',
                GuestToken: guestToken || ''
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,

            onConnect: () => {
                console.log("WS Connected!");
                setIsConnected(true);
                clearLastMessage();
                clearError();
                hasRecovered.current = false;

                client.subscribe('/user/queue/notifications', (message) => {
                    const data = JSON.parse(message.body);

                    if (data.type === 'ERROR') {
                        setError(data.content + " מפה 4 ");
                    } else {
                        setLastMessage(data);
                    }
                });
            },

            onDisconnect: () => {
                console.log("WS Disconnected");
                setIsConnected(false);
            },

            onStompError: async (frame) => {
                const errorMsg = frame.headers['message'];
                setIsConnected(false);

                if (!hasRecovered.current && (errorMsg === "MISSING_IDENTIFICATION" || errorMsg === "AUTH_FAILED")) {
                    console.log(errorMsg);
                    console.log("Recovering directly from error event...");
                    try {
                        const response = await createGuestToken();

                        if (response.success) {
                            updateGuestToken(response.data.guestToken,response.data.dayToSave);
                            updateAuthToken(null,null);
                            setError(null);
                            console.log("Recovered successfully with Guest ID:", response.data.guestToken);
                        } else {
                            setError(errorMsg + " מפה 2 ");
                        }
                    } catch (err) {
                        console.error("Failed to fetch Guest ID:", err);
                        setError("SERVER_ERROR");
                    }
                } else {
                    setError(errorMsg + " הגיע ממני כן ");
                }
            },
            onWebSocketClose: (event) => {
                if (event.reason && event.reason.startsWith("DUPLICATE_RACE_CONNECTION")) {
                    setError(event.reason + " מפה 3 ");
                }

                console.log("WS WebSocket Closed!");

                setIsConnected(false);
            },
        });

        client.activate();
        clientRef.current = client;

        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
                setIsConnected(false);
            }
        };
    }, [authToken, guestToken]);

    const sendMessage = useCallback((destination, body) => {
        if (clientRef.current && isConnected) {
            clientRef.current.publish({
                destination,
                body: JSON.stringify(body)
            });
        }
    }, [isConnected]);

    const subscribe = useCallback((destination, callback, joinToken = null) => {
        if (clientRef.current && isConnected) {

            const headers = {};
            if (joinToken) {
                headers['Join-Token'] = joinToken;
            }

            const subscription = clientRef.current.subscribe(destination, (message) => {
                callback(JSON.parse(message.body));
            }, headers);

            return () => subscription.unsubscribe();
        }
        return () => {};
    }, [isConnected]);

    return (
        <WebSocketContext.Provider value={{
            isConnected,
            lastMessage,
            clearLastMessage,
            error,
            clearError,
            sendMessage,
            subscribe,
            updateAuthToken
        }}>
            {children}
        </WebSocketContext.Provider>
    );
}

export default WebSocketProvider;