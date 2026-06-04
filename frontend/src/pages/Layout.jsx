import React, { useEffect, useState } from 'react'
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { Phone, PhoneOff, UserCheck } from 'lucide-react';
import ProfileCompletionModal from '../components/ProfileCompletionModal';

const Layout = () => {
  const { receivingCall, callAccepted, name, answerCall, declineCall, user } = useSocket();
  const navigate = useNavigate();
  const location = window.location;
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    // Check if user is logged in and profile is not complete
    // Only show modal if user exists, isProfileComplete is explicitly false, and they aren't on the profile page
    if (user && user.isProfileComplete === false && !location.pathname.includes('profile')) {
      setShowProfileModal(true);
    } else {
      setShowProfileModal(false);
    }
  }, [location.pathname, user?.isProfileComplete]);

  const handleAnswer = () => {
    // Navigate to messages page. The Messages component will handle the actual answering logic
    // because it needs to initialize the peer connection and video streams.
    const role = user?.role === 'alumni' ? 'alumni' : 'student';
    navigate(`/${role}/messages`);
  };

  const showNotification = receivingCall && !callAccepted && !location.pathname.includes('messages');

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow pt-[52px]">
        <Outlet />
      </main>

      {/* Global Incoming Call Notification */}
      {showNotification && (
        <div className="fixed top-24 left-4 right-4 sm:left-auto sm:right-10 sm:w-auto bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 z-[100]">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Phone className="w-8 h-8 text-indigo-600 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{name} is calling...</h3>
            <p className="text-sm text-gray-500 mb-4">Incoming Video Call</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleAnswer}
                className="px-6 py-2 bg-green-500 text-white rounded-full font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <Phone className="w-4 h-4" /> Answer
              </button>
              <button
                onClick={declineCall}
                className="px-6 py-2 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <PhoneOff className="w-4 h-4" /> Decline
              </button>
            </div>
          </div>
        </div>
      )}

      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        role={user?.role}
      />

      <Footer />
    </div>
  )
}

export default Layout
