/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import GoogleIntegration from './components/GoogleIntegration';
import {
  User as UserIcon,
  Users,
  Heart,
  UserCheck,
  UserPlus,
  Calendar,
  LogOut,
  ClipboardList,
  Search,
  X,
  Star,
  Bell,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  CheckCircle,
  Database,
  TrendingUp,
  Clock,
  AlertCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  History,
  BarChart3,
  PieChart,
  Eye,
  EyeOff,
  Lock,
  Building2,
  Gift,
  Languages,
  ChevronLeft,
  Loader2,
  Shield,
  Mail,
  Monitor,
  Layout,
  LayoutDashboard,
  Settings2,
  Power,
  Save,
  Plus,
  Trash2,
  Share2,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Settings,
  Zap,
  Users2,
  ChevronRight,
  MoreHorizontal,
  HelpCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  Activity,
  ArrowRight,
  Phone,
  PhoneCall,
  MessageCircle,
  Camera
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart as RePieChart,
  Pie
} from 'recharts';
import VisitorForm, { PURPOSES, TYPES, DEFAULT_DONATION_OCCASIONS, DEFAULT_EVENT_OCCASIONS, DEFAULT_DONATION_TYPES, DEFAULT_PAYMENT_MODES } from './components/VisitorForm';
import EmergencyForm from './components/EmergencyForm';
import VisitorTable from './components/VisitorTable';
import BirthdayTab from './components/BirthdayTab';
import ReviewsTab from './components/ReviewsTab';
import ReviewModal from './components/ReviewModal';
import ActivityLogsTab from './components/ActivityLogsTab';
import DonationsTab from './components/DonationsTab';
import AppFeedbackModal from './components/AppFeedbackModal';
import BugReportModal from './components/BugReportModal';
import VisitorPass from './components/VisitorPass';
import PrintablePassModal from './components/PrintablePassModal';
import PrintableBatchPassModal from './components/PrintableBatchPassModal';
import LegalCenter from './components/LegalPages';
import ClockComponent from './components/Clock';
import ProfileTab from './components/ProfileTab';
import Auth from './components/Auth';
import OrgSetup from './components/OrgSetup';
import WorkspaceSelector from './components/WorkspaceSelector';
import { Briefcase } from 'lucide-react';
import NotificationsCenter from './components/NotificationsCenter';
import PreRegistrationForm from './components/PreRegistrationForm';
import PreRegistrationTab from './components/PreRegistrationTab';
import KioskPreRegLookup from './components/KioskPreRegLookup';
import { QRCheckOutScanner } from './components/QRCheckOutScanner';
import InquiryTracker from './components/InquiryTracker';
import LegalAcceptanceModal from './components/LegalAcceptanceModal';
import { geminiService } from './services/geminiService';
import { Visitor, User, VisitorStatus, UserRole, Organization, Notification, Profile, Visit, Donation, DonationAuditEntry, PreRegistration, Inquiry } from './types';
import { useToast } from './components/Toast';
import { savePendingProfile, savePendingVisit, getPendingProfiles, getPendingVisits, clearPendingProfile, clearPendingVisit } from './lib/offline';
import { createBackup, getBackups } from './services/backupService';
import { auth, db, isConfigured, handleFirestoreError, OperationType } from './firebase';
import { sanitizeForFirestore } from './lib/utils';
import { 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  collection, 
  collectionGroup,
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  setDoc, 
  updateDoc,
  deleteField,
  addDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  getDocFromServer,
  arrayUnion,
  writeBatch,
  limit
} from 'firebase/firestore';
import Swal from 'sweetalert2';

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const Toast = Swal.mixin({
  toast: true,
  position: 'center',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: 'rgba(255, 255, 255, 0.98)',
  color: '#0f172a',
  customClass: {
    popup: 'rounded-[2.5rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.25)] border border-white/40 backdrop-blur-3xl px-8 py-6',
    title: 'text-lg font-black uppercase tracking-widest text-slate-800',
    htmlContainer: 'text-sm font-bold text-slate-500 mt-1'
  },
  showClass: {
    popup: 'animate__animated animate__fadeInDown animate__faster'
  }
});

