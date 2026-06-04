import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight, Users, Award, Target, CheckCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import mmcoe from '../assets/mmcoe.webp';

export default function SignIn() {
    const [step, setStep] = useState('email');
    const [formData, setFormData] = useState({
        email: '',
        otp: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const navigate = useNavigate();

    React.useEffect(() => {
        let interval;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSendOTP = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email }),
            });
            const data = await response.json();
            if (response.ok) {
                setStep('otp');
                setResendTimer(60);
            } else {
                setError(data.message || 'Failed to send OTP');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-login-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, otp: formData.otp }),
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('userInfo', JSON.stringify(data));
                if (data.isAdmin || data.role === 'admin') {
                    navigate('/admin/dashboard');
                } else if (data.role === 'student') {
                    navigate('/home');
                } else {
                    navigate('/home');
                }
            } else {
                setError(data.message || 'Invalid or expired OTP');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen lg:h-screen flex flex-col lg:flex-row lg:overflow-hidden">
            {/* Left Side - Image & Branding */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 relative overflow-hidden"
            >
                {/* Overlay with gradient */}
                <div className="absolute inset-0 bg-black/20 z-10" />

                {/* Background Image */}
                <img
                    src={mmcoe}
                    alt="Professional Networking"
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                />

                {/* Content Overlay */}
                <div className="relative z-20 flex flex-col justify-center px-16 text-white">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                    >
                        <div className="mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
                                <Award className="w-9 h-9 text-white" />
                            </div>
                            <h1 className="text-xl font-bold mb-4">Marathwada Mitra College of Engineering karvenagar, Pune</h1>
                        </div>
                        <h1 className="text-4xl font-bold mb-4 leading-tight">
                            Your Gateway to<br />Career Success
                        </h1>
                        <p className="text-lg text-blue-100 mb-8 leading-relaxed">
                            Connect with industry professionals, access exclusive opportunities,<br />
                            and accelerate your career growth.
                        </p>
                    </motion.div>

                    {/* Stats/Features */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="grid grid-cols-3 gap-4"
                    >
                        <div className="text-center">
                            <div className="text-4xl font-bold mb-2">10K+</div>
                            <div className="text-blue-200 text-sm">Alumni Members</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold mb-2">500+</div>
                            <div className="text-blue-200 text-sm">Companies</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold mb-2">95%</div>
                            <div className="text-blue-200 text-sm">Placement Rate</div>
                        </div>
                    </motion.div>

                    {/* Trust Indicators */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9, duration: 0.8 }}
                        className="mt-8 space-y-3"
                    >
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                            <span className="text-blue-100">Verified Alumni Network</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                            <span className="text-blue-100">Industry-Leading Mentorship</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                            <span className="text-blue-100">Exclusive Job Postings</span>
                        </div>
                    </motion.div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-20 right-20 w-72 h-72 bg-purple-500 rounded-full opacity-20 blur-3xl" />
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-400 rounded-full opacity-20 blur-3xl" />
            </motion.div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white p-4 lg:p-8 overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md"
                >
                    {/* Logo/Brand for mobile */}
                    <div className="lg:hidden mb-8 text-center">
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4"
                        >
                            <LogIn className="w-8 h-8 text-white" />
                        </motion.div>
                    </div>

                    {/* Header */}
                    <div className="mb-6">
                        <motion.h2
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-3xl font-bold text-gray-900 mb-1"
                        >
                            Welcome Back to MMCOE Connect
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-gray-600 text-base"
                        >
                            All-in-One Placement Solution
                        </motion.p>
                    </div>

                    {/* Form */}
                    <form onSubmit={step === 'email' ? handleSendOTP : handleVerifyOTP} className="space-y-4">
                        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                        {step === 'otp' && <div className="text-green-600 text-sm text-center font-medium bg-green-50 p-3 rounded-lg border border-green-200 shadow-sm">OTP sent to your email! Please check your inbox.</div>}

                        {/* Email Field */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:border-gray-400 disabled:bg-gray-100 disabled:text-gray-500"
                                    placeholder="you@example.com"
                                    required
                                    disabled={step === 'otp'}
                                />
                            </div>
                        </motion.div>

                        {/* OTP Field */}
                        {step === 'otp' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, y: 10 }}
                                animate={{ opacity: 1, height: 'auto', y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex items-center justify-between mb-2 mt-4">
                                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                                        Verification Code (OTP)
                                    </label>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-indigo-400" />
                                    </div>
                                    <input
                                        type="text"
                                        id="otp"
                                        name="otp"
                                        value={formData.otp}
                                        onChange={handleInputChange}
                                        maxLength="6"
                                        className="block w-full pl-12 pr-4 py-3 border-2 border-indigo-200 rounded-xl text-center tracking-[0.5em] text-gray-900 text-lg font-bold placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white shadow-md hover:border-indigo-300"
                                        placeholder="••••••"
                                        required
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Submit Button */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="pt-4"
                        >
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3.5 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading 
                                    ? (step === 'email' ? 'Sending Code...' : 'Verifying Identity...') 
                                    : (step === 'email' ? 'Send Login Code' : 'Verify & Login')
                                }
                                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </motion.div>

                        {step === 'otp' && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col gap-3 text-center mt-6"
                            >
                                {resendTimer > 0 ? (
                                    <p className="text-sm text-gray-500 font-medium">Resend OTP in {resendTimer}s</p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleSendOTP}
                                        disabled={loading}
                                        className="text-sm text-indigo-600 hover:text-indigo-800 font-bold transition-colors disabled:opacity-50"
                                    >
                                        Resend OTP
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => { setStep('email'); setFormData({...formData, otp: ''}); setError(''); setResendTimer(0); }}
                                    className="text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors"
                                >
                                    Wrong email? Go back
                                </button>
                            </motion.div>
                        )}
                    </form>


                    {/* Footer */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="mt-6 text-center"
                    >
                        <p className="text-gray-600">
                            Don't have an account?{' '}
                            <a href="/signup" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                                Sign Up
                            </a>
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}