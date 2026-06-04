import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck, Clock, CheckCircle, XCircle, Eye, X, ExternalLink,
    Linkedin, Briefcase, GraduationCap, FileText, User, BadgeCheck,
    Filter, RotateCcw
} from 'lucide-react';
import LoadingScreen from '../../components/LoadingScreen';

const API = import.meta.env.VITE_API_URL;

const STATUS_STYLES = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', label: 'Pending' },
    verified: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Verified' },
    rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500', label: 'Rejected' },
};

export default function VerificationQueue() {
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState({ pending: 0, verified: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('pending');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [reviewing, setReviewing] = useState(false);
    const [actionError, setActionError] = useState('');

    const token = JSON.parse(localStorage.getItem('userInfo'))?.token;

    useEffect(() => {
        fetchStats();
        fetchRequests();
    }, [filterStatus]);

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API}/api/verification/admin/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setStats(await res.json());
        } catch (err) {
            console.error(err);
        }
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/verification/admin/queue?status=${filterStatus}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setRequests(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (status) => {
        if (status === 'rejected' && !adminNotes.trim()) {
            setActionError('Please provide a reason for rejection.');
            return;
        }
        setReviewing(true);
        setActionError('');
        try {
            const res = await fetch(`${API}/api/verification/admin/${selectedRequest._id}/review`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status, adminNotes })
            });
            if (res.ok) {
                setSelectedRequest(null);
                setAdminNotes('');
                fetchStats();
                fetchRequests();
            } else {
                const d = await res.json();
                setActionError(d.message || 'Action failed.');
            }
        } catch (err) {
            setActionError('Failed to connect to server.');
        } finally {
            setReviewing(false);
        }
    };

    const openModal = (req) => {
        setSelectedRequest(req);
        setAdminNotes(req.adminNotes || '');
        setActionError('');
    };

    if (loading && requests.length === 0) return <LoadingScreen />;

    return (
        <div className="p-4 sm:p-8 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <BadgeCheck className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600" />
                            Verification Queue
                        </h1>
                        <p className="text-slate-500 font-medium mt-2">Review alumni verification requests and award Verified Mentor Badges.</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { key: 'pending', icon: Clock, label: 'Pending Review', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                        { key: 'verified', icon: CheckCircle, label: 'Verified', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                        { key: 'rejected', icon: XCircle, label: 'Rejected', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
                    ].map(({ key, icon: Icon, label, color, bg, border }) => (
                        <button
                            key={key}
                            onClick={() => setFilterStatus(key)}
                            className={`${bg} border ${border} rounded-2xl p-5 text-left transition-all hover:shadow-md ${filterStatus === key ? 'ring-2 ring-indigo-400 shadow-md' : ''}`}
                        >
                            <Icon className={`w-6 h-6 ${color} mb-3`} />
                            <p className="text-2xl font-black text-slate-900">{stats[key]}</p>
                            <p className={`text-xs font-bold ${color} mt-1`}>{label}</p>
                        </button>
                    ))}
                </div>

                {/* Filter Bar */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6 flex items-center gap-4">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-bold text-slate-500">Filter:</span>
                    {['pending', 'verified', 'rejected'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                                filterStatus === s
                                    ? 'bg-indigo-600 text-white shadow'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                    <button
                        onClick={fetchRequests}
                        className="ml-auto p-2 text-slate-400 hover:text-slateigo-600 hover:bg-slate-100 rounded-xl transition-all"
                        title="Refresh"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>

                {/* Request List */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-100 p-20 text-center">
                        <ShieldCheck className="w-14 h-14 text-slate-200 mx-auto mb-4" />
                        <p className="font-bold text-slate-400 uppercase tracking-widest text-sm">No {filterStatus} requests</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {requests.map((req) => {
                            const s = STATUS_STYLES[req.status];
                            return (
                                <motion.div
                                    key={req._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                        {/* Alumni Info */}
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 text-lg overflow-hidden flex-shrink-0">
                                                {req.alumni?.profilePhoto
                                                    ? <img src={req.alumni.profilePhoto} alt="" className="w-full h-full object-cover" />
                                                    : (req.alumni?.name?.charAt(0) || 'A')
                                                }
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-slate-900">{req.alumni?.name}</h3>
                                                    {req.alumni?.isVerified && (
                                                        <BadgeCheck className="w-4 h-4 text-emerald-500" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5">{req.alumni?.email}</p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    <span className="flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-medium">
                                                        <Briefcase className="w-3 h-3" />
                                                        {req.currentRole} @ {req.currentCompany}
                                                    </span>
                                                    {req.branch && (
                                                        <span className="flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-medium">
                                                            <GraduationCap className="w-3 h-3" />
                                                            {req.branch} {req.graduationYear ? `· ${req.graduationYear}` : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status + Date + Action */}
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${s.bg} ${s.text} border ${s.border}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                                {s.label}
                                            </span>
                                            <span className="text-xs text-slate-400 hidden lg:block">
                                                {new Date(req.createdAt).toLocaleDateString('en-IN')}
                                            </span>
                                            <button
                                                onClick={() => openModal(req)}
                                                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                Review
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Review Modal */}
            <AnimatePresence>
                {selectedRequest && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.93 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.93 }}
                            className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl my-8"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-7 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                                        <ShieldCheck className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900">Verification Review</h2>
                                        <p className="text-sm text-slate-500 font-medium">{selectedRequest.alumni?.name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-7 space-y-6 max-h-[70vh] overflow-y-auto">
                                {/* Alumni Details */}
                                <div className="grid grid-cols-2 gap-4">
                                    <Detail icon={User} label="Name" value={selectedRequest.alumni?.name} />
                                    <Detail icon={Briefcase} label="Role" value={`${selectedRequest.currentRole} @ ${selectedRequest.currentCompany}`} />
                                    <Detail icon={GraduationCap} label="Branch / Year" value={`${selectedRequest.branch || '—'} · ${selectedRequest.graduationYear || '—'}`} />
                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">LinkedIn</p>
                                        <a
                                            href={selectedRequest.linkedinUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:underline truncate"
                                        >
                                            <Linkedin className="w-4 h-4 flex-shrink-0" />
                                            View Profile
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>

                                {/* Documents */}
                                {selectedRequest.documents?.length > 0 && (
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Submitted Documents</p>
                                        <div className="space-y-2">
                                            {selectedRequest.documents.map((doc, i) => (
                                                <a
                                                    key={i}
                                                    href={doc.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-between bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-xl p-4 transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="w-5 h-5 text-indigo-500" />
                                                        <span className="text-sm font-bold text-slate-700">{doc.label || `Document ${i + 1}`}</span>
                                                    </div>
                                                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Additional Notes from alumni */}
                                {selectedRequest.additionalNotes && (
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                        <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2">Alumni Notes</p>
                                        <p className="text-sm text-blue-800">{selectedRequest.additionalNotes}</p>
                                    </div>
                                )}

                                {/* Admin Notes Input */}
                                {selectedRequest.status === 'pending' && (
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                            Admin Notes <span className="text-red-400">(required for rejection)</span>
                                        </label>
                                        <textarea
                                            value={adminNotes}
                                            onChange={e => setAdminNotes(e.target.value)}
                                            placeholder="Add feedback for the alumni (especially if rejecting)..."
                                            rows={3}
                                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                        />
                                    </div>
                                )}

                                {/* Previous admin notes (read-only for reviewed) */}
                                {selectedRequest.status !== 'pending' && selectedRequest.adminNotes && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Admin Notes</p>
                                        <p className="text-sm text-slate-700">{selectedRequest.adminNotes}</p>
                                    </div>
                                )}

                                {actionError && (
                                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{actionError}</p>
                                )}

                                {/* Action Buttons — only for pending */}
                                {selectedRequest.status === 'pending' && (
                                    <div className="flex gap-4 pt-2">
                                        <button
                                            onClick={() => handleReview('rejected')}
                                            disabled={reviewing}
                                            className="flex-1 py-3.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleReview('verified')}
                                            disabled={reviewing}
                                            className="flex-1 py-3.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {reviewing ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <BadgeCheck className="w-4 h-4" />
                                            )}
                                            Verify & Award Badge
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Detail({ icon: Icon, label, value }) {
    return (
        <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-slate-400" />
                {value || '—'}
            </p>
        </div>
    );
}
