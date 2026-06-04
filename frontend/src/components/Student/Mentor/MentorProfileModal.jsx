import React from 'react';
import { X, Mail, Linkedin, MapPin, GraduationCap, Award, Briefcase, CheckCircle2, Clock, Calendar, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function MentorProfileModal({ mentor, isConnected, isPending, onClose, onConnect, onMessage }) {
  const navigate = useNavigate();
  if (!mentor) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden z-10 w-full max-w-2xl relative max-h-[90vh] flex flex-col"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 scrollbar-hide">
            {/* Header Banner */}
            <div className="h-40 relative overflow-hidden flex-shrink-0">
              {mentor.bannerPhoto ? (
                <img src={mentor.bannerPhoto} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 relative">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                </div>
              )}
            </div>

            {/* Profile Body */}
            <div className="px-8 pb-8 relative pt-0">
              {/* Avatar and Name */}
              <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16 mb-8">
                <div className="flex-shrink-0 self-center md:self-start relative group">
                  <div className="w-32 h-32 rounded-full border-4 border-white bg-indigo-50 flex items-center justify-center text-5xl font-black text-indigo-600 shadow-xl overflow-hidden relative z-10 transition-transform duration-300 group-hover:scale-105">
                    {mentor.image ? (
                      <img src={mentor.image} alt={mentor.name} className="w-full h-full object-cover" />
                    ) : (
                      mentor.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left pb-1">
                  <h2 className="text-3xl font-black text-gray-900 flex items-center justify-center md:justify-start gap-2 mb-1">
                    {mentor.name}
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-100" />
                  </h2>
                  <p className="text-xl text-indigo-600 font-bold leading-tight">{mentor.headline || mentor.role}</p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 mt-2 text-sm text-gray-500 font-medium">
                    <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-indigo-400" /> {mentor.company || 'Alumni'}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-indigo-400" /> {mentor.location || 'Remote'}</span>
                  </div>
                </div>
              </div>

              {/* Actions Row */}
              <div className="flex flex-wrap gap-3 mb-8">
                <button
                  onClick={() => { navigate(`/user/${mentor.id}`); onClose(); }}
                  className="flex-1 min-w-[140px] px-6 py-3.5 bg-white text-indigo-600 border border-indigo-200 font-bold rounded-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Globe className="w-5 h-5" /> Visit Workspace
                </button>

                {isConnected ? (
                  <div className="flex flex-1 gap-2 min-w-[280px]">
                    <button
                      onClick={() => { onMessage(mentor); onClose(); }}
                      className="flex-1 px-4 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg border-0 hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Mail className="w-5 h-5" /> Message
                    </button>
                    <button
                      onClick={() => navigate(`/student/mentor/${mentor.id}`)}
                      className="flex-1 px-4 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold border-0 rounded-xl shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-5 h-5" /> Book Session
                    </button>
                  </div>
                ) : isPending ? (
                  <button
                    disabled
                    className="flex-1 min-w-[140px] px-6 py-3.5 bg-orange-50 text-orange-600 border border-orange-200 font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Clock className="w-5 h-5" /> Request Pending
                  </button>
                ) : (
                  <button
                    onClick={() => onConnect(mentor.id)}
                    className="flex-1 min-w-[140px] px-6 py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    Connect as Mentee
                  </button>
                )}

                {mentor.linkedin && (
                  <a href={mentor.linkedin.startsWith('http') ? mentor.linkedin : `https://${mentor.linkedin}`} target="_blank" rel="noopener noreferrer" className="px-6 py-3.5 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 min-w-[140px]">
                    <Linkedin className="w-5 h-5" /> LinkedIn
                  </a>
                )}
                
                {mentor.github && (
                  <a href={mentor.github.startsWith('http') ? mentor.github : `https://${mentor.github}`} target="_blank" rel="noopener noreferrer" className="px-6 py-3.5 bg-gray-100 text-gray-800 font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 min-w-[140px]">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg> GitHub
                  </a>
                )}
              </div>

              {/* Bio block */}
              {mentor.bio && mentor.bio !== 'No bio available.' && (
                <div className="bg-slate-50 p-6 rounded-2xl border border-gray-100 mb-6">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">About</h3>
                  <p className="text-gray-700 leading-relaxed font-medium text-[15px]">{mentor.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Education Block */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-gray-100 flex items-start gap-4">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-indigo-600">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Education</h3>
                    <p className="text-base font-bold text-gray-900">{mentor.education.branch}</p>
                    <p className="text-sm font-medium text-gray-500 mt-0.5">{mentor.education.batch}</p>
                  </div>
                </div>

                {/* Skills Block */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-gray-100 flex items-start gap-4">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-purple-600">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="w-full">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2.5">Key Skills</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {mentor.skills && mentor.skills.length > 0 ? (
                        mentor.skills.map((skill, index) => (
                          <span key={index} className="px-2.5 py-1 text-[11px] bg-white border border-gray-200 text-gray-700 font-bold rounded-lg shadow-sm whitespace-nowrap">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500 italic">No skills listed</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Experience Timeline */}
              {mentor.achievements && mentor.achievements.length > 0 && (
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Experience Timeline</h3>
                  <div className="space-y-4">
                    {mentor.achievements.map((achievement, index) => (
                      <div key={index} className="bg-white border border-gray-100 shadow-sm p-5 rounded-2xl flex gap-4 hover:shadow-md transition-shadow">
                        <div className="mt-1">
                          <div className="w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-indigo-50"></div>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-base">{achievement.title}</h4>
                          <p className="text-xs font-bold text-indigo-500 mt-0.5 mb-2">{achievement.year}</p>
                          <p className="text-sm text-gray-600 font-medium leading-relaxed">{achievement.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}