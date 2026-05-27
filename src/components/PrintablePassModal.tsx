import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { X, Printer, User, Clock, Calendar, Building2, MapPin } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Visitor, Organization } from '../types';

interface PrintablePassModalProps {
  visitor: Visitor;
  organization: Organization;
  onClose: () => void;
  onPrinted?: (visitorId: string) => void;
}

export default function PrintablePassModal({ visitor, organization, onClose, onPrinted }: PrintablePassModalProps) {
  const passRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    // We can use the browser's native print, but we need to ensure only the pass is printed.
    // One way is to inject a stylesheet for printing that hides everything except our printable area
    const printContent = passRef.current;
    if (!printContent) return;

    const originalContents = document.body.innerHTML;
    const printContents = printContent.innerHTML;

    // This is a quick and robust way to print a specific component
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Print Pass - ' + (visitor.name || visitor.visitorName) + '</title>');
    // Add basic Tailwind classes manually or standard styles for printing
    printWindow.document.write('<style>');
    printWindow.document.write(`
      @page { margin: 0; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        margin: 0; padding: 20px;
        display: flex; justify-content: center; align-items: flex-start;
      }
      .pass-container {
        width: 320px;
        border: 2px solid #000;
        border-radius: 16px;
        padding: 20px;
        text-align: center;
      }
      .org-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; }
      .org-subtitle { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
      .qr-code { margin: 20px auto; display: flex; justify-content: center; }
      .visitor-name { font-size: 24px; font-weight: 900; margin: 10px 0; text-transform: uppercase; }
      .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; text-align: left; margin-top: 20px; }
      .detail-label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #555; }
      .detail-value { font-size: 14px; font-weight: bold; }
      .footer { margin-top: 30px; font-size: 10px; color: #777; text-align: center; border-top: 1px dashed #ccc; padding-top: 10px; }
    `);
    printWindow.document.write('</style></head><body>');
    
    // Construct the print layout manually to ensure exact fidelity on paper
    const qrValue = `${window.location.origin}/?passId=${visitor.visitId || visitor.visitorId}&orgId=${organization.id}&mode=checkout`;
    
    // We recreate the pass in raw HTML for the print window
    const printHtml = `
      <div class="pass-container">
        <div class="org-name">${organization.name || 'VMS'}</div>
        <div class="org-subtitle">Visitor Pass</div>
        
        <div class="qr-code" id="qr-container"></div>
        
        <div class="visitor-name">${visitor.name || visitor.visitorName}</div>
        
        <div class="details-grid">
          <div>
            <div class="detail-label">Purpose</div>
            <div class="detail-value">${visitor.purpose || '-'}</div>
          </div>
          <div>
            <div class="detail-label">Type</div>
            <div class="detail-value">${visitor.category || 'Guest'}</div>
          </div>
          <div>
            <div class="detail-label">Date</div>
            <div class="detail-value">${new Date(visitor.date || Date.now()).toLocaleDateString()}</div>
          </div>
          <div>
            <div class="detail-label">Check-In</div>
            <div class="detail-value">${visitor.checkInTime || '-'}</div>
          </div>
        </div>
        
        <div class="footer">
          Please wear this badge visibly at all times.<br/>
          Scan QR code to check out.
        </div>
      </div>
    `;
    
    printWindow.document.write(printHtml);
    
    // Render the QR code into the new window using standard DOM manipulataion
    // since we can't easily cross-render React into it synchronously without more setup
    const qrSvg = printContent.querySelector('svg');
    if (qrSvg) {
       const qrContainer = printWindow.document.getElementById('qr-container');
       if (qrContainer) {
          qrContainer.innerHTML = qrSvg.outerHTML;
       }
    }

    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      if (onPrinted) {
        onPrinted(visitor.visitId || visitor.visitorId || '');
      }
    }, 250);
  };

  const passUrl = `${window.location.origin}/?passId=${visitor.visitId || visitor.visitorId}&orgId=${organization?.id}&mode=checkout`;

  return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[7000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="w-full flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">Digital Pass</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Printable Area - We show a highly stylized version for the screen, but use a raw HTML version for the printer */}
          <div className="p-8 w-full flex flex-col items-center bg-slate-50/50 overflow-y-auto flex-1 min-h-0" ref={passRef}>
             <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm w-full max-w-[320px] mx-auto text-center relative overflow-hidden shrink-0">
                <div className="absolute top-0 left-0 w-full h-2 bg-brand-blue" />
                
                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mt-2">{organization.name || 'Organization'}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Visitor Badge</p>
                
                <div className="bg-white p-2 rounded-xl inline-block border border-slate-100 mb-6">
                  <QRCodeSVG 
                    value={passUrl} 
                    size={160} 
                    level="H"
                    fgColor="#000000"
                    bgColor="#ffffff"
                    includeMargin={false}
                  />
                </div>
                
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-6">{visitor.name || visitor.visitorName}</h2>
                
                <div className="grid grid-cols-2 gap-4 text-left bg-slate-50 rounded-xl p-4">
                   <div>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Building2 className="w-3 h-3"/> Purpose</p>
                     <p className="text-xs font-bold text-slate-900 uppercase">{visitor.purpose || '-'}</p>
                   </div>
                   <div>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><User className="w-3 h-3"/> Type</p>
                     <p className="text-xs font-bold text-slate-900 uppercase">{visitor.category || 'Guest'}</p>
                   </div>
                   <div>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> Date</p>
                     <p className="text-xs font-bold text-slate-900 uppercase">{new Date(visitor.date || Date.now()).toLocaleDateString()}</p>
                   </div>
                   <div>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Check-In</p>
                     <p className="text-xs font-bold text-slate-900 uppercase">{visitor.checkInTime || '-'}</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Footer Actions */}
          <div className="w-full p-6 border-t border-slate-100 bg-white flex gap-4 flex-shrink-0">
            <button 
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]"
            >
              Cancel
            </button>
            <button 
              onClick={handlePrint}
              className="flex-1 py-4 bg-brand-blue text-white font-black rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 uppercase tracking-widest text-[10px]"
            >
              <Printer className="w-4 h-4" />
              Print Pass
            </button>
          </div>
        </motion.div>
      </motion.div>
  );
}
