import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  ArrowRight,
  Users,
  BookOpen,
  Briefcase,
  MessageSquare,
  CalendarCheck,
  Star,
  ChevronRight,
  Send,
  Heart,
  Shield,
  FileText,
  HelpCircle,
  ExternalLink,
  GraduationCap,
  Zap,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const useUserInfo = () => {
  try {
    return JSON.parse(localStorage.getItem("userInfo")) || {};
  } catch {
    return {};
  }
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Animated stat pill shown in the CTA banner */
const StatPill = ({ icon: Icon, value, label, delay }) => (
  <motion.div
    className="flex flex-col items-center"
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
  >
    <div className="flex items-center gap-1.5 mb-1">
      <Icon className="w-4 h-4 text-indigo-400" />
      <span className="text-2xl font-bold text-white">{value}</span>
    </div>
    <span className="text-xs text-slate-400 uppercase tracking-widest">{label}</span>
  </motion.div>
);

/** A single footer link with hover arrow */
const FooterLink = ({ to, href, children, external }) => {
  const base =
    "group flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-all duration-200 py-0.5";

  const inner = (
    <>
      <ChevronRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 text-indigo-400 flex-shrink-0" />
      <span>{children}</span>
      {external && <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />}
    </>
  );

  if (href) {
    return (
      <a href={href} target={external ? "_blank" : undefined} rel="noopener noreferrer" className={base}>
        {inner}
      </a>
    );
  }

  return (
    <Link to={to} className={base}>
      {inner}
    </Link>
  );
};

/** Column heading */
const ColHeading = ({ children }) => (
  <h3 className="text-sm font-semibold text-white uppercase tracking-widest mb-5 flex items-center gap-2">
    <span className="w-4 h-0.5 bg-indigo-500 rounded-full inline-block" />
    {children}
  </h3>
);

// ─── Main Footer ──────────────────────────────────────────────────────────────

export default function Footer() {
  const userInfo = useUserInfo();
  const role = userInfo?.role; // 'student' | 'alumni' | 'admin' | undefined
  const isLoggedIn = !!role;
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState("idle"); // idle | success | error

  // Resolve a role-prefixed path, or redirect to /signup if not logged in
  const p = (path) => {
    if (!isLoggedIn) return "/signup";
    if (role === "admin") return "/admin/dashboard";
    return `/${role}${path}`;
  };

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNewsletterStatus("error");
      return;
    }
    // TODO: wire to your backend newsletter endpoint
    setNewsletterStatus("success");
    setEmail("");
    setTimeout(() => setNewsletterStatus("idle"), 4000);
  };

  // ── Link data ──────────────────────────────────────────────────────────────

  /** Role-aware platform navigation */
  const platformLinks =
    role === "alumni"
      ? [
          { label: "My Dashboard", to: "/alumni/dashboard" },
          { label: "My Profile", to: "/alumni/profile" },
          { label: "Mentoring Sessions", to: "/alumni/sessions" },
          { label: "Connection Requests", to: "/alumni/requests" },
          { label: "Events & Webinars", to: "/alumni/events" },
          { label: "Messages", to: "/alumni/messages" },
        ]
      : role === "student"
      ? [
          { label: "My Dashboard", to: "/student/dashboard" },
          { label: "My Profile", to: "/student/profile" },
          { label: "Find a Mentor", to: "/student/mentors" },
          { label: "My Sessions", to: "/student/sessions" },
          { label: "Events & Webinars", to: "/student/events" },
          { label: "Messages", to: "/student/messages" },
        ]
      : [
          { label: "Sign Up — Student", to: "/signup" },
          { label: "Sign Up — Alumni", to: "/signup" },
          { label: "Sign In", to: "/signin" },
          { label: "Forgot Password", to: "/forgot-password" },
        ];

  const communityLinks = [
    { label: "Global Feed", to: isLoggedIn ? "/home" : "/signup" },
    { label: "Saved Posts", to: isLoggedIn ? "/saved-posts" : "/signup" },
    { label: "Alumni Directory", to: p("/mentors") },
    { label: "Groups & Chats", to: p("/messages") },
  ];

  const resourceLinks = [
    { label: "Terms of Service", to: "/terms" },
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Community Guidelines", to: "/guidelines"   },
    { label: "Help Centre",          to: "/help"          },
    { label: "Report an Issue",      to: "/report-issue"  },
  ];

  const socialLinks = [
    {
      icon: Facebook,
      href: "#", // ← Replace with real URL
      label: "Facebook",
      hoverClass: "hover:bg-blue-600",
    },
    {
      icon: Twitter,
      href: "#", // ← Replace with real URL
      label: "Twitter / X",
      hoverClass: "hover:bg-sky-500",
    },
    {
      icon: Linkedin,
      href: "#", // ← Replace with real URL
      label: "LinkedIn",
      hoverClass: "hover:bg-blue-700",
    },
    {
      icon: Instagram,
      href: "#", // ← Replace with real URL
      label: "Instagram",
      hoverClass: "hover:bg-gradient-to-br hover:from-pink-500 hover:to-orange-400",
    },
  ];

  // ── Animation helpers ──────────────────────────────────────────────────────

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.55, delay },
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <footer className="bg-slate-950 text-white border-t border-slate-800/60">

      {/* ── 1. CTA Banner ─────────────────────────────────────────────────── */}
      {!isLoggedIn && (
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700">
          {/* Decorative blobs */}
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <motion.div {...fadeUp(0)}>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200 mb-1">
                MMCOE Connect
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                Start your mentorship journey today.
              </h2>
              <p className="text-indigo-200 mt-1.5 text-sm max-w-md">
                Connect with verified alumni, book 1-on-1 guidance sessions, and fast-track
                your career — all in one platform.
              </p>
            </motion.div>

            <motion.div className="flex flex-col sm:flex-row gap-3 flex-shrink-0" {...fadeUp(0.15)}>
              <button
                onClick={() => navigate("/signup")}
                className="px-6 py-3 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-colors flex items-center gap-2 text-sm shadow-lg"
              >
                <GraduationCap className="w-4 h-4" />
                Create Free Account
              </button>
              <button
                onClick={() => navigate("/signin")}
                className="px-6 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2 text-sm"
              >
                Sign In
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        </div>
      )}

      {/* ── 2. Platform Stats Strip ───────────────────────────────────────── */}
      <div className="border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 py-7 grid grid-cols-2 sm:grid-cols-4 gap-6 divide-x divide-slate-800/40">
          <StatPill icon={Users}         value="500+"  label="Alumni Mentors"   delay={0}    />
          <StatPill icon={GraduationCap} value="2000+" label="Students"         delay={0.1}  />
          <StatPill icon={CalendarCheck} value="1800+" label="Sessions Booked"  delay={0.2}  />
          <StatPill icon={Star}          value="4.8★"  label="Avg Mentor Rating" delay={0.3} />
        </div>
      </div>

      {/* ── 3. Main Footer Grid ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10">

        {/* Brand Column */}
        <motion.div className="lg:col-span-4 space-y-6" {...fadeUp(0)}>
          {/* Logo + name */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center p-1 shadow-md flex-shrink-0">
              <img src="/mmcoelogo.png" alt="MMCOE" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">MMCOE Connect</h2>
              <p className="text-xs text-indigo-400 font-medium tracking-wide">Alumni & Student Platform</p>
            </div>
          </div>

          {/* Tagline */}
          <p className="text-slate-400 text-sm leading-relaxed">
            Bridging the gap between MMCOE alumni and students — through mentorship,
            real conversations, and career-defining connections.
          </p>

          {/* Feature chips */}
          <div className="flex flex-wrap gap-2">
            {[
              { icon: Zap,           label: "AI Mentor Match"    },
              { icon: MessageSquare, label: "Real-time Chat"     },
              { icon: CalendarCheck, label: "Session Booking"    },
              { icon: BookOpen,      label: "Career Resources"   },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700/60 rounded-full text-xs text-slate-300"
              >
                <Icon className="w-3 h-3 text-indigo-400" />
                {label}
              </span>
            ))}
          </div>

          {/* Contact info */}
          <div className="space-y-2.5 pt-1">
            {[
              { Icon: Mail,   value: "alumni@mmcoe.edu.in",  href: "mailto:alumni@mmcoe.edu.in" },
              { Icon: Phone,  value: "+91 020 2547 3160",     href: "tel:+912025473160"          },
              { Icon: MapPin, value: "Karvenagar, Pune 411052" },
            ].map(({ Icon, value, href }) => (
              <div key={value} className="flex items-start gap-2.5 text-slate-400 text-sm">
                <Icon className="w-4 h-4 mt-0.5 flex-shrink-0 text-indigo-500" />
                {href ? (
                  <a href={href} className="hover:text-white transition-colors">{value}</a>
                ) : (
                  <span>{value}</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Spacer on large screens */}
        <div className="hidden lg:block lg:col-span-1" />

        {/* Platform Links */}
        <motion.div className="lg:col-span-2" {...fadeUp(0.1)}>
          <ColHeading>
            {role === "alumni" ? "Alumni Hub" : role === "student" ? "Student Hub" : "Platform"}
          </ColHeading>
          <ul className="space-y-1">
            {platformLinks.map(({ label, to }) => (
              <li key={label}>
                <FooterLink to={to}>{label}</FooterLink>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Community Links */}
        <motion.div className="lg:col-span-2" {...fadeUp(0.2)}>
          <ColHeading>Community</ColHeading>
          <ul className="space-y-1">
            {communityLinks.map(({ label, to }) => (
              <li key={label}>
                <FooterLink to={to}>{label}</FooterLink>
              </li>
            ))}
          </ul>

          {/* Mini divider + quick actions */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Quick Actions</p>
            <ul className="space-y-1">
              {role === "student" && (
                <>
                  <li><FooterLink to="/student/mentors">Find a Mentor →</FooterLink></li>
                  <li><FooterLink to="/student/events">Upcoming Events →</FooterLink></li>
                </>
              )}
              {role === "alumni" && (
                <>
                  <li><FooterLink to="/alumni/requests">Pending Requests →</FooterLink></li>
                  <li><FooterLink to="/alumni/sessions">Manage Sessions →</FooterLink></li>
                </>
              )}
              {!isLoggedIn && (
                <>
                  <li><FooterLink to="/signup">Join as Student →</FooterLink></li>
                  <li><FooterLink to="/signup">Join as Alumni →</FooterLink></li>
                </>
              )}
            </ul>
          </div>
        </motion.div>

        {/* Resources + Newsletter */}
        <motion.div className="lg:col-span-3" {...fadeUp(0.3)}>
          <ColHeading>Resources</ColHeading>
          <ul className="space-y-1 mb-6">
            {resourceLinks.map(({ label, to, href, external }) => (
              <li key={label}>
                <FooterLink to={to} href={href} external={external}>
                  {label}
                </FooterLink>
              </li>
            ))}
          </ul>

          {/* Newsletter */}
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1.5">
              <Mail className="w-4 h-4 text-indigo-400" />
              <p className="text-sm font-semibold text-white">Stay in the loop</p>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Get platform updates, career tips, and alumni spotlights straight to your inbox.
            </p>
            <form onSubmit={handleNewsletter} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (newsletterStatus !== "idle") setNewsletterStatus("idle");
                  }}
                  placeholder="your@email.com"
                  className={`w-full bg-slate-800 border text-sm text-white placeholder-slate-500 rounded-xl px-4 py-2.5 pr-10 outline-none focus:ring-2 transition-all ${
                    newsletterStatus === "error"
                      ? "border-red-500 focus:ring-red-500/30"
                      : "border-slate-700 focus:ring-indigo-500/40 focus:border-indigo-500"
                  }`}
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Subscribe
              </button>
            </form>

            <AnimatePresence>
              {newsletterStatus === "success" && (
                <motion.p
                  className="text-xs text-emerald-400 mt-2.5 flex items-center gap-1.5"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Heart className="w-3 h-3" /> You're subscribed! Welcome aboard.
                </motion.p>
              )}
              {newsletterStatus === "error" && (
                <motion.p
                  className="text-xs text-red-400 mt-2.5"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  Please enter a valid email address.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* ── 4. Bottom Bar ─────────────────────────────────────────────────── */}
      <div className="border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4">

          {/* Left: Legal + copyright */}
          <motion.div
            className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-xs text-slate-500"
            {...fadeUp(0.4)}
          >
            <span>© {new Date().getFullYear()} MMCOE Alumni Connect. All rights reserved.</span>
            <span className="hidden md:inline text-slate-700">·</span>
            <Link to="/terms"   className="hover:text-white transition-colors flex items-center gap-1">
              <FileText className="w-3 h-3" /> Terms
            </Link>
            <Link to="/privacy" className="hover:text-white transition-colors flex items-center gap-1">
              <Shield className="w-3 h-3" /> Privacy
            </Link>
            <Link to="/help" className="hover:text-white transition-colors flex items-center gap-1">
              <HelpCircle className="w-3 h-3" /> Help
            </Link>
          </motion.div>

          {/* Right: Social links */}
          <motion.div className="flex items-center gap-2" {...fadeUp(0.45)}>
            <span className="text-xs text-slate-600 mr-1 hidden sm:inline">Follow us</span>
            {socialLinks.map(({ icon: Icon, href, label, hoverClass }) => (
              <motion.a
                key={label}
                href={href}
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-400 hover:text-white transition-all ${hoverClass} hover:border-transparent`}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
              >
                <Icon className="w-3.5 h-3.5" />
              </motion.a>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── 5. Made with love strip ───────────────────────────────────────── */}
      <div className="bg-slate-900/50 border-t border-slate-800/40 py-2 text-center">
        <p className="text-xs text-slate-600 flex items-center justify-center gap-1">
          Built with <Heart className="w-3 h-3 text-rose-500/80 fill-rose-500/80" /> by the MMCOE Connect Team
        </p>
      </div>

    </footer>
  );
}
