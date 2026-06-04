import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Briefcase, MapPin, Clock } from 'lucide-react';

export default function MentorCard({ mentor, isConnected, isPending, onConnect, onViewProfile, onMessage, currentUserRole }) {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300 transform hover:-translate-y-1.5 overflow-hidden border border-gray-100 group flex flex-col h-full">
      {/* Cover Banner */}
      <div className="h-24 relative overflow-hidden">
        {mentor.bannerPhoto ? (
          <img src={mentor.bannerPhoto} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="px-6 pb-6 relative flex-grow flex flex-col">
        {/* Profile Image */}
        <div className="-mt-12 mb-3 flex justify-center cursor-pointer" onClick={() => navigate(`/user/${mentor.id}`)}>
          <div className="w-24 h-24 rounded-full bg-white p-1.5 shadow-lg group-hover:scale-105 transition-transform duration-300 relative z-10">
            {mentor.image ? (
              <img
                src={mentor.image}
                alt={mentor.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
                <span className="text-3xl font-black text-indigo-600">
                  {mentor.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Name & Role */}
        <div className="text-center mb-4 cursor-pointer" onClick={() => navigate(`/user/${mentor.id}`)}>
          <h3 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-1.5 line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {mentor.name}
            <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-100" />
          </h3>
          <p className="text-sm font-semibold text-indigo-600 mt-1 line-clamp-1">{mentor.role}</p>
          <div className="flex items-center justify-center gap-3 mt-2 text-xs text-gray-500 font-medium">
            <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 text-gray-400" /> <span className="line-clamp-1">{mentor.company || 'Alumni'}</span></span>
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400" /> <span className="line-clamp-1">{mentor.location || 'Remote'}</span></span>
          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 justify-center mb-6 flex-grow items-start content-start">
          {mentor.skills?.slice(0, 4).map((skill, index) => (
            <span
              key={index}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 text-indigo-700 uppercase tracking-wider border border-indigo-100/50"
            >
              {skill}
            </span>
          ))}
          {mentor.skills?.length > 4 && (
            <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-gray-50 text-gray-600 border border-gray-200">
              +{mentor.skills.length - 4}
            </span>
          )}
          {(!mentor.skills || mentor.skills.length === 0) && (
            <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-gray-50 text-gray-500 italic">No skills listed</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-auto pt-4 border-t border-gray-50">
          <button
            onClick={() => onViewProfile(mentor)}
            className="flex-1 px-4 py-2.5 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors duration-200 text-sm"
          >
            Profile
          </button>

          {isConnected ? (
            <button
              onClick={() => onMessage(mentor)}
              className="flex-1 px-4 py-2.5 font-bold rounded-xl transition-all duration-200 text-sm shadow-md bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-emerald-200"
            >
              Message
            </button>
          ) : isPending ? (
            <button
              disabled
              className="flex-1 px-4 py-2.5 font-bold rounded-xl text-sm shadow-sm bg-orange-50 text-orange-600 border border-orange-200 flex justify-center items-center gap-1.5 cursor-not-allowed"
            >
              <Clock className="w-4 h-4" />
              Requested
            </button>
          ) : (mentor.rawRole === 'student' && currentUserRole === 'student') ? (
            <div className="flex-1 flex flex-col gap-1.5">
              <button
                disabled
                className="w-full px-4 py-2.5 font-bold rounded-xl text-xs bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed uppercase tracking-wider"
              >
                Connect
              </button>
              <p className="text-[9px] text-gray-400 font-bold text-center uppercase tracking-tighter">Alumni Mentors Only</p>
            </div>
          ) : (
            <button
              onClick={() => onConnect(mentor.id)}
              className="flex-1 px-4 py-2.5 font-bold rounded-xl transition-all duration-200 text-sm shadow-md bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200"
            >
              Connect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}