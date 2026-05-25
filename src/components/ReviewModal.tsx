import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Star, X, MessageSquare, Send, ExternalLink, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';

interface ReviewModalProps {
  visitorName: string;
  visitorId: string;
  googleReviewUrl?: string;
  onClose: () => void;
  onSave: (rating: number, comment: string) => void;
  lang?: 'EN' | 'HI';
  isMandatory?: boolean;
}

export default function ReviewModal({ 
  visitorName, 
  visitorId, 
  googleReviewUrl, 
  onClose, 
  onSave, 
  lang = 'EN',
  isMandatory = false 
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = {
    EN: {
      title: "How was your visit?",
      subtitle: `We'd love to hear your feedback, ${visitorName}!`,
      ratingLabel: rating === 0 ? 'Select a rating' : `${rating} out of 5 stars`,
      commentLabel: "Your Comments (Optional)",
      commentPlaceholder: "Tell us about your experience...",
      submit: "Submit Review",
      google: "Post to Google",
      skip: "Skip / No Thanks",
      submitting: "Submitting...",
      errorTitle: "Wait a moment",
      errorMessage: "Please select a star rating before submitting.",
      errorOk: "Got it"
    },
    HI: {
      title: "आपकी यात्रा कैसी रही?",
      subtitle: `हमें आपकी प्रतिक्रिया सुनना अच्छा लगेगा, ${visitorName}!`,
      ratingLabel: rating === 0 ? 'रेटिंग चुनें' : `5 में से ${rating} स्टार`,
      commentLabel: "आपकी टिप्पणियाँ (वैकल्पिक)",
      commentPlaceholder: "हमें अपने अनुभव के बारे में बताएं...",
      submit: "समीक्षा भेजें",
      google: "गूगल पर पोस्ट करें",
      skip: "छोड़ें / धन्यवाद नहीं",
      submitting: "भेज रहा है...",
      errorTitle: "एक क्षण ठहरें",
      errorMessage: "सबमिट करने से पहले कृपया स्टार रेटिंग चुनें।",
      errorOk: "ठीक है"
    }
  }[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError(t.errorMessage);
      Swal.fire({
        title: t.errorTitle,
        text: t.errorMessage,
        icon: 'warning',
        confirmButtonText: t.errorOk,
        confirmButtonColor: '#2563EB',
        customClass: {
          popup: 'rounded-[2rem]',
          confirmButton: 'rounded-xl font-black uppercase tracking-widest px-8 py-3'
        }
      });
      return;
    }
    
    setError(null);
    setIsSubmitting(true);
    await onSave(rating, comment);
    setIsSubmitting(false);
  };

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[11000] flex items-start justify-center pt-10 pb-10 px-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 shrink-0 flex flex-col relative"
      >
        <div className="p-6 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto custom-scrollbar flex-1">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{t.title}</h3>
              <p className="text-gray-500 dark:text-slate-400 font-bold text-sm">{t.subtitle}</p>
            </div>
            {!isMandatory && (
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-gray-400"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                        setRating(star);
                        setError(null);
                    }}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="p-1 transition-transform active:scale-90"
                  >
                    <Star
                      className={`h-10 w-10 transition-colors ${
                        star <= (hover || rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-200 dark:text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className={`text-xs font-black uppercase tracking-widest ${error ? 'text-rose-500 animate-pulse' : 'text-gray-400'}`}>
                {error || t.ratingLabel}
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                <MessageSquare className="h-3 w-3" />
                {t.commentLabel}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t.commentPlaceholder}
                className="w-full px-6 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 transition-all outline-none font-bold text-gray-900 dark:text-white shadow-sm resize-none"
                rows={3}
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-bold"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </motion.div>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-brand-blue text-white font-black rounded-2xl hover:bg-brand-blue/90 transition-all shadow-xl shadow-blue-100 dark:shadow-none active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-[0.2em] text-xs"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {t.submit}
                  </>
                )}
              </button>

              {!!googleReviewUrl && (
                <a
                  href={googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 font-black rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t.google}
                </a>
              )}

              {!isMandatory && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 text-gray-400 dark:text-slate-500 font-bold text-xs hover:text-gray-600 dark:hover:text-slate-300 transition-colors uppercase tracking-widest"
                >
                  {t.skip}
                </button>
              )}
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
