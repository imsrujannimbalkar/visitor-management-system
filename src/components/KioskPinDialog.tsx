import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShieldAlert, X, ChevronRight, Delete, ShieldCheck, AlertCircle } from 'lucide-react';

interface KioskPinDialogProps {
  mode: 'ENTER' | 'EXIT' | 'SETUP';
  onConfirm: (pin: string) => void;
  onCancel: () => void;
  correctPin?: string;
  isOpen: boolean;
}

export const KioskPinDialog: React.FC<KioskPinDialogProps> = ({ mode, onConfirm, onCancel, correctPin, isOpen }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    if (isOpen) {
      setPin(['', '', '', '']);
      setError(false);
      setTimeout(() => inputRefs[0].current?.focus(), 100);
    }
  }, [isOpen]);

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError(false);

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    if (e.key === 'Enter' && pin.every(d => d !== '')) {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const enteredPin = pin.join('');
    if (enteredPin.length < 4) return;

    if (mode !== 'SETUP' && correctPin && enteredPin !== correctPin) {
      setError(true);
      setPin(['', '', '', '']);
      inputRefs[0].current?.focus();
      return;
    }

    onConfirm(enteredPin);
  };

  const handleKeypadPress = (num: string) => {
    const nextEmptyIndex = pin.findIndex(d => d === '');
    if (nextEmptyIndex !== -1) {
      handleInputChange(nextEmptyIndex, num);
    }
  };

  const handleKeypadDelete = () => {
    const lastFilledIndex = [...pin].reverse().findIndex(d => d !== '');
    if (lastFilledIndex !== -1) {
      const actualIndex = 3 - lastFilledIndex;
      const newPin = [...pin];
      newPin[actualIndex] = '';
      setPin(newPin);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col items-center p-8 text-center"
          >
            {/* Header Icon */}
            <div className={`h-20 w-20 rounded-full flex items-center justify-center mb-6 ${
              mode === 'EXIT' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'
            }`}>
              {mode === 'SETUP' ? <ShieldCheck className="h-10 w-10" /> : <Lock className="h-10 w-10" />}
            </div>

            {/* Title & Description */}
            <h2 className="text-2xl font-black text-slate-900 mb-2">
              {mode === 'ENTER' && 'Enter Kiosk PIN'}
              {mode === 'EXIT' && 'Exit Kiosk Mode'}
              {mode === 'SETUP' && 'Set Up Kiosk PIN'}
            </h2>
            <p className="text-slate-500 text-sm mb-8 px-4 leading-relaxed">
              {mode === 'ENTER' && 'Enter your 4-digit PIN to access Kiosk Mode.'}
              {mode === 'EXIT' && 'Enter your administrator PIN to exit Kiosk Mode.'}
              {mode === 'SETUP' && 'Create a 4-digit PIN to secure Kiosk Mode.'}
            </p>

            {/* PIN Inputs */}
            <div className="flex gap-3 mb-8">
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={inputRefs[i]}
                  type="password"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleInputChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={`w-14 h-16 bg-slate-50 border-2 rounded-2xl text-center text-2xl font-black transition-all ${
                    error ? 'border-red-200 bg-red-50 text-red-600' :
                    digit ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-900 focus:border-blue-400 focus:bg-white'
                  } focus:outline-none shadow-sm`}
                />
              ))}
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-widest"
                >
                  <AlertCircle className="h-4 w-4" />
                  Incorrect PIN. Please try again.
                </motion.div>
              )}
            </AnimatePresence>

            {/* Numeric Keypad (for SETUP or optional for others) */}
            {mode === 'SETUP' && (
              <div className="w-full grid grid-cols-3 gap-3 mb-8">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0'].map((num, i) => (
                  num === '' ? <div key={i} /> : (
                    <button
                      key={i}
                      onClick={() => handleKeypadPress(num)}
                      className="h-14 bg-white border border-slate-100 rounded-2xl font-black text-xl text-slate-800 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
                    >
                      {num}
                    </button>
                  )
                ))}
                <button
                  onClick={handleKeypadDelete}
                  className="h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-800 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
                >
                  <Delete className="h-6 w-6" />
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="w-full space-y-3">
              <button
                disabled={pin.some(d => d === '')}
                onClick={handleSubmit}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-shadow shadow-lg ${
                  pin.some(d => d === '') 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : mode === 'EXIT' 
                      ? 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700' 
                      : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700'
                }`}
              >
                {mode === 'ENTER' && 'Enter Kiosk'}
                {mode === 'EXIT' && 'Exit to Dashboard'}
                {mode === 'SETUP' && 'Set PIN'}
              </button>
              
              <button
                onClick={onCancel}
                className="w-full py-4 rounded-2xl font-black bg-slate-50 text-slate-500 uppercase tracking-widest text-xs hover:bg-slate-100 transition-colors"
              >
                {mode === 'EXIT' ? 'Stay in Kiosk' : 'Cancel'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface PinNotSetNotificationProps {
  isVisible: boolean;
  onAction: () => void;
}

export const PinNotSetNotification: React.FC<PinNotSetNotificationProps> = ({ isVisible, onAction }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[5000] w-full max-w-lg px-4"
        >
          <button 
            onClick={onAction}
            className="w-full bg-red-50/80 backdrop-blur-md border border-red-100 rounded-3xl p-6 flex items-center justify-between group shadow-xl shadow-red-500/10 hover:shadow-2xl hover:shadow-red-500/20 transition-all text-left"
          >
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform">
                <ShieldAlert className="h-7 w-7 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 leading-tight">Kiosk PIN not set</h4>
                <p className="text-slate-500 font-bold text-sm tracking-tight opacity-80 decoration-red-500 decoration-2">Set a PIN to use Kiosk Mode for your security.</p>
              </div>
            </div>
            <div className="h-10 w-10 rounded-full flex items-center justify-center text-red-500 group-hover:translate-x-1 transition-transform">
              <ChevronRight className="h-6 w-6" />
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
