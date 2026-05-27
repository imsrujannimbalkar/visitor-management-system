import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Printer, User, Clock, Calendar, Building2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Visitor, Organization } from '../types';

interface PrintableBatchPassModalProps {
  visitors: Visitor[];
  organization: Organization;
  onClose: () => void;
}

export default function PrintableBatchPassModal({ visitors, organization, onClose }: PrintableBatchPassModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Batch Print Passes</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
      @page { margin: 10px; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        margin: 0; 
        padding: 0;
      }
      .grid-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 15px;
        padding: 15px;
      }
      .pass-container {
        width: 100%;
        max-width: 250px;
        border: 2px solid #000;
        border-radius: 12px;
        padding: 15px;
        text-align: center;
        box-sizing: border-box;
        page-break-inside: avoid;
        margin: 0 auto;
      }
      .org-name { font-size: 14px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase; }
      .org-subtitle { font-size: 9px; color: #555; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; }
      .qr-code { margin: 10px auto; display: flex; justify-content: center; }
      .visitor-name { font-size: 18px; font-weight: 900; margin: 8px 0; text-transform: uppercase; }
      .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; text-align: left; margin-top: 15px; }
      .detail-label { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #555; }
      .detail-value { font-size: 11px; font-weight: bold; }
      .footer { margin-top: 20px; font-size: 9px; color: #777; text-align: center; border-top: 1px dashed #ccc; padding-top: 8px; line-height: 1.3;}
      
      @media print {
        .grid-container {
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 10px;
          padding: 0;
        }
        .pass-container {
          max-width: none;
          height: auto;
        }
      }
    `);
    printWindow.document.write('</style></head><body>');
    printWindow.document.write('<div class="grid-container">');
    
    visitors.forEach((visitor, idx) => {
      const qrValue = `${window.location.origin}/?passId=${visitor.visitId || visitor.visitorId}&orgId=${organization.id}&mode=checkout`;
      const passHtml = `
        <div class="pass-container">
          <div class="org-name">${organization.name || 'VMS'}</div>
          <div class="org-subtitle">Visitor Pass</div>
          
          <div class="qr-code" id="qr-container-${idx}"></div>
          
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
            Please wear this badge visibly.<br/>
            Scan QR to check out.
          </div>
        </div>
      `;
      
      printWindow.document.write(passHtml);
    });

    printWindow.document.write('</div></body></html>');
    
    // Inject SVGs
    if (containerRef.current) {
      visitors.forEach((_, idx) => {
        const qrContainerDiv = containerRef.current?.querySelector(`#batch-qr-preview-${idx}`);
        const qrSvg = qrContainerDiv?.querySelector('svg');
        if (qrSvg) {
           const printQrContainer = printWindow.document.getElementById(`qr-container-${idx}`);
           if (printQrContainer) {
              printQrContainer.innerHTML = qrSvg.outerHTML;
           }
        }
      });
    }

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

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
          className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="w-full flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-2">
              <Printer className="w-5 h-5 text-brand-blue" />
              Batch Print ({visitors.length})
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 min-h-0 bg-slate-50/50" ref={containerRef}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {visitors.map((visitor, idx) => {
                const passUrl = `${window.location.origin}/?passId=${visitor.visitId || visitor.visitorId}&orgId=${organization?.id}&mode=checkout`;
                return (
                  <div key={idx} className="bg-white border text-center border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col items-center">
                    <div className="absolute top-0 left-0 w-full h-1 bg-brand-blue" />
                    
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mt-1 truncate w-full">{organization.name || 'Organization'}</h4>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Visitor Badge</p>
                    
                    <div id={`batch-qr-preview-${idx}`} className="bg-white p-1.5 rounded-xl block border border-slate-100 mb-3 w-[100px] h-[100px]">
                      <QRCodeSVG 
                        value={passUrl} 
                        size={88} 
                        level="H"
                        fgColor="#000000"
                        bgColor="#ffffff"
                        includeMargin={false}
                      />
                    </div>
                    
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-tighter mb-3 truncate w-full">{visitor.name || visitor.visitorName}</h2>
                    
                    <div className="w-full grid grid-cols-2 gap-2 text-left bg-slate-50 rounded-lg p-2.5">
                       <div>
                         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Type</p>
                         <p className="text-[10px] font-bold text-slate-900 uppercase truncate">{visitor.category || 'Guest'}</p>
                       </div>
                       <div>
                         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Check-In</p>
                         <p className="text-[10px] font-bold text-slate-900 uppercase truncate">{visitor.checkInTime || '-'}</p>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

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
              Print All Selected
            </button>
          </div>
        </motion.div>
      </motion.div>
  );
}
