import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Briefcase, MapPin, Linkedin, Globe, Award,
    BookOpen, Save, Loader, Settings, Bell,
    Trash2, Camera, Mail, GraduationCap, Building, Key, Shield, Users,
    ChevronRight, CheckCircle2, AlertCircle, Plus, X, Activity, MessageSquare, Repeat, FileText
} from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';
import PostCard from '../components/Feed/PostCard';

const InputField = ({ label, icon: Icon, ...props }) => (
    <div className="space-y-1.5 flex-1 w-full">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="relative group">
            {Icon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
            )}
            <input
                {...props}
                className={`w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm ${Icon ? 'pl-10' : ''} ${props.disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'hover:border-gray-300'}`}
            />
        </div>
    </div>
);

const SelectField = ({ label, icon: Icon, options, ...props }) => (
    <div className="space-y-1.5 flex-1 w-full">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="relative group">
            {Icon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
            )}
            <select
                {...props}
                className={`w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm ${Icon ? 'pl-10' : ''} hover:border-gray-300`}
            >
                {options.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                ))}
            </select>
        </div>
    </div>
);

const TextAreaField = ({ label, icon: Icon, ...props }) => (
    <div className="space-y-1.5 w-full">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="relative group">
            {Icon && (
                <div className="absolute top-3 left-3 flex items-center pointer-events-none">
                    <Icon className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
            )}
            <textarea
                {...props}
                className={`w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm resize-y min-h-[100px] ${Icon ? 'pl-10' : ''} hover:border-gray-300`}
            />
        </div>
    </div>
);

// Modal Component for Overlays
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
            >
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </motion.div>
        </div>
    );
};

