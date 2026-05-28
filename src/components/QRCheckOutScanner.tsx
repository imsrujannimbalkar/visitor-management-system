import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, Flashlight, RefreshCw, ShieldCheck, ShieldAlert, Image as ImageIcon } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRCheckOutScannerProps {
  onScan: (passId: string) => void;
  onOpen?: () => void;
  lang?: 'EN' | 'HI';
  className?: string;
  customTrigger?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  collapsed?: boolean;
}

export const QRCheckOutScanner: React.FC<QRCheckOutScannerProps> = ({ 
  onScan, 
  onOpen, 
  lang = 'EN', 
  className = '', 
  customTrigger,
  variant = 'secondary',
  collapsed = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scanSuccess, setScanSuccess] = useState(false);
  const [showScanAgain, setShowScanAgain] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const stoppingRef = useRef(false);
  const scanSuccessRef = useRef(false);
  const startTimeRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && onOpen) {
      onOpen();
    }
  }, [isOpen, onOpen]);

  const stopScanner = async () => {
    if (scannerRef.current && !stoppingRef.current) {
      stoppingRef.current = true;
      try {
        if (isScanningRef.current) {
          await scannerRef.current.stop();
          isScanningRef.current = false;
        }
        // Ensure scanner still exists before clearing UI
        if (scannerRef.current) {
          scannerRef.current.clear();
        }
      } catch (e) {
        console.error("Stop failed gracefully:", e);
      } finally {
        scannerRef.current = null;
        isScanningRef.current = false;
        stoppingRef.current = false;
      }
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
    }
  }, [isOpen]);

  useEffect(() => {
    let unmounted = false;
    
    const startScanner = async () => {
      if (isOpen && !scannerRef.current && !stoppingRef.current) {
         try {
           setCameraError(null);
           startTimeRef.current = Date.now();
           scannerRef.current = new Html5Qrcode("qr-reader");
           await scannerRef.current.start(
             { facingMode: facingMode },
             { fps: 15 }, // Slightly higher FPS for better responsiveness
             (decodedText) => {
                if (unmounted) return;
                
                const handleScanSuccess = (result: string) => {
                  setScanSuccess(true);
                  scanSuccessRef.current = true;
                  setScanMessage(lang === 'HI' ? 'स्कैन सफल!' : 'Scan Successful!');
                  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                    navigator.vibrate([100, 50, 100]);
                  }
                  setTimeout(() => {
                    if (!unmounted) {
                      onScan(result);
                      setIsOpen(false);
                      setScanSuccess(false);
                      setScanMessage(null);
                      scanSuccessRef.current = false;
                      setFlashEnabled(false);
                    }
                  }, 1000); // Shorter success delay
                };

                try {
                  const url = new URL(decodedText);
                  const passId = url.searchParams.get('passId');
                  if (passId) {
                    handleScanSuccess(passId);
                  } else if (decodedText && decodedText.length > 5) {
                    handleScanSuccess(decodedText);
                  }
                } catch (e) {
                  if (decodedText && decodedText.length > 5) {
                    handleScanSuccess(decodedText);
                  }
                }
             },
             () => {
               if (unmounted) return;
               if (!scanSuccessRef.current && !showScanAgain) {
                 if (startTimeRef.current && Date.now() - startTimeRef.current > 5000) { // Reduced to 5s for kiosk efficiency
                   setShowScanAgain(true);
                   if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                     navigator.vibrate(50);
                   }
                 }
               }
             }
           );
           
           if (!unmounted) {
             isScanningRef.current = true;
           } else {
             await stopScanner();
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
      const waitTimer = setTimeout(startScanner, 200);
      return () => {
        clearTimeout(waitTimer);
        unmounted = true;
        stopScanner();
      };
    }

    return () => {
      unmounted = true;
    };
  }, [isOpen, onScan, facingMode, lang]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0 && scannerRef.current) {
      const file = event.target.files[0];
      try {
        setScanMessage(lang === 'HI' ? 'प्रोसेसिंग...' : 'Processing...');
        const result = await scannerRef.current.scanFile(file, true);
        
        setScanSuccess(true);
        scanSuccessRef.current = true;
        setScanMessage(lang === 'HI' ? 'स्कैन सफल!' : 'Scan Successful!');
        setTimeout(() => {
          onScan(result);
          setIsOpen(false);
          setScanSuccess(false);
          setScanMessage(null);
          scanSuccessRef.current = false;
        }, 1000);
      } catch (err) {
        console.error("File scan failed:", err);
        setScanMessage(lang === 'HI' ? 'कोई QR नहीं मिला' : 'No QR Found');
        setTimeout(() => setScanMessage(null), 2000);
      }
    }
  };

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

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    setFlashEnabled(false);
  };

  const handleScanAgain = () => {
    setShowScanAgain(false);
    setScanMessage(lang === 'HI' ? 'स्कैन कर रहा है...' : 'Scanning...');
    setTimeout(() => setScanMessage(null), 1500);
    startTimeRef.current = Date.now();
  };

  const handleRetry = () => {
    setIsOpen(false);
    setTimeout(() => setIsOpen(true), 150);
  };

  const getButtonStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30 w-full py-4 rounded-2xl';
      case 'secondary':
        return 'bg-brand-blue hover:bg-blue-700 text-white shadow-blue-600/30 px-6 py-2.5 rounded-2xl';
      case 'ghost':
        return 'bg-slate-50 hover:bg-slate-100 text-slate-600 px-4 py-2 rounded-xl border border-slate-100';
      case 'icon':
        return 'p-3 bg-brand-blue hover:bg-blue-700 text-white rounded-2xl shadow-lg';
      default:
        return 'bg-brand-blue hover:bg-blue-700 text-white px-6 py-2.5 rounded-2xl';
    }
  };

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)} 
        className={`${className} cursor-pointer inline-block`}
      >
        {customTrigger || (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center justify-center gap-2 font-bold shadow-lg transition-all font-sans uppercase tracking-widest text-[10px] ${getButtonStyles()}`}
            title={lang === 'HI' ? 'क्यूआर कोड स्कैन करें' : 'Scan QR Code'}
          >
            <Camera className={variant === 'icon' ? 'w-6 h-6' : 'w-4 h-4'} />
            {variant !== 'icon' && !collapsed && (
              <span className="hidden sm:inline">
                {lang === 'HI' ? 'स्केन करें' : 'Scan Pass'}
              </span>
            )}
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[6000] flex items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-2xl h-[100dvh] md:h-auto md:max-h-[95vh] md:rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 lg:p-8 shrink-0">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-blue-50 flex items-center justify-center text-brand-blue shrink-0">
                    <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                      {lang === 'HI' ? 'क्यूआर कोड स्कैन करें' : 'Scan QR Code'}
                    </h3>
                    <p className="text-slate-400 text-[10px] sm:text-xs font-medium mt-0.5">
                      {lang === 'HI' ? 'स्कैन करने के लिए क्यूआर कोड को फ्रेम में रखें' : 'Align the QR code within the frame to scan'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-all"
                >
                  <X className="w-6 h-6 sm:w-7 sm:h-7" />
                </button>
              </div>

              {/* Viewport Container */}
              <div className="flex-1 flex flex-col min-h-0 bg-white">
                <div className="px-4 sm:px-8 flex-1 flex flex-col justify-center min-h-0 py-2 sm:py-4">
                  <div className="w-full max-w-[480px] mx-auto aspect-square bg-[#4a4a4a] rounded-[2rem] sm:rounded-[2.5rem] relative overflow-hidden shadow-2xl flex flex-col items-center justify-center min-h-[250px]">
                    {!cameraError ? (
                      <>
                        <div id="qr-reader" className="w-full h-full"></div>
                        
                        {/* Overlay Elements */}
                        <div className="absolute inset-0 pointer-events-none z-30 flex flex-col items-center justify-center">
                          {/* Center Instruction Overlay */}
                          {!scanSuccess && !showScanAgain && (
                            <div className="flex flex-col items-center gap-2 sm:gap-4 text-white/60">
                               <Camera className="w-8 h-8 sm:w-12 sm:h-12" strokeWidth={1} />
                               <p className="text-[10px] sm:text-xs font-medium text-center px-8 sm:px-12 leading-relaxed max-w-[240px]">
                                 {lang === 'HI' ? 'क्यूआर कोड को फ्रेम के भीतर रखें' : 'Position the QR code within the frame'}
                               </p>
                            </div>
                          )}

                          {/* Scan Again Button Overlay */}
                          <AnimatePresence>
                            {showScanAgain && !scanSuccess && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center p-6 pointer-events-auto"
                              >
                                <div className="bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4 max-w-[280px] w-full">
                                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                    <RefreshCw className="w-6 h-6" />
                                  </div>
                                  <div className="text-center">
                                    <h4 className="text-slate-900 font-bold text-sm">
                                      {lang === 'HI' ? 'QR नहीं मिला?' : 'No QR Detected?'}
                                    </h4>
                                    <p className="text-slate-500 text-[10px] mt-1 leading-relaxed">
                                      {lang === 'HI' ? 'कृपया पुन: प्रयास करें या गैलरी से चित्र चुनें' : 'Please try again or select an image from gallery'}
                                    </p>
                                  </div>
                                  <button
                                    onClick={handleScanAgain}
                                    className="w-full bg-brand-blue text-white py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                                  >
                                    {lang === 'HI' ? 'पुन: स्कैन करें' : 'Scan Again'}
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Corner Brackets with accents */}
                          <div className="absolute inset-x-12 sm:inset-x-16 inset-y-8 sm:inset-y-12 flex items-center justify-center">
                            <div className="w-full h-full max-w-[300px] relative">
                              {/* Top Left */}
                              <div className="absolute top-0 left-0 w-8 h-8 sm:w-12 sm:h-12">
                                <div className="absolute top-0 left-0 w-full h-[2px] sm:h-[3px] bg-white rounded-full opacity-80" />
                                <div className="absolute top-0 left-0 w-[2px] sm:w-[3px] h-full bg-white rounded-full opacity-80" />
                                <div className="absolute top-0 left-0 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-brand-blue rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                              </div>
                              {/* Top Right */}
                              <div className="absolute top-0 right-0 w-8 h-8 sm:w-12 sm:h-12 rotate-90">
                                <div className="absolute top-0 left-0 w-full h-[2px] sm:h-[3px] bg-white rounded-full opacity-80" />
                                <div className="absolute top-0 left-0 w-[2px] sm:w-[3px] h-full bg-white rounded-full opacity-80" />
                                <div className="absolute top-0 left-0 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-brand-blue rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                              </div>
                              {/* Bottom Left */}
                              <div className="absolute bottom-0 left-0 w-8 h-8 sm:w-12 sm:h-12 -rotate-90">
                                <div className="absolute top-0 left-0 w-full h-[2px] sm:h-[3px] bg-white rounded-full opacity-80" />
                                <div className="absolute top-0 left-0 w-[2px] sm:w-[3px] h-full bg-white rounded-full opacity-80" />
                                <div className="absolute top-0 left-0 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-brand-blue rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                              </div>
                              {/* Bottom Right */}
                              <div className="absolute bottom-0 right-0 w-8 h-8 sm:w-12 sm:h-12 rotate-180">
                                <div className="absolute top-0 left-0 w-full h-[2px] sm:h-[3px] bg-white rounded-full opacity-80" />
                                <div className="absolute top-0 left-0 w-[2px] sm:w-[3px] h-full bg-white rounded-full opacity-80" />
                                <div className="absolute top-0 left-0 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-brand-blue rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                              </div>
                            </div>
                          </div>

                          {/* Float Pill Badge */}
                          <div className="absolute bottom-6 sm:bottom-10">
                             <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 sm:px-5 sm:py-2.5 rounded-full flex items-center gap-2 sm:gap-3">
                               <Flashlight className="w-3 h-3 sm:w-4 sm:h-4 text-white/80" />
                               <span className="text-[9px] sm:text-[11px] font-medium text-white tracking-wide whitespace-nowrap">
                                 {lang === 'HI' ? 'क्यूआर कोड पर कैमरा केंद्रित करें' : 'Point camera at QR code'}
                               </span>
                             </div>
                          </div>
                        </div>

                        {/* Success Notification */}
                        <AnimatePresence>
                          {scanSuccess && scanMessage && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
                            >
                              <div className="bg-green-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-3xl shadow-2xl flex items-center gap-3">
                                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                                <span className="font-bold tracking-tight text-xs sm:text-sm">{scanMessage}</span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <div className="p-8 text-center bg-slate-900/50">
                        <ShieldAlert className="w-10 h-10 sm:w-12 sm:h-12 text-red-400 mx-auto mb-4" />
                        <h4 className="text-white font-bold mb-2">Camera Error</h4>
                        <p className="text-white/60 text-[10px] sm:text-xs mb-6 max-w-[200px] mx-auto">{cameraError}</p>
                        <button onClick={handleRetry} className="bg-white text-slate-950 px-6 py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest">Retry</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-6 sm:py-8 flex items-end justify-between bg-white shrink-0">
                <div 
                  className="flex-1 flex flex-col items-center gap-2 sm:gap-3 cursor-pointer group"
                  onClick={toggleTorch}
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all bg-slate-50 text-slate-900 shadow-sm border border-slate-100 group-hover:bg-slate-100`}>
                    <Flashlight className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={flashEnabled ? 2.5 : 2} />
                  </div>
                  <span className="text-[9px] sm:text-[11px] font-medium text-slate-500">
                    {lang === 'HI' ? 'फ्लैश' : 'Flash'}
                  </span>
                </div>

                <div className="h-8 sm:h-10 w-px bg-slate-100 mb-4 sm:mb-6" />

                <div className="flex-1 flex flex-col items-center gap-2 sm:gap-3 cursor-pointer group" onClick={toggleCamera}>
                   <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-50 text-brand-blue flex items-center justify-center shadow-sm border border-slate-100 group-hover:bg-slate-100">
                     <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                   </div>
                   <span className="text-[9px] sm:text-[11px] font-medium text-slate-500 text-center">
                     {lang === 'HI' ? 'कैमरा बदलें' : 'Switch Camera'}
                   </span>
                </div>

                <div className="h-8 sm:h-10 w-px bg-slate-100 mb-4 sm:mb-6" />

                <div 
                  className="flex-1 flex flex-col items-center gap-2 sm:gap-3 cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileSelect}
                  />
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-50 text-slate-900 flex items-center justify-center shadow-sm border border-slate-100 group-hover:bg-slate-100">
                    <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[9px] sm:text-[11px] font-medium text-slate-500">
                    {lang === 'HI' ? 'गैलरी से' : 'From Gallery'}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
