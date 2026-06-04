import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { Calendar, Clock, Video, CheckCircle, Search, Target, Users, MapPin, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingScreen from '../../components/LoadingScreen';

export default function GlobalEvents() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        setUser(userInfo);
        fetchEvents(userInfo?.token);
    }, []);

    const fetchEvents = async (token) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/global`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setEvents(await res.json());
        } catch (error) {
            console.error("Events load failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (eventId) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/${eventId}/register`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (res.ok) {
                alert("Successfully registered!");
                fetchEvents(user.token);
            } else {
                const data = await res.json();
                alert(data.message || "Registration failed");
            }
        } catch (error) {
            console.error("Registration error", error);
        }
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-12 font-sans px-4 sm:px-6 lg:px-8 text-slate-900">
            <Header />
            <div className="max-w-7xl mx-auto space-y-12">
                
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">
                            Global Learning Events
                        </h1>
                        <p className="text-xl text-slate-500 font-medium">
                            Join exclusive webinars, workshops, and career talks scheduled by college administration.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {events.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                            <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold text-xl">No upcoming events found.</p>
                            <p className="text-slate-400 font-medium mt-1">Check back later for new workshops!</p>
                        </div>
                    ) : (
                        events.map((event, index) => {
                            const isRegistered = event.registeredStudents?.includes(user?._id);
                            return (
                                <motion.div 
                                    key={event._id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-xl hover:shadow-indigo-500/10 transition-all group"
                                >
                                    {/* Event Header */}
                                    <div className="relative h-48 bg-gradient-to-br from-indigo-500 to-purple-600 p-8 flex flex-col justify-end">
                                        <div className="absolute top-6 right-6 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-xl text-white text-[10px] font-black uppercase tracking-widest border border-white/20">
                                            {event.startTime}
                                        </div>
                                        <h3 className="text-2xl font-black text-white leading-tight line-clamp-2">{event.title}</h3>
                                    </div>

                                    {/* Event Body */}
                                    <div className="p-8 flex-1 flex flex-col">
                                        <p className="text-slate-500 font-medium text-sm line-clamp-3 mb-6">
                                            {event.description}
                                        </p>

                                        <div className="space-y-4 mb-8">
                                            <div className="flex items-center gap-3 text-slate-600">
                                                <Calendar className="w-5 h-5 text-indigo-500" />
                                                <span className="text-sm font-bold">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-600">
                                                <Users className="w-5 h-5 text-indigo-500" />
                                                <span className="text-sm font-bold">{event.registeredStudents?.length || 0} Registered Attendees</span>
                                            </div>
                                        </div>

                                        {/* Host Info */}
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-8">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Keynote Speaker</p>
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm">
                                                    {event.host?.profilePhoto ? (
                                                        <img src={event.host.profilePhoto} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center font-black text-indigo-600 bg-indigo-50">
                                                            {event.host?.name?.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 leading-none">{event.host?.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-500 mt-1 flex items-center gap-1">
                                                        <Briefcase className="w-3 h-3" /> {event.host?.currentPosition} at {event.host?.company}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {isRegistered || event.host?._id === user?._id ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100 mb-2">
                                                    <span className="text-[10px] font-black text-emerald-700 uppercase">You're participating</span>
                                                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                                                </div>
                                                <a 
                                                    href={event.meetLink} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 text-center flex items-center justify-center gap-2"
                                                >
                                                    <Video className="w-5 h-5" /> Join Meeting
                                                </a>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => handleRegister(event._id)}
                                                className="w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-95"
                                            >
                                                Register for Event
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })
                    )}
                </div>

            </div>
        </div>
    );
}
