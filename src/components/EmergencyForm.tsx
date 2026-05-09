import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Phone, Search, AlertTriangle, CheckCircle2, ArrowRight, FileText, Tag, PenTool, ChevronDown, MessageCircle } from 'lucide-react';
import { Visitor, PurposeType, VisitorType } from '../types';
import VoiceInput from './VoiceInput';

interface EmergencyFormProps {
  onClose: () => void;
  onSave: (visitor: any) => void;
  existingVisitors?: Visitor[];
  isSaving?: boolean;
}

const PURPOSES: PurposeType[] = [
  'Meeting', 'Donation', 'Volunteering', 'Inquiry', 'Event', 'Interview', 
  'Student Visit', 'Service Visit', 'Delivery', 'Official Visit', 'Company Visit', 'Other'
];

const TYPES: VisitorType[] = [
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
}

function UnifiedDropdown({ label, icon, value, options, onChange, placeholder, required, supportVoice }: UnifiedDropdownProps) {
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
    <div className="space-y-1.5" ref={dropdownRef}>
      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-4">
        {label} {required && '*'}
      </label>
      <div className="relative group">
        {supportVoice ? (
          <VoiceInput
            required={required}
            type="text"
            placeholder={placeholder}
            className="w-full pr-6 py-4 sm:py-5 bg-white/[0.03] border border-white/5 rounded-xl sm:rounded-2xl focus-within:border-red-500/30 focus-within:bg-white/[0.06] outline-none transition-all font-bold text-white text-lg sm:text-xl placeholder:text-slate-700"
            value={value}
            onValueChange={onChange}
            onFocus={() => setIsOpen(true)}
            icon={icon}
          />
        ) : (
          <div 
            onClick={() => setIsOpen(!isOpen)}
            className="w-full pl-6 pr-6 py-4 sm:py-5 bg-white/[0.03] border border-white/5 rounded-xl sm:rounded-2xl focus-within:border-red-500/30 focus-within:bg-white/[0.06] outline-none transition-all font-bold text-white text-lg sm:text-xl cursor-pointer flex items-center justify-between group-hover:bg-white/[0.05]"
          >
            <div className="flex items-center gap-4">
              <div className="text-slate-500 group-hover:text-red-500 transition-colors">
                {icon}
              </div>
              <span className={value ? 'text-white' : 'text-slate-700'}>
                {value || placeholder}
              </span>
            </div>
            <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        )}

        {supportVoice && (
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-500 group-focus-within:text-red-500 transition-colors">
            {/* Icon is now handled by VoiceInput component */}
          </div>
        )}
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute z-50 w-full mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
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
                        ? 'bg-red-600 text-white' 
                        : 'text-slate-300 hover:bg-white/5 hover:text-red-400'
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

export default function EmergencyForm({ onClose, onSave, isSaving = false }: EmergencyFormProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [formData, setFormData] = useState({
    visitorId: '',
    name: '',
    phone: '',
    purpose: '',
    visitorType: 'Guest',
    notes: '',
    recordedBy: '',
    date: new Date().toISOString().split('T')[0],
    checkInTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    status: 'INSIDE',
    isEmergency: true,
    entryMethod: 'Emergency Mode'
  });

  useEffect(() => {
    const dateStr = formData.date.replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setFormData(prev => ({ ...prev, visitorId: `EP-${dateStr}-${random}` }));
  }, [formData.date]);

  const handleNext = () => {
    if (formData.name && formData.purpose) {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const finalData = {
        ...formData,
        purpose: formData.purpose.trim() || 'Emergency Entry'
      };
      await onSave(finalData);
      setIsSaved(true);
      setTimeout(() => {
        onClose();
      }, 3500);
    } catch (error) {
      console.error("Error saving emergency visitor:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSaved) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-slate-950 z-[15000] flex flex-col items-center justify-center p-6 overflow-hidden"
      >
        {/* Success Background Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                opacity: 0, 
                scale: 0,
                x: Math.random() * 100 - 50 + "%",
                y: Math.random() * 100 - 50 + "%"
              }}
              animate={{ 
                opacity: [0, 1, 0], 
                scale: [0, 1.5, 0],
                y: "-=100"
              }}
              transition={{ 
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
              className="absolute w-1 h-1 bg-emerald-400 rounded-full blur-[1px]"
            />
          ))}
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-10 relative z-10"
        >
          <div className="relative">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 15, stiffness: 100 }}
              className="w-40 h-40 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_60px_-15px_rgba(16,185,129,0.5)] mx-auto relative z-10 border-4 border-white/20"
            >
              <CheckCircle2 className="h-20 w-20 text-white" />
            </motion.div>
            
            <motion.div
              animate={{ 
                scale: [1, 1.4, 1],
                opacity: [0.2, 0, 0.2]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-[-20px] bg-emerald-500/20 rounded-full blur-3xl -z-10"
            />
          </div>

          <div className="space-y-4">
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-6xl font-black text-white tracking-tighter"
            >
              Entry <span className="text-emerald-400">Authorized</span>
            </motion.h2>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-500 text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md mb-2">
                Emergency Mode Active
              </div>
              <p className="text-emerald-500/60 font-black uppercase tracking-[0.5em] text-xs">Entry Recorded Successfully</p>
              <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 3.5, ease: "linear" }}
                  className="h-full w-full bg-emerald-500"
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-950/90 backdrop-blur-3xl z-[15000] overflow-y-auto custom-scrollbar flex flex-col"
    >
      {/* Clean Background Design */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-900/10 blur-[120px] rounded-full" />
      </div>

      {/* Protocol ID Header */}
      <div className="fixed top-10 left-10 flex flex-col items-start gap-1 hidden lg:flex z-50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.4em]">Emergency Entry Active</p>
        </div>
        <p className="text-white/20 font-mono text-[9px] uppercase tracking-[0.2em]">Entry ID: <span className="text-white/50">{formData.visitorId || 'PENDING'}</span></p>
      </div>

      {/* Close Button */}
      <motion.button 
        whileHover={{ scale: 1.1, rotate: 90, backgroundColor: "rgba(239, 68, 68, 0.2)" }}
        whileTap={{ scale: 0.9 }}
        onClick={onClose}
        className="fixed top-10 right-10 p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/60 hover:text-white transition-all backdrop-blur-2xl z-[20001]"
      >
        <X className="h-6 w-6" />
      </motion.button>

      <div className="flex-1 w-full flex flex-col items-center justify-center py-20 px-6 relative z-10">
        <div className="text-center mb-12 shrink-0">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-4 px-5 py-2.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-[0.4em] mb-6 backdrop-blur-md"
          >
            <AlertTriangle className="h-4 w-4" />
            Quick Entry Form
          </motion.div>
          <h2 className="text-5xl sm:text-6xl font-black text-white tracking-tighter mb-4">
            Emergency <span className="text-red-500">Entry Mode</span>
          </h2>
          <p className="text-slate-400 font-bold text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            A simple, reliable fallback for visitor registration.
          </p>
        </div>

        <div className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 sm:p-12 shadow-[0_64px_128px_-24px_rgba(0,0,0,0.9)] relative overflow-hidden">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/[0.05]">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: step === 1 ? "50%" : "100%" }}
              className="h-full bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
            />
          </div>

          <div className="flex justify-between items-end mb-12">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500 font-black text-xs border border-red-500/30">
                  0{step}
                </span>
                <p className="text-white/40 font-mono text-[9px] uppercase tracking-[0.3em]">Status: Ready</p>
              </div>
              <h3 className="text-3xl font-black text-white tracking-tight">
                {step === 1 ? "Visitor Details" : "Final Confirmation"}
              </h3>
            </div>
            <div className="flex gap-2">
              {[1, 2].map((i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? 'bg-red-500 w-12' : 'bg-white/10 w-6'}`} 
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -30, opacity: 0 }}
                className="space-y-8"
              >
                <div className="grid gap-6">
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-6">Visitor Full Name</label>
                    <VoiceInput
                      required
                      autoFocus
                      type="text"
                      placeholder="Enter identity"
                      onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                      className="w-full pr-8 py-5 sm:py-7 bg-white/[0.03] border border-white/10 rounded-[2rem] focus-within:ring-4 focus-within:ring-red-500/20 focus-within:border-red-500/50 focus-within:bg-white/[0.06] outline-none transition-all font-black text-white text-xl sm:text-2xl placeholder:text-slate-700"
                      value={formData.name}
                      onValueChange={(val) => setFormData({ ...formData, name: val })}
                      icon={<User className="h-5 w-5 sm:h-6 sm:w-6 text-slate-500 group-focus-within:text-red-500 transition-colors" />}
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-6">Contact Reference</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-8 flex items-center pointer-events-none text-slate-500 group-focus-within:text-red-500 transition-colors">
                        <Phone className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <input
                        required
                        type="tel"
                        placeholder="Phone number"
                        onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                        className="w-full pl-16 pr-32 py-5 sm:py-7 bg-white/[0.03] border border-white/10 rounded-[2rem] focus:ring-4 focus:ring-red-500/20 focus:border-red-500/50 focus:bg-white/[0.06] outline-none transition-all font-black text-white text-xl sm:text-2xl placeholder:text-slate-700"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                      {formData.phone && (
                        <div className="absolute inset-y-0 right-4 flex items-center gap-2">
                          <a href={formData.phone ? `tel:${formData.phone}` : undefined} className="p-2 sm:p-3 bg-white/5 hover:bg-white/10 text-emerald-400 rounded-2xl transition-all" title="Call">
                            <Phone className="h-5 w-5" />
                          </a>
                          <a href={`https://wa.me/${(formData.phone || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 sm:p-3 bg-white/5 hover:bg-white/10 text-emerald-400 rounded-2xl transition-all" title="WhatsApp">
                            <MessageCircle className="h-5 w-5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <UnifiedDropdown
                    label="Entry Purpose"
                    icon={<Search className="h-5 w-5 sm:h-6 sm:w-6" />}
                    value={formData.purpose}
                    options={PURPOSES}
                    onChange={(val) => setFormData({ ...formData, purpose: val })}
                    placeholder="Select purpose"
                    required
                    supportVoice
                  />
                </div>

                <div className="pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: "rgb(220 38 38)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNext}
                    disabled={!formData.name || !formData.purpose}
                    className="w-full py-6 sm:py-8 bg-red-600 text-white font-black rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(220,38,38,0.3)] transition-all flex items-center justify-center gap-4 text-xl sm:text-2xl disabled:opacity-20 disabled:grayscale"
                  >
                    Proceed to Authorization
                    <ArrowRight className="h-7 w-7" />
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -30, opacity: 0 }}
                className="space-y-8"
              >
                <div className="grid gap-6">
                  <UnifiedDropdown
                    label="Visitor Classification"
                    icon={<Tag className="h-5 w-5 sm:h-6 sm:w-6" />}
                    value={formData.visitorType}
                    options={TYPES}
                    onChange={(val) => setFormData({ ...formData, visitorType: val })}
                    placeholder="Select category"
                    required
                  />

                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-6">Protocol Notes</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-8 pt-6 flex items-start pointer-events-none text-slate-500 group-focus-within:text-red-500 transition-colors">
                        <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <textarea
                        placeholder="Additional context"
                        rows={2}
                        className="w-full pl-16 pr-8 py-6 sm:py-8 bg-white/[0.03] border border-white/10 rounded-[2rem] focus:ring-4 focus:ring-red-500/20 focus:border-red-500/50 focus:bg-white/[0.06] outline-none transition-all font-black text-white text-xl sm:text-2xl placeholder:text-slate-700 resize-none"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-6">Staff Reference</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-8 flex items-center pointer-events-none text-slate-500 group-focus-within:text-red-500 transition-colors">
                        <PenTool className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <input
                        required
                        type="text"
                        placeholder="Staff member name"
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        className="w-full pl-16 pr-8 py-5 sm:py-7 bg-white/[0.03] border border-white/10 rounded-[2rem] focus:ring-4 focus:ring-red-500/20 focus:border-red-500/50 focus:bg-white/[0.06] outline-none transition-all font-black text-white text-xl sm:text-2xl placeholder:text-slate-700"
                        value={formData.recordedBy}
                        onChange={(e) => setFormData({ ...formData, recordedBy: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <motion.button
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStep(1)}
                    className="py-6 sm:py-8 bg-white/5 text-white font-black rounded-[2rem] border border-white/5 transition-all text-lg uppercase tracking-widest"
                  >
                    Back
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: "rgb(220 38 38)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={isSubmitting || isSaving || !formData.recordedBy}
                    className="py-6 sm:py-8 bg-red-600 text-white font-black rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(220,38,38,0.3)] transition-all flex items-center justify-center gap-4 text-lg sm:text-xl disabled:opacity-20"
                  >
                    {isSubmitting || isSaving ? (
                      <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-7 w-7" />
                        Authorize Entry
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
