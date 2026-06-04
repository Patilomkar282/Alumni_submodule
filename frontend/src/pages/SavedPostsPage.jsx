import React, { useState, useEffect } from 'react';
import PostCard from '../components/Feed/PostCard'; // Adjust path if necessary
import LoadingScreen from '../components/LoadingScreen';

const SavedPostsPage = () => {
    const [savedPosts, setSavedPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        // Fetch current user and saved posts
        const fetchData = async () => {
            try {
                const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
                const token = userInfo.token;
                if (!token) {
                    setLoading(false);
                    return;
                }

                const headers = {
                    'Authorization': `Bearer ${token}`
                };

                // Fetch User Profile
                const userRes = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/profile`, { headers });
                if (userRes.ok) {
                    const userData = await userRes.json();
                    setCurrentUser(userData);
                }

                // Fetch Saved Posts
                const postsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/saved-posts`, { headers });
                if (postsRes.ok) {
                    const savedPostsData = await postsRes.json();
                    setSavedPosts(savedPostsData);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleLike = async (postId) => {
        // Implement compatible with PostCard onLike prop
        // We might need to lift this logic or duplicate it somewhat from Feed
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const token = userInfo.token;
            await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${postId}/like`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error("Error liking post:", error);
            throw error;
        }
    };

    const handleComment = async (postId, text) => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const token = userInfo.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${postId}/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text })
            });
            if (res.ok) {
                return await res.json();
            }
        } catch (error) {
            console.error("Error commenting:", error);
            throw error;
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="max-w-2xl mx-auto pt-28 pb-8 px-4">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Saved Posts</h1>

            {savedPosts.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-500">You haven't saved any posts yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {savedPosts.map((savedItem) => (
                        <PostCard
                            key={savedItem._id}
                            post={savedItem.post}
                            currentUser={currentUser}
                            onLike={handleLike}
                            onComment={handleComment}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default SavedPostsPage;
