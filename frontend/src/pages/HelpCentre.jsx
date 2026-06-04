import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  ChevronDown,
  Search,
  UserCircle,
  BookOpen,
  MessageSquare,
  CalendarCheck,
  Settings,
  Shield,
  Mail,
  Phone,
  ArrowRight,
  Zap,
  Users,
  Star,
  ExternalLink,
} from 'lucide-react';

// ─── Data ─────────────────────────────────────────────────────────────────────

const categories = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    icon: Zap,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    faqs: [
      {
        q: 'Who can join MMCOE Connect?',
        a: 'MMCOE Connect is exclusively for students and alumni of Marathwada Mitra Mandal\'s College of Engineering (MMCOE). Students must register with a valid @mmcoe.edu.in email address. Alumni can sign up using their professional email and select the Alumni role during registration.',
      },
      {
        q: 'How do I create an account?',
        a: 'Visit the Sign Up page, select your role (Student or Alumni), enter your details and email address. Students will need to use their official @mmcoe.edu.in email. After registration, complete your profile by adding your education, skills, and a profile photo to unlock all features.',
      },
      {
        q: 'What can I do as a Student?',
        a: 'As a student, you can browse the alumni directory, connect with mentors, book 1-on-1 mentorship sessions, attend global events and webinars, participate in the community feed, and exchange direct messages with connections.',
      },
      {
        q: 'What can I do as an Alumni?',
        a: 'Alumni can set their availability slots to accept mentorship bookings, manage and host sessions, respond to connection requests from students, create and join community posts, attend events, and give back to the MMCOE community by sharing their professional experience.',
      },
    ],
  },
  {
    id: 'account',
    label: 'Account & Profile',
    icon: UserCircle,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    faqs: [
      {
        q: 'How do I update my profile?',
        a: 'Navigate to your Dashboard and click on "My Profile" in the sidebar or header menu. You can update your profile photo, banner image, bio, skills, work experience, education, and social links from there. Changes are saved instantly.',
      },
      {
        q: 'How do I change or reset my password?',
        a: 'To change your password, go to your Profile page and scroll to the Account Settings section. To reset a forgotten password, click "Forgot Password" on the Sign In page — you\'ll receive a one-time OTP on your registered email.',
      },
      {
        q: 'Can I make my profile private?',
        a: 'Yes. In your Profile settings, toggle the "Public Profile" switch off. This hides your profile from search results and the alumni directory. Only your existing connections will be able to view your full details.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Account deletion is available in your Profile settings under "Danger Zone". This action is permanent and will remove all your posts, messages, session history, and connections. Please consider carefully before proceeding.',
      },
    ],
  },
  {
    id: 'mentorship',
    label: 'Mentorship & Sessions',
    icon: CalendarCheck,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    faqs: [
      {
        q: 'How do I find and book a mentor?',
        a: 'Go to "Find a Mentor" in your student dashboard. You\'ll see AI-powered recommendations based on your skills and interests, or you can search/filter by company, role, or expertise. Click on a mentor\'s card, view their profile, and select an available time slot to book a session.',
      },
      {
        q: 'What happens after I book a session?',
        a: 'Once you book a session, the alumni mentor receives a notification and your booking appears under "My Sessions". A Google Meet link is automatically generated and shown in your session card. You\'ll be able to join the call directly from the platform.',
      },
      {
        q: 'How do I set my availability as an Alumni?',
        a: 'Go to your Alumni Profile page and scroll to the "Availability Slots" section. Click "Add Slot" and select the date, start time, and end time for each slot you want to offer. Students can then book from these available windows.',
      },
      {
        q: 'How does the session rating work?',
        a: 'After a session is marked as completed by the alumni, students receive the option to leave a 1–5 star rating and a written review. These ratings are publicly visible on the alumni\'s profile and contribute to their overall mentor score.',
      },
      {
        q: 'Can I cancel a session?',
        a: 'Alumni can cancel a scheduled session from their Sessions page using the cancel button. Students should reach out via the Messages feature to discuss rescheduling before the alumni cancels. Repeated no-shows may affect mentor ratings.',
      },
    ],
  },
  {
    id: 'messages',
    label: 'Messages & Connections',
    icon: MessageSquare,
    color: 'text-sky-500',
    bg: 'bg-sky-50',
    border: 'border-sky-100',
    faqs: [
      {
        q: 'How do I connect with an alumni?',
        a: 'Find the alumni you want to connect with via "Find a Mentor" or search. Click on their card and press the "Connect" button. The alumni will receive a connection request notification. Once they accept, you can exchange messages and book sessions.',
      },
      {
        q: 'Can alumni and students video call directly?',
        a: 'Yes. Once connected, both students and alumni can initiate a video call directly from the Messages page using the video camera icon. The platform uses WebRTC for secure peer-to-peer video calls — no external app needed.',
      },
      {
        q: 'What are Groups?',
        a: 'Groups are shared chat rooms accessible from the Messages page. They allow multiple students and alumni to discuss topics together, share resources, and collaborate. You can create a group or be invited to join one by existing members.',
      },
      {
        q: 'Are my messages private?',
        a: 'All direct messages on MMCOE Connect are private between you and your connection. They are not visible to other users or administrators unless reported for a code of conduct violation and reviewed through the moderation process.',
      },
    ],
  },
  {
    id: 'technical',
    label: 'Technical Issues',
    icon: Settings,
    color: 'text-rose-500',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    faqs: [
      {
        q: 'I\'m not receiving OTP emails. What should I do?',
        a: 'First, check your spam or junk mail folder. OTPs expire after 10 minutes, so request a new one if needed. Ensure you\'re using the email address you registered with. If the issue persists, contact us at alumni@mmcoe.edu.in.',
      },
      {
        q: 'The platform is slow or not loading. What can I do?',
        a: 'Try refreshing the page (Ctrl+R / Cmd+R) or clearing your browser cache. Ensure you\'re using a modern browser (Chrome, Firefox, Edge, Safari). Disable any VPN or ad-blocker that might be interfering. If the issue continues, please report it using the "Report an Issue" form.',
      },
      {
        q: 'My video call is not working.',
        a: 'Ensure your browser has permission to access your camera and microphone (check the lock icon in your browser\'s address bar). Close any other apps using the camera. Use Google Chrome for the best WebRTC compatibility. If issues persist, use the Google Meet link provided in your session card instead.',
      },
      {
        q: 'I can\'t log in — my password is correct.',
        a: 'Your account may have been suspended for a policy violation, in which case you\'ll see a specific message. Otherwise, try the "Forgot Password" flow to reset. If you still can\'t access your account, contact admin support.',
      },
    ],
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function AccordionItem({ q, a, accentColor }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="font-semibold text-slate-800 text-sm md:text-base pr-2">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} className="flex-shrink-0">
          <ChevronDown className={`w-5 h-5 ${accentColor}`} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function HelpCentre() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('getting-started');

  const activeData = categories.find((c) => c.id === activeCategory);

  const filteredFaqs = searchQuery.trim()
    ? categories
        .flatMap((c) => c.faqs.map((faq) => ({ ...faq, category: c.label, color: c.color })))
        .filter(
          (faq) =>
            faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
    : null;

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center p-3 bg-amber-100 rounded-full mb-4 shadow-sm">
            <HelpCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500 mb-3 tracking-tight">
            Help Centre
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Find answers, explore guides, and get the most out of MMCOE Connect.
          </p>
        </motion.div>

        {/* ── Search ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative max-w-2xl mx-auto mb-12"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for help topics…"
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </motion.div>

        {/* ── Search Results ── */}
        {filteredFaqs && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-10"
          >
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No results found for "<span className="text-slate-700">{searchQuery}</span>"</p>
                <p className="text-sm text-slate-400 mt-1">Try different keywords or browse the categories below.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 mb-4 font-medium">{filteredFaqs.length} result{filteredFaqs.length > 1 ? 's' : ''} found</p>
                {filteredFaqs.map((faq, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <span className={`text-xs font-semibold uppercase tracking-widest ${faq.color} mb-2 block`}>{faq.category}</span>
                    <AccordionItem q={faq.q} a={faq.a} accentColor={faq.color} />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Main Content (categories + FAQs) ── */}
        {!filteredFaqs && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* Sidebar */}
            <motion.div
              className="lg:col-span-1 space-y-2"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all text-sm font-medium ${
                      isActive
                        ? `${cat.bg} ${cat.color} border ${cat.border} shadow-sm`
                        : 'text-slate-600 hover:bg-white hover:shadow-sm border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? cat.color : 'text-slate-400'}`} />
                    {cat.label}
                  </button>
                );
              })}

              {/* Contact card */}
              <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Still need help?</p>
                <a
                  href="mailto:alumni@mmcoe.edu.in"
                  className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-2 transition-colors"
                >
                  <Mail className="w-4 h-4" /> Email Support
                </a>
                <Link
                  to="/report-issue"
                  className="flex items-center gap-2 text-sm text-rose-500 hover:text-rose-700 font-medium transition-colors"
                >
                  <Shield className="w-4 h-4" /> Report an Issue
                </Link>
              </div>
            </motion.div>

            {/* FAQ Panel */}
            <motion.div
              className="lg:col-span-3"
              key={activeCategory}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                {/* Panel header */}
                <div className={`px-8 py-6 border-b border-slate-100 flex items-center gap-3 ${activeData.bg}`}>
                  {React.createElement(activeData.icon, { className: `w-6 h-6 ${activeData.color}` })}
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">{activeData.label}</h2>
                    <p className="text-sm text-slate-500">{activeData.faqs.length} articles</p>
                  </div>
                </div>

                {/* Accordions */}
                <div className="p-6 md:p-8 space-y-3">
                  {activeData.faqs.map((faq, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <AccordionItem q={faq.q} a={faq.a} accentColor={activeData.color} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── Bottom CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-12 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-white"
        >
          <div>
            <h3 className="text-xl font-bold mb-1">Couldn't find what you need?</h3>
            <p className="text-indigo-200 text-sm">Our team typically responds within 24 hours on working days.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <a
              href="mailto:alumni@mmcoe.edu.in"
              className="px-5 py-2.5 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-colors flex items-center gap-2 text-sm"
            >
              <Mail className="w-4 h-4" /> Email Us
            </a>
            <Link
              to="/report-issue"
              className="px-5 py-2.5 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2 text-sm"
            >
              Report an Issue <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
