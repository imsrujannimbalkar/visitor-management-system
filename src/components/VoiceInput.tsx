import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

interface VoiceInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange: (value: string) => void;
  icon?: React.ReactNode;
}

export default function VoiceInput({ onValueChange, value, className, list, icon, ...props }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const valueRef = useRef(value);
  const onValueChangeRef = useRef(onValueChange);

  // Keep refs in sync
  useEffect(() => {
    valueRef.current = value;
    onValueChangeRef.current = onValueChange;
  }, [value, onValueChange]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const currentValue = valueRef.current ? String(valueRef.current) : '';
        const newValue = currentValue ? `${currentValue} ${transcript}` : transcript;
        onValueChangeRef.current(newValue);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setPermissionError('denied');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []); // Run once on mount

  const toggleListening = useCallback(async () => {
    if (!recognitionRef.current) {
      setPermissionError('unsupported');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setPermissionError(null);
      try {
        
        // In an iframe, getUserMedia is the most reliable way to trigger the prompt
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        stream.getTracks().forEach(track => track.stop());
        
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e: any) {
        
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError' || e.message?.includes('denied')) {
          setPermissionError('denied');
        } else if (e.name === 'NotFoundError') {
          setPermissionError('no-mic');
        } else {
          setPermissionError('error');
        }
        setIsListening(false);
      }
    }
  }, [isListening]);

  return (
    <div className="relative w-full group">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none transition-colors">
          {icon}
        </div>
      )}
      <input
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={`${className} ${icon ? 'pl-14' : ''} pr-12`}
        list={list}
        {...props}
      />
      {recognitionRef.current && (
        <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
          <AnimatePresence>
            {permissionError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 10 }}
                className="absolute right-full mr-3 bg-white border border-rose-100 shadow-xl rounded-xl p-3 min-w-[240px] z-50 pointer-events-auto"
              >
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-rose-50 rounded-lg shrink-0">
                    <AlertCircle className="h-4 w-4 text-rose-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-rose-900 leading-tight">
                      {permissionError === 'denied' 
                        ? "Microphone access is blocked. Please enable it in your browser settings or try a new tab."
                        : permissionError === 'no-mic'
                        ? "No microphone detected. Please check your hardware."
                        : permissionError === 'unsupported'
                        ? "Voice typing is not supported in this browser. Try Chrome or Edge."
                        : "An error occurred with voice typing."}
                    </p>
                    <button 
                      onClick={() => setPermissionError(null)}
                      className="mt-2 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-700 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            key="mic-button"
            type="button"
            onClick={toggleListening}
            className={`p-2 rounded-full transition-all duration-300 ${
              isListening ? 'text-red-500 bg-red-50 scale-110' : 'text-gray-400 hover:text-brand-blue hover:bg-blue-50'
            }`}
            title={isListening ? "Stop listening" : "Start voice typing"}
          >
            {isListening ? (
              <div className="relative">
                <MicOff className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              </div>
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
