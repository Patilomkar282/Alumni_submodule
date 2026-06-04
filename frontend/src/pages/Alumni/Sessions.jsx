import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { Calendar, Clock, Video, Trash2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../../components/LoadingScreen';

export default function AlumniSessions() {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfileAndSessions();
    }, []);

    const fetchProfileAndSessions = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            
            // Get Sessions
            const sessionRes = await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/my-sessions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (sessionRes.ok) setSessions(await sessionRes.json());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteSession = async (id) => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/${id}/complete`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) fetchProfileAndSessions();
        } catch (error) {
            console.error("Error completing session", error);
        }
    };

    const handleCancelSession = async (id) => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/${id}/cancel`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) fetchProfileAndSessions();
        } catch (error) {
            console.error("Error cancelling session", error);
        }
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-12 font-sans px-4 sm:px-6 lg:px-8">
            <Header />
            <div className="max-w-6xl mx-auto space-y-8">

                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Mentor Dashboard</h1>
                        <p className="text-gray-500 font-medium mt-1">Manage your availability calendar and upcoming student meetings.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {/* Mentorship Sessions List */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                                <Calendar className="w-6 h-6 text-indigo-600" /> Assigned Sessions & Events
                            </h2>
                            <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-xl font-bold text-xs border border-indigo-100 uppercase tracking-widest">
                                {sessions.length} Active
                            </span>
                        </div>
                        
                        {sessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200 shadow-sm">
                                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                                    <Calendar className="w-10 h-10 text-gray-300" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-800">No sessions scheduled</h3>
                                <p className="text-gray-500 mt-2 font-medium max-w-xs text-center">Admin hasn't assigned any global events or students to you yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {sessions.map(session => (
                                    <div key={session._id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex flex-col group relative overflow-hidden">
                                        
                                        {/* Status Badge */}
                                        <div className="absolute top-6 right-6">
                                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${session.isGlobal ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {session.isGlobal ? 'Global Event' : '1-on-1 Session'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4 mb-6">
                                            {session.isGlobal ? (
                                                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                                    <Video className="w-7 h-7" />
                                                </div>
                                            ) : (
                                                <div className="cursor-pointer" onClick={() => navigate(`/user/${session.student?._id}`)}>
                                                    {session.student?.profilePhoto ? (
                                                        <img src={session.student.profilePhoto} alt="Student" className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-gray-100 hover:ring-2 hover:ring-indigo-300 transition-all" />
                                                    ) : (
                                                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-xl border border-indigo-100 hover:ring-2 hover:ring-indigo-300 transition-all">
                                                            {session.student?.name?.charAt(0) || 'S'}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <div>
                                                <h3 
                                                    onClick={() => !session.isGlobal && navigate(`/user/${session.student?._id}`)}
                                                    className={`font-black text-gray-900 leading-tight ${!session.isGlobal ? 'cursor-pointer hover:text-indigo-600 transition-colors' : ''}`}
                                                >
                                                    {session.isGlobal ? 'Webinar / Workshop' : session.student?.name}
                                                </h3>
                                                <p className="text-xs text-indigo-600 font-bold uppercase tracking-tighter">
                                                    {session.isGlobal ? 'Public Session' : `${session.student?.branch} • Year ${session.student?.currentYear}`}
                                                </p>
                                            </div>
                                        </div>

                                        <h4 className="font-black text-gray-800 text-xl mb-3 group-hover:text-indigo-600 transition-colors line-clamp-1">{session.title}</h4>
                                        <p className="text-sm text-gray-500 mb-6 line-clamp-2 font-medium leading-relaxed">{session.agenda || session.description}</p>

                                        <div className="mt-auto space-y-4">
                                            <div className="bg-slate-50 p-5 rounded-[1.5rem] space-y-3 border border-gray-100">
                                                <div className="flex justify-between items-center text-sm font-bold text-gray-700">
                                                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-indigo-500" /> Date</div>
                                                    <span>{new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm font-bold text-gray-700">
                                                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-emerald-500" /> Time</div>
                                                    <span>{session.startTime} - {session.endTime}</span>
                                                </div>
                                            </div>

                                            {session.status === 'scheduled' && (
                                                <div className="flex items-center justify-between gap-3 pt-2">
                                                    {!session.isGlobal && (
                                                        <button onClick={() => handleCancelSession(session._id)} className="p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all active:scale-90" aria-label="Cancel Session"><Trash2 className="w-5 h-5" /></button>
                                                    )}
                                                    <a href={session.meetLink} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-3 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98]">
                                                        <Video className="w-5 h-5" /> Start Now
                                                    </a>
                                                    <button onClick={() => handleCompleteSession(session._id)} className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-all active:scale-90" aria-label="Mark Completed"><CheckCircle className="w-5 h-5" /></button>
                                                </div>
                                            )}

                                            {session.status === 'completed' && (
                                                <div className="w-full text-center py-4 bg-emerald-50 text-emerald-700 rounded-2xl font-black text-sm border border-emerald-100 flex items-center justify-center gap-2">
                                                    <CheckCircle className="w-4 h-4" /> Completed Successfully
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
