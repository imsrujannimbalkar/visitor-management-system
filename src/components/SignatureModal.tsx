import React, { useRef } from 'react';
import ReactSignatureCanvas from 'react-signature-canvas';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SignatureCanvas = (ReactSignatureCanvas as any).default || ReactSignatureCanvas;

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signatureData: string) => void;
  title?: string;
}

export default function SignatureModal({ isOpen, onClose, onConfirm, title = "Digital Signature" }: SignatureModalProps) {
  const sigCanvas = useRef<any>(null);

  const clear = () => {
    sigCanvas.current?.clear();
  };

  const handleConfirm = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert("Please provide a signature");
      return;
    }
    const data = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    if (data) {
      onConfirm(data);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[15000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-500 text-sm mb-4 font-medium">Please sign inside the box below:</p>
              <div className="border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 overflow-hidden">
                <SignatureCanvas
                  ref={sigCanvas}
                  penColor="#4F46E5"
                  canvasProps={{
                    className: "w-full h-64 cursor-crosshair",
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={clear}
                  className="px-6 py-2 text-gray-500 font-bold hover:text-gray-700 transition-colors uppercase text-xs tracking-widest"
                >
                  Clear Signature
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-shadow shadow-lg shadow-indigo-100"
                  >
                    <Check className="w-5 h-5" />
                    Confirm Check-in
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 border-t border-gray-100 italic text-[10px] text-gray-400 text-center uppercase tracking-[0.2em]">
              This signature will be stored with your visitor record
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
