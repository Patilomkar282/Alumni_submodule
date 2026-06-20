import React from 'react';
import { X, Bell, Check, User, MessageCircle, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationSidebar({
    isOpen,
    onClose,
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    onAcceptInvite,
    onDeclineInvite,
    onAcceptConnection,
    onDeclineConnection,
    onNotificationClick
}) {
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'new_message':
                return { icon: MessageCircle, bg: 'bg-green-100', color: 'text-green-600' };
            case 'connection_request':
                return { icon: User, bg: 'bg-blue-100', color: 'text-blue-600' };
            case 'group_invite':
                return { icon: User, bg: 'bg-purple-100', color: 'text-purple-600' };
            case 'connection_accepted':
                return { icon: CheckCircle2, bg: 'bg-emerald-100', color: 'text-emerald-600' };
            default:
                return { icon: Bell, bg: 'bg-indigo-100', color: 'text-indigo-600' };
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black z-[60]"
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-gradient-to-b from-white to-gray-50 shadow-2xl z-[70] flex flex-col"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                                    <Bell className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
                                    <p className="text-xs text-gray-500">
                                        {notifications.filter(n => !n.read).length} new
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {notifications.some(n => !n.read) && (
                                    <button
                                        onClick={onMarkAllAsRead}
                                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1.5 rounded-full"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            {notifications.length > 0 ? (
                                <div className="p-4 space-y-3">
                                    {notifications.map((notification) => {
                                        const { icon: IconComponent, bg, color } = getNotificationIcon(notification.type);
                                        const isActionPending = notification.actionStatus === 'pending' &&
                                            (notification.type === 'group_invite' || notification.type === 'connection_request');
                                        const isActionTaken = notification.actionStatus === 'accepted' || notification.actionStatus === 'rejected';

                                        return (
                                            <motion.div
                                                key={notification._id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                className={`rounded-xl border-2 overflow-hidden transition-all ${
                                                    notification.read
                                                        ? 'bg-white border-gray-100 hover:border-gray-200'
                                                        : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-md'
                                                }`}
                                            >
                                                {/* Top Section - Icon + Message */}
                                                <div className="p-4">
                                                    <div className="flex gap-3">
                                                        {/* Icon */}
                                                        <div className={`mt-0.5 p-2.5 rounded-lg flex-shrink-0 ${bg} ${color}`}>
                                                            <IconComponent className="w-4 h-4" />
                                                        </div>

                                                        {/* Message Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm leading-snug break-words ${
                                                                notification.read ? 'text-gray-600' : 'text-gray-900 font-semibold'
                                                            }`}>
                                                                {notification.message}
                                                            </p>
                                                            <p className="text-xs text-gray-400 mt-2">
                                                                {new Date(notification.createdAt).toLocaleTimeString([], {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Buttons Section */}
                                                {isActionPending && (
                                                    <div className="px-4 pb-4 flex gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (notification.type === 'group_invite') {
                                                                    onAcceptInvite(notification.relatedGroup, notification._id);
                                                                } else {
                                                                    onAcceptConnection(notification.relatedId, notification._id);
                                                                }
                                                            }}
                                                            className="flex-1 px-3 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                                                        >
                                                            ✓ Accept
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (notification.type === 'group_invite') {
                                                                    onDeclineInvite(notification.relatedGroup, notification._id);
                                                                } else {
                                                                    onDeclineConnection(notification.relatedId, notification._id);
                                                                }
                                                            }}
                                                            className="flex-1 px-3 py-2.5 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-300 transition-all duration-200 active:scale-95"
                                                        >
                                                            ✕ Reject
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Action Taken Indicator */}
                                                {isActionTaken && (
                                                    <div className={`px-4 pb-3 pt-0 flex items-center gap-2 text-xs font-medium ${
                                                        notification.actionStatus === 'accepted'
                                                            ? 'text-green-700'
                                                            : 'text-red-700'
                                                    }`}>
                                                        {notification.actionStatus === 'accepted' ? (
                                                            <>
                                                                <CheckCircle2 className="w-4 h-4" />
                                                                <span>Accepted</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle className="w-4 h-4" />
                                                                <span>Rejected</span>
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Mark as Read Button for Non-Action Notifications */}
                                                {!notification.read && !isActionPending && !isActionTaken && (
                                                    <div className="px-4 pb-3 pt-0">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onMarkAsRead(notification._id);
                                                            }}
                                                            className="w-full px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                                                        >
                                                            Mark as read
                                                        </button>
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
                                    <div className="p-4 bg-gray-100 rounded-full mb-4">
                                        <Bell className="w-8 h-8 opacity-40" />
                                    </div>
                                    <p className="text-sm font-medium">No notifications yet</p>
                                    <p className="text-xs mt-1">You're all caught up!</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
