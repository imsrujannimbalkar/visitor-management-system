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
        background-color: #f8fafc;
      }
      .pass-container {
        width: 320px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 24px;
        padding: 32px;
        text-align: center;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        position: relative;
        overflow: hidden;
      }
      .pass-border {
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 6px;
        background-color: ${organization.brandColor || '#2563EB'};
      }
      .org-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 24px;
      }
      .org-logo {
        height: 48px;
        width: auto;
        max-width: 120px;
        object-fit: contain;
        margin-bottom: 12px;
      }
      .org-name { font-size: 18px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -0.025em; margin: 0; }
      .org-subtitle { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px; }
      .qr-wrapper {
        margin: 24px auto;
        padding: 12px;
        background: white;
        border: 2px solid ${organization.brandColor || '#2563EB'};
        border-radius: 20px;
        display: inline-block;
      }
      .qr-code { display: flex; justify-content: center; }
      .visitor-name { font-size: 26px; font-weight: 900; color: #0f172a; margin: 16px 0; text-transform: uppercase; letter-spacing: -0.05em; line-height: 1; }
      .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; text-align: left; margin-top: 24px; padding: 16px; background: #f8fafc; border-radius: 16px; }
      .detail-label { font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 4px; }
      .detail-value { font-size: 13px; font-weight: 700; color: #1e293b; text-transform: uppercase; }
      .footer { margin-top: 32px; font-size: 9px; font-weight: 600; color: #94a3b8; text-align: center; border-top: 1px dashed #e2e8f0; padding-top: 16px; line-height: 1.5; }
    `);
    printWindow.document.write('</style></head><body>');
    
    // Construct the print layout manually to ensure exact fidelity on paper
    const qrValue = `${window.location.origin}/?passId=${visitor.visitId || visitor.visitorId}&orgId=${organization.id}&mode=checkout`;
    
    // We recreate the pass in raw HTML for the print window
    const printHtml = `
      <div class="pass-container">
        <div class="pass-border"></div>
        <div class="org-header">
          ${organization.logoUrl ? `<img src="${organization.logoUrl}" class="org-logo" alt="logo" />` : ''}
          <div class="org-name">${organization.name || 'VMS'}</div>
          <div class="org-subtitle">Official Visitor Pass</div>
        </div>
        
        <div class="qr-wrapper">
          <div class="qr-code" id="qr-container"></div>
        </div>
        
        <div class="visitor-name">${visitor.name || visitor.visitorName}</div>
        
        <div class="details-grid">
          <div>
            <div class="detail-label">Purpose</div>
            <div class="detail-value">${visitor.purpose || 'Visit'}</div>
          </div>
          <div>
            <div class="detail-label">Category</div>
            <div class="detail-value">${visitor.category || 'Guest'}</div>
          </div>
          <div>
            <div class="detail-label">Entry Date</div>
            <div class="detail-value">${new Date(visitor.date || Date.now()).toLocaleDateString()}</div>
          </div>
          <div>
            <div class="detail-label">Time In</div>
            <div class="detail-value">${visitor.checkInTime || '-'}</div>
          </div>
        </div>
        
        <div class="footer">
          Valid for today only. Please display this pass at all times while on the premises.<br/>
          Scan QR to self check-out on exit.
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
             <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-xl w-full max-w-[320px] mx-auto text-center relative overflow-hidden shrink-0">
                <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: organization.brandColor || '#2563EB' }} />
                
                {organization.logoUrl && (
                  <img src={organization.logoUrl} alt="Logo" className="h-12 mx-auto mb-4 object-contain" />
                )}
                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{organization.name || 'Organization'}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Official Visitor Pass</p>
                
                <div 
                  className="bg-white p-3 rounded-3xl inline-block border-2 mb-6"
                  style={{ borderColor: organization.brandColor || '#2563EB' }}
                >
                  <QRCodeSVG 
                    value={passUrl} 
                    size={160} 
                    level="H"
                    fgColor="#000000"
                    bgColor="#ffffff"
                    includeMargin={false}
                  />
                </div>
                
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-6 leading-tight">{visitor.name || visitor.visitorName}</h2>
                
                <div className="grid grid-cols-2 gap-4 text-left bg-slate-50 rounded-2xl p-5">
                   <div>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Building2 className="w-3 h-3"/> Purpose</p>
                     <p className="text-xs font-bold text-slate-900 uppercase truncate">{visitor.purpose || 'Visit'}</p>
                   </div>
                   <div>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><User className="w-3 h-3"/> Type</p>
                     <p className="text-xs font-bold text-slate-900 uppercase truncate">{visitor.category || 'Guest'}</p>
                   </div>
                   <div>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> Date</p>
                     <p className="text-xs font-bold text-slate-900 uppercase truncate">{new Date(visitor.date || Date.now()).toLocaleDateString()}</p>
                   </div>
                   <div>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Time In</p>
                     <p className="text-xs font-bold text-slate-900 uppercase truncate">{visitor.checkInTime || '-'}</p>
                   </div>
                </div>

                <div className="mt-8 pt-6 border-t border-dashed border-slate-200">
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                     Scan at exit to check out.<br/>Valid only at {organization.name}.
                   </p>
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
