import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Check, X, Building2, MapPin, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../../components/LoadingScreen';

export default function Requests() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            if (!userInfo) return;

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/connections/received`, {
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (requestId, status) => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/connections/request/${requestId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                // Remove the handled request from the list
                setRequests(prev => prev.filter(req => req._id !== requestId));
            }
        } catch (error) {
            console.error(`Failed to ${status} request`, error);
        }
    };

    const filteredRequests = requests.filter(req =>
        req.requester.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.requester.branch && req.requester.branch.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 pt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Users className="w-8 h-8 text-indigo-600" />
                        Connection Requests
                    </h1>
                    <p className="text-gray-500 mt-2">Manage your incoming mentorship requests from students.</p>
                </div>

                {requests.length > 0 && (
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none w-full sm:w-64"
                        />
                    </div>
                )}
            </div>

            {requests.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">You're all caught up!</h3>
                    <p className="text-gray-500">No new connection requests at the moment.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    <AnimatePresence>
                        {filteredRequests.map((request) => (
                            <motion.div
                                key={request._id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Profile Avatar */}
                                    <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate(`/user/${request.requester._id}`)}>
                                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-inner overflow-hidden border border-white/50 hover:ring-2 hover:ring-indigo-300 transition-all">
                                            {request.requester.profilePhoto ? (
                                                <img src={request.requester.profilePhoto} alt={request.requester.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-3xl font-bold text-indigo-700">
                                                    {request.requester.name.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Student Info */}
                                    <div className="flex-grow flex flex-col justify-center">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                            <div>
                                                <h3 
                                                    onClick={() => navigate(`/user/${request.requester._id}`)}
                                                    className="text-xl font-bold text-gray-900 cursor-pointer hover:text-indigo-600 hover:underline transition-colors"
                                                >
                                                    {request.requester.name}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                                                    <span className="flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-lg font-medium">
                                                        Student
                                                    </span>
                                                    {request.requester.branch && (
                                                        <span className="flex items-center gap-1">
                                                            <Building2 className="w-4 h-4 text-gray-400" />
                                                            {request.requester.branch}
                                                        </span>
                                                    )}
                                                    {request.requester.currentYear && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-4 h-4 text-gray-400" />
                                                            Year {request.requester.currentYear}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-3 shrink-0 mt-2 md:mt-0">
                                                <button
                                                    onClick={() => handleAction(request._id, 'rejected')}
                                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-gray-50 text-gray-700 hover:bg-red-50 hover:text-red-700 border border-gray-200 hover:border-red-200 transition-all shadow-sm"
                                                >
                                                    <X className="w-5 h-5" />
                                                    Decline
                                                </button>
                                                <button
                                                    onClick={() => handleAction(request._id, 'accepted')}
                                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                                >
                                                    <Check className="w-5 h-5" />
                                                    Accept
                                                </button>
                                            </div>
                                        </div>

                                        {/* Optional Message */}
                                        {request.message && (
                                            <div className="mt-4 bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 relative">
                                                <div className="absolute top-0 left-4 transform -translate-y-1/2">
                                                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-indigo-200">
                                                        Personal Message
                                                    </span>
                                                </div>
                                                <p className="text-gray-700 text-sm italic mt-1 leading-relaxed">"{request.message}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
