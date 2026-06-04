import React, { useState, useEffect } from 'react';
import { ThumbsUp, MessageSquare, Repeat, Send, MoreHorizontal, Globe, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const PostCard = ({ post, currentUser, onLike, onComment }) => {
    const navigate = useNavigate();
    const [isLiked, setIsLiked] = useState(post.likes.includes(currentUser?._id));
    const [likeCount, setLikeCount] = useState(post.likes.length);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState(post.comments || []);
    const [showMenu, setShowMenu] = useState(false);
    const [isReposting, setIsReposting] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [connections, setConnections] = useState([]);
    const [shareSearch, setShareSearch] = useState('');
    const [isSharing, setIsSharing] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    React.useEffect(() => {
        const checkSavedStatus = async () => {
            try {
                const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
                const token = userInfo.token;
                if (!token) return;

                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/saved-posts/check/${post._id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setIsSaved(data.isSaved);
                }
            } catch (error) {
                console.error("Error checking saved status", error);
            }
        };
        checkSavedStatus();
    }, [post._id]);

    const [isSaved, setIsSaved] = useState(false); // Initial state should ideally come from backend or props

    const handleSave = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const token = userInfo.token;
            const method = isSaved ? 'DELETE' : 'POST';
            const url = isSaved
                ? `${import.meta.env.VITE_API_URL}/api/saved-posts/${post._id}`
                : `${import.meta.env.VITE_API_URL}/api/saved-posts`;

            const body = isSaved ? {} : { postId: post._id };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: isSaved ? null : JSON.stringify(body)
            });

            if (response.ok) {
                setIsSaved(!isSaved);
                // Optionally show a toast notification here
            } else {
                console.error("Failed to save/unsave post");
            }
        } catch (error) {
            console.error("Error toggling save post:", error);
        }
    };

    const handleLike = async () => {
        // Optimistic update
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);

        try {
            await onLike(post._id);
        } catch (error) {
            // Revert if error
            setIsLiked(!newIsLiked);
            setLikeCount(prev => !newIsLiked ? prev + 1 : prev - 1);
        }
    };

    const [replyingTo, setReplyingTo] = useState(null);
    const [editingComment, setEditingComment] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [editText, setEditText] = useState('');

    const handleReplySubmit = async (commentId) => {
        if (!replyText.trim()) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const token = userInfo.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${post._id}/comments/${commentId}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text: replyText })
            });

            if (res.ok) {
                const updatedComments = await res.json();
                setComments(updatedComments);
                setReplyingTo(null);
                setReplyText('');
            }
        } catch (error) {
            console.error("Failed to reply", error);
        }
    };

    const handleEditSubmit = async (commentId) => {
        if (!editText.trim()) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const token = userInfo.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${post._id}/comments/${commentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text: editText })
            });

            if (res.ok) {
                const updatedComments = await res.json();
                setComments(updatedComments);
                setEditingComment(null);
                setEditText('');
            }
        } catch (error) {
            console.error("Failed to edit comment", error);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const token = userInfo.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${post._id}/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const updatedComments = await res.json();
                setComments(updatedComments);
            }
        } catch (error) {
            console.error("Failed to delete comment", error);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        try {
            const newComments = await onComment(post._id, commentText);
            setComments(newComments);
            setCommentText('');
        } catch (error) {
            console.error("Failed to add comment", error);
        }
    };

    const handleRepost = async () => {
        if (isReposting) return;
        setIsReposting(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const token = userInfo.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${post._id}/repost`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                // Refresh or add to UI - simpler to reload or trigger a parent update
                window.location.reload();
            }
        } catch (error) {
            console.error("Repost failed", error);
        } finally {
            setIsReposting(false);
        }
    };

    const fetchConnections = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const token = userInfo.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/connections`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConnections(data);
            }
        } catch (error) {
            console.error("Failed to fetch connections", error);
        }
    };

    const handleSharePost = async (recipientId) => {
        setIsSharing(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const token = userInfo.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    recipientId,
                    content: `Check out this post: ${window.location.origin}/post/${post._id}`,
                    type: 'text'
                })
            });
            if (res.ok) {
                setShowShareModal(false);
                alert("Post shared successfully!");
            }
        } catch (error) {
            console.error("Failed to share post", error);
        } finally {
            setIsSharing(false);
        }
    };

    const handleDeletePost = async () => {
        if (!window.confirm("Are you sure you want to permanently delete this post?")) return;
        setIsDeleting(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const token = userInfo.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${post._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                window.location.reload();
            }
        } catch (error) {
            console.error("Delete failed", error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6 hover:shadow-md transition-shadow duration-300 relative"
        >
            {/* Repost Header */}
            {post.repostedFrom && (
                <div className="px-4 py-2.5 bg-indigo-50/30 border-b border-gray-50 flex items-center gap-2 group cursor-pointer" onClick={() => navigate(`/user/${post.author?._id}`)}>
                    <Repeat className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-gray-600 group-hover:text-indigo-600 transition-colors">
                        {post.author?.name} reposted this
                    </span>
                </div>
            )}

            {/* Header */}
            <div className="p-4 flex items-start justify-between">
                <div className="flex items-center space-x-3">
                    <div 
                        onClick={() => navigate(`/user/${post.repostedFrom ? post.repostedFrom.author?._id : post.author?._id}`)}
                        className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-300 transition-all shadow-sm"
                    >
                        {/* Use profile photo if available, else initial */}
                        {(post.repostedFrom ? post.repostedFrom.author?.profilePhoto : post.author?.profilePhoto) ? (
                            <img src={post.repostedFrom ? post.repostedFrom.author.profilePhoto : post.author.profilePhoto} alt="Author" className="w-full h-full object-cover aspect-square rounded-full" />
                        ) : (
                            <span>{(post.repostedFrom ? post.repostedFrom.author?.name : post.author?.name)?.charAt(0).toUpperCase() || 'U'}</span>
                        )}
                    </div>
                    <div>
                        <h3 
                            onClick={() => navigate(`/user/${post.repostedFrom ? post.repostedFrom.author?._id : post.author?._id}`)}
                            className="text-gray-900 font-bold text-[15px] hover:text-indigo-600 hover:underline cursor-pointer transition-colors"
                        >
                            {post.repostedFrom ? post.repostedFrom.author?.name : (post.author?.name || 'Unknown User')}
                        </h3>
                        <p className="text-gray-500 text-xs font-medium line-clamp-1">
                            {post.repostedFrom ? post.repostedFrom.author?.headline : (post.author?.headline || post.author?.role || 'Member')}
                        </p>
                        <div className="flex items-center text-gray-400 text-[10px] font-bold uppercase tracking-wider mt-1">
                            <span>{new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span className="mx-1.5">•</span>
                            <Globe className="w-3 h-3 text-gray-300" />
                        </div>
                    </div>
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="text-gray-500 hover:bg-gray-100 p-1 rounded-full transition-colors"
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-100">
                            <button
                                onClick={() => {
                                    handleSave();
                                    setShowMenu(false);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-50 font-medium"
                            >
                                {isSaved ? 'Unsave Post' : 'Save Post'}
                            </button>
                            {currentUser?._id === post.author?._id && (
                                <>
                                    <button
                                        onClick={() => {
                                            setShowEditModal(true);
                                            setShowMenu(false);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 font-medium border-b border-gray-50"
                                    >
                                        Edit Post
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleDeletePost();
                                            setShowMenu(false);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                                    >
                                        Delete Post
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <EditPostModal 
                        post={post}
                        onClose={() => setShowEditModal(false)}
                        onUpdate={(updatedData) => {
                            // Local update logic or reload
                            window.location.reload();
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Content */}
            <div className="px-5 pb-3">
                {post.postType === 'article' && (
                    <div className="mb-3 pb-3 border-b border-gray-100">
                        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3 inline-block shadow-sm">Article</span>
                        <h4 className="text-2xl font-extrabold text-gray-900 leading-tight">{post.title}</h4>
                    </div>
                )}
                {post.postType === 'event' && (
                    <div className="mb-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100/50 shadow-inner">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Event</span>
                            <span className="text-amber-900 font-bold text-lg">{post.title}</span>
                        </div>
                        <div className="text-sm flex flex-col gap-1.5 mt-3">
                            {post.eventDate && (
                                <p className="text-amber-800 flex items-center gap-2 font-medium">
                                    <span className="text-amber-500">📅</span>
                                    {new Date(post.eventDate).toLocaleString(undefined, {
                                        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </p>
                            )}
                            {post.eventLocation && (
                                <p className="text-amber-800 flex items-center gap-2 font-medium">
                                    <span className="text-amber-500">📍</span>
                                    {post.eventLocation}
                                </p>
                            )}
                        </div>
                    </div>
                )}
                <p className={`text-gray-800 text-[15px] whitespace-pre-wrap leading-relaxed ${post.postType === 'article' ? 'font-serif text-[17px] text-gray-900 leading-loose' : ''}`}>{post.content}</p>
            </div>

            {/* Image */}
            {post.image && (
                <div className="mt-3 w-full bg-gray-100 overflow-hidden border-t sm:border-y border-gray-100">
                    <img src={post.image} alt="Post content" className="w-full h-auto object-cover max-h-[600px]" />
                </div>
            )}

            {/* Stats */}
            <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center space-x-1">
                    <div className="bg-blue-500 rounded-full p-1">
                        <ThumbsUp className="w-2 h-2 text-white fill-current" />
                    </div>
                    <span className="text-gray-500 text-xs hover:text-blue-600 cursor-pointer hover:underline">
                        {likeCount}
                    </span>
                </div>
                <div className="text-gray-500 text-xs hover:text-blue-600 cursor-pointer hover:underline" onClick={() => setShowComments(!showComments)}>
                    {comments.length} comments
                </div>
            </div>

            {/* Actions */}
            <div className="px-3 py-2 flex items-center justify-between">
                <button
                    onClick={handleLike}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl transition-colors font-semibold ${isLiked ? 'text-blue-600 bg-blue-50/50' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                >
                    <ThumbsUp className={`w-5 h-5 ${isLiked ? 'fill-current text-blue-600' : ''}`} />
                    <span className="text-[15px]">Like</span>
                </button>
                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl transition-colors font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-[15px]">Comment</span>
                </button>
                <button 
                    onClick={handleRepost}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl transition-colors font-semibold ${isReposting ? 'text-indigo-400' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                    disabled={isReposting}
                >
                    <Repeat className={`w-5 h-5 ${isReposting ? 'animate-spin' : ''}`} />
                    <span className="text-[15px]">{isReposting ? 'Reposting...' : 'Repost'}</span>
                </button>
                <button 
                    onClick={() => {
                        setShowShareModal(true);
                        fetchConnections();
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl transition-colors font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                    <Send className="w-5 h-5" />
                    <span className="text-[15px]">Send</span>
                </button>
            </div>

            {/* Share Modal */}
            <AnimatePresence>
                {showShareModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-indigo-50/30">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">Share Post</h3>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Select recipient</p>
                                </div>
                                <button onClick={() => setShowShareModal(false)} className="bg-white p-2 rounded-full shadow-sm hover:bg-gray-100 transition-colors">
                                    <MoreHorizontal className="w-5 h-5 rotate-45 transform" />
                                </button>
                            </div>
                            
                            <div className="p-4">
                                <div className="relative mb-4">
                                    <input 
                                        type="text" 
                                        placeholder="Search connections..." 
                                        value={shareSearch}
                                        onChange={(e) => setShareSearch(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all"
                                    />
                                </div>
                                
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                                    {connections
                                        .filter(c => c.name.toLowerCase().includes(shareSearch.toLowerCase()))
                                        .map(conn => (
                                            <div 
                                                key={conn._id} 
                                                onClick={() => handleSharePost(conn._id)}
                                                className="flex items-center justify-between p-3 hover:bg-indigo-50/50 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-indigo-100"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-600 overflow-hidden">
                                                        {conn.profilePhoto ? <img src={conn.profilePhoto} className="w-full h-full object-cover" /> : conn.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900">{conn.name}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{conn.role || 'Member'}</p>
                                                    </div>
                                                </div>
                                                <Send className="w-4 h-4 text-indigo-400" />
                                            </div>
                                        ))
                                    }
                                    {connections.length === 0 && (
                                        <p className="text-center py-8 text-gray-400 text-sm font-bold">No connections found.</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 p-4 border-t border-gray-100">
                                <p className="text-[10px] text-gray-400 text-center font-bold">Post will be shared as a message</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Comments Section */}
            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-gray-50 border-t border-gray-100 px-4 py-3"
                    >
                        <div className="space-y-4">
                            {/* Comment Input */}
                            <form onSubmit={handleCommentSubmit} className="flex items-start space-x-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-600 text-xs font-bold">
                                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder="Add a comment..."
                                        className="w-full bg-white border border-gray-300 rounded-full px-4 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-all"
                                    />
                                </div>
                            </form>

                            {/* Comments List */}
                            <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar">
                                {comments.map((comment, index) => (
                                  <div key={comment._id || index} className="space-y-2">
                                        <div className="flex space-x-2">
                                            <div 
                                                onClick={() => navigate(`/user/${comment.user?._id}`)}
                                                className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-600 text-xs font-bold border border-gray-300 cursor-pointer hover:border-indigo-400 transition-colors"
                                            >
                                                {comment.user?.name ? comment.user.name.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="bg-gray-100 rounded-2xl rounded-tl-none p-3.5 relative group border border-gray-200/50">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span 
                                                            onClick={() => navigate(`/user/${comment.user?._id}`)}
                                                            className="text-gray-900 text-xs font-bold hover:text-indigo-600 cursor-pointer"
                                                        >
                                                            {comment.user?.name || 'User'}
                                                        </span>
                                                        <span className="text-gray-400 text-[10px] uppercase font-black tracking-widest">
                                                            {new Date(comment.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>

                                                    {editingComment === comment._id ? (
                                                        <div className="flex flex-col space-y-2">
                                                            <textarea
                                                                className="w-full text-sm p-2 border rounded"
                                                                value={editText}
                                                                onChange={(e) => setEditText(e.target.value)}
                                                            />
                                                            <div className="flex space-x-2 text-xs">
                                                                <button onClick={() => handleEditSubmit(comment._id)} className="text-blue-600 font-medium">Save</button>
                                                                <button onClick={() => setEditingComment(null)} className="text-gray-500">Cancel</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.text}</p>
                                                    )}
                                                </div>

                                                <div className="flex items-center space-x-4 mt-1 pl-2">
                                                    <button
                                                        onClick={() => {
                                                            setReplyingTo(replyingTo === comment._id ? null : comment._id);
                                                            setReplyText('');
                                                        }}
                                                        className="text-xs text-gray-500 hover:text-blue-600 font-medium"
                                                    >
                                                        Reply
                                                    </button>
                                                    {currentUser?._id === comment.user?._id && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingComment(comment._id);
                                                                    setEditText(comment.text);
                                                                    setReplyingTo(null);
                                                                }}
                                                                className="text-xs text-gray-500 hover:text-blue-600 font-medium"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteComment(comment._id)}
                                                                className="text-xs text-gray-500 hover:text-red-600 font-medium"
                                                            >
                                                                Delete
                                                            </button>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Reply Input */}
                                                {replyingTo === comment._id && (
                                                    <div className="mt-2 flex items-start space-x-2">
                                                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-600 text-[10px] font-bold">
                                                            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                                                        </div>
                                                        <div className="flex-1">
                                                            <input
                                                                type="text"
                                                                value={replyText}
                                                                onChange={(e) => setReplyText(e.target.value)}
                                                                placeholder="Write a reply..."
                                                                className="w-full bg-white border border-gray-300 rounded-full px-3 py-1 text-xs focus:outline-none focus:border-indigo-500"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleReplySubmit(comment._id);
                                                                }}
                                                            />
                                                            <div className="flex justify-end mt-1 px-1">
                                                                <button
                                                                    onClick={() => handleReplySubmit(comment._id)}
                                                                    className="text-xs text-indigo-600 font-semibold hover:underline"
                                                                >
                                                                    Post
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Nested Replies */}
                                                {comment.replies && comment.replies.length > 0 && (
                                                    <div className="mt-2 space-y-2 pl-4 border-l-2 border-gray-200 ml-1">
                                                        {comment.replies.map((reply, rIndex) => (
                                                            <div key={rIndex} className="flex space-x-2">
                                                                <div 
                                                                    onClick={() => navigate(`/user/${reply.user?._id}`)}
                                                                    className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-600 text-[10px] font-bold border border-gray-300 cursor-pointer hover:border-indigo-400"
                                                                >
                                                                    {reply.user?.name ? reply.user.name.charAt(0).toUpperCase() : 'U'}
                                                                </div>
                                                                <div className="flex-1 bg-gray-50 rounded-2xl p-2.5 border border-gray-200/50">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <span 
                                                                            onClick={() => navigate(`/user/${reply.user?._id}`)}
                                                                            className="text-gray-900 text-xs font-bold hover:text-indigo-600 cursor-pointer"
                                                                        >
                                                                            {reply.user?.name || 'User'}
                                                                        </span>
                                                                        <span className="text-gray-400 text-[9px] uppercase font-bold tracking-wider">
                                                                            {new Date(reply.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-gray-700 text-xs leading-relaxed">{reply.text}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const EditPostModal = ({ post, onClose, onUpdate }) => {
    const [content, setContent] = useState(post.content);
    const [title, setTitle] = useState(post.title || '');
    const [imageUrl, setImageUrl] = useState(post.image || '');
    const [eventDate, setEventDate] = useState(post.eventDate ? new Date(post.eventDate).toISOString().slice(0, 16) : '');
    const [eventLocation, setEventLocation] = useState(post.eventLocation || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const token = userInfo.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${post._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content, title, image: imageUrl, eventDate, eventLocation })
            });

            if (res.ok) {
                const data = await res.json();
                onUpdate(data);
                onClose();
            }
        } catch (error) {
            console.error("Update failed", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingImage(true);
        try {
            const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
            const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
            const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;
            const timestamp = Math.round((new Date()).getTime() / 1000);
            const str = `timestamp=${timestamp}${apiSecret}`;
            const encoder = new TextEncoder();
            const data = encoder.encode(str);
            const hashBuffer = await crypto.subtle.digest('SHA-1', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            const formDataToUpload = new FormData();
            formDataToUpload.append('file', file);
            formDataToUpload.append('api_key', apiKey);
            formDataToUpload.append('timestamp', timestamp);
            formDataToUpload.append('signature', signature);

            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formDataToUpload
            });
            const dataRes = await res.json();
            if (res.ok) setImageUrl(dataRes.secure_url);
        } catch (error) { console.error(error); } finally { setUploadingImage(false); }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Edit Post</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Refine your content</p>
                    </div>
                    <button onClick={onClose} className="bg-white p-2.5 rounded-full shadow-sm hover:bg-gray-100 transition-colors">
                        <MoreHorizontal className="w-6 h-6 rotate-45 transform" />
                    </button>
                </div>

                <form onSubmit={handleUpdate} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {post.postType === 'article' && (
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Article Title</label>
                            <input 
                                type="text" 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                placeholder="Article Title..."
                            />
                        </div>
                    )}

                    {post.postType === 'event' && (
                        <div className="space-y-4 bg-amber-50/30 p-5 rounded-3xl border border-amber-100/50">
                             <div>
                                <label className="block text-xs font-black text-amber-600 uppercase tracking-widest mb-2 px-1">Event Name</label>
                                <input 
                                    type="text" 
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-white border border-amber-100 rounded-2xl p-3.5 font-bold text-gray-900 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-amber-600 uppercase tracking-widest mb-2 px-1">Date & Time</label>
                                    <input 
                                        type="datetime-local" 
                                        value={eventDate}
                                        onChange={(e) => setEventDate(e.target.value)}
                                        className="w-full bg-white border border-amber-100 rounded-2xl p-3 text-sm font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-amber-600 uppercase tracking-widest mb-2 px-1">Location</label>
                                    <input 
                                        type="text" 
                                        value={eventLocation}
                                        onChange={(e) => setEventLocation(e.target.value)}
                                        className="w-full bg-white border border-amber-100 rounded-2xl p-3 text-sm font-bold"
                                        placeholder="Location..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Post Content</label>
                        <textarea 
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-3xl p-5 min-h-[120px] text-gray-800 font-medium focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
                            placeholder="What do you want to talk about?"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Media</label>
                        <div className="flex items-center gap-4">
                            <input 
                                type="text" 
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="Image URL..."
                                className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm font-bold outline-none"
                            />
                            <div className="relative">
                                <input type="file" id="edit-media" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                <button type="button" onClick={() => document.getElementById('edit-media').click()} className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-colors">
                                    {uploadingImage ? <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> : <Globe className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        {imageUrl && (
                            <div className="mt-4 relative h-40 w-full rounded-2xl overflow-hidden border border-gray-100 group">
                                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => setImageUrl('')} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black transition-colors opacity-0 group-hover:opacity-100">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </form>

                <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex gap-4">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="flex-1 py-4 bg-white border border-gray-200 text-gray-700 font-black rounded-2xl hover:bg-gray-100 transition-all text-sm uppercase tracking-widest"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleUpdate}
                        disabled={isSubmitting || uploadingImage}
                        className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all text-sm uppercase tracking-widest disabled:opacity-50"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default PostCard;
