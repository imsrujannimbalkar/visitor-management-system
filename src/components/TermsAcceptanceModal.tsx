import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ArrowRight, Lock, Eye, ScrollText, X, ArrowLeft } from 'lucide-react';
import { PrivacyPolicy, TermsOfService } from './LegalPages';

interface TermsAcceptanceModalProps {
  onAccept: () => void;
  organizationName?: string;
}

export default function TermsAcceptanceModal({ onAccept, organizationName }: TermsAcceptanceModalProps) {
  const [view, setView] = useState<'decision' | 'privacy' | 'terms'>('decision');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl"
    >
      <motion.div
        initial={{ scale: 0.9, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[85vh] sm:max-h-[90vh]"
      >
        <div className="flex-1 min-h-0 relative">
          <AnimatePresence mode="wait">
            {view === 'decision' ? (
              <motion.div 
                key="decision"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute inset-0 flex flex-col"
              >
                <div className="p-8 sm:p-12 overflow-y-auto custom-scrollbar flex-1">
                <div className="flex flex-col items-center text-center space-y-6 mb-10">
                  <div className="w-20 h-20 bg-brand-blue/10 text-brand-blue rounded-3xl flex items-center justify-center shadow-inner">
                    <ShieldCheck className="h-10 w-10" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic text-center">
                      Protocol <span className="text-brand-blue not-italic">Acknowledgment</span>
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">Security Deployment Required</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="flex gap-5 p-4 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="shrink-0 w-12 h-12 bg-blue-50 dark:bg-blue-900/10 rounded-2xl flex items-center justify-center text-brand-blue">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Data Sovereignty</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        All visitor data captured is strictly encrypted and used solely for operational security and verification logs.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-5 p-4 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="shrink-0 w-12 h-12 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl flex items-center justify-center text-indigo-500">
                      <Eye className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Privacy Guard</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        We maintain a zero-leak policy. Personal information is never shared with third-party aggregators without consent.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-5 p-4 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="shrink-0 w-12 h-12 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl flex items-center justify-center text-emerald-500">
                      <ScrollText className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Operating Terms</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        By entering the workspace, you agree to follow the established check-in/out protocols and maintain record integrity.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 text-center leading-loose uppercase tracking-widest">
                    BY CLICKING BELOW, YOU AGREE TO OUR <br/>
                    <button 
                      onClick={() => setView('privacy')}
                      className="text-brand-blue hover:text-blue-600 transition-colors border-b border-brand-blue/30 mx-1 cursor-pointer"
                    >
                      PRIVACY POLICY
                    </button> 
                    AND 
                    <button 
                      onClick={() => setView('terms')}
                      className="text-brand-blue hover:text-blue-600 transition-colors border-b border-brand-blue/30 mx-1 cursor-pointer"
                    >
                      TERMS OF SERVICE
                    </button>
                  </div>
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
          ) : (
            <motion.div 
              key="content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 flex flex-col bg-white dark:bg-slate-900"
            >
              <div className="p-8 border-b border-slate-50 dark:border-white/5 flex items-center justify-between shrink-0">
                <button 
                  onClick={() => setView('decision')}
                  className="flex items-center gap-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
                </button>
                <div className="text-right">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                    {view === 'privacy' ? 'Privacy' : 'Terms'} <span className="text-brand-blue not-italic">Protocol</span>
                  </h3>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 sm:p-10 custom-scrollbar">
                {view === 'privacy' ? (
                  <PrivacyPolicy organizationName={organizationName} />
                ) : (
                  <TermsOfService />
                )}
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-950/30 border-t border-slate-50 dark:border-white/5">
                <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-[0.2em]">
                  Security Verification Document Ref: {view === 'privacy' ? 'VMS-P-024' : 'VMS-T-024'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </motion.div>
    </motion.div>
  );
}
