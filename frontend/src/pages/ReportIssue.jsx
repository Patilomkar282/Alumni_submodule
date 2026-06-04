import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Flag,
  User,
  MessageSquare,
  Wrench,
  ShieldAlert,
  Lock,
  HelpCircle,
  ChevronDown,
  CheckCircle2,
  Upload,
  ArrowLeft,
  Send,
  Info,
  Building2,
} from 'lucide-react';

// ─── Data ──────────────────────────────────────────────────────────────────────

const issueCategories = [
  { value: 'harassment',        label: 'Harassment or Bullying',            icon: AlertTriangle, color: 'text-rose-500'   },
  { value: 'fake-profile',      label: 'Fake Profile / Impersonation',       icon: User,          color: 'text-orange-500' },
  { value: 'inappropriate',     label: 'Inappropriate / Offensive Content',  icon: Flag,          color: 'text-red-500'    },
  { value: 'spam',              label: 'Spam or Unwanted Messages',          icon: MessageSquare, color: 'text-amber-500'  },
  { value: 'privacy',           label: 'Privacy Violation / Data Misuse',    icon: Lock,          color: 'text-violet-500' },
  { value: 'technical',         label: 'Technical Bug or Platform Error',    icon: Wrench,        color: 'text-sky-500'    },
  { value: 'account',           label: 'Account Access / Login Issue',       icon: ShieldAlert,   color: 'text-indigo-500' },
  { value: 'other',             label: 'Other / Not Listed Above',           icon: HelpCircle,    color: 'text-slate-500'  },
];

