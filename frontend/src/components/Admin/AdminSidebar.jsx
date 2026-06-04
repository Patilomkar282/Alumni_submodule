import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Calendar,
    ShieldCheck,
    LogOut,
    Home,
    ShieldAlert,
    Megaphone,
    TrendingUp,
    Shield,
    BadgeCheck
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function AdminSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    
    const user = JSON.parse(localStorage.getItem('userInfo'));
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const fetchPending = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/verification/admin/stats`, {
                    headers: { Authorization: `Bearer ${user?.token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setPendingCount(data.pending || 0);
                }
            } catch (_) {}
        };
        if (user?.token) fetchPending();
    }, []);

    const menuItems = [
        { name: "Dashboard", icon: TrendingUp, href: "/admin/dashboard" },
        { name: "Command Center", icon: Shield, href: "/admin/command-center" },
        { name: "Verification Queue", icon: BadgeCheck, href: "/admin/verification", badge: pendingCount },
        { name: "Global Events", icon: Calendar, href: "/admin/sessions" },
        { name: "Moderation", icon: ShieldCheck, href: "/admin/moderation" },
        { name: "Announcements", icon: Megaphone, href: "/admin/announcements" },
        { name: "Accreditation", icon: BadgeCheck, href: "/admin/reports" },
        { name: "Bulk Import", icon: TrendingUp, href: "/admin/import" },
        { name: "Success Stories", icon: TrendingUp, href: "/admin/stories" }, // Re-using TrendingUp or could import Upload
    ];

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        window.location.href = 'http://localhost:5174/login';
    };

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-50">
            {/* Logo Section */}
            <div className="p-6 border-b border-slate-800 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/admin/dashboard')}>
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-sm">
                    <img src="/mmcoelogo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-xl font-black text-white tracking-tight">MMCOE Admin</h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 mb-4">Core Management</p>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                        <button
                            key={item.name}
                            onClick={() => navigate(item.href)}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all duration-200 group ${
                                isActive
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`} />
                            <span className="text-sm flex-1 text-left">{item.name}</span>
                            {item.badge > 0 && (
                                <span className="min-w-[20px] h-5 px-1.5 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* User Profile Summary */}
            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-2xl mb-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-black text-white text-lg">
                        {user?.name?.charAt(0) || 'A'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-white truncate">{user?.name || 'System Admin'}</p>
                        <p className="text-[10px] font-bold text-slate-500 truncate leading-none mt-1">{user?.email}</p>
                    </div>
                </div>

                <button 
                    onClick={() => navigate('/home')}
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors mb-2 font-bold"
                >
                    <Home className="w-4 h-4" />
                    <span className="text-xs">Switch to Portal</span>
                </button>

                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-black"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="text-xs">Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
