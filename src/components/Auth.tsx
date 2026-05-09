import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User as UserIcon, 
  Users,
  ArrowRight, 
  Chrome,
  AlertCircle,
  Loader2,
  ShieldCheck,
  BarChart3,
  Users2,
  Shield,
  TrendingUp,
  Fingerprint
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider, db, isConfigured } from '../firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { UserRole } from '../types';
import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: 'top',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#ffffff',
  color: '#1e293b',
  customClass: {
    popup: 'rounded-2xl shadow-xl border border-slate-100',
  }
});

interface AuthProps {
  onAuthComplete: () => void;
}

export default function Auth({ onAuthComplete }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleGoogleSignIn = async () => {
    setLoading(true);
    console.log('Initiating Google Sign-In...');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log('Google Sign-In successful for user:', user.uid, user.email);
      
      const userRegistryRef = doc(db, 'users', user.uid);
      console.log('Checking user registry:', userRegistryRef.path);
      const userRegistrySnap = await getDoc(userRegistryRef);
      
      let organizationId = null;
      let role = 'STAFF';
      let needsSync = false;

      if (!userRegistrySnap.exists()) {
        const inviteRef = doc(db, 'invitations', user.email?.toLowerCase() || '');
        const inviteSnap = await getDoc(inviteRef);
        
        if (inviteSnap.exists()) {
          const inviteData = inviteSnap.data();
          organizationId = inviteData.organizationId;
          role = inviteData.role;
        }

        await setDoc(userRegistryRef, {
          uid: user.uid,
          name: user.displayName || 'Google User',
          email: user.email,
          role: role,
          organizationId: organizationId,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        });
        needsSync = true;
      } else {
        const regData = userRegistrySnap.data();
        organizationId = regData.organizationId;
        role = regData.role;
        
        await setDoc(userRegistryRef, {
          lastLogin: new Date().toISOString()
        }, { merge: true });
        needsSync = true;
      }
      
      if (organizationId && needsSync) {
        const userOrgRef = doc(db, 'organizations', organizationId, 'users', user.uid);
        await setDoc(userOrgRef, {
          uid: user.uid,
          name: user.displayName || 'Google User',
          email: user.email,
          role: role,
          organizationId: organizationId,
          lastLogin: new Date().toISOString()
        }, { merge: true });

        await addDoc(collection(db, 'organizations', organizationId, 'activityLogs'), {
          userId: user.uid,
          organizationId: organizationId,
          action: 'LOGIN',
          details: 'User logged in via Google',
          timestamp: new Date().toISOString()
        });
      }
      
      Toast.fire({ icon: 'success', title: 'Signed in successfully' });
      onAuthComplete();
    } catch (error: any) {
      console.error('Google Auth Error:', error);
      Toast.fire({ icon: 'error', title: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      Toast.fire({ icon: 'warning', title: 'Please enter your email first' });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, formData.email);
      Swal.fire({
        icon: 'success',
        title: 'Reset Link Sent',
        text: 'Check your email for instructions to reset your password.',
        confirmButtonColor: '#00225d'
      });
    } catch (error: any) {
      Toast.fire({ icon: 'error', title: error.message });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        try {
          await signInWithEmailAndPassword(auth, formData.email, formData.password);
          const user = auth.currentUser;
          if (user) {
            await setDoc(doc(db, 'users', user.uid), {
              lastLogin: new Date().toISOString()
            }, { merge: true });

            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const orgId = userDoc.exists() ? userDoc.data().organizationId : null;
            if (orgId) {
              await addDoc(collection(db, 'organizations', orgId, 'activityLogs'), {
                userId: user.uid,
                organizationId: orgId,
                action: 'LOGIN',
                details: 'User logged in via Email/Password',
                timestamp: new Date().toISOString()
              });
            }
          }
          Toast.fire({ icon: 'success', title: 'Signed in successfully' });
          onAuthComplete();
        } catch (error: any) {
          Toast.fire({ 
            icon: 'error', 
            title: 'Authentication Failed', 
            text: 'Invalid email or password. Please try again.'
          });
        }
      } else {
        const normalizedEmail = formData.email.toLowerCase();
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: formData.name });
        
        const inviteRef = doc(db, 'invitations', normalizedEmail);
        const inviteSnap = await getDoc(inviteRef);
        let organizationId = null;
        let role: UserRole = 'STAFF';

        if (inviteSnap.exists()) {
          const inviteData = inviteSnap.data();
          organizationId = inviteData.organizationId;
          role = inviteData.role || 'STAFF';
        }

        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: formData.name,
          email: normalizedEmail,
          role: role,
          organizationId: organizationId,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        });

        if (organizationId) {
          await setDoc(doc(db, 'organizations', organizationId, 'users', user.uid), {
            uid: user.uid,
            name: formData.name,
            email: normalizedEmail,
            role: role,
            organizationId: organizationId,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          });

          await addDoc(collection(db, 'organizations', organizationId, 'activityLogs'), {
            userId: user.uid,
            organizationId: organizationId,
            action: 'SIGNUP',
            details: 'Account created and joined organization via invitation',
            timestamp: new Date().toISOString()
          });
        }
        Toast.fire({ icon: 'success', title: 'Account created successfully!' });
        onAuthComplete();
      }
    } catch (error: any) {
      console.error('Auth Error:', error);
      Toast.fire({ icon: 'error', title: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-12 border-t-8 border-amber-400">
          <div className="flex flex-col items-center text-center">
            <div className="h-20 w-20 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
              <AlertCircle className="h-10 w-10 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Configuration Required</h2>
            <p className="text-slate-600 mb-8">Firebase configuration is missing or invalid.</p>
            <div className="w-full space-y-4 text-left">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Option A: Manual Setup</p>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">Add variables in Secrets starting with VITE_FIREBASE_.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex selection:bg-blue-100 overflow-hidden font-sans">
      {/* Branding Section (Left) */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#081b3d] relative overflow-hidden flex-col justify-between p-16 xl:p-24">
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
          <div className="h-14 w-14 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
             <div className="relative">
                <Shield className="h-8 w-8 text-white" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-3 h-3 bg-white rounded-full mt-0.5" />
                </div>
             </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-white tracking-tight">VMS</span>
              <span className="text-3xl font-bold text-blue-500 tracking-tight">ELITE</span>
            </div>
            <p className="text-xs text-white/50 tracking-wide font-medium">Visitor Management System</p>
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
              Smart Visitor<br />
              <span className="text-blue-500">Management</span>
            </h1>
            <p className="text-lg text-white/70 max-w-md leading-relaxed font-medium">
              Manage visitors, track activities, and strengthen security with intelligent insights.
            </p>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="relative z-10 grid grid-cols-3 gap-8">
          {[
            { icon: <ShieldCheck />, title: 'Secure', desc: 'Enterprise grade security' },
            { icon: <TrendingUp />, title: 'Real-time', desc: 'Live tracking and analytics' },
            { icon: <Users2 />, title: 'Reliable', desc: 'Built for modern organizations' }
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
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 lg:p-12 relative">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-lg bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-10 lg:p-14 border border-slate-100/50"
        >
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              {isLogin ? 'Welcome Back' : 'Get Started'}
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              {isLogin ? 'Sign in to your account to continue' : 'Create your administrative account'}
            </p>
          </div>

          <div className="space-y-8">
            {/* Google Sign In */}
            <button 
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-14 bg-white border border-slate-200 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-300 transition-all group disabled:opacity-50"
            >
              <Chrome className="h-5 w-5 text-slate-700" />
              <span className="text-sm font-semibold text-slate-700">Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">or</span>
              </div>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 ml-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. John Doe"
                      className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 ml-1">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="email" 
                    required
                    placeholder="Enter your email"
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-slate-500">Password</label>
                  {isLogin && (
                    <button 
                      type="button" 
                      onClick={handleForgotPassword}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="Enter your password"
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-12 text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" /> }
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-12 bg-[#051739] text-white rounded-xl font-bold text-sm tracking-wide hover:bg-[#082255] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                )}
              </button>
            </form>

            <div className="text-center">
              <p className="text-sm font-medium text-slate-500">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="ml-1 text-blue-600 font-bold hover:text-blue-700 transition-colors"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>
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