// Center all Swal notifications by default
const AppSwal = Swal.mixin({
  position: 'center',
  customClass: {
    popup: 'rounded-3xl border-none shadow-2xl',
    confirmButton: 'rounded-xl font-bold px-8 py-3',
    cancelButton: 'rounded-xl font-bold px-8 py-3'
  }
});

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/calendar'
].join(' ');

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-lg ${className}`} />
);

function NavButton({ active, onClick, icon, label }: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center min-w-[72px] px-3 py-2 rounded-2xl transition-all duration-300 relative group
        ${active 
          ? 'bg-blue-50 text-blue-600' 
          : 'text-slate-400 hover:text-slate-600'
        }
      `}
    >
      <div className={`mb-1.5 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {React.cloneElement(icon as any, { size: 18, strokeWidth: active ? 2.5 : 2 })}
      </div>
      <span className={`text-[9px] font-bold tracking-tight whitespace-nowrap transition-colors ${active ? 'text-blue-600' : 'text-slate-400'}`}>
        {label}
      </span>
      {active && (
        <motion.div 
          layoutId="nav-active-indicator"
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"
        />
      )}
    </button>
  );
}

function MobileNavBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-row sm:flex-col lg:flex-row items-center justify-center py-2 px-4 rounded-xl sm:rounded-2xl transition-all duration-500 relative gap-2 shrink-0 group
        ${active ? 'text-slate-900' : 'text-slate-400 hover:text-slate-900'}
      `}
    >
      <div className={`transition-all duration-500 relative ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {React.cloneElement(icon as any, { className: `h-5 w-5 ${active ? 'text-brand-blue' : ''}` })}
        {active && (
          <div className="absolute -inset-2 bg-brand-blue/10 rounded-full blur-md" />
        )}
      </div>
      <span className={`text-[10px] font-black uppercase tracking-[0.2em] leading-none whitespace-nowrap transition-all ${active ? 'opacity-100 italic' : 'opacity-40 group-hover:opacity-80'}`}>
        {label}
      </span>
      {active && (
        <motion.div 
          layoutId="mobile-nav-pill"
          className="absolute -bottom-1 sm:-top-1 h-1 w-8 bg-brand-blue rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"
          initial={false}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </button>
  );
}

const TableSkeleton = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex gap-4 p-4 border-b border-slate-100">
        <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/4 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
    ))}
  </div>
);

function SplashScreen({ organization }: { organization: Organization | null }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[2000] bg-slate-50 flex flex-col items-center justify-center overflow-hidden font-sans uppercase-none"
    >
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-blue/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:32px_32px]" />
        
        {/* Animated Orbits */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 10 + i * 5, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ 
              width: `${400 + i * 200}px`, 
              height: `${400 + i * 200}px`,
              border: '1px solid rgba(0,0,0,0.03)',
              borderRadius: '50%'
            }}
          >
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-brand-blue rounded-full blur-[1px] opacity-20`} />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative mb-12"
        >
          <div className="h-24 w-24 bg-white rounded-[2.5rem] flex items-center justify-center border border-slate-100 shadow-xl">
             <div className="relative">
               <Shield className="h-12 w-12 text-brand-blue" />
               <motion.div 
                 animate={{ opacity: [0.4, 1, 0.4] }}
                 transition={{ duration: 2, repeat: Infinity }}
                 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%]"
               >
                 <Users className="h-5 w-5 text-indigo-500" />
               </motion.div>
             </div>
          </div>
          {/* Outer Ring */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 border-2 border-dashed border-brand-blue/10 rounded-[3rem]" 
          />
        </motion.div>

        {/* Text Fade-in */}
        <div className="text-center space-y-4">
           <motion.div
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.3, duration: 0.8 }}
           >
              <div className="flex items-center justify-center gap-3">
                 <span className="text-4xl font-bold text-slate-900 tracking-tight">Elite</span>
                 <span className="text-4xl font-black text-brand-blue tracking-tight">VMS</span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mt-3">Smart Visitor Infrastructure</p>
           </motion.div>

           {/* Loading Bar */}
           <div className="w-48 h-1 bg-slate-200 rounded-full mt-10 overflow-hidden relative mx-auto shadow-sm">
              <motion.div 
                initial={{ left: '-100%' }}
                animate={{ left: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-brand-blue to-transparent"
              />
           </div>
        </div>
      </div>

      {/* Organization Context */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-16 text-center"
      >
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white/50 backdrop-blur-sm px-6 py-2 rounded-full border border-slate-100">
          {organization ? `SYNCING: ${organization.name}` : 'COMMENCING INITIALIZATION'}
        </p>
      </motion.div>
    </motion.div>
  );
}

function LoaderScreen({ progress }: { progress: number }) {
  const tasks = [
    { id: 'firebase', label: 'Connecting to Firebase', sub: 'Establishing secure cloud node...', icon: <Database className="h-4 w-4" />, min: 0, max: 25 },
    { id: 'data', label: 'Fetching App Data', sub: 'Retrieving organization manifest...', icon: <Activity className="h-4 w-4" />, min: 25, max: 55 },
    { id: 'auth', label: 'Verifying Permissions', sub: 'Auditing user access levels...', icon: <Lock className="h-4 w-4" />, min: 55, max: 80 },
    { id: 'notify', label: 'Syncing Real-time', sub: 'Preparing live stream socket...', icon: <Bell className="h-4 w-4" />, min: 80, max: 100 }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95, filter: 'blur(20px)' }}
      className="fixed inset-0 z-[2000] bg-slate-50 flex flex-col items-center justify-start py-12 pt-16 font-sans overflow-y-auto no-scrollbar"
    >
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-indigo-50/50 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-96 bg-gradient-to-t from-blue-50/30 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-xl px-6 space-y-10">
        {/* Header Section */}
        <div className="text-center space-y-6">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex justify-center"
          >
            <div className="w-16 h-16 bg-white rounded-2xl shadow-xl shadow-brand-blue/5 border border-slate-100 flex items-center justify-center p-3 relative">
              <ShieldCheck className="h-full w-full text-brand-blue" />
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-brand-blue/20 rounded-2xl blur-md"
              />
            </div>
          </motion.div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Initializing Your Workspace</h2>
            <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto leading-relaxed">
              Please wait while we securely fetch your data from the cloud
            </p>
          </div>
        </div>

        {/* Central Illustration Area */}
        <div className="relative h-48 flex items-center justify-center">
          <div className="absolute w-full h-[1px] bg-slate-200/50" />
          
          {/* Main Building Mockup Icon */}
          <div className="relative z-10 w-24 h-32 bg-white rounded-xl border border-slate-200 shadow-2xl flex items-center justify-center">
            <div className="grid grid-cols-2 gap-2 p-4 w-full h-full opacity-20">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-slate-200 rounded-sm" />
              ))}
            </div>
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-1 bg-slate-100 rounded-full" />
            <div className="absolute inset-x-8 top-[60%] h-1 bg-slate-100 rounded-full" />
          </div>

          {/* Floating Context Icons */}
          {[
            { Icon: Users, color: 'text-indigo-500', pos: 'top-0 left-8', delay: 0 },
            { Icon: TrendingUp, color: 'text-emerald-500', pos: 'top-4 right-10', delay: 0.5 },
            { Icon: Bell, color: 'text-amber-500', pos: 'bottom-4 left-10', delay: 1 },
            { Icon: Shield, color: 'text-blue-500', pos: 'bottom-0 right-12', delay: 1.5 }
          ].map(({ Icon, color, pos, delay }, idx) => (
            <motion.div
              key={idx}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay }}
              className={`absolute ${pos} z-20 h-10 w-10 bg-white rounded-xl shadow-lg border border-slate-50 flex items-center justify-center ${color}`}
            >
              <Icon className="h-5 w-5" />
            </motion.div>
          ))}

          {/* Connective Dashed Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 overflow-visible">
            <path d="M 100,50 Q 150,20 200,80" fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M 400,60 Q 350,10 320,70" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M 120,160 Q 180,180 240,140" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M 450,150 Q 380,180 340,130" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" />
          </svg>
        </div>

        {/* Progress Section */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
          <div className="flex justify-between items-end mb-1">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Loading your data...</h3>
            <span className="text-xl font-black text-indigo-600 font-mono tracking-tighter tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>

          <div className="relative h-3 bg-indigo-50 rounded-full overflow-hidden p-0.5 border border-indigo-100/50">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-indigo-500 to-brand-blue rounded-full relative"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-10" />
            </motion.div>
          </div>
          
          <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic">
            Almost there! This won't take long.
          </p>
        </div>

        {/* Task Steps */}
        <div className="bg-white rounded-[2rem] p-4 sm:p-6 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden divide-y divide-slate-50">
          {tasks.map((task) => {
            const isDone = progress >= task.max;
            const isDoing = progress >= task.min && progress < task.max;
            
            return (
              <div key={task.id} className="flex items-center justify-between p-4 group transition-colors">
                <div className="flex items-center gap-5">
                  <div className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-colors ${isDone ? 'bg-emerald-50 text-emerald-500' : isDoing ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-50 text-slate-300'}`}>
                    {task.icon}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className={`text-sm font-black tracking-tight transition-colors ${isDone || isDoing ? 'text-slate-900' : 'text-slate-300'}`}>{task.label}</h4>
                    <p className={`text-[10px] font-medium transition-colors ${isDone || isDoing ? 'text-slate-500' : 'text-slate-300'}`}>{task.sub}</p>
                  </div>
                </div>
                <div>
                  {isDone ? (
                    <div className="h-6 w-6 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                  ) : isDoing ? (
                    <div className="h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Clock className="h-5 w-5 text-slate-200" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Security Footer */}
        <div className="bg-slate-900 rounded-3xl p-6 flex items-center justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/10 to-transparent pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-brand-blue">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Your security is our priority</h4>
              <p className="text-[9px] font-medium text-slate-400">All data is encrypted and your privacy is always protected.</p>
            </div>
          </div>
          <div className="relative h-10 w-10 flex items-center justify-center text-brand-blue/30 scale-150 rotate-12">
             <Lock className="h-8 w-8" />
             <div className="absolute bottom-[-2px] right-[-2px] h-4 w-4 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                <CheckCircle className="h-2 w-2 text-white" />
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}


const DashboardSkeleton = () => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Skeleton className="lg:col-span-2 h-96" />
      <Skeleton className="h-96" />
    </div>
  </div>
);

// Firebase configuration status
const isConfigValid = isConfigured;

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [availableOrgs, setAvailableOrgs] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true); // New state to handle initial load flicker
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [aiInsights, setAiInsights] = useState<{
    frequentVisitors: string;
    donationPatterns: string;
    visitPurpose: string;
    loading: boolean;
  }>({ frequentVisitors: '', donationPatterns: '', visitPurpose: '', loading: false });

  const fetchAIInsights = async () => {
    setAiInsights(prev => ({ ...prev, loading: true }));
    try {
      const insights = await geminiService.getVisitorInsights(visitors, donations);
      setAiInsights({ ...insights, loading: false });
    } catch (error) {
      console.error('Failed to fetch AI insights:', error);
      setAiInsights(prev => ({ ...prev, loading: false }));
      Swal.fire({
        title: 'AI Analysis Failed',
        text: 'Could not generate strategic insights at this time.',
        icon: 'error',
        toast: true,
        position: 'center',
        showConfirmButton: false,
        timer: 3000
      });
    }
  };
  const [isSavingDonation, setIsSavingDonation] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showForm, setShowForm] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'visitors' | 'records' | 'analysis' | 'profile' | 'settings' | 'birthdays' | 'reviews' | 'users' | 'logs' | 'donations' | 'organizations' | 'legal' | 'pre-registrations' | 'inquiries'>('dashboard');
  const [settingsSubTab, setSettingsSubTab] = useState<'Identity' | 'Visibility' | 'Forms' | 'Security'>('Identity');
  const [preRegFilter, setPreRegFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHECKED_IN'>('PENDING');
  const [legalSubView, setLegalSubView] = useState<'privacy' | 'terms' | 'support'>('support');
  const [showSplash, setShowSplash] = useState(true);
  const [showLoader, setShowLoader] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isKioskMode, setIsKioskMode] = useState(() => localStorage.getItem('vms_kiosk_mode') === 'true');
  const [isKioskFormOpen, setIsKioskFormOpen] = useState(false);
  const [isKioskPreRegLookupOpen, setIsKioskPreRegLookupOpen] = useState(false);
  const [recordsFilter, setRecordsFilter] = useState<'all' | 'inside' | 'checked-out' | 'today'>('all');
  const [orgUsers, setOrgUsers] = useState<User[]>([]);
  const [orgInvitations, setOrgInvitations] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(() => localStorage.getItem('activeOrgId'));

  // Splash Screen Logic
  useEffect(() => {
    if (isAuthReady) {
      // Transition from Splash to Custom Loader
      const timer = setTimeout(() => {
        setShowSplash(false);
        setShowLoader(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthReady]);

  // Loading Progress Logic
  useEffect(() => {
    if (showLoader) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setShowLoader(false);
              setPageLoading(false); // Ensure main page loading is also cleared
            }, 800);
            return 100;
          }
          // Dynamic simulation of resource allocation
          const increment = Math.random() * 12 + 2;
          return Math.min(prev + increment, 100);
        });
      }, 120);
      return () => clearInterval(interval);
    }
  }, [showLoader]);
  
  const isSuperAdminValue = useMemo(() => user?.email === 'nimbalkar.srujan@gmail.com', [user]);
  const { showToast } = useToast();
  
  useEffect(() => {
    setIsSuperAdmin(isSuperAdminValue);
  }, [isSuperAdminValue]);

  // Terms Acceptance Check
  useEffect(() => {
    if (!showSplash && !showLoader && isAuthReady && organization && user) {
      const hasAcceptedLocally = localStorage.getItem(`vms_legal_accepted_${user.uid}`) === 'true';
      if (!organization.legalAccepted || !hasAcceptedLocally) {
        setShowTermsAcceptance(true);
      } else {
        setShowTermsAcceptance(false);
      }
    }
  }, [showSplash, showLoader, isAuthReady, organization?.legalAccepted, user?.uid]);

  // Handle Kiosk Assistance Approval
  useEffect(() => {
    const exitApproved = notifications.find(n => n.type === 'KIOSK_ASSISTANCE' && (n as any).approved);
    if (exitApproved && isKioskMode) {
      localStorage.setItem('vms_kiosk_mode', 'false');
      setIsKioskMode(false);
      setIsKioskFormOpen(false);
      setKioskSessionEntries([]);
      addToast('Kiosk exit approved by staff', 'success');
      // Mark notification as deleted so it doesn't trigger again
      const ref = doc(db, 'organizations', user?.organizationId || '', 'notifications', exitApproved.id);
      updateDoc(ref, { deleted: true });
    }
  }, [notifications, isKioskMode, user?.organizationId]);

  const effectiveOrgId = useMemo(() => {
    if (isSuperAdminValue && activeOrgId) return activeOrgId;
    return user?.organizationId || null;
  }, [user?.organizationId, isSuperAdminValue, activeOrgId]);

  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [showAppFeedback, setShowAppFeedback] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);
  const [showTermsAcceptance, setShowTermsAcceptance] = useState(false);
  const [showPassForVisitor, setShowPassForVisitor] = useState<any | null>(null);
  const [showPrintablePass, setShowPrintablePass] = useState<Visitor | null>(null);
  const [showPrintableBatchPass, setShowPrintableBatchPass] = useState<Visitor[] | null>(null);

  const [dashboardPage, setDashboardPage] = useState(0);
  const DASHBOARD_ITEMS_PER_PAGE = 5;

  const [newPurpose, setNewPurpose] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDonationOccasion, setNewDonationOccasion] = useState('');
  const [newEventOccasion, setNewEventOccasion] = useState('');

  const handleAddPurpose = () => {
    if (!newPurpose.trim()) return;
    const current = organization?.visitPurposes || [...PURPOSES];
    if (!current.includes(newPurpose.trim())) {
      setOrganization(prev => prev ? { ...prev, visitPurposes: [...current, newPurpose.trim()] } : null);
      setNewPurpose('');
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    const current = organization?.visitorCategories || [...TYPES];
    if (!current.includes(newCategory.trim())) {
      setOrganization(prev => prev ? { ...prev, visitorCategories: [...current, newCategory.trim()] } : null);
      setNewCategory('');
    }
  };

  const handleAddDonationOccasion = () => {
    if (!newDonationOccasion.trim()) return;
    const current = organization?.donationOccasions || [...DEFAULT_DONATION_OCCASIONS];
    if (!current.includes(newDonationOccasion.trim())) {
      setOrganization(prev => prev ? { ...prev, donationOccasions: [...current, newDonationOccasion.trim()] } : null);
      setNewDonationOccasion('');
    }
  };

  const handleAddEventOccasion = () => {
    if (!newEventOccasion.trim()) return;
    const current = organization?.eventOccasions || [...DEFAULT_EVENT_OCCASIONS];
    if (!current.includes(newEventOccasion.trim())) {
      setOrganization(prev => prev ? { ...prev, eventOccasions: [...current, newEventOccasion.trim()] } : null);
      setNewEventOccasion('');
    }
  };

  const isTabVisible = (tab: string) => {
    if (tab === 'legal' || tab === 'profile') return true;
    if (user?.role === 'ADMIN' || user?.role === 'MASTER_ADMIN' || isSuperAdmin) {
      return true;
    }
    if (!organization?.navigationVisibility) return true;
    const mapping: Record<string, string> = {
      'dashboard': 'Home',
      'visitors': 'Entry',
      'inquiries': 'Inquiries',
      'records': 'Records',
      'analysis': 'Analysis',
      'birthdays': 'Birthday',
      'reviews': 'Reviews',
      'logs': 'Logs',
      'profile': 'Profile',
      'donations': 'Donations',
      'legal': 'Support',
      'pre-registrations': 'Pre-Reg'
    };
    const displayName = mapping[tab] || tab;
    if (displayName === 'Donations') return false; // Staff should not see donations unless manually allowed (but prompt says admin only)
    return organization.navigationVisibility[displayName] !== false;
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const createNotification = useCallback(async (n: Omit<Notification, 'id' | 'organizationId' | 'read' | 'timestamp'>, docId?: string) => {
    const orgId = user?.organizationId;
    if (!orgId) return;
    try {
      const id = docId || `NOTIF-${Date.now()}`;
      const docRef = doc(db, 'organizations', orgId, 'notifications', id);
      
      // If we have a stable docId (like a birthday or waiting alert), 
      // check if it already exists to avoid overwriting the 'read' status
      if (docId) {
        const snap = await getDoc(docRef);
        if (snap.exists()) return; 
      }

      await setDoc(docRef, sanitizeForFirestore({
        ...n,
        id,
        organizationId: orgId,
        read: false,
        timestamp: new Date().toISOString()
      }), { merge: true });
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  }, [user?.organizationId]);

  // Inquiry Reminders Logic
  useEffect(() => {
    const orgId = user?.organizationId;
    if (!orgId || !user) return;

    const q = query(
      collection(db, 'organizations', orgId, 'inquiries'),
      where('deleted', '==', false),
      where('reminderSet', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const today = new Date().toISOString().split('T')[0];
      snapshot.docs.forEach(async (docSnap) => {
        const inquiry = { id: docSnap.id, ...docSnap.data() } as Inquiry;
        
        // Only notify if status is not COMPLETED or CANCELLED
        if (inquiry.status !== 'PENDING' && inquiry.status !== 'IN_PROGRESS') return;
        
        // Trigger notification if today is followUpDate and not yet reminded
        if (inquiry.followUpDate === today && !inquiry.reminded) {
          await createNotification({
            title: 'Follow-up Due Today',
            message: `Inquiry follow-up for ${inquiry.callerName} is scheduled for today.`,
            type: 'FOLLOW_UP',
            relatedId: inquiry.id
          });
          
          const ref = doc(db, 'organizations', orgId, 'inquiries', inquiry.id);
          await updateDoc(ref, { reminded: true, updatedAt: new Date().toISOString() });
        }
      });
    });

    return () => unsubscribe();
  }, [user?.organizationId, user?.uid, createNotification]);

  const logActivity = useCallback(async (action: string, details: string) => {
    const orgId = user?.organizationId;
    if (!user || !orgId) return;
    try {
      await addDoc(collection(db, 'organizations', orgId, 'activityLogs'), {
        userId: user.uid,
        organizationId: orgId,
        action,
        details,
        timestamp: new Date().toISOString()
      });

      // Trigger notification if security alerts are enabled
      if (user.preferences?.notifs) {
        await createNotification({
          title: `Security Log: ${action}`,
          message: details,
          type: 'SYSTEM',
        });
      }
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }, [user, createNotification]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    showToast(message, type === 'info' ? 'info' : type);
  }, [showToast]);

  const [googleConfig, setGoogleConfig] = useState<{ 
    connected: boolean; 
    spreadsheetId: string | null; 
    calendarId: string | null; 
    birthdayCalendarId: string | null;
    lastSyncTime: string | null;
    totalRecordsSynced: number | null;
    totalEventsSynced: number | null;
    loading: boolean 
  }>({ 
    connected: false, 
    spreadsheetId: null, 
    calendarId: null, 
    birthdayCalendarId: null,
    lastSyncTime: null,
    totalRecordsSynced: null,
    totalEventsSynced: null,
    loading: true 
  });

  // Re-initialize from localStorage when org becomes available
  useEffect(() => {
    if (effectiveOrgId) {
      const saved = localStorage.getItem(`vms_google_connected_${effectiveOrgId}`);
      const sheet = localStorage.getItem(`vms_google_sheet_${effectiveOrgId}`);
      const cal = localStorage.getItem(`vms_google_calendar_${effectiveOrgId}`);
      const bday = localStorage.getItem(`vms_google_birthday_calendar_${effectiveOrgId}`);
      
      if (saved === 'true') {
        setGoogleConfig(prev => ({
          ...prev,
          connected: true,
          spreadsheetId: sheet,
          calendarId: cal,
          birthdayCalendarId: bday,
          loading: false
        }));
      } else {
        // If not explicitly saved as connected, we keep the loading state until fetch confirms
        setGoogleConfig(prev => ({ ...prev, loading: true }));
      }
    }
  }, [effectiveOrgId]);

  const [availableSheets, setAvailableSheets] = useState<{ id: string; name: string }[]>([]);
  const [availableCalendars, setAvailableCalendars] = useState<{ id: string; summary: string }[]>([]);
  const [isFetchingSheets, setIsFetchingSheets] = useState(false);
  const [isFetchingCalendars, setIsFetchingCalendars] = useState(false);

  const lastConnectionRef = React.useRef<number>(0);

  const fetchGoogleConfig = useCallback(async () => {
    if (!effectiveOrgId) return;
    try {
      // Use shorter timeout for status checks
      const response = await fetch(`/api/google/config?organizationId=${effectiveOrgId}`);
      if (response.ok) {
        const data = await response.json();
        
        setGoogleConfig(prev => {
          // PROTECTION: If we just established a connection or have a localStorage hint,
          // be extremely conservative about flipping to false.
          const isRecentlyConnected = Date.now() - lastConnectionRef.current < 60000;
          const hasLocalHint = localStorage.getItem(`vms_google_connected_${effectiveOrgId}`) === 'true';
          
          if ((prev.connected || hasLocalHint) && !data.connected && isRecentlyConnected) {
             console.log('Skipping Google disconnect - within grace period (60s)');
             return prev;
          }

          // If we have data, persist it immediately
          if (data.connected) {
            localStorage.setItem(`vms_google_connected_${effectiveOrgId}`, 'true');
            if (data.spreadsheetId) localStorage.setItem(`vms_google_sheet_${effectiveOrgId}`, data.spreadsheetId);
            if (data.calendarId) localStorage.setItem(`vms_google_calendar_${effectiveOrgId}`, data.calendarId);
            if (data.birthdayCalendarId) localStorage.setItem(`vms_google_birthday_calendar_${effectiveOrgId}`, data.birthdayCalendarId);
          } else {
            // Only remove local hint if NOT in grace period
            if (!isRecentlyConnected) {
              localStorage.removeItem(`vms_google_connected_${effectiveOrgId}`);
            }
          }

          return { ...data, loading: false };
        });
      } else {
        setGoogleConfig(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Failed to fetch Google config:', error);
      setGoogleConfig(prev => ({ ...prev, loading: false }));
    }
  }, [effectiveOrgId]);

  const fetchAvailableSheets = useCallback(async () => {
    if (!effectiveOrgId || !googleConfig.connected) return;
    setIsFetchingSheets(true);
    try {
      console.log('Fetching available Google Sheets...');
      const response = await fetch(`/api/google/sheets?organizationId=${effectiveOrgId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Available sheets fetched:', data.length);
        setAvailableSheets(data);
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error('Failed to fetch sheets:', response.status, errData);
        if (response.status === 401) {
        // Silently retry first
        const isRecentlyConnected = Date.now() - lastConnectionRef.current < 45000;
        if (isRecentlyConnected) {
          console.log('Suppressed early 401 for Sheets - within grace period');
          return;
        }
        await new Promise(r => setTimeout(r, 2000));
        const retryRes = await fetch(`/api/google/sheets?organizationId=${effectiveOrgId}`);
        if (retryRes.ok) {
          setAvailableSheets(await retryRes.json());
        } else if (retryRes.status === 401) {
          console.warn('Final 401 for Google Sheets. Refreshing config...');
          fetchGoogleConfig();
        }
      }
    }
  } catch (error) {
      console.error('Failed to fetch available sheets:', error);
    } finally {
      setIsFetchingSheets(false);
    }
  }, [effectiveOrgId, googleConfig.connected, fetchGoogleConfig]);

  const fetchAvailableCalendars = useCallback(async () => {
    if (!effectiveOrgId || !googleConfig.connected) return;
    setIsFetchingCalendars(true);
    try {
      console.log('Fetching available Google Calendars...');
      const response = await fetch(`/api/google/calendars?organizationId=${effectiveOrgId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Available calendars fetched:', data.length);
        setAvailableCalendars(data);
      } else if (response.status === 401) {
        // Silently retry first
        const isRecentlyConnected = Date.now() - lastConnectionRef.current < 45000;
        if (isRecentlyConnected) {
          console.log('Suppressed early 401 for Calendar - within grace period');
          return;
        }
        await new Promise(r => setTimeout(r, 2000));
        const retryRes = await fetch(`/api/google/calendars?organizationId=${effectiveOrgId}`);
        if (retryRes.ok) {
          setAvailableCalendars(await retryRes.json());
        } else if (retryRes.status === 401) {
          console.warn('Final 401 for Google Calendar. Refreshing config...');
          fetchGoogleConfig();
        }
      }
    } catch (error) {
      console.error('Failed to fetch available calendars:', error);
    } finally {
      setIsFetchingCalendars(false);
    }
  }, [effectiveOrgId, googleConfig.connected, fetchGoogleConfig]);

  useEffect(() => {
    if (googleConfig.connected) {
      // Delay fetching available items to let backend sync and verify connection
      const timer = setTimeout(() => {
        fetchAvailableSheets();
        fetchAvailableCalendars();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [googleConfig.connected, fetchAvailableSheets, fetchAvailableCalendars]);

  useEffect(() => {
    fetchGoogleConfig();
  }, [fetchGoogleConfig]);

  useEffect(() => {
    const handleGoogleAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        console.log('Google Auth Success detected via message');
        // Optimistically set connected to true to show the dropdowns immediately
        setGoogleConfig(prev => ({ ...prev, connected: true, loading: false }));
        
        if (effectiveOrgId) {
          localStorage.setItem(`vms_google_connected_${effectiveOrgId}`, 'true');
        }
        
        addToast('Google account linked successfully!', 'success');
        
        lastConnectionRef.current = Date.now();
        
        // Poll for backend confirmation to ensure UI stays connected
        let attempts = 0;
        const pollConfig = async () => {
          if (!effectiveOrgId) return;
          try {
            const response = await fetch(`/api/google/config?organizationId=${effectiveOrgId}`);
            if (response.ok) {
              const data = await response.json();
              if (data.connected) {
                console.log('Google Auth Confirmed by backend during polling');
                setGoogleConfig({ ...data, loading: false });
                
                // Fetch datasets immediately after confirmation
                fetchAvailableSheets();
                fetchAvailableCalendars();
                return; // Backend confirmed connection
              }
            }
          } catch (e) {
            console.error('Polling for Google config failed:', e);
          }
          
          attempts++;
          if (attempts < 25) { // Increase attempts for slow Firestore propagation
            setTimeout(pollConfig, 2000);
          } else {
            console.log('Polling finished, doing final config fetch');
            fetchGoogleConfig();
          }
        };
        
        setTimeout(pollConfig, 1500);
      }
    };
    window.addEventListener('message', handleGoogleAuthMessage);
    return () => window.removeEventListener('message', handleGoogleAuthMessage);
  }, [effectiveOrgId, fetchGoogleConfig, fetchAvailableSheets, fetchAvailableCalendars, addToast]);

  const onFetchBackups = async () => {
    if (!effectiveOrgId) return [];
    try {
        return await getBackups(effectiveOrgId);
    } catch (e) {
        console.error(e);
        return [];
    }
  };

      const onRestoreBackup = async (data: any) => {
    if (!effectiveOrgId) return;
    
    // Performance improvement: sanity check for data structure
    if (!data || (typeof data !== 'object')) {
        addToast('Invalid backup file format', 'error');
        return;
    }

    const { isConfirmed } = await Swal.fire({
      title: 'Initiate Restoration?',
      text: "This will overwrite current organization data with the backup contents. This action is recorded in the audit trail.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0F9D58',
      confirmButtonText: 'Yes, Restore All'
    });

    if (!isConfirmed) return;

    setAuthLoading(true);
    try {
      // Chunk restoration to handle Firestore batch limits (500)
      const collections = [
        { key: 'profiles', path: 'profiles', idField: 'phone' },
        { key: 'visits', path: 'visits', idField: 'visitId' },
        { key: 'donations', path: 'donations', idField: 'id' },
        { key: 'inquiries', path: 'inquiries', idField: 'id' },
        { key: 'preRegistrations', path: 'preRegistrations', idField: 'id' },
        { key: 'orgUsers', path: 'users', idField: 'uid' },
        { key: 'activityLogs', path: 'activityLogs', idField: 'id' }
      ];

      for (const col of collections) {
        const items = data[col.key];
        if (items && Array.isArray(items)) {
          // Batch items in 400s to be safe
          for (let i = 0; i < items.length; i += 400) {
            const batch = writeBatch(db);
            const chunk = items.slice(i, i + 400);
            chunk.forEach((item: any) => {
              const id = item[col.idField] || item.id || `RESTORED-${Date.now()}-${Math.random()}`;
              batch.set(doc(db, 'organizations', effectiveOrgId, col.path, id), sanitizeForFirestore(item));
            });
            await batch.commit();
          }
        }
      }

      await logActivity('RESTORE_BACKUP', `Successfully restored ${Object.keys(data).length} data types from file.`);
      addToast('Full organization data restored!', 'success');
      // Refresh local state by just reloading or re-triggering snapshots if not automatic
      window.location.reload(); 
    } catch (e: any) {
      console.error(e);
      addToast('Restoration complex failure: ' + e.message, 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const onCreateBackup = async () => {
    if (!effectiveOrgId) return;
    try {
        const fullBackup = { 
          profiles, 
          visits, 
          donations, 
          orgUsers,
          preRegistrations: [],
          inquiries: [],
          activityLogs: []
        };
        // Fetch all data for organization for a true full backup
        const inquiriesSnap = await getDocs(collection(db, 'organizations', effectiveOrgId, 'inquiries'));
        const preRegSnap = await getDocs(collection(db, 'organizations', effectiveOrgId, 'preRegistrations'));
        const logsSnap = await getDocs(query(collection(db, 'organizations', effectiveOrgId, 'activityLogs'), limit(1000)));
        
        (fullBackup as any).inquiries = inquiriesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        (fullBackup as any).preRegistrations = preRegSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        (fullBackup as any).activityLogs = logsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        await createBackup(effectiveOrgId, fullBackup, user?.uid || 'UNKNOWN', user?.name || 'System');
        addToast('Full secure backup synchronized!', 'success');
    } catch (e) {
        console.error(e);
        addToast('Backup extraction failed', 'error');
    }
  };

  // Automatic backup: every 24 hours
  useEffect(() => {
    if (!effectiveOrgId) return;
    const interval = setInterval(onCreateBackup, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [effectiveOrgId]);

  const connectGoogle = async () => {
    addToast('Google Integration is currently Coming Soon!', 'info');
  };

  const createNewSheet = async () => {
    if (!effectiveOrgId) return;
    try {
      const response = await fetch('/api/google/sheets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: effectiveOrgId, name: `${organization?.name || 'VMS'} Visitor Logs` })
      });
      if (response.ok) {
        fetchGoogleConfig();
        // Auto-enable sync
        if (organization && effectiveOrgId) {
          try {
            await updateDoc(doc(db, 'organizations', effectiveOrgId), { autoSyncEnabled: true });
            setOrganization(prev => prev ? { ...prev, autoSyncEnabled: true } : null);
          } catch (e) { console.error('Failed to auto-enable sync:', e); }
        }
        addToast('New spreadsheet created and linked!', 'success');
      }
    } catch (error) {
      console.error('Failed to create sheet:', error);
      addToast('Failed to create spreadsheet', 'error');
    }
  };

  const selectExistingSheet = async (spreadsheetId: string) => {
    if (!effectiveOrgId) return;
    try {
      const response = await fetch('/api/google/sheets/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: effectiveOrgId, spreadsheetId })
      });
      if (response.ok) {
        fetchGoogleConfig();
        // Auto-enable sync
        if (organization && effectiveOrgId) {
          try {
            await updateDoc(doc(db, 'organizations', effectiveOrgId), { autoSyncEnabled: true });
            setOrganization(prev => prev ? { ...prev, autoSyncEnabled: true } : null);
          } catch (e) { console.error('Failed to auto-enable sync:', e); }
        }
        addToast('Spreadsheet linked successfully!', 'success');
      }
    } catch (error) {
      console.error('Failed to select sheet:', error);
      addToast('Failed to link spreadsheet', 'error');
    }
  };

  const createNewCalendar = async (type: 'primary' | 'birthday' = 'primary') => {
    if (!effectiveOrgId) return;
    try {
      const endpoint = type === 'birthday' ? '/api/google/calendar/birthday/create' : '/api/google/calendar/create';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: effectiveOrgId, name: type === 'birthday' ? 'Visitor Birthdays' : `${organization?.name || 'VMS'} Appointments` })
      });
      if (response.ok) {
        fetchGoogleConfig();
        // Auto-enable sync
        if (organization && effectiveOrgId) {
          try {
            await updateDoc(doc(db, 'organizations', effectiveOrgId), { autoSyncEnabled: true });
            setOrganization(prev => prev ? { ...prev, autoSyncEnabled: true } : null);
          } catch (e) { console.error('Failed to auto-enable sync:', e); }
        }
        addToast(type === 'birthday' ? 'Birthday calendar created!' : 'New calendar created and linked!', 'success');
      }
    } catch (error) {
      console.error('Failed to create calendar:', error);
      addToast('Failed to create calendar', 'error');
    }
  };

  const selectExistingCalendar = async (calendarId: string, type: 'primary' | 'birthday' = 'primary') => {
    if (!effectiveOrgId) return;
    try {
      const endpoint = type === 'birthday' ? '/api/google/calendar/birthday/select' : '/api/google/calendar/select';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: effectiveOrgId, calendarId })
      });
      if (response.ok) {
        fetchGoogleConfig();
        // Auto-enable sync
        if (organization && effectiveOrgId) {
          try {
            await updateDoc(doc(db, 'organizations', effectiveOrgId), { autoSyncEnabled: true });
            setOrganization(prev => prev ? { ...prev, autoSyncEnabled: true } : null);
          } catch (e) { console.error('Failed to auto-enable sync:', e); }
        }
        addToast('Calendar linked successfully!', 'success');
      }
    } catch (error) {
      console.error('Failed to select calendar:', error);
      addToast('Failed to link calendar', 'error');
    }
  };

  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);

  const disconnectGoogle = async () => {
    if (!effectiveOrgId) return;
    if (!window.confirm('Are you sure you want to disconnect Google services? This will stop all automated syncing.')) return;
    
    try {
      const response = await fetch('/api/google/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: effectiveOrgId })
      });
      if (response.ok) {
        setGoogleConfig({ 
          connected: false, 
          spreadsheetId: null, 
          calendarId: null, 
          birthdayCalendarId: null, 
          lastSyncTime: null,
          totalRecordsSynced: null,
          totalEventsSynced: null,
          loading: false 
        });
        localStorage.removeItem(`vms_google_connected_${effectiveOrgId}`);
        localStorage.removeItem(`vms_google_sheet_${effectiveOrgId}`);
        localStorage.removeItem(`vms_google_calendar_${effectiveOrgId}`);
        localStorage.removeItem(`vms_google_birthday_calendar_${effectiveOrgId}`);
        addToast('Google services disconnected', 'info');
      } else {
        addToast('Failed to disconnect Google services', 'error');
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
      addToast('Failed to disconnect Google services', 'error');
    }
  };

  const triggerGoogleSync = async () => {
    if (!effectiveOrgId) return;
    setIsSyncingGoogle(true);
    try {
      const response = await fetch('/api/google/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: effectiveOrgId })
      });
      if (response.ok) {
        const data = await response.json();
        setGoogleConfig(prev => ({ 
          ...prev, 
          lastSyncTime: data.lastSyncTime || prev.lastSyncTime,
          totalRecordsSynced: data.totalRecordsSynced ?? prev.totalRecordsSynced,
          totalEventsSynced: data.totalEventsSynced ?? prev.totalEventsSynced
        }));
        addToast('Manual synchronization complete', 'success');
      } else {
        addToast('Synchronization failed', 'error');
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
      addToast('Synchronization failed', 'error');
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [reviewVisitor, setReviewVisitor] = useState<Visitor | null>(null);
  const [isBirthdayTrackingEnabled, setIsBirthdayTrackingEnabled] = useState(true);

  // Network status listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addToast('Back online - System ready', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      addToast('Working offline - Changes queued', 'info');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addToast]);

  // Sync birthday tracking with organization data
  useEffect(() => {
    if (organization) {
      setIsBirthdayTrackingEnabled(organization.birthdayTrackingEnabled !== false);
    }
  }, [organization]);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [kioskPin, setKioskPin] = useState('');
  const [showKioskPin, setShowKioskPin] = useState(false);
  
  // Handle Digital Visitor Pass URL
  const [standalonePassData, setStandalonePassData] = useState<{visitorId: string, orgId: string} | null>(null);
  const [showPublicRegister, setShowPublicRegister] = useState<string | null>(null);

  useEffect(() => {
    const handleUrlChange = async () => {
      const params = new URLSearchParams(window.location.search);
      // Resolve organization first
      const orgId = params.get('orgId')?.trim() || '';
      const passId = params.get('passId')?.trim() || '';
      const mode = params.get('mode')?.trim() || '';
      const view = params.get('view')?.trim() || '';

      if (view === 'register' && orgId) {
        setShowPublicRegister(orgId);
        setStandalonePassData(null);
      } else if (passId && orgId) {
        setStandalonePassData({ visitorId: passId, orgId });
        setShowPublicRegister(null);
        
        // AUTO-ACTION LOGIC: Make the same QR code support both actions based on visitor status automatically.
        // It requires a specific action explicit query parameter in the URL.
        const sessionKey = `auto_action_${passId}_${mode}`;
        if ((mode === 'checkin' || mode === 'checkout') && !sessionStorage.getItem(sessionKey)) {
          sessionStorage.setItem(sessionKey, 'processing');
          
          try {
            // First fetch current status securely
            const statusRes = await fetch(`/api/organizations/${orgId}/visitor-status/${passId}`);
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              const currentStatus = statusData.status;

              if (mode === 'checkin' && (currentStatus === 'PENDING' || currentStatus === 'APPROVED')) {
                // Auto Check-in logic!
                Swal.fire({
                  title: 'Checking In...',
                  text: 'Please wait while we record your entry.',
                  allowOutsideClick: false,
                  didOpen: () => { Swal.showLoading(); }
                });

                const checkInRes = await fetch(`/api/visitors/${passId}/checkin`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ organizationId: orgId })
                });

                if (checkInRes.ok) {
                  Swal.fire({
                    title: 'Check-in Successful',
                    text: 'Your entry has been recorded. Welcome!',
                    icon: 'success',
                    timer: 3000,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
                    color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000',
                  });
                  addToast('Check-in successful!', 'success');
                } else {
                  throw new Error('Checkin API failed');
                }
              } else if (mode === 'checkout' && currentStatus === 'INSIDE') {
                // Auto Check-out logic!
                Swal.fire({
                  title: 'Checking Out...',
                  text: 'Please wait while we record your exit.',
                  allowOutsideClick: false,
                  didOpen: () => { Swal.showLoading(); }
                });

                const checkOutRes = await fetch(`/api/visitors/${passId}/checkout`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    checkOutTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                    organizationId: orgId 
                  })
                });

                if (checkOutRes.ok) {
                  Swal.fire({
                    title: 'Check-out Successful',
                    text: 'Your exit has been recorded automatically. Please rate your experience.',
                    icon: 'success',
                    timer: 4000,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
                    color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000',
                  });
                  addToast('Check-out successful! Please rate your experience.', 'success');
                } else {
                  throw new Error('Checkout API failed');
                }
              }
            }
          } catch (error) {
            console.error('Auto-action encountered an issue:', error);
            Swal.close();
          }
        }
      } else {
        setStandalonePassData(null);
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [theme]);

  const [kioskSessionEntries, setKioskSessionEntries] = useState<Visitor[]>([]);
  const [isScreenSaver, setIsScreenSaver] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [kioskLang, setKioskLang] = useState<'EN' | 'HI'>('EN');
  const [isSyncingOffline, setIsSyncingOffline] = useState(false);

  // Auto-sync function
  const syncOfflineData = useCallback(async () => {
    if (!isOnline || isSyncingOffline) return;
    
    const pendingProfiles = await getPendingProfiles();
    const pendingVisits = await getPendingVisits();
    
    if (pendingProfiles.length === 0 && pendingVisits.length === 0) return;
    
    setIsSyncingOffline(true);
    try {
      // Sync Profiles first
      for (const profile of pendingProfiles) {
        if (!profile.phone || !profile.organizationId) {
          await clearPendingProfile(profile.phone);
          continue;
        }
        const sanitizedProfile = { ...profile };
        Object.keys(sanitizedProfile).forEach(key => {
          if ((sanitizedProfile as any)[key] === undefined) (sanitizedProfile as any)[key] = '';
        });
        await setDoc(doc(db, 'organizations', profile.organizationId, 'profiles', profile.phone), sanitizedProfile);
        await clearPendingProfile(profile.phone);
      }
      
      // Sync Visits
      for (const visit of pendingVisits) {
        if (!visit.visitId || !visit.organizationId || !visit.visitorPhone) {
          await clearPendingVisit(visit.visitId);
          continue;
        }
        const sanitizedVisit = { ...visit };
        Object.keys(sanitizedVisit).forEach(key => {
          if ((sanitizedVisit as any)[key] === undefined) (sanitizedVisit as any)[key] = '';
        });
        await setDoc(doc(db, 'organizations', visit.organizationId, 'visits', visit.visitId), sanitizedVisit);
        await clearPendingVisit(visit.visitId);
        
        // Sync to backend APIs if possible
        try {
          await fetch('/api/visitors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...visit, visitorId: visit.visitId })
          });
        } catch (e) { console.error('API Sync failed for visit', visit.visitId); }
      }
    } catch (error) {
      console.error('Offline sync failed:', error);
      addToast('Some offline data failed to sync. Will retry.', 'error');
    } finally {
      setIsSyncingOffline(false);
    }
  }, [isOnline, isSyncingOffline, addToast]);

  // Trigger sync on reconnection
  useEffect(() => {
    if (isOnline) {
      syncOfflineData();
    }
  }, [isOnline, syncOfflineData]);

  // Connection Test
  useEffect(() => {
    if (!isConfigured) return;
    
    const testConnection = async () => {
      if (!isConfigured) return;
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        // Log all errors during dev to catch config issues
        console.warn("Firestore connectivity check:", error);
      }
    };
    testConnection();
  }, []);

  // Auth State Listener with Real-time Profile Tracking
  useEffect(() => {
    let unsubscribeUser: (() => void) | null = null;
    let unsubscribeOrg: (() => void) | null = null;
    let unsubscribeNestedUser: (() => void) | null = null;
    let currentListeningOrgId: string | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth State Changed:', firebaseUser?.uid, firebaseUser?.email);
      setPageLoading(true);
      if (firebaseUser) {
        setAuthLoading(true);
        console.log('Subscribing to user registry:', firebaseUser.uid);
        unsubscribeUser = onSnapshot(doc(db, 'users', firebaseUser.uid), async (registrySnap) => {
          console.log('User registry snapshot received:', registrySnap.exists());
          if (registrySnap.exists()) {
            const registryData = registrySnap.data() as User;
            
            // Step 0: Handle fresh login behavior - clear last selected workspace to force selector for multi-org users
            if (sessionStorage.getItem('vms_fresh_login') === 'true') {
              console.log('Detected fresh login. Auto-resetting workspace selection for multi-org awareness.');
              sessionStorage.removeItem('vms_selected_org_id');
              sessionStorage.removeItem('vms_fresh_login');
              setSelectedOrgId(null);
            }

            // Step 1: Query all candidate organization IDs this user belongs to
            const candidateOrgIds = new Set<string>();
            if (registryData.organizationId) {
              candidateOrgIds.add(registryData.organizationId);
            }
            if (Array.isArray((registryData as any).associatedOrgs)) {
              (registryData as any).associatedOrgs.forEach((o: any) => {
                if (typeof o === 'string' && o) {
                  candidateOrgIds.add(o);
                } else if (o && typeof o === 'object' && o.orgId) {
                  candidateOrgIds.add(o.orgId);
                }
              });
            }

            const normalizedEmail = firebaseUser.email?.toLowerCase().trim() || registryData.email?.toLowerCase().trim() || '';

            // Step 1b: Fetch any global and collectionGroup invitations matching the user's email
            if (normalizedEmail) {
              try {
                // Read global invitation
                const globalInviteSnap = await getDoc(doc(db, 'invitations', normalizedEmail));
                if (globalInviteSnap.exists()) {
                  const globalInviteData = globalInviteSnap.data();
                  if (globalInviteData.organizationId) {
                    candidateOrgIds.add(globalInviteData.organizationId);
                  }
                }
              } catch (inviteErr) {
                console.warn('Failed to fetch user global invitation:', inviteErr);
              }

              try {
                // CollectionGroup query to find invitations nested inside organizations
                const invitationsQuery = query(collectionGroup(db, 'invitations'), where('email', '==', normalizedEmail));
                const invitationsSnap = await getDocs(invitationsQuery);
                invitationsSnap.docs.forEach(docSnap => {
                  const parentId = docSnap.ref.parent.parent?.id;
                  const data = docSnap.data();
                  const orgId = data.organizationId || parentId;
                  if (orgId && orgId !== 'invitations') {
                    candidateOrgIds.add(orgId);
                  }
                });
              } catch (cgInvErr) {
                console.warn('CollectionGroup invitations query restricted or failed:', cgInvErr);
              }
            }

            try {
              // CollectionGroup query to find other organizations where this user is registered
              const userInOrgsQuery = query(collectionGroup(db, 'users'), where('uid', '==', firebaseUser.uid));
              const userInOrgsSnap = await getDocs(userInOrgsQuery);
              userInOrgsSnap.docs.forEach(docSnap => {
                const data = docSnap.data();
                const parentId = docSnap.ref.parent.parent?.id;
                const orgId = data.organizationId || parentId;
                if (orgId && orgId !== 'users') {
                  candidateOrgIds.add(orgId);
                }
              });
            } catch (cgError) {
              console.warn('CollectionGroup users query restricted or failed:', cgError);
            }

            // Step 2: Fetch and verify details for each organization to ensure accessibility & membership
            const orgsList: any[] = [];
            for (const orgId of Array.from(candidateOrgIds)) {
              try {
                const orgSnap = await getDoc(doc(db, 'organizations', orgId));
                if (orgSnap.exists()) {
                  const orgData = orgSnap.data();
                  let userRoleInOrg = 'STAFF';
                  if (orgId === registryData.organizationId) {
                    userRoleInOrg = registryData.role || 'STAFF';
                  } else {
                    const nestedUserSnap = await getDoc(doc(db, 'organizations', orgId, 'users', firebaseUser.uid));
                    if (nestedUserSnap.exists()) {
                      userRoleInOrg = nestedUserSnap.data().role || 'STAFF';
                    } else if (orgData.createdBy === firebaseUser.uid) {
                      userRoleInOrg = 'MASTER_ADMIN';
                    } else {
                      // Check for a pending invitation's role
                      const orgInviteRef = doc(db, 'organizations', orgId, 'invitations', normalizedEmail);
                      const orgInviteSnap = await getDoc(orgInviteRef);
                      if (orgInviteSnap.exists()) {
                        userRoleInOrg = orgInviteSnap.data().role || 'STAFF';
                      } else {
                        const globalInviteSnap = await getDoc(doc(db, 'invitations', normalizedEmail));
                        if (globalInviteSnap.exists() && globalInviteSnap.data().organizationId === orgId) {
                          userRoleInOrg = globalInviteSnap.data().role || 'STAFF';
                        } else {
                          continue; // User has no association with this organization
                        }
                      }
                    }
                  }
                  orgsList.push({
                    id: orgId,
                    name: orgData.name || 'Unnamed Organization',
                    logoUrl: orgData.logoUrl || '',
                    role: userRoleInOrg
                  });
                }
              } catch (err) {
                console.warn(`Could not access/verify organization ${orgId}:`, err);
              }
            }

            setAvailableOrgs(orgsList);

            // Step 3: Resolution of active organization
            let activeOrgId: string | null = null;
            let activeRole: UserRole = 'STAFF';

            if (orgsList.length === 1) {
              // Auto-select single organization
              activeOrgId = orgsList[0].id;
              activeRole = orgsList[0].role;
              if (selectedOrgId !== activeOrgId) {
                setSelectedOrgId(activeOrgId);
              }
            } else if (orgsList.length > 1) {
              // Multiple organizations - always show workspace selector unless they explicitly picked one in this React session state
              if (selectedOrgId && orgsList.some(o => o.id === selectedOrgId)) {
                const matchedOrg = orgsList.find(o => o.id === selectedOrgId);
                activeOrgId = matchedOrg!.id;
                activeRole = matchedOrg!.role;
              } else {
                // Enforce workspace selector on load, refresh, or missing selection
                setSelectedOrgId(null);
                setUser(registryData);
                setOrganization(null);
                setAuthLoading(false);
                setPageLoading(false);
                setIsAuthReady(true);
                return;
              }
            }

            if (activeOrgId) {
              // Sync / update associatedOrgs array in users/{uid} safely
              const currentAssociated = (registryData as any).associatedOrgs || [];
              let newAssociatedList = [...currentAssociated.filter((o: any) => o !== null)];

              // Ensure old organizationId is preserved in associatedOrgs
              if (registryData.organizationId) {
                const hasOldInAssociated = newAssociatedList.some((o: any) => 
                  typeof o === 'string' ? o === registryData.organizationId : (o && o.orgId === registryData.organizationId)
                );
                if (!hasOldInAssociated) {
                  newAssociatedList.push({
                    orgId: registryData.organizationId,
                    role: registryData.role || 'STAFF',
                    joinedAt: new Date().toISOString()
                  });
                }
              }

              // Ensure activeOrgId is preserved
              const hasActiveInAssociated = newAssociatedList.some((o: any) => 
                typeof o === 'string' ? o === activeOrgId : (o && o.orgId === activeOrgId)
              );
              if (!hasActiveInAssociated) {
                newAssociatedList.push({
                  orgId: activeOrgId,
                  role: activeRole,
                  joinedAt: new Date().toISOString()
                });
              }
              
              const syncFields: any = {};
              
              if (newAssociatedList.length !== currentAssociated.length) {
                syncFields.associatedOrgs = newAssociatedList;
              }
              
              if (registryData.organizationId !== activeOrgId || registryData.role !== activeRole) {
                syncFields.organizationId = activeOrgId;
                syncFields.role = activeRole;
              }
              
              if (Object.keys(syncFields).length > 0) {
                setDoc(doc(db, 'users', firebaseUser.uid), syncFields, { merge: true })
                  .catch(err => console.warn("Quietly skipped initial workspace context sync:", err));
              }

              const lastLoginTime = registryData.lastLogin ? new Date(registryData.lastLogin).getTime() : 0;
              const now = Date.now();
              if (now - lastLoginTime > 1000 * 60 * 5) { // 5 minutes throttle
                 setDoc(doc(db, 'users', firebaseUser.uid), { lastLogin: new Date().toISOString() }, { merge: true });
                 setDoc(doc(db, 'organizations', activeOrgId, 'users', firebaseUser.uid), { lastLogin: new Date().toISOString() }, { merge: true });
              }

              let orgReady = false;
              let userReady = false;

              const checkReady = (isOrg: boolean) => {
                if (isOrg) orgReady = true;
                else userReady = true;
                
                if (orgReady && userReady) {
                  setPageLoading(false);
                  setAuthLoading(false);
                  setIsAuthReady(true);
                }
              };

              // Handler to automatically clear session/states, notify user, and redirect
              const handleRevokedAccess = async (type: 'revoked' | 'deleted' | 'unauthorized' = 'revoked') => {
                console.log(`Access event (${type}) detected for organization:`, activeOrgId);
                
                // 1. Clear session storage
                sessionStorage.removeItem('vms_selected_org_id');
                const remainingOrgs = orgsList.filter(o => o.id !== activeOrgId);
                
                // 2. Clear from Firestore root associatedOrgs
                try {
                  const cleanedAssociated = ((registryData as any).associatedOrgs || []).filter((o: any) => {
                    const id = typeof o === 'string' ? o : o?.orgId;
                    return id !== activeOrgId;
                  });
                  const nextOrgId = remainingOrgs.length > 0 ? remainingOrgs[0].id : null;
                  const nextRole = remainingOrgs.length > 0 ? remainingOrgs[0].role : null;
                  await setDoc(doc(db, 'users', firebaseUser.uid), {
                    associatedOrgs: cleanedAssociated,
                    organizationId: nextOrgId,
                    role: nextRole
                  }, { merge: true });
                } catch (err) {
                  console.warn("Failed to update user doc after revocation:", err);
                }

                // 3. Unsubscribe listeners
                if (unsubscribeOrg) { unsubscribeOrg(); unsubscribeOrg = null; }
                if (unsubscribeNestedUser) { unsubscribeNestedUser(); unsubscribeNestedUser = null; }
                if (unsubscribeUser) { unsubscribeUser(); unsubscribeUser = null; }
                currentListeningOrgId = null;
                
                // 4. Update React States
                setOrganization(null);
                setAvailableOrgs(remainingOrgs);
                
                // If user has other active organizations, routing back to Workspace Selector quietly (no scary alert banner!)
                const totalCandidateOrgs = Math.max(orgsList.length, availableOrgs.length, candidateOrgIds.size);
                const hasSubstantialOrgs = totalCandidateOrgs > 1 || remainingOrgs.length > 0;
                if (hasSubstantialOrgs) {
                  console.log("Multi-org user, bypassing organization alert in favor of quiet selection screen.");
                  setSelectedOrgId(null);
                  setUser((prev) => prev ? { ...prev, organizationId: null } : null);
                  setPageLoading(false);
                  setAuthLoading(false);
                  setIsAuthReady(true);
                  return;
                }

                // If user still has valid membership but got transient permission/selection conflict error
                const isCurrentOrgValid = orgsList.some(o => o.id === activeOrgId);
                if (isCurrentOrgValid && type === 'unauthorized') {
                  console.warn("Transient session mismatch / conflict warning in active user workspace, returning to selector.");
                  setSelectedOrgId(null);
                  setUser((prev) => prev ? { ...prev, organizationId: null } : null);
                  setPageLoading(false);
                  setAuthLoading(false);
                  setIsAuthReady(true);
                  return;
                }

                let swalHtml = '';
                let swalTitle = 'Workspace Alert';
                let swalIcon: 'warning' | 'error' = 'error';

                if (type === 'revoked') {
                  swalTitle = 'Access Deactivated';
                  swalIcon = 'error';
                  swalHtml = `
                    <div class="space-y-4">
                      <div class="h-20 w-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-rose-100">
                        <svg class="h-10 w-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <h4 class="text-slate-900 font-bold text-lg leading-tight tracking-tight">Organization Access Restricted</h4>
                      <p class="text-slate-500 text-sm font-medium leading-relaxed">Your professional credentials or access privileges for this workspace have been deactivated or revoked by an administrator.</p>
                      <div class="pt-4 border-t border-slate-100">
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-relaxed">Please connect with your system owner or organization administrator to restore access.</p>
                      </div>
                    </div>
                  `;
                } else if (type === 'deleted') {
                  swalTitle = 'Workspace De-provisioned';
                  swalIcon = 'warning';
                  swalHtml = `
                    <div class="space-y-4">
                      <div class="h-20 w-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-amber-100">
                        <svg class="h-10 w-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </div>
                      <h4 class="text-slate-900 font-bold text-lg leading-tight tracking-tight">Workspace Offline</h4>
                      <p class="text-slate-500 text-sm font-medium leading-relaxed">The organization environment or template workspace has been de-provisioned, archived, or deleted by the primary administrative owner.</p>
                      <div class="pt-4 border-t border-slate-100">
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-relaxed">All active sessions connected to this workspace have been terminated.</p>
                      </div>
                    </div>
                  `;
                } else {
                  swalTitle = 'Unauthorized Session';
                  swalIcon = 'error';
                  swalHtml = `
                    <div class="space-y-4">
                      <div class="h-20 w-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-rose-100">
                        <svg class="h-10 w-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <h4 class="text-slate-900 font-bold text-lg leading-tight tracking-tight">Access Prohibited</h4>
                      <p class="text-slate-500 text-sm font-medium leading-relaxed">You do not have the required security credentials to view or read records inside this organization partition.</p>
                      <div class="pt-4 border-t border-slate-100">
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-relaxed">Security rules prohibit this action. Contact systems administration to check credentials.</p>
                      </div>
                    </div>
                  `;
                }

                await Swal.fire({
                  title: swalTitle,
                  html: swalHtml,
                  icon: swalIcon,
                  confirmButtonText: remainingOrgs.length > 0 ? 'Select Active Workspace' : 'Return to Login',
                  confirmButtonColor: '#0f172a',
                  customClass: {
                    popup: 'rounded-[2.5rem] p-12 shadow-2xl border border-slate-100',
                    confirmButton: 'rounded-xl px-8 py-3.5 font-bold text-sm tracking-wide transition-all'
                  }
                });

                if (remainingOrgs.length > 0) {
                  // Return to select from remaining organizations
                  setSelectedOrgId(null);
                  setUser((prev) => prev ? { ...prev, organizationId: null } : null);
                } else {
                  // Sign out completely to the login screen
                  setSelectedOrgId(null);
                  setUser(null);
                  await signOut(auth);
                }
                
                // 5. Finalize state
                setPageLoading(false);
                setAuthLoading(false);
                setIsAuthReady(true);
              };

              if (currentListeningOrgId !== activeOrgId) {
                if (unsubscribeOrg) { unsubscribeOrg(); unsubscribeOrg = null; }
                if (unsubscribeNestedUser) { unsubscribeNestedUser(); unsubscribeNestedUser = null; }
                currentListeningOrgId = activeOrgId;

                unsubscribeOrg = onSnapshot(doc(db, 'organizations', activeOrgId), (orgSnap) => {
                  if (orgSnap.exists()) {
                    const orgData = orgSnap.data() as Organization;
                    setOrganization({ id: orgSnap.id, ...orgData });
                    document.title = `${orgData.name} - VMS`;
                  } else {
                    handleRevokedAccess('deleted');
                    return;
                  }
                  checkReady(true);
                }, (error) => {
                  const isPermissionError = error?.code === 'permission-denied' || 
                                            error?.message?.toLowerCase().includes('permission') || 
                                            error?.message?.toLowerCase().includes('insufficient');
                  if (isPermissionError) {
                    handleRevokedAccess('unauthorized');
                    return;
                  }
                  handleFirestoreError(error, OperationType.GET, `organizations/${activeOrgId}`);
                  checkReady(true);
                });

                // Subscribe to the ORG-NESTED user profile (The "Truth")
                const nestedUserRef = doc(db, 'organizations', activeOrgId, 'users', firebaseUser.uid);
                unsubscribeNestedUser = onSnapshot(nestedUserRef, async (nestedSnap) => {
                  const defaultPrefs = { notifs: true, public: false, density: true };
                  if (nestedSnap.exists()) {
                    const data = nestedSnap.data() as User;
                    
                    // Check if this user has been marked as deleted within this organization's subcollection
                    if (data.deleted) {
                      handleRevokedAccess('revoked');
                      return;
                    }

                    setUser({ 
                      uid: nestedSnap.id,
                      ...data, 
                      organizationId: activeOrgId,
                      role: activeRole,
                      preferences: { ...defaultPrefs, ...data.preferences } 
                    });
                  } else {
                    // Provision the nested user document if accepting an active invitation
                    try {
                      const normalizedEmail = firebaseUser.email?.toLowerCase().trim() || registryData.email?.toLowerCase().trim() || '';
                      if (normalizedEmail) {
                        // Check if there is a pending invitation
                        const orgInviteRef = doc(db, 'organizations', activeOrgId, 'invitations', normalizedEmail);
                        const globalInviteRef = doc(db, 'invitations', normalizedEmail);
                        const [orgInviteSnap, globalInviteSnap] = await Promise.all([
                          getDoc(orgInviteRef),
                          getDoc(globalInviteRef)
                        ]);

                        let assignedRole: UserRole = activeRole || 'STAFF';
                        let hasInvite = false;

                        if (orgInviteSnap.exists()) {
                          assignedRole = orgInviteSnap.data().role || assignedRole;
                          hasInvite = true;
                        } else if (globalInviteSnap.exists() && globalInviteSnap.data().organizationId === activeOrgId) {
                          assignedRole = globalInviteSnap.data().role || assignedRole;
                          hasInvite = true;
                        }

                        // Create the nested user record
                        await setDoc(nestedUserRef, {
                          uid: firebaseUser.uid,
                          name: firebaseUser.displayName || registryData.name || 'Staff Member',
                          email: normalizedEmail,
                          role: assignedRole,
                          organizationId: activeOrgId,
                          createdAt: new Date().toISOString(),
                          lastLogin: new Date().toISOString()
                        });

                        // Log audit event
                        await addDoc(collection(db, 'organizations', activeOrgId, 'activityLogs'), {
                          userId: firebaseUser.uid,
                          organizationId: activeOrgId,
                          action: 'JOIN_ORGANIZATION',
                          details: `Accepted invitation and joined organization with role ${assignedRole}`,
                          timestamp: new Date().toISOString()
                        });

                        if (hasInvite) {
                          try {
                            const { deleteDoc } = await import('firebase/firestore');
                            await Promise.all([
                              deleteDoc(orgInviteRef),
                              deleteDoc(globalInviteRef)
                            ]);
                          } catch (cleanErr) {
                            console.warn('Asynchronous invitation cleanup omitted or failed:', cleanErr);
                          }
                        }
                      }
                    } catch (provErr) {
                      console.error('Failed to provision nested user document:', provErr);
                    }

                    setUser({ 
                      uid: firebaseUser.uid,
                      ...registryData, 
                      organizationId: activeOrgId,
                      role: activeRole,
                      preferences: { ...defaultPrefs, ...registryData.preferences } 
                    });
                  }
                  checkReady(false);
                }, (error) => {
                  const isPermissionError = error?.code === 'permission-denied' || 
                                            error?.message?.toLowerCase().includes('permission') || 
                                            error?.message?.toLowerCase().includes('insufficient');
                  if (isPermissionError) {
                    handleRevokedAccess('revoked');
                    return;
                  }
                  handleFirestoreError(error, OperationType.GET, `organizations/${activeOrgId}/users/${firebaseUser.uid}`);
                  checkReady(false);
                });
              } else {
                // Already listening correctly, bypass redundant subscription and resolve state loaders safely
                setPageLoading(false);
                setAuthLoading(false);
                setIsAuthReady(true);
              }
            } else {
              setUser(registryData);
              setOrganization(null);
              setAuthLoading(false);
              setPageLoading(false);
              setIsAuthReady(true);
            }
          } else {
            // Firebase user is authenticated, but no registry document exists yet in 'users' collection.
            // Do NOT set user to null, as this causes random redirects and auth screen conflicts!
            // Instead, set a temporary user state with their email/uid, allowing them to remain logged in.
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'Authenticating User',
              role: 'STAFF', // placeholder
              organizationId: null,
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString()
            });
            setAuthLoading(false);
            setPageLoading(false);
            setIsAuthReady(true);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          setAuthLoading(false);
          setPageLoading(false);
          setIsAuthReady(true);
        });
      } else {
        if (unsubscribeUser) { unsubscribeUser(); unsubscribeUser = null; }
        if (unsubscribeOrg) { unsubscribeOrg(); unsubscribeOrg = null; }
        if (unsubscribeNestedUser) { unsubscribeNestedUser(); unsubscribeNestedUser = null; }
        setUser(null);
        setOrganization(null);
        setVisitors([]);
        setAuthLoading(false);
        setPageLoading(false);
        setIsAuthReady(true);
        document.title = 'Visitor Management System';
        
        // Local persistence cleanup on session end
        sessionStorage.removeItem('vms_selected_org_id');
        setSelectedOrgId(null);
        setAvailableOrgs([]);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeOrg) unsubscribeOrg();
      if (unsubscribeNestedUser) unsubscribeNestedUser();
    };
  }, [selectedOrgId, addToast]);

  // Real-time Organization Listener
  useEffect(() => {
    const orgId = user?.organizationId;
    if (!orgId) {
        setOrganization(null);
        return;
    }

    const unsubscribe = onSnapshot(doc(db, 'organizations', orgId), async (orgSnap) => {
        if (orgSnap.exists()) {
            const orgData = orgSnap.data() as Organization;
            setOrganization({ id: orgSnap.id, ...orgData });
            
            if (orgData.kioskPin !== undefined) {
              setKioskPin(orgData.kioskPin);
            }
            
            // Auto-initialize missing settings
            if ((user?.role === 'ADMIN' || user?.role === 'MASTER_ADMIN') && (!orgData.visitPurposes || !orgData.visitorCategories || !orgData.donationOccasions || !orgData.eventOccasions)) {
              try {
                const orgRef = doc(db, 'organizations', orgId);
                await updateDoc(orgRef, {
                  visitPurposes: orgData.visitPurposes || PURPOSES,
                  visitorCategories: orgData.visitorCategories || TYPES,
                  donationOccasions: orgData.donationOccasions || DEFAULT_DONATION_OCCASIONS,
                  eventOccasions: orgData.eventOccasions || DEFAULT_EVENT_OCCASIONS
                });
              } catch (err) {
                console.error('Failed to initialize org defaults:', err);
              }
            }

            document.title = `${orgData.name} - VMS`;
        }
    }, (error) => handleFirestoreError(error, OperationType.GET, `organizations/${orgId}`));

    return () => unsubscribe();
  }, [user?.organizationId]);

  // Real-time Visitors & Profiles Listener
  useEffect(() => {
    const orgId = user?.organizationId;
    if (!orgId) {
        setVisitors([]);
        setProfiles([]);
        setVisits([]);
        return;
    }

    // Listen to Visits
    const visitsRef = collection(db, 'organizations', orgId, 'visits');
    const qVisits = query(visitsRef, orderBy('date', 'desc'));

    const unsubscribeVisits = onSnapshot(qVisits, (snapshot) => {
      const visitsData = snapshot.docs
        .map(doc => ({ ...doc.data() } as Visit))
        .filter(v => v.status !== 'DELETED');
      setVisits(visitsData);
      setIsFetching(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `organizations/${orgId}/visits`);
      setIsFetching(false);
    });

    // Listen to Profiles
    const profilesRef = collection(db, 'organizations', orgId, 'profiles');
    const unsubscribeProfiles = onSnapshot(profilesRef, (snapshot) => {
      const profilesData = snapshot.docs.map(doc => ({ ...doc.data() } as Profile));
      setProfiles(profilesData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `organizations/${orgId}/profiles`));

    // Listen to Donations
    const donationsRef = collection(db, 'organizations', orgId, 'donations');
    const unsubscribeDonations = onSnapshot(donationsRef, (snapshot) => {
      const donationsData = snapshot.docs
        .map(doc => ({ ...doc.data() } as Donation))
        .filter(d => !d.deleted);
      setDonations(donationsData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `organizations/${orgId}/donations`));

    return () => {
      unsubscribeVisits();
      unsubscribeProfiles();
      unsubscribeDonations();
    };
  }, [user?.organizationId]);

  // Combined Visitor view model logic omitted here as it's fine

  // Combine Visits and Profiles into "Visitor" view model
  useEffect(() => {
    // Sort visits by date decresing for the main list
    const combined = [...visits].sort((a,b) => new Date(b.date + ' ' + b.checkInTime).getTime() - new Date(a.date + ' ' + a.checkInTime).getTime()).map((visit, index) => {
      const profile = profiles.find(p => p.phone === visit.visitorPhone);
      const visitorVisits = visits.filter(v => v.visitorPhone === visit.visitorPhone);
      
      return {
        ...profile,
        ...visit,
        // For compatibility with the rest of the app that expects visitorId
        visitorId: visit.visitId,
        serialNumber: visit.serialNumber || (visits.length - index),
        name: visit.visitorName || profile?.name || 'Unknown',
        phone: visit.visitorPhone || profile?.phone || '',
        email: visit.visitorEmail || profile?.email || '',
        dob: visit.visitorDOB || profile?.dob || '',
        address: visit.visitorAddress || profile?.address || '',
        signature: visit.signature || profile?.signature || '',
        occasion: visit.occasion || '',
        category: visit.category || '',
        visitCount: visitorVisits.length
      } as Visitor;
    });
    setVisitors(combined);
  }, [visits, profiles]);

  // Real-time Organization Users & Invitations Listener (Hierarchical - Based on user?.organizationId)
  useEffect(() => {
    const orgId = user?.organizationId;
    if (!orgId || (user?.role !== 'ADMIN' && user?.role !== 'MASTER_ADMIN' && !isSuperAdmin)) return;

    // Listen to Users within Org
    const usersRef = collection(db, 'organizations', orgId, 'users');
    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ 
          uid: doc.id,
          organizationId: orgId,
          ...doc.data() 
        } as User))
        .filter(u => !u.deleted);
      setOrgUsers(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `organizations/${orgId}/users`));

    // Listen to Invitations within Org
    const invitesRef = collection(db, 'organizations', orgId, 'invitations');
    const unsubscribeInvites = onSnapshot(invitesRef, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ ...doc.data() } as any))
        .filter(i => !i.deleted);
      setOrgInvitations(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `organizations/${orgId}/invitations`));

    return () => {
      unsubscribeUsers();
      unsubscribeInvites();
    };
  }, [user?.organizationId, user?.role, isSuperAdmin]);

  // Real-time Notifications Listener (Hierarchical - Based on user?.organizationId)
  useEffect(() => {
    if (!user?.organizationId) return;

    const nRef = collection(db, 'organizations', user?.organizationId, 'notifications');
    const q = query(nRef, where('read', '==', false), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('App Notification Snapshot:', snapshot.size, 'unread notifications');
      const allData = snapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id } as Notification))
        .filter(n => !n.deleted);
      
      // Check for new notifications to trigger toast
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const newNotif = change.doc.data() as Notification;
          // Only toast if it's "fresh" (e.g., within last minute) to avoid toast blizzard on load
          const notifTime = new Date(newNotif.timestamp).getTime();
          if (Date.now() - notifTime < 60000 && !newNotif.read) {
            addToast(`Alert: ${newNotif.title}`, 'info');
          }
        }
      });

      // Filter only unread notifications as requested by user
      const unreadData = allData.filter(n => !n.read);
      setNotifications(unreadData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `organizations/${user?.organizationId}/notifications`));

    return () => unsubscribe();
  }, [user?.organizationId, addToast]);

  // Super Admin check removed

  // Background Checks: Waiting Period & Birthdays
  useEffect(() => {
    if (!user?.organizationId || visitors.length === 0) return;

    const checkInterval = setInterval(async () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      // 1. Check for long-waiting visitors (> 30 mins)
      visitors.forEach(v => {
        if (v.status === 'INSIDE' && v.checkInTime && v.date === todayStr) {
          // Parse time like "10:30 AM"
          const match = v.checkInTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (match) {
            let hours = parseInt(match[1]);
            const minutes = parseInt(match[2]);
            const ampm = match[3].toUpperCase();
            
            if (ampm === 'PM' && hours !== 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
            
            const checkInDate = new Date();
            checkInDate.setHours(hours, minutes, 0, 0);
            
            const diffMins = (now.getTime() - checkInDate.getTime()) / 60000;
            
            if (diffMins > 30) { 
               createNotification({
                 title: 'Long Stay Alert',
                 message: `${v.name} has been inside for more than 30 minutes.`,
                 type: 'WAITING',
                 relatedId: v.visitorId
               }, `WAITING-${v.visitorId}-${todayStr}`);
            }
          }
        }
      });

      // 2. Check for Birthdays Today
      if (isBirthdayTrackingEnabled) {
        visitors.forEach(v => {
          if (v.dob) {
            const dobParts = v.dob.split('-');
            if (dobParts.length === 3) {
              const birthMonth = parseInt(dobParts[1], 10) - 1;
              const birthDate = parseInt(dobParts[2], 10);
              if (birthMonth === now.getMonth() && birthDate === now.getDate()) {
                createNotification({
                  title: 'Birthday Reminder',
                  message: `Today is ${v.name}'s birthday!`,
                  type: 'BIRTHDAY',
                  relatedId: v.visitorId
                }, `BIRTHDAY-${v.visitorId}-${todayStr}`);
              }
            }
          }
        });
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [user?.organizationId, visitors, createNotification, isBirthdayTrackingEnabled]);

  // Hierarchical Data Migration (Runs Once for each Org)
  useEffect(() => {
    const runMigration = async () => {
      if (!user?.organizationId || !organization || organization.migratedToHierarchy || (user.role !== 'ADMIN' && user.role !== 'MASTER_ADMIN')) return;
      
      const orgId = user.organizationId;
      console.log(`Starting Data Migration for Org: ${orgId}`);
      
      try {
        // Step 1: Migrate Users to nested collection
        const oldUsersSnap = await getDocs(query(collection(db, 'users'), where('organizationId', '==', orgId)));
        for (const uDoc of oldUsersSnap.docs) {
          await setDoc(doc(db, 'organizations', orgId, 'users', uDoc.id), uDoc.data(), { merge: true });
        }

        // Step 2: Migrate Visitors to Visits
        const oldVisitorsSnap = await getDocs(query(collection(db, 'visitors'), where('organizationId', '==', orgId)));
        for (const vDoc of oldVisitorsSnap.docs) {
          const vData = { ...vDoc.data() };
          // Sanitize for migration
          Object.keys(vData).forEach(key => {
            if (vData[key] === undefined) vData[key] = '';
          });
          
          await setDoc(doc(db, 'organizations', orgId, 'visits', vDoc.id), vData, { merge: true });
          
          // Also create a profile for them
          if (vData.phone) {
             await setDoc(doc(db, 'organizations', orgId, 'profiles', vData.phone), {
                 name: vData.name,
                 phone: vData.phone,
                 email: vData.email || '',
                 dob: vData.dob || '',
                 address: vData.address || '',
                 signature: vData.signature || '',
                 organizationId: orgId,
                 updatedAt: new Date().toISOString(),
                 lastVisitId: vDoc.id
             }, { merge: true });
          }
        }

        // Step 3: Migrate Reviews
        const oldReviewsSnap = await getDocs(query(collection(db, 'reviews'), where('organizationId', '==', orgId)));
        for (const rDoc of oldReviewsSnap.docs) {
          await setDoc(doc(db, 'organizations', orgId, 'reviews', rDoc.id), rDoc.data(), { merge: true });
        }

        // Step 4: Migrate Activity Logs
        const oldLogsSnap = await getDocs(query(collection(db, 'activityLogs'), where('organizationId', '==', orgId)));
        for (const lDoc of oldLogsSnap.docs) {
          await setDoc(doc(db, 'organizations', orgId, 'activityLogs', lDoc.id), lDoc.data(), { merge: true });
        }

        // Step 5: Migrate Invitations
        const oldInvitesSnap = await getDocs(query(collection(db, 'invitations'), where('organizationId', '==', orgId)));
        for (const iDoc of oldInvitesSnap.docs) {
          await setDoc(doc(db, 'organizations', orgId, 'invitations', iDoc.id), iDoc.data(), { merge: true });
        }

        // Final Step: Mark migration as complete
        await updateDoc(doc(db, 'organizations', orgId), { migratedToHierarchy: true });
        console.log('Hierarchy Migration Complete.');
        addToast('Database upgraded to hierarchical structure', 'success');
      } catch (err) {
        console.error('Migration Engine Failure:', err);
      }
    };

    runMigration();
  }, [user?.organizationId, organization?.id, user?.role]);


  // Check for Access Revocation Notification
  useEffect(() => {
    if (!isAuthReady || !user || pageLoading || authLoading) return;
    
    const checkRevocationAndInvites = async () => {
      // 1. Check for Revocation
      if (user.revokedFrom && !user.organizationId) {
        // If they still have other active available organizations, bypass lockout and quietly clear flags
        const hasOtherOrgs = ((user as any).associatedOrgs && (user as any).associatedOrgs.length > 0) || (availableOrgs && availableOrgs.length > 0);
        if (hasOtherOrgs) {
          console.log("User was deactivated in one workspace but has other active workspaces. Quietly clearing revocation flags.");
          try {
            await updateDoc(doc(db, 'users', user.uid), {
              revokedFrom: deleteField(),
              revokedAt: deleteField()
            });
          } catch (e) { console.error("Quietly clearing revocation failed:", e); }
          return;
        }

        console.log('Revocation detected for user:', user.uid);
        const hasShown = sessionStorage.getItem(`revoked_shown_${user.uid}`);
        if (!hasShown) {
          sessionStorage.setItem(`revoked_shown_${user.uid}`, 'true');
          await Swal.fire({
            title: 'Access Revoked',
            html: `<div class="space-y-4">
              <div class="h-20 w-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-rose-100">
                 <div class="relative">
                    <svg class="h-10 w-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                 </div>
              </div>
              <div class="space-y-2">
                <h4 class="text-slate-900 font-bold text-lg leading-tight tracking-tight">Organization Access Removed</h4>
                <p class="text-slate-500 text-sm font-medium leading-relaxed">Your professional credentials for <span class="text-indigo-600 font-bold px-1">${user.revokedFrom}</span> have been deactivated by the administrative authority.</p>
              </div>
              <div class="pt-6 border-t border-slate-100">
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-relaxed">Contact the organization owner or primary administrator for restoration requests.</p>
              </div>
            </div>`,
            showConfirmButton: true,
            confirmButtonText: 'Acknowledge',
            confirmButtonColor: '#0f172a',
            customClass: {
              container: 'z-[100000]',
              popup: 'rounded-[3rem] p-12 border-none shadow-2xl',
              confirmButton: 'rounded-2xl px-10 py-5 w-full uppercase font-black italic tracking-widest text-xs'
            },
            allowOutsideClick: false,
            allowEscapeKey: false
          });
          
          try {
            await updateDoc(doc(db, 'users', user.uid), {
              revokedFrom: deleteField(),
              revokedAt: deleteField()
            });
          } catch (e) { console.error("Cleanup failed:", e); }
        }
      }

      // 2. Background Invite Check for all users
      if (user && user.email) {
        console.log('Performing background invite check for:', user.email);
        const normalizedEmail = user.email.toLowerCase().trim();
        const inviteRef = doc(db, 'invitations', normalizedEmail);
        const inviteSnap = await getDoc(inviteRef);

        if (inviteSnap.exists()) {
          const inviteData = inviteSnap.data();
          const orgId = inviteData.organizationId;
          const role = inviteData.role || 'STAFF';

          if (orgId) {
            const currentAssociated = (user as any).associatedOrgs || [];
            const isOrgIdMatch = user.organizationId === orgId;
            const isAlreadyLinked = currentAssociated.some((o: any) => 
              typeof o === 'string' ? o === orgId : o?.orgId === orgId
            );

            if (isOrgIdMatch || isAlreadyLinked) {
              console.log('User is already member of invited org. Cleaning up obsolete invitation.');
              try {
                await deleteDoc(inviteRef);
                await deleteDoc(doc(db, 'organizations', orgId, 'invitations', normalizedEmail));
              } catch (e) { console.warn('Obsolete invite cleanup failed', e); }
              return;
            }

            if (!user.organizationId) {
              // User has no workspace yet - auto accept!
              await Swal.fire({
                title: 'New Invitation Found',
                text: `You have been added to a new organization. Refreshing your workspace...`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
                customClass: { popup: 'rounded-3xl' }
              });

              // Sync locally and globally
              await updateDoc(doc(db, 'users', user.uid), {
                organizationId: orgId,
                role: role
              });

              // Cleanup
              try {
                await deleteDoc(inviteRef);
                await deleteDoc(doc(db, 'organizations', orgId, 'invitations', normalizedEmail));
              } catch (e) { console.warn('Invite cleanup failed', e); }
            } else {
              // User has a primary workspace - prompt to add as an additional workspace!
              const orgSnap = await getDoc(doc(db, 'organizations', orgId));
              const orgName = orgSnap.exists() ? (orgSnap.data()?.name || 'New Organization') : 'New Organization';

              const { isConfirmed } = await Swal.fire({
                title: 'Workspace Invitation',
                text: `You have been invited to join "${orgName}". This will be added directly to your workspace options. Join workspace?`,
                icon: 'info',
                showCancelButton: true,
                confirmButtonColor: '#2563EB',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Accept & Add Workspace',
                cancelButtonText: 'Ignore',
                customClass: { popup: 'rounded-3xl' }
              });

              if (isConfirmed) {
                const updatedAssociated = [...currentAssociated];
                
                // Add new org
                updatedAssociated.push({
                  orgId: orgId,
                  role: role,
                  joinedAt: new Date().toISOString()
                });

                // Ensure current primary org is also preserved in associated list
                const hasPrimary = updatedAssociated.some((o: any) => 
                  typeof o === 'string' ? o === user.organizationId : o?.orgId === user.organizationId
                );
                if (!hasPrimary && user.organizationId) {
                  updatedAssociated.push({
                    orgId: user.organizationId,
                    role: user.role || 'STAFF',
                    joinedAt: new Date().toISOString()
                  });
                }

                // 1. Update user profile with new workspace associations
                await updateDoc(doc(db, 'users', user.uid), {
                  associatedOrgs: updatedAssociated
                });

                // 2. Create membership inside organization users subcollection
                await setDoc(doc(db, 'organizations', orgId, 'users', user.uid), {
                  uid: user.uid,
                  email: user.email,
                  name: user.name || 'Workspace User',
                  role: role,
                  organizationId: orgId,
                  lastLogin: new Date().toISOString()
                });

                // 3. Cleanup invitations
                try {
                  await deleteDoc(inviteRef);
                  await deleteDoc(doc(db, 'organizations', orgId, 'invitations', normalizedEmail));
                } catch (e) { console.warn('Invite cleanup failed', e); }

                // 4. Alert success & redirect to selector
                await Swal.fire({
                  title: 'Workspace Linked!',
                  text: `Successfully added and linked "${orgName}". Opening workspace selector...`,
                  icon: 'success',
                  timer: 2000,
                  showConfirmButton: false,
                  customClass: { popup: 'rounded-3xl' }
                });

                sessionStorage.removeItem('vms_selected_org_id');
                setSelectedOrgId(null);
                setOrganization(null);
              }
            }
          }
        }
      }
    };
    
    checkRevocationAndInvites();
  }, [user?.uid, user?.revokedFrom, user?.organizationId, isAuthReady, user?.email, availableOrgs]);

  // Screen Saver Logic
  useEffect(() => {
    if (!isKioskMode) return;
    const interval = setInterval(() => {
      // 2 minutes of inactivity triggers screen saver
      if (Date.now() - lastActivity > 120000 && !isKioskFormOpen && !isScreenSaver) {
        setIsScreenSaver(true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isKioskMode, lastActivity, isKioskFormOpen, isScreenSaver]);

  const resetIdle = () => {
    setLastActivity(Date.now());
    if (isScreenSaver) setIsScreenSaver(false);
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('vms_theme', theme);
  }, [theme]);




  // Fetch visitors from Firestore (already handled by real-time listener in useEffect)
  const fetchVisitors = async (silent = false) => {
    // This is now redundant but kept as a no-op to avoid breaking dependencies
    console.log("fetchVisitors is handled by Firestore real-time listener.");
  };

  useEffect(() => {
    // Sync local emergency entries
    const syncLocalEntries = async () => {
      const localEntries = JSON.parse(localStorage.getItem('vms_emergency_entries') || '[]');
      if (localEntries.length > 0) {
        console.log(`Syncing ${localEntries.length} local emergency entries...`);
        for (const entry of localEntries) {
          try {
            await fetch('/api/visitors', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(entry),
            });
          } catch (e) {
            console.error('Sync failed for entry:', entry.visitorId);
          }
        }
        localStorage.removeItem('vms_emergency_entries');
        fetchVisitors();
      }
    };
    syncLocalEntries();
  }, []);

  const handleSwitchWorkspace = async () => {
    if (availableOrgs.length <= 1) {
      addToast('No other workspace associations found for your profile', 'info');
      return;
    }
    const { isConfirmed } = await Swal.fire({
      title: 'Switch Workspace',
      text: 'Are you sure you want to transition out of your active workspace and choose another?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563EB',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Switch',
      cancelButtonText: 'Stay Here',
      customClass: {
        container: 'z-[10000]',
        popup: 'rounded-[1.5rem] border-none shadow-2xl p-4',
        title: 'text-xl font-bold text-slate-900',
        htmlContainer: 'text-slate-500 font-medium',
        confirmButton: 'px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-sm',
        cancelButton: 'px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-sm'
      }
    });

    if (isConfirmed) {
      sessionStorage.removeItem('vms_selected_org_id');
      setSelectedOrgId(null);
      setOrganization(null);
      addToast('Opening Workspace Selector...', 'info');
    }
  };

  const handleLogout = async () => {
    const { isConfirmed } = await Swal.fire({
      title: 'Sign Out',
      text: 'Are you sure you want to sign out of the workspace?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563EB',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sign Out',
      cancelButtonText: 'Stay',
      customClass: {
        container: 'z-[10000]',
        popup: 'rounded-[1.5rem] border-none shadow-2xl p-4',
        title: 'text-xl font-bold text-slate-900',
        htmlContainer: 'text-slate-500 font-medium',
        confirmButton: 'px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-sm',
        cancelButton: 'px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-sm'
      }
    });

    if (isConfirmed) {
      try {
        await logActivity('LOGOUT', `User ${user?.name} signed out`);
        sessionStorage.removeItem('vms_selected_org_id');
        sessionStorage.removeItem('vms_fresh_login');
        setSelectedOrgId(null);
        await signOut(auth);
        setUser(null);
        setOrganization(null);
        addToast('Signed out successfully', 'info');
      } catch (error) {
        addToast('Failed to sign out', 'error');
      }
    }
  };

  const handleRemoveMember = async (targetUser: User) => {
    const currentUserId = auth.currentUser?.uid;
    if (targetUser.uid === currentUserId) {
      addToast('Security Restriction: You cannot remove your own access identifier', 'error');
      return;
    }

    const isTargetCreator = organization?.createdBy === targetUser.uid;
    const isViewerCreator = organization?.createdBy === currentUserId;
    const isTargetMaster = targetUser.role === 'MASTER_ADMIN';
    const isViewerMaster = user?.role === 'MASTER_ADMIN' || isViewerCreator;

    if (isTargetCreator || isTargetMaster) {
      addToast('Immutable Authority: The Primary Authority cannot be removed', 'error');
      return;
    }

    if (!isViewerMaster && targetUser.role === 'ADMIN') {
      addToast('Access Denied: Administrative accounts can only be revoked by the Primary Authority', 'error');
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: 'Remove Team Member?',
      text: `Are you sure you want to remove ${targetUser.name} from the workspace? They will lose all access immediately.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Remove Access',
      cancelButtonText: 'Cancel',
      customClass: {
        container: 'z-[10000]',
        popup: 'rounded-[2rem]'
      }
    });

    if (isConfirmed) {
      try {
        const orgId = user!.organizationId;
        
        // 1. Clear registry entry (maps UID to org) - only if they exist in global users
        try {
          await updateDoc(doc(db, 'users', targetUser.uid), {
            organizationId: null,
            role: 'STAFF',
            revokedFrom: organization?.name || 'an organization',
            revokedAt: new Date().toISOString()
          });
        } catch (e) {
          console.log('User root doc might not exist yet (invited but not logged in), skipping global update');
        }

        // 2. Clear org profile by marking as deleted
        if (orgId) {
          await updateDoc(doc(db, 'organizations', orgId, 'users', targetUser.uid), {
            deleted: true,
            deletedAt: new Date().toISOString(),
            deletedBy: user?.uid
          });
        }

        addToast(`${targetUser.name} removed from workspace successfully`, 'success');
        logActivity('REMOVE_MEMBER', `Removed user ${targetUser.name} from organization`);
      } catch (error: any) {
        addToast(error.message || 'Failed to remove member', 'error');
      }
    }
  };

  const handleCancelInvitation = async (email: string) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Revoke Access Request?',
      text: `Withdraw the pending authorization for ${email}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Cancel Invitation',
      customClass: {
        container: 'z-[10000]',
        popup: 'rounded-[1.5rem]'
      }
    });

    if (isConfirmed) {
      try {
        const orgId = user?.organizationId;
        if (!orgId) throw new Error('Organization context not found');

        await updateDoc(doc(db, 'invitations', email), {
          deleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy: user?.uid
        });
        await updateDoc(doc(db, 'organizations', orgId, 'invitations', email), {
          deleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy: user?.uid
        });
        addToast('Authorization withdrawn', 'info');
      } catch (error: any) {
        addToast(error.message, 'error');
      }
    }
  };

  const handleToggleUserRole = async (targetUser: User) => {
    const currentUserId = auth.currentUser?.uid;
    if (targetUser.uid === currentUserId) {
      addToast('Security Restriction: You cannot modify your own Authorization Level', 'error');
      return;
    }

    const isTargetCreator = organization?.createdBy === targetUser.uid;
    const isViewerCreator = organization?.createdBy === currentUserId;
    const isTargetMaster = targetUser.role === 'MASTER_ADMIN';
    const isViewerMaster = user?.role === 'MASTER_ADMIN' || isViewerCreator;

    // 1. Immutable Authority Check
    if (isTargetCreator || isTargetMaster) {
      addToast('Cannot modify roles for the Primary Authority (Master Admin)', 'error');
      return;
    }

    // 2. Hierarchy Check: Only the Primary Authority (Creator/Master) can manage other Admins
    if (!isViewerMaster && targetUser.role === 'ADMIN') {
      addToast('Access Denied: Only the Primary Authority can manage Administrative permissions', 'error');
      return;
    }

    const { value: newRole } = await Swal.fire({
      title: 'Modify Permissions',
      text: `Select system access level for ${targetUser.name}`,
      input: 'select',
      inputOptions: {
        'STAFF': 'Staff (Restricted access to entries)',
        'ADMIN': 'Admin (Full operational control)'
      },
      inputValue: targetUser.role === 'ADMIN' ? 'ADMIN' : 'STAFF',
      showCancelButton: true,
      confirmButtonColor: '#2563EB',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Apply Changes',
      customClass: {
        container: 'z-[10000]',
        popup: 'rounded-[1.5rem]'
      },
      inputValidator: (value) => {
        if (!value) return 'A role must be selected';
      }
    });

    if (newRole) {
      try {
        const orgId = user?.organizationId || targetUser.organizationId || organization?.id;
        if (!orgId) {
          console.error('Role Update Failed: Org Context Missing', { userOrgId: user?.organizationId, targetUserOrgId: targetUser.organizationId, stateOrgId: organization?.id });
          throw new Error('Organization context not resolved. Please refresh and try again.');
        }

        addToast('Updating security matrix...', 'info');

        // 1. Update Subcollection record
        const nestedUserRef = doc(db, 'organizations', orgId, 'users', targetUser.uid);
        await updateDoc(nestedUserRef, {
          role: newRole,
          updatedAt: new Date().toISOString()
        });

        // 2. Update Global Registry record
        try {
          const globalUserRef = doc(db, 'users', targetUser.uid);
          await updateDoc(globalUserRef, {
            role: newRole,
            updatedAt: new Date().toISOString()
          });
        } catch (e) {
          console.warn('Global registry update sync failed - subcollection remains source of truth');
        }

        await logActivity('ROLE_CHANGE', `Permissions updated for ${targetUser.name}: Now ${newRole}`);
        addToast(`Permissions updated: ${targetUser.name} is now a ${newRole}`, 'success');
      } catch (error: any) {
        console.error('Role Update Execution Error:', error);
        const detailedError = error.code === 'permission-denied' 
          ? 'Security Policy Restriction: You do not have sufficient authority to modify this role.'
          : error.message;
        addToast(detailedError, 'error');
      }
    }
  };

  const handleInviteUser = async () => {
    const orgId = user?.organizationId || organization?.id;
    const isMultiOrg = availableOrgs.length > 1;
    
    const orgOptionsHtml = availableOrgs.map(org => 
      `<option value="${org.id}" ${org.id === orgId ? 'selected' : ''}>${org.name}</option>`
    ).join('');

    const { value: formValues } = await Swal.fire({
      title: 'Grant System Access',
      html: `
        <div class="space-y-4 text-left px-2">
          <p class="text-xs text-slate-500 font-medium leading-relaxed mb-4">
            Authorized users can log in directly with their email. No invitation link is required.
          </p>
          <div>
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email Address</label>
            <input id="invite-email" type="email" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-brand-blue outline-none transition-all font-bold text-slate-900" placeholder="user@example.com">
          </div>
          <div>
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Authorization Role</label>
            <select id="invite-role" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-brand-blue outline-none transition-all font-bold text-slate-900">
              <option value="STAFF">Staff (Limited Access)</option>
              <option value="ADMIN">Admin (Full Control)</option>
            </select>
          </div>
          ${isMultiOrg ? `
          <div>
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Target Organization</label>
            <select id="invite-org" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-brand-blue outline-none transition-all font-bold text-slate-900">
              ${orgOptionsHtml}
            </select>
          </div>
          ` : ''}
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: '#2563EB',
      confirmButtonText: 'Authorize Email',
      preConfirm: () => {
        const email = (document.getElementById('invite-email') as HTMLInputElement).value;
        const role = (document.getElementById('invite-role') as HTMLSelectElement).value;
        const selectedOrg = isMultiOrg 
          ? (document.getElementById('invite-org') as HTMLSelectElement).value 
          : orgId;
        if (!email) {
          Swal.showValidationMessage('Email is required');
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          Swal.showValidationMessage('Invalid email format');
          return false;
        }
        if (!selectedOrg) {
          Swal.showValidationMessage('Target organization is required');
          return false;
        }
        return { email: email.toLowerCase().trim(), role, selectedOrg };
      },
      customClass: {
        container: 'z-[10000]',
        popup: 'rounded-[2rem] p-4 sm:p-8',
        title: 'text-2xl font-black text-slate-900 tracking-tight mb-4',
        confirmButton: 'px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs',
        cancelButton: 'px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs'
      }
    });

    if (formValues) {
      setIsSaving(true);
      try {
        const targetOrgId = formValues.selectedOrg;
        const invitationData = {
          email: formValues.email,
          role: formValues.role,
          organizationId: targetOrgId,
          invitedBy: user?.uid,
          createdAt: new Date().toISOString()
        };

        // 1. Root Invitations (Global Registry)
        await setDoc(doc(db, 'invitations', formValues.email), invitationData);
        
        // 2. Org-nested Invitations (for UI listing)
        await setDoc(doc(db, 'organizations', targetOrgId, 'invitations', formValues.email), invitationData);

        await logActivity('AUTHORIZE_USER', `Granted access to ${formValues.email} as ${formValues.role} for organization ${targetOrgId}`);
        addToast(`Access granted for ${formValues.email}`, 'success');
      } catch (error: any) {
        addToast(error.message, 'error');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleUpdateBranding = async () => {
    if (!organization) return;
    try {
      const orgRef = doc(db, 'organizations', organization.id);
      const updateData = sanitizeForFirestore({
        name: organization.name || 'Visitor Management System',
        brandColor: organization.brandColor || '#2563EB',
        logoUrl: organization.logoUrl || null,
        googleReviewUrl: organization.googleReviewUrl || null,
        updatedAt: new Date().toISOString()
      });
      
      await updateDoc(orgRef, updateData);
      addToast('Branding updated successfully', 'success');
    } catch (error: any) {
      console.error('Branding Update Error:', error);
      addToast(error.message || 'Failed to update branding', 'error');
    }
  };

  const handleWhatsAppSent = async (visitorId: string) => {
    const orgId = user?.organizationId || activeOrgId;
    if (!orgId) return;
    try {
      await updateDoc(doc(db, 'organizations', orgId, 'visits', visitorId), {
        whatsappStatus: 'SENT',
        whatsappSentAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to update WhatsApp status', err);
    }
  };

  const deleteVisitor = async (visitorId: string) => {
    const orgId = user?.organizationId;
    if (user?.role !== 'ADMIN' && user?.role !== 'MASTER_ADMIN') {
      addToast('Only admins can delete records', 'error');
      return;
    }

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2563EB',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

      if (result.isConfirmed) {
      try {
        if (!orgId) return;

        // Soft delete from Firestore (Keep record but mark as hidden)
        await updateDoc(doc(db, 'organizations', orgId, 'visits', visitorId), {
          status: 'DELETED',
          deletedAt: new Date().toISOString(),
          deletedBy: user?.uid
        });

        // Sync to backend
        try {
          await fetch(`/api/visitors/${visitorId}`, { 
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'DELETED' })
          });
        } catch (apiErr) {
          console.error('Failed to sync deletion to backend:', apiErr);
        }

        await logActivity('DELETE_VISITOR', `Deleted visitor record ID: ${visitorId}`);
        Swal.fire(
          'Deleted!',
          'Visitor record has been deleted.',
          'success'
        );
      } catch (error) {
        console.error('Failed to delete visitor:', error);
        addToast('Failed to delete record', 'error');
      }
    }
  };

  const handleBulkCheckOut = async (visitorIds: string[]) => {
    const orgId = user?.organizationId;
    if (!orgId) return;
    try {
      const checkOutTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const promises = visitorIds.map(id => 
        updateDoc(doc(db, 'organizations', orgId, 'visits', id), {
          status: 'CHECKED OUT',
          checkOutTime,
          updatedAt: new Date().toISOString()
        })
      );
      await Promise.all(promises);
      await logActivity('BULK_CHECK_OUT', `Checked out ${visitorIds.length} visitors`);
      addToast(`Successfully checked out ${visitorIds.length} visitors`, 'success');
    } catch (error) {
      console.error('Failed bulk check-out:', error);
      addToast('Failed to complete bulk check-out', 'error');
    }
  };

  const handleBulkDelete = async (visitorIds: string[]) => {
    const orgId = user?.organizationId;
    if (!orgId) return;
    if (user?.role !== 'ADMIN' && user?.role !== 'MASTER_ADMIN') {
      addToast('Only admins can delete records', 'error');
      return;
    }
    try {
      const promises = visitorIds.map(id => 
        updateDoc(doc(db, 'organizations', orgId, 'visits', id), {
          status: 'DELETED',
          deletedAt: new Date().toISOString(),
          deletedBy: user?.uid
        })
      );
      await Promise.all(promises);
      
      // Async backend sync
      for (const id of visitorIds) {
        try {
          await fetch(`/api/visitors/${id}`, { 
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'DELETED' })
          });
        } catch (e) { console.error('Bulk delete sync failed for', id); }
      }

      await logActivity('BULK_DELETE', `Soft deleted ${visitorIds.length} visitor records`);
      addToast(`Successfully deleted ${visitorIds.length} records`, 'info');
    } catch (error) {
      console.error('Failed bulk delete:', error);
      addToast('Failed to complete bulk delete', 'error');
    }
  };

  const handleUpdateOrganization = async (data: any) => {
    const orgId = user?.organizationId;
    if (!orgId) return;
    try {
      const sanitizedData = sanitizeForFirestore(data);

      await updateDoc(doc(db, 'organizations', orgId), {
        ...sanitizedData,
        updatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      addToast(error.message, 'error');
    }
  };

  const handleAddDonationRecord = async (visitor: Visitor) => {
    // Auto-fill donor type
    const autoDonorType = visitor.visitCount && visitor.visitCount > 5 ? 'Frequent Donor' : 
                         visitor.visitCount && visitor.visitCount > 0 ? 'Returning Donor' : 'New Donor';

    const { value: formValues } = await Swal.fire({
      title: 'Professional Contribution Matrix',
      width: '900px',
      html: `
        <div class="space-y-8 text-left pt-2 pb-4">
          <!-- Donor Distinction Header -->
          <div class="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden mb-8 group">
            <div class="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
            <div class="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full -ml-16 -mb-16 blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
            
            <div class="relative z-10 flex items-center justify-between">
              <div class="flex items-center gap-6">
                <div class="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                  <span class="text-white font-black text-3xl">${(visitor.name || visitor.visitorName || 'V').charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-md">Distinguished Visitor</span>
                    <span class="text-slate-400 font-black text-[9px] uppercase tracking-widest">• Verified Profile</span>
                  </div>
                  <p class="text-2xl font-black text-white tracking-tight leading-none">${visitor.name || visitor.visitorName}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Reference Phone</p>
                <p class="text-lg font-black text-white font-mono">${visitor.phone || visitor.visitorPhone}</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
            <!-- Section 1: Financial & Logistics -->
            <div class="space-y-6">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-1 h-4 bg-emerald-500 rounded-full"></div>
                <h4 class="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Financial Configuration</h4>
              </div>

              <div class="space-y-4">
                <div>
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Donation Amount (₹) *</label>
                  <div class="relative group">
                    <span class="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black group-focus-within:text-brand-blue transition-colors">₹</span>
                    <input id="don-amount" type="number" class="w-full pl-10 pr-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 transition-all shadow-sm" placeholder="0.00">
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Type</label>
                    <select id="don-type" class="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-blue transition-all">
                      ${(organization?.donationTypes || DEFAULT_DONATION_TYPES).map(t => `<option value="${t}">${t}</option>`).join('')}
                    </select>
                  </div>
                  <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Status</label>
                    <select id="don-status" class="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-blue transition-all">
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="PENDING">Pending</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="REFUNDED">Refunded</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Payment Channel</label>
                  <select id="don-payment" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-blue shadow-sm">
                    ${(organization?.paymentModes || DEFAULT_PAYMENT_MODES).map(m => `<option value="${m}">${m}</option>`).join('')}
                  </select>
                </div>

                <div>
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Campaign Tagging</label>
                  <input id="don-campaign" type="text" placeholder="e.g. Winter Drive 2026" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-blue shadow-sm">
                </div>
              </div>
            </div>

            <!-- Section 2: Attribution & Special Support -->
            <div class="space-y-6">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-1 h-4 bg-amber-500 rounded-full"></div>
                <h4 class="text-[10px] font-black text-amber-600 uppercase tracking-widest">Attribution & Support</h4>
              </div>

              <div class="space-y-4">
                <div class="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div class="flex items-center gap-3">
                    <input type="checkbox" id="don-recurring" class="w-5 h-5 rounded border-slate-300 text-brand-blue focus:ring-brand-blue">
                    <label for="don-recurring" class="text-[11px] font-black text-slate-600 uppercase tracking-widest">Recurring Plan</label>
                  </div>
                  <select id="don-frequency" class="bg-transparent text-[11px] font-black text-brand-blue uppercase tracking-widest outline-none">
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>

                <div class="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-3">
                  <div class="flex items-center gap-3">
                    <input type="checkbox" id="don-inkind" class="w-5 h-5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500">
                    <label for="don-inkind" class="text-[11px] font-black text-emerald-700 uppercase tracking-widest">In-Kind Contribution</label>
                  </div>
                  <input id="don-items" type="text" placeholder="Books, clothes, supplies..." class="w-full px-4 py-3 bg-white border border-emerald-100 rounded-xl font-bold text-xs outline-none focus:border-emerald-500 transition-all shadow-sm">
                </div>

                <div>
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Target Occasion</label>
                  <input id="don-occasion" type="text" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-brand-blue transition-all" value="${visitor.occasion || ''}" placeholder="e.g. Anniversary">
                </div>

                <div>
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Occasion Date</label>
                  <input id="don-occasion-date" type="date" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-brand-blue transition-all">
                </div>

                <div>
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Reference Notes</label>
                  <textarea id="don-notes" class="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-xs h-24 outline-none focus:border-brand-blue shadow-sm" placeholder="Add context..."></textarea>
                </div>
              </div>
            </div>
          </div>
          
          <div class="pt-8 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
             <div class="flex items-center gap-4">
              <div class="p-3 bg-brand-blue/10 rounded-xl">
                <svg class="w-5 h-5 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div class="flex flex-col">
                <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Impact Date</label>
                <input id="don-date" type="date" class="bg-transparent font-black text-slate-900 outline-none focus:text-brand-blue cursor-pointer text-sm" value="${new Date().toISOString().split('T')[0]}">
              </div>
            </div>
            
            <div class="grow flex justify-end">
               <div class="flex items-center gap-4">
                  <div>
                    <label class="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-right">Receipt Style</label>
                    <select id="don-receipt" class="bg-slate-100 px-4 py-2 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest outline-none border border-slate-200">
                      <option value="Digital">Digital-Only</option>
                      <option value="Physical">Physical-Only</option>
                      <option value="Both">Unified (Both)</option>
                    </select>
                  </div>
                  <div class="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 shadow-sm self-end">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 12l2 2 4-4"/></svg>
                    <span class="text-[10px] font-black uppercase tracking-widest">Authorized Entry</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Authorize & Record Contribution',
      confirmButtonColor: '#2563EB',
      preConfirm: () => {
        const amount = (document.getElementById('don-amount') as HTMLInputElement).value;
        if (!amount || Number(amount) <= 0) {
          Swal.showValidationMessage('Financial Policy Violation: Amount required');
          return false;
        }
        return {
          visitorId: visitor.phone,
          visitorName: visitor.name,
          visitorPhone: visitor.phone,
          amount: Number(amount),
          type: (document.getElementById('don-type') as HTMLSelectElement).value,
          status: (document.getElementById('don-status') as HTMLSelectElement).value as any,
          paymentMode: (document.getElementById('don-payment') as HTMLSelectElement).value,
          receiptMode: (document.getElementById('don-receipt') as HTMLSelectElement).value as any,
          donorType: (document.getElementById('don-donor-type') as HTMLInputElement).value || autoDonorType,
          occasion: (document.getElementById('don-occasion') as HTMLInputElement).value,
          occasionDate: (document.getElementById('don-occasion-date') as HTMLInputElement).value,
          campaign: (document.getElementById('don-campaign') as HTMLInputElement).value,
          isRecurring: (document.getElementById('don-recurring') as HTMLInputElement).checked,
          frequency: (document.getElementById('don-frequency') as HTMLSelectElement).value as any,
          isInKind: (document.getElementById('don-inkind') as HTMLInputElement).checked,
          items: (document.getElementById('don-items') as HTMLInputElement).value,
          notes: (document.getElementById('don-notes') as HTMLTextAreaElement).value,
          date: (document.getElementById('don-date') as HTMLInputElement).value,
        }
      }
    });

    if (formValues) {
      const orgId = user?.organizationId;
      if (!orgId || !user) return;
      try {
        const donationId = `DON-${Date.now()}`;
        const newDonation: Donation = {
          ...formValues,
          id: donationId,
          organizationId: orgId,
          recordedBy: user.uid,
          recordedByName: user.name,
          timestamp: new Date().toISOString(),
          auditLog: [{
            action: 'CREATE',
            userId: user.uid,
            userName: user.name,
            timestamp: new Date().toISOString()
          }]
        };
        await setDoc(doc(db, 'organizations', orgId, 'donations', donationId), sanitizeForFirestore(newDonation));
        
        // Add general donation notification
        await createNotification({
          title: 'New Donation Captured',
          message: `${formValues.visitorName} contributed ₹${formValues.amount} via ${formValues.paymentMode}.`,
          type: 'DONATION',
          relatedId: donationId
        });
        
        // Trigger notification for occasion if date is set
        if (newDonation.occasionDate && newDonation.occasion) {
          const notificationId = `NOTIF-${Date.now()}`;
          await setDoc(doc(db, 'organizations', orgId, 'notifications', notificationId), sanitizeForFirestore({
            id: notificationId,
            organizationId: orgId,
            title: `Impact Occasion: ${newDonation.occasion}`,
            message: `A special occasion for ${newDonation.visitorName} is scheduled for ${newDonation.occasionDate}. Record this in your outreach calendar.`,
            type: newDonation.occasion.toUpperCase().includes('ANNIVERSARY') ? 'ANNIVERSARY' : 'OCCASION',
            read: false,
            timestamp: new Date().toISOString(),
            relatedId: newDonation.visitorPhone
          }));
        }
        
        fetch('/api/donations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newDonation)
        }).catch(err => console.error('Donation sync failed:', err));

        await logActivity('ADD_DONATION', `Captured ${newDonation.status} contribution of ₹${formValues.amount} from ${formValues.visitorName}`);
        addToast('Professional contribution saved to audit trail!', 'success');
      } catch (error: any) {
        addToast(error.message || 'Failed to capture contribution', 'error');
      }
    }
  };

  const handleEmergencyEntry = async (visitor: any) => {
    resetIdle();
    if (!organization?.id) {
      addToast('Organization context is missing. Try again.', 'error');
      return;
    }
    try {
      setIsSaving(true);
      const visitData = {
        ...visitor,
        visitId: visitor.visitorId, // Add this to match Firestore rules
        visitorName: visitor.name || 'Emergency Entry',
        visitorPhone: visitor.phone || `EMER-${Date.now()}`,
        organizationId: organization.id,
        recordedBy: user?.uid || 'EMERGENCY',
        recordedByName: visitor.recordedBy || user?.name || 'Emergency System',
        status: 'INSIDE',
        isEmergency: true,
        entryMethod: 'Emergency Mode',
        category: visitor.visitorType || visitor.category || 'Guest'
      };

      const visitRef = doc(db, 'organizations', organization.id, 'visits', visitor.visitorId);
      await setDoc(visitRef, sanitizeForFirestore(visitData));
      
      setIsSaving(false);
      Swal.fire({
        title: 'Check-in Successful',
        text: 'Emergency entry has been recorded. Thank you.',
        icon: 'success',
        timer: 3000,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#f8fafc',
        iconColor: '#10b981'
      });
    } catch (error) {
      console.error('Emergency entry error:', error);
      addToast('Critical: Failed to save emergency record', 'error');
      setIsSaving(false);
    }
  };

  const saveVisitor = async (data: any) => {
    const orgId = user?.organizationId;
    if (!orgId || !user) return;

    // Robust validation for phone number used in document references
    // Relaxed for emergency entries as per user request
    if (!data.isEmergency && (!data.phone || typeof data.phone !== 'string' || data.phone.trim() === '')) {
      console.error('Missing phone number in saveVisitor data:', data);
      addToast('A valid phone number is required to save the record.', 'error');
      return;
    }

    // Use a fallback for phone if missing (only allowed in emergency mode)
    const effectivePhone = (data.phone && data.phone.trim() !== '') ? data.phone.trim() : `EMER-${Date.now()}`;

    // Check for duplicate check-in (currently inside check)
    if (!editingVisitor) {
      const isAlreadyInside = visits.some(v => v.visitorPhone === data.phone && v.status === 'INSIDE');
      if (isAlreadyInside) {
        addToast(`${data.name} is already checked in and currently inside.`, 'error');
        return null;
      }
    }

    let savedVisitId = '';
    
    setIsSaving(true);
    try {
      if (editingVisitor) {
        savedVisitId = editingVisitor.visitId;
        if (!isOnline) {
          addToast('Updates are disabled while offline.', 'error');
          setIsSaving(false);
          return;
        }
        // Update specific visit record
        await updateDoc(doc(db, 'organizations', orgId, 'visits', editingVisitor.visitId), sanitizeForFirestore({
          visitorName: data.name,
          visitorPhone: effectivePhone,
          visitorEmail: data.email || '',
          visitorDOB: data.dob || '',
          visitorAddress: data.address || '',
          purpose: data.purpose,
          occasion: data.occasion || '',
          category: data.category || '',
          updatedAt: new Date().toISOString()
        }));

        // Update profile record - Use setDoc with merge to support phone number updates
        await setDoc(doc(db, 'organizations', orgId, 'profiles', effectivePhone), sanitizeForFirestore({
          phone: effectivePhone,
          name: data.name,
          email: data.email || '',
          dob: data.dob || '',
          address: data.address || '',
          organizationId: orgId,
          updatedAt: new Date().toISOString()
        }), { merge: true });
        
        // Sync to backend (API handles legacy routes for now or I'll update it later if needed)
        try {
          // Flatten data for backend sync
          const syncData = {
            ...data,
            visitorId: editingVisitor.visitId,
            visitId: editingVisitor.visitId
          };
          await fetch(`/api/visitors/${editingVisitor.visitId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(syncData)
          });
        } catch (apiErr) {
          console.error('Failed to sync update to backend:', apiErr);
        }

        await logActivity('UPDATE_VISITOR', `Updated visitor: ${data.name} (Visit: ${editingVisitor.visitId})`);
      } else {
        const visitId = `VIS-${Date.now()}`;
        savedVisitId = visitId;
        
        // 1. Prepare Profile
        const profileData: Profile = {
          phone: effectivePhone,
          name: data.name,
          email: data.email || '',
          dob: data.dob || '',
          address: data.address || '',
          signature: data.signature || '',
          organizationId: orgId,
          updatedAt: new Date().toISOString(),
          lastVisitId: visitId
        };

        // 2. Prepare Visit
        const visitData: Visit = {
          visitId,
          serialNumber: visits.length + 1,
          visitorPhone: effectivePhone,
          visitorName: data.name,
          visitorEmail: data.email || '',
          visitorDOB: data.dob || '',
          visitorAddress: data.address || '',
          purpose: data.purpose,
          occasion: data.occasion || '',
          category: data.category || '',
          status: 'INSIDE',
          date: data.date || new Date().toISOString().split('T')[0],
          checkInTime: data.checkInTime || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          organizationId: orgId,
          createdBy: user.uid,
          recordedBy: user.uid,
          recordedByName: user.name
        };

        if (!isOnline) {
          // Store Offline
          await savePendingProfile(profileData);
          await savePendingVisit(visitData);
          
          // Optimistic UI Update (add to local state if not already there)
          setProfiles(prev => [profileData, ...prev.filter(p => p.phone !== profileData.phone)]);
          setVisits(prev => [visitData, ...prev]);
          
          addToast('Saved offline. Data will sync when back online.', 'info');
        } else {
          // Standard Online Save
          await setDoc(doc(db, 'organizations', orgId, 'profiles', effectivePhone), sanitizeForFirestore(profileData));
          await setDoc(doc(db, 'organizations', orgId, 'visits', visitId), sanitizeForFirestore(visitData));

          // Create Notification for new visit
          await createNotification({
            title: data.isEmergency ? 'EMERGENCY ENTRY' : 'New Visitor Check-in',
            message: `${data.name} has checked in for ${data.purpose}.`,
            type: data.isEmergency ? 'SYSTEM' : 'WAITING',
            relatedId: visitId
          });

          // Sync to backend (Background)
          fetch('/api/visitors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...profileData, ...visitData, visitorId: visitId })
          }).catch(err => console.error('Background sync failed:', err));
        }

        logActivity('CREATE_VISITOR', `Check-in: ${data.name} (Visit: ${savedVisitId})`);
      }
      setEditingVisitor(null);
      setShowForm(false);
      
      if (isKioskMode) {
        setKioskSessionEntries(prev => [data, ...prev].slice(0, 5));
        
        // Show thank you immediately for better UX
        const showThankYou = () => {
          Swal.fire({
            title: kioskLang === 'EN' ? 'Thank You!' : 'धन्यवाद!',
            text: kioskLang === 'EN' ? `Your entry has been recorded, ${data.name}. Welcome to ${organization?.name || 'Visitor Management System'}.` : `आपकी प्रविष्टि दर्ज कर ली गई है, ${data.name}। ${organization?.name || 'Visitor Management System'} में आपका स्वागत है।`,
            icon: 'success',
            showConfirmButton: true,
            confirmButtonText: kioskLang === 'EN' ? 'Close' : 'बंद करें',
            showDenyButton: true,
            denyButtonText: kioskLang === 'EN' ? 'Digital Pass' : 'डिजिटल पास',
            confirmButtonColor: '#2563EB',
            denyButtonColor: '#0F172A',
            position: 'center',
            background: 'rgba(255, 255, 255, 0.95)',
            color: '#0f172a',
            backdrop: `rgba(0,0,123,0.1) backdrop-filter: blur(10px)`,
            customClass: {
              popup: 'rounded-[2.5rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.25)] border border-emerald-100',
              title: 'text-2xl font-black uppercase tracking-tight',
              confirmButton: 'px-8 py-3 rounded-2xl font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-transform active:scale-95 mx-2',
              denyButton: 'px-8 py-3 rounded-2xl font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-transform active:scale-95 mx-2',
              htmlContainer: 'text-lg font-bold text-slate-600'
            },
            showClass: {
              popup: 'animate__animated animate__zoomIn'
            },
            hideClass: {
              popup: 'animate__animated animate__zoomOut'
            }
          }).then((result) => {
            if (result.isDenied) {
              const passData: any = {
                visitorId: savedVisitId,
                visitId: savedVisitId,
                organizationId: orgId,
                status: 'INSIDE',
                name: data.name,
                visitorName: data.name,
                visitorPhone: data.phone ? `${data.countryCode || ''} ${data.phone}` : effectivePhone,
                phone: data.phone ? `${data.countryCode || ''} ${data.phone}` : effectivePhone,
                purpose: data.purpose,
                checkInTime: data.checkInTime || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                date: data.date || new Date().toISOString().split('T')[0]
              };
              setShowPassForVisitor(passData);
            }
          });
        };

        if (isOnline) {
          // Trigger saving in background but show success immediately if possible
          // Local resolution of setDoc is usually fast enough, but let's make it explicit
          showThankYou();
        } else {
          showThankYou();
        }
      } else {
        Toast.fire({ 
          icon: 'success', 
          title: 'Record Saved',
          text: 'The entry has been successfully recorded.',
          position: 'center'
        });
      }
    } catch (error: any) {
      console.error('Failed to save visitor:', error);
      addToast(error.message || 'Failed to save record', 'error');
    } finally {
      setIsSaving(false);
    }
  };



  const handleEdit = (visitor: Visitor) => {
    if (user?.role !== 'ADMIN' && user?.role !== 'MASTER_ADMIN') {
      addToast('Only Admins can edit records.', 'error');
      return;
    }
    setEditingVisitor(visitor);
    setShowForm(true);
  };


  const handleDeactivateOrganization = async () => {
    const orgId = user?.organizationId;
    if (!orgId || !organization) return;
    
    if (user?.role !== 'ADMIN' && user?.role !== 'MASTER_ADMIN') {
      addToast('Only admins can deactivate the organization', 'error');
      return;
    }

    const result = await Swal.fire({
      title: 'Deactivate Organization?',
      text: "This will disable all system features for your organization. All your data (visitors, logs, donations) will be safely stored in Firestore, but users won't be able to log in or use the kiosk. This action requires confirmation.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Yes, Deactivate',
      cancelButtonText: 'Keep it active'
    });

    if (result.isConfirmed) {
      try {
        setIsSaving(true);
        const orgRef = doc(db, 'organizations', orgId);
        await updateDoc(orgRef, {
          deactivated: true,
          deactivatedAt: new Date().toISOString(),
          deactivatedBy: user?.uid
        });
        
        await logActivity('DEACTIVATE_ORG', `Organization ${organization.name} has been deactivated.`);
        addToast('Organization deactivated successfully', 'success');
      } catch (err) {
        console.error('Failed to deactivate organization:', err);
        addToast('Failed to deactivate organization', 'error');
      } finally {
        setIsSaving(false);
      }
    }
  };


  const handleCloseForm = () => {
    setShowForm(false);
    setEditingVisitor(null);
  };

  const handleGeneratePass = (visitor: any) => {
    const passData: any = {
      visitorId: visitor.visitorId || visitor.visitId || visitor.id,
      visitId: visitor.visitId || visitor.visitorId || visitor.id,
      organizationId: visitor.organizationId || user?.organizationId,
      status: visitor.status || 'INSIDE',
      name: visitor.name || visitor.visitorName,
      visitorName: visitor.name || visitor.visitorName,
      visitorPhone: visitor.phone || visitor.visitorPhone,
      phone: visitor.phone || visitor.visitorPhone,
      purpose: visitor.purpose,
      checkInTime: visitor.checkInTime,
      category: visitor.category,
      date: visitor.date
    };
    setShowPassForVisitor(passData);
  };

  const handlePrintPass = (visitor: any) => {
    const passData: any = {
      ...visitor,
      visitorId: visitor.visitorId || visitor.visitId || visitor.id,
      visitId: visitor.visitId || visitor.visitorId || visitor.id,
      organizationId: visitor.organizationId || user?.organizationId,
      name: visitor.name || visitor.visitorName,
      visitorName: visitor.name || visitor.visitorName,
      category: visitor.category,
    };
    setShowPrintablePass(passData);
  };

  const handleBulkPrintPass = (selectedVisitors: any[]) => {
    const passesData = selectedVisitors.map(visitor => ({
      ...visitor,
      visitorId: visitor.visitorId || visitor.visitId || visitor.id,
      visitId: visitor.visitId || visitor.visitorId || visitor.id,
      organizationId: visitor.organizationId || user?.organizationId,
      name: visitor.name || visitor.visitorName,
      visitorName: visitor.name || visitor.visitorName,
      category: visitor.category,
    }));
    setShowPrintableBatchPass(passesData);
  };

  const handleScanCheckOut = async (passId: string) => {
    if (!organization?.id) return;
    const activeVisit = visitors.find(v => (v.visitorId === passId || v.preRegistrationId === passId) && v.status === 'INSIDE');
    if (activeVisit) {
      await checkOutVisitor(activeVisit.visitorId, false);
    } else {
       try {
         // Check if this pass corresponds to a pre-registration
         const preRegRef = doc(db, 'organizations', organization.id, 'preRegistrations', passId);
         const preRegSnap = await getDoc(preRegRef);
         if (preRegSnap.exists()) {
             const preRegData = { id: preRegSnap.id, ...preRegSnap.data() } as PreRegistration;
             if (preRegData.status === 'APPROVED' || preRegData.status === 'PENDING') {
               // Let's check them in immediately! Using empty/placeholder signature as digital QR scan is highly authenticated
               await handleKioskPreRegCheckIn(preRegData, "");
               return;
             } else if (preRegData.status === 'CHECKED_IN' || preRegData.status === 'COMPLETED') {
               const correlatedVisit = visitors.find(v => v.preRegistrationId === passId && v.status === 'INSIDE');
               if (correlatedVisit) {
                 await checkOutVisitor(correlatedVisit.visitorId, false);
                 return;
               }
             }
         } else {
             // Maybe it's a generic visit document ID that just wasn't in our active activeVisit filter
             const visitRef = doc(db, 'organizations', organization.id, 'visits', passId);
             const visitSnap = await getDoc(visitRef);
             if (visitSnap.exists() && visitSnap.data().status === 'INSIDE') {
                 await checkOutVisitor(passId, false);
                 return;
             }
         }
       } catch (err) {
         console.error('Error securely verifying pass status:', err);
       }

       Swal.fire({
          title: kioskLang === 'HI' ? 'नहीं मिला' : 'Not Found',
          text: kioskLang === 'HI' ? 'इस QR कोड के लिए कोई सक्रिय विज़िट नहीं मिली।' : 'No active visit found for this QR code.',
          icon: 'error',
          confirmButtonColor: '#ef4444',
       });
    }
  };

  const checkOutVisitor = async (visitorId: string, skipConfirm: boolean = false) => {
    const orgId = user?.organizationId || organization?.id;
    const visitor = visitors.find(v => v.visitorId === visitorId);
    
    if (!skipConfirm) {
      const result = await Swal.fire({
        title: 'Check Out Visitor?',
        text: `Mark ${visitor?.name || 'this visitor'} as checked out?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, Check Out',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000',
        customClass: {
          popup: 'rounded-3xl border-none shadow-2xl',
        }
      });

      if (!result.isConfirmed) return;
    }

    setIsCheckingOut(visitorId);
    setLoadingStates(prev => ({ ...prev, [visitorId]: true }));
    try {
      if (!orgId) return;
      
      const checkOutTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const visitorRef = doc(db, 'organizations', orgId, 'visits', visitorId);
      
      // Update in Firestore
      await updateDoc(visitorRef, {
        status: 'CHECKED OUT',
        checkOutTime,
        updatedAt: new Date().toISOString()
      });

      // Update pre-registration if linked
      if (visitor?.preRegistrationId) {
        try {
          await updateDoc(doc(db, 'organizations', orgId, 'preRegistrations', visitor.preRegistrationId), {
            status: 'COMPLETED',
            updatedAt: new Date().toISOString()
          });
        } catch (preRegErr) {
          console.error('Failed to update pre-registration on checkout:', preRegErr);
        }
      }

      // Sync to backend via API
      try {
        const visitor = visits.find(v => v.visitId === visitorId);
        await fetch(`/api/visitors/${visitorId}/checkout`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkOutTime, visitor, organizationId: orgId })
        });
      } catch (apiErr) {
        console.error('Failed to sync checkout to backend:', apiErr);
      }
      
      // Show success animation and pop-up toast notification
      Toast.fire({ icon: 'success', title: 'Checked Out! Please leave a review.' });
      addToast('Please tell us how your visit was in the review panel.', 'success');
      
      // Then show review modal in the center
      if (visitor) {
        setReviewVisitor({
          ...visitor,
          visitorId: visitorId,
          visitId: visitorId
        });
      }
    } catch (error) {
      console.error('Failed to check out visitor:', error);
      addToast('Failed to check out visitor', 'error');
    } finally {
      setIsCheckingOut(null);
      setLoadingStates(prev => ({ ...prev, [visitorId]: false }));
    }
  };

  const handleSaveReview = async (rating: number, comment: string) => {
    const orgId = user?.organizationId;
    if (!reviewVisitor || !orgId) return;
    setIsSavingReview(true);
    
    try {
      // 1. Resolve correct document ID
      // We prioritize visitId (Doc ID from Visits collection)
      const vid = reviewVisitor.visitId || reviewVisitor.visitorId || (reviewVisitor as any).id;
      if (!vid) throw new Error('Could not identify visit record');

      // 2. Try Backend API first (Admin power skips Firestore rules issues)
      let apiSuccess = false;
      try {
        const response = await fetch(`/api/visitors/${vid}/review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            organizationId: orgId,
            rating, 
            comment 
          })
        });
        if (response.ok) {
          apiSuccess = true;
        } else {
          const errData = await response.json();
          console.warn('Backend review API returned error:', errData);
        }
      } catch (apiErr) {
        console.error('Failed to sync review via API:', apiErr);
      }

      // 3. Update Firestore (Redundant but keeps UI reactive if rules allow)
      // We wrap this in its own try-catch so permission errors here don't block the whole flow if API worked
      try {
        const reviewId = `REV-${Date.now()}`;
        // Create standalone review
        await setDoc(doc(db, 'organizations', orgId, 'reviews', reviewId), sanitizeForFirestore({
          id: reviewId,
          rating,
          comment,
          visitorId: vid,
          visitorPhone: reviewVisitor.phone || reviewVisitor.visitorPhone,
          organizationId: orgId,
          timestamp: new Date().toISOString()
        }));

        // Update visit record
        await updateDoc(doc(db, 'organizations', orgId, 'visits', vid), {
          review: {
            rating,
            comment,
            timestamp: new Date().toISOString()
          }
        });
      } catch (dbErr: any) {
        console.warn('Firestore direct update failed (expected if permissions limited):', dbErr.message);
        // If API also failed and Firestore failed, then we show error
        if (!apiSuccess) {
          throw dbErr;
        }
      }

      await logActivity('SUBMIT_REVIEW', `Submitted review for visitor: ${reviewVisitor.name}`);
      
      // Create Notification (Kiosk/Staff only)
      try {
        await createNotification({
          title: 'New Review Submitted',
          message: `${reviewVisitor.name} left a ${rating}-star review.`,
          type: 'REVIEW',
          relatedId: vid
        });
      } catch (nErr) {
        console.warn('Notification creation failed:', nErr);
      }

      addToast('Thank you for your review!', 'success');
      setReviewVisitor(null);
    } catch (error: any) {
      console.error('Error saving review:', error);
      // More descriptive error for "Missing or insufficient permissions"
      if (error.message?.includes('permissions')) {
        addToast('Permission denied by security policy. Please contact admin.', 'error');
      } else {
        addToast(error.message || 'Failed to save review', 'error');
      }
    } finally {
      setIsSavingReview(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Sr No', 'Visitor ID', 'Name', 'Phone', 'Email', 'DOB', 'Purpose', 'Visitor Category', 'Date', 'Check-in', 'Check-out', 'Status'];
    // In records tab, we export all visitors to satisfy "all records" requirement
    const dataToExport = activeTab === 'records' ? visitors : filteredVisitors;
    const rows = dataToExport.map(v => [
      v.serialNumber,
      v.visitorId,
      v.name,
      v.phone,
      v.email,
      v.dob,
      v.purpose,
      v.category,
      v.date,
      v.checkInTime,
      v.checkOutTime || '',
      v.status
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const fileName = activeTab === 'records' ? 'all_visitor_records.csv' : `visitors_${selectedDate}.csv`;
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    // Simple HTML table to Excel trick
    const headers = ['Sr No', 'Visitor ID', 'Name', 'Phone', 'Email', 'DOB', 'Purpose', 'Visitor Category', 'Date', 'Check-in', 'Check-out', 'Status'];
    let html = '<table><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
    // In records tab, we export all visitors to satisfy "all records" requirement
    const dataToExport = activeTab === 'records' ? visitors : filteredVisitors;
    dataToExport.forEach(v => {
      html += `<tr>
        <td>${v.serialNumber}</td>
        <td>${v.visitorId}</td>
        <td>${v.name}</td>
        <td>${v.phone}</td>
        <td>${v.email}</td>
        <td>${v.dob}</td>
        <td>${v.purpose}</td>
        <td>${v.category}</td>
        <td>${v.date}</td>
        <td>${v.checkInTime}</td>
        <td>${v.checkOutTime || ''}</td>
        <td>${v.status}</td>
      </tr>`;
    });
    html += '</table>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const fileName = activeTab === 'records' ? 'all_visitor_records.xls' : `visitors_${selectedDate}.xls`;
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = useMemo(() => {
    const dayVisitors = visitors.filter(v => v.date === selectedDate);
    const allTimeVisitors = visitors;
    
    // Daily trend (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();
    
    const dailyTrend = last7Days.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      count: visitors.filter(v => v.date === date).length
    }));

    // Frequent visitors
    const visitorCounts = visitors.reduce((acc, v) => {
      acc[v.phone] = (acc[v.phone] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const frequentVisitors = Object.entries(visitorCounts)
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([phone, count]) => {
        const visitor = visitors.find(v => v.phone === phone);
        return { name: visitor?.name || 'Unknown', phone, count };
      });

    // Peak visiting time
    const hours = visitors
      .filter(v => v.checkInTime && typeof v.checkInTime === 'string')
      .map(v => parseInt(v.checkInTime.split(':')[0]));
    const hourCounts = hours.reduce((acc, h) => {
      acc[h] = (acc[h] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    let peakHour = 0;
    let maxCount = 0;
    Object.entries(hourCounts).forEach(([hour, count]) => {
      if (count > maxCount) {
        maxCount = count;
        peakHour = parseInt(hour);
      }
    });
    
    const peakTimeStr = maxCount > 0 ? `${peakHour > 12 ? peakHour - 12 : (peakHour === 0 ? 12 : peakHour)}:00 ${peakHour >= 12 ? 'PM' : 'AM'}` : 'N/A';

    // Calculate trends
    const currentBaseDate = new Date(selectedDate);
    const yesterday = new Date(currentBaseDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];
    const yesterdayVisitors = visitors.filter(v => v.date === yesterdayDate);
    
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const diff = ((current - previous) / previous) * 100;
      return `${diff >= 0 ? '↑' : '↓'} ${Math.abs(Math.round(diff))}% vs prev. day`;
    };

    return {
      today: {
        total: dayVisitors.length,
        donors: dayVisitors.filter(v => v.category === 'Donor').length,
        volunteers: dayVisitors.filter(v => v.category === 'Volunteer').length,
        guests: dayVisitors.filter(v => v.category === 'Guest').length,
        trend: calculateTrend(dayVisitors.length, yesterdayVisitors.length),
      },
      allTime: {
        total: allTimeVisitors.length,
        unique: new Set(allTimeVisitors.map(v => v.phone)).size,
        donors: allTimeVisitors.filter(v => v.category === 'Donor').length,
        volunteers: allTimeVisitors.filter(v => v.category === 'Volunteer').length,
        guests: allTimeVisitors.filter(v => v.category === 'Guest').length,
      },
      dailyTrend,
      frequentVisitors,
      peakTimeStr
    };
  }, [visitors, selectedDate]);

  const activeVisitors = useMemo(() => {
    return visitors.filter(v => v.status === 'INSIDE');
  }, [visitors]);

  const historicalVisitors = useMemo(() => {
    const searchLower = searchQuery.toLowerCase().trim();
    return visitors.filter(v => {
      const name = (v.name || '').toLowerCase();
      const visitorId = (v.visitorId || '').toLowerCase();
      const phone = (v.phone || '').replace(/\s/g, '');
      const email = (v.email || '').toLowerCase();
      const dob = (v.dob || '');

      const matchesSearch = !searchLower || 
                          name.includes(searchLower) ||
                          visitorId.includes(searchLower) ||
                          phone.includes(searchLower.replace(/\s/g, '')) ||
                          email.includes(searchLower) ||
                          dob.includes(searchLower);
      
      let matchesFilter = true;
      if (recordsFilter === 'today') {
        matchesFilter = v.date === new Date().toISOString().split('T')[0];
      } else if (recordsFilter === 'inside') {
        matchesFilter = v.status === 'INSIDE';
      } else if (recordsFilter === 'checked-out') {
        matchesFilter = v.status === 'CHECKED OUT';
      }

      return matchesSearch && matchesFilter;
    });
  }, [visitors, searchQuery, recordsFilter]);

  const filteredVisitors = useMemo(() => {
    const searchLower = searchQuery.toLowerCase().trim();
    return visitors.filter(v => {
      const matchesDate = v.date === selectedDate;
      const name = (v.name || '').toLowerCase();
      const visitorId = (v.visitorId || '').toLowerCase();
      const phone = (v.phone || '').replace(/\s/g, '');
      const email = (v.email || '').toLowerCase();
      const dob = (v.dob || '');

      const matchesSearch = !searchLower || 
                          name.includes(searchLower) ||
                          visitorId.includes(searchLower) ||
                          phone.includes(searchLower.replace(/\s/g, '')) ||
                          email.includes(searchLower) ||
                          dob.includes(searchLower);
      return matchesDate && matchesSearch;
    });
  }, [visitors, selectedDate, searchQuery]);

  const latestVisitors = useMemo(() => {
    return [...visitors].sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.checkInTime}`);
      const dateB = new Date(`${b.date} ${b.checkInTime}`);
      return dateB.getTime() - dateA.getTime();
    }).slice(dashboardPage * DASHBOARD_ITEMS_PER_PAGE, (dashboardPage + 1) * DASHBOARD_ITEMS_PER_PAGE);
  }, [visitors, dashboardPage]);

  useEffect(() => {
    if (organization?.brandColor) {
      document.documentElement.style.setProperty('--brand-color', organization.brandColor);
    } else {
      document.documentElement.style.removeProperty('--brand-color');
    }

    if (organization?.logoUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = organization.logoUrl;
    }
  }, [organization?.brandColor, organization?.logoUrl]);

  const todaysBirthdaysCount = useMemo(() => {
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();
    
    // Use a Set to count unique visitors with birthdays today by phone
    const birthdayPhones = new Set<string>();
    visitors.forEach(v => {
      if (v.dob && v.phone) {
        const dobParts = v.dob.split('-');
        if (dobParts.length === 3) {
          const birthMonth = parseInt(dobParts[1], 10) - 1;
          const birthDate = parseInt(dobParts[2], 10);
          if (birthMonth === todayMonth && birthDate === todayDate) {
            birthdayPhones.add(v.phone);
          }
        }
      }
    });
    return birthdayPhones.size;
  }, [visitors]);

  const handleExitKiosk = async () => {
    const { value: pin } = await Swal.fire({
      title: 'Exit Kiosk Mode',
      html: `
        <div class="mt-4 flex flex-col items-center gap-4">
          <div class="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
            <svg class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p class="text-sm text-gray-500 font-medium text-center px-4">Enter administrator PIN to transition back to the dashboard.</p>
        </div>
      `,
      input: 'password',
      inputAttributes: {
        maxlength: '4',
        autocapitalize: 'off',
        autocorrect: 'off'
      },
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      confirmButtonText: 'Exit to Dashboard',
      cancelButtonText: 'Stay in Kiosk',
      background: '#ffffff',
      customClass: {
        popup: 'rounded-3xl border-none shadow-2xl',
        input: '!text-center !text-2xl !tracking-[0.3em] !w-48 !mx-auto',
        confirmButton: 'rounded-xl px-10 py-3 font-bold uppercase tracking-widest text-xs',
        cancelButton: 'rounded-xl px-10 py-3 font-bold uppercase tracking-widest text-xs'
      },
      inputValidator: (value) => {
        if (!kioskPin) return null; // If no PIN for some reason, maybe allow or enforce? Assume kioskPin set if enforced elsewhere.
        if (!value) return 'PIN is required';
        if (value !== kioskPin) return 'Access Denied: Incorrect PIN';
        return null;
      }
    });

    if (pin || !kioskPin) {
      localStorage.setItem('vms_kiosk_mode', 'false');
      setIsKioskMode(false);
      setIsKioskFormOpen(false);
      setKioskSessionEntries([]);
      addToast('Exited Kiosk Mode', 'success');
    }
  };

  const handleCallStaff = async () => {
    try {
      await addDoc(collection(db, 'organizations', user?.organizationId || '', 'notifications'), {
          organizationId: user?.organizationId || '',
          title: 'Kiosk Assistance Required',
          message: 'A user is requesting assistance at the kiosk.',
          type: 'KIOSK_ASSISTANCE',
          read: false,
          timestamp: new Date().toISOString()
      });
      addToast(kioskLang === 'EN' ? 'Staff has been notified. Please wait.' : 'कर्मचारियों को सूचित कर दिया गया है। कृपया प्रतीक्षा करें।', 'success');
    } catch (err) {
      console.error('Failed to call staff:', err);
      addToast(kioskLang === 'EN' ? 'Failed to call staff' : 'कर्मचारियों को बुलाने में विफल', 'error');
    }
  };

  const handleEnterKiosk = async () => {
    if (!kioskPin) {
      addToast('Please set a Kiosk PIN in Settings before entering Kiosk Mode.', 'error');
      return;
    }
    
    const { value: pin } = await Swal.fire({
      title: 'Enter Kiosk PIN',
      input: 'password',
      inputPlaceholder: 'PIN',
      showCancelButton: true,
      confirmButtonText: 'Enter Kiosk',
      customClass: {
        input: '!text-center !text-2xl !tracking-[0.3em] !w-48 !mx-auto'
      },
      inputValidator: (value) => {
        if (!value) return 'PIN is required';
        if (value !== kioskPin) return 'Access Denied: Incorrect PIN';
        return null;
      }
    });
    if (!pin) return;
    
    localStorage.setItem('vms_kiosk_mode', 'true');
    setIsKioskMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    addToast('Kiosk Mode Activated', 'success');
  };

  if (showSplash || showLoader || pageLoading || authLoading || !isAuthReady) {
    return (
      <AnimatePresence mode="wait">
        {showSplash ? (
          <SplashScreen key="splash" organization={organization} />
        ) : showLoader ? (
          <LoaderScreen key="loader" progress={loadingProgress} />
        ) : (
          <DashboardSkeleton />
        )}
      </AnimatePresence>
    );
  }

  if (showPublicRegister) {
    return <PreRegistrationForm organizationId={showPublicRegister} />;
  }

  if (standalonePassData) {
    return (
      <div className="min-h-screen bg-slate-50">
        <VisitorPass 
          visitorId={standalonePassData.visitorId} 
          organizationId={standalonePassData.orgId} 
          standalone={true}
        />
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthComplete={() => {}} />;
  }

  if (user && availableOrgs.length > 1 && !selectedOrgId) {
    return (
      <WorkspaceSelector 
        orgs={availableOrgs} 
        onSelect={(orgId) => {
          sessionStorage.setItem('vms_selected_org_id', orgId);
          setSelectedOrgId(orgId);
        }}
        onLogout={async () => {
          sessionStorage.removeItem('vms_selected_org_id');
          sessionStorage.removeItem('vms_fresh_login');
          setSelectedOrgId(null);
          setAvailableOrgs([]);
          await signOut(auth);
          setUser(null);
          setOrganization(null);
        }}
      />
    );
  }

  if (user?.organizationId && !organization) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="fixed top-0 left-0 right-0 z-[100000]">
          <motion.div 
            className="h-1 bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.5)]"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="relative">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-slate-200/50 flex items-center justify-center mx-auto border border-slate-100">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-slate-900 font-extrabold uppercase tracking-[0.25em] text-[12px]">
              Workspace Recovery
            </h3>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest leading-relaxed">
              Fetching encrypted organizational data<span className="animate-pulse">...</span>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user?.organizationId && !isSuperAdminValue) {
    return <OrgSetup onComplete={(orgId) => {
        setPageLoading(false);
        setActiveOrgId(orgId);
    }} />;
  }

  const handleKioskCheckOut = async () => {
    resetIdle();
    const { value: phone } = await Swal.fire({
      title: kioskLang === 'EN' ? 'Check Out' : 'चेक आउट',
      text: kioskLang === 'EN' ? 'Enter your phone number to check out' : 'चेक आउट करने के लिए अपना फोन नंबर दर्ज करें',
      input: 'tel',
      inputPlaceholder: '9876543210',
      showCancelButton: true,
      confirmButtonColor: organization?.brandColor || '#2563EB',
      confirmButtonText: kioskLang === 'EN' ? 'Search' : 'खोजें',
      cancelButtonText: kioskLang === 'EN' ? 'Cancel' : 'रद्द करें',
      position: 'center',
      customClass: {
        popup: 'rounded-3xl border-none shadow-2xl',
        confirmButton: 'rounded-xl font-bold px-8 py-3',
        cancelButton: 'rounded-xl font-bold px-8 py-3',
        title: 'text-2xl font-black text-slate-900 mb-2 italic uppercase',
        htmlContainer: 'text-sm font-medium text-slate-500'
      }
    });

    if (phone) {
      const activeVisit = visitors.find(v => v.phone.includes(phone) && v.status === 'INSIDE');
      if (activeVisit) {
        const result = await Swal.fire({
          title: kioskLang === 'EN' ? `Check out ${activeVisit.name}?` : `${activeVisit.name} चेक आउट करें?`,
          text: kioskLang === 'EN' ? `Check-in time: ${activeVisit.checkInTime}` : `चेक-इन समय: ${activeVisit.checkInTime}`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#2563EB',
          confirmButtonText: kioskLang === 'EN' ? 'Yes, Check Out' : 'हाँ, चेक आउट करें',
          cancelButtonText: kioskLang === 'EN' ? 'No, Stay' : 'नहीं, रुकें',
          customClass: {
            popup: 'rounded-[3rem] p-12',
            confirmButton: 'rounded-2xl px-8 py-4 font-black uppercase italic tracking-widest',
            cancelButton: 'rounded-2xl px-8 py-4 font-black uppercase italic tracking-widest'
          }
        });
        if (result.isConfirmed) {
          await checkOutVisitor(activeVisit.visitId, true);
          addToast(kioskLang === 'EN' ? `${activeVisit.name} checked out successfully` : `${activeVisit.name} सफलतापूर्वक चेक आउट हो गया`, 'success');
          // Show review modal after checkout in kiosk mode
          setReviewVisitor(activeVisit);
        }
      } else {
        Swal.fire({
          title: kioskLang === 'EN' ? 'Not Found' : 'नहीं मिला',
          text: kioskLang === 'EN' ? 'No active check-in found for this number.' : 'इस नंबर के लिए कोई सक्रिय चेक-इन नहीं मिला।',
          icon: 'error',
          confirmButtonText: kioskLang === 'EN' ? 'OK' : 'ठीक है',
          customClass: {
            popup: 'rounded-[3rem] p-12'
          }
        });
      }
    }
  };

  const handleKioskPreRegistered = async () => {
    resetIdle();
    setIsKioskPreRegLookupOpen(true);
  };

  const handleKioskPreRegCheckIn = async (req: PreRegistration, signature: string) => {
    resetIdle();
    if (!organization?.id) {
      Swal.fire({
        title: kioskLang === 'EN' ? 'Configuration Error' : 'कॉन्फ़िगरेशन त्रुटि',
        text: kioskLang === 'EN' ? 'Organization context is missing. Please restart kiosk.' : 'संगठन डेटा अनुपलब्ध है। कृपया किओस्क पुनरारंभ करें।',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
      return;
    }
    try {
      setLoadingStates(prev => ({ ...prev, [req.id]: true }));
      
      const visitId = `v_${Date.now()}`;
      const timestamp = new Date().toISOString();
      const date = new Date().toISOString().split('T')[0];
      const checkInTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

      const visitData = {
        visitId,
        visitorId: visitId,
        visitorPhone: req.phone,
        visitorName: req.name,
        visitorEmail: req.email || '',
        visitorDOB: req.dob || '',
        visitorAddress: req.address || '',
        purpose: req.purpose,
        category: req.category || 'Guest',
        notes: req.notes || '',
        occasion: req.occasion || '',
        date,
        checkInTime,
        status: 'INSIDE',
        organizationId: organization.id,
        createdBy: 'KIOSK',
        recordedBy: 'KIOSK',
        recordedByName: 'Self Check-in',
        signature,
        preRegistrationId: req.id
      };

      const visitRef = doc(db, 'organizations', organization.id, 'visits', visitId);
      await setDoc(visitRef, sanitizeForFirestore(visitData));

      // Create or update profile record in Firestore
      const profileRef = doc(db, 'organizations', organization.id, 'profiles', req.phone);
      await setDoc(profileRef, sanitizeForFirestore({
        phone: req.phone,
        name: req.name,
        email: req.email || '',
        dob: req.dob || '',
        address: req.address || '',
        organizationId: organization.id,
        updatedAt: new Date().toISOString()
      }), { merge: true });

      // Mark pre-registration as CHECKED_IN
      await updateDoc(doc(db, 'organizations', organization.id, 'preRegistrations', req.id), {
        status: 'CHECKED_IN',
        processedAt: timestamp,
        processedBy: 'KIOSK'
      });

      setKioskSessionEntries(prev => [visitData as any, ...prev]);
      setIsKioskPreRegLookupOpen(false);
      
      Swal.fire({
        title: kioskLang === 'EN' ? 'Welcome!' : 'स्वागत है!',
        text: kioskLang === 'EN' ? `Check-in successful for ${req.name}. Please enter.` : `${req.name} के लिए चेक-इन सफल रहा। कृपया प्रवेश करें।`,
        icon: 'success',
        timer: 3000,
        showConfirmButton: false,
        background: '#ffffff',
        customClass: {
          popup: 'rounded-[3rem] p-12 text-center',
          title: 'text-3xl font-black text-slate-900 mb-4 italic uppercase',
          htmlContainer: 'text-lg text-slate-500 font-bold'
        }
      });
    } catch (error) {
      console.error('Kiosk check-in error:', error);
      Swal.fire({
        title: kioskLang === 'EN' ? 'Check-in Failed' : 'चेक-इन विफल रहा',
        text: kioskLang === 'EN' ? 'An unexpected error occurred. Please try standard entry.' : 'एक अप्रत्याशित त्रुटि हुई। कृपया सामान्य चेक-इन का प्रयास करें।',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [req.id]: false }));
    }
  };

  if (organization?.deactivated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[2.5rem] p-12 shadow-2xl border border-red-100 text-center space-y-8"
        >
          <div className="mx-auto w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center">
            <Shield className="h-12 w-12 text-red-600 animate-pulse" />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-black text-gray-900 italic uppercase leading-none">Organization Deactivated</h1>
            <p className="text-gray-500 font-medium leading-relaxed text-sm">
              This organization account has been deactivated by an administrator. All data is securely preserved in our database.
            </p>
          </div>
          <div className="space-y-4 pt-4">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-left">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Organization</p>
              <p className="text-sm font-bold text-gray-900">{organization.name}</p>
              {organization.deactivatedAt && (
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">
                  Deactivated on {new Date(organization.deactivatedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={async () => {
              sessionStorage.removeItem('vms_selected_org_id');
              sessionStorage.removeItem('vms_fresh_login');
              setSelectedOrgId(null);
              await signOut(auth);
              setUser(null);
              setOrganization(null);
            }}
            className="w-full py-5 bg-gray-900 text-white font-black rounded-2xl shadow-xl shadow-gray-200 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
          
          {isSuperAdmin && (
            <button 
              onClick={async () => {
                const orgRef = doc(db, 'organizations', organization.id);
                await updateDoc(orgRef, { deactivated: false });
                addToast('Organization reactivated', 'success');
              }}
              className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline block w-full text-center"
            >
              Reactivate (Super Admin)
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {isKioskMode ? (
        <div className="min-h-screen bg-slate-50 transition-colors duration-500 font-sans flex flex-col">
          {/* Kiosk Header */}
          <header className="h-24 bg-white border-b border-gray-100 flex items-center justify-between px-12 shadow-sm relative z-50">
            <div className="flex items-center gap-6">
              <button 
                onClick={handleExitKiosk}
                className="p-3 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-xl transition-all mr-2 group"
                title="Exit Kiosk"
              >
                <Power className="h-5 w-5 group-hover:scale-110 transition-transform" />
              </button>
              <div className="h-14 w-14 bg-brand-blue rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                {organization?.logoUrl ? (
                  <img src={organization.logoUrl} className="w-10 h-10 object-contain brightness-0 invert" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-white font-black text-xl italic">{organization?.name?.charAt(0) || 'AF'}</span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-gray-900 uppercase italic leading-none">{organization?.name || (kioskLang === 'EN' ? 'Visitor Management System' : 'आगंतुक प्रबंधन प्रणाली')}</h1>
                <p className="text-[10px] font-bold text-brand-blue tracking-[0.3em] uppercase mt-1">{kioskLang === 'EN' ? 'Self Check-In Terminal' : 'स्वयं चेक-इन टर्मिनल'}</p>
              </div>
            </div>

            <div className="flex items-center gap-12">
              <div className="flex bg-gray-100 rounded-2xl p-1 border border-gray-200 shadow-inner">
                <button 
                  onClick={() => setKioskLang('EN')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${kioskLang === 'EN' ? 'bg-brand-blue text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  English
                </button>
                <button 
                  onClick={() => setKioskLang('HI')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${kioskLang === 'HI' ? 'bg-brand-blue text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  हिंदी
                </button>
              </div>

              <div className="text-right">
                <div className="text-3xl font-black text-gray-900 font-mono tracking-tighter">
                  {new Date().toLocaleTimeString(kioskLang === 'HI' ? 'hi-IN' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {new Date().toLocaleDateString(kioskLang === 'HI' ? 'hi-IN' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-hidden flex flex-col relative text-center">
            {/* Kiosk Notification Bar */}
            <AnimatePresence>
              {notifications.filter(n => n.type === 'KIOSK_BROADCAST' && !n.read && !n.deleted).length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-brand-blue/90 backdrop-blur-md text-white py-4 px-12 flex items-center justify-center gap-4 relative z-40 overflow-hidden"
                >
                  <motion.div 
                    animate={{ x: [20, -20, 20] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="flex items-center gap-3"
                  >
                    <Bell className="h-4 w-4 text-blue-300" />
                    <span className="text-xs font-black uppercase tracking-widest italic">
                      {notifications.find(n => n.type === 'KIOSK_BROADCAST' && !n.read && !n.deleted)?.message}
                    </span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
              <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-blue/30 blur-[120px] rounded-full animate-pulse" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            <AnimatePresence mode="wait">
              {isKioskPreRegLookupOpen ? (
                <motion.div
                  key="prereg-lookup"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="flex-1 flex flex-col"
                >
                  <KioskPreRegLookup 
                    organizationId={organization?.id || ''}
                    onBack={() => setIsKioskPreRegLookupOpen(false)}
                    onCheckIn={handleKioskPreRegCheckIn}
                    lang={kioskLang}
                  />
                </motion.div>
              ) : !isKioskFormOpen ? (
                <motion.div 
                  key="welcome"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex-1 flex flex-col p-12 max-w-[1400px] mx-auto w-full gap-12"
                >
                  {/* Action Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <motion.button
                      whileHover={{ y: -10, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsKioskFormOpen(true)}
                      className="bg-white rounded-[3rem] p-12 shadow-xl border border-gray-100 flex flex-col items-center text-center group hover:shadow-2xl transition-all duration-500"
                    >
                      <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner group-hover:bg-brand-blue transition-colors duration-500">
                        <UserPlus className="h-12 w-12 text-brand-blue group-hover:text-white transition-colors" />
                      </div>
                      <h3 className="text-3xl font-black text-gray-900 mb-2 italic uppercase">{kioskLang === 'EN' ? 'Check In' : 'चेक इन'}</h3>
                      <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">{kioskLang === 'EN' ? 'New Visitor Entry' : 'नया आगंतुक प्रवेश'}</p>
                    </motion.button>

                    <motion.button
                      whileHover={{ y: -10, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleKioskPreRegistered}
                      className="bg-white rounded-[3rem] p-12 shadow-xl border border-gray-100 flex flex-col items-center text-center group hover:shadow-2xl transition-all duration-500"
                    >
                      <div className="w-24 h-24 bg-orange-50 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner group-hover:bg-orange-500 transition-colors duration-500">
                        <Calendar className="h-12 w-12 text-orange-500 group-hover:text-white transition-colors" />
                      </div>
                      <h3 className="text-3xl font-black text-gray-900 mb-2 italic uppercase">{kioskLang === 'EN' ? 'Pre-registered' : 'पूर्व-पंजीकृत'}</h3>
                      <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">{kioskLang === 'EN' ? 'Quick Check-In' : 'त्वरित चेक-इन'}</p>
                    </motion.button>

                    <QRCheckOutScanner
                      onScan={handleScanCheckOut}
                      lang={kioskLang}
                      className="w-full h-full"
                      customTrigger={
                        <motion.button
                          whileHover={{ y: -10, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                            // Let the QRScanner's onClick handle it
                          }}
                          className="w-full h-full bg-white rounded-[3rem] p-12 shadow-xl border border-gray-100 flex flex-col items-center text-center group hover:shadow-2xl transition-all duration-500"
                        >
                          <div className="w-24 h-24 bg-purple-50 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner group-hover:bg-purple-500 transition-colors duration-500">
                            <Camera className="h-12 w-12 text-purple-500 group-hover:text-white transition-colors" />
                          </div>
                          <h3 className="text-3xl font-black text-gray-900 mb-2 italic uppercase">{kioskLang === 'EN' ? 'Scan Out' : 'स्कैन आउट'}</h3>
                          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">{kioskLang === 'EN' ? 'Scan QR Pass to Exit' : 'बाहर जाने के लिए QR स्कैन करें'}</p>
                        </motion.button>
                      }
                    />

                    <motion.button
                      whileHover={{ y: -10, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleKioskCheckOut}
                      className="bg-white rounded-[3rem] p-12 shadow-xl border border-gray-100 flex flex-col items-center text-center group hover:shadow-2xl transition-all duration-500"
                    >
                      <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner group-hover:bg-emerald-500 transition-colors duration-500">
                        <LogOut className="h-12 w-12 text-emerald-500 group-hover:text-white transition-colors" />
                      </div>
                      <h3 className="text-3xl font-black text-gray-900 mb-2 italic uppercase">{kioskLang === 'EN' ? 'Check Out' : 'चेक आउट'}</h3>
                      <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">{kioskLang === 'EN' ? 'Mark Your Departure' : 'प्रस्थान दर्ज करें'}</p>
                    </motion.button>
                  </div>

                  {/* Bottom Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Recent Activity */}
                    <div className="lg:col-span-3 bg-white rounded-[3rem] p-10 shadow-lg border border-gray-50 flex flex-col min-h-[400px]">
                      <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-50">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center">
                            <History className="h-5 w-5 text-slate-400" />
                          </div>
                          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-800">{kioskLang === 'EN' ? 'Recent Activity' : 'हाल की गतिविधि'}</h3>
                        </div>
                        <span className="px-3 py-1 bg-blue-50 text-brand-blue rounded-lg text-[10px] font-black tracking-widest uppercase">
                          {kioskSessionEntries.length} {kioskLang === 'EN' ? 'In Session' : 'सत्र में'}
                        </span>
                      </div>

                      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
                        {kioskSessionEntries.length > 0 ? (
                          kioskSessionEntries.map((entry, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between group hover:bg-brand-blue/5 transition-colors border border-transparent hover:border-brand-blue/10"
                            >
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center font-bold text-brand-blue border border-gray-100 shadow-sm">
                                  {(entry.name || entry.visitorName || 'V').charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900">{entry.name || entry.visitorName}</p>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{entry.purpose}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-black text-brand-blue">{entry.checkInTime}</p>
                                <div className="flex flex-col items-end gap-1">
                                  {entry.isEmergency && (
                                    <span className="px-3 py-1 bg-red-600 text-white rounded-lg text-[8px] font-black uppercase shadow-lg shadow-red-500/20 border border-red-400 animate-pulse tracking-tighter flex items-center gap-1 leading-none">
                                      <AlertTriangle className="h-2 w-2" />
                                      EMERGENCY
                                    </span>
                                  )}
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[8px] font-bold uppercase">{kioskLang === 'EN' ? 'Success' : 'सफल'}</span>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center opacity-30 text-center py-12">
                            <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
                              <History className="h-10 w-10 text-gray-300" />
                            </div>
                            <p className="text-lg font-black text-gray-900 italic uppercase">{kioskLang === 'EN' ? 'No Recent Entries' : 'कोई हालिया प्रविष्टि नहीं'}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{kioskLang === 'EN' ? 'Activity resets when kiosk is re-opened' : 'कियोस्क को फिर से खोलने पर गतिविधि रीसेट हो जाती है'}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Help Card */}
                    <div className="lg:col-span-2 bg-brand-blue rounded-[3rem] p-12 shadow-xl shadow-blue-500/20 text-white flex flex-col relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
                      
                      <h3 className="text-3xl font-black mb-6 italic uppercase leading-[0.9]">{kioskLang === 'EN' ? 'Need Help?' : 'क्या आपको मदद चाहिए?'}</h3>
                      <p className="text-blue-100/70 font-bold text-sm leading-relaxed mb-10">
                        {kioskLang === 'EN' 
                          ? "If you're having trouble checking in or need to speak with a staff member, please tap the button below."
                          : "यदि आपको चेक-इन करने में समस्या हो रही है या किसी कर्मचारी से बात करने की आवश्यकता है, तो कृपया नीचे दिए गए बटन पर टैप करें।"}
                      </p>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCallStaff}
                        className="mt-auto w-full py-5 bg-white text-brand-blue font-black rounded-2xl shadow-xl shadow-black/5 flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
                      >
                        <UserCheck className="h-5 w-5" />
                        {kioskLang === 'EN' ? 'Call Staff' : 'कर्मचारियों को बुलाएं'}
                      </motion.button>
                    </div>
                  </div>

                  {/* Admin Controls Footer */}
                  <div className="mt-auto py-8">
                    <div className="max-w-[400px] mx-auto bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-2">
                      <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                          <Lock className="h-5 w-5 text-gray-300" />
                      </div>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => handleExitKiosk()}
                          className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                        >
                          {kioskLang === 'EN' ? 'Exit Kiosk' : 'कियोस्क बंद करें'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="form"
                  initial={{ opacity: 0, x: 200 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -200 }}
                  className="flex-1 bg-white relative z-[100] flex flex-col"
                >
                  <div className="h-24 bg-white border-b border-gray-50 flex items-center justify-between px-12 shrink-0">
                    <button onClick={() => setIsKioskFormOpen(false)} className="flex items-center gap-4 text-slate-400 group">
                      <div className="p-4 bg-slate-50 rounded-[2rem] group-hover:bg-brand-blue group-hover:text-white transition-all duration-500 shadow-sm">
                        <ChevronLeft className="h-8 w-8 transition-transform group-hover:-translate-x-1" />
                      </div>
                      <span className="font-black tracking-[0.3em] uppercase text-xs">{kioskLang === 'EN' ? 'Back' : 'पीछे'}</span>
                    </button>
                    
                    <button 
                      onClick={handleExitKiosk}
                      className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all flex items-center gap-2 group shadow-sm"
                    >
                      <Power className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{kioskLang === 'EN' ? 'Exit' : 'बंद'}</span>
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar pt-8">
                     <div className="max-w-4xl mx-auto px-12 pb-12">
                        <VisitorForm 
                          onSave={(data) => {
                            saveVisitor(data);
                            setIsKioskFormOpen(false);
                          }} 
                          onClose={() => setIsKioskFormOpen(false)}
                          isKiosk={true}
                          lang={kioskLang}
                          existingVisitors={visitors}
                          customPurposes={organization?.visitPurposes}
                          customCategories={organization?.visitorCategories}
                          donationOccasions={organization?.donationOccasions}
                          eventOccasions={organization?.eventOccasions}
                          organizationId={organization?.id}
                        />
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      ) : (
        <div className={`min-h-screen bg-slate-50/50 font-sans text-ngo-primary flex flex-col overflow-x-hidden relative pb-20 lg:pb-0 transition-all duration-700 ${showEmergencyForm ? 'ring-[16px] ring-inset ring-red-600/30' : ''}`}>
          {/* Role Status Banners */}
          {user.role === 'MASTER_ADMIN' || user.uid === organization?.createdBy ? (
            <div className="bg-amber-500 px-8 py-2.5 flex items-center justify-center gap-3 text-white overflow-hidden relative">
              <div className="absolute inset-0 bg-white/10 animate-[pulse_3s_infinite]" />
              <Shield className="h-4 w-4 fill-white relative z-10" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] relative z-10">Master Admin Privileges • Organization Authority Secured</span>
            </div>
          ) : user.role === 'STAFF' ? (
            <div className="bg-indigo-600 px-8 py-2.5 flex items-center justify-center gap-3 text-white overflow-hidden relative">
              <div className="absolute inset-0 bg-indigo-500/20 animate-pulse" />
              <Shield className="h-4 w-4 relative z-10" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] relative z-10">Staff Interface Activated • Sensor Monitoring Mode</span>
            </div>
          ) : null}

          {/* Emergency Alert Banner */}
          <AnimatePresence>
            {showEmergencyForm && (
              <motion.div
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                exit={{ y: -100 }}
                className="fixed top-0 inset-x-0 h-1 bg-red-600 z-[20000] shadow-[0_0_20px_rgba(220,38,38,0.5)]"
              >
                <div className="absolute inset-0 bg-red-500 animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Emergency Button - Truly Fixed to Viewport */}
          <AnimatePresence>
            {!showEmergencyForm && (
              <motion.button
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0, y: 20 }}
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: "0 20px 40px -5px rgb(220 38 38 / 0.4)",
                  backgroundColor: "rgb(239 68 68)"
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowEmergencyForm(true)}
                className="fixed bottom-5 right-5 w-16 h-16 bg-red-600 text-white rounded-full shadow-[0_15px_40px_rgba(220,38,38,0.4)] flex items-center justify-center z-[9999] border-2 border-white/20 backdrop-blur-md transition-all group"
                style={{ position: 'fixed', bottom: '20px', right: '20px' }}
                title="Emergency entry protocol"
              >
                <AlertCircle className="h-8 w-8 transition-transform group-hover:rotate-12" />
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.1, 0.4] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-red-500 rounded-full -z-10"
                />
              </motion.button>
            )}
          </AnimatePresence>
      {/* Dynamic Colorful Atmosphere */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[1000px] h-[1000px] bg-brand-blue/10 rounded-full blur-[180px] mix-blend-multiply animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-[800px] h-[800px] bg-ngo-accent/10 rounded-full blur-[150px] mix-blend-multiply animate-pulse [animation-delay:3s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-emerald-500/5 rounded-full blur-[200px] mix-blend-multiply animate-pulse [animation-delay:1.5s]" />
      </div>

      {/* Top Navigation Bar - Premium Density */}
      <header className="bg-white/80 backdrop-blur-2xl border-b border-slate-200/40 sticky top-0 z-[100] w-full">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8">
          <div className="flex justify-between items-center h-20 sm:h-24">
            {/* Branding Container */}
            <div className="flex items-center gap-5 shrink-0 group cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:rotate-6 group-hover:scale-105 overflow-hidden" style={{ backgroundColor: organization?.brandColor || '#2563EB' }}>
                {organization?.logoUrl ? (
                  <img src={organization.logoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-white text-xl sm:text-2xl font-black italic tracking-tighter">
                    {organization?.name ? organization.name.substring(0, 2).toUpperCase() : 'OS'}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl sm:text-2xl font-display font-extrabold tracking-tight text-ngo-primary leading-none mb-1.5 flex items-center gap-2">
                  {organization?.name || 'Visitor Management System'}
                  <span className="h-1.5 w-1.5 bg-ngo-accent rounded-full animate-pulse" />
                  {availableOrgs.length > 1 && (
                    <button 
                      onClick={handleSwitchWorkspace}
                      className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-150 text-indigo-700 hover:text-indigo-800 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
                      title="Switch to another associated organization"
                    >
                      <Briefcase className="h-3 w-3" />
                      Switch
                    </button>
                  )}
                </h1>
                <div className="flex flex-col gap-0.5">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                    VMS Intelligence 4.0
                  </p>
                  <p className="text-[9px] font-black text-brand-blue uppercase tracking-[0.25em] mt-1">
                    Visitor Management System
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation - High Density Grid */}
            <nav className="hidden lg:flex items-center justify-center flex-1 mx-4 xl:mx-8 gap-1 overflow-x-auto no-scrollbar">
              {isTabVisible('dashboard') && (
                <NavButton 
                  active={activeTab === 'dashboard'} 
                  onClick={() => setActiveTab('dashboard')}
                  icon={<LayoutDashboard />}
                  label="Home"
                />
              )}
              {isTabVisible('visitors') && (
                <NavButton 
                  active={activeTab === 'visitors'} 
                  onClick={() => setActiveTab('visitors')}
                  icon={<UserPlus />}
                  label="Entries"
                />
              )}
              {isTabVisible('pre-registrations') && (
                <NavButton 
                  active={activeTab === 'pre-registrations'} 
                  onClick={() => setActiveTab('pre-registrations')}
                  icon={<Calendar />}
                  label="Pre-Register"
                />
              )}
              {isTabVisible('inquiries') && (
                <NavButton 
                  active={activeTab === 'inquiries'} 
                  onClick={() => setActiveTab('inquiries')}
                  icon={<PhoneCall />}
                  label="Inquiries"
                />
              )}
              {isTabVisible('records') && (
                <NavButton 
                  active={activeTab === 'records'} 
                  onClick={() => setActiveTab('records')}
                  icon={<ClipboardList />}
                  label="Records"
                />
              )}
              {isTabVisible('analysis') && (user.role === 'ADMIN' || user.role === 'MASTER_ADMIN' || isSuperAdmin) && (
                <NavButton 
                  active={activeTab === 'analysis'} 
                  onClick={() => setActiveTab('analysis')}
                  icon={<BarChart3 />}
                  label="Analytics"
                />
              )}
              {isTabVisible('donations') && (user.role === 'ADMIN' || user.role === 'MASTER_ADMIN' || isSuperAdmin) && (
                <NavButton 
                  active={activeTab === 'donations'} 
                  onClick={() => setActiveTab('donations')}
                  icon={<Heart />}
                  label="Donations"
                />
              )}
              {isTabVisible('birthdays') && (
                <NavButton 
                  active={activeTab === 'birthdays'} 
                  onClick={() => setActiveTab('birthdays')}
                  icon={<Gift />}
                  label="Birthdays"
                />
              )}
              {isTabVisible('reviews') && (
                <NavButton 
                  active={activeTab === 'reviews'} 
                  onClick={() => setActiveTab('reviews')}
                  icon={<Star />}
                  label="Reviews"
                />
              )}
              {isTabVisible('logs') && (user.role === 'ADMIN' || user.role === 'MASTER_ADMIN' || isSuperAdmin) && (
                <NavButton 
                  active={activeTab === 'logs'} 
                  onClick={() => setActiveTab('logs')}
                  icon={<History />}
                  label="Logs"
                />
              )}
              { (user.role === 'ADMIN' || user.role === 'MASTER_ADMIN' || isSuperAdmin) && (
                <NavButton 
                  active={activeTab === 'settings'} 
                  onClick={() => setActiveTab('settings')}
                  icon={<Shield />}
                  label="Security"
                />
              )}
              {isTabVisible('legal') && (
                <NavButton 
                  active={activeTab === 'legal'} 
                  onClick={() => { setLegalSubView('support'); setActiveTab('legal'); }}
                  icon={<HelpCircle />}
                  label="Support"
                />
              )}
              {isTabVisible('profile') && (
                <NavButton 
                  active={activeTab === 'profile'} 
                  onClick={() => setActiveTab('profile')}
                  icon={<UserIcon />}
                  label="Profile"
                />
              )}
            </nav>

            {/* Profile & Notifications */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              {/* Connection Status Indicator */}
              <div className="hidden sm:flex items-center gap-3">
                {!isOnline ? (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2.5 px-4 py-2 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100 shadow-[0_10px_20px_-5px_rgba(239,68,68,0.1)]"
                  >
                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                    Off-Grid
                  </motion.div>
                ) : (isSyncing || isSyncingOffline) ? (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2.5 px-4 py-2 bg-brand-blue/5 text-brand-blue rounded-2xl text-[10px] font-black uppercase tracking-widest border border-brand-blue/10 shadow-[0_10px_20px_-5px_rgba(37,99,235,0.1)]"
                  >
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Syncing Intelligence
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2.5 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-[0_10px_20px_-5px_rgba(16,185,129,0.1)] group"
                  >
                    <div className="h-2 w-2 bg-emerald-500 rounded-full group-hover:scale-125 transition-transform" />
                    On-Grid Live
                  </motion.div>
                )}
              </div>

              {/* Notifications Trigger */}
              <button
                onClick={() => setIsNotificationsOpen(true)}
                className="h-10 w-10 sm:h-12 sm:w-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center transition-all relative group border border-slate-100"
              >
                <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400 group-hover:text-slate-900 transition-colors" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-2.5 right-2.5 h-3 w-3 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              <div className="hidden lg:flex flex-col items-end mr-1">
                <span className="text-sm font-bold text-gray-900 leading-none mb-1">{user.name || 'User'}</span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{user.role}</span>
              </div>
              <div 
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-brand-blue to-blue-400 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden cursor-pointer hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95 group"
                onClick={() => setActiveTab('profile')}
                title="View Profile"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.name || 'User'} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                ) : (
                  <span className="text-white font-black text-lg group-hover:scale-110 transition-transform">{(user.name || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

    <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-slate-100 py-0.5 flex items-center justify-start overflow-x-auto no-scrollbar scroll-smooth bg-white/95 backdrop-blur-md px-2 z-[100] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pb-safe-area-bottom gap-1">
        {isTabVisible('dashboard') && <MobileNavBtn active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="Home" />}
        {isTabVisible('visitors') && <MobileNavBtn active={activeTab === 'visitors'} onClick={() => setActiveTab('visitors')} icon={<UserPlus />} label="Entry" />}
        {isTabVisible('inquiries') && <MobileNavBtn active={activeTab === 'inquiries'} onClick={() => setActiveTab('inquiries')} icon={<PhoneCall />} label="Inquiries" />}
        {isTabVisible('pre-registrations') && <MobileNavBtn active={activeTab === 'pre-registrations'} onClick={() => setActiveTab('pre-registrations')} icon={<Calendar />} label="Pre-Reg" />}
        {isTabVisible('records') && <MobileNavBtn active={activeTab === 'records'} onClick={() => setActiveTab('records')} icon={<ClipboardList />} label="Records" />}
        {isTabVisible('analysis') && (user.role === 'ADMIN' || user.role === 'MASTER_ADMIN' || isSuperAdmin) && <MobileNavBtn active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} icon={<BarChart3 />} label="Analytics" />}
        {isTabVisible('donations') && (user.role === 'ADMIN' || user.role === 'MASTER_ADMIN' || isSuperAdmin) && <MobileNavBtn active={activeTab === 'donations'} onClick={() => setActiveTab('donations')} icon={<Heart />} label="Donations" />}
        {isTabVisible('birthdays') && <MobileNavBtn active={activeTab === 'birthdays'} onClick={() => setActiveTab('birthdays')} icon={<Gift />} label="Birthdays" />}
        {isTabVisible('reviews') && <MobileNavBtn active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} icon={<Star />} label="Reviews" />}
        {isTabVisible('logs') && (user.role === 'ADMIN' || user.role === 'MASTER_ADMIN' || isSuperAdmin) && <MobileNavBtn active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<History />} label="Logs" />}
        {user.role === 'ADMIN' || user.role === 'MASTER_ADMIN' || isSuperAdmin ? (
          <MobileNavBtn active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Shield />} label="Security" />
        ) : null}
        {isTabVisible('legal') && <MobileNavBtn active={activeTab === 'legal'} onClick={() => { setLegalSubView('support'); setActiveTab('legal'); }} icon={<HelpCircle />} label="Support" />}
        {isTabVisible('profile') && <MobileNavBtn active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<UserIcon />} label="Profile" />}
    </div>

      <main className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-500 ${user?.preferences?.density ? 'py-2 scale-[0.99] origin-top font-tight' : 'py-8'}`}>
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && isTabVisible('dashboard') && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12"
            >
              {/* Hero Section - Super Modern Layout */}
              <div className="relative flex flex-col xl:flex-row gap-12">
                <div className="flex-1 space-y-10 py-6">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100 shadow-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Secure Live Node</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">|</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Terminal ID: {user.role === 'ADMIN' ? 'Admin.01' : 'Staff.Auth'}</span>
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-6xl sm:text-7xl font-bold text-[#051739] tracking-tight leading-[1.05] font-sans not-italic">
                        Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, <br />
                        <span className="text-blue-600">{(user.name || 'User').split(' ')[0]}</span>
                      </h2>
                      <p className="text-lg text-slate-400 font-medium max-w-lg">
                        Welcome back! Here's what's happening with <span className="text-slate-900 font-bold">{organization?.name || 'VMS Enterprise'}</span> today.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      onClick={() => setActiveTab('visitors')}
                      className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-[0_20px_40px_-10px_rgba(37,99,235,0.3)] hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      Open Dashboard
                    </button>
                    <button
                      onClick={() => setActiveTab('records')}
                      className="px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2"
                    >
                       View Reports
                       <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Right Illustration & Side Cards */}
                <div className="xl:w-[500px] shrink-0 relative">
                  <div className="relative aspect-square sm:aspect-auto sm:h-[450px] w-full bg-gradient-to-br from-blue-50/30 to-transparent rounded-[3rem] overflow-hidden">
                    {/* Simplified Isometric Building Illustration */}
                    <div className="absolute inset-0 flex items-center justify-center scale-110">
                      <div className="relative w-72 h-80 bg-blue-100/40 rounded-3xl [transform:rotateX(45deg)_rotateZ(-45deg)] shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-white to-blue-50 border border-blue-100 rounded-3xl" />
                        <div className="absolute -top-12 left-0 w-full h-12 bg-blue-200/50 rounded-full blur-2xl" />
                        {/* Smaller detail boxes */}
                        <div className="absolute top-4 left-4 w-12 h-12 bg-blue-500/20 rounded-xl" />
                        <div className="absolute bottom-8 right-8 w-24 h-24 bg-white shadow-xl rounded-2xl flex items-center justify-center">
                          <ShieldCheck className="h-12 w-12 text-blue-600" />
                        </div>
                      </div>
                      {/* Floating bubbles */}
                      <motion.div 
                        animate={{ y: [0, -20, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-1/4 left-1/4 h-12 w-12 bg-white rounded-2xl shadow-xl flex items-center justify-center"
                      >
                         <Users2 className="h-6 w-6 text-blue-500" />
                      </motion.div>
                    </div>

                    <div className="absolute right-0 top-0 bottom-0 w-full sm:w-60 flex flex-col gap-4 p-4 justify-center bg-white/20 backdrop-blur-sm sm:bg-transparent">
                      <div className="bg-white p-4 rounded-3xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] border border-slate-50 space-y-2">
                        <div className="flex items-center gap-2 text-blue-600">
                           <Clock className="h-4 w-4" />
                           <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">System Clock</span>
                        </div>
                        <div className="flex justify-between items-end">
                           <span className="text-2xl font-bold text-[#051739]">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase()}</span>
                           <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                             <Calendar className="h-5 w-5" />
                           </div>
                        </div>
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{new Date().toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase()}</p>
                      </div>

                      <div className="bg-white p-4 rounded-3xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] border border-slate-50 space-y-2">
                        <div className="flex items-center gap-2 text-emerald-600">
                           <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                           <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Node Status</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-xl font-bold text-emerald-600">CONNECTED</span>
                           <Zap className="h-5 w-5 text-emerald-500" />
                        </div>
                        <p className="text-[9px] font-medium text-slate-400">All systems operational</p>
                      </div>

                      <div className="bg-white p-4 rounded-3xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] border border-slate-50 space-y-2">
                         <div className="flex items-center gap-2 text-indigo-600">
                           <UserIcon className="h-4 w-4" />
                           <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Session</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-base font-bold text-[#051739] line-clamp-1">{user.name || 'User'}</span>
                           <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        </div>
                        <p className="text-[9px] font-medium text-slate-400">{user.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Birthdays - Refined as a banner */}
              {todaysBirthdaysCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setActiveTab('birthdays')}
                  className="bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] rounded-3xl p-6 text-white shadow-xl shadow-orange-100 flex items-center justify-between cursor-pointer group hover:scale-[1.005] transition-all border border-white/20"
                >
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Gift className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold tracking-tight">Celebration Time! 🎂</h3>
                      <p className="text-white/80 text-sm font-medium">There {todaysBirthdaysCount === 1 ? 'is 1 birthday' : `are ${todaysBirthdaysCount} birthdays`} today. Let's send some joy!</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest backdrop-blur-sm">
                    Open Hub
                  </div>
                </motion.div>
              )}

              {/* Summary Stats Container */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Unique Visitors"
                  value={stats.allTime.unique}
                  icon={<UserIcon className="h-6 w-6" />}
                  color="blue"
                  trend={`${stats.allTime.unique > 10 ? '↑ 12%' : '0%'} from yesterday`}
                  delay={0.1}
                />
                <StatCard
                  title="Donors"
                  value={stats.allTime.donors || 0}
                  icon={<Heart className="h-6 w-6" />}
                  color="rose"
                  trend="0% from yesterday"
                  delay={0.2}
                />
                <StatCard
                  title="Volunteers"
                  value={stats.allTime.volunteers || 0}
                  icon={<Users2 className="h-6 w-6" />}
                  color="emerald"
                  trend="0% from yesterday"
                  delay={0.3}
                />
                <StatCard
                  title="Active Now"
                  value={visitors.filter(v => v.status === 'INSIDE').length}
                  icon={<ClipboardList className="h-6 w-6" />}
                  color="amber"
                  trend="Currently Inside"
                  delay={0.4}
                />
              </div>

              {/* Quick Actions Row */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">QUICK ACTIONS</h3>
                    <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Frequently used system actions</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                    <span className="text-[9px] font-bold uppercase tracking-widest leading-none">Terminal: Admin.01</span>
                    <ChevronRight size={12} />
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
                    {[
                      { icon: <UserPlus />, label: 'New Entry', color: 'blue', tab: 'visitors', action: () => { setActiveTab('visitors'); setEditingVisitor(null); setShowForm(true); } },
                      { icon: <Calendar />, label: 'Pre-Register', color: 'rose', tab: 'pre-registrations', action: () => setActiveTab('pre-registrations') },
                      { icon: <Camera />, label: 'Scan QR Pass', color: 'emerald', tab: 'visitors', isScanner: true },
                      { icon: <History />, label: 'Manage Logs', color: 'purple', tab: 'logs', action: () => setActiveTab('logs') },
                      { icon: <Search />, label: 'Search Node', color: 'slate', tab: 'records', action: () => setActiveTab('records') },
                      { icon: <Monitor />, label: 'Kiosk Mode', color: 'amber', tab: 'dashboard', action: handleEnterKiosk },
                      { icon: <Shield />, label: 'Manage Staff', color: 'orange', tab: 'settings', action: () => setActiveTab('settings') },
                      { icon: <BarChart3 />, label: 'Reports', color: 'indigo', tab: 'analysis', action: () => setActiveTab('analysis') }
                    ].filter(btn => {
                      if (btn.tab === 'settings') return user?.role === 'ADMIN' || user?.role === 'MASTER_ADMIN' || isSuperAdmin;
                      return isTabVisible(btn.tab);
                    }).map((btn, i) => {
                      const buttonEl = (
                        <motion.button
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={btn.action}
                          className="flex flex-col items-center justify-center p-6 bg-white border border-slate-50 rounded-[2rem] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_35px_-5px_rgba(0,0,0,0.05)] transition-all group w-full h-full cursor-pointer"
                        >
                          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110
                            ${btn.color === 'blue' ? 'bg-blue-50 text-blue-600' : 
                              btn.color === 'rose' ? 'bg-rose-50 text-rose-600' : 
                              btn.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                              btn.color === 'purple' ? 'bg-purple-50 text-purple-600' :
                              btn.color === 'slate' ? 'bg-slate-50 text-slate-600' :
                              btn.color === 'orange' ? 'bg-orange-50 text-orange-600' :
                              btn.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                              'bg-indigo-50 text-indigo-600'}`}
                          >
                             {btn.icon}
                          </div>
                          <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest text-center">{btn.label}</span>
                        </motion.button>
                      );

                      if (btn.isScanner) {
                        return (
                          <QRCheckOutScanner
                            key={i}
                            onScan={handleScanCheckOut}
                            lang="EN"
                            customTrigger={buttonEl}
                          />
                        );
                      }

                      return <React.Fragment key={i}>{buttonEl}</React.Fragment>;
                    })}
                </div>
              </div>

              {/* Main Activity Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight">NODE TRAFFIC INTELLIGENCE</h3>
                      <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Live sensor data & visitor logs</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('visitors')}
                      className="flex items-center gap-2 text-blue-600 text-[10px] font-bold uppercase tracking-widest hover:underline"
                    >
                      Audit Full Sequence <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="glass-card rounded-[2.5rem] overflow-hidden">
                    <VisitorTable
                      visitors={latestVisitors}
                      allVisitors={visitors}
                      donations={donations}
                      onCheckOut={checkOutVisitor}
                      onEdit={handleEdit}
                      onDelete={deleteVisitor}
                      onBulkCheckOut={handleBulkCheckOut}
                      onBulkDelete={handleBulkDelete}
                      onBulkPrintPass={handleBulkPrintPass}
                      onAddReview={(v) => setReviewVisitor(v)}
                      onAddDonation={handleAddDonationRecord}
                      onGeneratePass={handleGeneratePass}
                      onPrintPass={handlePrintPass}
                      onWhatsAppSent={handleWhatsAppSent}
                      userRole={user.role}
                      loadingStates={loadingStates}
                      organizationName={organization?.name}
                      templates={organization?.preRegSettings?.templates}
                    />
                    
                    {/* Dashboard Pagination */}
                    {Math.ceil(visitors.length / DASHBOARD_ITEMS_PER_PAGE) > 1 && (() => {
                      const totalPages = Math.ceil(visitors.length / DASHBOARD_ITEMS_PER_PAGE);
                      const progressWidth = `${((dashboardPage + 1) / totalPages) * 100}%`;
                      return (
                        <div className="px-8 py-6 flex items-center justify-between bg-slate-50/50 border-t border-slate-100">
                          <button 
                            onClick={() => setDashboardPage(prev => Math.max(0, prev - 1))}
                            disabled={dashboardPage === 0}
                            className={`p-2 rounded-lg transition-colors ${dashboardPage === 0 ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-slate-200 text-slate-700'}`}
                          >
                            <ChevronLeft size={20} />
                          </button>
                          
                          <div className="flex-1 max-w-xs px-4" title={`Page ${dashboardPage + 1} of ${totalPages}`}>
                            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                                <motion.div 
                                  className="h-full bg-blue-600 rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: progressWidth }}
                                  transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                                />
                            </div>
                          </div>

                          <button 
                            onClick={() => setDashboardPage(prev => Math.min(totalPages - 1, prev + 1))}
                            disabled={dashboardPage === totalPages - 1}
                            className={`p-2 rounded-lg transition-colors ${dashboardPage === totalPages - 1 ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-slate-200 text-slate-700'}`}
                          >
                            <ChevronRight size={20} />
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-8">
                  {/* Account Summary Card */}
                  <div className="glass-card rounded-[2.5rem] p-8 relative group overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-2 text-slate-400">
                          <UserIcon size={16} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Active Operator</span>
                       </div>
                       <button className="text-blue-600"><MoreHorizontal size={20} /></button>
                    </div>

                    <div className="flex items-center gap-4 mb-10">
                       <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-lg overflow-hidden">
                         {user.photoURL ? (
                           <img src={user.photoURL} alt={user.name || 'User'} className="w-full h-full object-cover" />
                         ) : (
                           (user.name || 'U').charAt(0).toUpperCase()
                         )}
                       </div>
                       <div>
                          <h4 className="text-xl font-bold text-[#051739]">{user.name || 'User'}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.role} Account</p>
                       </div>
                    </div>

                    <div className="space-y-5 mb-10">
                       <div className="flex justify-between items-center text-sm font-medium">
                          <span className="text-slate-400">Total Visits</span>
                          <span className="text-slate-900 font-bold">{stats.allTime.total}</span>
                       </div>
                       <div className="flex justify-between items-center text-sm font-medium">
                          <span className="text-slate-400">Unique Visitors</span>
                          <span className="text-slate-900 font-bold">{stats.allTime.unique}</span>
                       </div>
                       <div className="flex justify-between items-center text-sm font-medium">
                          <span className="text-slate-400">Last Login</span>
                          <span className="text-slate-900 font-bold text-[11px] uppercase">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never'}</span>
                       </div>
                    </div>

                    <button 
                       onClick={() => setActiveTab('profile')}
                       className="w-full py-4 bg-[#051739] text-white rounded-2xl font-bold hover:bg-slate-900 shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                       <UserIcon size={18} />
                       View Profile
                    </button>
                  </div>

                  {/* NGO Context Card */}
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 text-white shadow-2xl shadow-blue-200/50 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform" />
                     <h4 className="text-xl font-bold mb-4">{organization?.name || 'VMS Enterprise'}</h4>
                     <p className="text-blue-50/70 text-xs font-medium leading-relaxed mb-8">
                       Empowering communities through education and sustainable development since 2010.
                     </p>
                     <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {[1,2,3,4].map(idx => (
                            <div key={idx} className="h-8 w-8 rounded-full border-2 border-white/20 bg-blue-300 flex items-center justify-center text-[10px] font-bold">
                               {String.fromCharCode(64 + idx)}
                            </div>
                          ))}
                          <div className="h-8 w-8 rounded-full border-2 border-white/20 bg-blue-400 flex items-center justify-center text-[10px] font-bold">
                             +12
                          </div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>

               {/* Footer */}
               <footer className="pt-20 pb-10 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 px-4">
                  <div className="flex items-center gap-3">
                     <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                        {organization?.name ? organization.name.substring(0, 2).toUpperCase() : 'JO'}
                     </div>
                     <span className="text-sm font-bold text-slate-900">{organization?.name || 'John Foundation'}</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">© 2025 {organization?.name || 'John Foundation'}. All rights reserved.</p>
                  <div className="flex items-center gap-8">
                     {['Privacy', 'Terms', 'Support'].map(link => (
                        <button key={link} className="text-xs text-slate-400 font-bold hover:text-blue-600 transition-colors uppercase tracking-widest">{link}</button>
                     ))}
                  </div>
               </footer>
            </motion.div>
          )}

          {activeTab === 'inquiries' && organization && isTabVisible('inquiries') && (
            <motion.div
              key="inquiries"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <InquiryTracker organization={organization} user={user} />
            </motion.div>
          )}

          {activeTab === 'pre-registrations' && isTabVisible('pre-registrations') && (
            <motion.div
              key="pre-registrations"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <PreRegistrationTab 
                organizationId={user?.organizationId || ''} 
                organizationName={organization?.name}
                user={user} 
                initialStatus={preRegFilter}
                onCheckOut={async (preRegId) => {
                  const correlatedVisit = visits.find(v => v.preRegistrationId === preRegId && v.status === 'INSIDE');
                  if (correlatedVisit) {
                    await checkOutVisitor(correlatedVisit.visitId);
                  } else {
                    addToast('No active visit found for this pre-registration', 'info');
                  }
                }}
              />
            </motion.div>
          )}

          {activeTab === 'visitors' && isTabVisible('visitors') && (
            <motion.div
              key="visitors"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Active Visitors</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Operational Personnel Deployment</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <QRCheckOutScanner onScan={handleScanCheckOut} lang="EN" />
                  <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center justify-center gap-3 px-8 py-4 bg-brand-blue text-white font-black rounded-2xl hover:bg-brand-blue/90 transition-all shadow-xl shadow-blue-200/50 hover:shadow-lg active:scale-95 uppercase tracking-widest text-[10px]"
                  >
                    <UserPlus className="h-4 w-4" />
                    Register New Arrival
                  </button>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-100/50 border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                  <div className="relative w-full xl:w-[480px] group">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-slate-400 group-focus-within:text-brand-blue transition-colors" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Search Intelligence Database..."
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-brand-blue focus:ring-[12px] focus:ring-brand-blue/5 transition-all outline-none text-xs font-bold text-slate-900 placeholder:text-slate-400"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <FilterButton 
                      active={true} 
                      onClick={() => {}} 
                      label="All Node Entries" 
                    />
                    <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block" />
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Segment:</span>
                      <select className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-black text-slate-700 uppercase tracking-widest focus:ring-8 focus:ring-blue-500/5 focus:border-brand-blue outline-none transition-all shadow-sm">
                        <option>Global View</option>
                        <option>Premium Donors</option>
                        <option>Staff Volunteers</option>
                        <option>General Guests</option>
                      </select>
                    </div>
                  </div>
                </div>
                <VisitorTable
                  visitors={activeVisitors}
                  allVisitors={visitors}
                  donations={donations}
                  onCheckOut={checkOutVisitor}
                  onEdit={handleEdit}
                  onDelete={deleteVisitor}
                  onBulkCheckOut={handleBulkCheckOut}
                  onBulkDelete={handleBulkDelete}
                  onBulkPrintPass={handleBulkPrintPass}
                  onAddReview={(v) => setReviewVisitor(v)}
                  onAddDonation={handleAddDonationRecord}
                  onGeneratePass={handleGeneratePass}
                  onPrintPass={handlePrintPass}
                  onWhatsAppSent={handleWhatsAppSent}
                  userRole={user.role}
                  loadingStates={loadingStates}
                  organizationName={organization?.name}
                  templates={organization?.preRegSettings?.templates}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'records' && isTabVisible('records') && (
            <motion.div
              key="records"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Master Archive</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Historical Node Persistence Logs</p>
                </div>
                {(user.role === 'ADMIN' || user.role === 'MASTER_ADMIN') && (
                  <div className="flex gap-4">
                    <button
                      onClick={exportToCSV}
                      className="flex items-center justify-center gap-2 px-6 py-4 bg-white border border-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                    >
                      <FileText className="h-5 w-5 text-brand-blue" />
                      Export CSV
                    </button>
                    <button
                      onClick={exportToExcel}
                      className="flex items-center justify-center gap-2 px-6 py-4 bg-white border border-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                    >
                      <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                      Export Excel
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-80">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Search by Name, Phone, Email, or DOB..."
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 transition-all outline-none text-sm font-bold"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                      <FilterButton 
                        active={recordsFilter === 'all'} 
                        onClick={() => setRecordsFilter('all')} 
                        label="All Records" 
                      />
                      <FilterButton 
                        active={recordsFilter === 'today'} 
                        onClick={() => setRecordsFilter('today')} 
                        label="Today" 
                      />
                      <FilterButton 
                        active={recordsFilter === 'inside'} 
                        onClick={() => setRecordsFilter('inside')} 
                        label="Inside" 
                      />
                      <FilterButton 
                        active={recordsFilter === 'checked-out'} 
                        onClick={() => setRecordsFilter('checked-out')} 
                        label="Checked Out" 
                      />
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-400 uppercase tracking-widest hidden lg:block">
                    Total: {historicalVisitors.length}
                  </div>
                </div>
                <VisitorTable
                  visitors={historicalVisitors}
                  allVisitors={visitors}
                  donations={donations}
                  onCheckOut={checkOutVisitor}
                  onEdit={handleEdit}
                  onDelete={deleteVisitor}
                  onBulkCheckOut={handleBulkCheckOut}
                  onBulkDelete={handleBulkDelete}
                  onBulkPrintPass={handleBulkPrintPass}
                  onAddReview={(v) => setReviewVisitor(v)}
                  onAddDonation={handleAddDonationRecord}
                  onGeneratePass={handleGeneratePass}
                  onPrintPass={handlePrintPass}
                  onWhatsAppSent={handleWhatsAppSent}
                  userRole={user.role}
                  loadingStates={loadingStates}
                  organizationName={organization?.name}
                  templates={organization?.preRegSettings?.templates}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && isTabVisible('profile') && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ProfileTab 
                user={user} 
                organization={organization} 
                onUpdateUser={(updated) => setUser(prev => prev ? { ...prev, ...updated } as any : null)}
                onLogout={handleLogout}
                hasMultiOrg={availableOrgs.length > 1}
                onSwitchWorkspace={handleSwitchWorkspace}
                googleStatus={googleConfig}
                availableSheets={availableSheets}
                availableCalendars={availableCalendars}
                isFetchingSheets={isFetchingSheets}
                isFetchingCalendars={isFetchingCalendars}
                isSyncingGoogle={isSyncingGoogle}
                onConnectGoogle={connectGoogle}
                onDisconnectGoogle={disconnectGoogle}
                onSelectSheet={selectExistingSheet}
                onCreateSheet={createNewSheet}
                onSelectCalendar={selectExistingCalendar}
                onCreateCalendar={createNewCalendar}
                onSyncNow={triggerGoogleSync}
                onCreateBackup={onCreateBackup}
                onRestoreBackup={onRestoreBackup}
                onFetchBackups={onFetchBackups}
                onRefreshLists={() => {
                  fetchAvailableSheets();
                  fetchAvailableCalendars();
                }}
              />
            </motion.div>
          )}

          {activeTab === 'analysis' && (user.role === 'ADMIN' || user.role === 'MASTER_ADMIN' || isSuperAdmin) && isTabVisible('analysis') && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="h-16 w-1 bg-brand-blue rounded-full" />
                  <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">System Intelligence</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Real-time Data Processing & Analytics</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/40 group hover:border-brand-blue transition-all">
                    <Calendar className="h-4 w-4 text-brand-blue group-hover:scale-110 transition-transform" />
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Target Epoch</span>
                      <input 
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-slate-900 cursor-pointer"
                      />
                    </div>
                  </div>
                  <button
                    onClick={fetchAIInsights}
                    disabled={aiInsights.loading}
                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {aiInsights.loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-brand-blue" />
                    )}
                    Generate Strategic Insights
                  </button>
                </div>
              </div>

              {/* AI Insights Section */}
              <AnimatePresence>
                {(aiInsights.frequentVisitors || aiInsights.loading) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden"
                  >
                    {[
                      { 
                        title: 'Frequency Analysis', 
                        content: aiInsights.frequentVisitors, 
                        icon: <Users className="h-5 w-5 text-brand-blue" />,
                        bg: 'bg-blue-50/40',
                        border: 'border-blue-100',
                        accent: 'bg-blue-600'
                      },
                      { 
                        title: 'Financial Pulse', 
                        content: aiInsights.donationPatterns, 
                        icon: <Heart className="h-5 w-5 text-rose-600" />,
                        bg: 'bg-rose-50/40',
                        border: 'border-rose-100',
                        accent: 'bg-rose-600'
                      },
                      { 
                        title: 'Intent Mapping', 
                        content: aiInsights.visitPurpose, 
                        icon: <BarChart3 className="h-5 w-5 text-emerald-600" />,
                        bg: 'bg-emerald-50/40',
                        border: 'border-emerald-100',
                        accent: 'bg-emerald-600'
                      }
                    ].map((insight, i) => (
                      <div key={i} className={`${insight.bg} backdrop-blur-sm border ${insight.border} p-8 rounded-[2.5rem] relative overflow-hidden transition-all hover:shadow-2xl shadow-slate-200/50 group`}>
                         <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000">
                          {React.cloneElement(insight.icon as any, { className: 'h-32 w-32' })}
                        </div>
                        <div className="flex items-center gap-4 mb-6">
                          <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover:rotate-6 transition-transform">
                            {insight.icon}
                          </div>
                          <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">{insight.title}</h4>
                        </div>
                        {aiInsights.loading ? (
                          <div className="space-y-3">
                            <div className="h-3 bg-white/60 rounded-full w-full animate-pulse"></div>
                            <div className="h-3 bg-white/60 rounded-full w-[90%] animate-pulse"></div>
                            <div className="h-3 bg-white/60 rounded-full w-3/4 animate-pulse"></div>
                          </div>
                        ) : (
                          <p className="text-sm font-medium text-slate-600 leading-relaxed italic relative z-10">
                            "{insight.content || 'Calibrating node intelligence and mapping behavioral sequences...'}"
                          </p>
                        )}
                        <div className={`absolute bottom-0 left-0 h-[3px] w-0 group-hover:w-full transition-all duration-700 ${insight.accent}`} />
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <StatCard
                  title="Global Intake"
                  value={stats.today.total}
                  icon={<Users />}
                  color="blue"
                  trend={stats.today.trend}
                  delay={0.1}
                />
                <StatCard
                  title="Current Occupancy"
                  value={activeVisitors.length}
                  icon={<UserCheck />}
                  color="emerald"
                  trend={`${activeVisitors.length} nodes active`}
                  delay={0.2}
                />
                <StatCard
                  title="Check-Out Delta"
                  value={stats.today.total - activeVisitors.length}
                  icon={<LogOut />}
                  color="indigo"
                  trend={`${stats.today.total - activeVisitors.length} sessions closed`}
                  delay={0.3}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Existing charts... */}
                <div className="bg-white/60 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl shadow-slate-100/50 border border-slate-100">
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Personnel Segments</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Niche Categorization</p>
                    </div>
                    <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-200">
                      <BarChart3 className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Donor', count: stats.allTime.donors },
                          { name: 'Volunteer', count: stats.allTime.volunteers },
                          { name: 'Guest', count: stats.allTime.guests },
                          { name: 'Other', count: stats.allTime.total - (stats.allTime.donors + stats.allTime.volunteers + stats.allTime.guests) }
                        ]}
                        margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                        />
                        <Bar dataKey="count" radius={[12, 12, 0, 0]} barSize={40}>
                          {['#2563eb', '#10b981', '#f59e0b', '#64748b'].map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white/60 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl shadow-slate-100/50 border border-slate-100">
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Global Composition</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Node Distribution Model</p>
                    </div>
                    <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-200">
                      <PieChart className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={[
                            { name: 'Donor', value: stats.allTime.donors },
                            { name: 'Volunteer', value: stats.allTime.volunteers },
                            { name: 'Guest', value: stats.allTime.guests },
                            { name: 'Other', value: Math.max(0, stats.allTime.total - (stats.allTime.donors + stats.allTime.volunteers + stats.allTime.guests)) }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {['#2563eb', '#10b981', '#f59e0b', '#f1f5f9'].map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} strokeWidth={0} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                        />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    {[
                      { label: 'Donors', color: 'bg-blue-600' },
                      { label: 'Volunteers', color: 'bg-emerald-500' },
                      { label: 'Guests', color: 'bg-amber-500' },
                      { label: 'Others', color: 'bg-slate-200' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Daily Trend */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-brand-blue" />
                    Daily Trend (Last 7 Days)
                  </h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.dailyTrend}
                        margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Frequent Visitors & Peak Time */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Users className="h-5 w-5 text-brand-blue" />
                    Frequent Visitors
                  </h3>
                  <div className="space-y-4">
                    {stats.frequentVisitors.length > 0 ? (
                      stats.frequentVisitors.map((v, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                              {(v.name || 'V').charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{v.name || 'Unknown'}</p>
                              <p className="text-xs text-gray-500">{v.phone}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                              {v.count} visits
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 font-medium text-center py-4">No frequent visitors yet.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
                  <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                    <History className="h-10 w-10 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Peak Visiting Time</h3>
                  <p className="text-gray-500 font-medium mb-6">Most visitors arrive around this time.</p>
                  <div className="text-5xl font-semibold text-brand-blue tracking-tighter">
                    {stats.peakTimeStr}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50">
                  <h3 className="text-xl font-semibold text-gray-900 tracking-tight">Recent Activity Summary</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    {latestVisitors.map((visitor, idx) => (
                      <div key={visitor.visitorId} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-semibold text-sm ${
                            visitor.status === 'INSIDE' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'
                          }`}>
                            {visitor.name?.charAt(0) || 'V'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">{visitor.name || visitor.visitorName}</p>
                              {visitor.isEmergency && (
                                <span className="px-1.5 py-0.5 bg-red-600 text-white text-[8px] font-black uppercase rounded-md shadow-sm shadow-red-200 animate-pulse">Emergency</span>
                              )}
                            </div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                              {visitor.category} • {visitor.checkInTime}
                              {visitor.dob && <span className="text-brand-blue ml-2">DOB: {visitor.dob}</span>}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[10px] font-bold text-gray-500">{visitor.phone}</p>
                              {visitor.email && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <p className="text-[10px] font-bold text-gray-500">{visitor.email}</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-lg text-xs font-medium text-gray-500 ${
                          visitor.status === 'INSIDE' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500'
                        }`}>
                          {visitor.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'birthdays' && isTabVisible('birthdays') && (
            <BirthdayTab 
              organizationId={organization?.id || ''}
              visitors={visitors} 
              donations={donations}
              loadingStates={loadingStates}
              organizationName={organization?.name}
            />
          )}

          {activeTab === 'reviews' && organization && isTabVisible('reviews') && (
            <motion.div
              key="reviews"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ReviewsTab visitors={visitors} organizationId={organization.id} userRole={user.role} />
            </motion.div>
          )}

          {activeTab === 'logs' && organization && (user.role === 'ADMIN' || user.role === 'MASTER_ADMIN' || isSuperAdmin) && isTabVisible('logs') && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ActivityLogsTab organizationId={organization.id} users={orgUsers} />
            </motion.div>
          )}

          {activeTab === 'donations' && (user.role === 'ADMIN' || user.role === 'MASTER_ADMIN' || isSuperAdmin) && isTabVisible('donations') && (
            <motion.div
              key="donations"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
                <DonationsTab 
                  visitors={visitors} 
                  donations={donations}
                  organizationId={organization?.id || ''} 
                  userRole={user?.role || 'STAFF'}
                  donationOccasions={organization?.donationOccasions || DEFAULT_DONATION_OCCASIONS}
                  specialLocations={organization?.specialLocations || ['Main Hall', 'Office', 'Temple', 'Community Center', 'Online']}
                  donationTypes={organization?.donationTypes || DEFAULT_DONATION_TYPES}
                  paymentModes={organization?.paymentModes || DEFAULT_PAYMENT_MODES}
                  onUpdateVisit={async (visitId, data) => {
                    if (!visitId || !organization?.id) return;
                    const visitRef = doc(db, 'organizations', organization.id, 'visits', visitId);
                    await updateDoc(visitRef, sanitizeForFirestore(data));
                    addToast('Record updated successfully!', 'success');
                  }}
                  onUpdateProfile={async (phone, data) => {
                    if (!phone || !organization?.id) return;
                    const profileRef = doc(db, 'organizations', organization.id, 'profiles', phone);
                    await updateDoc(profileRef, sanitizeForFirestore(data));
                    addToast('Profile updated successfully!', 'success');
                  }}
                  onAddDonation={async (donationData) => {
                    const orgId = user?.organizationId;
                    if (!orgId || !user) return;
                    setIsSavingDonation(true);
                    try {
                      const donationId = `DON-${Date.now()}`;
                      const newDonation: Donation = {
                        ...donationData,
                        id: donationId,
                        organizationId: orgId,
                        recordedBy: user.uid,
                        recordedByName: user.name,
                        timestamp: new Date().toISOString(),
                        auditLog: [{
                          action: 'CREATE',
                          userId: user.uid,
                          userName: user.name,
                          timestamp: new Date().toISOString()
                        }]
                      };
                      await setDoc(doc(db, 'organizations', orgId, 'donations', donationId), newDonation);
                      
                      // Add general donation notification
                      await createNotification({
                        title: 'New Donation Captured',
                        message: `${newDonation.visitorName} contributed ₹${newDonation.amount} via ${newDonation.paymentMode}.`,
                        type: 'DONATION',
                        relatedId: donationId
                      });
                      
                      // Trigger notification for occasion if date is set
                      if (newDonation.occasionDate && newDonation.occasion) {
                        const notificationId = `NOTIF-${Date.now()}`;
                        await setDoc(doc(db, 'organizations', orgId, 'notifications', notificationId), {
                          id: notificationId,
                          organizationId: orgId,
                          title: `Impact Occasion: ${newDonation.occasion}`,
                          message: `A special occasion for ${newDonation.visitorName} is scheduled for ${newDonation.occasionDate}. Record this in your outreach calendar.`,
                          type: 'OCCASION',
                          read: false,
                          timestamp: new Date().toISOString(),
                          relatedId: newDonation.visitorPhone
                        });
                      }
                      
                      // Sync to backend
                      fetch('/api/donations', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newDonation)
                      }).catch(err => console.error('Donation sync failed:', err));

                      await logActivity('ADD_DONATION', `Added donation of ₹${donationData.amount} for ${donationData.visitorName}`);
                      addToast('Donation added and synced!', 'success');
                    } catch (error: any) {
                      addToast(error.message || 'Failed to add donation', 'error');
                    } finally {
                      setIsSavingDonation(false);
                    }
                  }}
                  onDeleteDonation={async (donationId) => {
                    const orgId = user?.organizationId;
                    if (!orgId) return;
                    try {
                      // Soft delete donation
                      await updateDoc(doc(db, 'organizations', orgId, 'donations', donationId), {
                        deleted: true,
                        deletedAt: new Date().toISOString(),
                        deletedBy: user?.uid
                      });
                      
                      // Delete from backend
                      fetch(`/api/donations/${donationId}`, {
                        method: 'DELETE'
                      }).catch(err => console.error('Donation deletion sync failed:', err));
                      
                      addToast('Donation record deleted and synced', 'info');
                    } catch (error: any) {
                      addToast(error.message, 'error');
                    }
                  }}
                  onUpdateDonation={async (donationId, data) => {
                    const orgId = user?.organizationId;
                    if (!orgId || !user) return;
                    try {
                      const donationRef = doc(db, 'organizations', orgId, 'donations', donationId);
                      const currentSnap = await getDoc(donationRef);
                      const currentData = currentSnap.data() as Donation;

                      const auditEntry: DonationAuditEntry = {
                        action: 'UPDATE',
                        userId: user.uid,
                        userName: user.name,
                        timestamp: new Date().toISOString(),
                        changes: Object.keys(data).reduce((acc, key) => {
                          if (JSON.stringify(currentData[key as keyof Donation]) !== JSON.stringify(data[key as keyof any])) {
                            acc[key] = { from: currentData[key as keyof Donation], to: data[key as keyof any] };
                          }
                          return acc;
                        }, {} as any)
                      };

                      await updateDoc(donationRef, { 
                        ...data, 
                        updatedAt: new Date().toISOString(),
                        auditLog: arrayUnion(auditEntry)
                      });
                      
                      const updatedDonationSnap = await getDoc(donationRef);
                      if (updatedDonationSnap.exists()) {
                        fetch(`/api/donations/${donationId}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(updatedDonationSnap.data())
                        }).catch(err => console.error('Donation update sync failed:', err));
                      }
                      
                      addToast('Donation updated and audit record saved!', 'success');
                    } catch (error: any) {
                      addToast(error.message, 'error');
                    }
                  }}
                  onUpdateOrganization={handleUpdateOrganization}
                />
            </motion.div>
          )}

          {activeTab === 'users' && (user?.role === 'ADMIN' || user?.role === 'MASTER_ADMIN') && (
            <motion.div
              key="users"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 sm:space-y-8 pb-20 sm:pb-0"
            >
              {!organization ? (
                <div className="bg-white rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-20 flex flex-col items-center justify-center border border-slate-100 shadow-sm">
                  <Loader2 className="h-10 w-10 animate-spin text-brand-blue mb-4" />
                  <p className="text-slate-500 font-bold tracking-tight uppercase text-[10px]">Resolving Authorization Matrix...</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 sm:gap-8">
                    <div className="flex items-start sm:items-center gap-4 sm:gap-6 flex-1 min-w-0">
                      <motion.button 
                        whileHover={{ x: -4 }}
                        onClick={() => setActiveTab('settings')}
                        className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-brand-blue hover:text-white transition-all shadow-sm group shrink-0 mt-1 sm:mt-0"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </motion.button>
                      <div className="min-w-0 flex-1">
                        <HeaderTitle 
                          title="Access Control" 
                          subtitle="Manage authorized staff, roles and system permissions" 
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleInviteUser}
                      className="w-full xl:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-brand-blue text-white font-bold rounded-2xl shadow-xl shadow-blue-500/10 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-95 text-xs sm:text-sm shrink-0"
                    >
                      <UserPlus className="h-5 w-5" />
                      Add Member Access
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-8">
                    {/* Active Members */}
                    <div className="bg-white rounded-3xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                      <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
                        <div className="flex items-center gap-4">
                          <h3 className="text-sm font-bold text-slate-900">Active Workspace Members</h3>
                          <span className="px-3 py-1 bg-blue-50 text-brand-blue rounded-lg text-[10px] font-bold tracking-widest uppercase">
                            {orgUsers.filter(u => u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) || u.email?.toLowerCase().includes(userSearchQuery.toLowerCase())).length} Members
                          </span>
                        </div>
                        <div className="relative w-full sm:w-64 animate-in slide-in-from-top-1">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder="Search members..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-brand-blue/30 transition-all outline-none text-xs font-bold"
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>
                  <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50">
                          <th className="px-4 sm:px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">User Identity</th>
                          <th className="px-4 sm:px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Authorization Level</th>
                          <th className="px-4 sm:px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Joined Date</th>
                          <th className="px-4 sm:px-8 py-5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...orgUsers]
                          .filter(u => u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) || u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()))
                          .sort((a,b) => (['ADMIN', 'MASTER_ADMIN'].includes(b.role) ? 1 : -1)).map((m) => (
                          <tr key={m.uid} className="group border-b border-slate-50 last:border-0 hover:bg-blue-50/30 transition-all duration-300">
                            <td className="px-4 sm:px-8 py-6">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-brand-blue border border-slate-200 transition-all duration-300">
                                  {m.name?.charAt(0) || '?'}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold tracking-tight text-slate-900 truncate">{m.name}</p>
                                    {m.uid === organization?.createdBy && (
                                      <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[8px] font-black uppercase tracking-tighter border border-amber-100 flex items-center gap-1 shadow-sm shrink-0">
                                        <Shield className="h-2 w-2 fill-current" />
                                        Admin
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest truncate">{m.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-8 py-6 text-center">
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${
                                (m.uid === organization?.createdBy || ['ADMIN', 'MASTER_ADMIN'].includes(m.role))
                                  ? 'bg-blue-50 text-brand-blue border border-blue-100' 
                                  : 'bg-slate-50 text-slate-400 border border-slate-100'
                              }`}>
                                {m.uid === organization?.createdBy ? 'MASTER_ADMIN' : m.role}
                              </span>
                            </td>
                            <td className="px-4 sm:px-8 py-6 text-center text-[10px] font-bold text-slate-500">
                                {m.createdAt ? new Date(m.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                            </td>
                            <td className="px-4 sm:px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  disabled={
                                    m.uid === user?.uid || 
                                    m.uid === organization?.createdBy || 
                                    m.role === 'MASTER_ADMIN' ||
                                    !(user?.role === 'MASTER_ADMIN' || user?.uid === organization?.createdBy)
                                  }
                                  onClick={() => handleToggleUserRole(m)}
                                  className="p-2.5 text-slate-400 hover:text-brand-blue hover:bg-white rounded-lg transition-all disabled:opacity-30 border border-transparent hover:border-slate-100"
                                  title={
                                    m.uid === organization?.createdBy || m.role === 'MASTER_ADMIN' 
                                      ? "Primary Authority Immutable" 
                                      : !(user?.role === 'MASTER_ADMIN' || user?.uid === organization?.createdBy)
                                        ? "Only Primary Authority can manage roles"
                                        : "Change Permission Level"
                                  }
                                >
                                  <Shield className="h-4 w-4" />
                                </button>
                                <button
                                  disabled={
                                    m.uid === user?.uid || 
                                    m.uid === organization?.createdBy || 
                                    m.role === 'MASTER_ADMIN' ||
                                    (!(user?.role === 'MASTER_ADMIN' || user?.uid === organization?.createdBy) && m.role === 'ADMIN')
                                  }
                                  onClick={() => handleRemoveMember(m)}
                                  className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all disabled:opacity-30 border border-transparent hover:border-slate-100"
                                  title={
                                    m.uid === organization?.createdBy || m.role === 'MASTER_ADMIN' 
                                      ? "Primary Authority Immutable" 
                                      : (!(user?.role === 'MASTER_ADMIN' || user?.uid === organization?.createdBy) && m.role === 'ADMIN')
                                        ? "Only Primary Authority can revoke Admins"
                                        : "Revoke Access"
                                  }
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Active Members Mobile Cards Layout */}
                  <div className="md:hidden divide-y divide-slate-100 bg-white">
                    {[...orgUsers]
                      .filter(u => u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) || u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()))
                      .sort((a,b) => (['ADMIN', 'MASTER_ADMIN'].includes(b.role) ? 1 : -1)).map((m) => (
                      <div key={m.uid} className="p-4 sm:p-6 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-brand-blue border border-slate-200 shrink-0">
                              {m.name?.charAt(0) || '?'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold tracking-tight text-slate-900 truncate">{m.name}</p>
                                {m.uid === organization?.createdBy && (
                                  <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[8px] font-black uppercase tracking-tighter border border-amber-100 flex items-center gap-1 shadow-sm shrink-0">
                                    <Shield className="h-2 w-2 fill-current" />
                                    Master Admin
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest truncate">{m.email}</p>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest shrink-0 ${
                            (m.uid === organization?.createdBy || ['ADMIN', 'MASTER_ADMIN'].includes(m.role))
                              ? 'bg-blue-50 text-brand-blue border border-blue-100' 
                              : 'bg-slate-50 text-slate-400 border border-slate-100'
                          }`}>
                            {m.uid === organization?.createdBy ? 'MASTER_ADMIN' : m.role}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Joined: <span className="text-slate-600 font-medium">{m.createdAt ? new Date(m.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              disabled={
                                m.uid === user?.uid || 
                                m.uid === organization?.createdBy || 
                                m.role === 'MASTER_ADMIN' ||
                                !(user?.role === 'MASTER_ADMIN' || user?.uid === organization?.createdBy)
                              }
                              onClick={() => handleToggleUserRole(m)}
                              className="p-2 text-slate-400 hover:text-brand-blue hover:bg-slate-50 rounded-lg transition-all disabled:opacity-30 border border-slate-100"
                              title="Permission Level"
                            >
                              <Shield className="h-4 w-4" />
                            </button>
                            <button
                              disabled={
                                m.uid === user?.uid || 
                                m.uid === organization?.createdBy || 
                                m.role === 'MASTER_ADMIN' ||
                                (!(user?.role === 'MASTER_ADMIN' || user?.uid === organization?.createdBy) && m.role === 'ADMIN')
                              }
                              onClick={() => handleRemoveMember(m)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-all disabled:opacity-30 border border-slate-100"
                              title="Revoke Access"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pre-approved Access */}
                {orgInvitations.length > 0 && (
                  <div className="bg-white rounded-3xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div className="flex items-center gap-4">
                        <h3 className="text-sm font-bold text-slate-900">Authorized Access (Pending Login)</h3>
                        <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-bold tracking-widest uppercase">
                          {orgInvitations.filter(inv => !orgUsers.some(u => u.email?.toLowerCase() === inv.email?.toLowerCase())).length} Pending
                        </span>
                      </div>
                    </div>
                    <div className="overflow-x-auto hidden md:block">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50/20">
                            <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Entry Permission Identifier</th>
                            <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Designated Level</th>
                            <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Auth Date</th>
                            <th className="px-8 py-5 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orgInvitations
                            .filter(inv => !orgUsers.some(u => u.email?.toLowerCase() === inv.email?.toLowerCase()))
                            .map((inv) => (
                            <tr key={inv.email} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                    <Mail className="h-5 w-5 text-brand-blue" />
                                  </div>
                                  <p className="font-bold text-slate-900 tracking-tight">{inv.email}</p>
                                </div>
                              </td>
                              <td className="px-8 py-6 text-center">
                                <span className="px-3 py-1 bg-slate-50 text-slate-400 border border-slate-100 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                                  {inv.role}
                                </span>
                              </td>
                              <td className="px-8 py-6 text-center text-[10px] font-bold text-slate-500">
                                {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-8 py-6 text-right">
                                <button
                                  onClick={() => handleCancelInvitation(inv.email)}
                                  className="p-2.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-white border border-transparent hover:border-slate-100"
                                  title="Revoke Permission"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pre-approved Mobile Cards Layout */}
                    <div className="md:hidden divide-y divide-slate-100 bg-white">
                      {orgInvitations
                        .filter(inv => !orgUsers.some(u => u.email?.toLowerCase() === inv.email?.toLowerCase()))
                        .map((inv) => (
                        <div key={inv.email} className="p-6 space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                                <Mail className="h-5 w-5 text-brand-blue" />
                              </div>
                              <p className="font-bold text-slate-900 tracking-tight truncate min-w-0">{inv.email}</p>
                            </div>
                            <span className="px-2.5 py-1 bg-slate-50 text-slate-400 border border-slate-100 rounded-lg text-[9px] font-bold uppercase tracking-widest shrink-0">
                              {inv.role}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Authorized: <span className="text-slate-600 font-medium">{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'N/A'}</span>
                            </span>
                            <button
                              onClick={() => handleCancelInvitation(inv.email)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 transition-colors rounded-lg border border-slate-100"
                              title="Revoke Permission"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'settings' && (user?.role === 'ADMIN' || user?.role === 'MASTER_ADMIN' || isSuperAdmin) && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-6xl mx-auto space-y-8"
            >
              <div className="bg-white rounded-[2rem] p-6 sm:p-10 shadow-sm border border-slate-100 min-h-[600px]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-slate-50">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Governance</h2>
                    <p className="text-slate-500 font-medium text-sm">Coordinate system accessibility, branding, and terminal security.</p>
                  </div>
                  <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100 overflow-x-auto no-scrollbar max-w-full w-full md:w-auto">
                    {[
                      { id: 'Identity', icon: <Building2 className="h-4 w-4" /> },
                      { id: 'Visibility', icon: <Layout className="h-4 w-4" /> },
                      { id: 'Forms', icon: <Settings2 className="h-4 w-4" /> },
                      { id: 'Security', icon: <Shield className="h-4 w-4" /> }
                    ].map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => setSettingsSubTab(sub.id as any)}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                          settingsSubTab === sub.id 
                            ? 'bg-white text-brand-blue shadow-sm shadow-brand-blue/5 border border-slate-100' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {sub.icon}
                        {sub.id}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {settingsSubTab === 'Identity' && (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-8 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-4">
                          <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                            <Users className="h-7 w-7 text-brand-blue" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Authority Management</h3>
                          <p className="text-slate-500 text-xs font-medium leading-relaxed">Configure organizational hierarchy, system permissions, and verify authorized members.</p>
                          <button 
                            onClick={() => setActiveTab('users')}
                            className="w-full py-4 bg-brand-blue text-white font-bold rounded-xl shadow-lg shadow-blue-500/10 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]"
                          >
                            <Users className="h-4 w-4" /> Manage Users
                          </button>
                        </div>
                        <div className="p-8 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-4">
                          <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                            <History className="h-7 w-7 text-indigo-600" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 tracking-tight">System Logs</h3>
                          <p className="text-slate-500 text-xs font-medium leading-relaxed">Review comprehensive operational history, verification timestamps, and structural modifications.</p>
                          <button 
                            onClick={() => setActiveTab('logs')}
                            className="w-full py-4 bg-white border border-slate-200 text-slate-900 font-bold rounded-xl hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]"
                          >
                            <History className="h-4 w-4" /> View Agreement
                          </button>
                        </div>
                      </div>

                      <div className="p-8 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                              <LayoutDashboard className="h-7 w-7 text-slate-800" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 tracking-tight">Branding & Identity</h3>
                              <p className="text-gray-500 text-sm font-medium">Set your visual presence and core tracking preferences.</p>
                            </div>
                          </div>
                          <button
                            onClick={handleUpdateBranding}
                            className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200 flex items-center gap-2 uppercase tracking-widest text-[10px]"
                          >
                            <Save className="h-4 w-4" /> Save Identity
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Organization Name</label>
                              <div className="relative group">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-brand-blue transition-colors" />
                                <input 
                                  type="text" 
                                  className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-brand-blue focus:ring-8 focus:ring-brand-blue/5 transition-all"
                                  value={organization?.name || ''}
                                  onChange={(e) => setOrganization(prev => prev ? { ...prev, name: e.target.value } : null)}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Brand Palette color</label>
                              <div className="flex gap-3">
                                <input 
                                  type="color" 
                                  className="h-14 w-14 rounded-xl border-4 border-white shadow-md cursor-pointer shrink-0"
                                  value={organization?.brandColor || '#2563eb'}
                                  onChange={(e) => setOrganization(prev => prev ? { ...prev, brandColor: e.target.value } : null)}
                                />
                                <input 
                                  type="text" 
                                  className="flex-1 px-4 py-4 bg-white border border-slate-200 rounded-xl font-mono text-sm font-bold uppercase tracking-widest"
                                  value={organization?.brandColor || '#2563eb'}
                                  onChange={(e) => setOrganization(prev => prev ? { ...prev, brandColor: e.target.value } : null)}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-6">
                            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 bg-pink-50 rounded-xl flex items-center justify-center"><Gift className="h-5 w-5 text-pink-500" /></div>
                                  <h4 className="text-sm font-bold text-slate-900">Birthday Tracking</h4>
                                </div>
                                <button
                                  onClick={async () => {
                                    const newValue = !isBirthdayTrackingEnabled;
                                    setIsBirthdayTrackingEnabled(newValue);
                                    if (organization) {
                                      try {
                                        const orgRef = doc(db, 'organizations', organization.id);
                                        await updateDoc(orgRef, { birthdayTrackingEnabled: newValue });
                                        addToast(`Birthday tracking ${newValue ? 'enabled' : 'disabled'}`, 'success');
                                      } catch (err) { addToast('Failed to sync tracking setting', 'error'); }
                                    }
                                  }}
                                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${isBirthdayTrackingEnabled ? 'bg-pink-500' : 'bg-slate-200'}`}
                                >
                                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isBirthdayTrackingEnabled ? 'translate-x-[1.375rem]' : 'translate-x-1'}`} />
                                </button>
                              </div>
                              <p className="text-xs text-slate-500 font-medium leading-relaxed">Highlight visitor birthdays and anniversaries automatically on the main dashboard.</p>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Google Review URL</label>
                              <div className="relative group">
                                <Star className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-brand-blue transition-colors" />
                                <input 
                                  type="text" 
                                  className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-brand-blue focus:ring-8 focus:ring-brand-blue/5 transition-all"
                                  value={organization?.googleReviewUrl || ''}
                                  onChange={(e) => setOrganization(prev => prev ? { ...prev, googleReviewUrl: e.target.value } : null)}
                                  placeholder="https://g.page/r/YOUR_ID/review"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {settingsSubTab === 'Visibility' && (
                    <div className="space-y-8">
                      <div className="p-8 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100/50">
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                              <Layout className="h-7 w-7 text-indigo-600" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 tracking-tight">Navigation & Tab Visibility</h3>
                              <p className="text-gray-500 text-sm font-medium">Control which tabs are visible to Staff members. Admins always see all tabs.</p>
                            </div>
                          </div>
                          <button 
                            onClick={async () => {
                              if (!organization) return;
                              try {
                                const orgRef = doc(db, 'organizations', organization.id);
                                await updateDoc(orgRef, { navigationVisibility: organization.navigationVisibility || {} });
                                addToast('Navigation visibility updated!', 'success');
                              } catch (err) { addToast('Failed to update navigation', 'error'); }
                            }}
                            className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200 flex items-center gap-3 uppercase tracking-widest text-[10px]"
                          >
                            <Save className="h-4 w-4" /> Save Visibility
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {['Home', 'Entry', 'Inquiries', 'Records', 'Analysis', 'Birthday', 'Reviews', 'Logs', 'Profile', 'Donations', 'Pre-Reg', 'Support'].map((tabName) => (
                            <label key={tabName} className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer group ${organization?.navigationVisibility?.[tabName] !== false ? 'bg-white border-brand-blue shadow-sm shadow-brand-blue/5' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                              <input 
                                type="checkbox"
                                checked={organization?.navigationVisibility?.[tabName] !== false}
                                onChange={(e) => {
                                  const currentVisibility = organization?.navigationVisibility || {};
                                  setOrganization(prev => prev ? {
                                    ...prev,
                                    navigationVisibility: { ...currentVisibility, [tabName]: e.target.checked }
                                  } : null);
                                }}
                                className="peer sr-only"
                              />
                              <div className="h-6 w-6 bg-white border-2 border-slate-200 rounded-lg group-hover:border-brand-blue transition-all peer-checked:bg-brand-blue peer-checked:border-brand-blue flex items-center justify-center">
                                <motion.div initial={false} animate={{ scale: organization?.navigationVisibility?.[tabName] !== false ? 1 : 0 }} className="h-2.5 w-2.5 bg-white rounded-[2px]" />
                              </div>
                              <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">{tabName}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsSubTab === 'Forms' && (
                    <div className="space-y-8">
                      <div className="p-8 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100/50">
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                              <Settings2 className="h-7 w-7 text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 tracking-tight">Visitor Form Customization</h3>
                              <p className="text-gray-500 text-sm font-medium">Add or remove options from the purpose and category lists.</p>
                            </div>
                          </div>
                          <button 
                            onClick={async () => {
                              if (!organization) return;
                              try {
                                const orgRef = doc(db, 'organizations', organization.id);
                                await updateDoc(orgRef, {
                                  visitPurposes: organization.visitPurposes || [...PURPOSES],
                                  visitorCategories: organization.visitorCategories || [...TYPES],
                                  donationOccasions: organization.donationOccasions || [...DEFAULT_DONATION_OCCASIONS],
                                  eventOccasions: organization.eventOccasions || [...DEFAULT_EVENT_OCCASIONS]
                                });
                                addToast('Form customization saved', 'success');
                              } catch (err) { addToast('Failed to save settings', 'error'); }
                            }}
                            className="px-8 py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all active:scale-95 shadow-xl shadow-emerald-100 flex items-center gap-3 uppercase tracking-widest text-[10px]"
                          >
                            <Save className="h-4 w-4" /> Confirm Selection
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-5">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Visit Purpose Index</h4>
                            <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-3 custom-scrollbar">
                              {(organization?.visitPurposes || PURPOSES).map((p, i) => (
                                <motion.div layout key={i} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl group">
                                  <span className="text-xs font-bold text-slate-700">{p}</span>
                                  <button onClick={() => {
                                    const current = organization?.visitPurposes || [...PURPOSES];
                                    setOrganization(prev => prev ? { ...prev, visitPurposes: current.filter((_, idx) => idx !== i) } : null);
                                  }} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="h-4 w-4" /></button>
                                </motion.div>
                              ))}
                            </div>
                            <div className="flex gap-2 bg-white p-2 rounded-[1.25rem] border border-slate-200 shadow-sm">
                              <input type="text" placeholder="Add new purpose..." className="flex-1 px-4 py-2 bg-transparent text-xs font-bold text-slate-900 outline-none" value={newPurpose} onChange={(e) => setNewPurpose(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddPurpose()} />
                              <button onClick={handleAddPurpose} className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all active:scale-95"><Plus className="h-4 w-4" /></button>
                            </div>
                          </div>
                          <div className="space-y-5">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Visitor Category Index</h4>
                            <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-3 custom-scrollbar">
                              {(organization?.visitorCategories || TYPES).map((t, i) => (
                                <motion.div layout key={i} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl group">
                                  <span className="text-xs font-bold text-slate-700">{t}</span>
                                  <button onClick={() => {
                                    const current = organization?.visitorCategories || [...TYPES];
                                    setOrganization(prev => prev ? { ...prev, visitorCategories: current.filter((_, idx) => idx !== i) } : null);
                                  }} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="h-4 w-4" /></button>
                                </motion.div>
                              ))}
                            </div>
                            <div className="flex gap-2 bg-white p-2 rounded-[1.25rem] border border-slate-200 shadow-sm">
                              <input type="text" placeholder="Add new category..." className="flex-1 px-4 py-2 bg-transparent text-xs font-bold text-slate-900 outline-none" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()} />
                              <button onClick={handleAddCategory} className="p-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all active:scale-95"><Plus className="h-4 w-4" /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsSubTab === 'Security' && (
                    <div className="space-y-10">
                      {/* Premium Cloud Sync & Integrations Section */}
                      <GoogleIntegration 
                        googleStatus={googleConfig}
                        availableSheets={availableSheets}
                        availableCalendars={availableCalendars}
                        isFetchingSheets={isFetchingSheets}
                        isFetchingCalendars={isFetchingCalendars}
                        isSyncingGoogle={isSyncingGoogle}
                        onConnectGoogle={connectGoogle}
                        onDisconnectGoogle={disconnectGoogle}
                        onSelectSheet={selectExistingSheet}
                        onCreateSheet={createNewSheet}
                        onSelectCalendar={selectExistingCalendar}
                        onCreateCalendar={createNewCalendar}
                        onSyncNow={triggerGoogleSync}
                        onRefreshLists={() => {
                          fetchAvailableSheets();
                          fetchAvailableCalendars();
                        }}
                      />

                      <div className="p-5 sm:p-8 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-6 sm:space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100/50">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 sm:h-14 sm:w-14 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                               <Lock className="h-6 w-6 sm:h-7 sm:w-7 text-amber-600" />
                            </div>
                            <div>
                              <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Kiosk Security</h3>
                              <p className="text-gray-500 text-xs sm:text-sm font-medium">Protect your kiosk from unauthorized exits.</p>
                            </div>
                          </div>
                          <button 
                            onClick={async () => {
                              if (!organization) return;
                              try {
                                const orgRef = doc(db, 'organizations', organization.id);
                                await updateDoc(orgRef, { kioskPin: kioskPin });
                                addToast('Kiosk PIN updated successfully!', 'success');
                              } catch (err) { addToast('Failed to update PIN', 'error'); }
                            }}
                            className="w-full md:w-auto px-8 py-3.5 sm:py-4 bg-amber-600 text-white font-black rounded-2xl hover:bg-amber-700 transition-all active:scale-95 shadow-xl shadow-amber-100 uppercase tracking-widest text-[10px]"
                          >
                            <Save className="h-4 w-4" /> Save Security PIN
                          </button>
                        </div>
                        <div className="max-w-md space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Terminal Exit Authorization PIN</label>
                          <div className="relative group">
                            <Lock className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                            <input 
                              type={showKioskPin ? "text" : "password"}
                              maxLength={6}
                              placeholder="••••"
                              className="w-full pl-12 sm:pl-16 pr-14 sm:pr-16 py-4 sm:py-6 bg-white border border-slate-200 rounded-2xl sm:rounded-[1.5rem] font-black text-slate-900 text-2xl sm:text-4xl tracking-[0.5em] outline-none focus:border-amber-500 focus:ring-8 sm:focus:ring-[12px] focus:ring-amber-500/5 transition-all shadow-sm"
                              value={kioskPin}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                if (val.length <= 6) {
                                  setKioskPin(val);
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowKioskPin(!showKioskPin)}
                              className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-slate-600 transition-all flex items-center justify-center rounded-xl"
                            >
                              {showKioskPin ? <EyeOff className="h-5 w-5 sm:h-6 sm:w-6" /> : <Eye className="h-5 w-5 sm:h-6 sm:w-6" />}
                            </button>
                          </div>
                          <div className="p-4 sm:p-6 bg-amber-50/50 rounded-2xl sm:rounded-3xl border border-amber-100 flex gap-4">
                            <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                              This PIN is required to deactivate the terminal session. Keep it secure and share only with authorized administrators.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-8 bg-red-50/20 rounded-[2.5rem] border border-red-100 space-y-8">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 bg-red-100 rounded-2xl flex items-center justify-center shadow-sm">
                            <Shield className="h-7 w-7 text-red-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-red-900 italic tracking-tight uppercase">Danger Zone</h3>
                            <p className="text-red-700/60 text-xs font-medium uppercase tracking-widest">Irreversible system termination protocols.</p>
                          </div>
                        </div>
                        <div className="p-8 bg-white border border-red-100 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-8">
                          <div className="space-y-2 text-center md:text-left">
                            <h4 className="text-sm font-black text-gray-900 uppercase italic tracking-tight">Organization Access Level</h4>
                            <p className="text-xs text-gray-500 font-medium max-w-md leading-relaxed">Terminate all operational activity for this node. Historical data remains securely archived.</p>
                          </div>
                          <button 
                            onClick={handleDeactivateOrganization}
                            className="px-10 py-5 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all active:scale-95 shadow-xl shadow-red-100 flex items-center gap-3"
                          >
                            <Trash2 className="h-4 w-4" /> Deactivate System
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          
          {activeTab === 'legal' && (
            <motion.div
              key="legal"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <LegalCenter 
                organizationName={organization?.name} 
                initialView={legalSubView}
                onOpenFeedback={() => setShowAppFeedback(true)}
                onOpenBugReport={() => setShowBugReport(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
            <div className="h-8 w-8 bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden">
              {organization?.logoUrl ? (
                <img src={organization.logoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-white text-xs font-semibold italic">
                  {organization?.name ? organization.name.substring(0, 2).toUpperCase() : 'ORG'}
                </span>
              )}
            </div>
            <span className="font-semibold text-gray-900 tracking-tight">{organization?.name || 'Organization'}</span>
          </div>
          <p className="text-gray-400 text-sm font-medium">
            &copy; {new Date().getFullYear()} {organization?.name || 'Organization'}. All rights reserved.
          </p>
          <div className="flex gap-6 text-gray-400 text-xs font-bold uppercase tracking-widest">
            <button onClick={() => { setLegalSubView('privacy'); setActiveTab('legal'); }} className="hover:text-brand-blue transition-colors cursor-pointer">Privacy</button>
            <button onClick={() => { setLegalSubView('terms'); setActiveTab('legal'); }} className="hover:text-brand-blue transition-colors cursor-pointer">Terms</button>
            <button onClick={() => { setLegalSubView('support'); setActiveTab('legal'); }} className="hover:text-brand-blue transition-colors cursor-pointer">Support</button>
          </div>
        </div>
      </footer>
    </div>
  )}

      {/* Modals */}
      <AnimatePresence>
        {showEmergencyForm && (
          <EmergencyForm
            onClose={() => setShowEmergencyForm(false)}
            onSave={handleEmergencyEntry}
            existingVisitors={visitors}
            isSaving={isSaving}
            customPurposes={organization?.visitPurposes}
            customTypes={organization?.visitorCategories}
            organizationId={organization?.id}
            onUpdateOrganization={handleUpdateOrganization}
          />
        )}
        {showForm && (
          <VisitorForm
            onClose={handleCloseForm}
            onSave={saveVisitor}
            initialData={editingVisitor}
            existingVisitors={visitors}
            isSaving={isSaving}
            customPurposes={organization?.visitPurposes}
            customCategories={organization?.visitorCategories}
            donationOccasions={organization?.donationOccasions}
            eventOccasions={organization?.eventOccasions}
            organizationName={organization?.name}
            organizationId={organization?.id}
          />
        )}
        {showAppFeedback && (
          <AppFeedbackModal 
            onClose={() => setShowAppFeedback(false)} 
            userId={user?.uid}
            organizationId={user?.organizationId}
          />
        )}
        {showBugReport && (
          <BugReportModal 
            onClose={() => setShowBugReport(false)} 
            userId={user?.uid}
            organizationId={user?.organizationId}
          />
        )}
         {showTermsAcceptance && (
          <LegalAcceptanceModal
            organizationName={organization?.name}
            onAccept={async () => {
              if (user?.uid) {
                localStorage.setItem(`vms_legal_accepted_${user.uid}`, 'true');
              }
              if (organization?.id && (user?.role === 'ADMIN' || user?.role === 'MASTER_ADMIN' || isSuperAdminValue)) {
                try {
                  await updateDoc(doc(db, 'organizations', organization.id), {
                    legalAccepted: true
                  });
                } catch (err) {
                  console.error('Failed to accept legal terms:', err);
                }
              }
              setShowTermsAcceptance(false);
              addToast('Welcome to the workspace. Legal conditions accepted.', 'success');
            }}
            onClose={() => setShowTermsAcceptance(false)}
          />
        )}
        {showPassForVisitor && (
          <div className="fixed inset-0 z-[10000] bg-slate-950/60 backdrop-blur-md overflow-y-auto py-8 sm:py-12 flex justify-center items-start">
            <VisitorPass 
              visitor={showPassForVisitor} 
              organization={organization}
              onClose={() => setShowPassForVisitor(null)}
              onCheckOut={async () => {
                 setShowPassForVisitor(null);
                 await checkOutVisitor(showPassForVisitor.visitorId || showPassForVisitor.visitId);
              }}
            />
          </div>
        )}
        {showPrintablePass && organization && (
          <PrintablePassModal
            visitor={showPrintablePass}
            organization={organization}
            onClose={() => setShowPrintablePass(null)}
          />
        )}
        {showPrintableBatchPass && organization && (
          <PrintableBatchPassModal
            visitors={showPrintableBatchPass}
            organization={organization}
            onClose={() => setShowPrintableBatchPass(null)}
          />
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      {reviewVisitor && (
        <ReviewModal
          visitorName={reviewVisitor.name || reviewVisitor.visitorName}
          visitorId={reviewVisitor.visitorId || reviewVisitor.visitId}
          googleReviewUrl={organization?.googleReviewUrl}
          onClose={() => setReviewVisitor(null)}
          onSave={handleSaveReview}
          lang={isKioskMode ? kioskLang : 'EN'}
          isMandatory={false}
        />
      )}

      <NotificationsCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        organizationId={user?.organizationId || ''}
        addToast={addToast}
      />
    </>
  );
}

function FilterButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap border ${
        active 
          ? 'bg-brand-blue border-brand-blue text-white shadow-lg shadow-blue-500/20' 
          : 'bg-white border-slate-200 text-slate-500 hover:border-brand-blue hover:text-brand-blue dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
      }`}
    >
      {label}
    </button>
  );
}

function StatCard({ title, value, icon, trend, color = 'blue', delay = 0 }: { title: string; value: string | number; icon: React.ReactNode; trend?: string; color?: 'blue' | 'indigo' | 'emerald' | 'purple' | 'amber' | 'rose'; delay?: number }) {
  const accentColors = {
    blue: 'text-blue-500 bg-blue-50/50',
    indigo: 'text-indigo-500 bg-indigo-50/50',
    emerald: 'text-emerald-500 bg-emerald-50/50',
    purple: 'text-purple-500 bg-purple-50/50',
    amber: 'text-amber-500 bg-amber-50/50',
    rose: 'text-rose-500 bg-rose-50/50'
  };

  const trendColors = {
    blue: 'text-blue-600 bg-blue-50',
    indigo: 'text-indigo-600 bg-indigo-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    purple: 'text-purple-600 bg-purple-50',
    amber: 'text-amber-600 bg-amber-50',
    rose: 'text-rose-600 bg-rose-50'
  };

  const bgStyles = {
    blue: 'bg-blue-50/50 border-blue-100/50',
    indigo: 'bg-indigo-50/50 border-indigo-100/50',
    emerald: 'bg-emerald-50/50 border-emerald-100/50',
    purple: 'bg-purple-50/50 border-purple-100/50',
    amber: 'bg-amber-50/50 border-amber-100/50',
    rose: 'bg-rose-50/50 border-rose-100/50'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5 }}
      className={`glass-card rounded-[2.5rem] p-8 flex flex-col relative group overflow-hidden ${bgStyles[color]}`}
    >
      {/* Sparkle Beam Effect */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-400/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-[3s]" />
      
      <div className="absolute -right-8 -top-8 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-[2s] pointer-events-none">
        {React.cloneElement(icon as any, { size: 140 })}
      </div>

      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-10 shadow-sm ${accentColors[color]}`}>
        {React.cloneElement(icon as any, { size: 24 })}
      </div>
      
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{title}</h3>
        <div className="flex flex-col gap-3">
          <span className="text-5xl font-bold text-[#051739] tracking-tight">{value}</span>
          {trend && (
            <div className={`inline-flex items-center px-2 py-1 rounded-lg w-fit ${trendColors[color]}`}>
               <span className="text-[9px] font-bold uppercase tracking-widest">{trend}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function HeaderTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 sm:mb-10 text-left relative group">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4 sm:gap-6 md:gap-10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-3 px-3 py-1 bg-brand-blue/5 border border-brand-blue/10 rounded-full mb-2 sm:mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-brand-blue animate-pulse" />
            <span className="text-[9px] sm:text-[10px] font-black text-brand-blue uppercase tracking-widest">Active System Instance</span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-slate-900 tracking-tighter italic uppercase leading-none sm:leading-[0.85] break-words">{title}</h1>
        </div>
        {subtitle && (
          <div className="max-w-md pb-1 sm:pb-2">
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed border-l-2 border-slate-100 pl-4 sm:pl-6">{subtitle}</p>
          </div>
        )}
      </div>
    </div>
  );
}
