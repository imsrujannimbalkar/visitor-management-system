import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Globe, 
  Zap, 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Heart, 
  UserCheck, 
  CheckCircle2, 
  LogOut, 
  Trash2,
  Save,
  Edit2,
  Camera,
  Loader2,
  Clock,
  User,
  Download,
  RefreshCw
} from 'lucide-react';
import Swal from 'sweetalert2';
import GoogleIntegration from './GoogleIntegration';
import { User as UserType, Organization } from '../types';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface ProfileTabProps {
  user: UserType | null;
  organization: Organization | null;
  onUpdateUser?: (updatedUser: Partial<UserType>) => void;
  onLogout?: () => void;
  // Google Integration Props
  googleStatus: { 
    connected: boolean; 
    spreadsheetId?: string | null; 
    calendarId?: string | null;
    birthdayCalendarId?: string | null;
    lastSyncTime?: string | null;
    totalRecordsSynced?: number | null;
    totalEventsSynced?: number | null;
  };
  availableSheets: { id: string; name: string }[];
  availableCalendars: { id: string; summary: string }[];
  isFetchingSheets: boolean;
  isFetchingCalendars: boolean;
  isSyncingGoogle: boolean;
  onConnectGoogle: () => void;
  onDisconnectGoogle: () => void;
  onSelectSheet: (id: string) => void;
  onCreateSheet: () => void;
  onSelectCalendar: (id: string, type?: 'primary' | 'birthday') => void;
  onCreateCalendar: (type?: 'primary' | 'birthday') => void;
  onSyncNow: () => void;
  onRefreshLists: () => void;
  onCreateBackup: () => void;
  onRestoreBackup?: (data: any) => Promise<void>;
  onFetchBackups: () => Promise<any[]>;
}

