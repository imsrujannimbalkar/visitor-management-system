import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Phone, Mail, Calendar, MapPin, UserCheck, FileText, Search, History, CheckCircle2, PenTool, Undo2, Redo2, Trash2, AlertCircle, MessageCircle, ChevronDown, Gift, DollarSign } from 'lucide-react';
import { PurposeType, VisitorType, Visitor } from '../types';
import { DEFAULT_WHATSAPP_TEMPLATES } from '../constants';
import { useToast } from './Toast';
import SignatureCanvasFromLib from 'react-signature-canvas';

const SignatureCanvas = (SignatureCanvasFromLib as any).default || SignatureCanvasFromLib;

import VoiceInput from './VoiceInput';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';

interface VisitorFormProps {
  onClose: () => void;
  onSave: (visitor: any) => void;
  initialData?: Visitor | null;
  existingVisitors?: Visitor[];
  isKiosk?: boolean;
  isSaving?: boolean;
  lang?: 'EN' | 'HI';
  customPurposes?: string[];
  customCategories?: string[];
  donationOccasions?: string[];
  eventOccasions?: string[];
  organizationName?: string;
  organizationId?: string;
}

export const PURPOSES: string[] = [
  'Meeting', 'Donation', 'Volunteering', 'Inquiry', 'Event', 'Interview', 
  'Student Visit', 'Service Visit', 'Delivery', 'Official Visit', 'Company Visit', 'Other'
];

export const TYPES: string[] = [
  'Donor', 'Volunteer', 'Beneficiary', 'Partner', 'Vendor', 'Guest', 'Staff', 'Student', 'Organization'
];

interface UnifiedDropdownProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  placeholder: string;
  required?: boolean;
  supportVoice?: boolean;
  error?: boolean;
}

