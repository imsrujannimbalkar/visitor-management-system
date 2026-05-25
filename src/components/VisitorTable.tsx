import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Edit2, Search, Trash2, FileText, Phone, MessageCircle, History, ChevronDown, ChevronUp, User, MapPin, PenTool, CheckSquare, Square, Trash, CheckCircle, X, Calendar, Star, Heart, Shield, Clock, TrendingUp, Share2, ShieldCheck, Ticket, Gift, AlertTriangle, RotateCcw, Printer } from 'lucide-react';
import { Visitor, UserRole, Donation } from '../types';
import { DEFAULT_WHATSAPP_TEMPLATES } from '../constants';
import Swal from 'sweetalert2';

interface VisitorTableProps {
  visitors: Visitor[];
  allVisitors?: Visitor[];
  donations?: Donation[];
  onCheckOut: (visitorId: string) => void;
  onEdit: (visitor: Visitor) => void;
  onDelete?: (visitorId: string) => void;
  onBulkCheckOut?: (visitorIds: string[]) => void;
  onBulkDelete?: (visitorIds: string[]) => void;
  onAddReview?: (visitor: Visitor) => void;
  onAddDonation?: (visitor: Visitor) => void;
  onGeneratePass?: (visitor: Visitor) => void;
  onPrintPass?: (visitor: Visitor) => void;
  onWhatsAppSent?: (visitorId: string) => void;
  userRole?: UserRole;
  loadingStates?: Record<string, boolean>;
  organizationName?: string;
  templates?: {
    thankYou?: string;
  };
}