export default function ProfileTab({ 
  user, 
  organization, 
  onUpdateUser, 
  onLogout,
  googleStatus,
  availableSheets,
  availableCalendars,
  isFetchingSheets,
  isFetchingCalendars,
  isSyncingGoogle,
  onConnectGoogle,
  onDisconnectGoogle,
  onSelectSheet,
  onCreateSheet,
  onSelectCalendar,
  onCreateCalendar,
  onSyncNow,
  onRefreshLists,
  onCreateBackup,
  onRestoreBackup,
  onFetchBackups
}: ProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    photoURL: user?.photoURL || '',
  });

  // Local state for preferences to make toggles interactive
  const [preferences, setPreferences] = useState([
    { id: 'notifs', icon: <Bell size={18} />, label: 'Security Notifications', desc: 'Real-time alerts for visitor check-ins', active: user?.preferences?.notifs ?? true },
    { id: 'public', icon: <Globe size={18} />, label: 'Public Indexing', desc: 'Allow organization search by email', active: user?.preferences?.public ?? false },
    { id: 'density', icon: <Zap size={18} />, label: 'Extreme Density UI', desc: 'Use high-contrast specialized dashboards', active: user?.preferences?.density ?? true }
  ]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        photoURL: user.photoURL || '',
      });
      
      // Sync preferences when user data changes
      setPreferences([
        { id: 'notifs', icon: <Bell size={18} />, label: 'Security Notifications', desc: 'Real-time alerts for visitor check-ins', active: user?.preferences?.notifs ?? true },
        { id: 'public', icon: <Globe size={18} />, label: 'Public Indexing', desc: 'Allow organization search by email', active: user?.preferences?.public ?? false },
        { id: 'density', icon: <Zap size={18} />, label: 'Extreme Density UI', desc: 'Use high-contrast specialized dashboards', active: user?.preferences?.density ?? true }
      ]);
    }
  }, [user]);

  if (!user) return null;

  const togglePreference = async (id: string) => {
    const updatedPrefs = preferences.map(p => p.id === id ? { ...p, active: !p.active } : p);
    setPreferences(updatedPrefs);
    
    // Persist to Firebase
    if (user?.uid && user?.organizationId) {
      try {
        const prefsObj = updatedPrefs.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.active }), {});
        
        // Update both locations to ensure consistency
        const userRef = doc(db, 'users', user.uid);
        const orgUserRef = doc(db, 'organizations', user.organizationId, 'users', user.uid);
        
        await Promise.all([
          updateDoc(userRef, { preferences: prefsObj }),
          updateDoc(orgUserRef, { preferences: prefsObj })
        ]);
        
        if (onUpdateUser) {
          onUpdateUser({ ...user, preferences: prefsObj });
        }
      } catch (err) {
        console.error('Failed to update preference:', err);
      }
    }
  };

  const handleSave = async () => {
    if (!user.uid) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        photoURL: formData.photoURL,
        updatedAt: serverTimestamp()
      });

      if (onUpdateUser) {
        onUpdateUser({
          ...formData,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          uid: user.uid,
          role: user.role
        } as any);
      }

      setIsEditing(false);
      Swal.fire({
        title: 'Profile Updated',
        text: 'Your administrative profile has been successfully synchronized.',
        icon: 'success',
        toast: true,
        position: 'top-right',
        showConfirmButton: false,
        timer: 3000
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      Swal.fire('Error', 'Failed to update profile details', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* High-Fidelity Hero Banner */}
      <div className="relative group">
        <div className="h-[320px] w-full bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#db2777] rounded-[3rem] shadow-2xl overflow-hidden relative p-12 flex items-center justify-between">
          {/* Abstract wavy patterns */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,1000 C300,800 400,900 700,700 C900,550 1000,600 1000,400 L1000,0 L0,0 Z" fill="white" fillOpacity="0.1" />
              <circle cx="80%" cy="20%" r="200" fill="white" fillOpacity="0.05" />
            </svg>
          </div>

          <div className="flex items-center gap-10 relative z-10">
            {/* Styled Profile Image Container */}
            <div className="relative">
              <div className="h-48 w-48 rounded-[2.5rem] bg-[#051739] border-[10px] border-[#0a0a0a]/10 shadow-2xl flex items-center justify-center text-6xl font-black text-white relative overflow-hidden group/avatar">
                {formData.photoURL ? (
                  <img src={formData.photoURL} alt={formData.name} className="w-full h-full object-cover" />
                ) : (
                  formData.name.charAt(0).toUpperCase()
                )}
                <div 
                  onClick={() => {
                    Swal.fire({
                      title: 'Update Identity Image',
                      text: 'Connect a direct asset URL for your avatar',
                      input: 'url',
                      inputPlaceholder: 'https://images.unsplash.com/...',
                      showCancelButton: true,
                      confirmButtonText: 'Sync Avatar',
                      confirmButtonColor: '#4f46e5'
                    }).then((result) => {
                      if (result.isConfirmed && result.value) {
                         setFormData(prev => ({ ...prev, photoURL: result.value }));
                         setIsEditing(true);
                      }
                    });
                  }}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 flex items-center justify-center cursor-pointer"
                >
                  <Camera size={40} className="text-white transform scale-90 group-hover/avatar:scale-100 transition-transform" />
                </div>
              </div>
              {/* On-Grid Status Indicator */}
              <div className="absolute bottom-4 right-4 h-12 w-12 bg-[#051739] rounded-2xl border-4 border-white flex items-center justify-center shadow-2xl">
                 <div className="h-4 w-4 rounded-full bg-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-pulse" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h1 className="text-6xl font-black text-white tracking-tighter italic">{formData.name}</h1>
                <div className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30 flex items-center gap-2">
                   <Shield size={12} className="text-white fill-white" />
                   <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{user.role}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/70 font-bold">
                 <Mail size={20} className="opacity-60" />
                 <span className="text-xl tracking-tight">{formData.email}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10 self-start mt-4">
            {isEditing ? (
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all border border-white/20 backdrop-blur-sm"
                >
                  Discard
                </button>
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="px-8 py-4 bg-white text-[#4f46e5] rounded-2xl font-black hover:bg-blue-50 transition-all shadow-2xl flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  Sync Identity
                </button>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black hover:bg-slate-50 transition-all shadow-2xl flex items-center gap-3 group/btn"
                >
                  <Edit2 size={20} className="group-hover/btn:rotate-12 transition-transform" />
                  Edit Profile
                </button>
                <button className="p-4 bg-[#051739] text-[#7c3aed] rounded-2xl shadow-2xl hover:bg-slate-900 transition-all active:scale-95 border border-white/10 shadow-[0_0_30px_rgba(124,58,237,0.3)]">
                  <Zap size={24} fill="currentColor" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Network Organization', value: organization?.name || 'VMS Global', icon: <Globe size={24} />, color: 'blue' },
          { label: 'Security Privilege', value: user.role === 'ADMIN' ? 'Full Access' : 'Staff Level', icon: <Shield size={24} />, color: 'orange' },
          { label: 'Creation Epoch', value: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '15 Apr 2026', icon: <Calendar size={24} />, color: 'purple' },
          { label: 'Last Intelligence Load', value: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Today, 10:43', icon: <Clock size={24} />, color: 'emerald' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden group hover:shadow-xl transition-all">
             <div className="absolute top-6 right-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                <svg width="60" height="60" viewBox="0 0 100 100">
                  <circle cx="10" cy="10" r="2" fill="currentColor" />
                  <circle cx="30" cy="10" r="2" fill="currentColor" />
                  <circle cx="50" cy="10" r="2" fill="currentColor" />
                  <circle cx="10" cy="30" r="2" fill="currentColor" />
                  <circle cx="30" cy="30" r="2" fill="currentColor" />
                  <circle cx="50" cy="30" r="2" fill="currentColor" />
                  <circle cx="10" cy="50" r="2" fill="currentColor" />
                  <circle cx="30" cy="50" r="2" fill="currentColor" />
                  <circle cx="50" cy="50" r="2" fill="currentColor" />
                </svg>
             </div>
             <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-8 
               ${stat.color === 'blue' ? 'bg-blue-50 text-blue-600' : 
                 stat.color === 'orange' ? 'bg-orange-50 text-orange-600' : 
                 stat.color === 'purple' ? 'bg-purple-50 text-purple-600' : 
                 'bg-emerald-50 text-emerald-600'}`}
             >
               {stat.icon}
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
             <p className="text-xl font-black text-[#051739] tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Specifications Column */}
        <div className="md:col-span-2 space-y-8">
           <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]">
             <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                      <Zap size={20} />
                   </div>
                   <h3 className="text-2xl font-black text-[#051739] italic tracking-tight">Administrative Specifications</h3>
                </div>
                <button 
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  className="text-blue-600 text-xs font-black uppercase tracking-[0.2em] hover:opacity-70 transition-opacity"
                >
                  {isEditing ? 'SYNC NOW' : 'UPDATE DATA'}
                </button>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
                {[
                  { label: 'EMAIL IDENTITY', icon: <Mail size={18} />, value: formData.email, field: 'email', type: 'email' },
                  { label: 'PHONE NODE', icon: <Phone size={18} />, value: formData.phone || 'Not Connected', field: 'phone', type: 'tel' },
                  { label: 'PERSONAL NAME', icon: <User size={18} />, value: formData.name, field: 'name', type: 'text' },
                  { label: 'GEOGRAPHIC LOCATION', icon: <MapPin size={18} />, value: formData.address || 'Remote Terminal', field: 'address', type: 'text' }
                ].map((input, idx) => (
                  <div key={idx} className="space-y-4">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{input.label}</p>
                     <div className={`flex items-center gap-4 p-5 rounded-[1.5rem] transition-all border ${isEditing ? 'bg-white border-blue-200 shadow-lg shadow-blue-50' : 'bg-slate-50/50 border-slate-100'}`}>
                        <div className="text-slate-400">{input.icon}</div>
                        {isEditing ? (
                          <input 
                            type={input.type}
                            className="w-full bg-transparent outline-none text-sm font-bold text-slate-900 placeholder:text-slate-300"
                            value={input.value === 'Not Connected' || input.value === 'Remote Terminal' ? '' : input.value}
                            placeholder={input.label.toLowerCase()}
                            onChange={(e) => setFormData({ ...formData, [input.field]: e.target.value })}
                          />
                        ) : (
                          <span className="text-sm font-bold text-slate-900 truncate">{input.value}</span>
                        )}
                     </div>
                  </div>
                ))}
             </div>
           </div>

           {/* Preferences Card */}
           <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]">
             <div className="flex items-center gap-4 mb-10">
                <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                   <Bell size={20} />
                </div>
                <h3 className="text-2xl font-black text-[#051739] italic tracking-tight">System Preferences</h3>
             </div>
             <div className="space-y-4 border-t border-slate-50">
                {preferences.map((pref) => (
                  <div key={pref.id} className="flex items-center justify-between py-6 group">
                     <div className="flex items-center gap-6">
                        <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                           {pref.icon}
                        </div>
                        <div>
                           <p className="text-base font-black text-slate-900 tracking-tight">{pref.label}</p>
                           <p className="text-sm text-slate-400 font-medium">{pref.desc}</p>
                        </div>
                     </div>
                     <button 
                        onClick={() => togglePreference(pref.id)}
                        className={`w-14 h-7 rounded-full transition-all relative ${pref.active ? 'bg-[#3b82f6]' : 'bg-slate-200'}`}
                     >
                        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${pref.active ? 'left-8' : 'left-1'}`} />
                     </button>
                  </div>
                ))}
             </div>
           </div>

           {/* Premium Google Integrations Section */}
           <GoogleIntegration 
              userEmail={user?.email}
              googleStatus={googleStatus}
              availableSheets={availableSheets}
              availableCalendars={availableCalendars}
              isFetchingSheets={isFetchingSheets}
              isFetchingCalendars={isFetchingCalendars}
              isSyncingGoogle={isSyncingGoogle}
              onConnectGoogle={onConnectGoogle}
              onDisconnectGoogle={onDisconnectGoogle}
              onSelectSheet={onSelectSheet}
              onCreateSheet={onCreateSheet}
              onSelectCalendar={onSelectCalendar}
              onCreateCalendar={onCreateCalendar}
              onSyncNow={onSyncNow}
              onRefreshLists={onRefreshLists}
              autoSyncEnabled={organization?.autoSyncEnabled !== false}
            />
          </div>

          <div className="space-y-8">
            {/* Core Actions Card */}
            <div className="bg-[#fff1f2] border border-rose-100 rounded-[3rem] p-12 shadow-[0_20px_50px_-20px_rgba(225,29,72,0.1)]">
             <div className="flex items-center gap-3 mb-6">
                <Shield size={24} className="text-rose-600" />
                <h3 className="text-2xl font-black text-rose-900 italic">Core Actions</h3>
             </div>
             <p className="text-rose-700/60 text-sm font-medium leading-relaxed mb-10">
               Signing out will terminate your current session. Deleting your profile will permanently remove your administrative access.
             </p>
             <div className="flex gap-4">
                <button
                  onClick={onLogout}
                  className="flex-1 py-5 bg-white text-rose-600 rounded-3xl font-black hover:bg-rose-50 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-sm border border-rose-100"
                >
                  <LogOut size={22} className="rotate-180" />
                  Sign Out
                </button>
                <button
                  onClick={() => {
                   Swal.fire({
                     title: 'TERMINAL ACTION',
                     text: 'Are you absolutely sure you want to delete your identity? This is irreversible.',
                     icon: 'error',
                     showCancelButton: true,
                     confirmButtonColor: '#e11d48',
                     cancelButtonColor: '#64748b',
                     confirmButtonText: 'DELETE IDENTITY'
                   }).then((result) => { if (result.isConfirmed) { /* Logged in deletion logic here */ } });
                  }}
                  className="flex-1 py-5 bg-[#e11d48] text-white rounded-3xl font-black hover:bg-rose-700 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-rose-200"
                >
                  <Trash2 size={22} />
                  Delete Identity
                </button>
             </div>
           </div>

           {/* Support Hub Card */}
           <div className="bg-[#051739] rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden group min-h-[360px] flex flex-col justify-end">
              <div className="absolute top-12 right-12 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-700">
                 <svg width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    <path d="M7 10v4" />
                    <path d="M11 9v6" />
                    <path d="M15 10v4" />
                    <path d="M17 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                 </svg>
              </div>
              <div className="relative z-10 space-y-6">
                <h4 className="text-3xl font-black italic tracking-tighter">Need Intelligence Support?</h4>
                <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-[240px]">
                  Contact our specialized elite auditor team for security clearance issues or organization relocation.
                </p>
                <a 
                  href="mailto:support@vmsglobal.io"
                  className="w-full py-5 bg-white text-slate-900 rounded-3xl font-black hover:bg-blue-50 transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 group/support"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover/support:animate-bounce">
                    <path d="M3 12c0-5 4-9 9-9 4.5 0 8.1 3.2 8.9 7.4" />
                    <path d="M4.5 18c.8-1.2 2-2 3.5-2h8c1.5 0 2.7.8 3.5 2" />
                    <path d="M12 18v3" />
                  </svg>
                  Contact Support Hub
                </a>
              </div>
           </div>
            {/* Data Management Card */}
            <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-4 mb-10">
                 <div className="h-10 w-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                    <Download size={20} />
                 </div>
                 <h3 className="text-2xl font-black text-[#051739] italic tracking-tight">Data Management</h3>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={onCreateBackup}
                  className="flex-1 py-5 bg-[#0F9D58] text-white rounded-3xl font-black hover:bg-[#0B8043] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-sm border border-[#0F9D58]"
                >
                  <RefreshCw size={20} />
                  Create Backup
                </button>
                <button
                  onClick={async () => {
                    const backups = await onFetchBackups();
                    if (backups.length === 0) {
                      Swal.fire('No Backups', 'No previous backups found.', 'info');
                      return;
                    }
                    // Sort backups by timestamp in filename (visitor-data-ORGID-YYYY-MM-DDTHH-MM-SS.json)
                    const sorted = [...backups].sort((a, b) => b.name.localeCompare(a.name));
                    const latest = sorted[0];
                    
                    // Create a temporary link to download properly
                    const link = document.createElement('a');
                    link.href = latest.url;
                    link.download = latest.name;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    Swal.fire({
                      title: 'Download Started',
                      text: `Downloading ${latest.name}`,
                      icon: 'success',
                      timer: 2000,
                      showConfirmButton: false
                    });
                  }}
                  className="flex-1 py-5 bg-white text-slate-700 rounded-3xl font-black hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-sm border border-slate-200"
                >
                  <Download size={20} />
                  Latest Backup
                </button>
              </div>

              {/* Restore Section - Advanced */}
              {onRestoreBackup && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#051739]/30 mb-4 px-2">Disaster Recovery (Advanced)</p>
                  <label className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all border-2 border-dashed border-slate-200 group">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-500 shadow-sm">
                        <Save size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">Emergency Restore</span>
                        <span className="text-[10px] font-medium text-slate-400">Upload JSON backup to overwrite local state</span>
                      </div>
                    </div>
                    <input 
                      type="file" 
                      accept=".json" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = async (event) => {
                            try {
                              const data = JSON.parse(event.target?.result as string);
                              await onRestoreBackup(data);
                            } catch (err) {
                              Swal.fire('Parsing Failed', 'Invalid JSON backup file.', 'error');
                            }
                          };
                          reader.readAsText(file);
                        }
                      }}
                    />
                    <div className="px-4 py-2 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 rounded-full border border-slate-200 shadow-sm">
                      Select File
                    </div>
                  </label>
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}

