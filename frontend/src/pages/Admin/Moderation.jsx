import React, { useState, useEffect } from 'react';
import { 
    ShieldAlert, 
    CheckCircle, 
    XCircle, 
    AlertTriangle, 
    Info, 
    Ban, 
    Trash2, 
    Mail, 
    Clock,
    Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from '../../components/LoadingScreen';

export default function AdminModeration() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('pending'); // pending, resolved, dismissed
    const [selectedReport, setSelectedReport] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/reports`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setReports(await res.json());
        } catch (error) {
            console.error("Failed to load reports", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (reportId, status, actionTaken) => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/reports/${reportId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ status, actionTaken, adminNotes })
            });

            if (res.ok) {
                // If user was suspended/deleted, we should probably trigger that separately too, 
                // but for now let's just update the report status.
                setSelectedReport(null);
                setAdminNotes('');
                fetchReports();
            }
        } catch (error) {
            console.error("Failed to resolve report", error);
        }
    };

    const filteredReports = reports.filter(r => r.status === filterStatus);

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-12 font-sans px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header Section */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-red-100 rounded-3xl flex items-center justify-center">
                            <ShieldAlert className="w-8 h-8 text-red-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Abuse & Safety Center</h1>
                            <p className="text-slate-500 font-medium">Review community reports and moderate user behavior.</p>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-white p-2 rounded-2xl shadow-sm border border-slate-100 w-fit">
                    {['pending', 'resolved', 'dismissed'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                                filterStatus === status 
                                ? 'bg-slate-900 text-white shadow-lg' 
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {status} ({reports.filter(r => r.status === status).length})
                        </button>
                    ))}
                </div>

                {/* Reports List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredReports.length === 0 ? (
                        <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-center">
                            <CheckCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold text-xl">Inbox Clean!</p>
                            <p className="text-slate-400 font-medium">{filterStatus === 'pending' ? 'No pending reports to review.' : 'No reports found in this category.'}</p>
                        </div>
                    ) : (
                        filteredReports.map((report, index) => (
                            <motion.div 
                                key={report._id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group flex flex-col"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{report.reason}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(report.createdAt).toLocaleString()}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl mb-6 border border-slate-100">
                                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm">
                                        {report.reportedUser?.profilePhoto ? (
                                            <img src={report.reportedUser.profilePhoto} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-black text-slate-400">{report.reportedUser?.name?.charAt(0)}</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Reported User</p>
                                        <p className="font-bold text-slate-900">{report.reportedUser?.name}</p>
                                        <p className="text-[10px] font-bold text-slate-500">{report.reportedUser?.email}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${report.reportedUser?.isSuspended ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                        {report.reportedUser?.isSuspended ? 'Suspended' : 'Live Account'}
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4 mb-8">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Reporter's Comments</p>
                                        <p className="text-sm font-medium text-slate-600 leading-relaxed p-4 bg-slate-50/50 rounded-2xl border border-slate-100 italic">
                                            "{report.description}"
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Info className="w-3.5 h-3.5 text-indigo-500" />
                                        <p className="text-[10px] font-bold text-slate-500">
                                            Reported by <span className="text-indigo-600">@{report.reporter?.name}</span> ({report.reporter?.role})
                                        </p>
                                    </div>
                                </div>

                                {report.status === 'pending' && (
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => setSelectedReport(report)}
                                            className="flex-1 py-3.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                                        >
                                            Take Action
                                        </button>
                                        <button 
                                            onClick={() => handleAction(report._id, 'dismissed', 'none')}
                                            className="px-6 py-3.5 bg-slate-100 text-slate-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                )}

                                {report.status !== 'pending' && (
                                    <div className="pt-4 border-t border-slate-100 mt-auto">
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <span>Action: {report.actionTaken}</span>
                                            <span className="text-indigo-600">{report.status}</span>
                                        </div>
                                        {report.adminNotes && (
                                            <p className="mt-2 text-[10px] font-bold text-slate-500 italic">Note: {report.adminNotes}</p>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        ))
                    )}
                </div>

            </div>

            {/* Action Modal */}
            <AnimatePresence>
                {selectedReport && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl relative"
                        >
                            <button onClick={() => setSelectedReport(null)} className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
                                <XCircle className="w-6 h-6" />
                            </button>

                            <h2 className="text-2xl font-black text-slate-900 mb-2">Resolve Report</h2>
                            <p className="text-slate-500 font-medium mb-8">Decide what happens to <span className="text-slate-900 font-bold">@{selectedReport.reportedUser?.name}</span></p>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Admin Private Notes</label>
                                    <textarea 
                                        rows="3"
                                        value={adminNotes}
                                        onChange={e => setAdminNotes(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm"
                                        placeholder="Reason for suspension or warning..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => handleAction(selectedReport._id, 'resolved', 'warned')}
                                        className="py-4 bg-amber-50 text-amber-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-100 transition-all"
                                    >
                                        Issue Warning
                                    </button>
                                    <button 
                                        onClick={() => handleAction(selectedReport._id, 'resolved', 'suspended')}
                                        className="py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Ban className="w-4 h-4" /> Suspend User
                                    </button>
                                    <button 
                                        onClick={() => handleAction(selectedReport._id, 'resolved', 'deleted')}
                                        className="py-4 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all col-span-2 flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" /> Permanent Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
