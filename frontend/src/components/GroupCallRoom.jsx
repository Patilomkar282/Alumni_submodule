import React, { useState, useEffect, useRef } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import SimplePeer from 'simple-peer';
import { useSocket } from '../context/SocketContext';

export default function GroupCallRoom({ groupId, onLeave }) {
    const { socket, user } = useSocket();
    const [peers, setPeers] = useState([]);
    const [stream, setStream] = useState();

    // Controls State
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    const myVideo = useRef();
    const peersRef = useRef([]);

    useEffect(() => {
        if (!socket || !groupId) return;

        // 1. Get local media stream
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((currentStream) => {
            setStream(currentStream);
            if (myVideo.current) {
                myVideo.current.srcObject = currentStream;
            }

            // 2. Tell the server we want to join the group call
            socket.emit("join_group_call", groupId);

            // 3. Listen for existing users in the room who signal us (Offer)
            socket.on("user_joined_group_call", payload => {
                const peer = createPeer(payload.signalSocketId, socket.id, currentStream);
                peersRef.current.push({
                    peerID: payload.signalSocketId,
                    peer,
                });

                // We use function state update to ensure latest array
                setPeers(prev => [...prev, { peerID: payload.signalSocketId, peer }]);
            });

            // 4. When we receive an Offer from an existing user
            socket.on("receive_group_signal", payload => {
                const peer = addPeer(payload.signal, payload.callerID, currentStream);
                peersRef.current.push({
                    peerID: payload.callerID,
                    peer,
                });

                setPeers(prev => [...prev, { peerID: payload.callerID, peer }]);
            });

            // 5. When the new user returns an Answer to our Offer
            socket.on("receive_returned_signal", payload => {
                const item = peersRef.current.find(p => p.peerID === payload.id);
                if (item) {
                    item.peer.signal(payload.signal);
                }
            });

            // 6. When a user leaves
            socket.on("user_left_group_call", (id) => {
                const peerObj = peersRef.current.find(p => p.peerID === id);
                if (peerObj) {
                    peerObj.peer.destroy();
                }
                const filteredPeers = peersRef.current.filter(p => p.peerID !== id);
                peersRef.current = filteredPeers;
                setPeers(filteredPeers);
            });

        }).catch(err => {
            console.error("Failed to get local stream", err);
            alert("Could not access camera/microphone.");
            onLeave();
        });

        // Cleanup on unmount
        return () => {
            socket.emit("leave_group_call", groupId);
            socket.off("user_joined_group_call");
            socket.off("receive_group_signal");
            socket.off("receive_returned_signal");
            socket.off("user_left_group_call");

            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            peersRef.current.forEach(peerObj => {
                if (peerObj && peerObj.peer) peerObj.peer.destroy();
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once to establish stream and listeners

    // Helper: We are already in the room playing Host to the new peer
    function createPeer(userToSignal, callerID, currentStream) {
        const peer = new SimplePeer({
            initiator: true, // We initiate the offer to the new guy
            trickle: false,
            stream: currentStream,
        });

        peer.on("signal", signal => {
            socket.emit("send_group_signal", { userToSignal, callerID, signal });
        });

        return peer;
    }

    // Helper: We just joined and received an Offer from an existing peer
    function addPeer(incomingSignal, callerID, currentStream) {
        const peer = new SimplePeer({
            initiator: false, // We just answer
            trickle: false,
            stream: currentStream,
        });

        peer.on("signal", signal => {
            socket.emit("return_group_signal", { signal, callerID });
        });

        peer.signal(incomingSignal);

        return peer;
    }

    // UI Controls
    const toggleMute = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    const handleLeave = () => {
        socket.emit("leave_group_call", groupId);
        onLeave(); // Trigger parent cleanup
    };

    return (
        <div className="fixed inset-0 bg-gray-900 z-[100] flex flex-col pt-16">
            <div className="flex-1 p-4 flex items-center justify-center">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-7xl h-full pb-24">

                    {/* Local Video */}
                    <div className="relative bg-black rounded-2xl overflow-hidden shadow-xl h-full min-h-[250px] max-h-[400px]">
                        <video ref={myVideo} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                        <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                            <span className="text-white text-sm font-medium">You</span>
                        </div>
                    </div>

                    {/* Remote Videos */}
                    {peers.map((peer, index) => {
                        return (
                            <VideoNode key={peer.peerID} peer={peer.peer} peerID={peer.peerID} index={index + 1} />
                        );
                    })}
                </div>
            </div>

            {/* Controls Bar */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-6 bg-gray-900/60 backdrop-blur-xl px-8 py-4 rounded-full border border-white/10 shadow-2xl z-50">
                <button
                    onClick={toggleMute}
                    className={`p-4 rounded-full transition-all duration-200 ${isMuted ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-700/80 text-white hover:bg-gray-600'}`}
                >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>

                <button
                    onClick={handleLeave}
                    className="p-5 rounded-full bg-red-600 text-white hover:bg-red-700 transform hover:scale-110 transition-all shadow-lg"
                    title="Leave Call"
                >
                    <PhoneOff className="w-8 h-8" />
                </button>

                <button
                    onClick={toggleVideo}
                    className={`p-4 rounded-full transition-all duration-200 ${isVideoOff ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-700/80 text-white hover:bg-gray-600'}`}
                >
                    {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                </button>
            </div>
        </div>
    );
}

// Child Component strictly to handle mounting the remote stream to the video element
const VideoNode = ({ peer, peerID, index }) => {
    const ref = useRef();

    useEffect(() => {
        peer.on("stream", stream => {
            if (ref.current) {
                ref.current.srcObject = stream;
            }
        });
    }, [peer]);

    return (
        <div className="relative bg-black rounded-2xl overflow-hidden shadow-xl h-full min-h-[250px] max-h-[400px]">
            <video playsInline autoPlay ref={ref} className="w-full h-full object-cover" />
            <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                <span className="text-white text-sm font-medium">Participant {index}</span>
            </div>
        </div>
    );
};
