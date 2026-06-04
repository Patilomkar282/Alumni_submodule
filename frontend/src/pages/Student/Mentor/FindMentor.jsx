import React, { useState, useEffect } from 'react';
import MentorCard from '../../../components/Student/Mentor/MentorCard';
import MentorProfileModal from '../../../components/Student/Mentor/MentorProfileModal';
import ChatBox from '../../../components/Student/Mentor/ChatBox';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingScreen from '../../../components/LoadingScreen';

export default function FindMentor() {
    const [selectedMentor, setSelectedMentor] = useState(null);
    const [chatMentor, setChatMentor] = useState(null);
    const [connections, setConnections] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    // State for data and filters
    const [allMentors, setAllMentors] = useState([]);
    const [recommendedMentors, setRecommendedMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCompany, setSelectedCompany] = useState('All');
    const [selectedRole, setSelectedRole] = useState('All');

    // Debounced search trigger
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isUsingAI, setIsUsingAI] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        const fetchMentors = async () => {
            try {
                setLoading(true);
                const token = userInfo?.token;

                const mapUserData = (data) => data.map(user => ({
                    id: user._id,
                    name: user.name,
                    role: user.currentPosition || 'Alumni',
                    company: user.company || 'N/A',
                    location: user.location || 'N/A',
                    image: user.profilePhoto,
                    skills: user.skills || [],
                    expertiseAreas: user.expertiseAreas || [],
                    email: user.email,
                    linkedin: user.linkedinUrl || '',
                    github: user.githubUrl || '',
                    headline: user.headline || '',
                    bio: user.bio || 'No bio available.',
                    score: user.score,
                    rawRole: user.role,
                    education: {
                        batch: user.graduationYear ? `Class of ${user.graduationYear}` : 'N/A',
                        branch: user.branch || 'N/A'
                    },
                    achievements: [
                        {
                            title: user.currentPosition || 'Alumni',
                            year: 'Present',
                            description: `Working at ${user.company || 'Unknown Company'}`
                        }
                    ]
                }));

                // Smart Search vs AI Recommendations Routing
                if (debouncedSearch.trim()) {
                    setIsUsingAI(false);
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/users?role=alumni&search=${encodeURIComponent(debouncedSearch)}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (!response.ok) throw new Error('Failed to fetch mentors');
                    setAllMentors(mapUserData(await response.json()));
                    setRecommendedMentors([]);
                } else {
                    setIsUsingAI(true);
                    const [recRes, allRes] = await Promise.all([
                        fetch(`${import.meta.env.VITE_API_URL}/api/auth/users/recommendations`, { headers: { Authorization: `Bearer ${token}` } }),
                        fetch(`${import.meta.env.VITE_API_URL}/api/auth/users?role=alumni`, { headers: { Authorization: `Bearer ${token}` } })
                    ]);

                    if (recRes.ok) setRecommendedMentors(mapUserData(await recRes.json()));
                    if (allRes.ok) setAllMentors(mapUserData(await allRes.json()));
                }

                // Fetch connections
                const connectionsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/connections`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (connectionsRes.ok) {
                    const connectionsData = await connectionsRes.json();
                    setConnections(connectionsData);
                }

                // Fetch Sent Requests (Student)
                const sentRequestsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/connections/sent`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (sentRequestsRes.ok) {
                    const sentRequestsData = await sentRequestsRes.json();
                    setSentRequests(sentRequestsData);
                }

            } catch (err) {
                console.error("Error fetching mentors:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMentors();
    }, [debouncedSearch]);

    // Extract unique companies and roles for remaining local filters
    const allUniqueMentors = [...allMentors, ...recommendedMentors];
    const companies = ['All', ...new Set(allUniqueMentors.map(m => m.company))];
    const roles = ['All', ...new Set(allUniqueMentors.map(m => m.role))];

    // Sub-filtering based on dropdowns (text search is offloaded to backend)
    const filterFunction = (mentor) => {
        const matchesCompany = selectedCompany === 'All' || mentor.company === selectedCompany;
        const matchesRole = selectedRole === 'All' || mentor.role === selectedRole;
        return matchesCompany && matchesRole;
    };

    const filteredAllMentors = allMentors.filter(filterFunction);
    const filteredRecommendedMentors = recommendedMentors.filter(filterFunction);

    const handleConnect = async (mentorId) => {
        try {
            const token = userInfo?.token;

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/connections/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    recipientId: mentorId,
                    message: "I'd like to connect with you to seek mentorship."
                })
            });

            if (res.ok) {
                const data = await res.json();
                // support both {connection: {...}} and {...} formats for backward compatibility
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

    const handleViewProfile = (mentor) => {
        setSelectedMentor(mentor);
    };

    const handleMessage = (mentor) => {
        setChatMentor(mentor);
    };

    if (loading) {
        return <LoadingScreen />;
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-red-500 text-center">
                    <p className="text-xl font-semibold">Error loading mentors</p>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-gray-900 via-indigo-900 to-slate-900 text-white py-16 md:py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-white/10 text-blue-200 text-xs font-black tracking-widest uppercase backdrop-blur-md mb-6 border border-white/10 shadow-lg">
                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span> MMCOE Alumni Network
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight">
                            Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 drop-shadow-sm">Match</span> Engine
                        </h1>
                        <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto font-medium opacity-90">
                            Our AI Recommendation system automatically scans your skills, interests, and career goals to connect you with the perfect alumni mentor.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Filter Section (Sticky) */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm sticky top-[52px] z-30 transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        {/* Search Bar */}
                        <div className="relative w-full md:w-[400px]">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-indigo-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm font-medium"
                                placeholder="Search name, role, or skills..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                            <div className="relative min-w-[150px] flex-shrink-0">
                                <select
                                    value={selectedCompany}
                                    onChange={(e) => setSelectedCompany(e.target.value)}
                                    className="block w-full pl-4 pr-10 py-3 text-sm font-bold border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-2xl shadow-sm appearance-none bg-white cursor-pointer text-gray-700"
                                >
                                    {companies.map(company => (
                                        <option key={company} value={company}>{company === 'All' ? '🏢 All Companies' : company}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400">
                                    <ChevronDown className="h-4 w-4" />
                                </div>
                            </div>

                            <div className="relative min-w-[150px] flex-shrink-0">
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="block w-full pl-4 pr-10 py-3 text-sm font-bold border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-2xl shadow-sm appearance-none bg-white cursor-pointer text-gray-700"
                                >
                                    {roles.map(role => (
                                        <option key={role} value={role}>{role === 'All' ? '💼 All Roles' : role}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400">
                                    <ChevronDown className="h-4 w-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mentor Grids */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                
                {isUsingAI ? (
                    <div className="space-y-16">
                        {/* Recommendations Section */}
                        {filteredRecommendedMentors.length > 0 && (
                            <div>
                                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                        <span className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-sm">
                                            <Search className="w-5 h-5 text-white" />
                                        </span>
                                        Top AI Recommendations For You
                                    </h2>
                                    <span className="inline-flex px-3 py-1 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 text-xs font-bold uppercase tracking-widest border border-emerald-100 rounded-full">
                                        Powered by Atlas Search
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                                    {filteredRecommendedMentors.map((mentor) => (
                                        <MentorCard
                                            key={mentor.id}
                                            mentor={mentor}
                                            currentUserRole={userInfo?.role}
                                            isConnected={connections.some(conn => conn._id === mentor.id)}
                                            isPending={sentRequests.some(req => (req?.recipient?._id === mentor.id || req?.recipient === mentor.id) && req?.status === 'pending')}
                                            onConnect={handleConnect}
                                            onViewProfile={handleViewProfile}
                                            onMessage={handleMessage}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* All Mentors Section */}
                        {filteredAllMentors.length > 0 && (
                            <div>
                                <div className="mb-6 flex items-center justify-between">
                                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                        <span className="p-2 bg-gray-100 text-gray-600 rounded-xl shadow-sm">
                                            <Filter className="w-5 h-5" />
                                        </span>
                                        Browse All Alumni
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                                    {filteredAllMentors.map((mentor) => (
                                        <MentorCard
                                            key={mentor.id}
                                            mentor={mentor}
                                            currentUserRole={userInfo?.role}
                                            isConnected={connections.some(conn => conn._id === mentor.id)}
                                            isPending={sentRequests.some(req => (req?.recipient?._id === mentor.id || req?.recipient === mentor.id) && req?.status === 'pending')}
                                            onConnect={handleConnect}
                                            onViewProfile={handleViewProfile}
                                            onMessage={handleMessage}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {filteredRecommendedMentors.length === 0 && filteredAllMentors.length === 0 && (
                            <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
                                <div className="mx-auto h-20 w-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-400 mb-6 shadow-inner">
                                    <Search className="h-10 w-10" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900">No mentors found</h3>
                                <p className="mt-3 text-gray-500 font-medium">Try adjusting your filters to find what you're looking for.</p>
                                <button
                                    onClick={() => { setSearchQuery(''); setSelectedCompany('All'); setSelectedRole('All'); }}
                                    className="mt-8 inline-flex items-center px-6 py-3 border border-gray-200 shadow-sm text-sm font-bold rounded-xl text-indigo-700 bg-white hover:bg-gray-50 hover:text-indigo-800 transition-colors"
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                <span className="p-2 bg-gray-100 text-gray-600 rounded-xl shadow-sm">
                                    <Search className="w-5 h-5" />
                                </span>
                                Search Results ({filteredAllMentors.length})
                            </h2>
                        </div>
                        {filteredAllMentors.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                                {filteredAllMentors.map((mentor) => (
                                    <MentorCard
                                        key={mentor.id}
                                        mentor={mentor}
                                        currentUserRole={userInfo?.role}
                                        isConnected={connections.some(conn => conn._id === mentor.id)}
                                        isPending={sentRequests.some(req => (req?.recipient?._id === mentor.id || req?.recipient === mentor.id) && req?.status === 'pending')}
                                        onConnect={handleConnect}
                                        onViewProfile={handleViewProfile}
                                        onMessage={handleMessage}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
                                <div className="mx-auto h-20 w-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-400 mb-6 shadow-inner">
                                    <Search className="h-10 w-10" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900">No matches found</h3>
                                <p className="mt-3 text-gray-500 font-medium">Try a different search term or expanding your filters.</p>
                                <button
                                    onClick={() => { setSearchQuery(''); setSelectedCompany('All'); setSelectedRole('All'); }}
                                    className="mt-8 inline-flex items-center px-6 py-3 border border-gray-200 shadow-sm text-sm font-bold rounded-xl text-indigo-700 bg-white hover:bg-gray-50 hover:text-indigo-800 transition-colors"
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Mentor Profile Modal */}
            {selectedMentor && (
                <MentorProfileModal
                    mentor={selectedMentor}
                    isConnected={connections.some(conn => conn._id === selectedMentor.id)}
                    isPending={sentRequests.some(req => (req?.recipient?._id === selectedMentor.id || req?.recipient === selectedMentor.id) && req?.status === 'pending')}
                    onClose={() => setSelectedMentor(null)}
                    onConnect={handleConnect}
                    onMessage={handleMessage}
                />
            )}

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