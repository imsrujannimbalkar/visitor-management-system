import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Phone, Search, AlertTriangle, CheckCircle2, ArrowRight, FileText, Tag, PenTool, ChevronDown, MessageCircle, Plus, Settings } from 'lucide-react';
import { Visitor, PurposeType, VisitorType } from '../types';
import VoiceInput from './VoiceInput';
import Swal from 'sweetalert2';

interface EmergencyFormProps {
  onClose: () => void;
  onSave: (visitor: any) => void;
  existingVisitors?: Visitor[];
  isSaving?: boolean;
  customPurposes?: string[];
  customTypes?: string[];
  organizationId?: string;
  onUpdateOrganization?: (data: any) => Promise<void>;
}

const DEFAULT_PURPOSES: PurposeType[] = [
  'Meeting', 'Donation', 'Volunteering', 'Inquiry', 'Event', 'Interview', 
  'Student Visit', 'Service Visit', 'Delivery', 'Official Visit', 'Company Visit', 'Other'
];

const DEFAULT_TYPES: VisitorType[] = [
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
  onAddOption?: (newOpt: string) => void;
  onRemoveOption?: (opt: string) => void;
}

function UnifiedDropdown({ label, icon, value, options, onChange, placeholder, required, supportVoice, onAddOption, onRemoveOption }: UnifiedDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute z-50 w-full mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto custom-scrollbar"
            >
              <div className="p-3 border-b border-white/5 sticky top-0 bg-slate-900/90 backdrop-blur-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search options..."
                    className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white outline-none focus:border-red-500/30 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              <div className="p-2">
                <div className="flex gap-2 mb-2 p-1 bg-white/5 rounded-xl border border-white/10">
                  {onAddOption && (
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const { value: newOpt } = await Swal.fire({
                          title: `New ${label}`,
                          input: 'text',
                          inputPlaceholder: `Enter new ${label.toLowerCase()}...`,
                          showCancelButton: true,
                          confirmButtonColor: '#dc2626',
                          inputValidator: (value) => !value && 'Entry cannot be empty'
                        });
                        if (newOpt) {
                          onAddOption(newOpt);
                          onChange(newOpt);
                          setIsOpen(false);
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-red-400 uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm"
                    >
                      <Plus className="h-3 w-3" />
                      Add New
                    </button>
                  )}
                  {onRemoveOption && (
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const { value: selectedOpt } = await Swal.fire({
                          title: `Delete ${label}`,
                          input: 'select',
                          inputOptions: Object.fromEntries(options.map(o => [o, o])),
                          inputPlaceholder: 'Select option to remove',
                          showCancelButton: true,
                          confirmButtonColor: '#475569',
                          cancelButtonColor: '#dc2626',
                          confirmButtonText: 'Delete selected',
                          inputValidator: (value) => !value && 'Please select an option'
                        });
                        if (selectedOpt) {
                          onRemoveOption(selectedOpt);
                          if (value === selectedOpt) onChange('');
                        }
                      }}
                      className="p-3 bg-white/5 border border-white/10 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-all"
                      title="Manage List"
                    >
                      <Settings className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        onChange(opt);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between group/opt ${
                        value === opt 
                          ? 'bg-red-600 text-white' 
                          : 'text-slate-300 hover:bg-white/5 hover:text-red-400'
                      }`}
                    >
                      {opt}
                      {value === opt && <CheckCircle2 className="h-4 w-4" />}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">No matching options</p>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(searchTerm);
                        setIsOpen(false);
                      }}
                      className="mt-4 px-4 py-2 bg-red-600/10 text-red-500 border border-red-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all w-full"
                    >
                      Use "{searchTerm}" anyway
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function EmergencyForm({ 
  onClose, 
  onSave, 
  isSaving = false,
  customPurposes,
  customTypes,
  organizationId,
  onUpdateOrganization
}: EmergencyFormProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [formData, setFormData] = useState({
    visitorId: '',
    name: '',
    phone: '',
    purpose: '',
    visitorType: '',
    notes: '',
    recordedBy: '',
    date: new Date().toISOString().split('T')[0],
    checkInTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    status: 'INSIDE',
    isEmergency: true,
    entryMethod: 'Emergency Mode'
  });

  const purposes = customPurposes && customPurposes.length > 0 ? customPurposes : DEFAULT_PURPOSES;
  const types = customTypes && customTypes.length > 0 ? customTypes : DEFAULT_TYPES;

  const handleAddPurpose = async (newP: string) => {
    if (!onUpdateOrganization || !organizationId) return;
    const current = customPurposes || [...DEFAULT_PURPOSES];
    if (current.includes(newP)) return;
    await onUpdateOrganization({ visitPurposes: [...current, newP] });
  };

  const handleRemovePurpose = async (p: string) => {
    if (!onUpdateOrganization || !organizationId) return;
    const current = customPurposes || [...DEFAULT_PURPOSES];
    await onUpdateOrganization({ visitPurposes: current.filter(x => x !== p) });
  };

  const handleAddType = async (newT: string) => {
    if (!onUpdateOrganization || !organizationId) return;
    const current = customTypes || [...DEFAULT_TYPES];
    if (current.includes(newT)) return;
    await onUpdateOrganization({ visitorCategories: [...current, newT] });
  };

  const handleRemoveType = async (t: string) => {
    if (!onUpdateOrganization || !organizationId) return;
    const current = customTypes || [...DEFAULT_TYPES];
    await onUpdateOrganization({ visitorCategories: current.filter(x => x !== t) });
  };

  useEffect(() => {
    const dateStr = formData.date.replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setFormData(prev => ({ ...prev, visitorId: `EP-${dateStr}-${random}` }));
  }, [formData.date]);

  const handleNext = () => {
    if (!formData.name) {
      Swal.fire({
        title: 'Missing Details',
        text: 'Visitor name is mandatory for emergency protocol.',
        icon: 'warning',
        confirmButtonColor: '#dc2626'
      });
      return;
    }
    if (!formData.purpose) {
      Swal.fire({
        title: 'Missing Details',
        text: 'Mission purpose must be assigned.',
        icon: 'warning',
        confirmButtonColor: '#dc2626'
      });
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!formData.visitorType) {
      Swal.fire({
        title: 'Classification Required',
        text: 'Please select an identity class for the visitor.',
        icon: 'warning',
        confirmButtonColor: '#dc2626'
      });
      return;
    }
    if (!formData.recordedBy) {
      Swal.fire({
        title: 'Authorization Required',
        text: 'Staff name/ID is required to authorize this override.',
        icon: 'warning',
        confirmButtonColor: '#dc2626'
      });
      return;
    }
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
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600/20 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-900/20 blur-[150px] rounded-full" />
        
        {/* Security Grid Effect */}
        <div className="absolute inset-0 opacity-[0.03]" 
          style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '40px 40px' }} 
        />
        
        {/* Subtle Scanlines */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-50 bg-[length:100%_2px,3px_100%]" />
      </div>

      {/* Protocol ID Header */}
      <div className="fixed top-10 left-10 flex flex-col items-start gap-1 hidden lg:flex z-50">
        <motion.div 
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex items-center gap-3 mb-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <p className="text-red-500 font-black text-[9px] uppercase tracking-[0.4em]">Protocol Active</p>
        </motion.div>
        <p className="text-white/20 font-mono text-[9px] uppercase tracking-[0.2em] ml-1">Sequence: <span className="text-white/50">{formData.visitorId || 'INITIALIZING...'}</span></p>
      </div>

      {/* Close Button */}
      <motion.button 
        whileHover={{ scale: 1.1, rotate: 90, backgroundColor: "rgba(239, 68, 68, 0.3)" }}
        whileTap={{ scale: 0.9 }}
        onClick={onClose}
        className="fixed top-10 right-10 p-5 bg-white/5 hover:bg-red-500/20 border border-white/10 rounded-2xl text-white/60 hover:text-white transition-all backdrop-blur-2xl z-[20001] shadow-2xl"
      >
        <X className="h-6 w-6" />
      </motion.button>

      <div className="flex-1 w-full flex flex-col items-center justify-center py-20 px-6 relative z-10">
        <div className="text-center mb-12 shrink-0">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-4 px-6 py-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 shadow-[0_0_50px_rgba(239,68,68,0.1)] mb-8 backdrop-blur-md"
          >
            <AlertTriangle className="h-4 w-4 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em]">System Override: Emergency Mode</span>
          </motion.div>
          
          <h2 className="text-5xl sm:text-6xl font-black text-white tracking-tighter mb-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">EMERGENCY</span> 
            <span className="px-5 py-1.5 bg-red-600 rounded-2xl shadow-[0_0_60px_rgba(220,38,38,0.6)] rotate-[-2deg] border-4 border-white/20 animate-pulse">PROTOCOL</span>
          </h2>
          <p className="text-red-500/60 font-black text-[10px] max-w-md mx-auto leading-relaxed uppercase tracking-[0.4em] opacity-80">
            Intelligent Monitor Bypass Protocol v2.4
          </p>
        </div>

        <div className="w-full max-w-xl bg-slate-900/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 sm:p-10 shadow-[0_80px_160px_-30px_rgba(0,0,0,0.9),0_0_80px_rgba(239,68,68,0.05)] relative overflow-hidden group">
          {/* Subtle Glow Ring */}
          <div className="absolute inset-0 rounded-[2.5rem] border border-red-500/10 group-hover:border-red-500/20 transition-colors pointer-events-none" />
          
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-white/[0.03]">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: step === 1 ? "50%" : "100%" }}
              className="h-full bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_30px_rgba(239,68,68,0.8)]"
            />
          </div>

          <div className="flex justify-between items-end mb-12 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="w-10 h-10 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500 font-black text-sm border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                  0{step}
                </span>
                <div className="space-y-1">
                  <p className="text-white/40 font-mono text-[10px] uppercase tracking-[0.4em]">Internal System Ready</p>
                  <h3 className="text-3xl font-black text-white tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                    {step === 1 ? "Visitor Identity" : "Auth Protocol"}
                  </h3>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mb-2">
              {[1, 2].map((i) => (
                <div 
                  key={i} 
                  className={`h-2 rounded-full transition-all duration-700 ${step === i ? 'bg-red-500 w-16 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-white/5 w-8'}`} 
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ x: 50, opacity: 0, filter: "blur(10px)" }}
                animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ x: -50, opacity: 0, filter: "blur(10px)" }}
                className="space-y-10"
              >
                <div className="grid gap-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] ml-8 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-red-500" />
                      Legal Identity
                    </label>
                    <VoiceInput
                      required
                      autoFocus
                      type="text"
                      placeholder="Input Full Name..."
                      onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                      className="w-full pr-8 py-5 sm:py-6 bg-white/[0.02] border border-white/5 rounded-3xl focus-within:ring-8 focus-within:ring-red-500/10 focus-within:border-red-500/40 focus-within:bg-white/[0.05] outline-none transition-all font-black text-white text-xl sm:text-2xl placeholder:text-slate-800 tracking-tight"
                      value={formData.name}
                      onValueChange={(val) => setFormData({ ...formData, name: val })}
                      icon={<User className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600 group-focus-within:text-red-500 transition-colors" />}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] ml-8 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-red-500" />
                      Contact Comms (Skip if unknown)
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-10 flex items-center pointer-events-none text-slate-600 group-focus-within:text-red-500 transition-colors">
                        <Phone className="h-6 w-6 sm:h-7 sm:w-7" />
                      </div>
                      <input
                        type="tel"
                        placeholder="Tele-com Number"
                        onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                        className="w-full pl-16 pr-36 py-5 sm:py-6 bg-white/[0.02] border border-white/5 rounded-3xl focus:ring-8 focus:ring-red-500/10 focus:border-red-500/40 focus:bg-white/[0.05] outline-none transition-all font-black text-white text-xl sm:text-2xl placeholder:text-slate-800 tracking-tight"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                      {formData.phone && (
                        <div className="absolute inset-y-0 right-6 flex items-center gap-3">
                          <a href={formData.phone ? `tel:${formData.phone}` : undefined} className="p-3 sm:p-4 bg-white/5 hover:bg-emerald-500/20 text-emerald-500 rounded-2xl transition-all border border-emerald-500/10" title="Voice Channel">
                            <Phone className="h-5 w-5" />
                          </a>
                          <a href={`https://wa.me/${(formData.phone || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-3 sm:p-4 bg-white/5 hover:bg-emerald-500/20 text-emerald-500 rounded-2xl transition-all border border-emerald-500/10" title="Data Channel">
                            <MessageCircle className="h-5 w-5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <UnifiedDropdown
                    label="Authorized Mission"
                    icon={<Search className="h-6 w-6" />}
                    value={formData.purpose}
                    options={purposes}
                    onChange={(val) => setFormData({ ...formData, purpose: val })}
                    placeholder="Select Mission Purpose"
                    required
                    supportVoice
                    onAddOption={handleAddPurpose}
                    onRemoveOption={handleRemovePurpose}
                  />
                </div>

                <div className="pt-6">
                  <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: "rgb(220 38 38)", boxShadow: "0 0 40px rgba(220,38,38,0.4)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNext}
                    disabled={!formData.name || !formData.purpose}
                    className="w-full py-6 sm:py-7 bg-red-600 text-white font-black rounded-3xl shadow-[0_20px_50px_-10px_rgba(220,38,38,0.4)] transition-all flex items-center justify-center gap-6 text-xl sm:text-2xl disabled:opacity-10 disabled:grayscale uppercase tracking-widest"
                  >
                    Next Logic Gate
                    <ArrowRight className="h-6 w-6" />
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ x: 50, opacity: 0, filter: "blur(10px)" }}
                animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ x: -50, opacity: 0, filter: "blur(10px)" }}
                className="space-y-10"
              >
                <div className="grid gap-8">
                  <UnifiedDropdown
                    label="Identity Class"
                    icon={<Tag className="h-6 w-6" />}
                    value={formData.visitorType}
                    options={types}
                    onChange={(val) => setFormData({ ...formData, visitorType: val })}
                    placeholder="Classify Identity"
                    required
                    onAddOption={handleAddType}
                    onRemoveOption={handleRemoveType}
                  />

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] ml-8 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-red-500" />
                      Incident Context
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-10 pt-7 flex items-start pointer-events-none text-slate-600 group-focus-within:text-red-500 transition-colors">
                        <FileText className="h-6 w-6 sm:h-7 sm:w-7" />
                      </div>
                      <textarea
                        placeholder="System additional telemetry data..."
                        rows={2}
                        className="w-full pl-16 pr-8 py-5 sm:py-6 bg-white/[0.02] border border-white/5 rounded-3xl focus:ring-8 focus:ring-red-500/10 focus:border-red-500/40 focus:bg-white/[0.05] outline-none transition-all font-black text-white text-lg sm:text-xl placeholder:text-slate-800 resize-none tracking-tight"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] ml-8 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-red-500" />
                      Command Center Authorization
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-10 flex items-center pointer-events-none text-slate-600 group-focus-within:text-red-500 transition-colors">
                        <PenTool className="h-6 w-6 sm:h-7 sm:w-7" />
                      </div>
                      <input
                        required
                        type="text"
                        placeholder="Authorized Staff ID/Name"
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        className="w-full pl-16 pr-8 py-5 sm:py-6 bg-white/[0.02] border border-white/5 rounded-3xl focus:ring-8 focus:ring-red-500/10 focus:border-red-500/40 focus:bg-white/[0.05] outline-none transition-all font-black text-white text-xl placeholder:text-slate-800 tracking-tight uppercase"
                        value={formData.recordedBy}
                        onChange={(e) => setFormData({ ...formData, recordedBy: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
                  <motion.button
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.08)", scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStep(1)}
                    className="py-6 sm:py-7 bg-white/5 text-white font-black rounded-3xl border border-white/10 transition-all text-lg uppercase tracking-[0.3em] backdrop-blur-md"
                  >
                    Return
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: "rgb(220 38 38)", boxShadow: "0 0 50px rgba(220,38,38,0.5)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={isSubmitting || isSaving || !formData.recordedBy}
                    className="py-6 sm:py-7 bg-red-600 text-white font-black rounded-3xl shadow-[0_20px_50px_-10px_rgba(220,38,38,0.4)] transition-all flex items-center justify-center gap-4 text-lg sm:text-xl disabled:opacity-20 uppercase tracking-widest"
                  >
                    {isSubmitting || isSaving ? (
                      <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-6 w-6" />
                        Finalize
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
