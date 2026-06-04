import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck, CheckCircle, XCircle, Clock, Send, Plus, Trash2,
    Linkedin, Link, Briefcase, GraduationCap, FileText, AlertCircle, BadgeCheck
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

const STATUS_CONFIG = {
    pending: {
        icon: Clock,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        badge: 'bg-amber-100 text-amber-700',
        label: 'Under Review'
    },
    verified: {
        icon: CheckCircle,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        badge: 'bg-emerald-100 text-emerald-700',
        label: 'Verified'
    },
    rejected: {
        icon: XCircle,
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        badge: 'bg-red-100 text-red-700',
        label: 'Rejected'
    }
};

export default function VerificationRequest() {
    const [statusData, setStatusData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [form, setForm] = useState({
        linkedinUrl: '',
        currentCompany: '',
        currentRole: '',
        graduationYear: '',
        branch: '',
        additionalNotes: '',
        documents: [{ label: 'Offer Letter', url: '' }]
    });

    const token = JSON.parse(localStorage.getItem('userInfo'))?.token;

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await fetch(`${API}/api/verification/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setStatusData(data);

            // If admin has approved, update localStorage so the alumni can access the system
            if (data.isVerified) {
                const stored = JSON.parse(localStorage.getItem('userInfo')) || {};
                if (!stored.isVerified) {
                    localStorage.setItem('userInfo', JSON.stringify({ ...stored, isVerified: true }));
                    window.dispatchEvent(new Event('user-updated'));
                }
            }

            // Pre-fill form if there's a rejected request to resubmit
            if (data.request && data.request.status === 'rejected') {
                const r = data.request;
                setForm({
                    linkedinUrl: r.linkedinUrl || '',
                    currentCompany: r.currentCompany || '',
                    currentRole: r.currentRole || '',
                    graduationYear: r.graduationYear || '',
                    branch: r.branch || '',
                    additionalNotes: r.additionalNotes || '',
                    documents: r.documents?.length ? r.documents : [{ label: 'Offer Letter', url: '' }]
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDocumentChange = (index, field, value) => {
        const updated = [...form.documents];
        updated[index][field] = value;
        setForm({ ...form, documents: updated });
    };

    const addDocument = () => {
        setForm({ ...form, documents: [...form.documents, { label: '', url: '' }] });
    };

    const removeDocument = (index) => {
        setForm({ ...form, documents: form.documents.filter((_, i) => i !== index) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        // Validate documents — at least one must have a URL
        const validDocs = form.documents.filter(d => d.url.trim());
        if (validDocs.length === 0) {
            setError('Please provide at least one document link.');
            setSubmitting(false);
            return;
        }

        try {
            const res = await fetch(`${API}/api/verification/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ ...form, documents: validDocs })
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess('Your verification request has been submitted! The admin will review it shortly.');
                fetchStatus();
            } else {
                setError(data.message || 'Submission failed. Please try again.');
            }
        } catch (err) {
            setError('Failed to connect to server.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    const { isVerified, request } = statusData || {};
    const canSubmit = !request || request.status === 'rejected';
    const cfg = request ? STATUS_CONFIG[request.status] : null;

    return (
        <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 pt-24">

            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-indigo-600" />
                    Alumni Verification
                </h1>
                <p className="text-gray-500 mt-2">
                    Get your profile verified to receive the <span className="font-semibold text-indigo-600">Verified Mentor Badge</span> and build trust with students.
                </p>
            </div>

            {/* Already Verified Banner */}
            {isVerified && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-8 flex items-center gap-4"
                >
                    <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <BadgeCheck className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-emerald-800">Profile Verified!</h2>
                        <p className="text-emerald-700 text-sm mt-1">
                            Your profile has been verified. The Verified Mentor Badge is now visible on your profile.
                        </p>
                        <button
                            onClick={() => window.location.href = '/home'}
                            className="mt-4 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-all shadow-md inline-block"
                        >
                            Go to Portal →
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Status Card for existing request */}
            {request && cfg && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`${cfg.bg} border ${cfg.border} rounded-2xl p-6 mb-8`}
                >
                    <div className="flex items-start gap-4">
                        <cfg.icon className={`w-7 h-7 ${cfg.color} flex-shrink-0 mt-0.5`} />
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className={`text-lg font-bold ${cfg.color}`}>
                                    {request.status === 'pending' && 'Request Under Review'}
                                    {request.status === 'verified' && 'Verification Approved'}
                                    {request.status === 'rejected' && 'Verification Not Approved'}
                                </h2>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.badge}`}>
                                    {cfg.label}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600">
                                {request.status === 'pending' && 'Your request is being reviewed by the admin team. You will be notified once reviewed.'}
                                {request.status === 'verified' && 'Your alumni profile has been successfully verified.'}
                                {request.status === 'rejected' && 'Your request was not approved. Please review the feedback below and resubmit.'}
                            </p>
                            {request.adminNotes && (
                                <div className="mt-3 bg-white/60 rounded-xl p-3 border border-current/10">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Admin Feedback</p>
                                    <p className="text-sm text-gray-700">{request.adminNotes}</p>
                                </div>
                            )}
                            <p className="text-xs text-gray-400 mt-3">
                                Submitted: {new Date(request.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                {request.reviewedAt && ` · Reviewed: ${new Date(request.reviewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Submission Form */}
            {canSubmit && !isVerified && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >
                    <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                        <h2 className="text-lg font-bold text-gray-900">
                            {request?.status === 'rejected' ? 'Resubmit Verification Request' : 'Submit Verification Request'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Provide your professional details and document links for admin review.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">

                        {error && (
                            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-700 text-sm">
                                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                {success}
                            </div>
                        )}

                        {/* LinkedIn URL */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <Linkedin className="w-4 h-4 text-blue-600" />
                                LinkedIn Profile URL <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="url"
                                placeholder="https://linkedin.com/in/yourprofile"
                                value={form.linkedinUrl}
                                onChange={e => setForm({ ...form, linkedinUrl: e.target.value })}
                                required
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        {/* Company + Role */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-gray-500" />
                                    Current Company <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Infosys, TCS, Google"
                                    value={form.currentCompany}
                                    onChange={e => setForm({ ...form, currentCompany: e.target.value })}
                                    required
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Current Role <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Software Engineer, Data Scientist"
                                    value={form.currentRole}
                                    onChange={e => setForm({ ...form, currentRole: e.target.value })}
                                    required
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Graduation Year + Branch */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-gray-500" />
                                    Graduation Year
                                </label>
                                <input
                                    type="number"
                                    placeholder="e.g. 2022"
                                    min="2000"
                                    max="2030"
                                    value={form.graduationYear}
                                    onChange={e => setForm({ ...form, graduationYear: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
                                <input
                                    type="text"
                                    placeholder="e.g. IT, CS, ENTC"
                                    value={form.branch}
                                    onChange={e => setForm({ ...form, branch: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Document Links */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-gray-500" />
                                    Document Links <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={addDocument}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add Document
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mb-3">
                                Share links to your documents (Google Drive, OneDrive, Dropbox). Ensure links are set to "Anyone with link can view".
                            </p>
                            <div className="space-y-3">
                                {form.documents.map((doc, index) => (
                                    <div key={index} className="flex gap-3 items-start">
                                        <div className="flex-1 grid grid-cols-5 gap-2">
                                            <input
                                                type="text"
                                                placeholder="Label (e.g. Offer Letter)"
                                                value={doc.label}
                                                onChange={e => handleDocumentChange(index, 'label', e.target.value)}
                                                className="col-span-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <input
                                                type="url"
                                                placeholder="https://drive.google.com/..."
                                                value={doc.url}
                                                onChange={e => handleDocumentChange(index, 'url', e.target.value)}
                                                className="col-span-3 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        {form.documents.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeDocument(index)}
                                                className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Additional Notes */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Additional Notes <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <textarea
                                placeholder="Any additional information to help verify your profile..."
                                value={form.additionalNotes}
                                onChange={e => setForm({ ...form, additionalNotes: e.target.value })}
                                rows={3}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    {request?.status === 'rejected' ? 'Resubmit Request' : 'Submit for Verification'}
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            )}

            {/* Info Box when pending and not yet verified */}
            {request?.status === 'pending' && (
                <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-blue-800">What happens next?</p>
                        <p className="text-sm text-blue-700 mt-1">
                            The admin team will review your LinkedIn profile and documents. You'll receive a notification and email once a decision is made — usually within 1–2 business days.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
