import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Clock,
    Calendar,
    Star,
    MessageCircle,
    Video,
    Bell,
    Search,
    Plus,
    Briefcase,
    MapPin,
    ArrowRight,
    X,
    Award,
    Mail,
    GraduationCap,
    Globe,
    Activity,
    FileText,
    MessageSquare,
    Share2,
    Rocket,
    Trophy,
    Zap,
    TrendingUp,
    ChevronRight,
    Megaphone,
    ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import LoadingScreen from '../components/LoadingScreen';

export default function Dashboard() {
    const navigate = useNavigate();
    const { socket, setOnlineStatuses } = useSocket();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('userInfo')) || { name: 'User', role: 'student' });
    const [availability, setAvailability] = useState(user.availabilityStatus || 'Available');

    const handleStatusChange = async (newStatus) => {
        setAvailability(newStatus);
        try {
            const token = user.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                // Update local context
                setOnlineStatuses(prev => ({ ...prev, [user._id]: newStatus }));
                // Emit via socket
                if (socket) {
                    socket.emit("update_status", { userId: user._id, status: newStatus });
                }
                
                // Update local storage user info to persist across refreshes
                const updatedUser = { ...user, availabilityStatus: newStatus };
                localStorage.setItem('userInfo', JSON.stringify(updatedUser));
                setUser(updatedUser);
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    // Real Data States
    const [sessions, setSessions] = useState([]);
    const [requests, setRequests] = useState([]); // Received requests (Alumni)
    const [sentRequests, setSentRequests] = useState([]); // Sent requests (Student)
    const [connections, setConnections] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState(false);
    const [selectedMentorProfile, setSelectedMentorProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activityData, setActivityData] = useState({ posts: [], comments: [], reposts: [] });
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

    // Fetch Data
    useEffect(() => {
        if (!user || !user.token) {
            navigate('/signin');
            return;
        }

        const fetchData = async () => {
            try {
                const token = user.token;
                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };

                // 1. Fetch Sessions (All Roles)
                const sessionsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/my-sessions`, { headers });
                if (sessionsRes.ok) setSessions(await sessionsRes.json());

                // 2. Fetch Mentors & Sent Requests (Student Only)
                if (user.role === 'student') {
                    // Uses our new AI Recommendation endpoint instead of generic lookup
                    const mentorsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/users/recommendations`, { headers });
                    if (mentorsRes.ok) setMentors(await mentorsRes.json());

                    const sentRes = await fetch(`${import.meta.env.VITE_API_URL}/api/connections/sent`, { headers });
                    if (sentRes.ok) setSentRequests(await sentRes.json());
                }

                // 3. Fetch Connections (All Roles)
                const connectionsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/connections`, { headers });
                if (connectionsRes.ok) setConnections(await connectionsRes.json());

                // 4. Fetch Received Requests (Alumni Only)
                if (user.role === 'alumni') {
                    const requestsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/connections/received`, { headers });
                    if (requestsRes.ok) setRequests(await requestsRes.json());
                }

                // 6. Fetch Announcements
                const announcementsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/announcements`, { headers });
                if (announcementsRes.ok) setAnnouncements(await announcementsRes.json());

                // 7. Fetch Fast Analytics for Dashboard metrics
                const analyticsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/users/analytics/dashboard`, { headers });
                if (analyticsRes.ok) setAnalytics(await analyticsRes.json());

                // 5. Fetch Activity Data (For counts)
                // 5. Fetch Activity Data (For counts)
                try {
                    const activityRes = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/my-activity`, { headers });
                    if (activityRes.ok) {
                        const activityData = await activityRes.json();
                        setActivityData(activityData);
                    }
                } catch (actErr) {
                    console.error('Error fetching activity data:', actErr);
                }

                setLoading(false);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, [user, navigate]);

    // Handle Connection Request
    const handleConnect = async (alumniId) => {
        try {
            const token = user.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/connections/request`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ recipientId: alumniId, message: "I'd like to connect for mentorship." })
            });
            if (res.ok) {
                alert('Connection request sent!');
                // Refresh sent requests
                const updatedSentRes = await fetch(`${import.meta.env.VITE_API_URL}/api/connections/sent`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (updatedSentRes.ok) setSentRequests(await updatedSentRes.json());
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to send request.');
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Handle Request Action (Accept/Reject)
    const handleRequestAction = async (requestId, status) => {
        try {
            const token = user.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/connections/request/${requestId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                setRequests(requests.filter(req => req._id !== requestId));
                alert(`Request ${status}`);
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Stats calculation follows...

    // Calculate Stats based on Role from Pre-Aggregated data
    const getStats = () => {
        const defaultStats = {
            connections: { pending: 0, accepted: 0 },
            sessions: { totalAttended: 0 },
            engagement: { totalLikesReceived: 0 }
        };
        const statsData = analytics || defaultStats;

        if (user.role === 'student') {
            return [
                { label: 'Total Sessions', value: statsData.sessions.totalAttended.toString(), icon: Video, color: 'text-blue-600', bg: 'bg-blue-50', path: '/student/sessions' },
                { label: 'Pending Requests', value: statsData.connections.pending.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', path: '/student/sessions' },
                { label: 'My Connections', value: statsData.connections.accepted.toString(), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', isConnection: true },
                { label: 'Profile Rating', value: '4.8', icon: Star, color: 'text-purple-600', bg: 'bg-purple-50', path: '/student/profile' },
            ];
        } else {
            return [
                { label: 'Total Sessions', value: statsData.sessions.totalAttended.toString(), icon: Video, color: 'text-blue-600', bg: 'bg-blue-50', path: '/alumni/sessions' },
                { label: 'Pending Requests', value: statsData.connections.pending.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', path: '/alumni/requests' },
                { label: 'Connections', value: statsData.connections.accepted.toString(), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', isConnection: true },
                { label: 'Post Likes', value: statsData.engagement.totalLikesReceived.toString(), icon: Star, color: 'text-purple-600', bg: 'bg-purple-50', path: '/alumni/profile' },
            ];
        }
    };

    const stats = getStats();

    // Helper to filter and sort sessions
    const getCategorizedSessions = () => {
        const upcoming = sessions.filter(s => s.status === 'scheduled' || s.status === 'rescheduled')
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        const past = sessions.filter(s => s.status === 'completed')
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        return { upcoming, past };
    };

    const { upcoming: upcomingSessions, past: pastSessions } = getCategorizedSessions();
    const [sessionTab, setSessionTab] = useState('upcoming');

    const formatSessionTime = (dateStr, timeStr) => {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return { day: '??', month: '???', time: timeStr || 'TBD' };
        return {
            day: date.getDate(),
            month: date.toLocaleString('default', { month: 'short' }).toUpperCase(),
            time: timeStr || 'TBD'
        };
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="min-h-screen bg-slate-50 relative pb-12">
            {/* Top Premium Background Banner */}
            <div className="absolute top-0 left-0 right-0 h-[340px] z-0 overflow-hidden">
                {user.bannerPhoto ? (
                    <>
                        <img src={user.bannerPhoto} alt="Banner" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-[2px]"></div>
                    </>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute top-12 -left-24 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>
                    </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-50 to-transparent"></div>
            </div>

            <div className="relative z-10 pt-24 sm:pt-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">

                {/* 1. Header Section - Redesigned identity hub (PHASE 5) */}
                <div className="flex flex-col lg:flex-row justify-between items-center gap-8 pb-8">
                    <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                        {/* High-Fidelity Profile Identity Ring */}
                        <div className="relative group">
                            <motion.div 
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                className="w-24 h-24 sm:w-28 sm:h-28 rounded-[2.5rem] bg-indigo-500/20 backdrop-blur-xl p-1.5 border border-white/30 shadow-2xl relative z-10"
                            >
                                <div className="w-full h-full rounded-[2.2rem] bg-white overflow-hidden border-2 border-white/50 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                    {user.profilePhoto ? (
                                        <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black">
                                            {user.name?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                            {/* Role Badge Overlay */}
                            <div className="absolute -bottom-2 -right-2 bg-white px-3 py-1 rounded-full shadow-lg border border-gray-100 flex items-center gap-1.5 z-20">
                                <div className={`w-2 h-2 rounded-full ${user.role === 'alumni' ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                                <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{user.role}</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter drop-shadow-md">
                                    Hello, <span className="text-indigo-200">{user.name?.split(' ')[0]}</span>!
                                </h1>
                                <motion.span 
                                    animate={{ rotate: [0, 20, 0] }} 
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="text-3xl"
                                >
                                    👋
                                </motion.span>
                            </div>
                            <p className="text-indigo-100/80 mt-2 text-sm sm:text-base font-bold flex items-center justify-center md:justify-start gap-2">
                                <span className="w-5 h-[1px] bg-white/30"></span>
                                {user.role === 'student'
                                    ? "Accelerate your career journey today"
                                    : "Managing educational legacy & impact"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-white/5 backdrop-blur-xl p-2 rounded-[2rem] border border-white/10 shadow-2xl">
                        {user.role === 'alumni' && (
                            <div className="flex items-center gap-3 px-5 py-3 rounded-[1.5rem] bg-white/10 border border-white/10">
                                <div className={`w-3 h-3 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.1)] ${
                                    availability === 'Available' ? 'bg-emerald-400 shadow-emerald-400/50' : 
                                    availability === 'Busy' ? 'bg-amber-400 shadow-amber-400/50' : 'bg-slate-400 shadow-slate-400/50'
                                }`} />
                                <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">{availability}</span>
                            </div>
                        )}
                        <div className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-[1.4rem] border border-white/10">
                            <ShieldCheck className="w-5 h-5 text-indigo-200" />
                        </div>
                    </div>
                </div>

                {/* 2. PHASE 2: Availability Quick-Manager Strip (Alumni Only) */}
                {user.role === 'alumni' && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/80 backdrop-blur-xl p-4 sm:p-6 rounded-[2rem] border border-white shadow-xl shadow-indigo-500/5 flex flex-col sm:flex-row items-center justify-between gap-6"
                    >
                        <div className="flex items-center gap-5">
                            <div className="relative group">
                                <div className="w-14 h-14 bg-indigo-50 rounded-[1.25rem] flex items-center justify-center text-indigo-600 border border-indigo-100 transition-transform group-hover:scale-110">
                                    <Clock className="w-7 h-7" />
                                </div>
                                <div className={`absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full border-[3px] border-white ${
                                    availability === 'Available' ? 'bg-emerald-500' : 
                                    availability === 'Busy' ? 'bg-amber-500' : 'bg-gray-400'
                                } shadow-sm animate-pulse`}></div>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900 leading-none">Operational Status</h3>
                                <p className="text-xs font-bold text-gray-500 uppercase mt-2 tracking-widest flex items-center gap-2">
                                    Current Visibility: 
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-normal ${
                                        availability === 'Available' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                                        availability === 'Busy' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-gray-50 text-gray-600 border border-gray-100'
                                    }`}>
                                        {availability}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="flex bg-gray-100/80 p-1.5 rounded-2xl border border-gray-100/50 w-full sm:w-auto overflow-x-auto custom-scrollbar">
                            {[
                                { label: 'Available', color: 'text-emerald-700', bg: 'bg-white', dot: 'bg-emerald-500', desc: 'Accepting Requests' },
                                { label: 'Busy', color: 'text-amber-700', bg: 'bg-white', dot: 'bg-amber-500', desc: 'On Break' },
                                { label: 'Offline', color: 'text-gray-700', bg: 'bg-white', dot: 'bg-gray-400', desc: 'Away' }
                            ].map((status) => (
                                <button
                                    key={status.label}
                                    onClick={() => handleStatusChange(status.label)}
                                    className={`flex-1 sm:flex-none px-6 py-3 rounded-xl flex flex-col items-center justify-center gap-1 min-w-[100px] transition-all duration-300 ${
                                        availability === status.label 
                                            ? `${status.bg} ${status.color} shadow-lg shadow-indigo-500/10 border border-indigo-100 ring-4 ring-indigo-50/50` 
                                            : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${status.dot} ${availability === status.label ? 'animate-bounce' : ''}`}></div>
                                        <span className="text-[11px] font-black uppercase tracking-wider">{status.label}</span>
                                    </div>
                                    {availability === status.label && (
                                        <span className="text-[8px] font-bold opacity-70 whitespace-nowrap">{status.desc}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* 3. Stats Grid - 2 cols on mobile, 4 on lg */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => stat.isConnection ? setIsConnectionsModalOpen(true) : navigate(stat.path)}
                            className="bg-white p-3 sm:p-6 rounded-2xl shadow-lg shadow-gray-200/40 border border-gray-100 flex items-center justify-between group hover:-translate-y-1 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 cursor-pointer"
                        >
                            <div>
                                <p className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                                <p className="text-xl sm:text-3xl font-black text-gray-900 mt-1 sm:mt-2">{stat.value}</p>
                            </div>
                            <div className={`p-2 sm:p-4 rounded-xl sm:rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm`}>
                                <stat.icon className="w-5 h-5 sm:w-7 sm:h-7" />
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                    {/* Left Column (Main Content) */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* STUDENT: Find Mentors */}
                        {user.role === 'student' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden"
                            >
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-indigo-600" />
                                        Recommended Mentors
                                    </h2>
                                    <button
                                        onClick={() => navigate('/student/mentors')}
                                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                                    >
                                        View All <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {mentors.length > 0 ? mentors.slice(0, 4).map((mentor) => {
                                        const isConnected = connections.some(conn => conn._id === mentor._id);
                                        const sentRequest = sentRequests.find(req => req.recipient._id === mentor._id);
                                        const isPending = sentRequest && sentRequest.status === 'pending';

                                        return (
                                            <div key={mentor._id} className="border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-indigo-100/50 transition-all bg-white relative group">
                                                <div className="h-16 relative overflow-hidden">
                                                    {mentor.bannerPhoto ? (
                                                        <img src={mentor.bannerPhoto} alt="Banner" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-r from-blue-100 to-indigo-100 relative"></div>
                                                    )}
                                                </div>
                                                <div className="px-5 pb-5 relative">
                                                    <div className="-mt-8 mb-3 flex items-start gap-3 cursor-pointer" onClick={() => navigate(`/user/${mentor._id}`)}>
                                                        <div className="w-16 h-16 rounded-full bg-white p-1 shadow-md hover:scale-105 transition-transform">
                                                            <div className="w-full h-full rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-2xl overflow-hidden border border-gray-100">
                                                                {mentor.profilePhoto ? (
                                                                    <img src={mentor.profilePhoto} alt={mentor.name} className="w-full h-full rounded-full object-cover" />
                                                                ) : (
                                                                    mentor.name.charAt(0).toUpperCase()
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="pt-8 flex-1">
                                                            <div className="flex justify-between items-center">
                                                                <h3 className="font-bold text-lg text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-1">{mentor.name}</h3>
                                                            </div>
                                                            <p className="text-[13px] text-gray-500 flex items-center gap-1 mt-0.5 font-medium">
                                                                <Briefcase className="w-3.5 h-3.5 text-indigo-400" /> {mentor.company || 'Alumni'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 mb-5">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {mentor.expertiseAreas?.slice(0, 2).map((skill, i) => (
                                                                <span key={i} className="text-[11px] bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                            {(!mentor.expertiseAreas || mentor.expertiseAreas.length === 0) && (
                                                                <span className="text-[11px] bg-gray-50 text-gray-500 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                                                                    General
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {isConnected ? (
                                                        <button
                                                            className="w-full py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                                                            onClick={() => navigate('/student/messages')}
                                                        >
                                                            <MessageCircle className="w-4 h-4" />
                                                            Message
                                                        </button>
                                                    ) : isPending ? (
                                                        <button
                                                            disabled
                                                            className="w-full py-2.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl text-sm font-bold cursor-not-allowed flex items-center justify-center gap-2"
                                                        >
                                                            <Clock className="w-4 h-4" />
                                                            Requested
                                                        </button>
                                                    ) : (user?.role === 'student' && (mentor.role === 'student' || mentor.rawRole === 'student')) ? (
                                                        <div className="w-full text-center">
                                                            <button
                                                                disabled
                                                                className="w-full py-2.5 bg-gray-100 text-gray-400 border border-gray-200 rounded-xl text-sm font-bold cursor-not-allowed mb-2"
                                                            >
                                                                Connect
                                                            </button>
                                                            <p className="text-[9px] text-gray-400 font-bold text-center uppercase tracking-tighter">Students connect with Alumni only</p>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleConnect(mentor._id)}
                                                            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
                                                        >
                                                            Connect
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }) : <p className="text-gray-500 col-span-2 text-center py-4">No mentors available at the moment.</p>}
                                </div>
                            </motion.div>
                        )}

                        {/* ALUMNI: Pending Connection Requests */}
                        {user.role === 'alumni' && requests.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden"
                            >
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Users className="w-5 h-5 text-indigo-600" />
                                        Pending Connection Requests
                                    </h2>
                                </div>
                                <div className="p-6 space-y-4">
                                    {requests.map((request) => (
                                        <div key={request._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
                                            <div className="flex items-start gap-4 mb-4 sm:mb-0">
                                                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">
                                                    {request.requester.profilePhoto ? (
                                                        <img src={request.requester.profilePhoto} alt={request.requester.name} className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        request.requester.name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{request.requester.name}</h3>
                                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                        Student • {request.requester.branch || 'General'}
                                                    </p>
                                                    {request.message && (
                                                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded-lg italic">
                                                            "{request.message}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                                <button
                                                    onClick={() => handleRequestAction(request._id, 'rejected')}
                                                    className="px-5 py-2 text-red-600 bg-red-50 hover:bg-red-100 font-bold text-sm rounded-xl transition-colors"
                                                >
                                                    Decline
                                                </button>
                                                <button
                                                    onClick={() => handleRequestAction(request._id, 'accepted')}
                                                    className="px-5 py-2 text-white bg-indigo-600 hover:bg-indigo-700 font-bold text-sm rounded-xl shadow-md shadow-indigo-200 transition-colors"
                                                >
                                                    Accept
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Video className="w-5 h-5 text-indigo-600" />
                                        Sessions Overview
                                    </h2>
                                    <div className="flex bg-gray-100 p-1 rounded-xl">
                                        <button 
                                            onClick={() => setSessionTab('upcoming')}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${sessionTab === 'upcoming' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Upcoming ({upcomingSessions.length})
                                        </button>
                                        <button 
                                            onClick={() => setSessionTab('past')}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${sessionTab === 'past' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            History ({pastSessions.length})
                                        </button>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => navigate(user.role === 'alumni' ? '/alumni/sessions' : '/student/sessions')}
                                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap transition-colors"
                                >
                                    View Full Calendar
                                </button>
                            </div>
                            <div className="p-6">
                                {(sessionTab === 'upcoming' ? upcomingSessions : pastSessions).length > 0 ? (
                                    <div className="space-y-4">
                                        {(sessionTab === 'upcoming' ? upcomingSessions : pastSessions).map((session) => {
                                            const timeInfo = formatSessionTime(session.date, session.startTime);
                                            const isPast = sessionTab === 'past';
                                            
                                            return (
                                                <div key={session._id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl transition-all border ${isPast ? 'bg-gray-50/50 border-gray-100 opacity-80' : 'bg-indigo-50/50 border-indigo-100/50 hover:bg-indigo-50'}`}>
                                                    <div className="flex items-start gap-4 mb-4 sm:mb-0">
                                                        <div className={`w-14 h-14 rounded-2xl shadow-sm flex flex-col items-center justify-center border transition-transform group-hover:scale-105 ${isPast ? 'bg-white border-gray-200 text-gray-400' : 'bg-white border-indigo-100 text-indigo-600'}`}>
                                                            <span className="text-lg font-black leading-none">{timeInfo.day}</span>
                                                            <span className="text-[10px] font-black mt-1 tracking-tighter">{timeInfo.month}</span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="font-bold text-gray-900 truncate">{session.title}</h3>
                                                                {session.isGlobal && (
                                                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-black rounded-md uppercase tracking-wider">Global</span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                                                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                                                with {session.host?._id === user._id ? (session.student?.name || 'Students') : (session.host?.name || 'Mentor')}
                                                                <span className="text-gray-300">•</span>
                                                                {timeInfo.time}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-3">
                                                        {isPast ? (
                                                            <span className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-xs font-black flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                                                Completed Successfully
                                                            </span>
                                                        ) : (
                                                            session.meetLink && (
                                                                <a
                                                                    href={session.meetLink}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-black rounded-xl hover:bg-indigo-700 transition-all text-center shadow-lg shadow-indigo-100 active:scale-95"
                                                                >
                                                                    Join Session
                                                                </a>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                            <Calendar className={`w-8 h-8 ${sessionTab === 'upcoming' ? 'text-indigo-400' : 'text-gray-300'}`} />
                                        </div>
                                        <h4 className="text-gray-900 font-bold">No {sessionTab} sessions</h4>
                                        <p className="text-gray-500 text-sm mt-1">
                                            {sessionTab === 'upcoming' 
                                                ? "You're all caught up! No sessions scheduled yet." 
                                                : "No historical data found in your records."}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* My Activity Quick Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white rounded-[2.5rem] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 mt-8"
                        >
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                        <Activity className="w-7 h-7 text-indigo-600" />
                                        My Engagement
                                    </h2>
                                    <p className="text-sm font-medium text-gray-500 mt-1.5 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                                        Tracking your professional contributions
                                    </p>
                                </div>
                                <button 
                                    onClick={() => navigate(user.role === 'alumni' ? '/alumni/profile' : '/student/profile')}
                                    className="px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-2xl text-xs font-black hover:bg-indigo-100 transition-all active:scale-95 border border-indigo-100/50"
                                >
                                    Refine Profile Activity
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { 
                                        label: 'My Posts', 
                                        value: activityData.posts?.length || 0, 
                                        icon: FileText, 
                                        color: 'from-blue-500/10 to-indigo-500/10', 
                                        iconColor: 'text-blue-600',
                                        desc: 'Content published'
                                    },
                                    { 
                                        label: 'Discussions', 
                                        value: activityData.comments?.length || 0, 
                                        icon: MessageSquare, 
                                        color: 'from-emerald-500/10 to-teal-500/10', 
                                        iconColor: 'text-emerald-600',
                                        desc: 'Comments shared'
                                    },
                                    { 
                                        label: 'Platform Reposts', 
                                        value: activityData.reposts?.length || 0, 
                                        icon: Share2, 
                                        color: 'from-purple-500/10 to-fuchsia-500/10', 
                                        iconColor: 'text-purple-600',
                                        desc: 'Shared insights'
                                    }
                                ].map((act, idx) => (
                                    <motion.div
                                        key={idx}
                                        whileHover={{ y: -5, scale: 1.02 }}
                                        onClick={() => navigate(user.role === 'alumni' ? '/alumni/profile' : '/student/profile')}
                                        className="relative group cursor-pointer"
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${act.color} rounded-[2rem] transition-all group-hover:shadow-xl group-hover:shadow-indigo-500/5 border border-white`}></div>
                                        <div className="relative p-7 flex flex-col items-center text-center">
                                            <div className={`w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-gray-50 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                                                <act.icon className={`w-7 h-7 ${act.iconColor}`} />
                                            </div>
                                            <span className="text-4xl font-black text-gray-900 mb-1">{act.value}</span>
                                            <span className="text-xs font-black text-gray-800 uppercase tracking-widest">{act.label}</span>
                                            <div className="mt-3 px-3 py-1 bg-white/50 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                                <p className="text-[10px] text-gray-500 font-bold whitespace-nowrap">
                                                    {act.desc}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* ADMIN: Create Session (Only visible to admin) */}
                        {user.role === 'admin' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl shadow-lg p-8 flex items-center justify-between text-white"
                            >
                                <div>
                                    <h2 className="text-xl font-bold">Host a Session</h2>
                                    <p className="text-indigo-100 mt-1 opacity-90">Schedule a new webinar or mentorship session for the community.</p>
                                </div>
                                <button className="flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors font-semibold shadow-sm">
                                    <Plus className="w-5 h-5" />
                                    Create Session
                                </button>
                            </motion.div>
                        )}
                    </div>

                    {/* Right Column (Sidebar) */}
                    <div className="space-y-8 lg:sticky lg:top-24 h-fit">

                        {/* PHASE 1: Career Impact Success Meter (Alumni Only) */}
                        {user.role === 'alumni' && analytics?.successMetrics && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white rounded-[2.5rem] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden relative group"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-indigo-100/50 transition-colors"></div>
                                
                                <div className="relative z-10 text-center">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Mentorship Success Score</h3>
                                    
                                    {/* Success Gauge */}
                                    <div className="relative w-40 h-40 mx-auto mb-8">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle
                                                cx="80" cy="80" r="70"
                                                fill="none" stroke="#F3F4F6" strokeWidth="12"
                                            />
                                            <motion.circle
                                                cx="80" cy="80" r="70"
                                                fill="none" stroke="url(#successGradient)" strokeWidth="12"
                                                strokeDasharray="440"
                                                initial={{ strokeDashoffset: 440 }}
                                                animate={{ strokeDashoffset: 440 - (440 * analytics.successMetrics.overall) / 100 }}
                                                transition={{ duration: 2, ease: "easeOut" }}
                                                strokeLinecap="round"
                                            />
                                            <defs>
                                                <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#6366F1" />
                                                    <stop offset="100%" stopColor="#A855F7" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-4xl font-black text-gray-900 tracking-tighter">{analytics.successMetrics.overall}%</span>
                                            <span className="text-[10px] font-black text-emerald-500 uppercase mt-1 tracking-widest">Growth Peak</span>
                                        </div>
                                    </div>

                                    {/* Detailed Stats */}
                                    <div className="space-y-4 text-left">
                                        {[
                                            { label: 'Quality', val: analytics.successMetrics.quality, color: 'bg-blue-500', icon: Star },
                                            { label: 'Volume', val: analytics.successMetrics.volume, color: 'bg-purple-500', icon: TrendingUp },
                                            { label: 'Community', val: analytics.successMetrics.engagement, color: 'bg-pink-500', icon: Award }
                                        ].map((m, i) => (
                                            <div key={i}>
                                                <div className="flex justify-between items-center mb-1.5 px-1">
                                                    <span className="text-[10px] font-bold text-gray-500 flex items-center gap-2">
                                                        <m.icon className="w-3 h-3" />
                                                        {m.label}
                                                    </span>
                                                    <span className="text-[10px] font-black text-gray-900">{m.val}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${m.val}%` }}
                                                        transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                                                        className={`h-full ${m.color} rounded-full`}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button 
                                        onClick={() => window.open('https://www.linkedin.com', '_blank')}
                                        className="mt-8 w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[11px] font-black rounded-2xl shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all active:scale-95"
                                    >
                                        Share My Success on LinkedIn
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* PHASE 3: Student Demand & Trend Intelligence (Alumni Only) */}
                        {user.role === 'alumni' && analytics?.trends && analytics.trends.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white rounded-[2.5rem] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden group"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                                            Student Demand
                                        </h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest">Market Intelligence</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 animate-pulse">
                                        <Zap className="w-4 h-4 fill-current" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-xs font-medium text-gray-500 bg-slate-50 p-4 rounded-2xl border border-gray-100 leading-relaxed">
                                        Students are actively seeking guidance in these areas. <span className="text-indigo-600 font-bold">Host a session to help!</span>
                                    </p>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        {analytics.trends.map((item, idx) => (
                                            <motion.div
                                                key={idx}
                                                whileHover={{ scale: 1.05, y: -2 }}
                                                className="px-4 py-2 bg-indigo-50 border border-indigo-100/50 rounded-xl text-[11px] font-black text-indigo-700 flex items-center gap-2 cursor-default group"
                                            >
                                                <span className="capitalize">{item.topic}</span>
                                                <span className="text-[9px] bg-white px-1.5 py-0.5 rounded-md shadow-sm border border-indigo-50 text-indigo-400 group-hover:text-indigo-600 transition-colors">
                                                    +{item.demand}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                <button 
                                    onClick={() => navigate('/alumni/sessions')}
                                    className="mt-8 w-full py-3.5 border border-dashed border-indigo-200 text-indigo-600 text-[11px] font-black rounded-2xl hover:bg-indigo-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Create Demand-Driven Session
                                </button>
                            </motion.div>
                        )}

                        {/* PHASE 4: Professional Milestone Timeline (Alumni Only) */}
                        {user.role === 'alumni' && analytics?.milestones && analytics.milestones.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-white rounded-[2.5rem] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden mt-8"
                            >
                                <div className="mb-8">
                                    <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                                        <Rocket className="w-5 h-5 text-indigo-600" />
                                        Your Engagement Journey
                                    </h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest">Professional Landmarks</p>
                                </div>

                                <div className="space-y-8 relative">
                                    <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-100"></div>
                                    
                                    {analytics.milestones.map((milestone, idx) => {
                                        const IconComp = { Rocket, Trophy, Zap, Star }[milestone.icon] || Rocket;
                                        return (
                                            <motion.div 
                                                key={idx}
                                                initial={{ opacity: 0, x: 10 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                className="relative pl-10 group"
                                            >
                                                <div className={`absolute left-0 top-0 w-8 h-8 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center z-10 shadow-sm group-hover:border-indigo-500 transition-colors`}>
                                                    <IconComp className={`w-4 h-4 ${milestone.color || 'text-indigo-600'}`} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h4 className="text-[13px] font-black text-gray-900">{milestone.title}</h4>
                                                        <span className="text-[9px] font-bold text-gray-400">
                                                            {new Date(milestone.date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                                                        {milestone.description}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* Active Chats */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <MessageCircle className="w-5 h-5 text-indigo-600" />
                                    Messages
                                </h2>
                                <span className="bg-indigo-100 text-indigo-600 text-xs font-bold px-2 py-1 rounded-full">
                                    {connections.length}
                                </span>
                            </div>
                            <div className="p-2 space-y-1">
                                {connections.slice(0, 4).map((conn) => (
                                    <div
                                        key={conn._id}
                                        onClick={() => navigate(`/user/${conn._id}`)}
                                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors relative group"
                                    >
                                        <div className="relative">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold border border-indigo-50">
                                                {conn.name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{conn.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{conn.company || conn.branch || 'Connected'}</p>
                                        </div>
                                    </div>
                                ))}
                                {connections.length === 0 && (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-gray-500">No active chats yet.</p>
                                        <button onClick={() => navigate('/student/mentors')} className="text-xs text-indigo-600 hover:underline mt-2">Find mentors to connect</button>
                                    </div>
                                )}
                            </div>
                            {connections.length > 0 && (
                                <div className="p-4 border-t border-gray-100">
                                    <button
                                        onClick={() => navigate(user.role === 'student' ? '/student/messages' : '/alumni/messages')}
                                        className="w-full py-2.5 text-sm text-indigo-600 font-medium bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
                                    >
                                        Open Messenger
                                    </button>
                                </div>
                            )}
                        </motion.div>

                        {/* Announcements */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 }}
                            className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-indigo-600" />
                                    Announcements
                                </h2>
                            </div>
                            <div className="p-4 space-y-4">
                                {announcements.length > 0 ? announcements.slice(0, 3).map((item) => (
                                    <div 
                                        key={item._id} 
                                        onClick={() => setSelectedAnnouncement(item)}
                                        className="flex gap-3 items-start p-3 rounded-2xl hover:bg-gray-50 transition-all cursor-pointer group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <Bell className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{item.title}</p>
                                            <p className="text-[10px] text-gray-400 font-bold mt-1 flex items-center gap-1.5 uppercase tracking-widest">
                                                <Calendar className="w-3 h-3 text-gray-300" />
                                                {new Date(item.scheduledAt || item.date || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors self-center" />
                                    </div>
                                )) : <p className="text-sm text-gray-500 text-center py-4">No active announcements</p>}
                            </div>
                        </motion.div>

                        {/* Profile Strength (New Widget) */}
                        {user.role === 'student' && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.9 }}
                                className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-lg p-6 text-white overflow-hidden relative"
                            >
                                <div className="relative z-10">
                                    <h3 className="font-bold text-lg mb-1">Complete Your Profile</h3>
                                    <p className="text-purple-100 text-xs mb-4">Complete your profile to get better mentor recommendations.</p>

                                    <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                                        <div className="bg-white h-2 rounded-full w-[75%]"></div>
                                    </div>
                                    <p className="text-right text-xs font-bold">75%</p>

                                    <button
                                        onClick={() => navigate('/profile')}
                                        className="mt-4 w-full py-2 bg-white text-indigo-600 text-sm font-bold rounded-lg hover:bg-indigo-50 transition-colors"
                                    >
                                        Update Profile
                                    </button>
                                </div>
                                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mentor Profile Modal */}
            {selectedMentorProfile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedMentorProfile(null)}></div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-3xl shadow-2xl overflow-hidden z-10 w-full max-w-lg relative"
                    >
                        <button
                            onClick={() => setSelectedMentorProfile(null)}
                            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors z-20"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="h-32 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 relative">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                        </div>
                        <div className="px-8 pb-8 relative">
                            <div className="-mt-16 mb-4 flex justify-center">
                                <div className="w-32 h-32 rounded-full border-4 border-white bg-indigo-50 flex items-center justify-center text-4xl font-black text-indigo-600 shadow-xl overflow-hidden">
                                    {selectedMentorProfile.profilePhoto ? (
                                        <img src={selectedMentorProfile.profilePhoto} alt={selectedMentorProfile.name} className="w-full h-full object-cover" />
                                    ) : (
                                        selectedMentorProfile.name?.charAt(0).toUpperCase()
                                    )}
                                </div>
                            </div>

                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-black text-gray-900 flex items-center justify-center gap-2">
                                    {selectedMentorProfile.name}
                                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1.5 rounded-md border border-emerald-200/50 uppercase tracking-widest font-bold">Verified Alumni</span>
                                </h2>
                                <p className="text-gray-500 mt-2 font-medium flex items-center justify-center gap-2">
                                    <Briefcase className="w-4 h-4 text-indigo-400" />
                                    {selectedMentorProfile.jobTitle || 'Professional'} {selectedMentorProfile.company ? `at ${selectedMentorProfile.company}` : ''}
                                </p>
                            </div>

                            <div className="space-y-4">
                                {/* Details Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100 flex items-start gap-3 hover:shadow-md transition-shadow">
                                        <div className="bg-indigo-100 p-2 rounded-xl">
                                            <GraduationCap className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Education</p>
                                            <p className="text-sm font-bold text-gray-900">{selectedMentorProfile.branch || 'General'}</p>
                                            <p className="text-xs text-gray-500 font-medium">Class of {selectedMentorProfile.graduationYear || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100 flex items-start gap-3 hover:shadow-md transition-shadow">
                                        <div className="bg-blue-100 p-2 rounded-xl">
                                            <MapPin className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Base Location</p>
                                            <p className="text-sm font-bold text-gray-900">{selectedMentorProfile.location || 'Remote'}</p>
                                            <p className="text-xs text-gray-500 font-medium">Global Network</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Skills */}
                                {selectedMentorProfile.expertiseAreas && selectedMentorProfile.expertiseAreas.length > 0 ? (
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-gray-100">
                                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Expertise & Skills</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedMentorProfile.expertiseAreas.map((skill, i) => (
                                                <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-bold border border-indigo-100/50 shadow-sm">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-gray-100">
                                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Expertise & Skills</h3>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-bold border border-gray-200">
                                                General Mentorship
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button
                                    onClick={() => setSelectedMentorProfile(null)}
                                    className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-black hover:bg-gray-200 transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedMentorProfile(null);
                                        navigate(`/user/${selectedMentorProfile._id}`);
                                    }}
                                    className="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors"
                                >
                                    View Full Profile
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Announcement Detail Modal */}
            <AnimatePresence>
                {selectedAnnouncement && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedAnnouncement(null)}
                            className="absolute inset-0 bg-indigo-900/40 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl z-[101] w-full max-w-xl overflow-hidden relative border border-white"
                        >
                            {/* Header Gradient */}
                            <div className="h-32 bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 relative flex items-end p-8">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                                <div className="relative z-10">
                                    <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black text-white uppercase tracking-[0.2em] w-fit mb-2">Platform Update</div>
                                    <h2 className="text-2xl font-black text-white tracking-tight line-clamp-1">{selectedAnnouncement.title}</h2>
                                </div>
                                <button
                                    onClick={() => setSelectedAnnouncement(null)}
                                    className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md transition-all active:scale-90"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-8">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-xl border border-orange-100">
                                        <Calendar className="w-4 h-4 text-orange-600" />
                                        <span className="text-xs font-black text-orange-700 uppercase tracking-widest">
                                            {new Date(selectedAnnouncement.scheduledAt || selectedAnnouncement.date || Date.now()).toLocaleDateString([], { 
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric' 
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Global Notice</span>
                                    </div>
                                </div>

                                <div className="bg-slate-50/50 p-6 rounded-3xl border border-gray-100 mb-8">
                                    <p className="text-gray-800 font-medium leading-[1.8] text-base whitespace-pre-wrap">
                                        {selectedAnnouncement.content}
                                    </p>
                                </div>

                                <div className="flex items-start gap-4 p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-50">
                                        <Megaphone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-indigo-900 uppercase tracking-tight">Verified Announcement</p>
                                        <p className="text-[11px] text-indigo-600 font-bold mt-0.5">This notice is issued by platform administrators.</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedAnnouncement(null)}
                                    className="mt-8 w-full py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200"
                                >
                                    Dismiss Notice
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Connections List Modal */}
            <AnimatePresence>
                {isConnectionsModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsConnectionsModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl z-10 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                        <Users className="w-7 h-7 text-indigo-600" />
                                        My Network
                                    </h2>
                                    <p className="text-sm font-medium text-gray-500 mt-1">Total {connections.length} Connections</p>
                                </div>
                                <button
                                    onClick={() => setIsConnectionsModalOpen(false)}
                                    className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-2xl transition-all active:scale-90"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar overflow-x-hidden">
                                {connections.length === 0 ? (
                                    <div className="py-20 text-center">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                                            <Users className="w-10 h-10 text-gray-300" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800">No connections yet</h3>
                                        <p className="text-gray-500 mt-2 font-medium">Start exploring to build your network!</p>
                                    </div>
                                ) : (
                                    connections.map((conn) => (
                                        <div
                                            key={conn._id}
                                            className="flex items-center gap-4 p-4 hover:bg-indigo-50/50 rounded-3xl transition-all group border border-transparent hover:border-indigo-100"
                                        >
                                            <div 
                                                className="relative cursor-pointer shrink-0"
                                                onClick={() => {
                                                    setIsConnectionsModalOpen(false);
                                                    navigate(`/user/${conn._id}`);
                                                }}
                                            >
                                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-xl border border-white shadow-sm overflow-hidden">
                                                    {conn.profilePhoto ? (
                                                        <img src={conn.profilePhoto} alt={conn.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        conn.name?.charAt(0)
                                                    )}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 
                                                    className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors cursor-pointer truncate"
                                                    onClick={() => {
                                                        setIsConnectionsModalOpen(false);
                                                        navigate(`/user/${conn._id}`);
                                                    }}
                                                >
                                                    {conn.name}
                                                </h3>
                                                <p className="text-xs text-gray-500 font-medium truncate">
                                                    {conn.headline || conn.currentPosition || 'MMCOE Professional'}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setIsConnectionsModalOpen(false);
                                                        navigate(user.role === 'student' ? '/student/messages' : '/alumni/messages');
                                                    }}
                                                    className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors"
                                                    title="Send Message"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-100">
                                <button
                                    onClick={() => {
                                        setIsConnectionsModalOpen(false);
                                        navigate(user.role === 'student' ? '/student/messages' : '/alumni/messages');
                                    }}
                                    className="w-full py-4 bg-white text-indigo-600 font-black rounded-2xl border border-indigo-100 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                                >
                                    Open Full Messenger
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
