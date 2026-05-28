import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, X, ChevronRight, Delete, AlertCircle, LogOut } from 'lucide-react';

interface KioskPhoneDialogProps {
  isOpen: boolean;
  onConfirm: (phone: string) => void;
  onCancel: () => void;
  lang: 'EN' | 'HI';
}

export const KioskPhoneDialog: React.FC<KioskPhoneDialogProps> = ({ isOpen, onConfirm, onCancel, lang }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  
  useEffect(() => {
    if (isOpen) {
      setPhoneNumber('');
    }
  }, [isOpen]);

  // Keyboard Support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeypadPress(e.key);
      } else if (e.key === 'Backspace') {
        handleKeypadDelete();
      } else if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, phoneNumber]);

  const handleKeypadPress = (num: string) => {
    if (phoneNumber.length < 10) {
      setPhoneNumber(prev => prev + num);
    }
  };

  const handleKeypadDelete = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (phoneNumber.length >= 10) {
      onConfirm(phoneNumber);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm flex flex-col items-center p-6 sm:p-8 text-center my-auto relative"
          >
            {/* Close Button for mouse users */}
            <button 
              onClick={onCancel}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Content Container (Scrollable if needed) */}
            <div className="w-full flex flex-col items-center">
              {/* Header Icon */}
              <div className="h-20 w-20 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                <LogOut className="h-10 w-10" />
              </div>

              {/* Title & Description */}
              <h2 className="text-2xl font-black text-slate-900 mb-2">
                {lang === 'HI' ? 'चेक आउट' : 'Check Out'}
              </h2>
              <p className="text-slate-500 text-sm mb-8 px-4 leading-relaxed">
                {lang === 'HI' 
                  ? 'चेक आउट करने के लिए अपना फोन नंबर दर्ज करें।' 
                  : 'Enter your phone number to complete check-out.'}
              </p>

              {/* Phone Display */}
              <div className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 mb-8">
                <div className="flex items-center justify-center gap-2 text-3xl font-black text-slate-900 tracking-wider h-10">
                  {phoneNumber || (
                    <span className="text-slate-300 font-medium text-lg italic tracking-normal">
                      {lang === 'HI' ? 'फोन नंबर' : 'Phone Number'}
                    </span>
                  )}
                  {phoneNumber && (
                    <motion.div 
                      animate={{ opacity: [1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                      className="w-1 h-8 bg-blue-500 rounded-full"
                    />
                  )}
                </div>
              </div>

              {/* Numeric Keypad */}
              <div className="w-full grid grid-cols-3 gap-3 mb-8">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0'].map((num, i) => (
                  num === '' ? <div key={i} /> : (
                    <button
                      key={i}
                      onClick={() => handleKeypadPress(num)}
                      className="h-14 bg-white border border-slate-100 rounded-2xl font-black text-xl text-slate-800 hover:bg-slate-50 hover:border-blue-200 active:scale-95 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {num}
                    </button>
                  )
                ))}
                <button
                  onClick={handleKeypadDelete}
                  className="h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-800 hover:bg-slate-50 hover:border-red-200 active:scale-95 transition-all shadow-sm focus:outline-none"
                >
                  <Delete className="h-6 w-6" />
                </button>
              </div>

              {/* Actions */}
              <div className="w-full space-y-3">
                <button
                  disabled={phoneNumber.length < 10}
                  onClick={handleSubmit}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg flex items-center justify-center gap-2 ${
                    phoneNumber.length < 10 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5'
                  }`}
                >
                  {lang === 'HI' ? 'अपुष्ट करें' : 'Confirm Check Out'}
                  <ChevronRight className="h-4 w-4" />
                </button>
                
                <button
                  onClick={onCancel}
                  className="w-full py-4 rounded-2xl font-black bg-slate-50 text-slate-500 uppercase tracking-widest text-xs hover:bg-slate-100 transition-colors"
                >
                  {lang === 'HI' ? 'रद्द करें' : 'Cancel'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
