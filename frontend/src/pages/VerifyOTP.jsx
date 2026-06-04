import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export default function VerifyOTP() {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    useEffect(() => {
        if (!email) {
            navigate('/forgot-password');
        }
    }, [email, navigate]);

    const handleOtpChange = (e, index) => {
        const value = e.target.value;
        if (isNaN(value)) return;

        const newOtp = [...otp];
        // Only take the last character entered
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // Auto focus next input
        if (value && e.target.nextElementSibling) {
            e.target.nextElementSibling.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace') {
            if (!otp[index] && e.target.previousElementSibling) {
                e.target.previousElementSibling.focus();
            }
        } else if (e.key === 'ArrowLeft' && e.target.previousElementSibling) {
            e.target.previousElementSibling.focus();
        } else if (e.key === 'ArrowRight' && e.target.nextElementSibling) {
            e.target.nextElementSibling.focus();
        }
    };

    const handlePaste = (e) => {
        const data = e.clipboardData.getData('text').slice(0, 6);
        if (!/^\d+$/.test(data)) return;

        const newOtp = [...otp];
        data.split('').forEach((char, index) => {
            if (index < 6) newOtp[index] = char;
        });
        setOtp(newOtp);
        
        // Focus the last filled input or the next empty one
        const nextIndex = data.length < 6 ? data.length : 5;
        const inputs = document.querySelectorAll('input[name="otp"]');
        if (inputs[nextIndex]) inputs[nextIndex].focus();
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        const otpValue = otp.join('');
        if (otpValue.length < 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, otp: otpValue }),
            });

            const data = await response.json();

            if (response.ok) {
                navigate('/reset-password', { state: { email, otp: otpValue } });
            } else {
                setError(data.message || 'Invalid OTP. Please try again.');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResendLoading(true);
        setError('');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (response.ok) {
                alert('A new OTP has been sent to your email.');
            } else {
                setError(data.message || 'Error resending OTP');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setResendLoading(false);
        }
    };

    if (!email) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-sm"
            >
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 mb-6">
                        <Shield className="h-8 w-8 text-indigo-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Verify OTP</h2>
                    <p className="mt-3 text-sm text-gray-600 px-4">
                        We've sent a 6-digit verification code to <br />
                        <span className="font-semibold text-gray-900">{email}</span>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleVerify}>
                    {error && (
                        <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-between gap-2 sm:gap-4">
                        {otp.map((data, index) => (
                            <input
                                key={index}
                                type="text"
                                name="otp"
                                maxLength="1"
                                value={data}
                                onPaste={handlePaste}
                                onChange={e => handleOtpChange(e, index)}
                                onKeyDown={e => handleKeyDown(e, index)}
                                onFocus={e => e.target.select()}
                                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all bg-white text-gray-900"
                            />
                        ))}
                    </div>

                    <div className="text-center space-y-4">
                        <button
                            type="submit"
                            disabled={loading || otp.join('').length < 6}
                            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Verify OTP'}
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </button>
                        
                        <p className="text-sm text-gray-500">
                            Didn't receive the code?{' '}
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resendLoading}
                                className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors disabled:opacity-50"
                            >
                                {resendLoading ? 'Resending...' : 'Resend Code'}
                            </button>
                        </p>
                    </div>

                    <Link 
                        to="/forgot-password" 
                        className="flex items-center justify-center text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to email entry
                    </Link>
                </form>
            </motion.div>
        </div>
    );
}
