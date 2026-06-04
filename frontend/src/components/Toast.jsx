import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MessageCircle, User, CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Toast({ toasts, onRemove }) {
    const getToastIcon = (type) => {
        switch (type) {
            case 'new_message':
                return { icon: MessageCircle, bg: 'bg-green-100', color: 'text-green-600' };
            case 'connection_request':
                return { icon: User, bg: 'bg-blue-100', color: 'text-blue-600' };
            case 'group_invite':
                return { icon: User, bg: 'bg-purple-100', color: 'text-purple-600' };
            case 'connection_accepted':
                return { icon: CheckCircle2, bg: 'bg-emerald-100', color: 'text-emerald-600' };
            case 'success':
                return { icon: CheckCircle2, bg: 'bg-green-100', color: 'text-green-600' };
            case 'error':
                return { icon: AlertCircle, bg: 'bg-red-100', color: 'text-red-600' };
            default:
                return { icon: Bell, bg: 'bg-indigo-100', color: 'text-indigo-600' };
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed top-6 right-6 z-[80] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => {
                    const { icon: IconComponent, bg, color } = getToastIcon(toast.type);

                    return (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: -20, x: 20 }}
                            animate={{ opacity: 1, y: 0, x: 0 }}
                            exit={{ opacity: 0, y: -20, x: 20 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden pointer-events-auto max-w-sm"
                        >
                            {/* Progress Bar */}
                            <motion.div
                                initial={{ scaleX: 1 }}
                                animate={{ scaleX: 0 }}
                                transition={{ duration: toast.duration / 1000, ease: 'linear' }}
                                className={`h-1 origin-left ${
                                    toast.type === 'error' ? 'bg-red-500' :
                                    toast.type === 'success' ? 'bg-green-500' :
                                    'bg-indigo-500'
                                }`}
                                onAnimationComplete={() => onRemove(toast.id)}
                            />

                            {/* Content */}
                            <div className="p-4 flex gap-3 items-start">
                                {/* Icon */}
                                <div className={`mt-0.5 p-2 rounded-lg flex-shrink-0 ${bg} ${color}`}>
                                    <IconComponent className="w-5 h-5" />
                                </div>

                                {/* Message */}
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-900">
                                        {toast.title}
                                    </p>
                                    {toast.message && (
                                        <p className="text-xs text-gray-600 mt-1">
                                            {toast.message}
                                        </p>
                                    )}
                                </div>

                                {/* Close Button */}
                                <button
                                    onClick={() => onRemove(toast.id)}
                                    className="mt-0.5 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </AnimatePresence>
    );
}
