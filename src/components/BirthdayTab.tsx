import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Gift, MessageCircle, Calendar as CalendarIcon, Heart, Star, CheckCircle2, RotateCcw } from 'lucide-react';
import { Visitor, Donation, PreRegistration } from '../types';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useToast } from './Toast';

function parseDOB(dobString: string) {
  if (!dobString) return null;
  const parts = dobString.split(/[-/]/);
  if (parts.length !== 3) return null;
  
  let year = 0;
  let month = 0; // 0-indexed
  let day = 0;
  
  const p0 = parseInt(parts[0].trim(), 10);
  const p1 = parseInt(parts[1].trim(), 10);
  const p2 = parseInt(parts[2].trim(), 10);
  
  if (parts[0].trim().length === 4) {
    year = p0;
    month = p1 - 1;
    day = p2;
  } else if (parts[2].trim().length === 4) {
    year = p2;
    month = p1 - 1;
    day = p0;
  } else {
    // Fallback: assume YYYY-MM-DD
    year = p0;
    month = p1 - 1;
    day = p2;
  }
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return { year, month, day };
}

interface BirthdayTabProps {
  organizationId: string;
  visitors: Visitor[];
  donations: Donation[];
  loadingStates?: Record<string, boolean>;
  organizationName?: string;
}

export default function BirthdayTab({ organizationId, visitors, donations, loadingStates = {}, organizationName = 'VMS Flow' }: BirthdayTabProps) {
  const { showToast } = useToast();
  const today = new Date();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  const [preRegistrations, setPreRegistrations] = useState<PreRegistration[]>([]);

  useEffect(() => {
    if (!organizationId) {
      setPreRegistrations([]);
      return;
    }
    const preRegRef = collection(db, 'organizations', organizationId, 'preRegistrations');
    const qPreReg = query(preRegRef, where('deleted', '==', false));
    const unsubscribe = onSnapshot(qPreReg, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PreRegistration));
      setPreRegistrations(list);
    }, (err) => {
    });
    return () => unsubscribe();
  }, [organizationId]);

  const { todaysBirthdays, upcomingBirthdays, specialOccasions } = useMemo(() => {
    const todayList: any[] = [];
    const upcomingList: any[] = [];
    const specialList: any[] = [];

    // Map to keep track of processed phone numbers to avoid double listings on the same day if they did both pre-reg and normal check-in
    const processedPhonesToday = new Set<string>();
    const processedPhonesUpcoming = new Set<string>();

    // 1. Birthdays from Profiles
    const uniqueVisitorsMap = new Map<string, Visitor>();
    visitors.forEach(v => {
      if (v.dob && v.phone) {
        uniqueVisitorsMap.set(v.phone, v);
      }
    });

    uniqueVisitorsMap.forEach(visitor => {
      if (!visitor.dob) return;
      const parsed = parseDOB(visitor.dob);
      if (!parsed) return;

      const birthMonth = parsed.month;
      const birthDate = parsed.day;

      const item = {
        id: visitor.phone,
        name: visitor.name,
        phone: visitor.phone,
        type: 'Birthday',
        date: visitor.dob,
        icon: <Gift className="h-5 w-5" />,
        whatsappStatus: visitor.whatsappStatus,
        isDonation: false,
        isPreReg: false,
        docId: visitor.phone
      };

      if (birthMonth === todayMonth && birthDate === todayDate) {
        todayList.push(item);
        processedPhonesToday.add(visitor.phone);
      } else {
        const currentYear = today.getFullYear();
        let nextDate = new Date(currentYear, birthMonth, birthDate);
        if (nextDate < today) nextDate = new Date(currentYear + 1, birthMonth, birthDate);
        
        const diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 0 && diffDays <= 7) {
          upcomingList.push({ ...item, daysRemaining: diffDays, dateStr: nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
          processedPhonesUpcoming.add(visitor.phone);
        }
      }
    });

    // 2. Birthdays from Pre-registrations
    preRegistrations.forEach(preReg => {
      if (!preReg.dob || !preReg.phone) return;
      const parsed = parseDOB(preReg.dob);
      if (!parsed) return;

      const birthMonth = parsed.month;
      const birthDate = parsed.day;

      const item = {
        id: preReg.id,
        name: preReg.name,
        phone: preReg.phone,
        type: 'Pre-Registered Birthday',
        date: preReg.dob,
        icon: <Gift className="h-5 w-5 text-indigo-400" />,
        whatsappStatus: preReg.whatsappStatus,
        isDonation: false,
        isPreReg: true,
        docId: preReg.id
      };

      if (birthMonth === todayMonth && birthDate === todayDate) {
        // Only list if we haven't already listed this phone number today
        if (!processedPhonesToday.has(preReg.phone)) {
          todayList.push(item);
          processedPhonesToday.add(preReg.phone);
        }
      } else {
        const currentYear = today.getFullYear();
        let nextDate = new Date(currentYear, birthMonth, birthDate);
        if (nextDate < today) nextDate = new Date(currentYear + 1, birthMonth, birthDate);
        
        const diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 0 && diffDays <= 7) {
          if (!processedPhonesUpcoming.has(preReg.phone)) {
            upcomingList.push({ ...item, daysRemaining: diffDays, dateStr: nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
            processedPhonesUpcoming.add(preReg.phone);
          }
        }
      }
    });

    // 3. Special Occasions from Donations
    donations.forEach(donation => {
      if (donation.occasionDate) {
        const parsed = parseDOB(donation.occasionDate);
        if (!parsed) return;

        const eventMonth = parsed.month;
        const eventDate = parsed.day;

        const item = {
          id: donation.id,
          name: donation.visitorName,
          phone: donation.visitorPhone,
          type: donation.occasion || 'Special Occasion',
          date: donation.occasionDate,
          icon: donation.occasion?.toLowerCase().includes('anniversary') ? <Heart className="h-5 w-5" /> : <Star className="h-5 w-5" />,
          whatsappStatus: donation.whatsappStatus,
          isDonation: true,
          isPreReg: false,
          docId: donation.id
        };

        if (eventMonth === todayMonth && eventDate === todayDate) {
          // Check if already in todayList for same person and type
          if (!todayList.find(i => i.phone === item.phone && i.type === item.type)) {
            todayList.push(item);
          }
        } else {
          const currentYear = today.getFullYear();
          let nextDate = new Date(currentYear, eventMonth, eventDate);
          if (nextDate < today) nextDate = new Date(currentYear + 1, eventMonth, eventDate);
          
          const diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays > 0 && diffDays <= 7) {
            if (!upcomingList.find(i => i.phone === item.phone && i.type === item.type)) {
              upcomingList.push({ ...item, daysRemaining: diffDays, dateStr: nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
            }
          }
        }
      }
    });

    return { 
      todaysBirthdays: todayList, 
      upcomingBirthdays: upcomingList.sort((a, b) => a.daysRemaining - b.daysRemaining),
      specialOccasions: specialList
    };
  }, [visitors, preRegistrations, donations, todayMonth, todayDate]);

  const calculateAge = (dob: string) => {
    const parsed = parseDOB(dob);
    if (!parsed) return 0;
    let age = today.getFullYear() - parsed.year;
    const m = today.getMonth() - parsed.month;
    if (m < 0 || (m === 0 && today.getDate() < parsed.day)) age--;
    return age;
  };

  const [sendingId, setSendingId] = useState<string | null>(null);

  const handleSendWish = async (item: any) => {
    if (!organizationId) return;
    setSendingId(item.id);
    
    try {
      const isBday = item.type === 'Birthday' || item.type === 'Pre-Registered Birthday';
      const msg = isBday 
        ? `Happy Birthday ${item.name}! 🎉 Regards, ${organizationName}`
        : `Happy ${item.type} ${item.name}! ✨ Warm wishes from ${organizationName}`;
      
      const cleanPhone = (item.phone || '').replace(/\D/g, '');
      let formattedPhone = cleanPhone;
      if (formattedPhone.length === 10) formattedPhone = '91' + formattedPhone;
      
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;

      // Open immediately to avoid popup blocker
      window.open(whatsappUrl, '_blank');
      showToast(`WhatsApp link opened for ${item.name}`, 'info');

      // Update Firestore in background
      let collectionName = item.isDonation ? 'donations' : 'profiles';
      if (item.isPreReg) {
        collectionName = 'preRegistrations';
      }
      const docRef = doc(db, 'organizations', organizationId, collectionName, item.docId);
      
      await updateDoc(docRef, {
        whatsappStatus: 'SENT',
        whatsappSentAt: new Date().toISOString()
      });
    } catch (error) {
      showToast('Failed to update status', 'error');
    } finally {
      setSendingId(null);
    }
  };

  return (
    <motion.div
      key="birthdays"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-5xl mx-auto space-y-8"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="h-12 w-12 bg-rose-100 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-100">
          <Gift className="h-6 w-6 text-rose-600" />
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Special Occasions</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Strategic relationship management through milestones and life events.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Occasions */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-8 border-b border-gray-50 bg-gradient-to-r from-rose-50/50 to-white">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-3 uppercase tracking-widest text-[10px]">
              <div className="p-2 bg-rose-500 rounded-lg">
                <Gift className="h-4 w-4 text-white" />
              </div>
              Milestones Today
            </h3>
          </div>
          <div className="p-8 flex-1">
            {todaysBirthdays.length > 0 ? (
              <div className="space-y-4">
                {todaysBirthdays.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-rose-200 transition-all group">
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                        {item.icon}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-lg tracking-tight">{item.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[9px] font-black uppercase tracking-widest rounded-md">
                            {item.type}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">{item.phone}</span>
                          {item.type === 'Birthday' && (
                            <span className="text-[10px] font-bold text-slate-400">• {calculateAge(item.date)} years old</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.whatsappStatus === 'SENT' ? (
                        <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                           <CheckCircle2 className="h-4 w-4" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-[#059669]">Redirected</span>
                           <button 
                             onClick={() => handleSendWish(item)}
                             className="ml-1 text-emerald-400 hover:text-emerald-600 transition-colors"
                           >
                             <RotateCcw className="h-3 w-3" />
                           </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSendWish(item)}
                          disabled={sendingId === item.id}
                          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white hover:bg-emerald-600 rounded-2xl transition-all text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 active:scale-95 disabled:opacity-50"
                        >
                          <MessageCircle className="h-4 w-4" />
                          {sendingId === item.id ? 'Sending...' : 'Send Wish'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <Gift className="h-10 w-10 text-slate-200" />
                </div>
                <p className="text-lg font-black text-slate-400 uppercase tracking-widest text-[10px]">No Milestones Today</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Occasions */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-8 border-b border-gray-50 bg-gradient-to-r from-blue-50/50 to-white">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-3 uppercase tracking-widest text-[10px]">
              <div className="p-2 bg-brand-blue rounded-lg">
                <CalendarIcon className="h-4 w-4 text-white" />
              </div>
              Upcoming Opportunities (7 Days)
            </h3>
          </div>
          <div className="p-8 flex-1">
            {upcomingBirthdays.length > 0 ? (
              <div className="space-y-4">
                {upcomingBirthdays.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-blue-200 transition-all group">
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center text-brand-blue shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                        {item.icon}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-lg tracking-tight">{item.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="px-2 py-0.5 bg-blue-100 text-brand-blue text-[9px] font-black uppercase tracking-widest rounded-md">
                            {item.type}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">{item.dateStr}</span>
                          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">in {item.daysRemaining} day{item.daysRemaining !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                       {item.whatsappStatus === 'SENT' ? (
                         <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                           <CheckCircle2 className="h-4 w-4" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-[#059669]">Redirected</span>
                           <button 
                             onClick={() => handleSendWish(item)}
                             className="ml-1 text-emerald-400 hover:text-emerald-600 transition-colors"
                           >
                             <RotateCcw className="h-3 w-3" />
                           </button>
                         </div>
                       ) : (
                         <button
                          onClick={() => handleSendWish(item)}
                          className="flex items-center gap-2 p-3 bg-white border border-slate-200 text-slate-400 hover:text-emerald-500 hover:border-emerald-200 rounded-xl transition-all shadow-sm active:scale-95"
                        >
                          <MessageCircle className="h-5 w-5" />
                        </button>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <CalendarIcon className="h-10 w-10 text-slate-200" />
                </div>
                <p className="text-lg font-black text-slate-400 uppercase tracking-widest text-[10px]">No Upcoming Opportunities</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