export default function VisitorTable({ 
  visitors, 
  allVisitors = [], 
  donations = [],
  onCheckOut, 
  onEdit, 
  onDelete, 
  onBulkCheckOut,
  onBulkDelete,
  onAddReview,
  onAddDonation,
  onGeneratePass,
  onPrintPass,
  onWhatsAppSent,
  userRole,
  loadingStates = {},
  organizationName = 'VMS Global',
  templates
}: VisitorTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleRow = (visitorId: string) => {
    if (expandedRow === visitorId) {
      setExpandedRow(null);
    } else {
      setExpandedRow(visitorId);
    }
  };

  const getVisitorHistory = (phone: string) => {
    const history = allVisitors.filter(v => v.phone === phone).sort((a, b) => new Date(`${b.date} ${b.checkInTime}`).getTime() - new Date(`${a.date} ${a.checkInTime}`).getTime());
    return history;
  };

  const getBehaviorLabels = (visitor: Visitor) => {
    const labels: { text: string, color: string }[] = [];
    
    // Visit-based labels
    const vHistory = allVisitors.filter(v => v.phone === visitor.phone);
    const visitCount = vHistory.length;
    
    if (visitCount === 1) {
      labels.push({ text: 'New Visitor', color: 'bg-blue-500' });
    } else if (visitCount >= 3) {
      labels.push({ text: 'Frequent Visitor', color: 'bg-indigo-600' });
    }

    // Donation-based labels
    const vDonations = donations.filter(d => d.visitorPhone === visitor.phone || d.visitorId === visitor.phone);
    const donationCount = vDonations.length;
    const totalDonation = vDonations.reduce((sum, d) => sum + (d.amount || 0), 0);

    if (donationCount === 1) {
      labels.push({ text: 'New Donor', color: 'bg-emerald-500' });
    } else if (donationCount >= 2) {
      labels.push({ text: 'Recurring Donor', color: 'bg-emerald-600' });
    }

    // VIP Logic
    if (visitor.manualClassification === 'VIP' || visitCount >= 5 || totalDonation >= 10000) {
      labels.push({ text: 'VIP', color: 'bg-amber-500' });
    }

    return labels;
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === visitors.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(visitors.map(v => v.visitorId));
    }
  };

  const toggleSelect = (e: React.MouseEvent, visitorId: string) => {
    e.stopPropagation();
    if (selectedIds.includes(visitorId)) {
      setSelectedIds(selectedIds.filter(id => id !== visitorId));
    } else {
      setSelectedIds([...selectedIds, visitorId]);
    }
  };

  const handleDelete = async (visitorId: string) => {
    const result = await Swal.fire({
      title: 'Delete Record?',
      text: "This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed && onDelete) {
      onDelete(visitorId);
    }
  };

  const handleBulkDelete = async () => {
    const result = await Swal.fire({
      title: `Delete ${selectedIds.length} Records?`,
      text: "This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete All',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed && onBulkDelete) {
      onBulkDelete(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleBulkCheckOut = async () => {
    const result = await Swal.fire({
      title: `Check Out ${selectedIds.length} Visitors?`,
      text: "This will mark all selected visitors as checked out.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Check Out All',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed && onBulkCheckOut) {
      onBulkCheckOut(selectedIds);
      setSelectedIds([]);
    }
  };

  const sendThankYou = (visitor: Visitor) => {
    const visitorName = visitor.name || visitor.visitorName || 'Visitor';
    const orgName = organizationName || 'VMS Global';
    const visitDate = visitor.date ? new Date(visitor.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString();

    const template = templates?.thankYou || DEFAULT_WHATSAPP_TEMPLATES.thankYou;
    
    const message = template
      .replace(/{{name}}/g, visitorName)
      .replace(/{{date}}/g, visitDate)
      .replace(/{{location}}/g, orgName);

    const phoneToUse = visitor.phone || visitor.visitorPhone || '';
    let formattedPhone = phoneToUse.replace(/\D/g, '');
    if (formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }
    
    if (formattedPhone) {
      if (onWhatsAppSent) {
        onWhatsAppSent(visitor.visitorId || '');
      }
      const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
      const win = window.open(url, '_blank');
      if (!win) {
        // Fallback for blocked popups
        window.location.href = url;
      }
    } else {
      Swal.fire({
        title: 'Error',
        text: 'No valid phone number found for this visitor.',
        icon: 'error',
        confirmButtonColor: '#2563eb'
      });
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white overflow-hidden relative flex flex-col">
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="absolute top-0 left-0 right-0 z-20 bg-brand-blue text-white px-6 py-4 flex items-center justify-between shadow-2xl border-b border-white/10"
          >
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 bg-white text-brand-blue rounded-full text-xs font-black">
                  {selectedIds.length}
                </span>
                <span className="font-bold text-base tracking-tight">Visitors Selected</span>
              </div>
              <button 
                onClick={() => setSelectedIds([])}
                className="text-sm font-bold text-white/70 hover:text-white transition-colors flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Clear Selection
              </button>
            </div>
            <div className="flex items-center gap-4">
              {onBulkCheckOut && (
                <button
                  onClick={handleBulkCheckOut}
                  className="flex items-center gap-2 px-6 py-2 bg-white text-brand-blue hover:bg-blue-50 rounded-xl text-sm font-black transition-all shadow-lg active:scale-95"
                >
                  <CheckCircle className="h-4 w-4" />
                  Bulk Check-out
                </button>
              )}
              {onBulkDelete && (userRole === 'ADMIN' || userRole === 'MASTER_ADMIN') && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-black transition-all shadow-lg active:scale-95"
                >
                  <Trash className="h-4 w-4" />
                  Bulk Delete
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto custom-scrollbar-horizontal">
        <table className="w-full text-left border-collapse min-w-[1400px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100/50">
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                <button 
                  onClick={toggleSelectAll}
                  className="text-slate-300 hover:text-brand-blue transition-colors"
                >
                  {selectedIds.length === visitors.length && visitors.length > 0 ? (
                    <CheckSquare className="h-5 w-5 text-brand-blue" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                </button>
              </th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Ind.</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Log#</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">UID Reference</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Identity Details</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Location Info</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Contact Core</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Engagement</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Temporal Log</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic text-center">Security Status</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic text-right">Command Center</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {visitors.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="p-4 bg-gray-50 rounded-full border border-dashed border-gray-200">
                      <Search className="h-10 w-10 text-gray-300" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">No records found</p>
                      <p className="text-sm text-gray-400 font-medium max-w-xs mx-auto">
                        There are no visitor entries matching your current filters for this date.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              visitors.map((visitor, idx) => (
                <React.Fragment key={visitor.visitorId}>
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`hover:bg-slate-50 transition-all duration-300 group cursor-pointer border-b border-slate-50 last:border-0 ${expandedRow === visitor.visitorId ? 'bg-ngo-surface underline-offset-4' : ''} ${selectedIds.includes(visitor.visitorId) ? 'bg-slate-50' : ''}`}
                    onClick={() => toggleRow(visitor.visitorId)}
                  >
                    <td className="px-8 py-6" onClick={(e) => toggleSelect(e, visitor.visitorId)}>
                      <div className="flex items-center justify-center">
                        <button className="text-slate-300 hover:text-ngo-accent transition-colors">
                          {selectedIds.includes(visitor.visitorId) ? (
                            <CheckSquare className="h-5 w-5 text-ngo-accent" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center">
                        {expandedRow === visitor.visitorId ? 
                          <ChevronUp className="h-4 w-4 text-ngo-accent" /> : 
                          <ChevronDown className="h-4 w-4 text-slate-300 group-hover:text-slate-400" />
                        }
                      </div>
                    </td>
                    <td className="px-8 py-6 text-[11px] font-black text-slate-400 italic">#{String(visitor.serialNumber || 0).padStart(3, '0')}</td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg font-mono font-bold text-[10px] tracking-tighter border border-slate-200/50">
                        {visitor.visitorId}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-display font-black text-ngo-primary group-hover:text-ngo-accent transition-colors leading-tight">{visitor.name}</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider text-white ${
                             visitor.category === 'Volunteer' ? 'bg-emerald-500' :
                             visitor.category === 'Donor' ? 'bg-ngo-accent' :
                             visitor.category === 'Beneficiary' ? 'bg-rose-500' :
                             visitor.category === 'Staff' ? 'bg-slate-700' :
                             visitor.category === 'Official' ? 'bg-teal-600' :
                             visitor.category === 'Guest' ? 'bg-indigo-500' :
                             'bg-slate-400'
                           }`}>
                             {visitor.category}
                           </span>
                           {getBehaviorLabels(visitor).map((label, lIdx) => (
                             <span key={lIdx} className={`px-2 py-0.5 rounded ${label.color} text-white text-[8px] font-black uppercase tracking-tighter`}>
                               {label.text}
                             </span>
                           ))}
                           {visitor.isEmergency && (
                              <div className="flex flex-col gap-1 items-start">
                                <span className="px-3 py-1 rounded bg-red-600 text-white text-[9px] font-black uppercase tracking-tighter animate-pulse shadow-md shadow-red-200 border border-white/20 flex items-center gap-1.5">
                                  <AlertTriangle className="h-2.5 w-2.5" />
                                  EMERGENCY PROTOCOL ENTRY
                                </span>
                                {visitor.phone?.startsWith('EMER-') && (
                                  <span className="px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded text-[7px] font-black tracking-widest uppercase">ID: {visitor.phone}</span>
                                )}
                              </div>
                           )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-black text-slate-900 tracking-tight">{visitor.dob || '--'}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">DOB Registry</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <MapPin className="h-3.5 w-3.5 text-slate-300" />
                        <span className="truncate max-w-[120px]" title={visitor.address}>{visitor.address || 'Location Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1.5">
                        <div className="text-[11px] font-black text-slate-900 tracking-tight flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-slate-300" />
                          {visitor.phone?.startsWith('EMER-') ? 'Contact Not Provided' : visitor.phone}
                        </div>
                        {visitor.email && (
                          <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 lowercase truncate max-w-[150px]">
                             <FileText className="h-3.5 w-3.5 opacity-30" />
                             {visitor.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm font-black text-slate-600">
                      {visitor.purpose}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-slate-900 italic tracking-tighter">{visitor.date}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-1 w-8 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-ngo-accent w-1/3" />
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">IN {visitor.checkInTime}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`inline-flex items-center px-4 py-2 rounded-xl text-[9px] font-black tracking-[0.1em] uppercase border ${
                        visitor.status === 'INSIDE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm shadow-emerald-100/50'
                          : 'bg-slate-50 text-slate-500 border-slate-100'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                          visitor.status === 'INSIDE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                        }`} />
                        {visitor.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="inline-flex items-center gap-2">
                         <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-white group-hover:border-slate-200 transition-all">
                            <button 
                              onClick={(e) => { e.stopPropagation(); onEdit(visitor); }}
                              className="p-2 text-slate-400 hover:text-ngo-accent hover:bg-slate-50 rounded-lg transition-all"
                              title="Edit Identity"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            {(userRole === 'ADMIN' || userRole === 'MASTER_ADMIN') && onDelete && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(visitor.visitorId); }}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                title="Remove Document"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                         </div>
                         {visitor.status === 'INSIDE' && (
                            <>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); onGeneratePass?.(visitor); }}
                                 className="p-2.5 bg-brand-blue text-white hover:bg-blue-600 rounded-[1rem] shadow-lg shadow-blue-500/10 transition-all active:scale-95"
                                 title="Generate Digital Pass"
                               >
                                 <Ticket className="h-4 w-4" />
                               </button>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); onPrintPass?.(visitor); }}
                                 className="p-2.5 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 rounded-[1rem] transition-all active:scale-95 border border-slate-200/50"
                                 title="Print Badge"
                               >
                                 <Printer className="h-4 w-4" />
                               </button>
                            </>
                         )}
                         {visitor.status === 'INSIDE' && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); onCheckOut(visitor.visitorId); }}
                              disabled={loadingStates[visitor.visitorId]}
                              className="flex items-center gap-2 px-4 py-2.5 bg-ngo-primary text-white hover:bg-ngo-accent rounded-[1rem] shadow-lg shadow-ngo-primary/10 transition-all text-[9px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-50"
                            >
                              {loadingStates[visitor.visitorId] ? (
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <LogOut className="h-3.5 w-3.5" />
                                  <span>Finalize</span>
                                </>
                              )}
                            </button>
                         )}
                         {visitor.status === 'CHECKED OUT' && (
                            visitor.whatsappStatus === 'SENT' ? (
                               <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-[1rem] border border-emerald-100">
                                 <CheckCircle className="h-4 w-4" />
                                 <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Redirected</span>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); sendThankYou(visitor); }}
                                   className="ml-1 p-0.5 text-emerald-400 hover:text-emerald-600 transition-colors"
                                   title="Resend Thank You Note"
                                 >
                                   <RotateCcw className="h-3 w-3" />
                                 </button>
                               </div>
                            ) : (
                               <button 
                                 onClick={(e) => { e.stopPropagation(); sendThankYou(visitor); }}
                                 className="flex items-center justify-center p-2.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-[1rem] shadow-lg shadow-emerald-500/10 transition-all active:scale-95"
                                 title="Send Thank You Note"
                               >
                                 <MessageCircle className="h-4 w-4" />
                               </button>
                            )
                         )}
                         <button 
                           onClick={(e) => { e.stopPropagation(); toggleRow(visitor.visitorId); }}
                           className={`p-2.5 rounded-[1rem] transition-all border ${expandedRow === visitor.visitorId ? 'bg-ngo-accent text-white border-ngo-accent' : 'bg-white text-slate-400 border-slate-100 hover:border-ngo-accent'}`}
                         >
                           <History className="h-5 w-5" />
                         </button>
                      </div>
                    </td>
                  </motion.tr>
                <AnimatePresence mode="wait">
                  {expandedRow === visitor.visitorId && (userRole === 'ADMIN' || userRole === 'STAFF' || userRole === 'MASTER_ADMIN') && (
                    <motion.tr
                      key={`expanded-${visitor.visitorId}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-slate-50/50 border-b border-slate-100"
                    >
                      <td colSpan={15} className="px-10 py-12">
                        <div className="max-w-7xl mx-auto flex flex-col gap-10">
                          {/* Audit Header */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-8 border-b border-slate-200/60">
                            <div className="flex items-center gap-6">
                              <div className="h-20 w-20 bg-brand-blue rounded-[2rem] flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-blue-200">
                                {(visitor.name || 'V').charAt(0)}
                              </div>
                              <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic mb-1">{visitor.name}</h3>
                                <div className="flex items-center gap-4">
                                  <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-sm">
                                    Visitor Audit Mode
                                  </span>
                                  <span className="flex items-center gap-2 text-[10px] font-black text-brand-blue uppercase tracking-widest">
                                    <div className="h-1.5 w-1.5 rounded-full bg-brand-blue animate-pulse" />
                                    {visitor.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              {visitor.status === 'INSIDE' && (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onGeneratePass?.(visitor); }}
                                    className="flex items-center gap-3 px-8 py-3.5 bg-slate-900 text-white hover:bg-black rounded-[1.5rem] transition-all text-[11px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-slate-100 active:scale-95"
                                  >
                                    <ShieldCheck className="h-4 w-4 text-brand-blue" />
                                    Digital Pass
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onPrintPass?.(visitor); }}
                                    className="flex items-center gap-3 px-8 py-3.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 rounded-[1.5rem] transition-all text-[11px] font-bold uppercase tracking-[0.2em] active:scale-95"
                                  >
                                    <Printer className="h-4 w-4" />
                                    Print Badge
                                  </button>
                                </>
                              )}
                              {(userRole === 'ADMIN' || userRole === 'MASTER_ADMIN') && onAddDonation && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); onAddDonation(visitor); }}
                                  className="flex items-center gap-3 px-8 py-3.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-[1.5rem] transition-all text-[11px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-emerald-200 active:scale-95"
                                >
                                  <Heart className="h-4 w-4" />
                                  Contribution Entry
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); onEdit(visitor); }}
                                className="flex items-center gap-3 px-8 py-3.5 bg-white border border-slate-200 text-slate-600 hover:border-brand-blue hover:text-brand-blue rounded-[1.5rem] transition-all text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-slate-100 active:scale-95"
                              >
                                <Edit2 className="h-4 w-4" />
                                Governance Edit
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                            {/* Detailed Identification */}
                            <div className="lg:col-span-1 space-y-6">
                              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/50 relative overflow-hidden group hover:border-brand-blue/30 transition-all">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-blue/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                                <div className="relative z-10 space-y-6">
                                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                                    <div className="p-2 bg-slate-50 rounded-xl text-brand-blue">
                                      <User className="h-4 w-4" />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identity Profile</span>
                                    <div className="flex flex-wrap gap-1 ml-auto">
                                      {getBehaviorLabels(visitor).map((label, lIdx) => (
                                        <span key={lIdx} className={`px-2 py-0.5 rounded ${label.color} text-white text-[8px] font-black uppercase tracking-tighter`}>
                                          {label.text}
                                        </span>
                                      ))}
                                      {visitor.isEmergency && (
                                        <div className="flex flex-col gap-1 items-start mt-2">
                                          <span className="px-3 py-1 rounded bg-red-600 text-white text-[9px] font-black uppercase tracking-tighter animate-pulse shadow-md shadow-red-200 border-2 border-white/20 flex items-center gap-1.5">
                                            <AlertTriangle className="h-3 w-3" />
                                            EMERGENCY PROTOCOL ENTRY
                                          </span>
                                          {visitor.phone?.startsWith('EMER-') && (
                                            <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded text-[8px] font-black tracking-widest uppercase">OFFLINE RECORD ID: {visitor.phone}</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Global Visitor ID</span>
                                      <span className="font-mono text-sm font-black text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">{visitor.visitorId}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Chronological Age / DOB</span>
                                      <span className="text-sm font-bold text-slate-700">{visitor.dob || 'Not Disclosed'}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Contact Vector</span>
                                      <span className="text-sm font-bold text-slate-700">{visitor.phone?.startsWith('EMER-') ? 'Contact Not Provided (Emergency Protocol)' : visitor.phone}</span>
                                    </div>
                                    {visitor.email && (
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Messaging Channel</span>
                                        <span className="text-sm font-bold text-slate-700 truncate">{visitor.email}</span>
                                      </div>
                                    )}
                                    {visitor.notes && (
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Visit Notes</span>
                                        <p className="text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed italic">"{visitor.notes}"</p>
                                      </div>
                                    )}
                                    {visitor.occasion && (
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Special Occasion</span>
                                        <div className="flex items-center gap-2">
                                           <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                                             <Gift className="h-3 w-3" />
                                           </div>
                                           <span className="text-sm font-black text-amber-700 uppercase tracking-tighter italic">{visitor.occasion}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {visitor.signature ? (
                                <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                                  <div className="relative z-10">
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-6 flex items-center gap-2">
                                      <PenTool className="h-3 w-3" />
                                      Authenticated Signature
                                    </p>
                                    <div className="bg-white rounded-2xl p-4 shadow-inner flex items-center justify-center transform group-hover:scale-105 transition-transform">
                                      <img src={visitor.signature} alt="Signature" className="h-16 object-contain mix-blend-multiply" />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-slate-100 p-8 rounded-[2.5rem] border border-dashed border-slate-300 flex flex-col items-center justify-center gap-3">
                                  <Shield className="h-10 w-10 text-slate-300 opacity-50" />
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-Signature Pending</p>
                                </div>
                              )}
                            </div>

                            {/* Behavioral History Timeline */}
                            <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200/50">
                              <div className="flex items-center justify-between mb-10">
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Engagement Ledger</span>
                                  <h4 className="text-xl font-black text-slate-900 tracking-tighter italic uppercase">Temporal Audit</h4>
                                </div>
                                <div className="flex items-center gap-3 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100">
                                  <History className="h-4 w-4 text-brand-blue" />
                                  <span className="text-xs font-black text-slate-600">{getVisitorHistory(visitor.phone).length} Total Engagements</span>
                                </div>
                              </div>

                              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                                {getVisitorHistory(visitor.phone).map((visit) => (
                                  <div key={visit.visitId} className="group relative pl-10 pb-8 last:pb-0">
                                    <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-100 group-last:bg-transparent" />
                                    <div className={`absolute left-[-5px] top-6 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-150 ${visit.status === 'INSIDE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                    
                                    <div className="bg-slate-50/50 border border-slate-100/60 rounded-[2rem] p-6 hover:bg-white hover:shadow-xl hover:border-brand-blue/20 transition-all duration-500">
                                      <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex items-center gap-6">
                                          <div className="h-16 w-16 bg-white rounded-2xl flex flex-col items-center justify-center border border-slate-100 shadow-sm shrink-0 group-hover:bg-brand-blue/5 transition-colors">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{new Date(visit.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                                            <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{new Date(visit.date).getDate()}</span>
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-3 mb-1.5">
                                              <span className="text-lg font-black text-slate-800 tracking-tight">{visit.purpose}</span>
                                              <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] shadow-sm ${visit.status === 'INSIDE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {visit.status}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                              <div className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5 opacity-40 text-brand-blue" />
                                                IN {visit.checkInTime}
                                              </div>
                                              {visit.checkOutTime && (
                                                <div className="flex items-center gap-1.5">
                                                  <LogOut className="h-3.5 w-3.5 opacity-40 text-rose-500" />
                                                  OUT {visit.checkOutTime}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                          {visit.signature && (
                                            <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm transition-all group-hover:shadow-md">
                                              <img src={visit.signature} alt="Visit Signature" className="h-8 object-contain mix-blend-multiply opacity-70 group-hover:opacity-100 transition-opacity" title="Visit Signature" />
                                            </div>
                                          )}
                                          <div className="hidden sm:block">
                                            {visit.recordedByName && (
                                              <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-right">
                                                Audit by {visit.recordedByName}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Intelligence & Feedback */}
                            <div className="lg:col-span-1 space-y-8">
                              <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] border border-emerald-100">
                                <h5 className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                  <MapPin className="h-4 w-4" />
                                  Geospatial Trace
                                </h5>
                                <div className="space-y-6">
                                  <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
                                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2">Registered Domicile</p>
                                    <p className="text-xs font-bold text-emerald-900 leading-relaxed italic line-clamp-3">
                                      "{visitor.address || 'No location data stored'}"
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {visitor.review && (
                                <div className="bg-amber-50/50 p-8 rounded-[2.5rem] border border-amber-100 relative overflow-hidden group">
                                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full -mr-12 -mt-12 blur-3xl group-hover:scale-150 transition-transform" />
                                  <h5 className="text-[10px] font-black text-amber-800 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                                    Sentiment Index
                                  </h5>
                                  <div className="space-y-6 relative z-10">
                                    <div className="flex items-center gap-1.5 p-3 bg-white/60 rounded-xl border border-white">
                                      {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} className={`h-4 w-4 ${s <= visitor.review!.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                      ))}
                                      <span className="text-xs font-black text-amber-700 ml-2">{visitor.review.rating}/5</span>
                                    </div>
                                    {visitor.review.comment && (
                                      <div className="p-5 bg-white rounded-2xl border border-amber-100 shadow-xl shadow-amber-900/5">
                                        <p className="text-xs font-bold text-amber-900/80 italic leading-[1.8] antialiased">
                                          "{visitor.review.comment}"
                                        </p>
                                      </div>
                                    )}
                                    <div className="text-[9px] font-black text-amber-800/40 uppercase tracking-widest">Indexed on {new Date(visitor.review.timestamp).toLocaleDateString()}</div>
                                  </div>
                                </div>
                              )}

                              <div className="bg-slate-900 p-10 rounded-[3rem] text-white overflow-hidden relative group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/30 rounded-full -mr-16 -mt-16 blur-3xl opacity-50 transition-opacity group-hover:opacity-100" />
                                <div className="relative z-10 space-y-8">
                                  <div className="flex items-center gap-3 opacity-60">
                                    <TrendingUp className="h-4 w-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Growth Analytics</span>
                                  </div>
                                  <div className="space-y-2">
                                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Visit Momentum</span>
                                    <div className="text-3xl font-black italic tracking-tighter">
                                      +{(getVisitorHistory(visitor.phone).length / 10).toFixed(1)}x
                                    </div>
                                  </div>
                                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                     <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: '82%' }}
                                      className="h-full bg-brand-blue shadow-[0_0_8px_rgba(37,99,235,0.8)]" 
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
