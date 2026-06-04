import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Shield,
  MessageSquare,
  Users,
  Star,
  Building2,
  ArrowRight,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react';

// ─── Data ──────────────────────────────────────────────────────────────────────

const sections = [
  {
    icon: <ThumbsUp className="w-6 h-6 text-emerald-500" />,
    accent: 'emerald',
    title: '1. Be Professional & Respectful',
    summary: 'MMCOE Connect is a professional networking platform. Treat every interaction as you would in a workplace.',
    dos: [
      'Use polite, clear, and constructive language in all communications.',
      'Respect different opinions, career paths, and educational backgrounds.',
      'Acknowledge and appreciate the time alumni invest in mentoring sessions.',
      'Give honest and constructive feedback after sessions.',
    ],
    donts: [
      'Use aggressive, offensive, or discriminatory language.',
      'Mock, belittle, or harass other users in any channel.',
      'Share or spread rumours or false information about other members.',
    ],
  },
  {
    icon: <MessageSquare className="w-6 h-6 text-indigo-500" />,
    accent: 'indigo',
    title: '2. Keep Content Relevant & Purposeful',
    summary: 'Posts, messages, and comments should add value to the community — professionally or educationally.',
    dos: [
      'Share job opportunities, internship openings, project ideas, and career advice.',
      'Post updates about MMCOE events, workshops, or academic achievements.',
      'Ask specific, well-formed questions in mentorship sessions to respect everyone\'s time.',
      'Share articles, resources, and insights relevant to engineering and career growth.',
    ],
    donts: [
      'Post spam, promotional content, or chain messages.',
      'Share unrelated political, religious, or personal rant content.',
      'Duplicate-post the same content repeatedly across the feed.',
    ],
  },
  {
    icon: <Shield className="w-6 h-6 text-violet-500" />,
    accent: 'violet',
    title: '3. Protect Privacy & Confidentiality',
    summary: 'Information shared in mentorship sessions and private messages must remain confidential.',
    dos: [
      'Keep session discussions and personal disclosures private between participants.',
      'Report any privacy breach to the admin team immediately.',
      'Only share contact details (phone, personal email) if you both mutually agree.',
      'Respect profile privacy settings — do not share someone\'s profile without consent.',
    ],
    donts: [
      'Screenshot or record mentorship sessions without explicit consent from all parties.',
      'Share private messages or conversations publicly.',
      'Collect, store, or misuse other users\' personal data.',
      'Attempt to access or log in to another user\'s account.',
    ],
  },
  {
    icon: <Star className="w-6 h-6 text-amber-500" />,
    accent: 'amber',
    title: '4. Mentorship Etiquette',
    summary: 'Mentorship is a privilege. Both students and alumni should approach it with commitment and sincerity.',
    dos: [
      'Book sessions only when you genuinely intend to attend.',
      'Notify the mentor in advance if you need to reschedule or cancel.',
      'Come prepared — research your mentor\'s background and frame your questions in advance.',
      'Leave honest, constructive ratings after each session to help the community.',
    ],
    donts: [
      'No-show for booked sessions without giving prior notice.',
      'Use mentorship sessions to solicit referrals, jobs, or favours.',
      'Ask mentors for personal contact information during initial sessions.',
      'Submit fake or manipulative session ratings.',
    ],
  },
  {
    icon: <Users className="w-6 h-6 text-sky-500" />,
    accent: 'sky',
    title: '5. Connection Requests & Networking',
    summary: 'Build genuine connections — quality matters more than quantity.',
    dos: [
      'Personalise connection requests with a short note about why you want to connect.',
      'Connect with alumni whose expertise genuinely aligns with your goals.',
      'Accept or decline requests respectfully — ignoring is also acceptable.',
      'Use the messaging feature to build meaningful professional conversations.',
    ],
    donts: [
      'Mass-send connection requests without any context.',
      'Harass users who decline your request or do not respond.',
      'Use connections to solicit commercial services or products.',
    ],
  },
  {
    icon: <AlertTriangle className="w-6 h-6 text-rose-500" />,
    accent: 'rose',
    title: '6. Zero-Tolerance Violations',
    summary: 'Certain behaviours will result in immediate and permanent account suspension without prior warning.',
    items: [
      'Sharing explicit, obscene, or sexually inappropriate content.',
      'Bullying, doxxing, threatening, or intimidating any platform member.',
      'Creating fake profiles, impersonating others, or misrepresenting credentials.',
      'Attempting to hack, scrape, or compromise the platform or its users.',
      'Violating national or institutional laws through the platform.',
    ],
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

const accentMap = {
  emerald: { dot: 'bg-emerald-500', ring: 'ring-emerald-100', badge: 'bg-emerald-100 text-emerald-700', card: 'bg-emerald-50 border-emerald-100', hover: 'group-hover:text-emerald-600' },
  indigo:  { dot: 'bg-indigo-500',  ring: 'ring-indigo-100',  badge: 'bg-indigo-100 text-indigo-700',   card: 'bg-indigo-50 border-indigo-100',   hover: 'group-hover:text-indigo-600'  },
  violet:  { dot: 'bg-violet-500',  ring: 'ring-violet-100',  badge: 'bg-violet-100 text-violet-700',   card: 'bg-violet-50 border-violet-100',   hover: 'group-hover:text-violet-600'  },
  amber:   { dot: 'bg-amber-500',   ring: 'ring-amber-100',   badge: 'bg-amber-100 text-amber-700',     card: 'bg-amber-50 border-amber-100',     hover: 'group-hover:text-amber-600'   },
  sky:     { dot: 'bg-sky-500',     ring: 'ring-sky-100',     badge: 'bg-sky-100 text-sky-700',         card: 'bg-sky-50 border-sky-100',         hover: 'group-hover:text-sky-600'     },
  rose:    { dot: 'bg-rose-500',    ring: 'ring-rose-100',    badge: 'bg-rose-100 text-rose-700',       card: 'bg-rose-50 border-rose-100',       hover: 'group-hover:text-rose-600'    },
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Guidelines() {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-3 bg-violet-100 rounded-full mb-4 shadow-sm">
            <BookOpen className="w-8 h-8 text-violet-700" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 mb-4 tracking-tight">
            Community Guidelines
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            These guidelines define the standards of conduct expected from every member of the MMCOE Connect community — students, alumni, and all participants.
          </p>

          {/* Info chip */}
          <div className="inline-flex items-center gap-2 mt-5 px-4 py-2 bg-violet-50 border border-violet-100 rounded-full text-sm text-violet-700 font-medium">
            <Info className="w-4 h-4" />
            Violations may result in temporary suspension or permanent account removal.
          </div>
        </motion.div>

        {/* ── Sections ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100"
        >
          <div className="p-8 md:p-12 space-y-12">
            {sections.map((section, index) => {
              const colors = accentMap[section.accent];
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.07 }}
                  className="flex flex-col md:flex-row gap-5 md:gap-7 group"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-12 h-12 rounded-2xl ${colors.card} border flex items-center justify-center group-hover:scale-110 group-hover:shadow-md transition-all duration-300`}>
                      {section.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h2 className={`text-xl md:text-2xl font-bold text-slate-800 mb-1.5 tracking-tight transition-colors ${colors.hover}`}>
                      {section.title}
                    </h2>
                    <p className="text-slate-500 text-sm mb-4 leading-relaxed">{section.summary}</p>

                    {/* Do's & Don'ts */}
                    {section.dos && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100">
                          <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5" /> Do
                          </p>
                          <ul className="space-y-2">
                            {section.dos.map((d, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                                {d}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-rose-50/60 rounded-2xl p-4 border border-rose-100">
                          <p className="text-xs font-bold text-rose-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5" /> Don't
                          </p>
                          <ul className="space-y-2">
                            {section.donts.map((d, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 flex-shrink-0" />
                                {d}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Zero-tolerance list */}
                    {section.items && (
                      <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100">
                        <ul className="space-y-2.5">
                          {section.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-rose-800 font-medium">
                              <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ── Footer of card ── */}
          <div className="bg-slate-50 p-6 md:p-8 border-t border-slate-100 flex flex-col gap-6">
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 leading-relaxed">
                <strong>Enforcement:</strong> The MMCOE Connect admin team reviews all reported violations. Consequences range from a warning and content removal to permanent account suspension, depending on severity and frequency.
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-0.5 flex-shrink-0">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <div className="w-5 h-5 border-2 border-slate-300 rounded peer-checked:bg-violet-600 peer-checked:border-violet-600 transition-all flex items-center justify-center group-hover:border-violet-500">
                  <svg className={`w-3.5 h-3.5 text-white ${agreed ? 'opacity-100' : 'opacity-0'} transition-opacity`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <span className="text-sm text-slate-600 font-medium">
                I have read and agree to follow the MMCOE Connect Community Guidelines. I understand that violations may result in account suspension.
              </span>
            </label>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-200">
              <div className="flex items-center text-sm text-slate-500 font-medium">
                <Building2 className="w-4 h-4 mr-2" />
                Issued by MMCOE Connect Administration
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  to="/report-issue"
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 w-full sm:w-auto justify-center"
                >
                  Report a Violation <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/signup"
                  className={`px-6 py-2.5 text-sm font-semibold rounded-xl text-white transition-all duration-200 flex items-center gap-2 w-full sm:w-auto justify-center ${
                    agreed
                      ? 'bg-violet-600 hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-200'
                      : 'bg-slate-300 cursor-not-allowed pointer-events-none'
                  }`}
                  onClick={(e) => { if (!agreed) e.preventDefault(); }}
                >
                  Acknowledge & Continue
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
