import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, X, MessageSquare, Send, ThumbsUp, ThumbsDown, Zap, Layout, UserCheck, Heart } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { AppFeedback } from '../types';
import { useToast } from './Toast';

interface AppFeedbackModalProps {
  onClose: () => void;
  userId?: string;
  organizationId?: string;
}

export default function AppFeedbackModal({ onClose, userId, organizationId }: AppFeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [step, setStep] = useState(1);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    uiRating: 3,
    speedRating: 3,
    featureRating: 3,
    frustration: '',
    missingFeature: ''
  });

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Safety check: Don't submit if we're not on the final step
    if (step < 2) {
      nextStep();
      return;
    }

    if (rating === 0) {
      setStep(1);
      return;
    }

    if (!formData.frustration.trim() || !formData.missingFeature.trim()) {
      showToast('Please fill out all fields on this step.', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const feedbackData: Omit<AppFeedback, 'id'> = {
        userId: userId || 'anonymous',
        organizationId: organizationId || 'system',
        rating,
        ...formData,
        timestamp: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'appFeedback'), feedbackData);
      showToast('Feedback submitted! Thank you for helping us grow.', 'success');
      setIsSuccess(true);
      // We removed the automatic onClose to allow user to see success state
    } catch (error) {

      showToast('Transmission error. Feedback not captured.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (rating === 0) {
        showToast('Please select an overall rating to continue.', 'error');
        return;
      }
    }
    setStep(prev => prev + 1);
  };
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9000] flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2rem] sm:rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/20 max-h-[95vh] flex flex-col"
      >
        <div className="relative p-6 sm:p-14 overflow-y-auto custom-scrollbar">
          {/* Header - Hidden on success */}
          {!isSuccess && (
            <div className="flex justify-between items-start mb-6 sm:mb-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2 sm:gap-3 text-brand-blue mb-2">
                  <div className="p-1.5 sm:p-2 bg-brand-blue/10 rounded-lg">
                    <Heart className="h-3 w-3 sm:h-4 sm:w-4 fill-brand-blue" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] leading-none">Feedback Hub</span>
                </div>
                <h3 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">
                  Help Us <span className="text-brand-blue not-italic">Improve</span>
                </h3>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-[9px] sm:text-[10px] uppercase tracking-widest mt-1">
                  Phase {step} of 2 • Quality Audit
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 sm:p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all text-slate-400 active:scale-90"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            <AnimatePresence mode="wait">
              {isSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-10 sm:py-24 text-center"
                  >
                    <div className="w-20 h-20 sm:w-28 sm:h-28 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-8 sm:mb-10 shadow-[0_20px_50px_-10px_rgba(16,185,129,0.3)]">
                      <Heart className="h-10 w-10 sm:h-14 sm:w-14 fill-emerald-500" />
                    </div>
                    <h3 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-3 italic">
                      Feedback <span className="text-emerald-500 not-italic">Captured!</span>
                    </h3>
                    <div className="mt-12 sm:mt-16">
                      <button
                        onClick={onClose}
                        className="px-12 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-emerald-200"
                      >
                        Return to Workspace
                      </button>
                    </div>
                  </motion.div>
              ) : step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 sm:space-y-10"
                >
                  <div className="flex flex-col items-center gap-4 sm:gap-6 p-6 sm:p-10 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] sm:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-inner">
                    <p className="text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">
                      Global Experience Rating
                    </p>
                    <div className="flex items-center gap-2 sm:gap-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHover(star)}
                          onMouseLeave={() => setHover(0)}
                          className="p-1 transition-all hover:scale-125 active:scale-90"
                        >
                          <Star
                            className={`h-7 w-7 sm:h-14 sm:w-14 transition-all duration-300 ${
                              star <= (hover || rating)
                                ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]'
                                : 'text-slate-200 dark:text-slate-700'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
                    <div className="space-y-4 p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <label className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        <Layout className="h-3 w-3 text-brand-blue" /> Aesthetics
                      </label>
                      <input 
                        type="range" min="1" max="5" 
                        value={formData.uiRating}
                        onChange={(e) => setFormData({...formData, uiRating: parseInt(e.target.value)})}
                        className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-blue" 
                      />
                      <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                        <span>Lame</span>
                        <span>Fire</span>
                      </div>
                    </div>
                    <div className="space-y-4 p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <label className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        <Zap className="h-3 w-3 text-brand-blue" /> Speed
                      </label>
                      <input 
                        type="range" min="1" max="5" 
                        value={formData.speedRating}
                        onChange={(e) => setFormData({...formData, speedRating: parseInt(e.target.value)})}
                        className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-blue" 
                      />
                      <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                        <span>Slow</span>
                        <span>Instant</span>
                      </div>
                    </div>
                    <div className="space-y-4 p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <label className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        <UserCheck className="h-3 w-3 text-brand-blue" /> Value
                      </label>
                      <input 
                        type="range" min="1" max="5" 
                        value={formData.featureRating}
                        onChange={(e) => setFormData({...formData, featureRating: parseInt(e.target.value)})}
                        className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-blue" 
                      />
                      <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                        <span>Low</span>
                        <span>Essential</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">
                      The biggest pain point?
                    </label>
                    <textarea
                      value={formData.frustration}
                      onChange={(e) => setFormData({...formData, frustration: e.target.value})}
                      placeholder="e.g. Navigation is slow, form is too long..."
                      className="w-full px-6 py-5 sm:px-8 sm:py-6 bg-slate-50 dark:bg-slate-800 border-none rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-brand-blue/10 min-h-[120px] font-medium text-slate-700 dark:text-slate-200 text-sm"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">
                      Desperately missing feature?
                    </label>
                    <textarea
                      value={formData.missingFeature}
                      onChange={(e) => setFormData({...formData, missingFeature: e.target.value})}
                      placeholder="e.g. Export to PDF, dark mode fixes..."
                      className="w-full px-6 py-5 sm:px-8 sm:py-6 bg-slate-50 dark:bg-slate-800 border-none rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-brand-blue/10 min-h-[120px] font-medium text-slate-700 dark:text-slate-200 text-sm"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!isSuccess && (
              <div className="flex gap-4 pt-4">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]"
                  >
                    Back
                  </button>
                )}
                {step < 2 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-[2] py-5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black rounded-2xl hover:bg-black dark:hover:bg-slate-100 transition-all shadow-xl active:scale-95 uppercase tracking-widest text-[10px]"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] py-5 bg-brand-blue text-white font-black rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-widest text-[10px]"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Submit Final Review
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
