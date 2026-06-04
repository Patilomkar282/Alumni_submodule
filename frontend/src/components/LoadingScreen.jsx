import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function LoadingScreen() {
    return (
        <div className="min-h-screen z-50 flex flex-col items-center justify-center bg-gray-50 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="flex flex-col items-center gap-6"
            >
                {/* Logo or Custom Animated Ring */}
                <div className="relative flex items-center justify-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-t-2 border-indigo-600 border-opacity-50 w-20 h-20"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-b-2 border-purple-600 border-opacity-50 w-20 h-20 scale-110"
                    />
                    <div className="bg-white p-4 rounded-full shadow-xl shadow-indigo-100 z-10 w-20 h-20 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                </div>

                {/* Loading Text */}
                <div className="text-center space-y-2">
                    <motion.h3 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl font-bold text-gray-900 tracking-tight"
                    >
                        Loading your workspace
                    </motion.h3>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-sm font-medium text-gray-500 animate-pulse"
                    >
                        Please wait a moment...
                    </motion.p>
                </div>
            </motion.div>
        </div>
    );
}
