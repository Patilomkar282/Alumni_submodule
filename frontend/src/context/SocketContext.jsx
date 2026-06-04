import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

const ENDPOINT = import.meta.env.VITE_API_URL;

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('userInfo')));

    // Call State
    const [receivingCall, setReceivingCall] = useState(false);
    const [caller, setCaller] = useState("");
    const [callerSignal, setCallerSignal] = useState();
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [name, setName] = useState("");
    const [isInCall, setIsInCall] = useState(false);
    const [stream, setStream] = useState(null);

    useEffect(() => {
        // Re-check user on mount/update (in case of login/logout)
        const checkUser = () => {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            setUser(userInfo);
        };

        // Listen for storage changes (login/logout in other tabs)
        window.addEventListener('storage', checkUser);
        // Listen for internal app updates (like profile update)
        window.addEventListener('user-updated', checkUser);

        checkUser(); // Initial check

        return () => {
            window.removeEventListener('storage', checkUser);
            window.removeEventListener('user-updated', checkUser);
        };
    }, []);

    useEffect(() => {
        if (user && user._id) {
            const newSocket = io(ENDPOINT);
            setSocket(newSocket);

            newSocket.on("connect", () => {
                console.log("Socket Connected:", newSocket.id);
            });

            newSocket.on("connect_error", (err) => {
                console.error("Socket Connection Error:", err);
            });

            newSocket.emit("join_room", user._id);

            newSocket.on("callUser", (data) => {
                console.log("Incoming call from:", data.name);
                setReceivingCall(true);
                setCaller(data.from);
                setName(data.name);
                setCallerSignal(data.signal);
            });

            newSocket.on("endCall", () => {
                handleEndCallCleanup();
            });

            return () => {
                newSocket.disconnect();
            };
        }
    }, [user]);

    const handleEndCallCleanup = () => {
        try {
            // ─── 1. Stop all media tracks ─────────────────────────────────────────
            if (stream) {
                stream.getTracks().forEach(track => {
                    try {
                        track.stop();
                        console.log(`[Cleanup] Stopped ${track.kind} track`);
                    } catch (err) {
                        console.error(`[Cleanup] Error stopping ${track.kind} track:`, err);
                    }
                });
                setStream(null);
            }

            // ─── 2. Reset call state ──────────────────────────────────────────────
            setCallEnded(true);
            setIsInCall(false);
            setReceivingCall(false);
            setCallAccepted(false);
            setCaller("");
            setName("");
            setCallerSignal(null);
            setCallStartTime(null);

            console.log('[Cleanup] Call state reset complete');
        } catch (err) {
            console.error('[Cleanup] Error during cleanup:', err);
        }
    };

    const answerCall = () => {
        setCallAccepted(true);
        setIsInCall(true);
        setReceivingCall(false);
    };

    const declineCall = () => {
        setReceivingCall(false);
        if (socket && caller) {
            socket.emit("endCall", { to: caller });
        }
        handleEndCallCleanup();
    };

    const [callStartTime, setCallStartTime] = useState(null);
    const [onlineStatuses, setOnlineStatuses] = useState({}); // { userId: status }

    useEffect(() => {
        if (socket) {
            const handleStatusUpdate = (data) => {
                setOnlineStatuses(prev => ({ ...prev, [data.userId]: data.status }));
            };

            socket.on("status_updated", handleStatusUpdate);
            return () => socket.off("status_updated", handleStatusUpdate);
        }
    }, [socket]);

    const saveCallLog = async (recipientId, status, duration) => {
        try {
            const token = JSON.parse(localStorage.getItem('token')); // Assuming token is stored here
            // If token is not in localStorage directly, might be in userInfo
            // But let's check how other requests are made. 
            // The user didn't show other API calls in this file. 
            // Let's assume standard Bearer token in headers.

            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token || JSON.parse(localStorage.getItem('userInfo'))?.token}`,
                },
            };

            const response = await fetch(`${ENDPOINT}/api/messages`, {
                method: 'POST',
                headers: config.headers,
                body: JSON.stringify({
                    recipientId: recipientId,
                    content: status === 'missed' ? 'Missed Video Call' : 'Video Call',
                    type: 'video_call',
                    callDuration: duration,
                    callStatus: status
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save call log');
            }

            const data = await response.json();
            console.log("Call log saved:", data);
        } catch (error) {
            console.error("Error saving call log:", error);
        }
    };

    return (
        <SocketContext.Provider value={{
            socket,
            user,
            receivingCall,
            caller,
            callerSignal,
            callAccepted,
            callEnded,
            name,
            isInCall,
            stream,
            setStream,
            setCallAccepted,
            setIsInCall,
            setCallEnded,
            setReceivingCall,
            answerCall,
            declineCall,
            handleEndCallCleanup,
            saveCallLog,
            callStartTime,
            setCallStartTime,
            onlineStatuses,
            setOnlineStatuses
        }}>
            {children}
        </SocketContext.Provider>
    );
};
