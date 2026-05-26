import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import { 
  X, 
  User, 
  Calendar, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Share2, 
  CheckCircle2, 
  AlertCircle,
  Hash,
  LogOut,
  Building2,
  ChevronLeft,
  ArrowRight
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Visitor, Organization } from '../types';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, onSnapshot, query, collection, where, getDocs, addDoc } from 'firebase/firestore';
import { DEFAULT_WHATSAPP_TEMPLATES } from '../constants';
import { useToast } from './Toast';
import SignatureModal from './SignatureModal';
import ReviewModal from './ReviewModal';

interface VisitorPassProps {
  visitor?: Visitor | null;
  visitorId?: string;
  organizationId?: string;
  onClose?: () => void;
  onCheckOut?: () => void;
  organization?: Organization | null;
  standalone?: boolean;
}

export default function VisitorPass({ 
  visitor: initialVisitor, 
  visitorId, 
  organizationId, 
  onClose, 
  onCheckOut,
  organization: initialOrg,
  standalone = false 
}: VisitorPassProps) {
  const [visitor, setVisitor] = useState<Visitor | null>(initialVisitor);
  const [organization, setOrganization] = useState<Organization | null>(initialOrg || null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const { showToast } = useToast();

  // Resolve language from URL parameter (e.g. ?lang=hi) or default to English
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const language = (params.get('lang') || 'en').toLowerCase() === 'hi' ? 'HI' : 'EN';

  const x = useMotionValue(0);
  const textOpacity = useTransform(x, [0, 150], [1, 0]);
  const progressWidth = useTransform(x, (value) => `${(value / 260) * 100}%`);

  useEffect(() => {
    let unsubs: (() => void)[] = [];

    async function initialize() {
      // Resolve organization first
      const orgIdToFetch = organizationId || initialVisitor?.organizationId;
      if (orgIdToFetch && (!organization || organization.id !== orgIdToFetch)) {
        try {
          const orgRef = doc(db, 'organizations', orgIdToFetch);
          const orgSnap = await getDoc(orgRef);
          if (orgSnap.exists()) {
            setOrganization({ id: orgSnap.id, ...orgSnap.data() } as Organization);
          }
        } catch (err) {
          console.error('Error fetching org:', err);
        }
      }

      const effectiveVisitorId = visitorId || initialVisitor?.visitId || initialVisitor?.visitorId;
      
      if (effectiveVisitorId && orgIdToFetch) {
        let hasVisitData = false;

        // Listener 1: Using direct visit document ID
        const visitRef = doc(db, 'organizations', orgIdToFetch, 'visits', effectiveVisitorId);
        unsubs.push(onSnapshot(visitRef, async (snapshot) => {
          if (snapshot.exists()) {
            hasVisitData = true;
            const data = snapshot.data();
            setVisitor({ ...data, visitorId: snapshot.id, visitId: snapshot.id } as Visitor);
            setError(null);
            setLoading(false);
          }
        }, (err) => {
          console.error('Real-time pass error (visit doc):', err);
        }));

        // Listener 2: Query by preRegistrationId
        const visitsCollRef = collection(db, 'organizations', orgIdToFetch, 'visits');
        const q = query(visitsCollRef, where('preRegistrationId', '==', effectiveVisitorId));
        unsubs.push(onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            hasVisitData = true;
            const visitDoc = snapshot.docs[0];
            const data = visitDoc.data();
            setVisitor({ ...data, visitorId: visitDoc.id, visitId: visitDoc.id } as Visitor);
            setError(null);
            setLoading(false);
          }
        }, (err) => {
          console.error('Real-time pass error (visit query):', err);
        }));

        // Listener 3: Fallback PreRegistration document
        const preRegRef = doc(db, 'organizations', orgIdToFetch, 'preRegistrations', effectiveVisitorId);
        unsubs.push(onSnapshot(preRegRef, (snapshot) => {
          // Only update from preReg if we haven't already found a checked-in visit
          if (snapshot.exists() && !hasVisitData) {
            const preData = snapshot.data();
            if (preData.status === 'APPROVED' || preData.status === 'CHECKED_IN' || preData.status === 'COMPLETED') {
              setVisitor({ 
                ...preData, 
                visitorId: snapshot.id, 
                visitId: snapshot.id,
                visitorName: preData.name,
                visitorPhone: preData.phone,
                date: preData.visitDate,
                checkInTime: preData.status === 'APPROVED' ? 'Pending Check-In' : 'Checked In',
                status: preData.status === 'APPROVED' ? 'PENDING' : (preData.status === 'COMPLETED' ? 'CHECKED OUT' : 'INSIDE')
              } as any);
              setError(null);
              setLoading(false);
            }
          }
        }, (err) => {
          console.error('Real-time pass error (preReg):', err);
        }));
        
        // Timeout to stop loading if no records found at all
        setTimeout(() => {
          setLoading(prev => {
            if (prev) {
               setError('Pass not found or invalid');
               return false;
            }
            return prev;
          });
        }, 3000);

      } else {
        setLoading(false);
      }
    }

    initialize();
    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [initialVisitor, visitorId, organizationId]);

  const checkoutTriggered = React.useRef(false);

  // Handle auto-checkout if scanned with mode=checkout
  useEffect(() => {
    if (visitor && !loading && !checkingOut && !checkoutTriggered.current) {
      const params = new URLSearchParams(window.location.search);
      const isCheckoutMode = params.get('mode') === 'checkout';
      
      if (isCheckoutMode) {
        if (visitor.status === 'CHECKED OUT') {
          // Already checked out, but we should show the review modal if it hasn't been shown yet
          // and we arrived via a checkout link
          setShowReviewModal(true);
          checkoutTriggered.current = true;
          const reviewPromptMsg = language === 'HI'
            ? 'कृपया अपना अनुभव साझा करें।'
            : 'Please take a moment to rate your experience.';
          showToast(reviewPromptMsg, 'success');
        } else if (visitor.status === 'PENDING') {
          checkoutTriggered.current = true;
          showToast(language === 'HI' ? 'आपका स्वागत है! कृपया पहले चेक-इन करें।' : 'Welcome! Please check-in first.', 'info');
        } else {
          checkoutTriggered.current = true;
          // Small delay to let the UI settle
          const timer = setTimeout(() => {
            handleCheckOut();
          }, 1200);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [visitor, loading, checkingOut, language]);

  const handleCheckOut = async () => {
    if (onCheckOut) {
      onCheckOut();
      return;
    }

    const vid = visitor?.visitId || visitor?.visitorId || visitorId;
    if (!visitor || !organization?.id || checkingOut) return;
    if (visitor.status === 'CHECKED OUT') {
      setShowReviewModal(true);
      const reviewPromptMsg = language === 'HI'
        ? 'कृपया अपना अनुभव साझा करें।'
        : 'Please take a moment to rate your experience.';
      showToast(reviewPromptMsg, 'success');
      return;
    }
    if (visitor.status === 'PENDING') {
      showToast(language === 'HI' ? 'चेक-आउट से पहले कृपया चेक-इन करें।' : 'Please check-in before checking out.', 'error');
      return;
    }

    setCheckingOut(true);
    try {
      if (!vid) throw new Error('Missing visitor ID');

      // Use API for reliable checkout even if anonymous
      const response = await fetch(`/api/visitors/${vid}/checkout`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          organizationId: organization.id,
          checkOutTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
        })
      });

      if (!response.ok) {
        // Fallback to direct Firestore if API fails (might work for logged in users)
        const visitorRef = doc(db, 'organizations', organization.id, 'visits', vid);
        const checkOutTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        
        await updateDoc(visitorRef, {
          status: 'CHECKED OUT',
          checkOutTime: checkOutTime,
          updatedAt: new Date().toISOString()
        });
      }

      // Update pre-registration if linked (best effort)
      if (visitor.preRegistrationId) {
        try {
          await updateDoc(doc(db, 'organizations', organization.id, 'preRegistrations', visitor.preRegistrationId), {
            status: 'COMPLETED',
            updatedAt: new Date().toISOString()
          });
        } catch (preRegErr) {
          console.error('Failed to update pre-registration on checkout:', preRegErr);
        }
      }

      // Trigger both centered review modal and a toast popup
      const checkOutSuccessMsg = language === 'HI'
        ? 'चेक-आउट सफल! कृपया अपना अनुभव साझा करें।'
        : 'Check-out successful! Please share your feedback in the review panel.';
      showToast(checkOutSuccessMsg, 'success');

      // Trigger review modal after successful checkout
      setTimeout(() => {
        setShowReviewModal(true);
      }, 1000);
      
    } catch (err) {
      console.error('Check-out failed:', err);
      showToast('Check-out process encountered an issue.', 'error');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleShare = async () => {
    if (!visitor || !organization) return;
    const vid = visitor.visitId || visitor.visitorId;
    const passUrl = `${window.location.origin}/?passId=${vid}&orgId=${organization.id}`;
    const visitorName = visitor.name || visitor.visitorName || 'Visitor';
    const visitDate = visitor.date ? new Date(visitor.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today';
    
    const template = organization.preRegSettings?.templates?.digitalPass || DEFAULT_WHATSAPP_TEMPLATES.digitalPass;
    const checkoutUrl = `${window.location.origin}/?passId=${vid}&orgId=${organization.id}&mode=checkout`;
    let message = template
      .replace(/{{name}}/g, visitorName)
      .replace(/{{date}}/g, visitDate)
      .replace(/{{location}}/g, organization.name)
      .replace(/{{url}}/g, passUrl)
      .replace(/{{checkout_url}}/g, checkoutUrl);
      
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(passUrl)}`;
      
    // Fallback if the legacy template doesn't include the checkout_url tag
    if (!template.includes('{{checkout_url}}')) {
       message += `\n\n🚪 *Ready to leave?*\nYou can check out using this direct link:\n👉 ${checkoutUrl}`;
    }
    
    // Append QR Code image link directly so it shows up
    if (!message.includes('api.qrserver.com')) {
       message += `\n\n📷 *Direct QR Code Image:*\n${qrImageUrl}`;
    }
    
    const phoneToUse = visitor.visitorPhone || visitor.phone;
    const digitsOnly = phoneToUse?.replace(/\D/g, '') || '';
    
    if (!digitsOnly || digitsOnly.length < 10) {
      showToast('The mobile number provided is either missing or invalid for WhatsApp.', 'error');
      return;
    }
    
    let formattedPhone = digitsOnly;
    if (formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }
    
    // Use official WhatsApp API URL which is highly reliable
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
    
    // Attempt to open in new tab immediately to prevent popup blocker
    const newWindow = window.open(whatsappUrl, '_blank');
    
    // Fallback for blocked popups or certain mobile browsers
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.location.href = whatsappUrl;
    }

    showToast('WhatsApp link opened successfully', 'info');

    // Update status in Firestore if possible (in background)
    const vidToUpdate = visitor.visitId || visitor.visitorId || visitorId;
    if (vidToUpdate && organization?.id) {
      try {
        const visitorRef = doc(db, 'organizations', organization.id, 'visits', vidToUpdate);
        await updateDoc(visitorRef, {
          whatsappStatus: 'SENT',
          whatsappSentAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Could not update WhatsApp status for visit:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-[3rem]">
        <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Verifying Digital Pass...</p>
      </div>
    );
  }

  if (error || !visitor) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-[3rem] text-center max-w-sm mx-auto">
        <AlertCircle className="h-16 w-16 text-rose-500 mb-6" />
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Access Denied</h3>
        <p className="text-slate-500 font-medium mb-8">{error || 'This pass is no longer active or could not be found.'}</p>
        {!standalone && onClose && (
          <button onClick={onClose} className="px-8 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl font-black uppercase tracking-widest text-[10px]">
            Close Screen
          </button>
        )}
      </div>
    );
  }

  const vid = visitor.visitId || visitor.visitorId;
  const passUrl = `${window.location.origin}/?passId=${vid}&orgId=${organization?.id}&mode=checkout`;
  const isCheckedOut = visitor.status === 'CHECKED OUT';

  return (
    <div className={`relative w-full flex items-center justify-center overflow-x-hidden ${standalone ? 'min-h-screen bg-slate-50 dark:bg-slate-950 p-2 sm:p-4' : 'p-0'}`}>
      {standalone && (
        <div className="absolute top-4 left-4 z-50">
          <button 
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 shadow-xl rounded-xl border border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-blue transition-all active:scale-95"
          >
            <ChevronLeft className="h-4 w-4" />
            VMS Home
          </button>
        </div>
      )}
      
      <div className="w-full flex items-center justify-center py-2 sm:py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-[380px] sm:max-w-[440px] bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.25)] border border-slate-100 dark:border-slate-800 overflow-hidden relative mx-auto"
        >
        {/* Pass Top Section */}
        <div className="bg-gradient-to-br from-brand-blue via-indigo-600 to-violet-700 p-6 sm:p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-20 -mr-24 -mt-24 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 p-16 -ml-20 -mb-20 bg-black/10 rounded-full blur-3xl" />
          
          <div className="flex justify-between items-start relative z-10">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 shadow-lg">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/90">Identity Verified</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 ml-1">Secure Digital Credential</p>
            </div>
            {!standalone && onClose && (
              <button 
                onClick={onClose}
                className="p-3 hover:bg-white/30 rounded-2xl transition-all border border-white/10 bg-white/10 active:scale-90 shadow-lg group"
                aria-label="Close pass"
              >
                <X className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            )}
          </div>

          <div className="mt-8 sm:mt-10 relative z-10">
            <div className="flex items-end gap-2 sm:gap-3 mb-2">
              <h2 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase leading-none break-words max-w-full">{visitor.name || visitor.visitorName}</h2>
              <div className="h-2 w-2 bg-white rounded-full mb-1 sm:mb-1.5 shrink-0" />
            </div>
            <div className="flex items-center gap-3 bg-black/20 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-white/10 w-fit">
              <Hash className="h-3 w-3 text-brand-blue" />
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest leading-none">{visitor.visitId || visitor.visitorId}</span>
            </div>
          </div>

          <div className="mt-8 sm:mt-10 flex items-center justify-between relative z-10">
            <div className="flex flex-wrap gap-2">
              {!isCheckedOut ? (
                <div className="flex items-center gap-2 sm:gap-3 bg-emerald-500/20 backdrop-blur-md px-3 sm:px-5 py-2 sm:py-2.5 rounded-2xl border border-emerald-500/30">
                  <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                  <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-emerald-100">Inside Now</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3 bg-rose-500/20 backdrop-blur-md px-3 sm:px-5 py-2 sm:py-2.5 rounded-2xl border border-rose-500/30">
                  <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 bg-rose-400 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                  <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-rose-100">Logged Out</span>
                </div>
              )}

              {visitor.isEmergency && (
                <div className="flex items-center gap-2 sm:gap-3 bg-red-600 px-3 sm:px-5 py-2 sm:py-2.5 rounded-2xl border border-white/20 shadow-lg shadow-red-500/20 animate-pulse">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-white italic">Emergency Pass</span>
                </div>
              )}
            </div>
            
            <div className="text-right">
              <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-white/50 mb-0.5">Org Unit</p>
              <p className="text-[10px] sm:text-xs font-black uppercase tracking-tight truncate max-w-[120px]">{organization?.name}</p>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-6 sm:p-10 space-y-6 sm:space-y-8 bg-white dark:bg-slate-900 border-x border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-y-6 sm:gap-y-8 gap-x-4 sm:gap-x-10">
            <div className="space-y-1">
              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Building2 className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-brand-blue" /> Purpose
              </p>
              <p className="font-black text-slate-900 dark:text-white uppercase leading-snug tracking-tight text-xs sm:text-sm">{visitor.purpose}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <User className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-brand-blue" /> Type
              </p>
              <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xs sm:text-sm">{visitor.category || 'Guest'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Clock className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-brand-blue" /> Arrived
              </p>
              <p className="font-black text-slate-900 dark:text-white uppercase text-xs sm:text-sm">{visitor.checkInTime}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Calendar className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-brand-blue" /> Date
              </p>
              <p className="font-black text-slate-900 dark:text-white uppercase text-xs sm:text-sm">
                {new Date(visitor.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
              </p>
            </div>
            {isCheckedOut && (
              <div className="space-y-2 col-span-2 p-4 bg-rose-50 dark:bg-rose-500/5 rounded-2xl border border-rose-100 dark:border-rose-500/10">
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-1">
                  <LogOut className="h-3.5 w-3.5" /> Departure Logged
                </p>
                <p className="font-black text-rose-600 dark:text-rose-400 uppercase text-lg">{visitor.checkOutTime}</p>
              </div>
            )}
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-center justify-center py-6 sm:py-10 border-y border-slate-100 dark:border-slate-800 space-y-6 bg-slate-50/30 dark:bg-slate-900/50 relative overflow-hidden">
            <div className="p-4 sm:p-6 bg-white dark:bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_20px_50px_-20px_rgba(37,99,235,0.3)] border border-slate-100 group transition-all duration-500 hover:shadow-[0_30px_70px_-20px_rgba(37,99,235,0.4)] hover:scale-[1.02] active:scale-[0.98] relative">
              <QRCodeSVG 
                value={passUrl} 
                size={typeof window !== 'undefined' && window.innerWidth < 400 ? 200 : 240} 
                level="H"
                fgColor={isCheckedOut ? "rgba(15, 23, 42, 0.4)" : "#000000"}
                bgColor="#ffffff"
                includeMargin={true}
                imageSettings={organization?.logoUrl ? {
                  src: organization.logoUrl,
                  x: undefined,
                  y: undefined,
                  height: 40,
                  width: 40,
                  excavate: true,
                } : undefined}
              />
              {isCheckedOut && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-rose-600 text-white px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] rotate-[-12deg] shadow-2xl border-4 border-white dark:border-slate-900">
                    Pass Invalid
                  </div>
                </div>
              )}
            </div>
            <div className="text-center space-y-2">
              <p className="text-[9px] sm:text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.35em]">
                Authenticity Token
              </p>
              <div className="flex items-center justify-center gap-1.5 px-6">
                <span className="h-0.5 sm:h-1 w-4 sm:w-8 bg-brand-blue/20 rounded-full" />
                <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none whitespace-nowrap">
                  {isCheckedOut ? 'Departure confirmed' : 'Scan to check-out'}
                </p>
                <span className="h-0.5 sm:h-1 w-4 sm:w-8 bg-brand-blue/20 rounded-full" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 gap-4 sm:gap-5 mt-6 sm:mt-10">
            {!isCheckedOut && visitor.status !== 'PENDING' ? (
              <div className="space-y-4">
                 <div className="relative h-16 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl p-1.5 flex items-center overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner group">
                   {/* Animated Track Overlay */}
                   <motion.div 
                     className="absolute left-0 top-0 bottom-0 bg-brand-blue/20 pointer-events-none"
                     style={{ width: x }}
                   />

                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <motion.span 
                       style={{ opacity: textOpacity }}
                       className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-slate-500 transition-colors"
                     >
                       Swipe Right to Check-out
                     </motion.span>
                   </div>
                   
                   <motion.div
                     drag="x"
                     dragConstraints={{ left: 0, right: 260 }} 
                     dragElastic={0}
                     dragMomentum={false}
                     style={{ x }}
                     onDragEnd={(e, info) => {
                       if (info.offset.x > 200) {
                         handleCheckOut();
                       } else {
                         x.set(0);
                       }
                     }}
                     className="h-full aspect-square bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center cursor-grab active:cursor-grabbing shadow-xl z-20 group/handle"
                   >
                     {checkingOut ? (
                       <div className="w-5 h-5 border-3 border-white dark:border-slate-900 border-t-transparent rounded-full animate-spin" />
                     ) : (
                       <ArrowRight className="text-white dark:text-slate-900 h-6 w-6 sm:h-8 sm:w-8 group-active/handle:scale-95 transition-transform" />
                     )}
                   </motion.div>
                 </div>
                 
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">
                    Authorized Exit Protocol Required
                 </p>
              </div>
            ) : (
              <div className="w-full py-4 sm:py-6 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] sm:text-[12px] flex flex-col items-center justify-center gap-2 border border-emerald-100 dark:border-emerald-500/20 shadow-xl overflow-hidden relative">
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-3 relative z-10"
                >
                  <CheckCircle2 className="h-6 w-6" />
                  Departure Confirmed
                </motion.div>
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
              </div>
            )}
            
            <button
              onClick={handleShare}
              className="w-full py-4 sm:py-5 bg-emerald-500 dark:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] sm:text-[11px] hover:bg-emerald-600 dark:hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/30 active:scale-95 flex items-center justify-center gap-3 sm:px-10 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1"
            >
              <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
              Transfer via WhatsApp
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showReviewModal && visitor && (
          <ReviewModal
            visitorName={visitor.name || visitor.visitorName}
            visitorId={visitor.visitorId || visitor.visitId}
            googleReviewUrl={organization?.googleReviewUrl}
            isMandatory={!!visitor.preRegistrationId}
            lang={language}
            onClose={() => setShowReviewModal(false)}
            onSave={async (rating, comment) => {
              if (!organization?.id) return;
              try {
                const vidToReview = visitor.visitId || visitor.visitorId || visitorId;
                // Use API for review submission to overcome Firestore security rules for anonymous visitors
                const response = await fetch(`/api/visitors/${vidToReview}/review`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    organizationId: organization.id,
                    rating, 
                    comment 
                  })
                });

                if (!response.ok) {
                   // Fallback attempt to Firestore (might work if user is signed in)
                   await addDoc(collection(db, 'organizations', organization.id, 'reviews'), {
                     visitorId: vidToReview,
                     visitorName: visitor.name || visitor.visitorName,
                     rating,
                     comment,
                     timestamp: new Date().toISOString()
                   });
                }
                
                setShowReviewModal(false);
                showToast('Thank you for your feedback!', 'success');
              } catch (err) {
                console.error('Failed to save review:', err);
                showToast('Failed to save review. Please try again.', 'error');
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  </div>
  );
}
