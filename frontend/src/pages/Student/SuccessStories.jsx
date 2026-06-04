import React, { useState, useEffect } from 'react';
import { Star, ArrowRight, Quote, Clock, Sparkles, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SuccessStories() {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStory, setSelectedStory] = useState(null); // For full-screen reading mode

    useEffect(() => {
        const fetchStories = async () => {
            try {
                const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/stories`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStories(data);
                }
            } catch (error) {
                console.error('Failed to fetch stories', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStories();
    }, []);

    const pinnedStories = stories.filter(s => s.isPinned);
    const otherStories = stories.filter(s => !s.isPinned);

    return (
        <div className="min-h-screen bg-[#F3F2EF] pt-20 pb-12 font-sans">
            <div className="max-w-[1128px] mx-auto px-4 lg:px-8">
                
                <div className="mb-10 text-center max-w-2xl mx-auto">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-3 mb-4">
                        <Sparkles className="w-8 h-8 text-amber-500" />
                        Star Alumni
                    </h1>
                    <p className="text-lg text-slate-600 font-medium leading-relaxed">
                        Read the inspiring journeys of MMCOE graduates who are making waves in the industry. Discover how they turned their campus experiences into remarkable careers.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                ) : stories.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-100">
                        <Star className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h2 className="text-2xl font-black text-slate-400">More stories coming soon</h2>
                        <p className="text-slate-500 font-medium mt-2">Our team is gathering inspiring journeys to share with you.</p>
                    </div>
                ) : (
                    <>
                        {/* Featured / Pinned Stories */}
                        {pinnedStories.length > 0 && (
                            <div className="mb-12">
                                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Star className="w-4 h-4 text-amber-500" /> Featured Journeys
                                </h2>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {pinnedStories.map((story, i) => (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            key={story._id} 
                                            className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 group cursor-pointer hover:shadow-xl transition-all duration-300"
                                            onClick={() => setSelectedStory(story)}
                                        >
                                            <div className="h-64 sm:h-80 overflow-hidden relative">
                                                <img 
                                                    src={story.imageUrl} 
                                                    alt={story.title} 
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
                                                <div className="absolute bottom-0 left-0 p-8 w-full">
                                                    <span className="inline-block bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4 shadow-lg">
                                                        Editor's Pick
                                                    </span>
                                                    <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2 drop-shadow-md">
                                                        {story.title}
                                                    </h3>
                                                    <p className="text-slate-300 font-medium text-sm flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        {new Date(story.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Other Stories Grid */}
                        {otherStories.length > 0 && (
                            <div>
                                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Latest Stories</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                                    {otherStories.map((story, i) => (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 + (i * 0.05) }}
                                            key={story._id} 
                                            className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 group cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col"
                                            onClick={() => setSelectedStory(story)}
                                        >
                                            <div className="h-48 overflow-hidden relative">
                                                <img 
                                                    src={story.imageUrl} 
                                                    alt={story.title} 
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300"></div>
                                            </div>
                                            <div className="p-6 sm:p-8 flex-1 flex flex-col bg-white relative z-10 -mt-4 rounded-t-3xl">
                                                <span className="text-xs font-bold text-indigo-500 mb-3">
                                                    {new Date(story.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                <h3 className="text-xl font-black text-slate-900 leading-tight mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                                    {story.title}
                                                </h3>
                                                <p className="text-slate-500 font-medium text-sm leading-relaxed line-clamp-3 flex-1">
                                                    {story.content}
                                                </p>
                                                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-indigo-600 text-sm font-bold group-hover:gap-2 transition-all">
                                                    Read Full Story <ArrowRight className="w-4 h-4 ml-1" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Full Screen Reading Modal */}
                {selectedStory && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
                        >
                            <button 
                                onClick={() => setSelectedStory(null)}
                                className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            
                            <div className="h-64 sm:h-96 relative flex-shrink-0">
                                <img src={selectedStory.imageUrl} alt={selectedStory.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
                                <div className="absolute bottom-0 left-0 p-8 sm:p-12 w-full">
                                    {selectedStory.isPinned && (
                                        <span className="inline-block bg-amber-500 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-6 shadow-lg">
                                            Editor's Pick
                                        </span>
                                    )}
                                    <h2 className="text-3xl sm:text-5xl font-black text-white leading-[1.1] drop-shadow-lg mb-4">
                                        {selectedStory.title}
                                    </h2>
                                    <p className="text-slate-300 font-medium flex items-center gap-2">
                                        Published on {new Date(selectedStory.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            <div className="p-8 sm:p-12 overflow-y-auto custom-scrollbar bg-white relative">
                                <div className="absolute top-0 right-12 -mt-8 text-indigo-100 hidden sm:block">
                                    <Quote className="w-32 h-32 rotate-180" />
                                </div>
                                <div className="prose prose-slate prose-lg max-w-none relative z-10 whitespace-pre-wrap font-medium text-slate-700 leading-relaxed">
                                    {selectedStory.content}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

            </div>
        </div>
    );
}
