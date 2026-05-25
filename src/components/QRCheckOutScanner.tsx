import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRCheckOutScannerProps {
  onScan: (passId: string) => void;
  lang?: 'EN' | 'HI';
  className?: string;
  customTrigger?: React.ReactNode;
}

export const QRCheckOutScanner: React.FC<QRCheckOutScannerProps> = ({ onScan, lang = 'EN', className, customTrigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);

  useEffect(() => {
    let unmounted = false;
    
    const startScanner = async () => {
      if (isOpen && !scannerRef.current) {
         try {
           scannerRef.current = new Html5Qrcode("qr-reader");
           await scannerRef.current.start(
             { facingMode: "environment" },
             { fps: 10, qrbox: { width: 250, height: 250 } },
             (decodedText) => {
                if (unmounted) return;
                try {
                  const url = new URL(decodedText);
                  const passId = url.searchParams.get('passId');
                  if (passId) {
                    onScan(passId);
                    setIsOpen(false);
                  }
                } catch (e) {
                  if (decodedText && decodedText.length > 5) {
                    onScan(decodedText);
                    setIsOpen(false);
                  }
                }
             },
             () => {}
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
         } catch (err) {
           console.error("Failed to start QR scanner:", err);
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
  }, [isOpen, onScan]);

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
              <div className="aspect-square bg-black relative">
                 <div id="qr-reader" className="w-full h-full"></div>
                 <div className="absolute inset-x-0 bottom-8 text-center pointer-events-none">
                     <p className="bg-black/50 text-white inline-block px-4 py-2 rounded-full font-medium text-sm backdrop-blur-sm">
                       {lang === 'HI' ? 'पास के QR पर कैमरा केंद्रित करें' : 'Point camera at visitor pass QR'}
                     </p>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
