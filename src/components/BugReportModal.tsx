import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Bug, 
  Mail, 
  Send, 
  Paperclip, 
  AlertTriangle, 
  Terminal, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Activity
} from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { BugReport } from '../types';
import { useToast } from './Toast';

interface BugReportModalProps {
  onClose: () => void;
  userId?: string;
  organizationId?: string;
}

export default function BugReportModal({ onClose, userId, organizationId }: BugReportModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    steps: '',
    expected: '',
    actual: '',
    severity: 'minor' as 'ui' | 'minor' | 'major' | 'critical',
    email: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const reportData: Omit<BugReport, 'id'> = {
        userId,
        organizationId,
        ...formData,
        timestamp: new Date().toISOString(),
        status: 'OPEN'
      };

      if (file) {
        console.log('File attached:', file.name);
      }

      await addDoc(collection(db, 'bugReports'), reportData);
      showToast('Intelligence report submitted successfully', 'success');
      setIsSuccess(true);
    } catch (error) {
      console.error('Error submitting bug report:', error);
      showToast('Failed to transmit report. Data corruption detected.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20"
      >
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center px-10"
            >
              <div className="w-28 h-28 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-10 shadow-inner">
                <CheckCircle2 className="h-14 w-14" />
              </div>
              <h3 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4 italic">
                Report <span className="text-rose-500 not-italic">Synchronized!</span>
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-widest max-w-[300px]">
                Our intelligence team has received the data package and will begin analysis immediately.
              </p>
              <div className="mt-16">
                <button
                  onClick={onClose}
                  className="px-12 py-5 bg-rose-500 hover:bg-rose-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-rose-200 dark:shadow-none"
                >
                  Return to Dashboard
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="relative flex flex-col h-[85vh] max-h-[800px]">
              {/* Header */}
              <div className="p-8 sm:p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/20">
                    <Bug className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">
                      Bug <span className="text-rose-500 not-italic">Report</span>
                    </h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">
                      System Stability & Quality Desk
                    </p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-all text-slate-400 active:scale-90"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-8 sm:p-10 custom-scrollbar">
                <form id="bug-report-form" onSubmit={handleSubmit} className="space-y-10">
                  {/* Basic Info */}
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                        Problem Summary
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder="Briefly describe the issue..."
                        className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-rose-500/30 focus:bg-white dark:focus:bg-slate-800 rounded-2xl outline-none transition-all font-bold text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                          Your Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            required
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            placeholder="For follow-up questions"
                            className="w-full pl-14 pr-8 py-5 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-rose-500/30 focus:bg-white dark:focus:bg-slate-800 rounded-2xl outline-none transition-all font-bold text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                          Severity Level
                        </label>
                        <select
                          value={formData.severity}
                          onChange={(e) => setFormData({...formData, severity: e.target.value as 'ui' | 'minor' | 'major' | 'critical'})}
                          className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-rose-500/30 focus:bg-white dark:focus:bg-slate-800 rounded-2xl outline-none transition-all font-black uppercase text-xs tracking-widest text-slate-900 dark:text-white appearance-none"
                        >
                          <option value="ui">UI/Visual Glitch</option>
                          <option value="minor">Minor Functionality</option>
                          <option value="major">Major Breaking Bug</option>
                          <option value="critical">Critical / Crash</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Technical Details */}
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                        <Terminal className="h-4 w-4" /> Steps to Reproduce
                      </label>
                      <textarea
                        required
                        value={formData.steps}
                        onChange={(e) => setFormData({...formData, steps: e.target.value})}
                        placeholder="1. Go to settings... 2. Click on... 3. See what happens..."
                        rows={3}
                        className="w-full px-8 py-6 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-rose-500/30 focus:bg-white dark:focus:bg-slate-800 rounded-[2rem] outline-none transition-all font-medium text-slate-700 dark:text-slate-200 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1 text-emerald-500">
                          <CheckCircle2 className="h-4 w-4" /> Expected Behavior
                        </label>
                        <textarea
                          value={formData.expected}
                          onChange={(e) => setFormData({...formData, expected: e.target.value})}
                          placeholder="What should have happened?"
                          rows={2}
                          className="w-full px-8 py-6 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-rose-500/30 focus:bg-white dark:focus:bg-slate-800 rounded-[1.5rem] outline-none transition-all font-medium text-slate-700 dark:text-slate-200 resize-none"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1 text-rose-500">
                          <AlertCircle className="h-4 w-4" /> Actual Behavior
                        </label>
                        <textarea
                          value={formData.actual}
                          onChange={(e) => setFormData({...formData, actual: e.target.value})}
                          placeholder="What actually occurred?"
                          rows={2}
                          className="w-full px-8 py-6 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-rose-500/30 focus:bg-white dark:focus:bg-slate-800 rounded-[1.5rem] outline-none transition-all font-medium text-slate-700 dark:text-slate-200 resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Attachment */}
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Attachments (Optional)
                    </label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="group cursor-pointer p-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-rose-500/40 hover:bg-rose-50/20 transition-all bg-slate-50/30"
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        onChange={handleFileChange}
                        accept="image/*"
                      />
                      <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-slate-400 group-hover:text-rose-500 group-hover:scale-110 transition-all">
                        {file ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> : <Paperclip className="h-6 w-6" />}
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                          {file ? file.name : "Attach a screenshot"}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          Max file size: 5MB
                        </p>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="p-8 sm:p-10 border-t border-slate-100 dark:border-slate-800 flex gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px] border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="bug-report-form"
                  disabled={isSubmitting}
                  className="flex-[2] py-5 bg-rose-500 text-white font-black rounded-2xl hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-widest text-[10px]"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Intelligence Report
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
