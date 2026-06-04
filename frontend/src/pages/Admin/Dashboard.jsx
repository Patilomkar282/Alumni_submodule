import React, { useState, useEffect } from 'react';
import { 
    Users, 
    Link as LinkIcon, 
    MessageSquare, 
    Video, 
    TrendingUp, 
    UserCheck, 
    UserPlus, 
    ArrowUpRight, 
    ArrowDownRight,
    RefreshCcw
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function AdminDashboard() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/analytics`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAnalytics(data);
            }
        } catch (error) {
            console.error("Analytics fetch error", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !analytics) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-bold animate-pulse">Gathering real-time insights...</p>
            </div>
        );
    }

    const { stats, dailyGrowth } = analytics;

    // Chart Data Configurations
    const lineChartData = {
        labels: dailyGrowth.map(d => new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' })),
        datasets: [
            {
                label: 'New Users',
                data: dailyGrowth.map(d => d.users),
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#4f46e5',
            },
            {
                label: 'Sessions',
                data: dailyGrowth.map(d => d.sessions),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#10b981',
            }
        ]
    };

    const doughnutData = {
        labels: ['Students', 'Alumni'],
        datasets: [{
            data: [stats.students, stats.alumni],
            backgroundColor: ['#4f46e5', '#f59e0b'],
            borderWidth: 0,
            hoverOffset: 10
        }]
    };

    const barData = {
        labels: ['Connections', 'Messages', 'Sessions'],
        datasets: [{
            label: 'Total Activity',
            data: [stats.totalConnections, stats.totalMessages, stats.totalSessions],
            backgroundColor: ['#818cf8', '#fbbf24', '#34d399'],
            borderRadius: 12,
        }]
    };

    const StatCard = ({ title, value, icon: Icon, color, trend }) => (
        <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col group transition-all"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`p-4 rounded-2xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">{title}</h3>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{value.toLocaleString()}</p>
        </motion.div>
    );

    return (
        <div className="p-4 sm:p-8 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <TrendingUp className="w-7 h-7 sm:w-10 sm:h-10 text-indigo-600" />
                            Platform Insights
                        </h1>
                        <p className="text-slate-500 font-medium mt-2">Real-time overview of MMCOE Alumni Connect performance.</p>
                    </div>
                    <button 
                        onClick={fetchAnalytics}
                        className="flex items-center gap-2 bg-white text-slate-600 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-sm border border-slate-100 hover:bg-slate-50 transition-all"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Refresh Data
                    </button>
                </div>

                {/* Metrics Grid - 2 col on mobile, 4 on lg */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10">
                    <StatCard title="Total Users" value={stats.totalUsers} icon={Users} color="bg-indigo-500" trend={12} />
                    <StatCard title="Connections" value={stats.totalConnections} icon={LinkIcon} color="bg-emerald-500" trend={8} />
                    <StatCard title="Messages Sent" value={stats.totalMessages} icon={MessageSquare} color="bg-amber-500" trend={24} />
                    <StatCard title="Sessions" value={stats.totalSessions} icon={Video} color="bg-rose-500" trend={-2} />
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                    
                    {/* Growth Chart */}
                    <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-slate-900">Activity Growth</h3>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                                    <span className="text-[10px] font-black uppercase text-slate-400">Users</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                    <span className="text-[10px] font-black uppercase text-slate-400">Sessions</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-[250px] sm:h-[350px]">
                            <Line 
                                data={lineChartData} 
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        y: { grid: { display: false }, border: { display: false } },
                                        x: { grid: { display: false }, border: { display: false } }
                                    }
                                }} 
                            />
                        </div>
                    </div>

                    {/* Distribution & Engagement */}
                    <div className="space-y-8">
                        {/* User Distribution */}
                        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col items-center">
                            <h3 className="text-xl font-black text-slate-900 mb-8 self-start">User Base</h3>
                            <div className="w-[200px] h-[200px] mb-8">
                                <Doughnut 
                                    data={doughnutData}
                                    options={{ cutout: '75%', plugins: { legend: { display: false } } }}
                                />
                            </div>
                            <div className="w-full space-y-4">
                                <div className="flex justify-between items-center text-sm font-bold">
                                    <span className="text-slate-400">Students</span>
                                    <span className="text-slate-900">{stats.students}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-bold">
                                    <span className="text-slate-400">Alumni</span>
                                    <span className="text-slate-900">{stats.alumni}</span>
                                </div>
                            </div>
                        </div>

                        {/* Engagement Overview */}
                        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                            <h3 className="text-xl font-black text-slate-900 mb-6">Engagement</h3>
                            <div className="h-[150px]">
                                <Bar 
                                    data={barData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false } },
                                        scales: {
                                            y: { display: false },
                                            x: { grid: { display: false }, border: { display: false } }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
