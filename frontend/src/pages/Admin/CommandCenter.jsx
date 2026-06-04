import React, { useState, useEffect } from 'react';
import { 
    Users, 
    Search, 
    Shield, 
    Trash2, 
    Edit, 
    Filter, 
    MoreHorizontal, 
    X, 
    CheckCircle, 
    AlertCircle,
    Mail,
    Briefcase,
    GraduationCap,
    Clock,
    UserCheck,
    UserX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from '../../components/LoadingScreen';

export default function AdminCommandCenter() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    
    // Modal & Selection States
    const [selectedUser, setSelectedUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Fetch users error", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSuspend = async (userId) => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}/suspend`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) fetchUsers();
        } catch (error) {
            console.error("Suspend error", error);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) return;
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) fetchUsers();
        } catch (error) {
            console.error("Delete error", error);
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${selectedUser._id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify(selectedUser)
            });
            if (res.ok) {
                setShowEditModal(false);
                fetchUsers();
            }
        } catch (error) {
            console.error("Update error", error);
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="p-4 sm:p-8 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Shield className="w-7 h-7 sm:w-10 sm:h-10 text-indigo-600" />
                            Command Center
                        </h1>
                        <p className="text-slate-500 font-medium mt-2">Oversee account integrity and manage user profiles.</p>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-600 transition-colors" />
                        <input 
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                        />
                    </div>
                    <div className="flex gap-4">
                        <select 
                            value={filterRole}
                            onChange={e => setFilterRole(e.target.value)}
                            className="bg-slate-50 px-6 py-3.5 rounded-2xl border border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 font-bold appearance-none transition-all"
                        >
                            <option value="all">All Roles</option>
                            <option value="student">Students</option>
                            <option value="alumni">Alumni</option>
                        </select>
                    </div>
                </div>

                {/* Desktop Table - hidden on small screens */}
                <div className="hidden md:block bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">User Profile</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role & Education</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-8 py-20 text-center">
                                        <p className="font-bold text-slate-400 uppercase tracking-widest">No users found matching your criteria</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 text-lg shadow-inner overflow-hidden border border-white">
                                                    {user.profilePhoto ? <img src={user.profilePhoto} alt="" className="w-full h-full object-cover" /> : (user.name?.charAt(0) || 'U')}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 leading-tight">{user.name}</h3>
                                                    <p className="text-xs font-medium text-slate-400 mt-0.5">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                                        user.role === 'alumni' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                                                    }`}>
                                                        {user.role}
                                                    </span>
                                                    {user.isVerified && <UserCheck className="w-4 h-4 text-emerald-500" />}
                                                </div>
                                                <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 capitalize">
                                                    <GraduationCap className="w-3.5 h-3.5" />
                                                    {user.branch} {user.role === 'student' ? `• Year ${user.currentYear}` : ''}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                user.isSuspended 
                                                ? 'bg-red-50 text-red-600 shadow-sm' 
                                                : 'bg-emerald-50 text-emerald-600 shadow-sm'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${user.isSuspended ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse`} />
                                                {user.isSuspended ? 'Suspended' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => { setSelectedUser(user); setShowEditModal(true); }}
                                                    className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                    title="Edit User"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleToggleSuspend(user._id)}
                                                    className={`p-3 rounded-xl transition-all shadow-sm ${
                                                        user.isSuspended 
                                                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' 
                                                        : 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white'
                                                    }`}
                                                    title={user.isSuspended ? "Reactivate" : "Suspend"}
                                                >
                                                    {user.isSuspended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteUser(user._id)}
                                                    className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                                    title="Delete Permanently"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View - shown only on small screens */}
                <div className="md:hidden space-y-4">
                    {filteredUsers.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
                            <p className="font-bold text-slate-400 uppercase tracking-widest text-sm">No users found</p>
                        </div>
                    ) : (
                        filteredUsers.map((user) => (
                            <div key={user._id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 text-lg shadow-inner overflow-hidden border border-white flex-shrink-0">
                                        {user.profilePhoto ? <img src={user.profilePhoto} alt="" className="w-full h-full object-cover" /> : (user.name?.charAt(0) || 'U')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-900 leading-tight truncate">{user.name}</h3>
                                        <p className="text-xs font-medium text-slate-400 mt-0.5 truncate">{user.email}</p>
                                    </div>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex-shrink-0 ${
                                        user.isSuspended ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                                    }`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${user.isSuspended ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                        {user.isSuspended ? 'Suspended' : 'Active'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                        user.role === 'alumni' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                                    }`}>{user.role}</span>
                                    <span className="text-xs font-bold text-slate-500 capitalize">{user.branch}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => { setSelectedUser(user); setShowEditModal(true); }}
                                        className="flex-1 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-xs font-black uppercase tracking-wider"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleToggleSuspend(user._id)}
                                        className={`flex-1 py-2.5 rounded-xl transition-all text-xs font-black uppercase tracking-wider ${
                                            user.isSuspended 
                                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' 
                                            : 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white'
                                        }`}
                                    >
                                        {user.isSuspended ? 'Reactivate' : 'Suspend'}
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteUser(user._id)}
                                        className="flex-1 py-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all text-xs font-black uppercase tracking-wider"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Edit Modal */}
                <AnimatePresence>
                    {showEditModal && (
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl relative overflow-hidden"
                            >
                                <div className="p-10">
                                    <div className="flex items-center justify-between mb-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center shadow-inner">
                                                <Edit className="w-7 h-7 text-indigo-600" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-900">Manage Account</h2>
                                                <p className="text-slate-500 font-medium">Updating profile for <span className="text-indigo-600">{selectedUser.name}</span></p>
                                            </div>
                                        </div>
                                        <button onClick={() => setShowEditModal(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:bg-slate-100 transition-colors">
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleUpdateUser} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Full Name</label>
                                                <input 
                                                    type="text"
                                                    value={selectedUser.name}
                                                    onChange={e => setSelectedUser({...selectedUser, name: e.target.value})}
                                                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Email Address</label>
                                                <input 
                                                    type="email"
                                                    value={selectedUser.email}
                                                    onChange={e => setSelectedUser({...selectedUser, email: e.target.value})}
                                                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Branch</label>
                                                <input 
                                                    type="text"
                                                    value={selectedUser.branch}
                                                    onChange={e => setSelectedUser({...selectedUser, branch: e.target.value})}
                                                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Account Role</label>
                                                <select 
                                                    value={selectedUser.role}
                                                    onChange={e => setSelectedUser({...selectedUser, role: e.target.value})}
                                                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                                >
                                                    <option value="student">Student</option>
                                                    <option value="alumni">Alumni</option>
                                                </select>
                                            </div>
                                        </div>

                                        <button 
                                            type="submit" 
                                            disabled={isUpdating}
                                            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
                                        >
                                            {isUpdating ? 'Applying Changes...' : 'Save Profile Fixes'}
                                        </button>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
