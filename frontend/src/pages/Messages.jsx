import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, MoreVertical, Phone, Video, Info, PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff, Users, Plus, Paperclip, Check, CheckCheck, Play, Pause, Trash2, FileText, ShieldAlert, AlertTriangle, X } from 'lucide-react';
import SimplePeer from 'simple-peer';
import { Buffer } from 'buffer';
import { useSocket } from '../context/SocketContext'; // Import hook
import CreateGroupModal from '../components/CreateGroupModal';
import InviteMemberModal from '../components/InviteMemberModal';
import GroupCallRoom from '../components/GroupCallRoom';
import { motion, AnimatePresence } from 'framer-motion';

// Polyfill Buffer for simple-peer
if (typeof window !== 'undefined') {
    window.Buffer = window.Buffer || Buffer;
}

const CustomAudioPlayer = ({ fileUrl, isMe }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const currentProgress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setProgress(currentProgress);
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
    };

    return (
        <div className="flex items-center gap-3 bg-black/10 p-2 rounded-full pr-4 mt-1">
            <audio 
                ref={audioRef} 
                src={fileUrl} 
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                className="hidden"
            />
            <button 
                onClick={togglePlay}
                className={`p-2 rounded-full ${isMe ? 'bg-white text-indigo-600' : 'bg-indigo-100 text-indigo-600'}`}
            >
                {isPlaying ? <Pause className="w-4 h-4 ml-0.5" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <div className="w-24 h-1 bg-white/30 rounded-full cursor-pointer relative" onClick={(e) => {
                if(!audioRef.current) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const clickPos = (e.clientX - rect.left) / rect.width;
                audioRef.current.currentTime = clickPos * audioRef.current.duration;
            }}>
                <div className="h-full bg-white rounded-full absolute left-0 top-0 transition-all duration-100" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="text-xs font-medium">Voice</span>
        </div>
    );
};

