import React, { createContext, useContext, useRef, useCallback, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@env';

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
    const wsRef = useRef(null);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    const initWebSocket = useCallback(async () => {
        try {
            console.log("[WebSocket] Initializing...");
            const accessToken = await AsyncStorage.getItem('token');
            console.log("[WebSocket] Token:", accessToken ? "Exists" : "Missing");
            if (!accessToken) return;
            console.log("BASE_URL:", BASE_URL); 
            const protocol = BASE_URL.startsWith('https') ? 'wss' : 'ws';
            const host = BASE_URL.replace(/https?:\/\//, '');
            const wsUrl = `${protocol}://${host}/ws/chat/?token=${accessToken}`;
            console.log("[WebSocket] Connecting to:", wsUrl);

            const socket = new WebSocket(wsUrl);
            wsRef.current = socket;

            socket.onopen = () => {
                console.log('WebSocket connected');
                reconnectAttempts.current = 0;
            };

            socket.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    if (data.message) {
                        setUnreadMessages(prev => prev + 1);
                    }
                } catch (error) {
                    console.error('Error processing WebSocket message:', error);
                }
            };

            socket.onclose = () => {
                console.log('WebSocket closed');
                if (reconnectAttempts.current < maxReconnectAttempts) {
                    const delay = Math.min(5000 * (reconnectAttempts.current + 1), 30000);
                    setTimeout(() => {
                        reconnectAttempts.current += 1;
                        console.log(`Reconnecting WebSocket, attempt ${reconnectAttempts.current}`);
                        initWebSocket();
                    }, delay);
                } else {
                    console.log('Max reconnection attempts reached');
                }
            };

            socket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (error) {
            console.error('Error initializing WebSocket:', error);
        }
    }, []);

    useEffect(() => {
        initWebSocket();
        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, [initWebSocket]);

    return (
        <WebSocketContext.Provider value={{ wsRef, unreadMessages, setUnreadMessages }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => useContext(WebSocketContext);