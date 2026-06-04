import React, { useState, useEffect, useRef } from 'react';
import { Plus, Image as ImageIcon, Star, Trash2, Edit, X, Upload } from 'lucide-react';

export default function SuccessStoriesManager() {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPinned, setIsPinned] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    const token = JSON.parse(localStorage.getItem('userInfo'))?.token;

    useEffect(() => {
        fetchStories();
    }, []);

    const fetchStories = async () => {
        try {
            setLoading(true);
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

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !content || !imageFile) {
            alert("Title, content, and an image are required.");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('isPinned', isPinned);
            formData.append('image', imageFile);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/stories`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}` // Do not set Content-Type, let browser set it with boundary
                },
                body: formData
            });

            if (res.ok) {
                resetForm();
                fetchStories();
            } else {
                const errorData = await res.json();
                alert(errorData.message || 'Failed to create story');
            }
        } catch (error) {
            console.error('Error creating story', error);
            alert('An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this story?")) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/stories/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setStories(stories.filter(s => s._id !== id));
            }
        } catch (error) {
            console.error('Error deleting story', error);
        }
    };

    const togglePin = async (id) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/stories/${id}/pin`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const updated = await res.json();
                // Update state locally to sort it correctly without full refetch if possible, or just refetch
                fetchStories();
            }
        } catch (error) {
            console.error('Error toggling pin', error);
        }
    };

    const resetForm = () => {
        setTitle('');
        setContent('');
        setIsPinned(false);
        setImageFile(null);
        setImagePreview(null);
        setIsFormOpen(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Star className="w-8 h-8 text-amber-500" />
                            Success Stories & Star Alumni
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Publish inspiring stories to motivate current students.</p>
                    </div>
                    {!isFormOpen && (
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200"
                        >
                            <Plus className="w-5 h-5" /> Write New Story
                        </button>
                    )}
                </div>

                {isFormOpen && (
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mb-8 animate-fade-in-down">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-slate-900">Create Success Story</h2>
                            <button onClick={resetForm} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Image Upload Column */}
                                <div className="lg:col-span-1">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Cover Photo</label>
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`w-full aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                                            imagePreview ? 'border-indigo-500' : 'border-slate-300 hover:border-indigo-400 bg-slate-50'
                                        }`}
                                    >
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                                                    <Upload className="w-5 h-5 text-indigo-500" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-500">Upload Photo</span>
                                                <span className="text-xs font-medium text-slate-400 mt-1">PNG, JPG up to 5MB</span>
                                            </>
                                        )}
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleImageChange} 
                                        accept="image/*" 
                                        className="hidden" 
                                    />
                                    
                                    <label className="flex items-center gap-3 mt-6 cursor-pointer group">
                                        <div className="relative flex items-center justify-center">
                                            <input 
                                                type="checkbox" 
                                                checked={isPinned} 
                                                onChange={(e) => setIsPinned(e.target.checked)}
                                                className="sr-only"
                                            />
                                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                                                isPinned ? 'bg-amber-500 border-amber-500' : 'border-slate-300 group-hover:border-amber-400'
                                            }`}>
                                                {isPinned && <Star className="w-4 h-4 text-white fill-current" />}
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">Pin to top of Student Dashboard</span>
                                    </label>
                                </div>

                                {/* Content Column */}
                                <div className="lg:col-span-2 flex flex-col gap-5">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Story Title</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="e.g., From MMCOE to Google: John's Journey"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium"
                                            required
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Story Content</label>
                                        <textarea
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            placeholder="Write the full success story here..."
                                            className="w-full flex-1 min-h-[250px] px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium resize-y"
                                            required
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Publishing...</>
                                    ) : 'Publish Story'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Stories List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white h-80 rounded-3xl animate-pulse border border-slate-100"></div>
                        ))
                    ) : stories.length === 0 ? (
                        <div className="col-span-full py-20 text-center">
                            <Star className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-400">No stories published yet</h3>
                            <p className="text-slate-500 mt-2">Click "Write New Story" to get started.</p>
                        </div>
                    ) : (
                        stories.map((story) => (
                            <div key={story._id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group relative">
                                {story.isPinned && (
                                    <div className="absolute top-4 right-4 z-10 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-current" /> Pinned
                                    </div>
                                )}
                                <div className="h-48 overflow-hidden relative">
                                    <img 
                                        src={story.imageUrl} 
                                        alt={story.title} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-lg font-black text-slate-900 mb-2 line-clamp-2">{story.title}</h3>
                                    <p className="text-sm text-slate-500 line-clamp-3 flex-1">{story.content}</p>
                                    
                                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-400">
                                            {new Date(story.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <button 
                                                onClick={() => togglePin(story._id)}
                                                className={`p-2 rounded-lg transition-colors ${story.isPinned ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-slate-400 bg-slate-100 hover:bg-slate-200'}`}
                                                title={story.isPinned ? "Unpin" : "Pin to top"}
                                            >
                                                <Star className={`w-4 h-4 ${story.isPinned ? 'fill-current' : ''}`} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(story._id)}
                                                className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                title="Delete story"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
