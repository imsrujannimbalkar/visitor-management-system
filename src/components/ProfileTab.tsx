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
import { User as UserType, Organization } from '../types';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface ProfileTabProps {
  user: UserType | null;
  organization: Organization | null;
  onUpdateUser?: (updatedUser: Partial<UserType>) => void;
  onLogout?: () => void;
  hasMultiOrg?: boolean;
  onSwitchWorkspace?: () => void;
  onRestoreBackup?: (data: any) => Promise<void>;
  onFetchBackups: () => Promise<any[]>;
  onCreateBackup: () => void;
}

export default function ProfileTab({ 
  user, 
  organization, 
  onUpdateUser, 
  onLogout,
  hasMultiOrg,
  onSwitchWorkspace,
  onCreateBackup,
  onRestoreBackup,
  onFetchBackups
}: ProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState<any[]>([]);
  const [isFetchingBackups, setIsFetchingBackups] = useState(false);
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

  // Initial fetch of backups
  useEffect(() => {
    loadBackups();
  }, [organization?.id]);

  const loadBackups = async () => {
    if (user?.role !== 'ADMIN' && user?.role !== 'MASTER_ADMIN') return;
    setIsFetchingBackups(true);
    try {
      const data = await onFetchBackups();
      setBackups(data);
    } catch (err) {
    } finally {
      setIsFetchingBackups(false);
    }
  };

  if (!user) return null;

  const downloadBackup = (backup: any) => {
    // Fallback to in-memory JSON as storage is disabled for this project
    const dataStr = JSON.stringify(backup.data || backup, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `backup-${organization?.id}-${backup.timestamp || Date.now()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    Swal.fire({
      title: 'Download Started',
      text: `Opening snapshot from ${new Date(backup.timestamp).toLocaleString()}`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
  };

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
        position: 'center',
        showConfirmButton: false,
        timer: 3000
      });
    } catch (error) {
      Swal.fire('Error', 'Failed to update profile details', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 sm:px-6">
      {/* High-Fidelity Hero Banner */}
      <div className="relative group">
        <div className="min-h-[320px] lg:h-[320px] w-full bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#db2777] rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden relative p-8 sm:p-12 flex flex-col lg:flex-row items-center lg:justify-between justify-center gap-8">
          {/* Abstract wavy patterns */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,1000 C300,800 400,900 700,700 C900,550 1000,600 1000,400 L1000,0 L0,0 Z" fill="white" fillOpacity="0.1" />
              <circle cx="80%" cy="20%" r="200" fill="white" fillOpacity="0.05" />
            </svg>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 relative z-10 text-center sm:text-left">
            {/* Styled Profile Image Container */}
            <div className="relative flex-shrink-0">
              <div className="h-32 w-32 sm:h-48 sm:w-48 rounded-[2rem] sm:rounded-[2.5rem] bg-[#051739] border-[6px] sm:border-[10px] border-[#0a0a0a]/10 shadow-2xl flex items-center justify-center text-4xl sm:text-6xl font-black text-white relative overflow-hidden group/avatar">
                {formData.photoURL ? (
                  <img src={formData.photoURL} alt={formData.name} className="w-full h-full object-cover" />
                ) : (
                  (formData.name || 'U').charAt(0).toUpperCase()
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
                  <Camera size={32} className="text-white transform scale-90 group-hover/avatar:scale-100 transition-transform" />
                </div>
              </div>
              {/* On-Grid Status Indicator */}
              <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 h-10 w-10 sm:h-12 sm:w-12 bg-[#051739] rounded-xl sm:rounded-2xl border-4 border-white flex items-center justify-center shadow-2xl">
                 <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-pulse" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white tracking-tighter italic break-all max-w-full">{formData.name}</h1>
                <div className="flex flex-col gap-2 items-center sm:items-start">
                  <div className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30 flex items-center gap-2 self-start">
                     <Shield size={12} className="text-white fill-white" />
                     <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{user.role}</span>
                  </div>
                  {(user.uid === organization?.createdBy || user.role === 'MASTER_ADMIN') && (
                    <div className="px-4 py-1.5 bg-amber-400/20 backdrop-blur-md rounded-full border border-amber-400/30 flex items-center gap-2 self-start ring-1 ring-amber-400/50">
                       <Shield size={12} className="text-amber-300 fill-amber-300" />
                       <span className="text-[10px] font-black text-amber-200 uppercase tracking-[0.2em]">Master Admin</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-3 text-white/70 font-bold">
                 <Mail size={18} className="opacity-60 flex-shrink-0" />
                 <span className="text-sm sm:text-base lg:text-lg tracking-tight break-all">{formData.email}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 relative z-10 w-full lg:w-auto lg:self-start mt-2 lg:mt-4">
            {isEditing ? (
              <div className="flex gap-3 w-full sm:w-auto justify-center">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-6 sm:px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all border border-white/20 backdrop-blur-sm"
                >
                  Discard
                </button>
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 sm:px-8 py-3.5 bg-white text-[#4f46e5] rounded-2xl font-black hover:bg-blue-50 transition-all shadow-2xl flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Sync Identity
                </button>
              </div>
            ) : (
              <div className="flex gap-3 w-full sm:w-auto justify-center">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-6 sm:px-8 py-3.5 bg-white text-slate-900 rounded-2xl font-black hover:bg-slate-50 transition-all shadow-2xl flex items-center gap-2.5 group/btn"
                >
                  <Edit2 size={18} className="group-hover/btn:rotate-12 transition-transform" />
                  Edit Profile
                </button>
                <button className="p-3.5 bg-[#051739] text-[#7c3aed] rounded-2xl shadow-2xl hover:bg-slate-900 transition-all active:scale-95 border border-white/10 shadow-[0_0_30px_rgba(124,58,237,0.3)]">
                  <Zap size={20} fill="currentColor" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Network Organization', value: organization?.name || 'VMS Global', icon: <Globe size={24} />, color: 'blue' },
          { label: 'Security Privilege', value: user.role === 'MASTER_ADMIN' ? 'Primary Authority' : (user.role === 'ADMIN' ? 'Full Access' : 'Staff Level'), icon: <Shield size={24} />, color: 'orange' },
          { label: 'Creation Epoch', value: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '15 Apr 2026', icon: <Calendar size={24} />, color: 'purple' },
          { label: 'Last Intelligence Load', value: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Today, 10:43', icon: <Clock size={24} />, color: 'emerald' }
        ].map((stat, i) => (
         <div key={i} className="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden group hover:shadow-xl transition-all">
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
             <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center mb-6 sm:mb-8 
               ${stat.color === 'blue' ? 'bg-blue-50 text-blue-600' : 
                 stat.color === 'orange' ? 'bg-orange-50 text-orange-600' : 
                 stat.color === 'purple' ? 'bg-purple-50 text-purple-600' : 
                 'bg-emerald-50 text-emerald-600'}`}
             >
               {stat.icon}
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
             <p className="text-lg sm:text-xl font-black text-[#051739] tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Specifications Column */}
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 border border-slate-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-12">
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                      <Zap size={20} />
                   </div>
                   <h3 className="text-xl sm:text-2xl font-black text-[#051739] italic tracking-tight">Administrative Specifications</h3>
                </div>
                <button 
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  className="text-blue-600 text-xs font-black uppercase tracking-[0.2em] hover:opacity-70 transition-opacity self-start sm:self-auto"
                >
                  {isEditing ? 'SYNC NOW' : 'UPDATE DATA'}
                </button>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-x-12 sm:gap-y-10">
                {[
                  { label: 'EMAIL IDENTITY', icon: <Mail size={18} />, value: formData.email, field: 'email', type: 'email' },
                  { label: 'PHONE NODE', icon: <Phone size={18} />, value: formData.phone || 'Not Connected', field: 'phone', type: 'tel' },
                  { label: 'PERSONAL NAME', icon: <User size={18} />, value: formData.name, field: 'name', type: 'text' },
                  { label: 'GEOGRAPHIC LOCATION', icon: <MapPin size={18} />, value: formData.address || 'Remote Terminal', field: 'address', type: 'text' }
                ].map((input, idx) => (
                  <div key={idx} className="space-y-2 sm:space-y-4">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{input.label}</p>
                     <div className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-[1.25rem] sm:rounded-[1.5rem] transition-all border ${isEditing ? 'bg-white border-blue-200 shadow-lg shadow-blue-50' : 'bg-slate-50/50 border-slate-100'}`}>
                        <div className="text-slate-400 flex-shrink-0">{input.icon}</div>
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
           <div className="bg-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 border border-slate-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]">
             <div className="flex items-center gap-4 mb-8 sm:mb-10">
                <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                   <Bell size={20} />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#051739] italic tracking-tight">System Preferences</h3>
             </div>
             <div className="space-y-4 border-t border-slate-50">
                {preferences.map((pref) => (
                  <div key={pref.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 sm:py-6 group border-b border-slate-100/50 last:border-0">
                     <div className="flex items-center gap-4 sm:gap-6">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all flex-shrink-0">
                           {pref.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                           <p className="text-sm sm:text-base font-black text-slate-900 tracking-tight">{pref.label}</p>
                           <p className="text-xs sm:text-sm text-slate-400 font-medium leading-normal">{pref.desc}</p>
                        </div>
                     </div>
                     <button 
                        onClick={() => togglePreference(pref.id)}
                        className={`w-14 h-7 rounded-full transition-all relative flex-shrink-0 ${pref.active ? 'bg-[#3b82f6]' : 'bg-slate-200'}`}
                     >
                        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${pref.active ? 'left-8' : 'left-1'}`} />
                     </button>
                  </div>
                ))}
             </div>
           </div>

           {/* Preferences Card */}
            <div className="bg-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 border border-slate-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-4 mb-10">
                 <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Globe size={20} />
                 </div>
                 <h3 className="text-2xl font-black text-[#051739] italic tracking-tight">{organization?.name || 'System Environment'}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                 <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Workspace ID</p>
                    <p className="text-sm font-bold text-slate-900 font-mono">{organization?.id?.substring(0, 8) || 'GLOBAL'}</p>
                 </div>
                 <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Access Tier</p>
                    <p className="text-sm font-black text-brand-blue uppercase">{user?.role || 'STAFF'}</p>
                 </div>
              </div>
            </div>

            {/* Core Actions Card */}
            <div className="bg-[#fff1f2] border border-rose-100 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 shadow-[0_20px_50px_-20px_rgba(225,29,72,0.1)]">
             <div className="flex items-center gap-3 mb-6">
                <Shield size={24} className="text-rose-600" />
                <h3 className="text-2xl font-black text-rose-900 italic">Core Actions</h3>
             </div>
             <p className="text-rose-700/60 text-sm font-medium leading-relaxed mb-10">
               Signing out will terminate your current session. Deleting your profile will permanently remove your administrative access.
             </p>
             <div className="flex flex-col sm:flex-row gap-4">
                 {hasMultiOrg && onSwitchWorkspace && (
                   <button
                     onClick={onSwitchWorkspace}
                     className="flex-1 py-4 bg-indigo-600 text-white hover:bg-indigo-700 rounded-3xl font-black transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl border border-indigo-500 text-sm"
                   >
                     <RefreshCw size={18} />
                     Switch Workspace
                   </button>
                 )}
                <button
                  onClick={onLogout}
                  className="flex-1 py-4 bg-white text-rose-600 rounded-3xl font-black hover:bg-rose-50 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-sm border border-rose-100 text-sm"
                >
                  <LogOut size={18} className="rotate-180" />
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
                  className="flex-1 py-4 bg-[#e11d48] text-white rounded-3xl font-black hover:bg-rose-700 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-rose-200 text-sm"
                >
                  <Trash2 size={18} />
                  Delete Identity
                </button>
             </div>
           </div>

           {/* Support Hub Card */}
           <div className="bg-[#051739] rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 text-white shadow-2xl relative overflow-hidden group min-h-[300px] sm:min-h-[360px] flex flex-col justify-end">
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
                <h4 className="text-2xl sm:text-3xl font-black italic tracking-tighter">Need Intelligence Support?</h4>
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
            {/* Data Management Card - Admin Only */}
            {(user.role === 'ADMIN' || user.role === 'MASTER_ADMIN') && (
              <div className="bg-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 border border-slate-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-4 mb-10">
                   <div className="h-10 w-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                      <Download size={20} />
                   </div>
                   <h3 className="text-xl sm:text-2xl font-black text-[#051739] italic tracking-tight">System Backups</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <button
                      onClick={async () => {
                        await onCreateBackup();
                        loadBackups();
                      }}
                      className="flex-1 py-5 bg-[#0F9D58] text-white rounded-3xl font-black hover:bg-[#0B8043] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-sm border border-[#0F9D58]"
                    >
                      <RefreshCw size={20} />
                      Create Backup
                    </button>
                    <button
                      onClick={loadBackups}
                      disabled={isFetchingBackups}
                      className="px-6 py-5 bg-slate-100 text-slate-600 rounded-3xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isFetchingBackups ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {backups.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                        <p className="text-sm font-medium text-slate-400">No timestamped backups detected on this node.</p>
                      </div>
                    ) : (
                      backups.map((backup) => (
                        <div key={backup.id} className="p-5 bg-slate-50/50 hover:bg-slate-100/50 rounded-2xl border border-slate-100 flex items-center justify-between transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm transition-colors">
                              <Clock size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 tracking-tight">
                                {new Date(backup.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {backup.metadata?.visitsCount || 0} Records • {((backup.metadata?.size || 0) / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => downloadBackup(backup)}
                            className="p-3 bg-white hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl shadow-sm border border-slate-100 transition-all"
                            title="Download Snapshot"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Restore Section - Advanced */}
                {onRestoreBackup && (
                  <div className="mt-8 pt-8 border-t border-slate-100">
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
            )}
        </div>
      </div>
    </div>
  );
}

