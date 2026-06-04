import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Scale, FileText, AlertCircle, Building2, UserCheck, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
  const [agreed, setAgreed] = useState(false);
  const sections = [
    {
      icon: <UserCheck className="w-6 h-6 text-indigo-500" />,
      title: "1. Acceptance of Terms",
      content: "By accessing and using MMCOE Connect, the official networking portal developed for Marathwada Mitra Mandal's College of Engineering (MMCOE), you accept and agree to be bound by the terms and provisions of this agreement. This platform is designed exclusively for authorized students, alumni, and faculty members of MMCOE."
    },
    {
      icon: <Scale className="w-6 h-6 text-blue-500" />,
      title: "2. User Conduct & Professionalism",
      content: "As a representative of MMCOE, you agree to maintain a professional demeanor. You must use the service for lawful purposes only and in a manner that does not infringe upon the rights of, restrict, or inhibit anyone else's use and enjoyment of the MMCOE Connect platform. Any form of harassment, spamming, or inappropriate behavior will result in immediate account suspension."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-500" />,
      title: "3. Privacy and Data Governance",
      content: "Your use of MMCOE Connect is also governed by our Privacy Policy. We are committed to protecting the data of our students and alumni. Please review our Privacy Policy, which details our data collection practices, storage mechanisms, and compliance with institutional guidelines."
    },
    {
      icon: <FileText className="w-6 h-6 text-purple-500" />,
      title: "4. Intellectual Property Rights",
      content: "All content included as part of MMCOE Connect—such as text, graphics, institutional logos, and platform-specific software—is the property of Marathwada Mitra Mandal's College of Engineering (MMCOE) or its respective developers. It is strictly protected by copyright and intellectual property laws."
    },
    {
      icon: <AlertCircle className="w-6 h-6 text-amber-500" />,
      title: "5. Limitations of Liability",
      content: "While we strive to provide a seamless networking and mentorship experience, MMCOE Connect and the administration of Marathwada Mitra Mandal's College of Engineering make no guarantees regarding uninterrupted access or specific career outcomes resulting from the use of this platform."
    },
    {
      icon: <Phone className="w-6 h-6 text-rose-500" />,
      title: "6. Contact Administration",
      content: "If you have any questions, concerns, or require technical assistance regarding these Terms of Service, please contact the MMCOE Connect administrative team via the official support channels provided on our platform."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-full mb-4 shadow-sm">
            <Building2 className="w-8 h-8 text-indigo-700" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-blue-600 mb-4 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Official guidelines and terms for using the MMCOE Connect platform.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100"
        >
          <div className="p-8 md:p-12">
            <div className="space-y-10">
              {sections.map((section, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col md:flex-row gap-4 md:gap-6 group"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:scale-110 group-hover:shadow-md transition-all duration-300 border border-slate-100">
                      {section.icon}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2 md:mb-3 tracking-tight group-hover:text-indigo-600 transition-colors">
                      {section.title}
                    </h2>
                    <p className="text-slate-600 leading-relaxed text-[1.05rem]">
                      {section.content}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 p-6 md:p-8 border-t border-slate-100 flex flex-col gap-6">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-0.5">
                <input 
                  type="checkbox" 
                  className="peer sr-only"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <div className="w-5 h-5 border-2 border-slate-300 rounded peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center group-hover:border-indigo-500">
                  <svg className={`w-3.5 h-3.5 text-white ${agreed ? 'opacity-100' : 'opacity-0'} transition-opacity`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <span className="text-sm text-slate-600 font-medium">
                I have read, understood, and agree to be bound by the Terms of Service for MMCOE Connect.
              </span>
            </label>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-200">
              <p className="text-sm text-slate-500 font-medium text-center sm:text-left">
                Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
              <Link 
                to="/signup" 
                className={`inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-semibold rounded-xl text-white transition-all duration-200 w-full sm:w-auto ${
                  agreed 
                    ? 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 cursor-pointer pointer-events-auto' 
                    : 'bg-slate-300 cursor-not-allowed pointer-events-none'
                }`}
                onClick={(e) => {
                  if (!agreed) {
                    e.preventDefault();
                  }
                }}
              >
                Acknowledge & Return to Sign Up
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
