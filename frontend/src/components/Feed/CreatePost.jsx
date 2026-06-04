import React, { useState } from 'react';
import { Image, Send, X, Calendar, FileText, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CreatePost = ({ currentUser, onPostCreate }) => {
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [postType, setPostType] = useState('post'); // 'post', 'event', 'article'
    const [title, setTitle] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventLocation, setEventLocation] = useState('');
    const [showImageInput, setShowImageInput] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);
        try {
            await onPostCreate({ content, image: imageUrl, postType, title, eventDate, eventLocation });
            setContent('');
            setImageUrl('');
            setPostType('post');
            setTitle('');
            setEventDate('');
            setEventLocation('');
            setShowImageInput(false);
        } catch (error) {
            console.error("Failed to create post", error);
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

            if (!cloudName || !apiKey || !apiSecret) {
                throw new Error("Cloudinary credentials are missing in env");
            }

            const timestamp = Math.round((new Date()).getTime() / 1000);
            
            // Create signature (Mirroring logic in Profile.jsx)
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

            if (res.ok) {
                setImageUrl(dataRes.secure_url);
                setShowImageInput(true);
            } else {
                alert(dataRes.error?.message || "Upload failed");
            }
        } catch (error) {
            console.error("Image upload error:", error);
            alert("Error uploading image");
        } finally {
            setUploadingImage(false);
            e.target.value = null; // reset input
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-5 hover:shadow-md transition-shadow duration-300">
            <div className="flex gap-4 mb-3">
                <div className="w-12 h-12 rounded-full bg-white flex-shrink-0 flex items-center justify-center text-indigo-600 font-bold text-lg overflow-hidden ring-2 ring-gray-100 shadow-sm">
                    {currentUser?.profilePhoto ? (
                        <img src={currentUser.profilePhoto} alt={currentUser.name} className="w-full h-full object-cover aspect-square rounded-full" />
                    ) : (
                        currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'
                    )}
                </div>
                <button
                    onClick={() => document.getElementById('post-input').focus()}
                    className="flex-1 text-left bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 rounded-full px-5 py-3.5 text-[15px] font-medium text-gray-500 transition-all shadow-inner"
                >
                    Start a post...
                </button>
            </div>

            <form onSubmit={handleSubmit} className={content || showImageInput || postType !== 'post' ? "block" : "hidden"}>
                <div className="mb-3">
                    {postType === 'article' && (
                        <input
                            type="text"
                            placeholder="Article Title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-transparent text-gray-900 border-b border-gray-200 font-bold text-lg pb-2 focus:outline-none mb-3"
                            required
                        />
                    )}
                    {postType === 'event' && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-3 border border-gray-200 space-y-3">
                            <input
                                type="text"
                                placeholder="Event Name / Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 font-semibold"
                                required
                            />
                            <div className="flex gap-3">
                                <input
                                    type="datetime-local"
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                    className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Location (e.g. Virtual, Pune)"
                                    value={eventLocation}
                                    onChange={(e) => setEventLocation(e.target.value)}
                                    className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                                    required
                                />
                            </div>
                        </div>
                    )}
                    <textarea
                        id="post-input"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={
                            postType === 'article' ? "Write your article here..." :
                                postType === 'event' ? "Provide details about your event..." :
                                    "What do you want to talk about?"
                        }
                        className="w-full bg-transparent text-gray-900 placeholder-gray-500 resize-none focus:outline-none min-h-[100px] text-sm mt-2"
                        required={postType === 'article'}
                    />
                    <AnimatePresence>
                        {showImageInput && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-3 pt-3 border-t border-gray-200"
                            >
                                <div className="flex items-center space-x-2">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={imageUrl}
                                            onChange={(e) => setImageUrl(e.target.value)}
                                            placeholder={uploadingImage ? "Uploading image..." : "Paste image URL or upload below..."}
                                            disabled={uploadingImage}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-indigo-500 pr-10"
                                        />
                                        {uploadingImage && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowImageInput(false);
                                            setImageUrl('');
                                        }}
                                        className="p-2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                {imageUrl && (
                                    <div className="mt-2 relative h-48 w-full rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-inner group">
                                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                        <button 
                                            type="button" 
                                            onClick={() => setImageUrl('')}
                                            className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <div className="flex justify-end mt-2">
                    <button
                        type="submit"
                        disabled={!content.trim() || isSubmitting}
                        className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm flex items-center gap-2 ${content.trim() && !isSubmitting
                            ? 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md text-white'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        <Sparkles className="w-4 h-4" />
                        Post
                    </button>
                </div>
            </form>

            <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-100">
                <input
                    type="file"
                    id="media-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                />
                <button
                    type="button"
                    onClick={() => document.getElementById('media-upload').click()}
                    className="flex items-center gap-2 px-3 py-3 hover:bg-blue-50 rounded-xl transition-colors flex-1 justify-center group"
                >
                    <Image className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-semibold text-gray-600 group-hover:text-blue-700">Media</span>
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setPostType(postType === 'event' ? 'post' : 'event');
                        document.getElementById('post-input')?.focus();
                    }}
                    className={`flex items-center gap-2 px-3 py-3 rounded-xl transition-colors flex-1 justify-center group ${postType === 'event' ? 'bg-amber-100' : 'hover:bg-amber-50'}`}
                >
                    <Calendar className={`w-5 h-5 ${postType === 'event' ? 'text-amber-700' : 'text-amber-500 group-hover:scale-110 transition-transform'}`} />
                    <span className={`text-sm font-semibold ${postType === 'event' ? 'text-amber-800' : 'text-gray-600 group-hover:text-amber-700'}`}>Event</span>
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setPostType(postType === 'article' ? 'post' : 'article');
                        document.getElementById('post-input')?.focus();
                    }}
                    className={`flex items-center gap-2 px-3 py-3 rounded-xl transition-colors flex-1 justify-center group ${postType === 'article' ? 'bg-emerald-100' : 'hover:bg-emerald-50'}`}
                >
                    <FileText className={`w-5 h-5 ${postType === 'article' ? 'text-emerald-700' : 'text-emerald-500 group-hover:scale-110 transition-transform'}`} />
                    <span className={`text-sm font-semibold ${postType === 'article' ? 'text-emerald-800' : 'text-gray-600 group-hover:text-emerald-700'}`}>Write article</span>
                </button>
            </div>
        </div>
    );
};

export default CreatePost;
