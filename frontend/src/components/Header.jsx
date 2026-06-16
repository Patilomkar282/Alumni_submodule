import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    ChevronDown,
    LogOut,
    BookOpen,
    MessageCircle,
    Calendar,
    Bell,
    LayoutDashboard,
    Search,
    Home,
    ShieldAlert,
    ShieldCheck,
    Menu,
    X,
    UserCheck,
    Users
} from "lucide-react";
import NotificationSidebar from "./NotificationSidebar";
import Toast from "./Toast";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../context/ToastContext";

export default function Header() {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const profileRef = useRef(null);
    const searchRef = useRef(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);

    // Notification states
    const [notifications, setNotifications] = useState([]);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [lastNotificationCount, setLastNotificationCount] = useState(0);
    const { toasts, addToast, removeToast } = useToast();

    useEffect(() => {

        // Check for logged in user
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            setUser(JSON.parse(userInfo));
        }

        const handleUserUpdate = () => {
            const updatedInfo = localStorage.getItem('userInfo');
            if (updatedInfo) {
                setUser(JSON.parse(updatedInfo));
            }
        };

        window.addEventListener('user-updated', handleUserUpdate);

        // Fetch notifications if user logged in
        if (userInfo) {
            fetchNotifications(JSON.parse(userInfo).token);
        }

        // Close dropdowns when clicking outside
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setIsProfileOpen(false);
            }
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSearchDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            window.removeEventListener('user-updated', handleUserUpdate);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const fetchNotifications = async (token) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();

                // Show toast for new unread notifications
                const unreadNotifications = data.filter(n => !n.read);
                if (unreadNotifications.length > lastNotificationCount) {
                    const newNotifications = unreadNotifications.slice(0, unreadNotifications.length - lastNotificationCount);
                    newNotifications.forEach(notif => {
                        addToast({
                            title: notif.message,
                            type: notif.type,
                            duration: 4000
                        });
                    });
                }

                setLastNotificationCount(unreadNotifications.length);
                setNotifications(data);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    const markAsRead = async (id) => {
        try {
            const token = user?.token || JSON.parse(localStorage.getItem('userInfo'))?.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
            }
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const handleAcceptInvite = async (groupId, notificationId) => {
        try {
            const token = user?.token || JSON.parse(localStorage.getItem('userInfo'))?.token;

            // Accept group invite - correct endpoint is PUT /:id/join
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/groups/${groupId}/join`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const groupData = await res.json();

                // Update notification action status
                await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${notificationId}/action`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ actionStatus: 'accepted' })
                });

                setNotifications(notifications.map(n => n._id === notificationId ? { ...n, actionStatus: 'accepted', read: true } : n));
                addToast({
                    title: "Group Joined!",
                    message: `Successfully joined "${groupData.name}"`,
                    type: 'success',
                    duration: 3000
                });
            } else {
                const errorData = await res.json();
                addToast({
                    title: "Error",
                    message: errorData.message || "Failed to join group",
                    type: 'error',
                    duration: 4000
                });
            }
        } catch (error) {
            console.error("Error accepting group invite:", error);
            addToast({
                title: "Error",
                message: "Failed to join group",
                type: 'error',
                duration: 4000
            });
        }
    };

    const handleDeclineInvite = async (groupId, notificationId) => {
        try {
            const token = user?.token || JSON.parse(localStorage.getItem('userInfo'))?.token;

            // Decline group invite - correct endpoint is PUT /:id/decline
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/groups/${groupId}/decline`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                // Update notification action status
                await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${notificationId}/action`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ actionStatus: 'rejected' })
                });

                setNotifications(notifications.map(n => n._id === notificationId ? { ...n, actionStatus: 'rejected', read: true } : n));
                addToast({
                    title: "Invite Declined",
                    message: "You declined the group invitation",
                    type: 'info',
                    duration: 3000
                });
            } else {
                const errorData = await res.json();
                addToast({
                    title: "Error",
                    message: errorData.message || "Failed to decline invitation",
                    type: 'error',
                    duration: 4000
                });
            }
        } catch (error) {
            console.error("Error declining group invite:", error);
            addToast({
                title: "Error",
                message: "Failed to decline invitation",
                type: 'error',
                duration: 4000
            });
        }
    };

    const handleAcceptConnection = async (requestId, notificationId) => {
        try {
            const token = user?.token || JSON.parse(localStorage.getItem('userInfo'))?.token;

            // Accept the connection request
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/connections/request/${requestId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'accepted' })
            });

            if (res.ok) {
                // Update notification action status
                await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${notificationId}/action`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ actionStatus: 'accepted' })
                });

                setNotifications(notifications.map(n => n._id === notificationId ? { ...n, actionStatus: 'accepted', read: true } : n));
                addToast({
                    title: "Connection Accepted!",
                    message: "You have accepted the connection request",
                    type: 'success',
                    duration: 3000
                });
            } else {
                const errorData = await res.json();
                addToast({
                    title: "Error",
                    message: errorData.message || "Failed to accept connection",
                    type: 'error',
                    duration: 4000
                });
            }
        } catch (error) {
            console.error("Error accepting connection:", error);
            addToast({
                title: "Error",
                message: "Failed to accept connection request",
                type: 'error',
                duration: 4000
            });
        }
    };

    const handleDeclineConnection = async (requestId, notificationId) => {
        try {
            const token = user?.token || JSON.parse(localStorage.getItem('userInfo'))?.token;

            // Reject the connection request
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/connections/request/${requestId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'rejected' })
            });

            if (res.ok) {
                // Update notification action status
                await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${notificationId}/action`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ actionStatus: 'rejected' })
                });

                setNotifications(notifications.map(n => n._id === notificationId ? { ...n, actionStatus: 'rejected', read: true } : n));
                addToast({
                    title: "Connection Declined",
                    message: "You have declined the connection request",
                    type: 'info',
                    duration: 3000
                });
            } else {
                const errorData = await res.json();
                addToast({
                    title: "Error",
                    message: errorData.message || "Failed to decline connection",
                    type: 'error',
                    duration: 4000
                });
            }
        } catch (error) {
            console.error("Error declining connection:", error);
            addToast({
                title: "Error",
                message: "Failed to decline connection request",
                type: 'error',
                duration: 4000
            });
        }
    };

    const handleNotificationClick = (notification) => {
        // Mark as read first if not already read
        if (!notification.read) {
            markAsRead(notification._id);
        }

        // Navigate based on notification type
        const role = user?.role || JSON.parse(localStorage.getItem('userInfo'))?.role;

        switch (notification.type) {
            case 'new_message':
                navigate(`/${role}/messages`);
                break;
            case 'connection_request':
            case 'request_accepted':
                navigate(role === 'alumni' ? '/alumni/requests' : '/home');
                break;
            case 'session_scheduled':
            case 'session_reminder':
            case 'session_cancelled':
                navigate(`/${role}/sessions`);
                break;
            case 'group_invite':
                // For group invites, we usually just stay or go to messages
                navigate(`/${role}/messages`);
                break;
            default:
                // Fallback for generic notifications or unknown types
                if (notification.message.toLowerCase().includes('message')) {
                    navigate(`/${role}/messages`);
                } else if (notification.message.toLowerCase().includes('request')) {
                    navigate(role === 'alumni' ? '/alumni/requests' : '/home');
                } else if (notification.message.toLowerCase().includes('session')) {
                    navigate(`/${role}/sessions`);
                }
                break;
        }

        setIsNotificationOpen(false); // Close sidebar after clicking
    };

    // Search logic with debounce
    useEffect(() => {
        const fetchResults = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }

            try {
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                if (!userInfo?.token) return;

                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
                    headers: { 'Authorization': `Bearer ${userInfo.token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setSearchResults(data);
                }
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setIsSearching(false);
            }
        };

        setIsSearching(true);
        const timer = setTimeout(() => {
            fetchResults();
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSearchClick = (userId) => {
        setShowSearchDropdown(false);
        setSearchQuery('');
        navigate(`/user/${userId}`);
    };

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
        setUser(null);
        setIsMobileMenuOpen(false);
        window.location.href = 'https://smartprep.live/login';
    };

    // Student Navigation Items
    const studentNavItems = [
        { name: "Home", icon: Home, href: "/home" },
        { name: "Dashboard", icon: LayoutDashboard, href: "/student/dashboard" },
        { name: "Mentors", icon: Search, href: "/student/mentors" },
        { name: "Sessions", icon: BookOpen, href: "/student/sessions" },
        { name: "Stories", icon: BookOpen, href: "/student/stories" },
        { name: "Messages", icon: MessageCircle, href: "/student/messages" }
    ];

    // Alumni Navigation Items
    const alumniNavItems = [
        { name: "Home", icon: Home, href: "/home" },
        { name: "Dashboard", icon: LayoutDashboard, href: "/alumni/dashboard" },
        { name: "Requests", icon: Users, href: "/alumni/requests" },
        { name: "Sessions", icon: BookOpen, href: "/alumni/sessions" },
        { name: "Messages", icon: MessageCircle, href: "/alumni/messages" },
    ];

    // Admin Navigation Items
    const adminNavItems = [
        { name: "Command Center", icon: ShieldAlert, href: "/admin/dashboard" },
        { name: "Global Events", icon: Calendar, href: "/admin/sessions" },
        { name: "Moderation", icon: ShieldCheck, href: "/admin/moderation" },
    ];

    const currentNavItems = user?.role === 'admin' ? adminNavItems : user?.role === 'alumni' ? alumniNavItems : studentNavItems;

    return (
        <header className="fixed top-0 w-full z-50 bg-[#1D2226] border-b border-gray-800">
            <div className="max-w-[1128px] mx-auto px-2 sm:px-4 lg:px-8">
                <div className="flex items-center h-[52px]">

                    {/* Logo and Search Container */}
                    <div className="flex items-center gap-2 md:gap-2 flex-grow max-w-[400px]">
                        {/* Logo */}
                        <div
                            onClick={() => navigate(user ? (user.role === 'admin' ? '/admin/dashboard' : '/home') : "/")}
                            className="flex items-center cursor-pointer flex-shrink-0 hover:bg-[#ffffff1a] p-1 rounded transition-colors"
                        >
                            <div className="w-8 h-8 bg-white rounded shadow-sm flex items-center justify-center overflow-hidden p-0.5">
                                <img src="/mmcoelogo.png" alt="MMCOE Logo" className="w-full h-full object-contain" />
                            </div>
                            <h1 className="text-[17px] font-bold text-white ml-2 hidden lg:block tracking-wide">MMCOE</h1>
                        </div>

                        {/* LinkedIn like Search Bar */}
                        <div ref={searchRef} className="hidden sm:flex relative flex-grow ml-2 max-w-[280px]">
                            <div className="flex w-full items-center bg-[#38434F] text-white px-3 py-1.5 rounded h-[34px] group focus-within:ring-2 focus-within:ring-white focus-within:bg-white focus-within:text-gray-900 transition-all duration-200">
                                <Search className="w-4 h-4 text-gray-300 group-focus-within:text-gray-600 mr-2 flex-shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Search"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setShowSearchDropdown(true);
                                    }}
                                    onFocus={() => setShowSearchDropdown(true)}
                                    className="bg-transparent border-none outline-none text-xs w-full placeholder-gray-300 group-focus-within:placeholder-gray-500 group-focus-within:text-gray-900"
                                />
                            </div>

                            {/* Search Results Dropdown */}
                            <AnimatePresence>
                                {showSearchDropdown && searchQuery.trim() && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-[42px] left-0 w-[400px] bg-white rounded-md shadow-xl border border-gray-200 overflow-hidden z-50 py-2"
                                    >
                                        {isSearching ? (
                                            <div className="px-4 py-3 pb-4 flex justify-center items-center">
                                                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        ) : searchResults.length > 0 ? (
                                            <>
                                                <div className="px-4 pb-2 pt-1">
                                                    {searchResults.map((resultUser) => (
                                                        <div
                                                            key={resultUser._id}
                                                            onClick={() => handleSearchClick(resultUser._id)}
                                                            className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer transition-colors"
                                                        >
                                                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                                                {resultUser.profilePhoto ? (
                                                                    <img src={resultUser.profilePhoto} alt={resultUser.name} className="w-full h-full object-cover aspect-square rounded-full" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                                                                        {resultUser.name ? resultUser.name.charAt(0).toUpperCase() : 'U'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 overflow-hidden">
                                                                <h4 className="text-sm font-bold text-gray-900 truncate flex items-center gap-1">
                                                                    {resultUser.name}
                                                                    <span className="text-[10px] text-gray-400 font-normal ml-1">• {resultUser.role === 'alumni' ? 'Alumni' : resultUser.role === 'student' ? 'Student' : 'Member'}</span>
                                                                </h4>
                                                                <p className="text-xs text-gray-500 truncate">{resultUser.headline || resultUser.role}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="border-t border-gray-100 mt-1">
                                                    <button className="w-full text-center py-3 text-sm font-bold text-indigo-600 hover:bg-gray-50">
                                                        See all results
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="px-4 py-6 text-center text-sm text-gray-500">
                                                No results found for "{searchQuery}"
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Spacer */}
                    <div className="flex-grow"></div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center h-[52px] space-x-1 lg:space-x-4 pr-4">
                        {currentNavItems.map((item, index) => {
                            const isActive = location.pathname.includes(item.href) || (location.pathname === '/' && item.name === 'Home');
                            return (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    className={`flex flex-col items-center justify-center h-full px-2 min-w-[70px] border-b-2 transition-all duration-200 group relative ${isActive ? 'border-white text-white' : 'border-transparent text-[#C7D1D8] hover:text-white'}`}
                                >
                                    <item.icon className={`w-5 h-5 mb-[2px] mt-1 ${isActive ? 'text-white' : 'text-[#C7D1D8] group-hover:text-white'}`} />
                                    <span className="text-[12px] whitespace-nowrap leading-tight hidden lg:block">{item.name}</span>
                                    {isActive && <div className="absolute bottom-[-2px] left-0 w-full h-[2px] bg-white rounded-t-sm" />}
                                </a>
                            )
                        })}

                        {/* Professional Notification Hub (Desktop) */}
                        {user && user.role !== 'admin' && (
                            <button
                                onClick={() => setIsNotificationOpen(true)}
                                className="flex flex-col items-center justify-center h-full px-2 min-w-[70px] text-[#C7D1D8] hover:text-white transition-all duration-200 group relative"
                            >
                                <div className="relative">
                                    <Bell className="w-5 h-5 mb-[2px] mt-1 group-hover:scale-110 group-active:scale-95 transition-all text-[#C7D1D8] group-hover:text-white" />
                                    {notifications.some(n => !n.read) && (
                                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#1B2733] shadow-sm"></span>
                                    )}
                                </div>
                                <span className="text-[12px] font-medium leading-tight hidden lg:block">Notifications</span>
                            </button>
                        )}
                    </nav>

                    {/* Divider for LinkedIn look */}
                    <div className="hidden md:block w-[1px] h-9 bg-gray-700 mx-2 border-r border-[#ffffff1a]"></div>

                    {/* Right Section: Profile (desktop only) + Hamburger (mobile only) */}
                    <div className="flex items-center h-full">

                        {/* User Profile / Login Button — desktop only */}
                        {user ? (
                            <div className="relative h-full flex items-center hidden md:flex" ref={profileRef}>
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex flex-col items-center justify-center h-full px-2 min-w-[60px] text-[#C7D1D8] hover:text-white transition-colors group"
                                >
                                    <div className="w-6 h-6 rounded-full bg-gray-600 overflow-hidden mb-[2px] mt-[4px] flex flex-shrink-0 items-center justify-center text-xs font-bold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.2)] group-hover:shadow-[0_0_0_2px_rgba(255,255,255,0.4)] transition-all">
                                        {user.profilePhoto ? (
                                            <img src={user.profilePhoto} alt={user.name} className="w-full h-full aspect-square object-cover rounded-full" />
                                        ) : (
                                            user.name ? user.name.charAt(0).toUpperCase() : 'U'
                                        )}
                                    </div>
                                    <div className="flex items-center hidden lg:flex">
                                        <span className="text-[12px] leading-tight font-medium">Me</span>
                                        <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>

                                {/* Profile Dropdown */}
                                <AnimatePresence>
                                    {isProfileOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 5 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute top-[52px] right-0 w-64 bg-white rounded-l shadow-2xl border border-gray-200 overflow-hidden text-gray-900 rounded-b-md"
                                        >
                                            <div className="p-4 border-b border-gray-200 flex items-start gap-3 bg-gray-50">
                                                 <div className="w-14 h-14 rounded-full ring-2 ring-indigo-50 overflow-hidden bg-gray-300 flex-shrink-0 flex items-center justify-center font-bold text-xl text-white shadow-sm">
                                                    {user.profilePhoto ? (
                                                        <img src={user.profilePhoto} alt={user.name} className="w-full h-full aspect-square object-cover rounded-full" />
                                                    ) : (
                                                        user.name ? user.name.charAt(0).toUpperCase() : 'U'
                                                    )}
                                                 </div>
                                                 <div>
                                                     <p className="font-semibold text-sm leading-tight mt-1">{user.name || 'User'}</p>
                                                     <p className="text-xs text-gray-500 truncate max-w-[150px] mt-0.5">{user.email}</p>
                                                 </div>
                                            </div>
                                            <div className="p-2">
                                                <button
                                                    onClick={() => {
                                                        navigate(user.role === 'student' ? '/student/profile' : '/alumni/profile');
                                                        setIsProfileOpen(false);
                                                    }}
                                                    className="w-full text-center px-3 py-1.5 text-sm text-[#0A66C2] border border-[#0A66C2] rounded-full hover:bg-blue-50 hover:border-blue-700 font-semibold mb-1 transition-colors"
                                                >
                                                    View Profile
                                                </button>
                                            </div>
                                            <div className="border-t border-gray-200 p-2">
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:underline font-medium"
                                                >
                                                    Sign Out
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="hidden sm:flex flex-col justify-center items-center h-full px-2">
                                <div className="flex items-center space-x-2">
                                     <button
                                         onClick={() => window.location.href = 'https://smartprep.live/login'}
                                         className="text-[#C7D1D8] hover:bg-[#ffffff1a] hover:text-white px-3 py-1.5 rounded font-semibold text-sm transition-colors"
                                     >
                                         Sign in
                                     </button>
                                     <button
                                         onClick={() => navigate("/signup")}
                                         className="text-[#0A66C2] bg-transparent border-[1.5px] border-[#0A66C2] hover:bg-[#0A66C2] hover:bg-opacity-10 px-4 py-1.5 rounded-full font-semibold text-sm transition-colors"
                                     >
                                         Join now
                                     </button>
                                </div>
                            </div>
                        )}

                        {/* Hamburger Toggle — mobile only */}
                        <button
                            className="md:hidden ml-2 p-1 text-gray-300 hover:text-white transition-colors duration-200"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle mobile menu"
                        >
                             {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden overflow-hidden bg-[#1D2226] border-t border-gray-800 shadow-xl"
                    >
                        <div className="px-4 py-4 space-y-1">
                            {/* Mobile Nav Links */}
                            {currentNavItems.map((item, index) => {
                                const isActive = location.pathname.includes(item.href) || (location.pathname === '/' && item.name === 'Home');
                                return (<a
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-all duration-200 ${isActive ? 'bg-[#ffffff1a] text-white font-semibold' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
                                >
                                    <item.icon className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-base">{item.name}</span>
                                </a>)
                            })}

                            <div className="border-t border-gray-800 my-2"></div>

                            {user ? (
                                <>
                                    <div className="flex items-center space-x-3 px-4 py-3">
                                         <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden flex-shrink-0 shadow-sm border border-gray-700">
                                            {user.profilePhoto ? (
                                                <img src={user.profilePhoto} alt={user.name} className="w-full h-full aspect-square object-cover rounded-full" />
                                            ) : (
                                                user.name ? user.name.charAt(0).toUpperCase() : 'U'
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">{user.name || 'User'}</p>
                                            <p className="text-xs text-gray-400 truncate max-w-[200px]">{user.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigate(user.role === 'student' ? '/student/profile' : '/alumni/profile');
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="flex items-center space-x-3 w-full px-4 py-3 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-200"
                                    >
                                        <User className="w-5 h-5 flex-shrink-0" />
                                        <span className="font-medium text-base">Profile</span>
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center space-x-3 w-full px-4 py-3 rounded-md text-red-400 hover:text-red-300 hover:bg-gray-800 transition-all duration-200"
                                    >
                                        <LogOut className="w-5 h-5 flex-shrink-0" />
                                        <span className="font-medium text-base">Sign Out</span>
                                    </button>
                                </>
                            ) : (
                                <div className="space-y-4 pt-4 pb-2 flex flex-col px-4">
                                    <button
                                        onClick={() => { window.location.href = 'https://smartprep.live/login'; setIsMobileMenuOpen(false); }}
                                        className="w-full text-center py-2.5 rounded-full border border-white text-white font-semibold transition-colors"
                                    >
                                        Sign in
                                    </button>
                                    <button
                                        onClick={() => { navigate("/signup"); setIsMobileMenuOpen(false); }}
                                        className="w-full text-center py-2.5 rounded-full bg-[#0A66C2] text-white font-semibold transition-colors hover:bg-blue-700"
                                    >
                                        Join now
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Premium Global Notification Sidebar */}
            <NotificationSidebar
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                notifications={notifications}
                onMarkAsRead={markAsRead}
                onAcceptInvite={handleAcceptInvite}
                onDeclineInvite={handleDeclineInvite}
                onAcceptConnection={handleAcceptConnection}
                onDeclineConnection={handleDeclineConnection}
                onNotificationClick={handleNotificationClick}
            />

            {/* Toast Notifications */}
            <Toast toasts={toasts} onRemove={removeToast} />
        </header>
    );
}