import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, Flashlight, FlashlightOff, RefreshCw } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRCheckOutScannerProps {
  onScan: (passId: string) => void;
  lang?: 'EN' | 'HI';
  className?: string;
  customTrigger?: React.ReactNode;
}

export const QRCheckOutScanner: React.FC<QRCheckOutScannerProps> = ({ onScan, lang = 'EN', className, customTrigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanFail, setScanFail] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const scanFailRef = useRef(false);
  const scanSuccessRef = useRef(false);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let unmounted = false;
    
    const startScanner = async () => {
      if (isOpen && !scannerRef.current) {
         try {
           setCameraError(null);
           startTimeRef.current = Date.now();
           scannerRef.current = new Html5Qrcode("qr-reader");
           await scannerRef.current.start(
             { facingMode: facingMode },
             { fps: 10, qrbox: { width: 250, height: 250 } },
             (decodedText) => {
                if (unmounted) return;
                
                const handleScanSuccess = (result: string) => {
                  setScanSuccess(true);
                  scanSuccessRef.current = true;
                  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                    navigator.vibrate([100, 50, 100]);
                  }
                  setTimeout(() => {
                    if (!unmounted) {
                      onScan(result);
                      setIsOpen(false);
                      setScanSuccess(false);
                      scanSuccessRef.current = false;
                      setFlashEnabled(false);
                    }
                  }, 400);
                };

                try {
                  const url = new URL(decodedText);
                  const passId = url.searchParams.get('passId');
                  if (passId) {
                    handleScanSuccess(passId);
                  }
                } catch (e) {
                  if (decodedText && decodedText.length > 5) {
                    handleScanSuccess(decodedText);
                  }
                }
             },
             () => {
               if (unmounted) return;
               if (!scanSuccessRef.current && !scanFailRef.current) {
                 if (startTimeRef.current && Date.now() - startTimeRef.current > 5000) {
                   setScanFail(true);
                   scanFailRef.current = true;
                   if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                     navigator.vibrate(50);
                   }
                   setTimeout(() => {
                     if (!unmounted) {
                       setScanFail(false);
                       scanFailRef.current = false;
                       startTimeRef.current = Date.now();
                     }
                   }, 500);
                 }
               }
             }
           );
           
           if (!unmounted) {
             isScanningRef.current = true;
           } else {
             try {
               await scannerRef.current.stop();
               scannerRef.current.clear();
             } catch (e) {
               console.error("Cleanup stop failed", e);
             }
             scannerRef.current = null;
             isScanningRef.current = false;
           }
         } catch (err: any) {
           console.error("Failed to start QR scanner:", err);
           if (!unmounted) {
             const errMsg = err?.message || String(err);
             setCameraError(errMsg);
           }
         }
      }
    };
    
    if (isOpen) {
      setTimeout(startScanner, 100);
    }

    return () => {
      unmounted = true;
      if (scannerRef.current) {
        if (isScanningRef.current) {
          scannerRef.current.stop().then(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
            isScanningRef.current = false;
          }).catch(err => {
            console.error("Failed to stop scanner", err);
            scannerRef.current = null;
            isScanningRef.current = false;
          });
        } else {
          try {
             scannerRef.current.clear();
          } catch (e) {
             console.error("Clear failed", e);
          }
          scannerRef.current = null;
        }
      }
    };
  }, [isOpen, onScan, facingMode]);

  const toggleTorch = async () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ torch: !flashEnabled } as any]
        });
        setFlashEnabled(!flashEnabled);
      } catch (err) {
        console.error("Torch toggle failed:", err);
      }
    }
  };

  const toggleCamera = async () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    setFlashEnabled(false);
  };

  const handleRetry = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
      } catch (e) {}
      scannerRef.current = null;
    }
    isScanningRef.current = false;
    setCameraError(null);
    // Restart scanner
    setIsOpen(false);
    setTimeout(() => setIsOpen(true), 150);
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)} className={className || "cursor-pointer"}>
        {customTrigger || (
          <button
            className="flex items-center gap-2 px-4 py-2 bg-brand-blue hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/30 transition-all font-sans uppercase tracking-widest text-[10px]"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">
              {lang === 'HI' ? 'स्केन करें' : 'Scan Pass'}
            </span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {lang === 'HI' ? 'क्यूआर कोड स्कैन करें' : 'Scan QR Code'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="aspect-square bg-slate-950 relative overflow-hidden flex flex-col items-center justify-center">
                 {!cameraError ? (
                   <>
                     <div id="qr-reader" className="w-full h-full"></div>
                     <motion.div
                       initial={false}
                       animate={{
                         backgroundColor: scanSuccess ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0)',
                         boxShadow: scanSuccess ? 'inset 0 0 0 8px #22c55e' : 'inset 0 0 0 0px #22c55e'
                       }}
                       className="absolute inset-0 z-20 pointer-events-none"
                     />
                     
                     {/* Scanner Guide Overlay */}
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                       <motion.div 
                         className="w-[250px] h-[250px] relative"
                         animate={scanFail ? { x: [-10, 10, -10, 10, 0] } : {}}
                         transition={{ duration: 0.4 }}
                       >
                         {/* Corner brackets */}
                         <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 rounded-tl-xl transition-colors duration-300 shadow-[inset_0_0_0_0px_rgba(0,0,0,0)]" style={{ borderColor: scanSuccess ? '#22c55e' : scanFail ? '#ef4444' : 'rgba(255,255,255,0.8)' }}></div>
                         <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 rounded-tr-xl transition-colors duration-300" style={{ borderColor: scanSuccess ? '#22c55e' : scanFail ? '#ef4444' : 'rgba(255,255,255,0.8)' }}></div>
                         <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 rounded-bl-xl transition-colors duration-300" style={{ borderColor: scanSuccess ? '#22c55e' : scanFail ? '#ef4444' : 'rgba(255,255,255,0.8)' }}></div>
                         <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 rounded-br-xl transition-colors duration-300" style={{ borderColor: scanSuccess ? '#22c55e' : scanFail ? '#ef4444' : 'rgba(255,255,255,0.8)' }}></div>

                         {/* Animated Scan Line */}
                         {!scanSuccess && (
                           <motion.div 
                             animate={{ top: ['0%', '100%', '0%'] }}
                             transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                             className={`absolute left-0 right-0 h-0.5 z-30 pointer-events-none ${scanFail ? 'bg-red-500/80 shadow-[0_0_10px_2px_rgba(239,68,68,0.6)]' : 'bg-blue-500/80 shadow-[0_0_10px_2px_rgba(59,130,246,0.6)]'}`}
                             style={{ top: '0%' }}
                           />
                         )}
                       </motion.div>
                     </div>

                     <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-4 pointer-events-none z-30">
                          <p className="bg-black/60 text-white inline-block px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider backdrop-blur-md pointer-events-auto shadow-xl">
                            {lang === 'HI' ? 'पास के QR पर कैमरा केंद्रित करें' : 'Point camera at visitor pass QR'}
                          </p>
                          <div className="flex gap-4 pointer-events-auto">
                            <button
                              onClick={toggleTorch}
                              className="p-3 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition-all shadow-xl flex items-center justify-center border border-white/20 hover:scale-105 active:scale-95"
                              title={lang === 'HI' ? 'फ्लैशलाइट टॉगल करें' : 'Toggle Flashlight'}
                            >
                              {flashEnabled ? <Flashlight className="w-5 h-5 text-yellow-400" /> : <FlashlightOff className="w-5 h-5" />}
                            </button>
                            <button
                              onClick={toggleCamera}
                              className="p-3 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition-all shadow-xl flex items-center justify-center border border-white/20 hover:scale-105 active:scale-95"
                              title={lang === 'HI' ? 'कैमरा बदलें' : 'Switch Camera'}
                            >
                              <RefreshCw className={`w-5 h-5 ${facingMode === 'user' ? 'text-blue-400' : ''}`} />
                            </button>
                          </div>
                     </div>
                   </>
                 ) : (
                   <div className="absolute inset-0 bg-slate-900 border border-red-500/20 p-6 flex flex-col justify-between overflow-y-auto text-left">
                     <div className="space-y-4">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center animate-pulse">
                           <Camera className="w-5 h-5 text-red-400" />
                         </div>
                         <div>
                           <h4 className="text-sm font-black text-red-400 uppercase tracking-wider">
                             {lang === 'HI' ? 'कैमरा एक्सेस अवरुद्ध' : 'Camera Blocked / Restricted'}
                           </h4>
                           <span className="text-[10px] font-mono text-slate-500">
                             NotAllowedError / Dismissed
                           </span>
                         </div>
                       </div>

                       <div className="space-y-2.5 text-xs text-slate-300 font-medium leading-relaxed">
                         <p>
                           {lang === 'HI'
                             ? 'सैंडबॉक्स पूर्वावलोकन फ्रेम के अंदर कैमरा अनुमति अस्वीकार या अवरुद्ध है।'
                             : 'Camera permission was dismissed, blocked, or is restricted inside this preview framing:'}
                         </p>
                         
                         <ul className="list-disc pl-5 text-slate-400 space-y-1 text-[11px]">
                           <li>
                             {lang === 'HI' 
                               ? 'अपने ब्राउज़र की एड्रेस बार पर लॉक (ताला) आइकन पर क्लिक करें और कैमरा को Allow / अनुमति दें।' 
                               : 'Click the padlock or settings icon in your browser\'s address bar and set Camera to "Allow".'}
                           </li>
                           <li>
                             {lang === 'HI'
                               ? 'नीचे दिए गए बटन का उपयोग करके एप्लिकेशन को एक नए टैब में खोलें।'
                               : 'Open this application in a new dedicated window/tab to bypass nested iframe restrictions.'}
                           </li>
                         </ul>
                       </div>
                     </div>

                     <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-800">
                       <button
                         onClick={handleRetry}
                         className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-center text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-900/30"
                       >
                         {lang === 'HI' ? 'पुनः प्रयास करें' : 'Grant & Retry Scan'}
                       </button>

                       <a
                         href={window.location.href}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold rounded-xl text-center text-xs uppercase tracking-widest transition-all block"
                       >
                         {lang === 'HI' ? 'नए टैब में खोलें ↗' : 'Open in New Tab ↗'}
                       </a>
                     </div>
                   </div>
                 )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
