import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, Plus, X, Trash2, Users, Search, Target, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from '../../components/LoadingScreen';

export default function AdminSessions() {
    const [sessions, setSessions] = useState([]);
    const [alumni, setAlumni] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [broadcastLoading, setBroadcastLoading] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        agenda: '',
        date: '',
        startTime: '',
        endTime: '',
        hostId: '',
        meetLink: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            
            // Fetch Sessions
            const sessionRes = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/sessions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (sessionRes.ok) setSessions(await sessionRes.json());

            // Fetch Alumni for picker
            const usersRes = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (usersRes.ok) {
                const allUsers = await usersRes.json();
                setAlumni(allUsers.filter(u => u.role === 'alumni'));
            }
        } catch (error) {
            console.error("Data load failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowModal(false);
                fetchData();
                setFormData({ title: '', description: '', agenda: '', date: '', startTime: '', endTime: '', hostId: '', meetLink: '' });
            }
        } catch (error) {
            console.error("Schedule failed", error);
        }
    };

    const handleBroadcast = async (sessionId) => {
        try {
            setBroadcastLoading(sessionId);
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/sessions/${sessionId}/broadcast`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                alert("Event broadcasted successfully to all students!");
            }
        } catch (error) {
            console.error("Broadcast failed", error);
        } finally {
            setBroadcastLoading(null);
        }
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-12 font-sans px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                
                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2 sm:gap-3">
                            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" /> Global Event Management
                        </h1>
                        <p className="text-gray-500 font-medium mt-1">Schedule webinars, workshops and mentorship sessions for the whole college.</p>
                    </div>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all hover:scale-105"
                    >
                        <Plus className="w-5 h-5" /> Schedule Event
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sessions.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-400 font-bold">No global events scheduled yet.</p>
                        </div>
                    ) : (
                        sessions.map(session => (
                            <motion.div 
                                key={session._id} 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${session.isGlobal ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {session.isGlobal ? 'Global Event' : '1-on-1 Session'}
                                        </span>
                                        <p className="text-xs font-bold text-gray-400">{new Date(session.date).toLocaleDateString()}</p>
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight">{session.title}</h3>
                                    <p className="text-gray-500 text-sm line-clamp-2 mb-4 font-medium">{session.description}</p>
                                    
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl mb-4 border border-gray-100">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                                            {session.host?.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-tighter">Speaker / Alumni</p>
                                            <p className="text-sm font-bold text-gray-800">{session.host?.name}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs font-bold text-gray-500 px-1">
                                        <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1.5 rounded-lg">
                                            <Clock className="w-3.5 h-3.5" /> {session.startTime} - {session.endTime}
                                        </div>
                                        <a 
                                            href={session.meetLink} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="flex items-center gap-1.5 text-indigo-600 hover:underline"
                                        >
                                            <Video className="w-3.5 h-3.5" /> Join Meeting
                                        </a>
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-2">
                                    <button 
                                        onClick={() => { setSelectedSession(session); setShowDetailsModal(true); }}
                                        className="flex-1 py-3.5 bg-slate-100 text-gray-600 rounded-xl font-black text-sm hover:bg-slate-200 transition-colors"
                                    >
                                        Details
                                    </button>
                                    {session.isGlobal && (
                                        <button 
                                            disabled={broadcastLoading === session._id}
                                            onClick={() => handleBroadcast(session._id)}
                                            className="flex-1 py-3.5 bg-indigo-50 text-indigo-600 rounded-xl font-black text-sm hover:bg-indigo-100 transition-colors disabled:opacity-50"
                                        >
                                            {broadcastLoading === session._id ? 'Broadcasting...' : 'Broadcast'}
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Schedule Session Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative"
                        >
                            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                <X className="w-6 h-6 text-gray-400" />
                            </button>

                            <h2 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3">
                                <Target className="w-8 h-8 text-indigo-600" /> Schedule New Event
                            </h2>

                            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">Event Title</label>
                                    <input 
                                        required
                                        type="text" 
                                        value={formData.title}
                                        onChange={e => setFormData({...formData, title: e.target.value})}
                                        className="w-full bg-slate-50 border border-gray-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold" 
                                        placeholder="e.g. Masterclass on System Design"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">Information / Topic Details</label>
                                    <textarea 
                                        rows="3"
                                        value={formData.description}
                                        onChange={e => setFormData({...formData, description: e.target.value})}
                                        className="w-full bg-slate-50 border border-gray-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold" 
                                        placeholder="Brief summary of what this event covers..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">Target Alumni (Speaker)</label>
                                    <select 
                                        required
                                        value={formData.hostId}
                                        onChange={e => setFormData({...formData, hostId: e.target.value})}
                                        className="w-full bg-slate-50 border border-gray-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold appearance-none"
                                    >
                                        <option value="">Select Available Speaker</option>
                                        {alumni.map(a => (
                                            <option key={a._id} value={a._id}>{a.name} ({a.company})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">Event Date</label>
                                    <input 
                                        required
                                        type="date" 
                                        value={formData.date}
                                        onChange={e => setFormData({...formData, date: e.target.value})}
                                        className="w-full bg-slate-50 border border-gray-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold" 
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">Start Time</label>
                                    <input 
                                        required
                                        type="time" 
                                        value={formData.startTime}
                                        onChange={e => setFormData({...formData, startTime: e.target.value})}
                                        className="w-full bg-slate-50 border border-gray-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold" 
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">End Time</label>
                                    <input 
                                        required
                                        type="time" 
                                        value={formData.endTime}
                                        onChange={e => setFormData({...formData, endTime: e.target.value})}
                                        className="w-full bg-slate-50 border border-gray-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold" 
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">Meeting Link (Google Meet / Zoom)</label>
                                    <input 
                                        type="url" 
                                        value={formData.meetLink}
                                        onChange={e => setFormData({...formData, meetLink: e.target.value})}
                                        className="w-full bg-slate-50 border border-gray-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold" 
                                        placeholder="Paste meeting link here (Optional)"
                                    />
                                </div>

                                <div className="col-span-2 flex gap-4 mt-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black hover:bg-gray-200 transition-all"
                                    >
                                        Discard
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-2 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all px-12"
                                    >
                                        Confirm & Schedule Event
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Session Details Modal */}
            <AnimatePresence>
                {showDetailsModal && selectedSession && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-3xl p-8 max-w-xl w-full shadow-2xl relative"
                        >
                            <button onClick={() => setShowDetailsModal(false)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                <X className="w-6 h-6 text-gray-400" />
                            </button>

                            <div className="mb-6">
                                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${selectedSession.isGlobal ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {selectedSession.isGlobal ? 'Global Event' : '1-on-1 Session'}
                                </span>
                                <h2 className="text-2xl font-black text-gray-900 mt-3 leading-tight">{selectedSession.title}</h2>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Description</h4>
                                    <p className="text-gray-600 font-medium leading-relaxed">{selectedSession.description}</p>
                                </div>

                                {selectedSession.agenda && (
                                    <div>
                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Agenda</h4>
                                        <p className="text-gray-600 font-medium leading-relaxed">{selectedSession.agenda}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-gray-100">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-tight mb-1">Speaker</h4>
                                        <p className="text-sm font-bold text-gray-800">{selectedSession.host?.name}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-gray-100">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-tight mb-1">Date & Time</h4>
                                        <p className="text-sm font-bold text-gray-800">{new Date(selectedSession.date).toLocaleDateString()} at {selectedSession.startTime}</p>
                                    </div>
                                </div>

                                {selectedSession.isGlobal && (
                                    <div className="flex items-center gap-2 p-4 bg-indigo-50 rounded-2xl text-indigo-700">
                                        <Users className="w-5 h-5" />
                                        <span className="font-bold">{selectedSession.registeredStudents?.length || 0} Students Registered</span>
                                    </div>
                                )}

                                <div className="pt-4 flex gap-3">
                                    <button 
                                        onClick={() => setShowDetailsModal(false)}
                                        className="flex-1 py-4 bg-slate-100 text-gray-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
                                    >
                                        Close
                                    </button>
                                    <a 
                                        href={selectedSession.meetLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-center shadow-lg hover:bg-indigo-700 transition-all"
                                    >
                                        Join Meeting
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
