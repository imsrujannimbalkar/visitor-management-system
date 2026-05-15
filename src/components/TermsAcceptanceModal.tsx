import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, ArrowRight, Lock, Eye, ScrollText } from 'lucide-react';

interface TermsAcceptanceModalProps {
  onAccept: () => void;
  organizationName?: string;
}

export default function TermsAcceptanceModal({ onAccept, organizationName }: TermsAcceptanceModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl"
    >
      <motion.div
        initial={{ scale: 0.9, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[90vh]"
      >
        <div className="p-8 sm:p-12 overflow-y-auto custom-scrollbar flex-1">
          <div className="flex flex-col items-center text-center space-y-6 mb-10">
            <div className="w-20 h-20 bg-brand-blue/10 text-brand-blue rounded-3xl flex items-center justify-center shadow-inner">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                Protocol <span className="text-brand-blue not-italic">Acknowledgment</span>
              </h2>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">Security Deployment Required</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex gap-5">
              <div className="shrink-0 w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-brand-blue">
                <Lock className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Data Sovereignty</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  All visitor data captured by {organizationName || 'this organization'} is strictly encrypted and used solely for operational security and verification logs.
                </p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="shrink-0 w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-500">
                <Eye className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Privacy Guard</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  We maintain a zero-leak policy. Personal information is never shared with third-party aggregators or used for marketing without explicit consent.
                </p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="shrink-0 w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-500">
                <ScrollText className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Standard Operating Terms</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  By entering the workspace, you agree to follow the established check-in/out protocols and maintain the integrity of system records.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 text-center leading-loose">
              BY CLICKING THE BUTTON BELOW, YOU CONFIRM THAT YOU HAVE READ, UNDERSTOOD, AND AGREED TO BE BOUND BY OUR <span className="text-brand-blue cursor-help border-b border-brand-blue/30">PRIVACY POLICY</span> AND <span className="text-brand-blue cursor-help border-b border-brand-blue/30">TERMS OF SERVICE</span>.
            </p>
          </div>
        </div>

        <div className="p-8 sm:p-10 bg-slate-50/50 dark:bg-slate-950/30 border-t border-slate-100 dark:border-white/5">
          <button
            onClick={onAccept}
            className="w-full py-6 bg-brand-blue text-white font-black rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-[11px]"
          >
            I Accept Protocol Conditions
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
