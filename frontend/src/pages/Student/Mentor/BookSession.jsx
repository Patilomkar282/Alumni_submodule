import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../../components/Header';
import { Calendar, Clock, Video, FileText, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import LoadingScreen from '../../../components/LoadingScreen';

export default function BookSession() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [mentor, setMentor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingState, setBookingState] = useState('select_slot'); // select_slot | details | success
    
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [formData, setFormData] = useState({ title: '', agenda: '' });

    useEffect(() => {
        fetchMentor();
    }, [id]);

    const fetchMentor = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/alumni/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setMentor(await res.json());
            }
        } catch (error) {
            console.error("Failed to load mentor", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBooking = async (e) => {
        e.preventDefault();
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const payload = {
                hostId: mentor._id,
                title: formData.title,
                agenda: formData.agenda,
                date: selectedSlot.date,
                startTime: selectedSlot.startTime,
                endTime: selectedSlot.endTime
            };

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (res.ok) setBookingState('success');
            else alert("Booking failed, slot might be taken.");

        } catch (error) {
            console.error("Booking error", error);
        }
    };

    if (loading) return <LoadingScreen />;
    if (!mentor) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-red-500 text-xl">Mentor Not Found</div>;

    const availableSlots = mentor.availabilitySlots?.filter(slot => !slot.isBooked) || [];

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-12 font-sans px-4 sm:px-6 lg:px-8">
            <Header />
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate('/student/mentors')} className="flex items-center gap-2 text-indigo-600 font-bold mb-6 hover:text-indigo-800 transition-colors">
                    <ArrowLeft className="w-5 h-5" /> Back to Mentors
                </button>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
                    {/* Mentor Profile Side */}
                    <div className="md:w-1/3 bg-gradient-to-br from-indigo-50 to-purple-50 p-8 flex flex-col items-center justify-center border-r border-indigo-100/50">
                        {mentor.profilePhoto ? (
                            <img src={mentor.profilePhoto} alt="Mentor" className="w-32 h-32 rounded-3xl object-cover shadow-lg shadow-indigo-200 mb-6 border-4 border-white" />
                        ) : (
                            <div className="w-32 h-32 border-4 border-white bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-white font-black text-5xl shadow-lg shadow-indigo-200 mb-6">
                                {mentor.name?.charAt(0) || 'M'}
                            </div>
                        )}
                        <h2 className="text-2xl font-black text-gray-900 text-center leading-tight mb-2">{mentor.name}</h2>
                        <p className="text-sm font-bold text-indigo-600 text-center bg-indigo-100/50 px-4 py-1.5 rounded-full mb-4">
                            {mentor.currentPosition} @ {mentor.company}
                        </p>
                        
                        <div className="w-full space-y-3 mt-4">
                            <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 bg-white p-3 rounded-xl shadow-sm">
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                <div><span className="font-black text-gray-900">{mentor.rating || 'New'}</span> Rating</div>
                            </div>
                            <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 bg-white p-3 rounded-xl shadow-sm">
                                <Video className="w-5 h-5 text-emerald-500" />
                                <div><span className="font-black text-gray-900">{mentor.totalSessions || 0}</span> Sessions</div>
                            </div>
                        </div>
                    </div>

                    {/* Booking Flow Side */}
                    <div className="md:w-2/3 p-8 md:p-12 bg-white">
                        
                        {bookingState === 'select_slot' && (
                            <div className="animate-fadeIn">
                                <h3 className="text-2xl font-black text-gray-900 mb-2">Book a Session</h3>
                                <p className="text-gray-500 font-medium mb-8">Select an available time slot from their calendar.</p>
                                
                                {availableSlots.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-3xl border border-dashed border-gray-300">
                                        <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
                                        <h4 className="text-lg font-bold text-gray-800">No Slots Available</h4>
                                        <p className="text-gray-500 mt-1 font-medium text-center">This mentor hasn't opened any schedule slots currently.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {availableSlots.map((slot, i) => (
                                            <button 
                                                key={i} 
                                                onClick={() => { setSelectedSlot(slot); setBookingState('details'); }}
                                                className="group text-left p-5 rounded-3xl border-2 border-gray-100 hover:border-indigo-500 bg-white flex flex-col gap-2 transition-all hover:shadow-lg hover:shadow-indigo-100"
                                            >
                                                <div className="flex items-center gap-2 text-indigo-600 font-bold">
                                                    <Calendar className="w-5 h-5" /> {new Date(slot.date).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600 font-semibold text-sm">
                                                    <Clock className="w-4 h-4 group-hover:text-indigo-500" /> {slot.startTime} - {slot.endTime}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {bookingState === 'details' && (
                            <div className="animate-fadeIn">
                                <h3 className="text-2xl font-black text-gray-900 mb-2">Session Details</h3>
                                <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 p-3 rounded-xl mb-6">
                                    <Calendar className="w-4 h-4" /> {new Date(selectedSlot.date).toDateString()} at {selectedSlot.startTime}
                                </div>
                                <form onSubmit={handleBooking} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Session Title</label>
                                        <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Resume Review & Mock Interview" className="w-full bg-slate-50 border border-gray-200 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-900" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Agenda / Questions</label>
                                        <textarea required rows="4" value={formData.agenda} onChange={e => setFormData({...formData, agenda: e.target.value})} placeholder="What do you want to discuss?" className="w-full bg-slate-50 border border-gray-200 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-900"></textarea>
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button type="button" onClick={() => setBookingState('select_slot')} className="w-1/3 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Back</button>
                                        <button type="submit" className="w-2/3 py-3.5 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02]">Confirm Booking</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {bookingState === 'success' && (
                            <div className="animate-scaleIn flex flex-col items-center justify-center py-10 text-center">
                                <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-emerald-50">
                                    <CheckCircle className="w-10 h-10" />
                                </div>
                                <h3 className="text-3xl font-black text-gray-900 mb-3">Booking Confirmed!</h3>
                                <p className="text-gray-500 font-medium mb-8 max-w-sm">Your mentorship session has been scheduled successfully. You can find the Google Meet link in your sessions dashboard.</p>
                                <button onClick={() => navigate('/student/sessions')} className="py-3.5 px-8 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg hover:-translate-y-1">
                                    Go to My Sessions
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}

// Dummy Star import since Lucide doesn't export it globally by default sometimes, 
// wait actually it is imported as Star from lucide-react, I will manually add it right here just for safe measure!
function Star({ className }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
}
