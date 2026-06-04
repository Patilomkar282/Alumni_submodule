import React, { useState, useEffect } from 'react';
import { Megaphone, Calendar, Users, Paperclip, Trash2, Send, Plus, X, AlertCircle, FileText, ExternalLink, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from '../../components/LoadingScreen';

export default function AdminAnnouncements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        targetAudience: 'all',
        scheduledAt: new Date().toISOString().slice(0, 16),
        attachments: []
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/announcements`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAnnouncements(data);
            }
        } catch (error) {
            console.error("Fetch error", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this announcement?")) return;
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/announcements/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) fetchAnnouncements();
        } catch (error) {
            console.error("Delete error", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/announcements`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowCreateModal(false);
                setFormData({
                    title: '',
                    content: '',
                    targetAudience: 'all',
                    scheduledAt: new Date().toISOString().slice(0, 16),
                    attachments: []
                });
                fetchAnnouncements();
            }
        } catch (error) {
            console.error("Create error", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="p-8 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Megaphone className="w-10 h-10 text-indigo-600" />
                            Announcements
                        </h1>
                        <p className="text-slate-500 font-medium mt-2">Create and manage targeted broadcast messages for the platform.</p>
                    </div>
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all transform hover:scale-[1.02] active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        New Announcement
                    </button>
                </div>

                {/* Main List */}
                {announcements.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Megaphone className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">No active announcements</h3>
                        <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8">Ready to share some news? Create your first targeted announcement to keep everyone updated.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {announcements.map((ann) => (
                            <motion.div 
                                layout
                                key={ann._id} 
                                className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group relative overflow-hidden flex flex-col"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleDelete(ann._id)}
                                        className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 mb-4">
                                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                                        ann.targetAudience === 'all' ? 'bg-indigo-50 text-indigo-600' :
                                        ann.targetAudience === 'student' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                    }`}>
                                        {ann.targetAudience === 'all' ? 'Broadcast' : ann.targetAudience}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(ann.scheduledAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <h3 className="text-xl font-black text-slate-900 mb-3 leading-tight">{ann.title}</h3>
                                <p className="text-slate-500 text-sm font-medium line-clamp-3 mb-6 flex-1">{ann.content}</p>

                                <div className="pt-6 border-t border-slate-50 mt-auto flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                                        <Users className="w-4 h-4" />
                                        <span>By {ann.author?.name || 'Admin'}</span>
                                    </div>
                                    {ann.attachments?.length > 0 && (
                                        <div className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-full text-[10px] font-black text-slate-500">
                                            <Paperclip className="w-3.5 h-3.5" />
                                            {ann.attachments.length}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Create Modal */}
                <AnimatePresence>
                    {showCreateModal && (
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl relative overflow-hidden"
                            >
                                <div className="p-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center">
                                                <Megaphone className="w-7 h-7 text-indigo-600" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-900">Push Announcement</h2>
                                                <p className="text-slate-500 font-medium text-sm">Targeted broadcast to portal users</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setShowCreateModal(false)} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors">
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Topic / Title</label>
                                                <input 
                                                    type="text"
                                                    required
                                                    value={formData.title}
                                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                                    placeholder="e.g. Placement Drive 2024"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Target Audience</label>
                                                <select 
                                                    value={formData.targetAudience}
                                                    onChange={e => setFormData({...formData, targetAudience: e.target.value})}
                                                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold appearance-none"
                                                >
                                                    <option value="all">Everyone (All Users)</option>
                                                    <option value="student">Students Only</option>
                                                    <option value="alumni">Alumni Only</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Schedule For</label>
                                                <div className="relative">
                                                    <input 
                                                        type="datetime-local"
                                                        required
                                                        value={formData.scheduledAt}
                                                        onChange={e => setFormData({...formData, scheduledAt: e.target.value})}
                                                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                                    />
                                                </div>
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Announcement Message</label>
                                                <textarea 
                                                    required
                                                    rows="5"
                                                    value={formData.content}
                                                    onChange={e => setFormData({...formData, content: e.target.value})}
                                                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm leading-relaxed"
                                                    placeholder="Write your detailed announcement here..."
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <button 
                                                type="button" 
                                                disabled={isSubmitting}
                                                onClick={() => setShowCreateModal(false)}
                                                className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                                            >
                                                Save Draft
                                            </button>
                                            <button 
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                            >
                                                {isSubmitting ? 'Pushing News...' : (
                                                    <><Send className="w-4 h-4" /> Publish Announcement</>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
