import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  User, 
  Calendar, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  Eye, 
  UserPlus,
  Phone
} from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, getDocs, doc, addDoc, updateDoc } from 'firebase/firestore';
import { PreRegistration, Organization } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import SignatureModal from './SignatureModal';

interface KioskPreRegLookupProps {
  organizationId: string;
  onBack: () => void;
  onCheckIn: (visitor: any, signature: string) => void;
  lang: 'EN' | 'HI';
}

export default function KioskPreRegLookup({ organizationId, onBack, onCheckIn, lang }: KioskPreRegLookupProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [requests, setRequests] = useState<PreRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<PreRegistration | null>(null);
  const [isSigModalOpen, setIsSigModalOpen] = useState(false);

  useEffect(() => {
    // Only fetch APPROVED requests for kiosk lookup
    const q = query(
      collection(db, 'organizations', organizationId, 'preRegistrations'),
      where('status', '==', 'APPROVED')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PreRegistration));
      setRequests(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [organizationId]);

  const filtered = requests.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.phone.includes(searchTerm)
  );

  const t = {
    title: lang === 'EN' ? 'Find Your Registration' : 'अपना पंजीकरण खोजें',
    subtitle: lang === 'EN' ? 'Search by name or phone number' : 'नाम या फोन नंबर से खोजें',
    placeholder: lang === 'EN' ? 'Type your name or phone...' : 'अपना नाम या फोन टाइप करें...',
    noResults: lang === 'EN' ? 'No approved registrations found' : 'कोई स्वीकृत पंजीकरण नहीं मिला',
    checkIn: lang === 'EN' ? 'Check In Now' : 'अभी चेक-इन करें',
    viewPass: lang === 'EN' ? 'View Pass' : 'पास देखें',
    back: lang === 'EN' ? 'Go Back' : 'वापस जाएं',
    purpose: lang === 'EN' ? 'Purpose' : 'उद्देश्य',
    date: lang === 'EN' ? 'Visit Date' : 'भेंट की तिथि',
  };

  if (selectedReq) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-1 flex flex-col items-center justify-center p-8"
      >
        <div className="bg-white rounded-[3rem] p-12 shadow-2xl max-w-2xl w-full border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
          
          <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-8">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>

          <h2 className="text-4xl font-black text-gray-900 mb-2 italic uppercase">{selectedReq.name}</h2>
          <p className="text-gray-400 font-bold text-sm tracking-widest uppercase mb-8">{selectedReq.phone}</p>

          <div className="grid grid-cols-2 gap-8 w-full mb-8">
            <div className="bg-gray-50 p-4 rounded-2xl">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.purpose}</p>
              <p className="font-bold text-gray-900">{selectedReq.purpose}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.date}</p>
              <p className="font-bold text-gray-900">{selectedReq.visitDate}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 mb-8 shadow-inner">
            <QRCodeSVG 
              value={`${window.location.origin}/?passId=${selectedReq.id}&orgId=${organizationId}`}
              size={180}
              level="H"
            />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4">Digital Entry Pass</p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <button
              onClick={() => setIsSigModalOpen(true)}
              className="py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-lg uppercase italic shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
            >
              <UserPlus className="w-6 h-6" />
              {t.checkIn}
            </button>
            <button
              onClick={() => setSelectedReq(null)}
              className="py-6 bg-gray-100 text-gray-600 rounded-[2rem] font-black text-lg uppercase italic hover:bg-gray-200 transition-all"
            >
              {t.back}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-12 max-w-6xl mx-auto w-full">
      <div className="flex items-center gap-8 mb-12">
        <button 
          onClick={onBack}
          className="w-20 h-20 bg-white rounded-[2rem] shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all active:scale-95 border border-gray-100"
        >
          <ArrowLeft className="w-8 h-8 text-gray-400" />
        </button>
        <div>
          <h2 className="text-5xl font-black text-gray-900 italic uppercase mb-2 leading-none">{t.title}</h2>
          <p className="text-gray-400 font-bold tracking-[0.2em] uppercase">{t.subtitle}</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-12">
        <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-8 h-8 text-gray-300" />
        <input
          type="text"
          autoFocus
          placeholder={t.placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-22 pr-8 py-10 bg-white rounded-[3rem] shadow-xl border border-gray-100 text-3xl font-bold focus:ring-4 focus:ring-brand-blue/20 outline-none transition-all placeholder:text-gray-200"
        />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-12">
        {loading ? (
          <div className="h-full flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-brand-blue animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-20 text-center">
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-8">
              <Search className="w-16 h-16 text-gray-300" />
            </div>
            <h3 className="text-3xl font-black text-gray-300 uppercase italic mb-2">{t.noResults}</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filtered.map((req) => (
                <motion.button
                  key={req.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5 }}
                  onClick={() => setSelectedReq(req)}
                  className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-gray-100 text-left group hover:border-brand-blue transition-all"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl group-hover:bg-brand-blue group-hover:text-white transition-colors uppercase">
                      {req.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-gray-900 group-hover:text-brand-blue transition-colors uppercase italic">{req.name}</h4>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{req.phone}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-300" />
                      <span className="font-bold">{req.visitDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4 text-gray-300" />
                      <span className="font-bold uppercase tracking-wider text-[10px] bg-gray-100 px-2 py-1 rounded-lg">{req.purpose}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-brand-blue font-black text-[10px] uppercase tracking-widest pt-4 border-t border-gray-50">
                    <Eye className="w-4 h-4" />
                    <span>{t.viewPass}</span>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <SignatureModal 
        isOpen={isSigModalOpen}
        onClose={() => setIsSigModalOpen(false)}
        onConfirm={(sig) => {
          onCheckIn(selectedReq, sig);
          setSelectedReq(null);
          setIsSigModalOpen(false);
        }}
        title={lang === 'EN' ? "Visitor Signature" : "आगंतुक हस्ताक्षर"}
      />
    </div>
  );
}