export default function Profile() {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Modals State
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Changing Password State
    const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [modalSubmitting, setModalSubmitting] = useState(false);
    const [modalError, setModalError] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const [activity, setActivity] = useState({ posts: [], reposts: [], comments: [] });
    const [activityType, setActivityType] = useState('posts');
    const [loadingActivity, setLoadingActivity] = useState(false);
    const [connections, setConnections] = useState([]);
    const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        bio: '',
        location: '',
        linkedinUrl: '',
        githubUrl: '',
        portfolioUrl: '',
        headline: '',
        skills: '',
        expertiseAreas: '',
        profilePhoto: '',
        bannerPhoto: '',
        experience: [],
        education: [],
        currentPosition: '',
        company: '',
        branch: '',
        currentYear: '',
        graduationYear: '',
        isPublic: true,
        emailAlerts: true,
        pushNotifications: true
    });

    useEffect(() => {
        fetchProfile();
        fetchActivity();
        fetchConnections();
    }, []);

    const fetchConnections = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/connections`, {
                headers: { Authorization: `Bearer ${userInfo?.token}` },
            });
            if (response.ok) {
                setConnections(await response.json());
            }
        } catch (error) {
            console.error('Error fetching connections:', error);
        }
    };

    const fetchActivity = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/my-activity`, {
                headers: { Authorization: `Bearer ${userInfo?.token}` },
            });
            if (response.ok) {
                setActivity(await response.json());
            }
        } catch (error) {
            console.error('Error fetching activity:', error);
        }
    };

    const fetchProfile = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const token = userInfo?.token;

            if (!token) return;

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                setFormData({
                    ...data,
                    skills: data.skills ? data.skills.join(', ') : '',
                    expertiseAreas: data.expertiseAreas ? data.expertiseAreas.join(', ') : '',
                    profilePhoto: data.profilePhoto || '',
                    bannerPhoto: data.bannerPhoto || '',
                    headline: data.headline || '',
                    githubUrl: data.githubUrl || '',
                    location: data.location || '',
                    experience: data.experience || [],
                    education: data.education || [],
                    isPublic: data.isPublic !== undefined ? data.isPublic : true,
                    emailAlerts: data.emailAlerts !== undefined ? data.emailAlerts : true,
                    pushNotifications: data.pushNotifications !== undefined ? data.pushNotifications : true
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageUpload = async (e, fieldName = 'profilePhoto') => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingImage(true);
        setMessage({ type: '', text: '' });

        try {
            const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
            const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
            const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;

            if (!cloudName || !apiKey || !apiSecret) {
                throw new Error("Cloudinary credentials are missing");
            }

            const timestamp = Math.round((new Date()).getTime() / 1000);

            // Create signature
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
                setFormData(prev => ({ ...prev, [fieldName]: dataRes.secure_url }));
                setMessage({ type: 'success', text: `${fieldName === 'profilePhoto' ? 'Profile' : 'Banner'} image uploaded successfully! (Don't forget to click Save Changes)` });
            } else {
                setMessage({ type: 'error', text: dataRes.error?.message || 'Failed to upload image' });
            }
        } catch (error) {
            console.error('Image upload error:', error);
            setMessage({ type: 'error', text: error.message || 'An error occurred during image upload.' });
        } finally {
            setUploadingImage(false);
            e.target.value = null; // reset file input
        }
    };

    // Advanced Arrays Handlers
    const addExperience = () => setFormData(prev => ({ ...prev, experience: [...prev.experience, { title: '', company: '', mode: 'On-site', location: '' }] }));
    const updateExperience = (index, field, value) => { const newExp = [...formData.experience]; newExp[index][field] = value; setFormData({ ...formData, experience: newExp }); };
    const removeExperience = (index) => setFormData({ ...formData, experience: formData.experience.filter((_, i) => i !== index) });

    const addEducation = () => setFormData(prev => ({ ...prev, education: [...prev.education, { institution: '', degree: '', fieldOfStudy: '', location: '' }] }));
    const updateEducation = (index, field, value) => { const newEdu = [...formData.education]; newEdu[index][field] = value; setFormData({ ...formData, education: newEdu }); };
    const removeEducation = (index) => setFormData({ ...formData, education: formData.education.filter((_, i) => i !== index) });

    // Handle Form Submit (Profile Tab)
    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const token = userInfo?.token;

            const updatedData = {
                ...formData,
                skills: formData.skills.split(',').map(skill => skill.trim()).filter(Boolean),
                expertiseAreas: formData.expertiseAreas.split(',').map(area => area.trim()).filter(Boolean),
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(updatedData),
            });

            const data = await response.json();

            if (response.ok) {
                const updatedUserInfo = { ...userInfo, ...data };
                localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
                window.dispatchEvent(new Event('user-updated'));

                // Alumni gate: after profile is complete, redirect to verification if not yet verified
                if (data.role === 'alumni' && data.isProfileComplete && !data.isVerified) {
                    window.location.href = '/alumni/verification';
                    return;
                }

                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    // Instant Save for Toggles (Settings Tab)
    const toggleSetting = async (settingName) => {
        const newValue = !formData[settingName];
        setFormData(prev => ({ ...prev, [settingName]: newValue }));

        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo?.token}` },
                body: JSON.stringify({ [settingName]: newValue }),
            });
            
            if (res.ok) {
                const updatedUser = await res.json();
                const updatedUserInfo = { ...userInfo, ...updatedUser };
                localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
                
                const labelMap = { isPublic: 'Visibility', emailAlerts: 'Email Alerts', pushNotifications: 'Push Notifications' };
                const label = labelMap[settingName];
                const status = settingName === 'isPublic' ? (newValue ? 'Public' : 'Private') : (newValue ? 'enabled' : 'disabled');
                
                setMessage({ 
                    type: 'success', 
                    text: settingName === 'isPublic' ? `Profile is now ${status}` : `${label} ${status}!` 
                });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            }
        } catch (err) {
            console.error(`Failed to toggle ${settingName}`, err);
        }
    };

    const toggleVisibility = () => toggleSetting('isPublic');
    const toggleEmailAlerts = () => toggleSetting('emailAlerts');
    const togglePushNotifications = () => toggleSetting('pushNotifications');

    // Password Change Logic
    const handleChangePassword = async (e) => {
        e.preventDefault();
        setModalError('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return setModalError("New passwords do not match!");
        }

        setModalSubmitting(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/change-password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo?.token}` },
                body: JSON.stringify({
                    oldPassword: passwordData.oldPassword,
                    newPassword: passwordData.newPassword
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsPasswordModalOpen(false);
                setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                setMessage({ type: 'success', text: 'Password successfully updated!' });
                setTimeout(() => setMessage({ type: '', text: '' }), 4000);
            } else {
                setModalError(data.message || "Failed to change password.");
            }
        } catch (error) {
            setModalError("Server error. Try again.");
        } finally {
            setModalSubmitting(false);
        }
    };

    // Account Deletion Logic
    const handleDeleteAccount = async () => {
        setModalSubmitting(true);
        setModalError('');

        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/delete-account`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${userInfo?.token}` }
            });

            if (response.ok) {
                // Logout flow
                localStorage.removeItem('userInfo');
                window.location.href = '/'; // Redirect to home
            } else {
                const data = await response.json();
                setModalError(data.message || "Failed to delete account.");
                setModalSubmitting(false);
            }
        } catch (error) {
            setModalError("Server error. Try again.");
            setModalSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="min-h-screen bg-white pt-24 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-5xl mx-auto space-y-6 flex flex-col items-center">

                {/* Global Settings Status Messages */}
                <div className="w-full">
                    <AnimatePresence>
                        {message.text && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                className={`p-4 rounded-xl flex items-center gap-3 w-full shadow-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
                            >
                                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                                <span className="font-medium">{message.text}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Page Header */}
                <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Account Workspace</h1>
                        <p className="text-gray-500 mt-1">Manage your profile, preferences, and account settings.</p>
                    </div>
                    {/* Modern Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner self-start w-full md:w-auto border border-gray-200">
                        <button
                            onClick={() => { setActiveTab('profile'); setMessage({ type: '', text: '' }); }}
                            className={`flex flex-1 md:flex-none items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'profile'
                                ? 'bg-white text-indigo-600 shadow-sm border border-gray-200/50'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <User className="w-4 h-4" /> Profile
                        </button>
                        <button
                            onClick={() => { setActiveTab('settings'); setMessage({ type: '', text: '' }); }}
                            className={`flex flex-1 md:flex-none items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'settings'
                                ? 'bg-white text-indigo-600 shadow-sm border border-gray-200/50'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Settings className="w-4 h-4" /> Settings
                        </button>
                        <button
                            onClick={() => { setActiveTab('activity'); setMessage({ type: '', text: '' }); }}
                            className={`flex flex-1 md:flex-none items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'activity'
                                ? 'bg-white text-indigo-600 shadow-sm border border-gray-200/50'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Activity className="w-4 h-4" /> Activity
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'profile' ? (
                        <motion.form
                            key="profile"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            onSubmit={handleSubmit}
                            className="space-y-6 w-full"
                        >
                            {/* Profile Header Card */}
                            <div className="bg-white rounded-3xl shadow-md border border-gray-200 overflow-hidden relative">
                                <div className="h-40 relative group/banner">
                                    {formData.bannerPhoto ? (
                                        <img src={formData.bannerPhoto} alt="Banner" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                                    )}
                                    <label className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-xl text-white opacity-0 group-hover/banner:opacity-100 hover:bg-white/40 min-w-[40px] h-10 flex items-center justify-center cursor-pointer transition-all border border-white/30 shadow-lg">
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, 'bannerPhoto')}
                                        />
                                        <Camera className="w-4 h-4 mr-2" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Change Cover</span>
                                    </label>
                                </div>
                                <div className="px-6 sm:px-10 pb-8">
                                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 sm:-mt-20 mb-6 text-center sm:text-left relative z-10">
                                        <div className="relative group">
                                            <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center overflow-hidden shadow-xl">
                                                {formData.profilePhoto ? (
                                                    <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-12 h-12 text-gray-400" />
                                                )}
                                            </div>
                                            <label className="absolute bottom-1 right-1 bg-indigo-600 p-2.5 rounded-full text-white shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all w-10 h-10 flex items-center justify-center cursor-pointer">
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                />
                                                {uploadingImage ? <Loader className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                                            </label>
                                        </div>
                                        <div className="flex-1 pb-2">
                                            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{formData.name || 'Your Name'}</h2>
                                            <p className="text-gray-600 flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2 font-medium">
                                                {formData.headline ? (
                                                    <span>{formData.headline}</span>
                                                ) : (
                                                    <>
                                                        <Briefcase className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                                        {formData.experience && formData.experience.length > 0 ? (
                                                            <span>{formData.experience[0].title} {formData.experience[0].company && <span className="opacity-75">at {formData.experience[0].company}</span>}</span>
                                                        ) : 'Add your professional title or headline'}
                                                    </>
                                                )}
                                            </p>
                                            <div className="flex justify-center sm:justify-start mt-4">
                                                <button 
                                                    type="button"
                                                    onClick={() => setIsConnectionsModalOpen(true)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-full text-sm font-bold transition-all shadow-sm border border-indigo-100/50"
                                                >
                                                    <Users className="w-4 h-4" />
                                                    {connections.length} {connections.length === 1 ? 'Connection' : 'Connections'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Grid Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left Column: Core Info & Dynamic Lists */}
                                <div className="lg:col-span-2 space-y-6">

                                    {/* Personal Info */}
                                    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8">
                                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                            <User className="w-6 h-6 text-indigo-500" /> About You
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                                            <InputField
                                                label="Full Name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                icon={User}
                                                placeholder="John Doe"
                                            />
                                            <InputField
                                                label="Email Address"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                icon={Mail}
                                                disabled
                                            />
                                            <div className="sm:col-span-2">
                                                <InputField
                                                    label="Headline (e.g. MERN Stack Developer | AI Enthusiast)"
                                                    name="headline"
                                                    value={formData.headline}
                                                    onChange={handleChange}
                                                    icon={Briefcase}
                                                    placeholder="Short professional summary..."
                                                />
                                            </div>
                                            {/* Role-Specific Core Fields */}
                                            {userInfo?.role === 'alumni' ? (
                                                <>
                                                    <InputField
                                                        label="Current Position"
                                                        name="currentPosition"
                                                        value={formData.currentPosition || ''}
                                                        onChange={handleChange}
                                                        icon={Briefcase}
                                                        placeholder="e.g. Senior Software Engineer"
                                                    />
                                                    <InputField
                                                        label="Current Company"
                                                        name="company"
                                                        value={formData.company || ''}
                                                        onChange={handleChange}
                                                        icon={Building}
                                                        placeholder="e.g. Google"
                                                    />
                                                    <InputField
                                                        label="Graduation Year"
                                                        name="graduationYear"
                                                        type="number"
                                                        value={formData.graduationYear || ''}
                                                        onChange={handleChange}
                                                        icon={GraduationCap}
                                                        placeholder="e.g. 2020"
                                                    />
                                                    <InputField
                                                        label="Branch"
                                                        name="branch"
                                                        value={formData.branch || ''}
                                                        onChange={handleChange}
                                                        icon={BookOpen}
                                                        placeholder="e.g. Computer Engineering"
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    <InputField
                                                        label="College Name"
                                                        name="college"
                                                        value={formData.college || ''}
                                                        onChange={handleChange}
                                                        icon={Building}
                                                        placeholder="e.g. MMCOE"
                                                    />
                                                    <SelectField
                                                        label="Current Year"
                                                        name="currentYear"
                                                        value={formData.currentYear || ''}
                                                        onChange={handleChange}
                                                        icon={GraduationCap}
                                                        options={['', '1', '2', '3', '4']}
                                                    />
                                                    <InputField
                                                        label="Branch"
                                                        name="branch"
                                                        value={formData.branch || ''}
                                                        onChange={handleChange}
                                                        icon={BookOpen}
                                                        placeholder="e.g. IT Engineering"
                                                    />
                                                </>
                                            )}
                                            <div className="sm:col-span-2">
                                                <InputField
                                                    label="Location"
                                                    name="location"
                                                    value={formData.location}
                                                    onChange={handleChange}
                                                    icon={MapPin}
                                                    placeholder="City, Country"
                                                />
                                            </div>
                                        </div>
                                        <TextAreaField
                                            label="Professional Bio"
                                            name="bio"
                                            value={formData.bio}
                                            onChange={handleChange}
                                            icon={User}
                                            placeholder="Tell us about yourself, your career path, and what you're passionate about..."
                                        />
                                    </div>

                                    {/* Experience Array Fields */}
                                    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                                <Briefcase className="w-6 h-6 text-indigo-500" /> Professional Journey
                                            </h3>
                                            <button type="button" onClick={addExperience} className="flex items-center gap-1 text-indigo-600 font-semibold text-sm hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                                                <Plus className="w-4 h-4" /> Add Experience
                                            </button>
                                        </div>

                                        <div className="space-y-8">
                                            <AnimatePresence>
                                                {formData.experience.length === 0 && (
                                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-500 text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                        No experience added yet. Click "Add Experience" to include your internships or jobs.
                                                    </motion.p>
                                                )}
                                                {formData.experience.map((exp, index) => (
                                                    <motion.div
                                                        key={`exp-${index}`}
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="relative p-5 rounded-2xl bg-gray-50 border border-gray-200 group"
                                                    >
                                                        <button type="button" onClick={() => removeExperience(index)} className="absolute -top-3 -right-3 bg-white text-gray-400 hover:text-red-500 p-1.5 rounded-full shadow-sm border border-gray-200 transition-colors z-10">
                                                            <X className="w-4 h-4" />
                                                        </button>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                                            <InputField
                                                                label="Position / Title"
                                                                value={exp.title}
                                                                onChange={(e) => updateExperience(index, 'title', e.target.value)}
                                                                placeholder="e.g. Software Engineer Intern"
                                                            />
                                                            <InputField
                                                                label="Company Name"
                                                                value={exp.company}
                                                                onChange={(e) => updateExperience(index, 'company', e.target.value)}
                                                                placeholder="e.g. Google"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <SelectField
                                                                label="Work Mode"
                                                                value={exp.mode}
                                                                onChange={(e) => updateExperience(index, 'mode', e.target.value)}
                                                                options={['On-site', 'Remote', 'Hybrid']}
                                                            />
                                                            <InputField
                                                                label="Location"
                                                                value={exp.location}
                                                                onChange={(e) => updateExperience(index, 'location', e.target.value)}
                                                                placeholder="e.g. Pune, India"
                                                            />
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {/* Education Array Fields */}
                                    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                                <GraduationCap className="w-6 h-6 text-indigo-500" /> Education Background
                                            </h3>
                                            <button type="button" onClick={addEducation} className="flex items-center gap-1 text-indigo-600 font-semibold text-sm hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                                                <Plus className="w-4 h-4" /> Add Education
                                            </button>
                                        </div>

                                        <div className="space-y-8">
                                            <AnimatePresence>
                                                {formData.education.length === 0 && (
                                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-500 text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                        No education added yet. Click "Add Education" to include your schools or colleges.
                                                    </motion.p>
                                                )}
                                                {formData.education.map((edu, index) => (
                                                    <motion.div
                                                        key={`edu-${index}`}
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="relative p-5 rounded-2xl bg-gray-50 border border-gray-200 group"
                                                    >
                                                        <button type="button" onClick={() => removeEducation(index)} className="absolute -top-3 -right-3 bg-white text-gray-400 hover:text-red-500 p-1.5 rounded-full shadow-sm border border-gray-200 transition-colors z-10">
                                                            <X className="w-4 h-4" />
                                                        </button>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                                            <InputField
                                                                label="Institution / School"
                                                                value={edu.institution}
                                                                onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                                                                placeholder="e.g. MMCOE"
                                                            />
                                                            <InputField
                                                                label="Degree"
                                                                value={edu.degree}
                                                                onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                                                                placeholder="e.g. B.Tech"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <InputField
                                                                label="Field of Study"
                                                                value={edu.fieldOfStudy}
                                                                onChange={(e) => updateEducation(index, 'fieldOfStudy', e.target.value)}
                                                                placeholder="e.g. Computer Science"
                                                            />
                                                            <InputField
                                                                label="Location"
                                                                value={edu.location}
                                                                onChange={(e) => updateEducation(index, 'location', e.target.value)}
                                                                placeholder="e.g. Pune, India"
                                                            />
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Sidebar Options */}
                                <div className="space-y-6">

                                    {/* Skills Section */}
                                    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8">
                                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                            <Award className="w-5 h-5 text-indigo-500" /> Skills & Expertise
                                        </h3>
                                        <div className="space-y-6">
                                            <TextAreaField
                                                label="Core Skills"
                                                name="skills"
                                                value={formData.skills}
                                                onChange={handleChange}
                                                placeholder="React, Node.js, Python (comma separated)"
                                            />
                                            <TextAreaField
                                                label="Areas of Expertise"
                                                name="expertiseAreas"
                                                value={formData.expertiseAreas}
                                                onChange={handleChange}
                                                placeholder="Mentoring, System Design, UI/UX (comma separated)"
                                            />
                                        </div>
                                    </div>

                                    {/* Web Presence Section */}
                                    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8">
                                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                            <Globe className="w-5 h-5 text-indigo-500" /> Online Presence
                                        </h3>
                                        <div className="space-y-5">
                                            <InputField
                                                label="LinkedIn Profile"
                                                name="linkedinUrl"
                                                value={formData.linkedinUrl}
                                                onChange={handleChange}
                                                icon={Linkedin}
                                                placeholder="https://linkedin.com/in/..."
                                            />
                                            <InputField
                                                label="Portfolio / Website"
                                                name="portfolioUrl"
                                                value={formData.portfolioUrl}
                                                onChange={handleChange}
                                                icon={Globe}
                                                placeholder="https://yourwebsite.com"
                                            />
                                            <InputField
                                                label="GitHub Profile"
                                                name="githubUrl"
                                                value={formData.githubUrl}
                                                onChange={handleChange}
                                                icon={Globe}
                                                placeholder="https://github.com/username"
                                            />
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* Floating Save Button */}
                            <div className="fixed bottom-6 right-6 lg:static lg:flex lg:justify-end lg:pt-4 z-50">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-3.5 rounded-full font-bold shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0"
                                >
                                    {saving ? (
                                        <Loader className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Save className="w-5 h-5" />
                                    )}
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </motion.form>
                    ) : activeTab === 'settings' ? (
                        <motion.div
                            key="settings"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6 w-full"
                        >
                            {/* Settings Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                                {/* Preferences & Security */}
                                <div className="space-y-6">
                                    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8">
                                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                            <Shield className="w-6 h-6 text-indigo-500" /> Privacy & Security
                                        </h3>
                                        <div className="space-y-4">

                                            {/* Profile Visibility Auto-Save Toggle */}
                                            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors" onClick={toggleVisibility}>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">Profile Visibility</h4>
                                                    <p className="text-sm text-gray-500 mt-0.5">{formData.isPublic ? 'Public to network' : 'Private to you'}</p>
                                                </div>
                                                <div className="relative inline-flex items-center cursor-pointer">
                                                    <div className={`w-14 h-8 rounded-full transition-colors relative ${formData.isPublic ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                                        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 ${formData.isPublic ? 'left-7' : 'left-1'}`}></div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Change Password Button */}
                                            <button onClick={() => setIsPasswordModalOpen(true)} className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-200 group hover:border-indigo-200 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 group-hover:scale-110 transition-transform">
                                                        <Key className="w-5 h-5" />
                                                    </div>
                                                    <div className="text-left">
                                                        <h4 className="font-bold text-gray-900">Change Password</h4>
                                                        <p className="text-sm text-gray-500 mt-0.5">Update your credentials</p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Notifications & Danger Zone */}
                                <div className="space-y-6">
                                    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8">
                                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                            <Bell className="w-6 h-6 text-indigo-500" /> Notifications
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors" onClick={toggleEmailAlerts}>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">Email Alerts</h4>
                                                    <p className="text-sm text-gray-500 mt-0.5">News and updates</p>
                                                </div>
                                                <div className="relative inline-flex items-center cursor-pointer">
                                                    <div className={`w-14 h-8 rounded-full transition-colors relative ${formData.emailAlerts ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                                        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 ${formData.emailAlerts ? 'left-7' : 'left-1'}`}></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors" onClick={togglePushNotifications}>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">Push Notifications</h4>
                                                    <p className="text-sm text-gray-500 mt-0.5">In-app messages</p>
                                                </div>
                                                <div className="relative inline-flex items-center cursor-pointer">
                                                    <div className={`w-14 h-8 rounded-full transition-colors relative ${formData.pushNotifications ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                                        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 ${formData.pushNotifications ? 'left-7' : 'left-1'}`}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Danger Zone */}
                                    <div className="bg-red-50/20 rounded-3xl shadow-sm border border-red-100 p-6 sm:p-8 mt-6">
                                        <h3 className="text-xl font-bold text-red-600 mb-6 flex items-center gap-2">
                                            <Trash2 className="w-6 h-6" /> Danger Zone
                                        </h3>
                                        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm">
                                            <h4 className="font-bold text-gray-900">Delete Account</h4>
                                            <p className="text-sm text-gray-500 mt-1 mb-5 leading-relaxed">Once you delete your account, there is no going back. All of your networking history will be destroyed permanently.</p>
                                            <button onClick={() => setIsDeleteModalOpen(true)} className="w-full sm:w-auto px-6 py-2.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 rounded-xl font-bold transition-all shadow-sm">
                                                Deactivate Account
                                            </button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="activity"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="w-full space-y-6"
                        >
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                            <Activity className="w-6 h-6 text-indigo-500" /> Your Engagement History
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">Review and manage your interactions across the platform.</p>
                                    </div>

                                    <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 shadow-inner w-full md:w-auto overflow-x-auto">
                                        {[
                                            { id: 'posts', label: 'My Posts', icon: FileText },
                                            { id: 'comments', label: 'Comments', icon: MessageSquare },
                                            { id: 'reposts', label: 'Reposts', icon: Repeat }
                                        ].map((tab) => (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => setActivityType(tab.id)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activityType === tab.id 
                                                    ? 'bg-white text-indigo-600 shadow-sm border border-gray-200/50' 
                                                    : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                <tab.icon className="w-3.5 h-3.5" />
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6 max-w-3xl mx-auto">
                                    {activity[activityType]?.length > 0 ? (
                                        activity[activityType].map((post) => (
                                            <PostCard 
                                                key={post._id} 
                                                post={post} 
                                                currentUser={userInfo}
                                                onLike={() => fetchActivity()}
                                                onComment={() => fetchActivity()}
                                            />
                                        ))
                                    ) : (
                                        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-gray-300">
                                                {activityType === 'posts' ? <FileText className="w-8 h-8" /> : 
                                                 activityType === 'comments' ? <MessageSquare className="w-8 h-8" /> : 
                                                 <Repeat className="w-8 h-8" />}
                                            </div>
                                            <h4 className="text-lg font-bold text-gray-900">No activity yet</h4>
                                            <p className="text-gray-500 max-w-xs mx-auto mt-2 text-sm leading-relaxed">
                                                {activityType === 'posts' ? "You haven't shared any posts or articles yet." : 
                                                 activityType === 'comments' ? "You haven't commented on any posts yet." : 
                                                 "You haven't reposted any content yet."}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Change Password Modal */}
            <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Change Password">
                <form onSubmit={handleChangePassword} className="space-y-4">
                    {modalError && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-200">
                            {modalError}
                        </div>
                    )}
                    <InputField
                        label="Current Password"
                        type="password"
                        required
                        value={passwordData.oldPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                        icon={Key}
                        placeholder="••••••••"
                    />
                    <InputField
                        label="New Password"
                        type="password"
                        required
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        icon={Key}
                        placeholder="••••••••"
                    />
                    <InputField
                        label="Confirm New Password"
                        type="password"
                        required
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        icon={Key}
                        placeholder="••••••••"
                    />
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="px-5 py-2.5 text-gray-700 font-semibold hover:bg-gray-100 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={modalSubmitting} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-70 flex items-center gap-2">
                            {modalSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : null}
                            Update Password
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Account Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Account">
                <div className="space-y-4">
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex gap-3 items-start">
                        <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold">Are you absolutely sure?</h4>
                            <p className="text-sm mt-1 opacity-90">This action cannot be undone. This will permanently delete your account and remove your data from our servers.</p>
                        </div>
                    </div>
                    {modalError && (
                        <div className="text-red-600 text-sm font-medium text-center">{modalError}</div>
                    )}
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="px-5 py-2.5 text-gray-700 font-semibold hover:bg-gray-100 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleDeleteAccount} disabled={modalSubmitting} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-70 flex items-center gap-2">
                            {modalSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : null}
                            Yes, delete my account
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Connections List Modal */}
            <Modal 
                isOpen={isConnectionsModalOpen} 
                onClose={() => setIsConnectionsModalOpen(false)} 
                title="My Network"
            >
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {connections.length > 0 ? (
                        connections.map((conn) => (
                            <div 
                                key={conn._id} 
                                onClick={() => {
                                    setIsConnectionsModalOpen(false);
                                    navigate(`/user/${conn._id}`);
                                }}
                                className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                                    {conn.profilePhoto ? (
                                        <img src={conn.profilePhoto} alt={conn.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-lg font-bold text-indigo-600">{conn.name?.charAt(0) || 'U'}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{conn.name}</h4>
                                    <p className="text-xs text-gray-500 truncate mt-0.5">{conn.headline || conn.role || 'Connection'}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10">
                            <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No connections yet.</p>
                            <button 
                                onClick={() => { setIsConnectionsModalOpen(false); navigate('/student/mentors'); }}
                                className="text-indigo-600 text-sm font-bold mt-2 hover:underline"
                            >
                                Find people to connect with
                            </button>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
