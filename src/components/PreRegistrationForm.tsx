import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Loader2,
  Building2,
  PenTool,
  Trash2,
  Undo2,
  Redo2,
  MapPin,
  Search,
  UserCheck,
  Gift,
  ChevronDown
} from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { Organization, PurposeType } from '../types';
import SignatureCanvasFromLib from 'react-signature-canvas';
import { encryptData } from '../lib/encryption';

import Swal from 'sweetalert2';

const SignatureCanvas = (SignatureCanvasFromLib as any).default || SignatureCanvasFromLib;

interface PreRegistrationFormProps {
  organizationId: string;
  onComplete?: () => void;
}

export default function PreRegistrationForm({ organizationId, onComplete }: PreRegistrationFormProps) {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    countryCode: '+91',
    email: '',
    purpose: '' as PurposeType | '',
    category: '' as any,
    dob: '',
    address: '',
    occasion: '',
    notes: '',
    visitDate: new Date().toISOString().split('T')[0],
    signature: ''
  });

  useEffect(() => {
    async function fetchOrg() {
      try {
        const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
        if (orgDoc.exists()) {
          setOrg({ id: orgDoc.id, ...orgDoc.data() } as Organization);
        } else {
          setError('Organization not found');
        }
      } catch (err) {
        console.error('Error fetching org:', err);
        setError('Failed to load organization details');
      } finally {
        setLoading(false);
      }
    }
    fetchOrg();
  }, [organizationId]);

  const [sigHistory, setSigHistory] = useState<any[]>([]);
  const [sigIndex, setSigIndex] = useState(-1);
  const sigCanvas = React.useRef<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.purpose || !formData.visitDate || !formData.category) {
      Swal.fire({
        title: 'Missing Details',
        text: 'Please fill in all required fields marked with *',
        icon: 'warning',
        confirmButtonColor: '#4f46e5',
        customClass: {
          popup: 'rounded-[2rem]'
        }
      });
      return;
    }
    
    if (!formData.signature) {
      Swal.fire({
        title: 'Signature Required',
        text: 'Please provide your digital signature to proceed.',
        icon: 'warning',
        confirmButtonColor: '#4f46e5',
        customClass: {
          popup: 'rounded-[2rem]'
        }
      });
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const fullPhone = `${formData.countryCode} ${formData.phone}`.trim();
      const preRegRef = await addDoc(collection(db, 'organizations', organizationId, 'preRegistrations'), {
        ...formData,
        phone: fullPhone,
        organizationId,
        status: 'PENDING',
        submittedAt: new Date().toISOString(),
      });

      // Add Notification for the organization
      console.log('Creating pre-registration notification...');
      await addDoc(collection(db, 'organizations', organizationId, 'notifications'), {
        organizationId,
        title: 'New Pre-Registration',
        message: `${formData.name} has requested a visit for ${formData.visitDate} regarding ${formData.purpose}.`,
        type: 'PRE_REG',
        read: false,
        timestamp: new Date().toISOString(),
        relatedId: preRegRef.id
      }).then(() => console.log('Pre-reg notification created')).catch(err => console.error('Error creating pre-reg notification:', err));

      setSubmitted(true);
      if (onComplete) onComplete();
    } catch (err) {
      console.error('Error submitting pre-registration:', err);
      setError('Failed to submit registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error && !org) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Registration Unavailable</h1>
          <p className="text-slate-600 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          {org?.logoUrl ? (
            <img src={org.logoUrl} alt={org.name} className="h-16 mx-auto mb-4 object-contain" />
          ) : (
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-indigo-600" />
            </div>
          )}
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Visitor Registration</h1>
          <p className="text-slate-600">Please provide your details for pre-approval at {org?.name}</p>
        </div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-3xl shadow-xl text-center"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Submitted!</h2>
              <p className="text-slate-600 mb-6">
                Thank you for registering. Our staff will review your request. 
                You will receive a notification once approved.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="text-indigo-600 font-semibold hover:text-indigo-700"
              >
                Submit another request
              </button>
            </motion.div>
          ) : (
            <motion.form 
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              noValidate
              className="bg-white p-8 rounded-3xl shadow-xl space-y-6"
            >
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

                {/* Name */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Personal Details</h4>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Phone Number *</label>
                      <div className="flex items-stretch border border-slate-200 rounded-2xl overflow-hidden focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all shadow-sm">
                        <select
                          className="pl-4 pr-2 bg-slate-100 border-r border-slate-200 outline-none font-bold text-slate-700 appearance-none cursor-pointer text-sm"
                          value={formData.countryCode}
                          onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                        >
                          <option value="+91">+91</option>
                          <option value="+1">+1</option>
                          <option value="+44">+44</option>
                        </select>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          className="flex-1 px-4 py-4 bg-slate-50 outline-none font-bold text-slate-900"
                          placeholder="9876543210"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Email Address (Optional)</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* DOB */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Date of Birth</label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="date"
                          value={formData.dob}
                          onChange={e => setFormData(prev => ({ ...prev, dob: e.target.value }))}
                          className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Category *</label>
                      <div className="relative">
                        <UserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <select
                          required
                          value={formData.category}
                          onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 appearance-none"
                        >
                          <option value="">Select Category</option>
                          {(org?.preRegSettings?.visitorTypes || org?.visitorCategories || ['Donor', 'Volunteer', 'Partner', 'Vendor', 'Guest', 'Staff', 'Student']).map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Residential Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={formData.address}
                        onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900"
                        placeholder="123, Street Name, City"
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 bg-amber-500 rounded-full" />
                    <h4 className="text-xs font-bold text-amber-600 uppercase tracking-widest">Visit Details</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Visit Date */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Expected Visit Date *</label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="date"
                          required
                          min={new Date().toISOString().split('T')[0]}
                          value={formData.visitDate}
                          onChange={e => setFormData(prev => ({ ...prev, visitDate: e.target.value }))}
                          className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    {/* Purpose */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Purpose of Visit *</label>
                      <div className="relative">
                        <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <select
                          required
                          value={formData.purpose}
                          onChange={e => setFormData(prev => ({ ...prev, purpose: e.target.value as PurposeType }))}
                          className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all appearance-none font-bold text-slate-900"
                        >
                          <option value="">Select Purpose</option>
                          {org?.preRegSettings?.purposes?.map(p => (
                            <option key={p} value={p}>{p}</option>
                          )) || org?.visitPurposes?.map(p => (
                            <option key={p} value={p}>{p}</option>
                          )) || (
                            <>
                              <option value="Meeting">Meeting</option>
                              <option value="Donation">Donation</option>
                              <option value="Volunteering">Volunteering</option>
                              <option value="Inquiry">Inquiry</option>
                              <option value="Other">Other</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {(formData.purpose === 'Donation' || formData.purpose === 'Event') && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                         <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Occasion *</label>
                         <div className="relative">
                            <Gift className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <select
                              required
                              value={formData.occasion}
                              onChange={e => setFormData(prev => ({ ...prev, occasion: e.target.value }))}
                              className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all appearance-none font-bold text-slate-900"
                            >
                               <option value="">Select Occasion</option>
                               {(formData.purpose === 'Donation' ? (org?.donationOccasions || ['Birthday', 'Anniversary', 'Memorial', 'Wedding', 'Other']) : (org?.eventOccasions || ['Workshop', 'Seminar', 'Celebration', 'Other'])).map(o => (
                                 <option key={o} value={o}>{o}</option>
                               ))}
                            </select>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Notes */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Additional Notes</label>
                    <div className="relative">
                      <FileText className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                      <textarea
                        value={formData.notes}
                        onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 min-h-[100px]"
                        placeholder="Any special requests..."
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 bg-purple-500 rounded-full" />
                    <h4 className="text-xs font-bold text-purple-600 uppercase tracking-widest">Verification</h4>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <PenTool className="w-3 h-3" />
                          Signature *
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
                            className="p-1.5 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"
                          >
                            <Undo2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              sigCanvas.current?.clear();
                              setSigHistory([]);
                              setSigIndex(-1);
                              setFormData(prev => ({ ...prev, signature: '' }));
                            }}
                            className="p-1.5 text-rose-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                       </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 border-dashed relative">
                       <SignatureCanvas
                        ref={sigCanvas}
                        penColor="#0f172a"
                        canvasProps={{
                          className: "signature-canvas w-full h-40 cursor-crosshair"
                        }}
                        onEnd={() => {
                          const data = sigCanvas.current.toData();
                          const newHistory = sigHistory.slice(0, sigIndex + 1);
                          newHistory.push(data);
                          setSigHistory(newHistory);
                          setSigIndex(newHistory.length - 1);
                          setFormData(prev => ({ ...prev, signature: sigCanvas.current.getCanvas().toDataURL('image/png') }));
                        }}
                      />
                    </div>
                  </div>
                </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-indigo-200"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Submit Registration
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <footer className="mt-8 text-center text-slate-500 text-sm">
          Protected by Digital Pass Security &bull; {new Date().getFullYear()}
        </footer>
      </motion.div>
    </div>
  );
}
