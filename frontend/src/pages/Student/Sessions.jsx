import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { Calendar, Clock, Video, Star, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../../components/LoadingScreen';

export default function StudentSessions() {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [feedbackData, setFeedbackData] = useState({ rating: 5, review: '' });
    const [ratingSessionId, setRatingSessionId] = useState(null);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/my-sessions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setSessions(data);
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFeedback = async (e) => {
        e.preventDefault();
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/${ratingSessionId}/feedback`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(feedbackData)
            });
            if (res.ok) {
                setRatingSessionId(null);
                fetchSessions();
            }
        } catch (error) {
            console.error("Failed to submit feedback:", error);
        }
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-12 font-sans px-4 sm:px-6 lg:px-8">
            <Header />
            <div className="max-w-6xl mx-auto space-y-8">
                
                <div className="flex justify-between items-center bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">My Mentorships</h1>
                        <p className="text-gray-500 font-medium mt-1">Manage your upcoming bookings and past sessions.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sessions.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-dashed border-gray-300">
                                <Calendar className="w-16 h-16 text-gray-300 mb-4" />
                                <h3 className="text-xl font-bold text-gray-800">No sessions yet</h3>
                                <p className="text-gray-500 mt-2 font-medium">Head over to Find Mentors to book a slot!</p>
                            </div>
                        ) : (
                            sessions.map(session => (
                                <div key={session._id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 flex flex-col group relative">
                                    <div className={`h-2 w-full ${session.status === 'scheduled' ? 'bg-indigo-500' : session.status === 'completed' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        
                                        <div className="flex items-center gap-4 mb-5">
                                            <div className="cursor-pointer" onClick={() => navigate(`/user/${session.host?._id}`)}>
                                                {session.host?.profilePhoto ? (
                                                    <img src={session.host.profilePhoto} alt="Host" className="w-14 h-14 rounded-2xl object-cover shadow-sm hover:ring-2 hover:ring-indigo-300 transition-all" />
                                                ) : (
                                                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center text-indigo-700 font-black text-xl shadow-inner hover:ring-2 hover:ring-indigo-300 transition-all">
                                                        {session.host?.name?.charAt(0) || 'M'}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 
                                                    onClick={() => navigate(`/user/${session.host?._id}`)}
                                                    className="font-bold text-gray-900 leading-tight cursor-pointer hover:text-indigo-600 transition-colors"
                                                >
                                                    {session.host?.name}
                                                </h3>
                                                <p className="text-xs text-indigo-600 font-semibold">{session.host?.currentPosition} at {session.host?.company}</p>
                                            </div>
                                        </div>

                                        <h4 className="font-black text-gray-800 text-lg mb-2">{session.title}</h4>
                                        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4 break-words">{session.description}</p>

                                        <div className="space-y-3 mt-auto bg-slate-50 p-4 rounded-2xl">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                <Calendar className="w-4 h-4 text-indigo-500" />
                                                <span>{new Date(session.date).toDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                <Clock className="w-4 h-4 text-emerald-500" />
                                                <span>{session.startTime} - {session.endTime}</span>
                                            </div>
                                        </div>

                                        {session.status === 'scheduled' && (
                                            <a href={session.meetLink} target="_blank" rel="noreferrer" className="mt-5 w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all transform hover:scale-[1.02] active:scale-95">
                                                <Video className="w-5 h-5" /> Join Meeting
                                            </a>
                                        )}

                                        {session.status === 'completed' && !session.feedback?.rating && (
                                            <button onClick={() => setRatingSessionId(session._id)} className="mt-5 w-full flex items-center justify-center gap-2 py-3 bg-white text-indigo-600 border-2 border-indigo-100 font-bold rounded-xl hover:bg-indigo-50 transition-all shadow-sm">
                                                <Star className="w-5 h-5 fill-indigo-600" /> Leave Feedback
                                            </button>
                                        )}

                                        {session.feedback && session.feedback.rating && (
                                            <div className="mt-5 flex items-center gap-1 bg-yellow-50 text-yellow-700 px-3 py-2 rounded-xl text-sm font-bold w-full justify-center">
                                                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" /> You rated {session.feedback.rating}/5
                                            </div>
                                        )}
                                        
                                        {session.status === 'cancelled' && (
                                            <div className="mt-5 flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-bold w-full justify-center">
                                                <AlertCircle className="w-5 h-5" /> Session Cancelled
                                            </div>
                                        )}

                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            {/* Feedback Modal */}
            {ratingSessionId && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scaleIn">
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Rate Session</h2>
                        <p className="text-gray-500 font-medium mb-6">How was your mentorship experience?</p>
                        
                        <form onSubmit={handleFeedback} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3">Rating (1 to 5)</label>
                                <div className="flex gap-2">
                                    {[1,2,3,4,5].map(num => (
                                        <button key={num} type="button" onClick={() => setFeedbackData({...feedbackData, rating: num})} className={`w-12 h-12 rounded-xl font-bold flex items-center justify-center transition-all ${feedbackData.rating >= num ? 'bg-yellow-400 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                                            <Star className="w-6 h-6" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Review (Optional)</label>
                                <textarea value={feedbackData.review} onChange={e => setFeedbackData({...feedbackData, review: e.target.value})} rows="3" className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"></textarea>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setRatingSessionId(null)} className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all">Cancel</button>
                                <button type="submit" className="flex-1 py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 hover:shadow-lg transition-all shadow-md">Submit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
