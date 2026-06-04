import React, { useState, useEffect } from 'react';
import { Download, FileText, Users, Building2, Calendar, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingScreen from '../../components/LoadingScreen';

export default function AccreditationReports() {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/reports/accreditation`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setReportData(data);
                }
            } catch (error) {
                console.error("Fetch error", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, []);

    const handleExportCSV = () => {
        if (!reportData) return;

        // Create CSV content for Alumni
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Headers
        csvContent += "REPORT TYPE,Alumni Placements\r\n";
        csvContent += "Name,Email,Company,Branch,Graduation Year,Verified\r\n";
        
        reportData.alumni.forEach(alum => {
            const row = [
                `"${alum.name || ''}"`,
                `"${alum.email || ''}"`,
                `"${alum.company || 'N/A'}"`,
                `"${alum.branch || 'N/A'}"`,
                `"${alum.graduationYear || 'N/A'}"`,
                `"${alum.isVerified ? 'Yes' : 'No'}"`
            ].join(",");
            csvContent += row + "\r\n";
        });

        csvContent += "\r\nREPORT TYPE,Guest Lectures / Events\r\n";
        csvContent += "Title,Date,Host,Host Company\r\n";
        reportData.guestLectures.forEach(session => {
            const dateStr = new Date(session.date).toLocaleDateString();
            const row = [
                `"${session.title || ''}"`,
                `"${dateStr}"`,
                `"${session.host?.name || ''}"`,
                `"${session.host?.company || ''}"`
            ].join(",");
            csvContent += row + "\r\n";
        });

        // Trigger download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `MMCOE_Accreditation_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="p-8 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <FileText className="w-10 h-10 text-indigo-600" />
                            Accreditation Reports
                        </h1>
                        <p className="text-slate-500 font-medium mt-2">Generate and export NBA/NAAC compliance data.</p>
                    </div>
                    <button 
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all transform hover:scale-[1.02] active:scale-95"
                    >
                        <Download className="w-5 h-5" />
                        Export to CSV
                    </button>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {[
                        { label: 'Total Registered Alumni', value: reportData?.metrics?.totalAlumni || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Guest Lectures & Events', value: reportData?.metrics?.totalGuestLectures || 0, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'Mentorship Interactions', value: reportData?.metrics?.totalMentorshipSessions || 0, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Active Connections', value: reportData?.metrics?.activeConnections || 0, icon: Building2, color: 'text-amber-600', bg: 'bg-amber-50' },
                    ].map((stat, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between"
                        >
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                <p className="text-3xl font-black text-slate-900 mt-2">{stat.value}</p>
                            </div>
                            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Data Tables Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Alumni Placement Preview */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[500px]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-indigo-500" />
                                Top Placed Alumni
                            </h3>
                            <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                                {reportData?.alumni?.length} Total
                            </span>
                        </div>
                        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                            <div className="space-y-3">
                                {reportData?.alumni?.slice(0, 15).map(alum => (
                                    <div key={alum._id} className="p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors flex justify-between items-center bg-white">
                                        <div>
                                            <p className="font-bold text-slate-900">{alum.name}</p>
                                            <p className="text-xs text-slate-500 mt-1">{alum.branch} • {alum.graduationYear}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-indigo-600 text-sm">{alum.company || 'N/A'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Guest Lectures Preview */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[500px]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-purple-500" />
                                Guest Lectures
                            </h3>
                            <span className="text-xs font-bold bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                                {reportData?.guestLectures?.length} Total
                            </span>
                        </div>
                        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                            <div className="space-y-3">
                                {reportData?.guestLectures?.slice(0, 15).map(session => (
                                    <div key={session._id} className="p-4 rounded-2xl border border-slate-100 hover:border-purple-100 transition-colors flex justify-between items-center bg-white">
                                        <div>
                                            <p className="font-bold text-slate-900">{session.title}</p>
                                            <p className="text-xs text-slate-500 mt-1">Host: {session.host?.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-slate-600 text-xs bg-slate-100 px-3 py-1 rounded-full">
                                                {new Date(session.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
