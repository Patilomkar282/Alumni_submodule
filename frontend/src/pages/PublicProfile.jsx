import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Briefcase, MapPin, Linkedin, Award, BookOpen, GraduationCap, Building, Loader, CheckCircle2, AlertCircle, ArrowLeft, Calendar } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';
import MentorProfileModal from '../components/Student/Mentor/MentorProfileModal';
import ChatBox from '../components/Student/Mentor/ChatBox';

export default function PublicProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [connections, setConnections] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [chatMentor, setChatMentor] = useState(null);

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const token = userInfo?.token;
    const isSelf = userInfo?._id === id;

    useEffect(() => {
        if (!token) {
            navigate('/signin');
            return;
        }

        const fetchProfileData = async () => {
            try {
                setLoading(true);

                // Fetch User Data
                const userRes = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!userRes.ok) throw new Error('Failed to load profile');
                const userData = await userRes.json();

                // Map User Data to MentorProfileModal Format
                const mappedUser = {
                    id: userData._id,
                    name: userData.name,
                    role: userData.currentPosition || userData.role || 'Member',
                    company: userData.company || 'N/A',
                    location: userData.location || 'N/A',
                    image: userData.profilePhoto,
                    bannerPhoto: userData.bannerPhoto,
                    skills: userData.skills || [],
                    expertiseAreas: userData.expertiseAreas || [],
                    email: userData.email,
                    linkedin: userData.linkedinUrl || '',
                    github: userData.githubUrl || '',
                    headline: userData.headline || '',
                    bio: userData.bio || 'No bio available.',
                    score: userData.score,
                    education: {
                        batch: userData.graduationYear ? `Class of ${userData.graduationYear}` : (userData.currentYear ? `Year ${userData.currentYear}` : 'N/A'),
                        branch: userData.branch || 'N/A'
                    },
                    achievements: userData.experience ? userData.experience.map(exp => ({
                        title: exp.title,
                        year: exp.mode || 'Present',
                        description: `Working at ${exp.company} - Location: ${exp.location || 'N/A'}`
                    })) : [
                        {
                            title: userData.currentPosition || 'Member',
                            year: 'Present',
                            description: `Currently at ${userData.company || 'Unknown Company'}`
                        }
                    ]
                };
                setUserProfile(mappedUser);

                // Fetch Connections Context
                if (!isSelf) {
                    const [connRes, reqRes] = await Promise.all([
                        fetch(`${import.meta.env.VITE_API_URL}/api/connections`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        }),
                        fetch(`${import.meta.env.VITE_API_URL}/api/connections/sent`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        })
                    ]);

                    if (connRes.ok) setConnections(await connRes.json());
                    if (reqRes.ok) setSentRequests(await reqRes.json());
                }

            } catch (err) {
                console.error("Error fetching public profile:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [id, token, navigate]);

    const handleConnect = async (mentorId) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/connections/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    recipientId: mentorId,
                    message: "I'd like to connect with you."
                })
            });

            if (res.ok) {
                const data = await res.json();
                const newConnection = data.connection || data;
                setSentRequests(prev => [...prev, newConnection]);
            } else {
                const data = await res.json();
                alert(data.message || "Failed to send request.");
            }
        } catch (error) {
            console.error("Error sending connection request:", error);
            alert("An error occurred. Please try again.");
        }
    };

    if (loading) return <LoadingScreen />;

    if (error || !userProfile) {
        return (
            <div className="min-h-screen bg-white pt-24 px-4 flex flex-col items-center justify-center">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
                <p className="text-gray-500">{error || "The user you're looking for doesn't exist or is private."}</p>
                <button onClick={() => navigate(-1)} className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg">Go Back</button>
            </div>
        );
    }

    if (isSelf) {
        // Redirect to their own profile editing page
        navigate(userInfo.role === 'admin' ? '/admin/dashboard' : `/${userInfo.role}/profile`);
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Bar */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-[52px] z-30">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-indigo-600 font-bold transition-colors">
                        <ArrowLeft className="w-5 h-5 mr-1" />
                        Back to Network
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-indigo-100">
                            Member Profile
                        </span>
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
                {/* Header Profile Section */}
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="h-48 relative overflow-hidden">
                        {userProfile.bannerPhoto ? (
                            <img src={userProfile.bannerPhoto} alt="Banner" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 relative">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                            </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>

                    <div className="px-8 pb-10 relative">
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-8 -mt-20">
                            <div className="relative group">
                                <div className="w-40 h-40 rounded-full border-[6px] border-white bg-indigo-50 flex items-center justify-center text-6xl font-black text-indigo-600 shadow-2xl overflow-hidden relative z-10 transition-transform group-hover:scale-105">
                                    {userProfile.image ? (
                                        <img src={userProfile.image} alt={userProfile.name} className="w-full h-full object-cover aspect-square rounded-full" />
                                    ) : (
                                        userProfile.name?.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-emerald-500 border-4 border-white rounded-full z-20 flex items-center justify-center shadow-lg">
                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                </div>
                            </div>

                            <div className="flex-1 text-center md:text-left pb-2">
                                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">{userProfile.name}</h1>
                                    <div className="flex items-center gap-2">
                                        {userProfile.linkedin && (
                                            <a href={userProfile.linkedin.startsWith('http') ? userProfile.linkedin : `https://${userProfile.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors shadow-sm">
                                                <Linkedin className="w-5 h-5" />
                                            </a>
                                        )}
                                        {userProfile.github && (
                                            <a href={userProfile.github.startsWith('http') ? userProfile.github : `https://${userProfile.github}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-50 text-gray-900 rounded-lg hover:bg-gray-100 transition-colors shadow-sm">
                                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-gray-500 font-bold">
                                    <span className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-indigo-400" /> {userProfile.headline || userProfile.role}</span>
                                    <span className="flex items-center gap-2"><MapPin className="w-5 h-5 text-indigo-400" /> {userProfile.location}</span>
                                    <span className="flex items-center gap-2 underline decoration-indigo-200"><GraduationCap className="w-5 h-5 text-indigo-400" /> {userProfile.education.branch}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 min-w-[180px]">
                                {connections.some(conn => conn._id === userProfile.id) ? (
                                    <button
                                        onClick={() => setChatMentor(userProfile)}
                                        className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        Message
                                    </button>
                                ) : (userInfo?.role === 'student' && userProfile?.role === 'student') ? (
                                    <div className="flex flex-col gap-2">
                                        <button
                                            disabled
                                            className="w-full py-4 bg-gray-100 text-gray-400 font-bold rounded-2xl border border-gray-200 cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            Connect
                                        </button>
                                        <p className="text-[10px] text-gray-500 font-medium text-center bg-gray-50 p-2 rounded-lg leading-tight uppercase tracking-wider">
                                            Students can only connect with <span className="text-indigo-600 font-black">Alumni Mentors</span>
                                        </p>
                                    </div>
                                ) : sentRequests.some(req => (req?.recipient?._id === userProfile.id || req?.recipient === userProfile.id) && req?.status === 'pending') ? (
                                    <button
                                        disabled
                                        className="w-full py-4 bg-orange-50 text-orange-600 border border-orange-200 font-black rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed"
                                    >
                                        <Loader className="w-4 h-4 animate-spin" /> Pending
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleConnect(userProfile.id)}
                                        className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        Connect
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Details Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Information Grid (Like workspace) */}
                        <div className="bg-white rounded-[32px] p-10 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><User className="w-5 h-5" /></div>
                                About Member
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Full Name</label>
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-gray-700">{userProfile.name}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Email Address</label>
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-gray-700 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                                        {userProfile.email}
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Professional Headline</label>
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-gray-700">{userProfile.headline || userProfile.role}</div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Short Biography</label>
                                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 font-medium text-gray-600 leading-bold leading-relaxed whitespace-pre-wrap">
                                        {userProfile.bio || "No professional summary provided."}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Experience Section */}
                        {userProfile.achievements && userProfile.achievements.length > 0 && (
                            <div className="bg-white rounded-[32px] p-10 shadow-sm border border-gray-100">
                                <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><Building className="w-5 h-5" /></div>
                                    Work Experience
                                </h2>
                                <div className="space-y-6">
                                    {userProfile.achievements.map((achievement, index) => (
                                        <div key={index} className="group p-6 rounded-3xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/10 transition-all flex gap-6">
                                            <div className="flex-shrink-0 w-14 h-14 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-indigo-600 font-black text-xl">
                                                {achievement.title.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black text-gray-900">{achievement.title}</h4>
                                                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs mt-1 mb-3">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {achievement.year}
                                                </div>
                                                <p className="text-gray-600 font-medium leading-relaxed">{achievement.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Info Column */}
                    <div className="space-y-8">
                        {/* Skills Card */}
                        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600"><Award className="w-5 h-5" /></div>
                                Skills & Expertise
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Core Skills</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {(userProfile.skills.length > 0 ? userProfile.skills : userProfile.expertiseAreas).map((skill, index) => (
                                            <span key={index} className="px-4 py-2 bg-slate-50 border border-gray-100 text-gray-700 font-bold text-xs rounded-xl hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-600 transition-all cursor-default">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Education Quick Look */}
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[32px] p-8 shadow-xl shadow-indigo-100 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                                    <GraduationCap className="w-6 h-6" />
                                    Education
                                </h2>
                                <div className="space-y-4">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Institution</p>
                                        <p className="font-bold text-lg">Marathwada Mitra Mandal's College of Engineering</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Branch & Specialty</p>
                                        <p className="font-bold">{userProfile.education.branch}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Timeline</p>
                                        <p className="font-bold">{userProfile.education.batch}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Chat Box */}
            {chatMentor && (
                <ChatBox
                    mentor={chatMentor}
                    onClose={() => setChatMentor(null)}
                />
            )}
        </div>
    );
}
