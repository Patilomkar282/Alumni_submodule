import React, { useState, useEffect } from 'react';
import { Info, ChevronRight, Loader2, AlertCircle, Sparkles, Megaphone, Calendar, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const NewsSidebar = () => {
    const [newsItems, setNewsItems] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const navigate = useNavigate();

    // Using DEV.to API to fetch specifically Technical/Programming articles daily.
    const API_URL = "https://dev.to/api/articles?per_page=5&top=1";

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await fetch(API_URL);
                if (!response.ok) {
                    throw new Error('Failed to fetch news');
                }
                const data = await response.json();
                // Take only the first 5 items
                setNewsItems(data.slice(0, 5));
            } catch (err) {
                console.error("Error fetching news:", err);
                setError("Failed to load news");
            } finally {
                setLoading(false);
            }
        };

        const fetchAnnouncements = async () => {
            try {
                const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/announcements`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setAnnouncements(data);
                }
            } catch (err) {
                console.error("Error fetching announcements:", err);
            } finally {
                setLoadingAnnouncements(false);
            }
        };

        fetchNews();
        fetchAnnouncements();
    }, []);

    const handleNewsClick = (article) => {
        if (article.url) {
            window.open(article.url, '_blank');
        } else {
            navigate('/news/view', { state: { article } });
        }
    };

    return (
        <div className="space-y-4">
            {/* Announcements Section */}
            {!loadingAnnouncements && announcements.length > 0 && (
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl shadow-xl shadow-indigo-200 border border-indigo-500/20 overflow-hidden p-6 text-white relative group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>
                    
                    <div className="flex justify-between items-center mb-4 relative z-10">
                        <div className="flex items-center gap-2">
                            <Megaphone className="w-5 h-5 text-indigo-200" />
                            <h2 className="text-sm font-black uppercase tracking-widest text-indigo-100">Notice Board</h2>
                        </div>
                        <span className="bg-white/20 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                            New: {announcements.length}
                        </span>
                    </div>

                    <div className="space-y-5 relative z-10">
                        {announcements.map((ann) => (
                            <div 
                                key={ann._id} 
                                onClick={() => setSelectedAnnouncement(ann)}
                                className="border-l-2 border-indigo-400/30 pl-4 py-1 hover:border-white transition-all duration-300 cursor-pointer group"
                            >
                                <h3 className="text-sm font-bold leading-snug line-clamp-2 mb-1.5 group-hover:underline">{ann.title}</h3>
                                <p className="text-[11px] text-indigo-200 font-medium line-clamp-2 opacity-80 mb-2">{ann.content}</p>
                                <div className="flex items-center gap-2 text-[10px] text-indigo-300 font-black uppercase tracking-wide">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(ann.scheduledAt || ann.date || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-5 hover:shadow-md transition-shadow duration-300">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-base font-bold text-gray-900">Trending News</h2>
                    <Info className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
                </div>

                {loading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center py-4 text-red-500 text-xs">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {error}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {newsItems.map((item, index) => (
                            <div
                                key={index}
                                className="cursor-pointer group"
                                onClick={() => handleNewsClick(item)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full mt-2 group-hover:bg-indigo-500 transition-colors flex-shrink-0"></div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 line-clamp-2 leading-snug">
                                            {item.title}
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-1 font-medium">
                                            {new Date(item.published_at || item.publishedAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {item.user?.name || item.source?.name || 'DEV Community'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
{/* 
                <button className="mt-5 flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors -ml-3">
                    Show more <ChevronRight className="w-4 h-4 ml-1" />
                </button> */}
            </div>



            {/* Announcement Detail Modal (REUSED COMPONENT LOGIC) */}
            <AnimatePresence>
                {selectedAnnouncement && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedAnnouncement(null)}
                            className="absolute inset-0 bg-indigo-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl z-[201] w-full max-w-xl overflow-hidden relative border border-gray-100"
                        >
                            {/* Header Gradient */}
                            <div className="h-32 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 relative flex items-end p-8">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                                <div className="relative z-10">
                                    <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black text-white uppercase tracking-[0.2em] w-fit mb-2">Notice Board</div>
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
                                <div className="flex items-center gap-4 mb-8 text-gray-900">
                                    <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
                                        <Calendar className="w-4 h-4 text-indigo-600" />
                                        <span className="text-xs font-black text-indigo-700 uppercase tracking-widest">
                                            {new Date(selectedAnnouncement.scheduledAt || selectedAnnouncement.date || Date.now()).toLocaleDateString([], { 
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric' 
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-gray-100">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Platform Wide</span>
                                    </div>
                                </div>

                                <div className="bg-slate-50/50 p-6 rounded-3xl border border-gray-100 mb-8">
                                    <p className="text-gray-800 font-medium leading-[1.8] text-base whitespace-pre-wrap">
                                        {selectedAnnouncement.content}
                                    </p>
                                </div>

                                <div className="flex items-start gap-4 p-5 bg-orange-50 border border-orange-100 rounded-2xl">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-orange-600 shadow-sm border border-orange-50">
                                        <Megaphone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-orange-900 uppercase tracking-tight">Verified Source</p>
                                        <p className="text-[11px] text-orange-600 font-bold mt-0.5">Officially issued by university administrators.</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedAnnouncement(null)}
                                    className="mt-8 w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100"
                                >
                                    Close Notice
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NewsSidebar;