function UnifiedDropdown({ label, icon, value, options, onChange, placeholder, required, supportVoice, error }: UnifiedDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-2" ref={dropdownRef}>
      <label className={`flex items-center gap-2 text-[11px] font-bold ${error ? 'text-red-500' : 'text-gray-500'} uppercase tracking-wider ml-1`}>
        {icon}
        {label} {required && '*'}
      </label>
      <div className="relative group">
        {supportVoice ? (
          <VoiceInput
            required={required}
            type="text"
            placeholder={placeholder}
            className={`w-full pr-6 py-4 bg-white border ${error ? 'border-red-500 animate-pulse' : 'border-gray-200'} rounded-xl focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 transition-all outline-none font-bold text-gray-900 shadow-sm hover:border-gray-300 group-hover:bg-gray-50/50`}
            value={value}
            onValueChange={onChange}
            onFocus={() => setIsOpen(true)}
            icon={icon}
          />
        ) : (
          <div 
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full px-6 py-4 bg-white border ${error ? 'border-red-500 animate-pulse' : 'border-gray-200'} rounded-xl focus-within:border-brand-blue focus-within:ring-4 focus-within:ring-brand-blue/5 transition-all outline-none font-bold text-gray-900 shadow-sm hover:border-gray-300 group-hover:bg-gray-50/50 cursor-pointer flex items-center justify-between`}
          >
            <span className={value ? 'text-gray-900' : 'text-gray-300'}>
              {value || placeholder}
            </span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        )}
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute z-[9999] w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
            >
              <div className="p-2">
                {options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between ${
                      value === opt 
                        ? 'bg-brand-blue text-white' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-brand-blue'
                    }`}
                  >
                    {opt}
                    {value === opt && <CheckCircle2 className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export const DEFAULT_DONATION_OCCASIONS = [
  'Birthday', 'Anniversary', 'Brothers Birthday', 'Anniversary Birthday', 'Daughters Birthday', 
  'Daughters Site', 'Daughter in Law Birthday', 'Fathers Birth Anniversary', 'Fathers Birthday', 
  'Father in Laws Birth', 'Memorial', 'Wedding', 'New Home', 'Other'
];

export const DEFAULT_DONATION_TYPES = [
  'Anonymously', 'Child Sponsorship', 'Educational Sponsorship', 'General Donation', 
  'Meal Sponsorship', 'School Kid Sponsorship', 'CSR Contribution'
];

export const DEFAULT_PAYMENT_MODES = [
  'INSTAMOJO', 'NEFT_Union_SB_419', 'IMPS_Union_SB_419', 'CHEQUE', 
  'NEFT_YES_SB_214', 'IMPS_YES_SB_214', 'Paytm_7353767637', 'Mswipe_PG', 
  'UPI Transactions', 'PAYUMONEY', 'UBI BANK_SB_419', 'YES BANK_SB_214', 'DONATION BOX CASH'
];

export const DEFAULT_EVENT_OCCASIONS = [
  'Musical Concert', 'Theatre/Play', 'Exhibition', 'Workshop', 'Conference', 'Seminar', 
  'Community Kitchen', 'Celebration', 'Award Ceremony', 'Other'
];

export default function VisitorForm({ 
  onClose, 
  onSave, 
  initialData, 
  existingVisitors = [], 
  isKiosk = false, 
  isSaving = false, 
  lang = 'EN',
  customPurposes,
  customCategories,
  donationOccasions,
  eventOccasions,
  organizationName = 'VMS Flow',
  organizationId
}: VisitorFormProps) {
  const { showToast } = useToast();
  const [orgSettings, setOrgSettings] = useState<{
    purposes?: string[];
    visitorTypes?: string[];
    defaultLocation?: string;
    templates?: {
      digitalPass?: string;
    };
  } | null>(null);

  useEffect(() => {
    if (organizationId && !customPurposes && !customCategories) {
      const loadOrgSettings = async () => {
        try {
          const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
          if (orgDoc.exists()) {
            const data = orgDoc.data();
            if (data.preRegSettings) {
              setOrgSettings(data.preRegSettings);
            }
          }
        } catch (err) {
        }
      };
      loadOrgSettings();
    }
  }, [organizationId, customPurposes, customCategories]);

  const finalPurposes = customPurposes && customPurposes.length > 0 
    ? customPurposes 
    : (orgSettings?.purposes || PURPOSES);
  const finalCategories = customCategories && customCategories.length > 0 
    ? customCategories 
    : (orgSettings?.visitorTypes || TYPES);
  const finalOrgName = orgSettings?.defaultLocation || organizationName;

  const finalDonationOccasions = donationOccasions && donationOccasions.length > 0 ? donationOccasions : DEFAULT_DONATION_OCCASIONS;
  const finalEventOccasions = eventOccasions && eventOccasions.length > 0 ? eventOccasions : DEFAULT_EVENT_OCCASIONS;

  const t = (en: string, hi: string) => (isKiosk && lang === 'HI' ? hi : en);
  const [formData, setFormData] = useState({
    visitorId: '',
    name: '',
    phone: '',
    countryCode: '+91',
    email: '',
    dob: '',
    address: '',
    purpose: '' as PurposeType | '',
    category: '' as VisitorType | '',
    occasion: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    checkInTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    signature: ''
  });

  const [returningVisitor, setReturningVisitor] = useState<Visitor | null>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [visitCount, setVisitCount] = useState(0);
  const [previousVisits, setPreviousVisits] = useState<Visitor[]>([]);
  const [isAlreadyInside, setIsAlreadyInside] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const sigCanvas = useRef<any>(null);
  const [sigHistory, setSigHistory] = useState<any[]>([]);
  const [sigIndex, setSigIndex] = useState(-1);

  // Auto-generate Visitor ID if not present
  useEffect(() => {
    if (!initialData && !formData.visitorId) {
      const dateStr = formData.date.replace(/-/g, '');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      setFormData(prev => ({ ...prev, visitorId: `AF-${dateStr}-${random}` }));
    }
  }, [initialData, formData.date]);

  useEffect(() => {
    if (initialData) {
      // Handle phone with country code if stored together
      let phone = initialData.phone;
      let code = '+91';
      if (phone.startsWith('+')) {
        const parts = phone.split(' ');
        if (parts.length > 1) {
          code = parts[0];
          phone = parts.slice(1).join(' ');
        }
      }

      setFormData({
        visitorId: initialData.visitorId,
        name: initialData.name,
        phone: phone,
        countryCode: code,
        email: initialData.email,
        dob: initialData.dob,
        address: initialData.address || '',
        purpose: initialData.purpose,
        category: (initialData as any).category as any,
        occasion: (initialData as any).occasion || '',
        notes: initialData.notes,
        date: initialData.date,
        checkInTime: initialData.checkInTime,
        signature: (initialData as any).signature || ''
      });
    }
  }, [initialData]);

  const lt = {
    formIncomplete: { EN: 'Form Incomplete', HI: 'फॉर्म अधूरा है' },
    alreadyInside: { EN: 'This visitor is already checked in and currently inside.', HI: 'यह आगंतुक पहले से ही चेक-इन है और वर्तमान में अंदर है।' },
    enterName: { EN: "Please enter the visitor's name.", HI: "कृपया आगंतुक का नाम दर्ज करें।" },
    enterPhone: { EN: "Please enter the visitor's phone number.", HI: "कृपया आगंतुक का फोन नंबर दर्ज करें।" },
    selectPurpose: { EN: 'Please select a purpose of visit.', HI: 'कृपया भेंट का उद्देश्य चुनें।' },
    selectCategory: { EN: 'Please select a visitor type.', HI: 'कृपया आगंतुक प्रकार चुनें।' },
    provideSignature: { EN: 'Please provide your signature.', HI: 'कृपया अपने हस्ताक्षर प्रदान करें।' },
    saveError: { EN: 'An error occurred while saving. Please try again.', HI: 'सहेजते समय एक त्रुटि हुई। कृपया पुन: प्रयास करें।' },
    welcomeBack: { EN: 'Welcome Back!', HI: 'वापसी पर स्वागत है!' },
    foundRecord: { EN: (name: string) => `Found existing record for ${name}. Details auto-filled.`, HI: (name: string) => `${name} के लिए मौजूदा रिकॉर्ड मिला। विवरण स्वतः भर गए।` },
    newEntry: { EN: 'New Visitor Entry', HI: 'नया आगंतुक प्रवेश' },
    editRecord: { EN: 'Edit Record', HI: 'रिकॉर्ड अपडेट करें' },
  };

  // Returning visitor detection and duplicate check
  useEffect(() => {
    const cleanPhone = (formData.phone || '').replace(/\D/g, '');
    if (cleanPhone.length >= 10 && !initialData) {
      const allVisits = existingVisitors.filter(v => {
        const vPhone = (v.phone || '').replace(/\D/g, '');
        return vPhone.endsWith(cleanPhone) || cleanPhone.endsWith(vPhone);
      });
      
      const isReturning = allVisits.length > 0;
      const activeVisit = allVisits.find(v => v.status === 'INSIDE');
      setIsAlreadyInside(!!activeVisit);

      if (isReturning && !isAutoFilled) {
        const sortedVisits = [...allVisits].sort((a, b) => new Date(`${b.date} ${b.checkInTime}`).getTime() - new Date(`${a.date} ${a.checkInTime}`).getTime());
        const lastVisit = sortedVisits[0];
        
        setReturningVisitor(lastVisit);
        setVisitCount(allVisits.length);
        setPreviousVisits(sortedVisits);
        
        // Smart auto-fill
        setFormData(prev => ({
          ...prev,
          name: lastVisit.name || prev.name,
          email: lastVisit.email || prev.email,
          address: lastVisit.address || prev.address,
          category: (lastVisit as any).category || prev.category,
          dob: lastVisit.dob || prev.dob
        }));
        setIsAutoFilled(true);

        const msg = isKiosk && lang === 'HI' 
          ? lt.foundRecord.HI(lastVisit.name)
          : lt.foundRecord.EN(lastVisit.name);
        showToast(msg, 'info');
      }
    } else if (cleanPhone.length < 10) {
      setReturningVisitor(null);
      setIsAutoFilled(false);
      setIsAlreadyInside(false);
    }
  }, [formData.phone, existingVisitors, initialData, isAutoFilled, lang, isKiosk]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, boolean> = {
      name: !formData.name,
      purpose: !formData.purpose,
      category: !formData.category,
      phone: !formData.phone,
      signature: !formData.signature && !initialData
    };

    setErrors(newErrors);

    const showAlert = (message: string) => {
      Swal.fire({
        title: isKiosk && lang === 'HI' ? lt.formIncomplete.HI : lt.formIncomplete.EN,
        text: message,
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3b82f6',
        customClass: {
          popup: 'rounded-[2.5rem] shadow-2xl p-8 border-none',
          confirmButton: 'rounded-xl px-10 py-3 font-bold uppercase tracking-widest text-xs',
          title: 'text-2xl font-black text-slate-900 mb-2',
          htmlContainer: 'text-sm font-medium text-slate-500'
        },
        buttonsStyling: true,
        showClass: {
          popup: 'animate__animated animate__fadeInDown animate__faster'
        }
      });
    };

    if (isAlreadyInside) {
      showAlert(isKiosk && lang === 'HI' ? lt.alreadyInside.HI : lt.alreadyInside.EN);
      return;
    }
    
    if (newErrors.name) {
      showAlert(isKiosk && lang === 'HI' ? lt.enterName.HI : lt.enterName.EN);
      return;
    }

    if (newErrors.phone) {
      showAlert(isKiosk && lang === 'HI' ? lt.enterPhone.HI : lt.enterPhone.EN);
      return;
    }
    
    if (newErrors.purpose) {
      showAlert(isKiosk && lang === 'HI' ? lt.selectPurpose.HI : lt.selectPurpose.EN);
      return;
    }
    if (newErrors.category) {
      showAlert(isKiosk && lang === 'HI' ? lt.selectCategory.HI : lt.selectCategory.EN);
      return;
    }
    if (newErrors.signature) {
      showAlert(isKiosk && lang === 'HI' ? lt.provideSignature.HI : lt.provideSignature.EN);
      return;
    }

    setIsSubmitting(true);
    try {
      const submissionData = {
        ...formData,
        phone: `${formData.countryCode} ${formData.phone}`,
        signature: formData.signature || (sigCanvas.current ? sigCanvas.current.toDataURL('image/png') : '')
      };
      await onSave(submissionData);
    } catch (error) {
      showToast(isKiosk && lang === 'HI' ? lt.saveError.HI : lt.saveError.EN, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isKiosk) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-brand-blue rounded-xl shadow-lg shadow-blue-100">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic">
                {initialData 
                  ? (lang === 'HI' ? lt.editRecord.HI : lt.editRecord.EN) 
                  : (lang === 'HI' ? lt.newEntry.HI : lt.newEntry.EN)}
              </h3>
              <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">
                {lang === 'HI' ? `${organizationName} डिजिटल प्रविष्टि` : `${organizationName} Digital Entry`}
              </p>
            </div>
          </div>

          <AnimatePresence>
            {isAlreadyInside && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="bg-rose-50 border border-rose-100 rounded-2xl overflow-hidden shadow-sm flex flex-col p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-rose-500 rounded-xl shadow-lg shadow-rose-100 shrink-0">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-rose-900 leading-tight uppercase italic">{lang === 'HI' ? 'पहले से चेक-इन' : 'Already Checked In'}</p>
                    <p className="text-sm text-rose-700 font-bold opacity-80 mt-1">
                      {lang === 'HI' 
                        ? 'यह आगंतुक वर्तमान में "अंदर" के रूप में चिह्नित है। कृपया नई प्रविष्टि बनाने से पहले उन्हें चेक आउट करें।'
                        : 'This visitor is currently marked as "INSIDE". Please check them out before creating a new entry.'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {returningVisitor && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="bg-blue-50/30 border border-blue-100 rounded-3xl overflow-hidden shadow-sm flex flex-col"
              >
                <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-blue-100/50">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-brand-blue rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 shrink-0">
                      <History className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-black text-blue-900 leading-tight italic uppercase">
                        {initialData ? t('Visitor History', 'आगंतुक इतिहास') : t('Welcome Back!', 'वापसी पर स्वागत है!')}
                      </p>
                      <p className="text-sm text-blue-700 font-bold opacity-70">
                        {visitCount} {t('total visits recorded.', 'कुल भेंट दर्ज की गईं।')} {!initialData && t('Details auto-filled.', 'विवरण स्वतः भरे गए।')}
                      </p>
                    </div>
                  </div>
                  <div className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-emerald-100">
                    {t('Smart Match Found', 'स्मार्ट मैच मिला')}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-12">
            {/* Section 1: Visit Details */}
            <div className="bg-gray-50/50 p-6 sm:p-8 rounded-[2rem] border border-gray-100 space-y-8">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-brand-blue rounded-full" />
                <h4 className="text-xs font-bold text-brand-blue uppercase tracking-widest">{t('Visit Information', 'यात्रा की जानकारी')}</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                    <FileText className="h-3 w-3" />
                    Visitor ID
                  </label>
                  <p className="px-6 py-4 bg-white border border-gray-100 rounded-xl font-mono font-bold text-gray-400">
                    {formData.visitorId}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                    <Calendar className="h-3 w-3" />
                    {t('Date', 'दिनांक')}
                  </label>
                  <p className="px-6 py-4 bg-white border border-gray-100 rounded-xl font-bold text-gray-400">
                    {formData.date}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                    <UserCheck className="h-3 w-3" />
                    {t('Check-in Time', 'प्रवेश समय')}
                  </label>
                  <p className="px-6 py-4 bg-white border border-gray-100 rounded-xl font-bold text-gray-400">
                    {formData.checkInTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Personal Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{t('Personal Details', 'व्यक्तिगत विवरण')}</h4>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className={`flex items-center gap-2 text-[11px] font-bold ${errors.name ? 'text-red-500' : 'text-gray-500'} uppercase tracking-wider ml-1`}>
                    <User className="h-3 w-3" />
                    {t('Full Name', 'पूरा नाम')} *
                  </label>
                  <VoiceInput
                    required
                    type="text"
                    placeholder={t("Enter visitor's full name", "आगंतुक का पूरा नाम दर्ज करें")}
                    className={`w-full pr-6 py-4 bg-white border ${errors.name ? 'border-red-500 animate-pulse' : 'border-gray-200'} rounded-xl focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 transition-all outline-none font-bold text-gray-900 shadow-sm hover:border-gray-300`}
                    value={formData.name}
                    onValueChange={(val) => {
                      setFormData({ ...formData, name: val });
                      if (val) setErrors(prev => ({ ...prev, name: false }));
                    }}
                    icon={<User className={`h-5 w-5 ${errors.name ? 'text-red-400' : 'text-gray-400'}`} />}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className={`flex items-center gap-2 text-[11px] font-bold ${errors.phone ? 'text-red-500' : 'text-gray-500'} uppercase tracking-wider ml-1`}>
                      <Phone className="h-3 w-3" />
                      {t('Phone Number', 'फ़ोन नंबर')} *
                    </label>
                    <div className={`flex items-stretch gap-0 border ${errors.phone ? 'border-red-500 animate-pulse' : 'border-gray-200'} rounded-xl overflow-hidden focus-within:border-brand-blue focus-within:ring-4 focus-within:ring-brand-blue/5 transition-all shadow-sm`}>
                      <div className="relative flex items-center bg-gray-50 border-r border-gray-100">
                        <select
                          className="pl-5 pr-9 py-4 bg-transparent outline-none font-bold text-gray-900 appearance-none cursor-pointer text-sm"
                          value={formData.countryCode}
                          onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                        >
                          <option value="+91">+91</option>
                          <option value="+1">+1</option>
                          <option value="+44">+44</option>
                          <option value="+971">+971</option>
                        </select>
                        <ChevronDown className="absolute right-3 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                      <input
                        required
                        type="tel"
                        placeholder="9876543210"
                        className="flex-1 px-5 py-4 bg-white outline-none font-bold text-gray-900 placeholder:text-gray-300 min-w-0"
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData({ ...formData, phone: e.target.value });
                          if (e.target.value) setErrors(prev => ({ ...prev, phone: false }));
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                      <Mail className="h-3 w-3" />
                      {t('Email Address', 'ईमेल पता')}
                    </label>
                    <input
                      type="email"
                      placeholder={t("e.g. visitor@example.com", "जैसे: visitor@example.com")}
                      className="w-full px-6 py-4 bg-white border border-gray-200 rounded-xl focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 transition-all outline-none font-bold text-gray-900 shadow-sm hover:border-gray-300"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                      <Calendar className="h-3 w-3" />
                      {t('Date of Birth', 'जन्म तिथि')}
                    </label>
                    <input
                      type="date"
                      className="w-full px-6 py-4 bg-white border border-gray-200 rounded-xl focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 transition-all outline-none font-bold text-gray-900 shadow-sm hover:border-gray-300"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    />
                  </div>

                  <UnifiedDropdown
                    label={t("Visitor Category", "आगंतुक श्रेणी")}
                    icon={<UserCheck className={`h-3 w-3 ${errors.category ? 'text-red-500' : ''}`} />}
                    value={formData.category}
                    options={finalCategories}
                    onChange={(val) => {
                      setFormData({ ...formData, category: val as any });
                      if (val) setErrors(prev => ({ ...prev, category: false }));
                    }}
                    placeholder={t("Select Category", "श्रेणी चुनें")}
                    required
                    error={errors.category}
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                    <MapPin className="h-3 w-3" />
                    {t('Residential Address', 'आवासीय पता')}
                  </label>
                  <VoiceInput
                    type="text"
                    placeholder={t("Enter complete address", "पूरा पता दर्ज करें")}
                    className="w-full pr-6 py-4 bg-white border border-gray-200 rounded-xl focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 transition-all outline-none font-bold text-gray-900 shadow-sm hover:border-gray-300"
                    value={formData.address}
                    onValueChange={(val) => setFormData({ ...formData, address: val })}
                    icon={<MapPin className="h-4 w-4 text-gray-400" />}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Purpose & Notes */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-amber-500 rounded-full" />
                <h4 className="text-xs font-bold text-amber-600 uppercase tracking-widest">{t('Purpose & Notes', 'उद्देश्य और नोट्स')}</h4>
              </div>

              <div className="space-y-6">
                <UnifiedDropdown
                  label={t("Purpose of Visit", "भेंट का उद्देश्य")}
                  icon={<Search className={`h-3 w-3 ${errors.purpose ? 'text-red-500' : ''}`} />}
                  value={formData.purpose}
                  options={finalPurposes}
                  onChange={(val) => {
                    setFormData({ ...formData, purpose: val as PurposeType });
                    if (val) setErrors(prev => ({ ...prev, purpose: false }));
                  }}
                  placeholder={t("e.g. Meeting, Interview...", "जैसे: मीटिंग, इंटरव्यू...")}
                  required
                  supportVoice
                  error={errors.purpose}
                />

                <AnimatePresence>
                  {(formData.purpose === 'Donation' || formData.purpose === 'Event') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-6"
                    >
                      <UnifiedDropdown
                        label={t("Occasion", "अवसर")}
                        icon={<Gift className="h-3 w-3" />}
                        value={formData.occasion}
                        options={formData.purpose === 'Donation' ? finalDonationOccasions : finalEventOccasions}
                        onChange={(val) => setFormData({ ...formData, occasion: val })}
                        placeholder={t("Select Occasion", "अवसर चुनें")}
                        required
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                    <FileText className="h-3 w-3" />
                    {t('Additional Notes', 'अतिरिक्त नोट्स')}
                  </label>
                  <VoiceInput
                    type="text"
                    placeholder={t("Any special requests or information", "कोई विशेष अनुरोध या जानकारी")}
                    className="w-full pr-6 py-4 bg-white border border-gray-200 rounded-xl focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 transition-all outline-none font-bold text-gray-900 shadow-sm hover:border-gray-300"
                    value={formData.notes}
                    onValueChange={(val) => setFormData({ ...formData, notes: val })}
                    icon={<FileText className="h-4 w-4 text-gray-400" />}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Signature */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-purple-500 rounded-full" />
                <h4 className="text-xs font-bold text-purple-600 uppercase tracking-widest">{t('Verification', 'सत्यापन')}</h4>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <label className={`flex items-center gap-2 text-[11px] font-bold ${errors.signature ? 'text-red-500' : 'text-gray-500'} uppercase tracking-wider`}>
                    <PenTool className="h-3 w-3" />
                    {t('Signature', 'हस्ताक्षर')} *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (sigIndex > 0) {
                          const newIndex = sigIndex - 1;
                          setSigIndex(newIndex);
                          sigCanvas.current?.fromData(sigHistory[newIndex]);
                          setFormData(prev => ({ ...prev, signature: sigCanvas.current!.getCanvas().toDataURL('image/png') }));
                        } else if (sigIndex === 0) {
                          setSigIndex(-1);
                          sigCanvas.current?.clear();
                          setFormData(prev => ({ ...prev, signature: '' }));
                        }
                      }}
                      disabled={sigIndex < 0}
                      className="p-2 text-gray-400 hover:text-brand-blue disabled:opacity-30 transition-colors"
                      title="Undo"
                    >
                      <Undo2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (sigIndex < sigHistory.length - 1) {
                          const newIndex = sigIndex + 1;
                          setSigIndex(newIndex);
                          sigCanvas.current?.fromData(sigHistory[newIndex]);
                          setFormData(prev => ({ ...prev, signature: sigCanvas.current!.getCanvas().toDataURL('image/png') }));
                        }
                      }}
                      disabled={sigIndex >= sigHistory.length - 1}
                      className="p-2 text-gray-400 hover:text-brand-blue disabled:opacity-30 transition-colors"
                      title="Redo"
                    >
                      <Redo2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sigCanvas.current?.clear();
                        setSigHistory([]);
                        setSigIndex(-1);
                        setFormData(prev => ({ ...prev, signature: '' }));
                      }}
                      className="p-2 text-red-400 hover:text-red-600 transition-colors"
                      title="Clear"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className={`relative border border-dashed ${errors.signature ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50/30'} rounded-2xl overflow-hidden transition-all group shadow-inner bg-gray-50`}>
                    {formData.signature === '' && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <span className={`font-bold text-xl opacity-50 select-none uppercase tracking-widest ${errors.signature ? 'text-red-400' : 'text-gray-300'}`}>{t('Sign Here', 'यहाँ हस्ताक्षर करें')}</span>
                      </div>
                    )}
                    <SignatureCanvas
                        ref={sigCanvas}
                        penColor="black"
                        canvasProps={{
                          className: "w-full h-40 sm:h-56 cursor-crosshair relative z-10"
                        }}
                        onEnd={() => {
                          if (sigCanvas.current) {
                            const data = sigCanvas.current.toData();
                            const newHistory = sigHistory.slice(0, sigIndex + 1);
                            newHistory.push(data);
                            setSigHistory(newHistory);
                            setSigIndex(newHistory.length - 1);
                            setFormData(prev => ({ ...prev, signature: sigCanvas.current!.getCanvas().toDataURL('image/png') }));
                            setErrors(prev => ({ ...prev, signature: false }));
                          }
                        }}
                    />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 pb-12 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 px-8 py-4 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 uppercase tracking-widest text-[10px]"
            >
              {t('Cancel', 'रद्द करें')}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  ...formData,
                  name: '',
                  phone: '',
                  email: '',
                  dob: '',
                  address: '',
                  purpose: '',
                  category: '' as any,
                  notes: '',
                  signature: ''
                });
                setIsAutoFilled(false);
                setReturningVisitor(null);
                sigCanvas.current?.clear();
              }}
              className="w-full sm:flex-1 px-8 py-4 bg-white border border-gray-200 text-gray-400 font-bold rounded-xl hover:text-red-500 hover:border-red-100 transition-all active:scale-95 uppercase tracking-widest text-[10px]"
            >
              {t('Reset Form', 'फॉर्म रीसेट करें')}
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isAlreadyInside || isSubmitting || isSaving}
              className="w-full sm:flex-[2] px-8 py-4 bg-brand-blue text-white font-black rounded-xl hover:bg-brand-blue/90 transition-all shadow-xl shadow-blue-100 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-[0.2em] text-[10px]"
            >
              {isSubmitting || isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t('Saving...', 'सहेज रहे हैं...')}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  <span>{initialData ? t('Update Record', 'रिकॉर्ड अपडेट करें') : t('Confirm Check-in', 'चेक-इन की पुष्टि करें')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9000] p-4 md:p-6"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white pb-safe-area-top">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 bg-brand-blue rounded-xl shadow-lg shadow-blue-100">
              <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                {initialData 
                  ? (isKiosk && lang === 'HI' ? lt.editRecord.HI : lt.editRecord.EN) 
                  : (isKiosk && lang === 'HI' ? lt.newEntry.HI : lt.newEntry.EN)}
              </h3>
              <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">{isKiosk && lang === 'HI' ? `${organizationName} डिजिटल प्रविष्टि` : `${organizationName} Digital Entry`}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {formData.phone && formData.name && (
              <a
                onClick={(e) => {
                  e.preventDefault();
                  const visitorName = formData.name || (isKiosk && lang === 'HI' ? 'आगंतुक' : 'Visitor');
                  const visitDate = new Date(formData.date).toLocaleDateString(isKiosk && lang === 'HI' ? 'hi-IN' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                  const passUrl = `${window.location.origin}/?passId=${formData.visitorId}&orgId=${organizationId || ''}`;
                  
                  let message = '';
                  
                  const replacePlaceholders = (tmpl: string) => {
                    return tmpl
                      .replace(/{{name}}/g, visitorName)
                      .replace(/{{date}}/g, visitDate)
                      .replace(/{{location}}/g, finalOrgName)
                      .replace(/{{url}}/g, passUrl);
                  };

                  message = replacePlaceholders(orgSettings?.templates?.digitalPass || DEFAULT_WHATSAPP_TEMPLATES.digitalPass);
                  
                  const phone = (formData.countryCode + formData.phone).replace(/\D/g, '');
                  let formattedPhone = phone;
                  if (formattedPhone.length === 10) formattedPhone = '91' + formattedPhone;

                  const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
                  const win = window.open(url, '_blank');
                  if (!win) {
                    window.location.href = url;
                  }
                  showToast(isKiosk && lang === 'HI' ? 'व्हाट्सएप संदेश जनरेट किया गया' : 'WhatsApp message generated', 'success');
                }}
                href="#"
                className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition-all active:scale-90 flex items-center gap-2"
                title={isKiosk && lang === 'HI' ? "व्हाट्सएप संदेश भेजें" : "Send WhatsApp Message"}
              >
                <MessageCircle className="h-5 w-5" />
                <span className="hidden sm:inline text-xs font-bold uppercase tracking-widest">{isKiosk && lang === 'HI' ? 'व्हाट्सएप' : 'WhatsApp'}</span>
              </a>
            )}
            {!isKiosk && (
              <button 
                onClick={onClose} 
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-gray-600 active:scale-90"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-10 custom-scrollbar pb-safe-area-bottom">
          {/* Duplicate Check-in Warning */}
          <AnimatePresence>
            {isAlreadyInside && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="bg-rose-50 border border-rose-100 rounded-2xl overflow-hidden shadow-sm flex flex-col p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-rose-500 rounded-xl shadow-lg shadow-rose-100 shrink-0">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-rose-900 leading-tight">{isKiosk && lang === 'HI' ? 'पहले से चेक-इन' : 'Already Checked In'}</p>
                    <p className="text-sm text-rose-700 font-bold opacity-80 mt-1">
                      {isKiosk && lang === 'HI' 
                        ? 'यह आगंतुक वर्तमान में "अंदर" के रूप में चिह्नित है। कृपया नई प्रविष्टि बनाने से पहले उन्हें चेक आउट करें।'
                        : 'This visitor is currently marked as "INSIDE". Please check them out before creating a new entry.'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Returning Visitor Alert & History Panel */}
          <AnimatePresence>
            {returningVisitor && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="bg-blue-50/30 border border-blue-100 rounded-[2rem] overflow-hidden shadow-sm flex flex-col"
              >
                <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-blue-100/50">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-brand-blue rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 shrink-0">
                      <History className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-black text-blue-900 leading-tight">
                        {initialData ? t('Visitor History', 'आगंतुक इतिहास') : t('Welcome Back!', 'वापसी पर स्वागत है!')}
                      </p>
                      <p className="text-sm text-blue-700 font-bold opacity-70">
                        {visitCount} {t('total visits recorded.', 'कुल भेंट दर्ज की गईं।')} {!initialData && t('Details auto-filled.', 'विवरण स्वतः भरे गए।')}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {visitCount <= 1 && <span className="px-2 py-0.5 bg-blue-500 text-white text-[8px] font-black uppercase rounded shadow-sm tracking-widest">New Visitor</span>}
                        {visitCount >= 3 && <span className="px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-black uppercase rounded shadow-sm tracking-widest">Frequent Visitor</span>}
                        {returningVisitor.manualClassification === 'VIP' && <span className="px-2 py-0.5 bg-amber-500 text-white text-[8px] font-black uppercase rounded shadow-sm tracking-widest">VIP</span>}
                      </div>
                    </div>
                  </div>
                  {!initialData && (
                    <div className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-emerald-100">
                      {t('Smart Match Found', 'स्मार्ट मैच मिला')}
                    </div>
                  )}
                </div>
                
                {!isKiosk && (
                  <div className="p-6 bg-white/40 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-sm border border-blue-50/50 group hover:border-brand-blue/30 transition-colors">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Frequency</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-black text-brand-blue">{visitCount}</p>
                        <p className="text-xs font-bold text-gray-400">Visits</p>
                      </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-sm border border-blue-50/50 group hover:border-brand-blue/30 transition-colors">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Last Seen</p>
                      <p className="text-lg font-black text-gray-900">
                        {new Date(returningVisitor.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 mt-1">{returningVisitor.checkInTime}</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-sm border border-blue-50/50 group hover:border-brand-blue/30 transition-colors">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Common Purposes</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {Array.from(new Set(previousVisits.map(v => v.purpose))).slice(0, 3).map((purpose, i) => (
                          <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-lg border border-blue-100/50">
                            {purpose}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Sections */}
          <div className="space-y-10">
            {/* Section 1: Visit Details */}
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-brand-blue rounded-full" />
                <h4 className="text-xs font-bold text-brand-blue uppercase tracking-widest">Visit Information</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                    <FileText className="h-3 w-3" />
                    Visitor ID
                  </label>
                  <input
                    readOnly
                    type="text"
                    className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-400 font-mono font-bold cursor-not-allowed shadow-sm"
                    value={formData.visitorId}
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                    <Calendar className="h-3 w-3" />
                    {t('Visit Date', 'भेंट की तिथि')} *
                  </label>
                  <input
                    required
                    type="date"
                    className={`w-full px-5 py-3.5 bg-white border ${errors.date ? 'border-red-500 animate-pulse' : 'border-gray-200'} rounded-xl focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 transition-all outline-none font-bold text-gray-900 shadow-sm hover:border-gray-300`}
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                    <History className="h-3 w-3" />
                    {t('Check-in Time', 'चेक-इन समय')}
                  </label>
                  <input
                    readOnly
                    type="text"
                    className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-400 font-bold cursor-not-allowed shadow-sm"
                    value={formData.checkInTime}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Personal Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{t('Personal Details', 'व्यक्तिगत विवरण')}</h4>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                    <User className="h-3 w-3" />
                    {t('Full Name', 'पूरा नाम')} *
                  </label>
                  <VoiceInput
                    required
                    type="text"
                    placeholder={t("Enter visitor's full name", "आगंतुक का पूरा नाम दर्ज करें")}
                    className={`w-full pr-6 py-4.5 bg-white border ${errors.name ? 'border-red-500 animate-pulse' : 'border-gray-200'} rounded-xl focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 transition-all outline-none font-bold text-gray-900 shadow-sm hover:border-gray-300 text-lg`}
                    value={formData.name}
                    onValueChange={(val) => {
                      setFormData({ ...formData, name: val });
                      if (val) setErrors(prev => ({ ...prev, name: false }));
                    }}
                    icon={<User className={`h-4 w-4 sm:h-5 sm:w-5 ${errors.name ? 'text-red-400' : 'text-gray-400'} group-focus-within:text-brand-blue transition-colors`} />}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                      <Phone className="h-3 w-3" />
                      {t('Phone Number', 'फ़ोन नंबर')} *
                    </label>
                    <div className={`flex items-stretch gap-0 border ${errors.phone ? 'border-red-500 animate-pulse' : 'border-gray-200'} rounded-xl overflow-hidden focus-within:border-brand-blue focus-within:ring-4 focus-within:ring-brand-blue/5 transition-all shadow-sm`}>
                      <div className="relative flex items-center bg-gray-50 border-r border-gray-100">
                        <select
                          className="pl-4 pr-8 py-4 bg-transparent outline-none font-bold text-gray-900 appearance-none cursor-pointer text-sm"
                          value={formData.countryCode}
                          onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                        >
                          <option value="+91">+91</option>
                          <option value="+1">+1</option>
                          <option value="+44">+44</option>
                          <option value="+971">+971</option>
                          <option value="+61">+61</option>
                          <option value="+81">+81</option>
                        </select>
                        <ChevronDown className="absolute right-2 h-3 w-3 text-gray-400 pointer-events-none" />
                      </div>
                      <input
                        required
                        type="tel"
                        placeholder="9876543210"
                        className="flex-1 px-5 py-4 bg-white outline-none font-bold text-gray-900 placeholder:text-gray-300 min-w-0"
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData({ ...formData, phone: e.target.value });
                          if (e.target.value) setErrors(prev => ({ ...prev, phone: false }));
                        }}
                      />
                      {formData.phone && (
                        <div className="flex items-center gap-1 px-2 bg-gray-50 border-l border-gray-100">
                          <a href={formData.phone && formData.countryCode ? `tel:${formData.countryCode}${formData.phone}` : undefined} className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors" title="Call">
                            <Phone className="h-4 w-4" />
                          </a>
                          <a href={formData.phone && formData.countryCode ? `https://api.whatsapp.com/send?phone=${(formData.countryCode + formData.phone).replace(/\D/g, '')}` : undefined} target="_blank" rel="noopener noreferrer" className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors" title="WhatsApp">
                            <MessageCircle className="h-4 w-4" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                      <Mail className="h-3 w-3" />
                      {t('Email Address', 'ईमेल पता')}
                    </label>
                    <input
                      type="email"
                      placeholder={t("e.g. visitor@example.com", "जैसे: visitor@example.com")}
                      className="w-full px-6 py-4 bg-white border border-gray-200 rounded-xl focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 transition-all outline-none font-bold text-gray-900 shadow-sm hover:border-gray-300"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                      <Calendar className="h-3 w-3" />
                      {t('Date of Birth', 'जन्म तिथि')}
                    </label>
                    <input
                      type="date"
                      className="w-full px-6 py-4 bg-white border border-gray-200 rounded-xl focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 transition-all outline-none font-bold text-gray-900 shadow-sm hover:border-gray-300"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    />
                  </div>

                  <UnifiedDropdown
                    label={t("Visitor Category", "आगंतुक श्रेणी")}
                    icon={<UserCheck className={`h-3 w-3 ${errors.category ? 'text-red-500' : ''}`} />}
                    value={formData.category}
                    options={finalCategories}
                    onChange={(val) => {
                      setFormData({ ...formData, category: val as any });
                      if (val) setErrors(prev => ({ ...prev, category: false }));
                    }}
                    placeholder={t("Select Category", "श्रेणी चुनें")}
                    required
                    error={errors.category}
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                    <MapPin className="h-3 w-3" />
                    {t('Residential Address', 'आवासीय पता')}
                  </label>
                  <VoiceInput
                    type="text"
                    placeholder={t("Enter complete address", "पूरा पता दर्ज करें")}
                    className="w-full pr-6 py-4 bg-white border border-gray-200 rounded-xl focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 transition-all outline-none font-bold text-gray-900 shadow-sm hover:border-gray-300"
                    value={formData.address}
                    onValueChange={(val) => setFormData({ ...formData, address: val })}
                    icon={<MapPin className="h-4 w-4 text-gray-400" />}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Purpose & Notes */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-amber-500 rounded-full" />
                <h4 className="text-xs font-bold text-amber-600 uppercase tracking-widest">{t('Purpose & Notes', 'उद्देश्य और नोट्स')}</h4>
              </div>

              <div className="space-y-6">
                <UnifiedDropdown
                  label={t("Purpose of Visit", "भेंट का उद्देश्य")}
                  icon={<Search className={`h-3 w-3 ${errors.purpose ? 'text-red-500' : ''}`} />}
                  value={formData.purpose}
                  options={finalPurposes}
                  onChange={(val) => {
                    setFormData({ ...formData, purpose: val as PurposeType });
                    if (val) setErrors(prev => ({ ...prev, purpose: false }));
                  }}
                  placeholder={t("e.g. Meeting, Interview...", "जैसे: मीटिंग, इंटरव्यू...")}
                  required
                  supportVoice
                  error={errors.purpose}
                />

                <AnimatePresence>
                  {(formData.purpose === 'Donation' || formData.purpose === 'Event') && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      className="relative z-40"
                    >
                      <div className="space-y-6">
                        <UnifiedDropdown
                          label={t("Occasion", "अवसर")}
                          icon={<Gift className="h-3 w-3" />}
                          value={formData.occasion}
                          options={formData.purpose === 'Donation' ? finalDonationOccasions : finalEventOccasions}
                          onChange={(val) => setFormData({ ...formData, occasion: val })}
                          placeholder={t("Select Occasion", "अवसर चुनें")}
                          required
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                    <FileText className="h-3 w-3" />
                    {t('Additional Notes', 'अतिरिक्त नोट्स')}
                  </label>
                  <VoiceInput
                    type="text"
                    placeholder={t("Any special requests or information", "कोई विशेष अनुरोध या जानकारी")}
                    className="w-full pr-6 py-4 bg-white border border-gray-200 rounded-xl focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 transition-all outline-none font-bold text-gray-900 shadow-sm hover:border-gray-300"
                    value={formData.notes}
                    onValueChange={(val) => setFormData({ ...formData, notes: val })}
                    icon={<FileText className="h-4 w-4 text-gray-400" />}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Signature */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-purple-500 rounded-full" />
                <h4 className="text-xs font-bold text-purple-600 uppercase tracking-widest">{t('Verification', 'सत्यापन')}</h4>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <PenTool className="h-3 w-3" />
                    {t('Signature', 'हस्ताक्षर')} *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (sigIndex > 0) {
                          const newIndex = sigIndex - 1;
                          setSigIndex(newIndex);
                          sigCanvas.current?.fromData(sigHistory[newIndex]);
                          setFormData(prev => ({ ...prev, signature: sigCanvas.current!.getCanvas().toDataURL('image/png') }));
                        } else if (sigIndex === 0) {
                          setSigIndex(-1);
                          sigCanvas.current?.clear();
                          setFormData(prev => ({ ...prev, signature: '' }));
                        }
                      }}
                      disabled={sigIndex < 0}
                      className="p-2 text-gray-400 hover:text-brand-blue disabled:opacity-30 transition-colors"
                      title="Undo"
                    >
                      <Undo2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (sigIndex < sigHistory.length - 1) {
                          const newIndex = sigIndex + 1;
                          setSigIndex(newIndex);
                          sigCanvas.current?.fromData(sigHistory[newIndex]);
                          setFormData(prev => ({ ...prev, signature: sigCanvas.current!.getCanvas().toDataURL('image/png') }));
                        }
                      }}
                      disabled={sigIndex >= sigHistory.length - 1}
                      className="p-2 text-gray-400 hover:text-brand-blue disabled:opacity-30 transition-colors"
                      title="Redo"
                    >
                      <Redo2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sigCanvas.current?.clear();
                        setSigHistory([]);
                        setSigIndex(-1);
                        setFormData(prev => ({ ...prev, signature: '' }));
                      }}
                      className="p-2 text-red-400 hover:text-red-600 transition-colors"
                      title="Clear"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {initialData && formData.signature && (
                  <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col items-center gap-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('Existing Signature Preview', 'मौजूदा हस्ताक्षर पूर्वावलोकन')}</p>
                    <div className="w-full h-24 bg-gray-50 rounded-xl flex items-center justify-center border border-dashed border-gray-200">
                      <img src={formData.signature} alt="Signature Preview" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                    </div>
                    <p className="text-[9px] text-gray-400 italic">{t('Sign below to update or keep existing', 'अपडेट करने या मौजूदा रखने के लिए नीचे हस्ताक्षर करें')}</p>
                  </div>
                )}
                
                <div className={`w-full bg-gray-50 border ${errors.signature ? 'border-red-500 animate-pulse' : 'border-gray-200'} rounded-2xl overflow-hidden shadow-inner relative group`}>
                  {formData.signature === '' && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <span className={`font-bold text-xl opacity-50 select-none uppercase tracking-widest ${errors.signature ? 'text-red-400' : 'text-gray-300'}`}>{t('Sign Here', 'यहाँ हस्ताक्षर करें')}</span>
                    </div>
                  )}
                  <SignatureCanvas
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{
                      className: 'w-full h-40 cursor-crosshair relative z-10',
                    }}
                      onEnd={() => {
                        if (sigCanvas.current) {
                          const data = sigCanvas.current.toData();
                          const newHistory = sigHistory.slice(0, sigIndex + 1);
                          newHistory.push(data);
                          setSigHistory(newHistory);
                          setSigIndex(newHistory.length - 1);
                          setFormData(prev => ({ ...prev, signature: sigCanvas.current!.getCanvas().toDataURL('image/png') }));
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
        </form>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-5 sm:py-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:flex-1 px-8 py-4 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 uppercase tracking-widest text-xs"
          >
            {t('Cancel', 'रद्द करें')}
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData({
                ...formData,
                name: '',
                phone: '',
                email: '',
                dob: '',
                address: '',
                purpose: '',
                category: '' as any,
                notes: '',
                signature: ''
              });
              setIsAutoFilled(false);
              setReturningVisitor(null);
              sigCanvas.current?.clear();
            }}
            className="w-full sm:flex-1 px-8 py-4 bg-white border border-gray-200 text-gray-400 font-bold rounded-xl hover:text-red-500 hover:border-red-100 transition-all active:scale-95 uppercase tracking-widest text-xs"
          >
            {t('Reset Form', 'फॉर्म रीसेट करें')}
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isAlreadyInside || isSubmitting || isSaving}
            className="w-full sm:flex-[2] px-8 py-4 bg-brand-blue text-white font-black rounded-xl hover:bg-brand-blue/90 transition-all shadow-xl shadow-blue-100 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-[0.2em] text-xs"
          >
            {isSubmitting || isSaving ? (
              <>
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t('Saving...', 'सहेज रहे हैं...')}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                <span>{initialData ? t('Update Record', 'रिकॉर्ड अपडेट करें') : t('Confirm Check-in', 'चेक-इन की पुष्टि करें')}</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