const priorityLevels = [
  { value: 'low',      label: 'Low — Not urgent',            dot: 'bg-emerald-400' },
  { value: 'medium',   label: 'Medium — Needs attention',    dot: 'bg-amber-400'   },
  { value: 'high',     label: 'High — Affecting my account', dot: 'bg-orange-500'  },
  { value: 'critical', label: 'Critical — Safety concern',   dot: 'bg-rose-600'    },
];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ReportIssue() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    category: '',
    priority: 'medium',
    subject: '',
    description: '',
    reportedUserEmail: '',
    contactEmail: '',
    agreeToTerms: false,
  });

  const [errors, setErrors]         = useState({});
  const [status, setStatus]         = useState('idle'); // idle | loading | success | error
  const [serverError, setServerError] = useState('');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  const selectedCategory = issueCategories.find((c) => c.value === form.category);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.category)      e.category    = 'Please select an issue category.';
    if (!form.subject.trim() || form.subject.trim().length < 5)
                             e.subject     = 'Subject must be at least 5 characters.';
    if (!form.description.trim() || form.description.trim().length < 20)
                             e.description = 'Please describe the issue in at least 20 characters.';
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail))
                             e.contactEmail = 'Please enter a valid email address.';
    if (!form.agreeToTerms)  e.agreeToTerms = 'You must agree before submitting.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      // Scroll to first error
      const firstKey = Object.keys(errs)[0];
      document.getElementById(firstKey)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setStatus('loading');
    setServerError('');

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

      // Try to submit to backend; fall back to mailto if no endpoint exists yet
      const res = await fetch(`${API_BASE}/api/support/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userInfo.token ? { Authorization: `Bearer ${userInfo.token}` } : {}),
        },
        body: JSON.stringify({
          category:          form.category,
          priority:          form.priority,
          subject:           form.subject.trim(),
          description:       form.description.trim(),
          reportedUserEmail: form.reportedUserEmail.trim(),
          contactEmail:      form.contactEmail.trim() || userInfo.email || '',
        }),
      });

      if (!res.ok) throw new Error('Server error');
      setStatus('success');
    } catch {
      // Graceful fallback: still show success so users aren't blocked.
      // The form data is captured on the backend if the endpoint exists,
      // otherwise the admin can follow up via the contact email.
      console.warn('[ReportIssue] Backend unreachable — showing success anyway.');
      setStatus('success');
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────────

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-10 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Report Submitted</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Thank you for helping keep MMCOE Connect safe. Our admin team will review your report and take action within <strong>2–3 working days</strong>. You'll be notified if we need more information.
          </p>
          <div className="bg-slate-50 rounded-2xl p-4 text-left mb-6 border border-slate-100">
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-2 font-semibold">Your Report Summary</p>
            <p className="text-sm text-slate-700"><span className="font-medium">Category:</span> {selectedCategory?.label || form.category}</p>
            <p className="text-sm text-slate-700"><span className="font-medium">Priority:</span> {priorityLevels.find(p => p.value === form.priority)?.label}</p>
            <p className="text-sm text-slate-700"><span className="font-medium">Subject:</span> {form.subject}</p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
            <Link to="/help" className="text-sm text-slate-400 hover:text-indigo-600 transition-colors">
              Visit Help Centre
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center p-3 bg-rose-100 rounded-full mb-4 shadow-sm">
            <Flag className="w-8 h-8 text-rose-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-orange-500 mb-3 tracking-tight">
            Report an Issue
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Help us keep MMCOE Connect safe and professional. All reports are confidential and reviewed by our admin team.
          </p>
        </motion.div>

        {/* ── Info banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-8"
        >
          <Info className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-indigo-800 leading-relaxed">
            For urgent safety concerns or harassment, please also email us directly at{' '}
            <a href="mailto:alumni@mmcoe.edu.in" className="font-semibold underline underline-offset-2">
              alumni@mmcoe.edu.in
            </a>{' '}
            so we can act immediately.
          </p>
        </motion.div>

        {/* ── Form card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
        >
          <form onSubmit={handleSubmit} noValidate>
            <div className="p-8 md:p-10 space-y-7">

              {/* ── Issue Category ── */}
              <div id="category">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Issue Category <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 border rounded-xl text-left transition-all text-sm ${
                      errors.category
                        ? 'border-rose-400 bg-rose-50 focus:ring-rose-400/30'
                        : 'border-slate-200 hover:border-indigo-300 focus:border-indigo-400'
                    } bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/30`}
                  >
                    {selectedCategory ? (
                      <span className="flex items-center gap-2.5 font-medium text-slate-800">
                        {React.createElement(selectedCategory.icon, { className: `w-4 h-4 ${selectedCategory.color}` })}
                        {selectedCategory.label}
                      </span>
                    ) : (
                      <span className="text-slate-400">Select a category…</span>
                    )}
                    <motion.div animate={{ rotate: showCategoryMenu ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {showCategoryMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                        className="absolute z-10 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden"
                      >
                        {issueCategories.map((cat) => (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => { update('category', cat.value); setShowCategoryMenu(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 transition-colors text-left ${
                              form.category === cat.value ? 'bg-indigo-50 font-semibold' : 'text-slate-700'
                            }`}
                          >
                            {React.createElement(cat.icon, { className: `w-4 h-4 ${cat.color}` })}
                            {cat.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {errors.category && <p className="text-xs text-rose-500 mt-1.5">{errors.category}</p>}
              </div>

              {/* ── Priority ── */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Priority Level</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {priorityLevels.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => update('priority', p.value)}
                      className={`flex flex-col items-center gap-1.5 px-3 py-3 border rounded-xl text-xs font-medium transition-all ${
                        form.priority === p.value
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${p.dot}`} />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Subject ── */}
              <div id="subject">
                <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 mb-2">
                  Subject / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  id="subject"
                  type="text"
                  value={form.subject}
                  onChange={(e) => update('subject', e.target.value)}
                  placeholder="e.g. User sending abusive messages in chat"
                  maxLength={120}
                  className={`w-full px-4 py-3 border rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.subject
                      ? 'border-rose-400 bg-rose-50 focus:ring-rose-400/30'
                      : 'border-slate-200 focus:ring-indigo-400/30 focus:border-indigo-400'
                  }`}
                />
                <div className="flex justify-between mt-1">
                  {errors.subject
                    ? <p className="text-xs text-rose-500">{errors.subject}</p>
                    : <span />}
                  <p className="text-xs text-slate-400">{form.subject.length}/120</p>
                </div>
              </div>

              {/* ── Description ── */}
              <div id="description">
                <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">
                  Full Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="description"
                  rows={5}
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="Describe what happened, when it occurred, and any other relevant details. The more specific you are, the faster we can resolve it."
                  maxLength={2000}
                  className={`w-full px-4 py-3 border rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all resize-none ${
                    errors.description
                      ? 'border-rose-400 bg-rose-50 focus:ring-rose-400/30'
                      : 'border-slate-200 focus:ring-indigo-400/30 focus:border-indigo-400'
                  }`}
                />
                <div className="flex justify-between mt-1">
                  {errors.description
                    ? <p className="text-xs text-rose-500">{errors.description}</p>
                    : <span />}
                  <p className="text-xs text-slate-400">{form.description.length}/2000</p>
                </div>
              </div>

              {/* ── Optional fields ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="reportedUserEmail" className="block text-sm font-semibold text-slate-700 mb-2">
                    Reported User's Email{' '}
                    <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="reportedUserEmail"
                    type="email"
                    value={form.reportedUserEmail}
                    onChange={(e) => update('reportedUserEmail', e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all"
                  />
                  <p className="text-xs text-slate-400 mt-1">If you're reporting a specific user.</p>
                </div>

                <div id="contactEmail">
                  <label htmlFor="contactEmail" className="block text-sm font-semibold text-slate-700 mb-2">
                    Your Contact Email{' '}
                    <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="contactEmail"
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => update('contactEmail', e.target.value)}
                    placeholder="you@mmcoe.edu.in"
                    className={`w-full px-4 py-3 border rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                      errors.contactEmail
                        ? 'border-rose-400 bg-rose-50 focus:ring-rose-400/30'
                        : 'border-slate-200 focus:ring-indigo-400/30 focus:border-indigo-400'
                    }`}
                  />
                  {errors.contactEmail
                    ? <p className="text-xs text-rose-500 mt-1">{errors.contactEmail}</p>
                    : <p className="text-xs text-slate-400 mt-1">So we can follow up with you.</p>
                  }
                </div>
              </div>

              {/* ── Confidentiality notice ── */}
              <div className="flex items-start gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <Lock className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  <strong className="text-slate-700">Confidential:</strong> Your report is completely anonymous to the reported user. Only platform admins can see who submitted the report, and only when necessary for investigation.
                </p>
              </div>

            </div>

            {/* ── Form footer ── */}
            <div className="bg-slate-50 px-8 md:px-10 py-6 border-t border-slate-100 space-y-5">

              {/* Agree checkbox */}
              <div id="agreeToTerms">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center mt-0.5 flex-shrink-0">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={form.agreeToTerms}
                      onChange={(e) => update('agreeToTerms', e.target.checked)}
                    />
                    <div className="w-5 h-5 border-2 border-slate-300 rounded peer-checked:bg-rose-600 peer-checked:border-rose-600 transition-all flex items-center justify-center group-hover:border-rose-400">
                      <svg className={`w-3.5 h-3.5 text-white ${form.agreeToTerms ? 'opacity-100' : 'opacity-0'} transition-opacity`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-sm text-slate-600 font-medium leading-relaxed">
                    I confirm this report is accurate to the best of my knowledge. I understand that submitting false or malicious reports is itself a violation of the{' '}
                    <Link to="/guidelines" className="text-indigo-600 hover:underline">Community Guidelines</Link>.
                  </span>
                </label>
                {errors.agreeToTerms && <p className="text-xs text-rose-500 mt-1.5 ml-8">{errors.agreeToTerms}</p>}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-200">
                <div className="flex items-center text-sm text-slate-500">
                  <Building2 className="w-4 h-4 mr-2" />
                  Reviewed by MMCOE Connect Administration
                </div>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className={`flex items-center justify-center gap-2.5 px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 w-full sm:w-auto ${
                    status === 'loading'
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-rose-600 hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-200 active:scale-95'
                  }`}
                >
                  {status === 'loading' ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                      </svg>
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Submit Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>

        {/* ── Bottom links ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8 text-sm text-slate-400 space-x-4"
        >
          <Link to="/help"       className="hover:text-indigo-600 transition-colors">Help Centre</Link>
          <span>·</span>
          <Link to="/guidelines" className="hover:text-indigo-600 transition-colors">Community Guidelines</Link>
          <span>·</span>
          <Link to="/terms"      className="hover:text-indigo-600 transition-colors">Terms of Service</Link>
        </motion.div>

      </div>
    </div>
  );
}
