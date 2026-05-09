import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Gift, MessageCircle, Calendar as CalendarIcon, Heart, Star } from 'lucide-react';
import { Visitor, Donation } from '../types';

interface BirthdayTabProps {
  visitors: Visitor[];
  donations: Donation[];
  loadingStates?: Record<string, boolean>;
  organizationName?: string;
}

export default function BirthdayTab({ visitors, donations, loadingStates = {}, organizationName = 'Visitor Management System' }: BirthdayTabProps) {
  const today = new Date();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  const { todaysBirthdays, upcomingBirthdays, specialOccasions } = useMemo(() => {
    const todayList: any[] = [];
    const upcomingList: any[] = [];
    const specialList: any[] = [];

    // 1. Birthdays from Profiles
    const uniqueVisitorsMap = new Map<string, Visitor>();
    visitors.forEach(v => {
      if (v.dob && v.phone) {
        uniqueVisitorsMap.set(v.phone, v);
      }
    });

    uniqueVisitorsMap.forEach(visitor => {
      if (!visitor.dob) return;
      const dobParts = visitor.dob.split('-');
      if (dobParts.length !== 3) return;

      const birthMonth = parseInt(dobParts[1], 10) - 1;
      const birthDate = parseInt(dobParts[2], 10);

      const item = {
        id: visitor.phone,
        name: visitor.name,
        phone: visitor.phone,
        type: 'Birthday',
        date: visitor.dob,
        icon: <Gift className="h-5 w-5" />
      };

      if (birthMonth === todayMonth && birthDate === todayDate) {
        todayList.push(item);
      } else {
        const currentYear = today.getFullYear();
        let nextDate = new Date(currentYear, birthMonth, birthDate);
        if (nextDate < today) nextDate = new Date(currentYear + 1, birthMonth, birthDate);
        
        const diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 0 && diffDays <= 7) {
          upcomingList.push({ ...item, daysRemaining: diffDays, dateStr: nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
        }
      }
    });

    // 2. Special Occasions from Donations
    donations.forEach(donation => {
      if (donation.occasionDate) {
        const dateParts = donation.occasionDate.split('-');
        if (dateParts.length !== 3) return;

        const eventMonth = parseInt(dateParts[1], 10) - 1;
        const eventDate = parseInt(dateParts[2], 10);

        const item = {
          id: donation.id,
          name: donation.visitorName,
          phone: donation.visitorPhone,
          type: donation.occasion || 'Special Occasion',
          date: donation.occasionDate,
          icon: donation.occasion?.toLowerCase().includes('anniversary') ? <Heart className="h-5 w-5" /> : <Star className="h-5 w-5" />
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
  }, [visitors, donations, todayMonth, todayDate]);

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const generateWhatsAppLink = (item: any) => {
    const msg = item.type === 'Birthday' 
      ? `Happy Birthday ${item.name}! 🎉 Regards, ${organizationName}`
      : `Happy ${item.type} ${item.name}! ✨ Warm wishes from ${organizationName}`;
    const cleanPhone = (item.phone || '').replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
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
                      <a
                        href={generateWhatsAppLink(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white hover:bg-emerald-600 rounded-2xl transition-all text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 active:scale-95"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Send Wish
                      </a>
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
                       <a
                        href={generateWhatsAppLink(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-white border border-slate-200 text-slate-400 hover:text-emerald-500 hover:border-emerald-200 rounded-xl transition-all shadow-sm active:scale-95"
                      >
                        <MessageCircle className="h-5 w-5" />
                      </a>
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
