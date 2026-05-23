import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  ArrowRight,
  Lock,
  Eye,
  ScrollText,
  X,
  ArrowLeft
} from 'lucide-react';

import { PrivacyPolicy, TermsOfService } from './LegalPages';

interface LegalAcceptanceModalProps {
  onAccept: () => void;
  onClose: () => void;
  organizationName?: string;
}

export default function LegalAcceptanceModal({
  onAccept,
  onClose,
  organizationName
}: LegalAcceptanceModalProps) {

  const [view, setView] =
    useState<'decision' | 'privacy' | 'terms'>('decision');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0.94, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-white w-full max-w-2xl rounded-[2.5rem] sm:rounded-[3rem] shadow-[0_25px_80px_rgba(0,0,0,0.15)] overflow-hidden border border-slate-100 flex flex-col h-[650px] max-h-[90vh]"
      >
        <div className="flex-1 relative flex flex-col min-h-0">

          {/* CLOSE BUTTON */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-[60] p-3 text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all active:scale-95 border border-slate-100/50 backdrop-blur-md cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          <AnimatePresence mode="wait">

            {/* ================================================= */}
            {/* MAIN DECISION SCREEN */}
            {/* ================================================= */}

            {view === 'decision' ? (
              <motion.div
                key="decision"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                className="absolute inset-0 flex flex-col"
              >

                <div className="pt-20 px-8 pb-8 sm:pt-24 sm:px-12 sm:pb-12 overflow-y-auto custom-scrollbar flex-1 min-h-0">

                  {/* HEADER */}
                  <div className="flex flex-col items-center text-center space-y-6 mb-10">

                    <div className="w-20 h-20 bg-blue-50 text-[#2563EB] rounded-3xl flex items-center justify-center shadow-inner border border-blue-100">
                      <ShieldCheck className="h-10 w-10" />
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic text-center">
                        Legal <span className="text-[#2563EB] not-italic">Agreement</span>
                      </h2>

                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
                        Review & Acceptance Required
                      </p>
                    </div>
                  </div>

                  {/* CARDS */}
                  <div className="grid grid-cols-1 gap-6">

                    {/* CARD 1 */}
                    <div className="flex gap-5 p-5 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all">

                      <div className="shrink-0 w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#2563EB]">
                        <Lock className="h-5 w-5" />
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                          Data Sovereignty
                        </h4>

                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                          All visitor data captured is strictly encrypted and used solely for operational security and verification logs.
                        </p>
                      </div>
                    </div>

                    {/* CARD 2 */}
                    <div className="flex gap-5 p-5 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all">

                      <div className="shrink-0 w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
                        <Eye className="h-5 w-5" />
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                          Privacy Guard
                        </h4>

                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                          We maintain a zero-leak policy. Personal information is never shared with third-party aggregators without consent.
                        </p>
                      </div>
                    </div>

                    {/* CARD 3 */}
                    <div className="flex gap-5 p-5 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all">

                      <div className="shrink-0 w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                        <ScrollText className="h-5 w-5" />
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                          Operating Terms
                        </h4>

                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                          By entering the workspace, you agree to follow the established check-in/out protocols and maintain record integrity.
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* TERMS TEXT */}
                  <div className="mt-10 p-6 bg-slate-50 rounded-2xl border border-slate-100">

                    <div className="text-[10px] font-bold text-slate-400 text-center leading-loose uppercase tracking-widest">

                      BY CLICKING BELOW, YOU AGREE TO OUR <br />

                      <button
                        onClick={() => setView('privacy')}
                        className="text-[#2563EB] hover:text-blue-700 font-extrabold transition-colors border-b border-[#2563EB]/40 mx-1 cursor-pointer"
                      >
                        PRIVACY POLICY
                      </button>

                      AND

                      <button
                        onClick={() => setView('terms')}
                        className="text-[#2563EB] hover:text-blue-700 font-extrabold transition-colors border-b border-[#2563EB]/40 mx-1 cursor-pointer"
                      >
                        TERMS OF SERVICE
                      </button>

                    </div>
                  </div>

                </div>

                {/* BUTTON */}
                <div className="p-8 sm:p-10 bg-slate-50 border-t border-slate-100">

                  <button
                    onClick={onAccept}
                    className="w-full py-6 bg-[#2563EB] hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-500/10 active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-[11px]"
                  >
                    I Accept Legal Conditions

                    <ArrowRight className="h-4 w-4 text-white" />
                  </button>

                </div>

              </motion.div>

            ) : (

              /* ================================================= */
              /* PRIVACY / TERMS PAGE */
              /* ================================================= */

              <motion.div
                key="content"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="absolute inset-0 flex flex-col bg-white z-10"
              >

                {/* TOP BAR */}
                <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">

                  <button
                    onClick={() => setView('decision')}
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-950 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />

                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Back
                    </span>
                  </button>

                  <div className="text-right">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight italic">
                      {view === 'privacy'
                        ? 'Privacy'
                        : 'Terms'}{' '}
                      <span className="text-[#2563EB] not-italic">
                        Agreement
                      </span>
                    </h3>
                  </div>

                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto p-8 sm:p-10 custom-scrollbar min-h-0">

                  {view === 'privacy' ? (
                    <PrivacyPolicy organizationName={organizationName} />
                  ) : (
                    <TermsOfService />
                  )}

                </div>

                {/* FOOTER */}
                <div className="p-6 bg-slate-50 border-t border-slate-100">

                  <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-[0.2em]">

                    Security Verification Document Ref:{' '}
                    {view === 'privacy'
                      ? 'VMS-P-024'
                      : 'VMS-T-024'}

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
