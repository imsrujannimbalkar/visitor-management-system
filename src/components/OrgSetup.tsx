import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  ArrowRight, 
  Loader2, 
  LogOut, 
  Shield, 
  Link as LinkIcon, 
  User, 
  Mail, 
  ShieldCheck, 
  BarChart3, 
  Users2,
  Users,
  TrendingUp
} from 'lucide-react';
import { db, auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, query, collection, where, getDocs, arrayUnion } from 'firebase/firestore';
import Swal from 'sweetalert2';
import { UserRole } from '../types';

interface OrgSetupProps {
  onComplete: (orgId: string) => void;
}

const Toast = Swal.mixin({
  toast: true,
  position: 'center',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#ffffff',
  color: '#1e293b',
  customClass: {
    popup: 'rounded-2xl shadow-xl border border-slate-100',
  }
});

export default function OrgSetup({ onComplete }: OrgSetupProps) {
  const [orgName, setOrgName] = useState('');
  const [slug, setSlug] = useState('');
  const [adminName, setAdminName] = useState(auth.currentUser?.displayName || '');
  const [workEmail, setWorkEmail] = useState(auth.currentUser?.email || '');
  const [loading, setLoading] = useState(false);
  const brandColor = '#2563eb';

  React.useEffect(() => {
    if (auth.currentUser) {
      if (!adminName) setAdminName(auth.currentUser.displayName || '');
      if (!workEmail) setWorkEmail(auth.currentUser.email || '');
    }
  }, [auth.currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !auth.currentUser) return;

    setLoading(true);
    const orgId = Math.random().toString(36).substr(2, 9);
    const normalizedName = orgName.trim().toLowerCase();

    try {
      // 1. Check uniqueness (using org_names collection)
      const nameDocRef = doc(db, 'org_names', normalizedName);
      const nameDoc = await getDoc(nameDocRef);

      if (nameDoc.exists()) {
        await Swal.fire({
          title: 'Identity Conflict',
          html: `<div class="space-y-4">
            <div class="h-20 w-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-rose-100 animate-pulse">
              <svg class="h-10 w-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p class="text-slate-600 font-medium text-sm text-center leading-relaxed px-2">The organization name <span class="text-indigo-600 font-bold px-1">"${orgName}"</span> is already registered. Please select a distinct name.</p>
          </div>`,
          icon: 'warning',
          confirmButtonText: 'Acknowledge',
          confirmButtonColor: '#0f172a',
          customClass: {
            popup: 'rounded-[2.5rem] p-12 shadow-2xl border border-slate-100',
            confirmButton: 'rounded-xl px-8 py-3.5 font-bold text-sm tracking-wide transition-all'
          }
        });
        setLoading(false);
        return;
      }

      // 1b. Check organization slug uniqueness (if provided)
      const normalizedSlug = slug.trim().toLowerCase();
      if (normalizedSlug) {
        const slugQuery = query(collection(db, 'organizations'), where('slug', '==', normalizedSlug));
        const slugQuerySnap = await getDocs(slugQuery);
        
        if (!slugQuerySnap.empty) {
          await Swal.fire({
            title: 'URL Slug Reserved',
            html: `<div class="space-y-4">
              <div class="h-20 w-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-rose-100">
                <svg class="h-10 w-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <p class="text-slate-600 font-medium text-sm text-center leading-relaxed px-2">The URL Slug <span class="text-indigo-600 font-bold px-1">"${slug}"</span> is already claimed by another organization. Please enter a different slug or leave it blank to auto-generate.</p>
            </div>`,
            icon: 'warning',
            confirmButtonText: 'Acknowledge',
            confirmButtonColor: '#0f172a',
            customClass: {
              popup: 'rounded-[2.5rem] p-12 shadow-2xl border border-slate-100',
              confirmButton: 'rounded-xl px-8 py-3.5 font-bold text-sm tracking-wide transition-all'
            }
          });
          setLoading(false);
          return;
        }
      }

      // 2. Create organization
      const orgDocRef = doc(db, 'organizations', orgId);
      await setDoc(orgDocRef, {
        id: orgId,
        name: orgName.trim(),
        slug: slug.trim(),
        createdBy: auth.currentUser.uid,
        brandColor: brandColor,
        setupComplete: true,
        legalAccepted: false,
        createdAt: new Date().toISOString()
      });

      // 3. Claim name
      await setDoc(nameDocRef, { 
        orgId,
        claimedBy: auth.currentUser.uid,
        timestamp: serverTimestamp()
      });

      // 4. Update user profile to be Admin
      const userRegistryRef = doc(db, 'users', auth.currentUser.uid);
      const userOrgRef = doc(db, 'organizations', orgId, 'users', auth.currentUser.uid);
      
      const userData = {
        uid: auth.currentUser.uid,
        name: adminName.trim() || auth.currentUser.displayName || 'Org Creator',
        email: workEmail.trim() || auth.currentUser.email,
        organizationId: orgId,
        role: 'ADMIN' as UserRole,
        updatedAt: serverTimestamp()
      };

      await setDoc(userRegistryRef, {
        name: userData.name,
        email: userData.email,
        organizationId: orgId,
        role: 'MASTER_ADMIN',
        associatedOrgs: arrayUnion({
          orgId: orgId,
          role: 'MASTER_ADMIN',
          joinedAt: new Date().toISOString()
        })
      }, { merge: true });

      await setDoc(userOrgRef, {
        ...userData,
        role: 'MASTER_ADMIN',
        createdAt: serverTimestamp()
      });

      Toast.fire({ icon: 'success', title: 'Workspace initialized!' });
      
      setTimeout(() => {
        onComplete(orgId);
      }, 1000);
    } catch (error: any) {
      console.error('Org Setup Error:', error);
      Toast.fire({ icon: 'error', title: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex selection:bg-blue-100 overflow-hidden font-sans">
      {/* Branding Section (Left) */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#2563eb] relative overflow-hidden flex-col justify-between p-16 xl:p-24">
        {/* Decorative elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] bg-blue-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-5%] left-[-5%] w-[60%] h-[60%] bg-blue-400/5 rounded-full blur-[100px]" />
          {/* Subtle dot pattern */}
          <div className="absolute inset-0 opacity-[0.05]" 
               style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          {/* Wave pattern approximation */}
          <svg className="absolute bottom-0 left-0 w-full opacity-10" viewBox="0 0 1440 320" fill="none">
            <path d="M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,165.3C672,139,768,117,864,128C960,139,1056,181,1152,197.3C1248,213,1344,203,1392,197.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" fill="white" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl overflow-hidden p-2">
             <img src="/logo.png" alt="VMS Flow" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-white tracking-tighter">VMS</span>
              <span className="text-3xl font-black text-blue-400 tracking-tighter">Flow</span>
            </div>
            <p className="text-[10px] text-white/50 tracking-[0.2em] font-black uppercase">Visitor Management System</p>
          </div>
        </div>

        {/* Main Hero Content */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h1 className="text-7xl font-bold text-white leading-[1.1] tracking-tight">
              Create Your<br />
              <span className="text-blue-500">Organization</span>
            </h1>
            <p className="text-lg text-white/70 max-w-md leading-relaxed font-medium">
              Set up your organization to start managing visitors, track activities and strengthen security with intelligence.
            </p>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="relative z-10 grid grid-cols-3 gap-8">
          {[
            { icon: <ShieldCheck />, title: 'Secure', desc: 'Enterprise grade security' },
            { icon: <BarChart3 />, title: 'Smart', desc: 'Real-time tracking and insights' },
            { icon: <Users2 />, title: 'Scalable', desc: 'Built for modern organizations' }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="text-center space-y-4"
            >
              <div className="mx-auto h-12 w-12 bg-white/5 backdrop-blur-md rounded-xl flex items-center justify-center text-blue-400 border border-white/10">
                {feature.icon}
              </div>
              <div className="space-y-1">
                <h4 className="text-white font-semibold text-sm">{feature.title}</h4>
                <p className="text-[10px] text-white/40 leading-relaxed font-medium">
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Auth Section (Right) */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 lg:p-12 relative overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-lg bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-10 lg:p-14 border border-slate-100/50"
        >
          <div className="text-center mb-10 space-y-4">
            <div className="mx-auto h-14 w-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shadow-inner group">
              <Building2 className="h-7 w-7 group-hover:scale-110 transition-transform" />
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Create Organization</h2>
              <p className="text-slate-500 text-sm font-medium">Set up your organization to get started</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 ml-1">Organization Name</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type="text" 
                  required
                  placeholder="Enter organization name"
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-slate-500">Organization Slug <span className="text-[10px] font-medium text-slate-400 ml-1">(Optional)</span></label>
              </div>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="e.g. acme-corp"
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium ml-1">This will be used in your organization URL</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 ml-1">Admin Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type="text" 
                  required
                  placeholder="Enter your full name"
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 ml-1">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type="email" 
                  required
                  placeholder="Enter your work email"
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                  value={workEmail}
                  onChange={(e) => setWorkEmail(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || !orgName.trim()}
              className="w-full h-12 bg-[#051739] text-white rounded-xl font-bold text-sm tracking-wide hover:bg-[#082255] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>
                  <span>Create Organization</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <p className="text-sm font-medium text-slate-500">
                Already have an organization?
                <button 
                  onClick={() => signOut(auth)}
                  className="ml-1 text-blue-600 font-bold hover:text-blue-700 transition-colors"
                >
                  Sign in
                </button>
              </p>
            </div>
          </form>
        </motion.div>

        {/* Footer */}
        <div className="absolute bottom-8 text-center w-full px-6">
           <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
             © {new Date().getFullYear()} VMS Elite. All rights reserved.
           </p>
        </div>
      </div>
    </div>
  );
}
