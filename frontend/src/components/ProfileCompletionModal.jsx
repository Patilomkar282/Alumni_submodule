import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfileCompletionModal = ({ isOpen, onClose, role }) => {
    const navigate = useNavigate();

    const handleCompleteProfile = () => {
        onClose();
        const profilePath = role === 'alumni' ? '/alumni/profile' : '/student/profile';
        navigate(profilePath);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
                    >
                        <div className="relative h-32 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
                            <div className="absolute -bottom-10 w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                                <UserCheck className="w-10 h-10 text-indigo-600" />
                            </div>
                        </div>

                        <div className="pt-14 pb-8 px-8 text-center">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
                            <p className="text-gray-600 mb-6">
                                Welcome to the MMCOE Alumni Connect! Please complete your profile to unlock all features and start connecting with others.
                            </p>

                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-8 flex items-start gap-3 text-left">
                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-800">
                                    You need to fill in your basic details (Company & Position for Alumni, or Branch & Year for Students) before you can make other changes.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleCompleteProfile}
                                    className="w-full bg-indigo-600 text-white py-3.5 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                                >
                                    Complete Profile Now
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ProfileCompletionModal;
