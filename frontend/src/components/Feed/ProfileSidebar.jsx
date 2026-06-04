import React from 'react';
import { User, Bookmark, Calendar, FileText, MessageSquare, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfileSidebar = ({ user, activeFilter, onFilterChange }) => {
    const navigate = useNavigate();

    return (
        <div className="space-y-4">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
                {/* Cover Image */}
                <div className="h-20 relative overflow-hidden">
                    {user?.bannerPhoto ? (
                        <img src={user.bannerPhoto} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                    )}
                </div>

                {/* Profile Info */}
                <div className="px-5 pb-5 text-center relative">
                    <div className="relative -mt-10 mb-3 flex justify-center">
                        <div 
                            onClick={() => navigate(user?.role === 'student' ? '/student/profile' : '/alumni/profile')}
                            className="w-20 h-20 rounded-full bg-white p-1 shadow-md cursor-pointer hover:scale-110 transition-transform active:scale-95"
                        >
                            <div className="w-full h-full rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-2xl border border-gray-100 overflow-hidden">
                                {user?.profilePhoto ? (
                                    <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover aspect-square rounded-full" />
                                ) : (
                                    user?.name ? user.name.charAt(0).toUpperCase() : 'U'
                                )}
                            </div>
                        </div>
                    </div>

                    <h2 className="text-lg font-bold text-gray-900 hover:text-indigo-600 hover:underline cursor-pointer transition-colors" onClick={() => navigate(user?.role === 'student' ? '/student/profile' : '/alumni/profile')}>
                        {user?.name || 'User Name'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2 px-2 font-medium">
                        {user?.headline || (user?.role === 'student' ? 'Student at MMCOE' : 'Alumni')}
                    </p>
                    
                    {user?.location && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {user.location}
                        </p>
                    )}

                    <div className="mt-5 pt-4 border-t border-gray-100 text-left">
                        <div className="flex justify-between items-center py-2 hover:bg-gray-50 px-3 -mx-3 rounded-xl cursor-pointer transition-colors" onClick={() => navigate(user?.role === 'student' ? '/student/profile' : '/alumni/profile')}>
                            <span className="text-sm text-gray-600 font-medium">Total Connections</span>
                            <span className="text-sm text-indigo-600 font-bold">{user?.connections?.length || 0}</span>
                        </div>
                    </div>


                </div>
            </div>

            {/* Links Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden py-3">
                <div className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 cursor-pointer text-gray-600 hover:text-gray-900 transition-colors" onClick={() => navigate('/saved-posts')}>
                    <Bookmark className="w-5 h-5 fill-gray-500 text-gray-500 group-hover:fill-gray-700" />
                    <span className="text-sm font-semibold">Saved items</span>
                </div>
                <div
                    className={`flex items-center gap-3 px-5 py-2.5 cursor-pointer transition-colors ${activeFilter === 'post' ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600 pl-[16px]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'}`}
                    onClick={() => onFilterChange('post')}
                >
                    <MessageSquare className={`w-5 h-5 ${activeFilter === 'post' ? 'text-indigo-600' : 'text-gray-500'}`} />
                    <span className="text-sm font-semibold">Posts</span>
                </div>
                <div
                    className={`flex items-center gap-3 px-5 py-2.5 cursor-pointer transition-colors ${activeFilter === 'event' ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600 pl-[16px]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'}`}
                    onClick={() => onFilterChange('event')}
                >
                    <Calendar className={`w-5 h-5 ${activeFilter === 'event' ? 'text-indigo-600' : 'text-gray-500'}`} />
                    <span className="text-sm font-semibold">Events</span>
                </div>
                <div
                    className={`flex items-center gap-3 px-5 py-2.5 cursor-pointer transition-colors ${activeFilter === 'article' ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600 pl-[16px]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'}`}
                    onClick={() => onFilterChange('article')}
                >
                    <FileText className={`w-5 h-5 ${activeFilter === 'article' ? 'text-indigo-600' : 'text-gray-500'}`} />
                    <span className="text-sm font-semibold">Articles</span>
                </div>
            </div>
        </div>
    );
};

export default ProfileSidebar;