export default function Messages() {
    // Use Context
    const {
        socket,
        user,
        receivingCall,
        caller,
        callerSignal,
        callAccepted,
        setCallAccepted,
        callEnded,
        setCallEnded,
        name,
        isInCall,
        setIsInCall,
        stream,
        setStream,
        setReceivingCall,
        handleEndCallCleanup,
        saveCallLog,
        callStartTime,
        setCallStartTime,
        onlineStatuses,
        setOnlineStatuses
    } = useSocket();

    const [connections, setConnections] = useState([]);
    const [groups, setGroups] = useState([]);
    const [viewMode, setViewMode] = useState('direct'); // 'direct' or 'groups'
    const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
    const [isInviteMemberModalOpen, setIsInviteMemberModalOpen] = useState(false);
    const [activeGroupCall, setActiveGroupCall] = useState(null); // Stores groupId when active
    const [selectedUser, setSelectedUser] = useState(null); // Used for both user and group (as selectedChat)
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesContainerRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Premium Messaging State
    const [remoteTyping, setRemoteTyping] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const fileInputRef = useRef(null);
    let typingTimeout = useRef(null);

    // Reporting State
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportData, setReportData] = useState({ reason: 'Fake Profile', description: '' });
    const [isReportingUser, setIsReportingUser] = useState(false);
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);

    // Call State - Local specific
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();

    // Scroll to bottom of chat
    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Message Listener (Socket is now global)
    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (data) => {
            if (selectedUser) {
                if (data.groupId && data.groupId === selectedUser._id) {
                    setMessages((prev) => [...prev, data]);
                } else if (!data.groupId && (data.sender === selectedUser._id || data.sender._id === selectedUser._id)) {
                    setMessages((prev) => [...prev, data]);
                    if (user) {
                        socket.emit("mark_messages_read", { senderId: data.sender._id || data.sender, recipientId: user._id });
                    }
                }
            }
        };

        const handleTyping = () => setRemoteTyping(true);
        const handleStopTyping = () => setRemoteTyping(false);
        const handleMessagesSeen = () => setMessages(prev => prev.map(m => m.status === 'sent' || m.status === 'delivered' ? { ...m, status: 'read' } : m));
        const handleUpdateReaction = (data) => setMessages(prev => prev.map(m => m._id === data.messageId ? { ...m, reactions: data.reactions } : m));
        const handleMessageDelivered = (data) => setMessages(prev => prev.map(m => m._id === data._id ? { ...m, status: 'delivered' } : m));

        socket.on("receive_message", handleReceiveMessage);
        socket.on("participant_typing", handleTyping);
        socket.on("participant_stop_typing", handleStopTyping);
        socket.on("messages_seen", handleMessagesSeen);
        socket.on("update_message_reaction", handleUpdateReaction);
        socket.on("message_delivered", handleMessageDelivered);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
            socket.off("participant_typing", handleTyping);
            socket.off("participant_stop_typing", handleStopTyping);
            socket.off("messages_seen", handleMessagesSeen);
            socket.off("update_message_reaction", handleUpdateReaction);
            socket.off("message_delivered", handleMessageDelivered);
        };
    }, [socket, selectedUser, user]);

    // ─── Handle Remote Call End (when other user hangs up) ────────────────────────
    useEffect(() => {
        if (!socket || !isInCall) return;

        const handleRemoteEndCall = () => {
            console.log('[Call] Remote user ended call');

            // Close the peer connection immediately
            if (connectionRef.current) {
                try {
                    connectionRef.current.destroy();
                    connectionRef.current = null;
                } catch (err) {
                    console.error('Error destroying peer on remote end:', err);
                }
            }

            // Stop local media streams
            if (stream) {
                stream.getTracks().forEach(track => {
                    try {
                        track.stop();
                    } catch (err) {
                        console.error('Error stopping track on remote end:', err);
                    }
                });
            }

            // Clear video elements
            if (myVideo.current) myVideo.current.srcObject = null;
            if (userVideo.current) userVideo.current.srcObject = null;

            // Reset UI via context
            handleEndCallCleanup();

            // Reset local controls
            setIsAudioMuted(false);
            setIsVideoMuted(false);
        };

        socket.on("endCall", handleRemoteEndCall);

        return () => {
            socket.off("endCall", handleRemoteEndCall);
        };
    }, [socket, isInCall, stream, handleEndCallCleanup]);

    // Handle Typing Emission
    const handleTypingChange = (e) => {
        setNewMessage(e.target.value);
        if (!selectedUser || selectedUser.members) return; // Only DM for now

        socket.emit("typing", { recipientId: selectedUser._id });
        if (typingTimeout.current) clearTimeout(typingTimeout.current);

        typingTimeout.current = setTimeout(() => {
            socket.emit("stop_typing", { recipientId: selectedUser._id });
        }, 2000);
    };


    // React to Incoming Call (mount video ref if stream exists)
    useEffect(() => {
        if (stream && myVideo.current) {
            myVideo.current.srcObject = stream;
        }
    }, [stream]);


    // Call Functions
    const callUser = async (id) => {
        try {
            const currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

            setStream(currentStream);
            setIsInCall(true);

            // Wait for state update - handled by useEffect above for srcObject? 
            // Better to set it directly if ref is available.
            if (myVideo.current) {
                myVideo.current.srcObject = currentStream;
            }

            const peer = new SimplePeer({
                initiator: true,
                trickle: false,
                stream: currentStream
            });

            peer.on("signal", (data) => {
                socket.emit("callUser", {
                    userToCall: id,
                    signalData: data,
                    from: user._id,
                    name: user.name
                });
            });

            peer.on("stream", (remoteStream) => {
                if (userVideo.current) {
                    userVideo.current.srcObject = remoteStream;
                }
            });

            peer.on("error", (err) => {
                console.error("Peer error:", err);
            });

            socket.on("callAccepted", (signal) => {
                setCallAccepted(true);
                setCallStartTime(Date.now());
                peer.signal(signal);
            });

            connectionRef.current = peer;
        } catch (err) {
            console.error("Error accessing media devices:", err);
            alert("Could not access camera or microphone. Please check permissions.");
            setIsInCall(false);
            setStream(null);
        }
    };

    const answerCall = async () => {
        setCallAccepted(true);
        setIsInCall(true);
        setReceivingCall(false);
        setCallStartTime(Date.now());

        try {
            const currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

            setStream(currentStream);

            if (myVideo.current) {
                myVideo.current.srcObject = currentStream;
            }

            const peer = new SimplePeer({
                initiator: false,
                trickle: false,
                stream: currentStream
            });

            peer.on("signal", (data) => {
                socket.emit("answerCall", { signal: data, to: caller });
            });

            peer.on("stream", (remoteStream) => {
                if (userVideo.current) {
                    userVideo.current.srcObject = remoteStream;
                }
            });

            peer.on("error", (err) => {
                console.error("Peer error:", err);
            });

            peer.signal(callerSignal);
            connectionRef.current = peer;
        } catch (err) {
            console.error("Error answering call:", err);
            alert("Could not access camera or microphone.");
            leaveCall(); // Cleanup if error
        }
    };

    const leaveCall = () => {
        // ─── 1. Close WebRTC peer connection ───────────────────────────────────────
        // This MUST happen before stopping streams to properly release all resources
        if (connectionRef.current) {
            try {
                connectionRef.current.destroy();
                connectionRef.current = null;
            } catch (err) {
                console.error('Error destroying peer connection:', err);
            }
        }

        // ─── 2. Stop all media tracks (camera, microphone) ──────────────────────────
        if (stream) {
            stream.getTracks().forEach(track => {
                try {
                    track.stop();
                } catch (err) {
                    console.error('Error stopping track:', err);
                }
            });
        }

        // ─── 3. Clear video element sources ────────────────────────────────────────
        if (myVideo.current) myVideo.current.srcObject = null;
        if (userVideo.current) userVideo.current.srcObject = null;

        // ─── 4. Calculate duration and save call log ──────────────────────────────
        const duration = callStartTime ? Math.round((Date.now() - callStartTime) / 1000) : 0;
        const targetId = selectedUser?._id || caller;

        if (targetId && socket) {
            socket.emit("endCall", { to: targetId });
            // Save log only if we were actually in a call
            if (isInCall) {
                saveCallLog(targetId, 'completed', duration);
            }
        }

        // ─── 5. Reset all UI state via context ─────────────────────────────────────
        handleEndCallCleanup();

        // ─── 6. Reset local call control state ─────────────────────────────────────
        setIsAudioMuted(false);
        setIsVideoMuted(false);

        console.log('[Call Cleanup] Peer connection closed, streams stopped, call ended.');
    };

    // ─── Handle browser navigation & page unload during call ──────────────────────
    useEffect(() => {
        const handlePopState = () => {
            if (isInCall) {
                const confirmLeave = window.confirm("You are in a call. Do you want to leave?");
                if (confirmLeave) {
                    leaveCall();
                } else {
                    window.history.pushState(null, null, window.location.pathname);
                }
            }
        };

        const handleBeforeUnload = (e) => {
            if (isInCall) {
                // Force cleanup even if user closes the window
                leaveCall();
                e.preventDefault();
                e.returnValue = 'You are in a call. Ending call...';
            }
        };

        window.history.pushState(null, null, window.location.pathname);
        window.addEventListener('popstate', handlePopState);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isInCall, connectionRef, stream]);

    const toggleMute = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoMuted(!videoTrack.enabled);
            }
        }
    };

    // Fetch Connections
    useEffect(() => {
        const fetchConnections = async () => {
            try {
                const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/connections`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (response.ok) {
                    setConnections(data);
                }
            } catch (error) {
                console.error("Error fetching connections:", error);
            }
        };

        if (user) {
            fetchConnections();
        }
    }, [user]);

    // Fetch Groups
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/groups`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (response.ok) {
                    setGroups(data);
                }
            } catch (error) {
                console.error("Error fetching groups:", error);
            }
        };

        if (user) {
            fetchGroups();
        }
    }, [user]);

    // Join Group Rooms
    useEffect(() => {
        if (socket && groups.length > 0) {
            groups.forEach(group => {
                socket.emit("join_group", group._id);
            });
        }
    }, [socket, groups]);

    // Fetch Messages
    useEffect(() => {
        const fetchMessages = async () => {
            if (!selectedUser) return;
            try {
                const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
                let url = `${import.meta.env.VITE_API_URL}/api/messages/${selectedUser._id}`;

                // If it's a group (has description or members array), use group endpoint
                // Or easier: check if selectedUser has 'admin' field or just use a flag?
                // Let's rely on structural difference or `viewMode` if we synced it.
                // But user might click mixed list.
                // Let's check if it has `admin` field which connection doesn't have usually (or check `members`).
                if (selectedUser.members) {
                    url = `${import.meta.env.VITE_API_URL}/api/groups/${selectedUser._id}/messages`;
                }

                const response = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (response.ok) {
                    setMessages(data);
                    scrollToBottom();
                }
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        fetchMessages();
    }, [selectedUser]);

    // Handle Recording Timer
    useEffect(() => {
        let interval;
        if (isRecording) {
            interval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        } else {
            setRecordingTime(0);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const formatRecordTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
             handleSendMessageEvent({ type: 'file', fileName: file.name, fileUrl: reader.result });
        };
        reader.readAsDataURL(file);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];
            
            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                const audioBlob = new Blob(chunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.onloadend = () => {
                    handleSendMessageEvent({ type: 'audio', fileUrl: reader.result });
                };
                reader.readAsDataURL(audioBlob);
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (err) {
            console.error("Audio recording failed", err);
            alert("Microphone permission denied or not available.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        setIsRecording(false);
    };

    const toggleReaction = async (msgId, emoji) => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/messages/${msgId}/react`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ emoji })
            });
            const data = await res.json();
            if (res.ok) {
                setMessages(prev => prev.map(m => m._id === msgId ? { ...m, reactions: data.reactions } : m));
                if (socket && !selectedUser.members) {
                    socket.emit("message_reacted", { recipientId: selectedUser._id, messageId: msgId, reactions: data.reactions });
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSendMessageEvent = async (dataOverrides = {}) => {
        if (!selectedUser) return;
        const baseContent = dataOverrides.content !== undefined ? dataOverrides.content : newMessage;
        if (!baseContent.trim() && !dataOverrides.fileUrl) return;

        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const isGroup = !!selectedUser.members;

            const messageData = {
                content: baseContent,
                type: dataOverrides.type || 'text',
                fileUrl: dataOverrides.fileUrl || null,
                fileName: dataOverrides.fileName || null
            };

            if (isGroup) {
                messageData.groupId = selectedUser._id;
            } else {
                messageData.recipientId = selectedUser._id;
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(messageData)
            });

            const data = await response.json();

            if (response.ok) {
                // Backend handles real-time Socket.io emission — message will arrive via "receive_message" listener
                // Optimistically add to local state for instant UI feedback
                setMessages(prev => [...prev, { ...data, status: 'sent', reactions: [] }]);
                if (!dataOverrides.fileUrl) setNewMessage("");

                socket.emit("stop_typing", { recipientId: selectedUser._id });
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        handleSendMessageEvent();
    };

    const handleCreateGroup = async (groupData) => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/groups`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(groupData)
            });

            const data = await response.json();
            if (response.ok) {
                setGroups([data, ...groups]);
                // Join new group room
                if (socket) {
                    socket.emit("join_group", data._id);
                }
            }
        } catch (error) {
            console.error("Error creating group:", error);
        }
    };

    const handleReportSubmit = async (e) => {
        e.preventDefault();
        if (!selectedUser) return;
        setIsReportingUser(true);
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    reportedUserId: selectedUser._id,
                    reason: reportData.reason,
                    description: reportData.description
                })
            });
            const data = await res.json();
            if (res.ok) {
                alert("Report submitted successfully.");
                setShowReportModal(false);
                setReportData({ reason: 'Fake Profile', description: '' });
            } else {
                alert(data.message || "Failed to submit report");
            }
        } catch (error) {
            console.error("Report error", error);
        } finally {
            setIsReportingUser(false);
        }
    };

    const handleInviteMember = async (newMembers) => {
        if (!selectedUser || !selectedUser.members) return;
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/groups/${selectedUser._id}/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ members: newMembers })
            });

            const data = await response.json();
            if (response.ok) {
                // Update selectedUser with new pending members?
                // Or just alert success
                alert("Invitations sent successfully!");
                // Optionally update local group state if needed, but invites are pending so members list won't change yet.
            } else {
                alert(data.message || "Failed to invite members");
            }
        } catch (error) {
            console.error("Error inviting members:", error);
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    // Mobile: track whether the chat panel is visible
    const [mobileChatOpen, setMobileChatOpen] = useState(false);

    // On mobile, selecting a user also opens the chat view
    const handleSelectUser = (userOrGroup) => {
        setSelectedUser(userOrGroup);
        setMobileChatOpen(true);
    };

    // On mobile, going back clears the chat view
    const handleMobileBack = () => {
        setMobileChatOpen(false);
    };

    return (
        <>
            <div className="min-h-screen bg-slate-50 pt-20 sm:pt-24 pb-0 sm:pb-8 sm:px-4 lg:px-8 flex font-sans">
                <div className="max-w-[1400px] mx-auto w-full bg-white sm:rounded-3xl sm:shadow-xl sm:shadow-indigo-100/50 sm:border sm:border-gray-100 overflow-hidden flex h-[calc(100vh-5rem)] sm:h-[calc(100vh-8rem)]">

                    {/* ============================================
                        SIDEBAR (Contact List)
                        - Desktop: fixed w-1/3 side panel
                        - Mobile: full screen, hidden when chat is open
                        ============================================ */}
                    <div className={`
                        flex-col bg-slate-50/50 border-r border-gray-100
                        ${mobileChatOpen ? 'hidden' : 'flex w-full'}
                        md:flex md:w-1/3
                    `}>
                        <div className="p-5 border-b border-gray-100 bg-white">
                            <h2 className="text-2xl font-black text-gray-900 mb-5 tracking-tight flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                                    <Send className="w-4 h-4" />
                                </div>
                                Messages
                            </h2>

                            {/* Toggle View */}
                            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-5 shadow-inner">
                                <button
                                    onClick={() => setViewMode('direct')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all duration-300 ${viewMode === 'direct' ? 'bg-white shadow-md text-indigo-700' : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                >
                                    Direct
                                </button>
                                <button
                                    onClick={() => setViewMode('groups')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all duration-300 ${viewMode === 'groups' ? 'bg-white shadow-md text-indigo-700' : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                >
                                    Groups
                                </button>
                            </div>

                            <div className="relative flex gap-3">
                                <div className="relative flex-1 group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Search className="text-indigo-400 w-5 h-5 group-focus-within:text-indigo-600 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder={`Search ${viewMode === 'direct' ? 'direct messages' : 'groups'}...`}
                                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-transparent focus:bg-white rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium transition-all shadow-sm"
                                    />
                                </div>
                                {viewMode === 'groups' && (
                                    <button
                                        onClick={() => setIsCreateGroupModalOpen(true)}
                                        className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                                        title="Create Group"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <div className="flex-1 overflow-y-auto scrollbar-hide">
                                {viewMode === 'direct' ? (
                                    connections.map((conn) => (
                                        <div
                                            key={conn._id}
                                            onClick={() => handleSelectUser(conn)}
                                            className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-white transition-all border-b border-gray-100 ${selectedUser?._id === conn._id ? 'bg-white border-l-4 border-l-indigo-600' : ''}`}
                                        >
                                            <div className="relative flex-shrink-0">
                                                <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center text-indigo-700 font-black text-xl shadow-inner border border-white">
                                                    {conn.name?.charAt(0) || 'U'}
                                                </div>
                                                {/* Dynamic Status Dot in Contact List */}
                                                <span className={`absolute -bottom-1 -right-1 w-4 h-4 border-[3px] border-white rounded-full shadow-sm ${
                                                    (onlineStatuses[conn._id] || conn.availabilityStatus || 'Available') === 'Available' ? 'bg-emerald-400' : 
                                                    (onlineStatuses[conn._id] || conn.availabilityStatus || 'Available') === 'Busy' ? 'bg-amber-400' : 'bg-slate-300'
                                                }`}></span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-0.5">
                                                    <h3 className="font-bold text-gray-900 truncate text-[15px]">{conn.name}</h3>
                                                    <span className="text-[11px] font-bold text-gray-400">12:30 PM</span>
                                                </div>
                                                <p className="text-[13px] font-medium text-gray-500 truncate">{conn.company || conn.branch || 'Student'}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    groups.map((group) => (
                                        <div
                                            key={group._id}
                                            onClick={() => handleSelectUser(group)}
                                            className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 ${selectedUser?._id === group._id ? 'bg-indigo-50 border-r-4 border-indigo-600' : ''}`}
                                        >
                                            <div className="relative">
                                                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
                                                    {group.name?.charAt(0) || 'G'}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <h3 className="font-semibold text-gray-900 truncate">{group.name}</h3>
                                                    <span className="text-xs text-gray-500">
                                                        {group.members?.length} members
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 truncate">{group.description || 'No description'}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ============================================
                        CHAT AREA
                        - Desktop: flex-1 panel alongside sidebar
                        - Mobile: full screen, slides in when mobileChatOpen
                        ============================================ */}
                    <div className={`
                        flex-col bg-white
                        ${mobileChatOpen ? 'flex w-full' : 'hidden'}
                        md:flex md:flex-1
                    `}>
                        {selectedUser ? (
                            <>
                                {/* Chat Header */}
                                <div className="px-3 sm:px-6 py-3 sm:py-4 bg-white/90 backdrop-blur-md border-b border-gray-100 flex justify-between items-center z-10 sticky top-0">
                                    <div className="flex items-center gap-2 sm:gap-4">
                                        {/* Back button - mobile only */}
                                        <button
                                            onClick={handleMobileBack}
                                            className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors -ml-1 flex-shrink-0"
                                            aria-label="Back to contacts"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-700">
                                                <path d="M19 12H5M12 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-indigo-700 font-black text-lg sm:text-xl shadow-inner border border-white flex-shrink-0">
                                            {selectedUser.name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-black text-gray-900 text-base sm:text-lg tracking-tight truncate">{selectedUser.name}</h3>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                {!selectedUser.members && (
                                                    <>
                                                        <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.1)] ${
                                                           (onlineStatuses[selectedUser._id] || selectedUser.availabilityStatus || 'Available') === 'Available' ? 'bg-emerald-500 shadow-emerald-500/50' : 
                                                           (onlineStatuses[selectedUser._id] || selectedUser.availabilityStatus || 'Available') === 'Busy' ? 'bg-amber-500 shadow-amber-500/50' : 'bg-slate-400'
                                                        }`}></span>
                                                        <span className={`text-[11px] sm:text-[13px] font-bold whitespace-nowrap ${
                                                            (onlineStatuses[selectedUser._id] || selectedUser.availabilityStatus || 'Available') === 'Available' ? 'text-emerald-500' : 
                                                            (onlineStatuses[selectedUser._id] || selectedUser.availabilityStatus || 'Available') === 'Busy' ? 'text-amber-500' : 'text-slate-400'
                                                        }`}>
                                                            {(onlineStatuses[selectedUser._id] || selectedUser.availabilityStatus || 'Available') === 'Available' ? 'Active Now' : 
                                                             (onlineStatuses[selectedUser._id] || selectedUser.availabilityStatus || 'Available') === 'Busy' ? 'Busy' : 'Offline'}
                                                        </span>
                                                    </>
                                                )}
                                                {selectedUser.members && (
                                                    <span className="text-[11px] sm:text-[13px] text-gray-500 font-medium truncate">
                                                        {selectedUser.members.length} participants
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 sm:gap-3 relative">
                                        {!selectedUser.members && (
                                            <button onClick={() => callUser(selectedUser._id)} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-50 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 transition-colors">
                                                <Phone className="w-4 h-4 sm:w-5 sm:h-5 fill-indigo-100" />
                                            </button>
                                        )}

                                        {/* Desktop-only Video button (moved to menu on mobile) */}
                                        {!selectedUser.members && (
                                            <button onClick={() => callUser(selectedUser._id)} className="hidden sm:flex w-10 h-10 rounded-full bg-slate-50 items-center justify-center text-purple-600 hover:bg-purple-50 transition-colors">
                                                <Video className="w-5 h-5 fill-purple-100" />
                                            </button>
                                        )}

                                        {/* More Menu Toggle */}
                                        <button 
                                            onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                                        >
                                            <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </button>

                                        {/* Header Dropdown Menu */}
                                        <AnimatePresence>
                                            {isHeaderMenuOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setIsHeaderMenuOpen(false)}></div>
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 overflow-hidden"
                                                    >
                                                        {/* Mobile only Call buttons in menu if needed, though they are prominent above */}
                                                        <button 
                                                            onClick={() => { callUser(selectedUser._id); setIsHeaderMenuOpen(false); }}
                                                            className="sm:hidden flex items-center w-full px-4 py-3 text-sm font-bold text-gray-700 hover:bg-slate-50 transition-colors text-left"
                                                        >
                                                            <Video className="w-4 h-4 mr-3 text-purple-500" />
                                                            Video Call
                                                        </button>

                                                        {selectedUser.members && (
                                                            <button 
                                                                onClick={() => { setIsInviteMemberModalOpen(true); setIsHeaderMenuOpen(false); }}
                                                                className="flex items-center w-full px-4 py-3 text-sm font-bold text-gray-700 hover:bg-slate-50 transition-colors text-left"
                                                            >
                                                                <Users className="w-4 h-4 mr-3 text-indigo-500" />
                                                                Invite Members
                                                            </button>
                                                        )}

                                                        <button 
                                                            onClick={() => { setShowReportModal(true); setIsHeaderMenuOpen(false); }}
                                                            className="flex items-center w-full px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors text-left"
                                                        >
                                                            <ShieldAlert className="w-4 h-4 mr-3" />
                                                            Report User
                                                        </button>
                                                        
                                                        <button className="flex items-center w-full px-4 py-3 text-sm font-bold text-gray-700 hover:bg-slate-50 transition-colors text-left">
                                                            <Info className="w-4 h-4 mr-3 text-gray-400" />
                                                            Contact Info
                                                        </button>
                                                    </motion.div>
                                                </>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Messages List */}
                                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-7 scroll-smooth bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50/50">
                                    {messages.map((msg, index) => {
                                        const isMe = msg.sender === user._id || msg.sender._id === user._id;
                                        const isVideoCall = msg.type === 'video_call';
                                        const reactions = msg.reactions || [];

                                        return (
                                            <div key={msg._id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fadeIn group relative`}>
                                                <div className={`relative max-w-[75%] md:max-w-[65%] rounded-3xl px-5 py-3.5 shadow-md font-medium text-[15px] leading-relaxed ${isVideoCall
                                                    ? 'bg-white text-gray-800 border border-gray-100'
                                                    : isMe ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-br-sm shadow-indigo-200' : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                                                    }`}>
                                                    
                                                    {isVideoCall ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-full ${msg.callStatus === 'missed' ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-500'}`}>
                                                                {msg.callStatus === 'missed' ? <PhoneOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold">{msg.callStatus === 'missed' ? 'Missed Call' : 'Video Call'}</p>
                                                                <p className="text-xs text-gray-500">{msg.callDuration > 0 ? formatDuration(msg.callDuration) : ''}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            {!isMe && selectedUser.members && (
                                                                <p className="text-[11px] text-indigo-500 font-bold mb-1 tracking-wide uppercase">
                                                                    {msg.sender.name || 'Unknown'}
                                                                </p>
                                                            )}
                                                            {msg.type === 'text' && <p className="break-words break-all">{msg.content}</p>}
                                                            {msg.type === 'file' && (
                                                                <a href={msg.fileUrl} download={msg.fileName} className="flex items-center gap-3 bg-black/10 p-3 rounded-xl border border-white/20 mt-1 cursor-pointer hover:bg-black/20 transition-all no-underline text-inherit block">
                                                                    <div className={`p-2 rounded-lg ${isMe ? 'bg-white text-indigo-600' : 'bg-indigo-100 text-indigo-600'}`}><FileText className="w-6 h-6" /></div>
                                                                    <div className="truncate flex-1">
                                                                        <p className="text-sm font-bold truncate max-w-[150px]">{msg.fileName}</p>
                                                                        <p className="text-xs opacity-80">Document</p>
                                                                    </div>
                                                                </a>
                                                            )}
                                                            {msg.type === 'audio' && (
                                                                <CustomAudioPlayer fileUrl={msg.fileUrl} isMe={isMe} />
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className={`flex items-center justify-end gap-1.5 mt-2 text-[10px] font-bold ${isVideoCall ? 'text-gray-400' : isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                        <p>{new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                        {isMe && !selectedUser.members && (
                                                            <span className="flex items-center">
                                                                {msg.status === 'sent' && <Check className="w-3.5 h-3.5 text-blue-200" />}
                                                                {msg.status === 'delivered' && <CheckCheck className="w-3.5 h-3.5 text-blue-200" />}
                                                                {msg.status === 'read' && <CheckCheck className="w-3.5 h-3.5 text-cyan-300 drop-shadow-sm" />}
                                                                {!msg.status && <Check className="w-3.5 h-3.5 text-blue-200 opacity-50" />}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Reactions Bar Overlay */}
                                                    <div className={`absolute -top-4 ${isMe ? 'left-0' : 'right-0'} bg-white shadow-xl rounded-full px-2 py-1 flex items-center gap-1 border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10`}>
                                                        {['👍', '🔥', '👏', '❤️'].map(emoji => (
                                                            <button key={emoji} onClick={() => toggleReaction(msg._id, emoji)} className="hover:scale-125 transition-transform text-lg leading-none cursor-pointer">{emoji}</button>
                                                        ))}
                                                    </div>

                                                    {/* Rendered Reactions */}
                                                    {reactions.length > 0 && (
                                                        <div className={`absolute -bottom-3 ${isMe ? 'left-4' : 'right-4'} flex flex-wrap gap-0.5 bg-white shadow-sm p-0.5 rounded-full border border-gray-100`}>
                                                            {reactions.map((r, i) => (
                                                                <div key={i} className="text-[11px] leading-none px-1 py-0.5">
                                                                    {r.emoji}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Typing Indicator */}
                                    {remoteTyping && (
                                        <div className="flex justify-start animate-fadeIn">
                                           <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3.5 flex gap-1.5 items-center h-10 w-16">
                                               <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                               <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                               <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                           </div>
                                        </div>
                                    )}

                                </div>

                                {/* Input Area */}
                                <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-10">
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,image/*" />
                                    
                                    {isRecording ? (
                                        <div className="flex items-center gap-3 bg-red-50 p-3 rounded-full border border-red-100 animate-pulse transition-all">
                                            <div className="w-3 h-3 rounded-full bg-red-500 ml-3"></div>
                                            <span className="text-red-500 font-bold flex-1">{formatRecordTime(recordingTime)}</span>
                                            <button onClick={stopRecording} className="bg-red-500 text-white p-2.5 rounded-full hover:bg-red-600 transition-all shadow-md">
                                                <Send className="w-5 h-5 ml-0.5" />
                                            </button>
                                            <button onClick={() => { stopRecording(); }} className="text-gray-400 p-2.5 hover:text-red-500 transition-colors bg-white rounded-full">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                                            <button type="button" onClick={() => fileInputRef.current.click()} className="text-gray-400 hover:text-indigo-600 transition-colors p-3 bg-slate-50 hover:bg-indigo-50 rounded-full shadow-sm mb-0.5">
                                                <Paperclip className="w-5 h-5" />
                                            </button>
                                            
                                            <div className="flex-1 relative bg-slate-50 border border-gray-200 rounded-3xl flex items-center shadow-inner focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                                                <input
                                                    type="text"
                                                    value={newMessage}
                                                    onChange={handleTypingChange}
                                                    placeholder="Type a message..."
                                                    className="w-full bg-transparent px-5 py-3.5 focus:outline-none font-medium text-[15px]"
                                                />
                                            </div>
                                            
                                            {newMessage.trim() ? (
                                                <button
                                                    type="submit"
                                                    className="p-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full hover:shadow-lg hover:shadow-indigo-200 transition-all transform hover:scale-105 active:scale-95 mb-0.5"
                                                >
                                                    <Send className="w-5 h-5 ml-0.5" />
                                                </button>
                                            ) : (
                                                <button type="button" onClick={startRecording} className="p-3.5 bg-slate-50 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-full transition-all shadow-sm mb-0.5">
                                                    <Mic className="w-5 h-5" />
                                                </button>
                                            )}
                                        </form>
                                    )}
                                </div>
                            </>
                        ) : (
                            // Empty state — only shown on desktop; mobile shows contacts list instead
                            <div className="hidden md:flex flex-1 flex-col items-center justify-center text-gray-500 bg-slate-50 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/60 z-0"></div>
                                <div className="relative z-10 flex flex-col items-center bg-white/80 p-12 rounded-3xl backdrop-blur-xl shadow-xl shadow-indigo-100/40 border border-white">
                                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-white">
                                        <Send className="w-10 h-10 text-indigo-500 transform translate-x-1 -translate-y-1" />
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900 mb-2">Your Messages</h2>
                                    <p className="text-[15px] font-medium text-gray-500 text-center max-w-[250px]">Select a conversation from the sidebar to start chatting</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>


            {/* Incoming Call Notification */}
            {receivingCall && !callAccepted && (
                <div className="fixed top-10 right-10 bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 z-50 animate-bounce-subtle">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Phone className="w-8 h-8 text-indigo-600 animate-pulse" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{name} is calling...</h3>
                        <p className="text-sm text-gray-500 mb-4">Incoming Video Call</p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={answerCall}
                                className="px-6 py-2 bg-green-500 text-white rounded-full font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
                            >
                                <Phone className="w-4 h-4" /> Answer
                            </button>
                            <button
                                onClick={() => setReceivingCall(false)}
                                className="px-6 py-2 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
                            >
                                <PhoneOff className="w-4 h-4" /> Decline
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Video Call Overlay */}
            {isInCall && (
                <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col overflow-hidden">
                    <div className="relative w-full h-full">
                        {/* Remote Video (Main) */}
                        {callAccepted && !callEnded ? (
                            <video
                                playsInline
                                ref={userVideo}
                                autoPlay
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white">
                                <div className="text-center">
                                    <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                        <span className="text-3xl font-bold">{selectedUser?.name?.charAt(0)}</span>
                                    </div>
                                    <p className="text-xl font-medium">Calling {selectedUser?.name}...</p>
                                    <p className="text-sm text-gray-400 mt-2">Waiting for response...</p>
                                </div>
                            </div>
                        )}

                        {/* Local Video (PiP) */}
                        {stream && (
                            <div className="absolute bottom-28 right-6 w-48 h-36 bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 z-10">
                                <video
                                    playsInline
                                    muted
                                    ref={myVideo}
                                    autoPlay
                                    className="w-full h-full object-cover transform scale-x-[-1]"
                                />
                            </div>
                        )}

                        {/* Controls Overlay */}
                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-6 bg-gray-900/50 backdrop-blur-md px-8 py-4 rounded-full border border-white/10 shadow-2xl z-50">
                            <button
                                onClick={toggleMute}
                                className={`p-4 rounded-full transition-all duration-200 ${isAudioMuted ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-700/80 text-white hover:bg-gray-600'}`}
                                title={isAudioMuted ? "Unmute" : "Mute"}
                            >
                                {isAudioMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                            </button>

                            <button
                                onClick={leaveCall}
                                className="p-5 rounded-full bg-red-600 text-white hover:bg-red-700 transform hover:scale-110 transition-all shadow-lg"
                                title="End Call"
                            >
                                <PhoneOff className="w-8 h-8" />
                            </button>

                            <button
                                onClick={toggleVideo}
                                className={`p-4 rounded-full transition-all duration-200 ${isVideoMuted ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-700/80 text-white hover:bg-gray-600'}`}
                                title={isVideoMuted ? "Start Video" : "Stop Video"}
                            >
                                {isVideoMuted ? <VideoOff className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Group Video Call Overlay */}
            {activeGroupCall && (
                <GroupCallRoom
                    groupId={activeGroupCall}
                    onLeave={() => setActiveGroupCall(null)}
                />
            )}

            {/* Create Group Modal */}
            <CreateGroupModal
                isOpen={isCreateGroupModalOpen}
                onClose={() => setIsCreateGroupModalOpen(false)}
                onCreateGroup={handleCreateGroup}
            />

            {/* Invite Member Modal */}
            {selectedUser && selectedUser.members && (
                <InviteMemberModal
                    isOpen={isInviteMemberModalOpen}
                    onClose={() => setIsInviteMemberModalOpen(false)}
                    onInviteMember={handleInviteMember}
                    currentMembers={selectedUser.members}
                />
            )}

            {/* Report User Modal */}
            <AnimatePresence>
                {showReportModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl relative"
                        >
                            <button onClick={() => setShowReportModal(false)} className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
                                <X className="w-6 h-6" />
                            </button>

                            <div className="w-16 h-16 bg-red-100 rounded-3xl flex items-center justify-center mb-6">
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>

                            <h2 className="text-2xl font-black text-slate-900 mb-2">Report User</h2>
                            <p className="text-slate-500 font-medium mb-8">Help us understand what's happening with <span className="text-indigo-600 font-bold">@{selectedUser.name}</span></p>

                            <form onSubmit={handleReportSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Reason for Reporting</label>
                                    <select 
                                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                                        value={reportData.reason}
                                        onChange={(e) => setReportData({...reportData, reason: e.target.value})}
                                    >
                                        <option value="Fake Profile">Fake Profile</option>
                                        <option value="Abuse">Abuse in Chat</option>
                                        <option value="Spam">Spam</option>
                                        <option value="Inappropriate Content">Inappropriate Content</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Description</label>
                                    <textarea 
                                        rows="4"
                                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-sm"
                                        placeholder="Please provide more details about the issue..."
                                        required
                                        value={reportData.description}
                                        onChange={(e) => setReportData({...reportData, description: e.target.value})}
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowReportModal(false)}
                                        className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={isReportingUser}
                                        className="flex-2 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-200 hover:bg-red-700 transition-all px-10 disabled:opacity-50"
                                    >
                                        {isReportingUser ? 'Submitting...' : 'Submit Report'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
