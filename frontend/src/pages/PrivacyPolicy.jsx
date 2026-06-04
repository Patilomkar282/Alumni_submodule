import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, Share2, FileLock2, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  const [agreed, setAgreed] = useState(false);
  const policies = [
    {
      icon: <Database className="w-6 h-6 text-blue-500" />,
      title: "1. Data Collection & Processing",
      content: "When you register on MMCOE Connect, the dedicated alumni network for Marathwada Mitra Mandal's College of Engineering (MMCOE), we collect essential academic and professional details. This includes your student/alumni ID, graduation year, contact information, and professional background to verify your institutional affiliation."
    },
    {
      icon: <Eye className="w-6 h-6 text-indigo-500" />,
      title: "2. Purpose of Information Usage",
      content: "Your data is strictly utilized to enhance your networking experience on the platform. We use this information to facilitate relevant mentorship connections, provide tailored career opportunities, keep you updated on MMCOE campus events, and improve the overall functionality of the ecosystem."
    },
    {
      icon: <Lock className="w-6 h-6 text-emerald-500" />,
      title: "3. Enterprise-Grade Security",
      content: "Protecting the privacy of MMCOE students and alumni is paramount. We implement industry-standard encryption protocols, secure authentication mechanisms, and regular security audits to safeguard your personal credentials and professional data against unauthorized access or breaches."
    },
    {
      icon: <Share2 className="w-6 h-6 text-rose-500" />,
      title: "4. Information Sharing Boundaries",
      content: "We enforce a strict non-disclosure policy. Your personally identifiable information will never be sold, traded, or exploited by external agencies. Data may only be shared with verified internal administrators and trusted technical partners bound by strict confidentiality agreements to maintain the platform."
    },
    {
      icon: <FileLock2 className="w-6 h-6 text-purple-500" />,
      title: "5. User Consent & Rights",
      content: "By joining the MMCOE Connect community, you consent to this privacy framework. You retain full rights to update your profile details, restrict platform visibility, or request account deletion at any time through your dashboard settings."
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
          <div className="inline-flex items-center justify-center p-3 bg-emerald-100 rounded-full mb-4 shadow-sm">
            <Shield className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 mb-4 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Understanding how MMCOE Connect safeguards the data of our Marathwada Mitra Mandal's College of Engineering community.
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
              {policies.map((policy, index) => (
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
                      {policy.icon}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2 md:mb-3 tracking-tight group-hover:text-emerald-600 transition-colors">
                      {policy.title}
                    </h2>
                    <p className="text-slate-600 leading-relaxed text-[1.05rem]">
                      {policy.content}
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
                <div className="w-5 h-5 border-2 border-slate-300 rounded peer-checked:bg-emerald-600 peer-checked:border-emerald-600 transition-all flex items-center justify-center group-hover:border-emerald-500">
                  <svg className={`w-3.5 h-3.5 text-white ${agreed ? 'opacity-100' : 'opacity-0'} transition-opacity`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <span className="text-sm text-slate-600 font-medium">
                I have read and agree to the Privacy Policy set by Marathwada Mitra Mandal's College of Engineering.
              </span>
            </label>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-200">
              <div className="flex items-center text-sm text-slate-500 font-medium justify-center sm:justify-start w-full sm:w-auto mb-2 sm:mb-0">
                <Building2 className="w-4 h-4 mr-2" />
                Instituted by MMCOE Administration
              </div>
              <Link 
                to="/signup" 
                className={`inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-semibold rounded-xl text-white transition-all duration-200 w-full sm:w-auto ${
                  agreed 
                    ? 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 cursor-pointer pointer-events-auto' 
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
