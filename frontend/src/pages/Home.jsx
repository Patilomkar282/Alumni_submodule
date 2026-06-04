import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import CreatePost from '../components/Feed/CreatePost';
import PostCard from '../components/Feed/PostCard';
import ProfileSidebar from '../components/Feed/ProfileSidebar';
import NewsSidebar from '../components/Feed/NewsSidebar';
import { Loader2, User as UserIcon, Layout, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Home = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [pageCursor, setPageCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [viewIndex, setViewIndex] = useState(1); // 0: Profile, 1: Feed, 2: News

    useEffect(() => {
        // Check for logged in user
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            const parsedUser = JSON.parse(userInfo);
            setUser(parsedUser);
            fetchPosts(null, true, 'all');
            fetchConnections(parsedUser.token);
        }

        const handleUserUpdate = () => {
            const updatedInfo = localStorage.getItem('userInfo');
            if (updatedInfo) {
                setUser(JSON.parse(updatedInfo));
            }
        };

        window.addEventListener('user-updated', handleUserUpdate);

        return () => window.removeEventListener('user-updated', handleUserUpdate);
    }, []);

    const fetchConnections = async (token) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/connections`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setUser(prev => ({ ...prev, connections: data }));
            }
        } catch (error) {
            console.error("Error fetching connections:", error);
        }
    };

    const fetchPosts = async (cursor = null, isInitial = false, filter = activeFilter) => {
        if (!hasMore && !isInitial) return;

        try {
            if (!isInitial) setLoadingMore(true);

            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const token = userInfo?.token;

            let url = `${import.meta.env.VITE_API_URL}/api/posts?limit=10&type=${filter}`;
            if (cursor) {
                url += `&cursor=${cursor}`;
            }

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();

                if (isInitial) {
                    setPosts(data.posts);
                } else {
                    setPosts(prev => [...prev, ...data.posts]);
                }

                setPageCursor(data.nextCursor);
                setHasMore(data.hasNextPage);
            }
        } catch (error) {
            console.error("Error fetching posts:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Intersection Observer for Infinite Scroll
    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + document.documentElement.scrollTop + 1 >= document.documentElement.offsetHeight) {
                if (hasMore && !loadingMore && !loading) {
                    fetchPosts(pageCursor, false, activeFilter);
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [hasMore, loadingMore, loading, pageCursor, activeFilter]);

    const handleFilterChange = (newFilter) => {
        const targetFilter = activeFilter === newFilter ? 'all' : newFilter;
        setActiveFilter(targetFilter);
        setPosts([]);
        setHasMore(true);
        setPageCursor(null);
        setLoading(true);
        fetchPosts(null, true, targetFilter);
    };

    const handleCreatePost = async (postData) => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const token = userInfo?.token;

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(postData),
            });

            if (response.ok) {
                const newPost = await response.json();
                setPosts([newPost, ...posts]);
            }
        } catch (error) {
            console.error("Error creating post:", error);
            throw error;
        }
    };

    const handleLike = async (postId) => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const token = userInfo?.token;

            await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${postId}/like`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        } catch (error) {
            console.error("Error liking post:", error);
            throw error;
        }
    };

    const handleComment = async (postId, text) => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const token = userInfo?.token;

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${postId}/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ text }),
            });

            if (response.ok) {
                const updatedComments = await response.json();
                return updatedComments;
            }
        } catch (error) {
            console.error("Error commenting:", error);
            throw error;
        }
    };

    const onDragEnd = (event, info) => {
        const threshold = 100;
        if (info.offset.x > threshold) {
            setViewIndex(prev => Math.max(0, prev - 1));
        } else if (info.offset.x < -threshold) {
            setViewIndex(prev => Math.min(2, prev + 1));
        }
    };

    const tabs = [
        { id: 0, label: 'Profile', icon: UserIcon },
        { id: 1, label: 'Feed', icon: Layout },
        { id: 2, label: 'News', icon: Bell }
    ];

    return (
        <div className="min-h-screen bg-slate-50 overflow-x-hidden">
            <Header />

            {/* Mobile Tab Indicator */}
            <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-gray-200 flex items-center space-x-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setViewIndex(tab.id)}
                        className={`flex flex-col items-center transition-colors ${viewIndex === tab.id ? 'text-indigo-600' : 'text-gray-400'}`}
                    >
                        <tab.icon className={`w-5 h-5 ${viewIndex === tab.id ? 'scale-110' : ''} transition-transform`} />
                        <span className="text-[10px] font-medium mt-0.5">{tab.label}</span>
                        {viewIndex === tab.id && (
                            <motion.div
                                layoutId="activeTabMobile"
                                className="w-1 h-1 bg-indigo-600 rounded-full mt-1"
                            />
                        )}
                    </button>
                ))}
            </div>

            <main className="pt-[52px] pb-24 md:pb-12 px-0 md:px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-x-hidden">
                <div className="relative mt-6">
                    {/* Desktop Layout - Normal Grid */}
                    <div className="hidden md:grid md:grid-cols-12 gap-6 items-start">
                        {/* Left Sidebar - Profile */}
                        <div className="md:col-span-3 lg:col-span-3 sticky top-[76px] self-start">
                            <ProfileSidebar user={user} activeFilter={activeFilter} onFilterChange={handleFilterChange} />
                        </div>

                        {/* Middle Column - Feed */}
                        <div className="md:col-span-6">
                            <CreatePost currentUser={user} onPostCreate={handleCreatePost} />
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-[1px] bg-gray-300 flex-1"></div>
                                <span className="text-xs text-gray-500 px-2">Sort by: <span className="font-semibold text-gray-900 cursor-pointer">Top</span></span>
                            </div>

                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {posts.map((post) => (
                                        <PostCard
                                            key={post._id}
                                            post={post}
                                            currentUser={user}
                                            onLike={handleLike}
                                            onComment={handleComment}
                                        />
                                    ))}
                                    {posts.length === 0 && (
                                        <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-sm border border-gray-200">
                                            No posts yet. Be the first to share something!
                                        </div>
                                    )}
                                    {loadingMore && (
                                        <div className="flex justify-center py-6">
                                            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                                        </div>
                                    )}
                                    {!hasMore && posts.length > 0 && (
                                        <div className="text-center py-6 text-gray-500 text-sm">
                                            You've reached the end of the feed.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right Sidebar - News */}
                        <div className="lg:col-span-3 md:col-span-3 lg:sticky lg:top-[76px] lg:self-start">
                            <NewsSidebar />
                        </div>
                    </div>

                    {/* Mobile Swipable Layout */}
                    <motion.div
                        className="md:hidden flex w-[300%] transition-transform duration-300 ease-out h-full"
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragEnd={onDragEnd}
                        animate={{ x: `-${viewIndex * 33.333}%` }}
                    >
                        {/* Profile Panel */}
                        <div className="w-full px-4">
                            <ProfileSidebar user={user} activeFilter={activeFilter} onFilterChange={handleFilterChange} />
                            <div className="mt-8 text-center text-gray-400 text-sm flex items-center justify-center">
                                <span>Swipe right to Feed</span>
                                <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="ml-2"> → </motion.div>
                            </div>
                        </div>

                        {/* Feed Panel */}
                        <div className="w-full px-4">
                            <CreatePost currentUser={user} onPostCreate={handleCreatePost} />
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-[1px] bg-gray-300 flex-1"></div>
                                <span className="text-xs text-gray-500 px-2">Sort by: <span className="font-semibold text-gray-900 cursor-pointer">Top</span></span>
                            </div>

                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {posts.map((post) => (
                                        <PostCard
                                            key={post._id}
                                            post={post}
                                            currentUser={user}
                                            onLike={handleLike}
                                            onComment={handleComment}
                                        />
                                    ))}
                                    {posts.length === 0 && (
                                        <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-sm border border-gray-200">
                                            No posts yet. Be the first to share something!
                                        </div>
                                    )}
                                    {loadingMore && (
                                        <div className="flex justify-center py-6">
                                            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* News Panel */}
                        <div className="w-full px-4">
                            <NewsSidebar />
                            <div className="mt-8 text-center text-gray-400 text-sm flex items-center justify-center">
                                <motion.div animate={{ x: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="mr-2"> ← </motion.div>
                                <span>Swipe left to Feed</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default Home;

