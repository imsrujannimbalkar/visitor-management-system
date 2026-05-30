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
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp, arrayUnion, deleteDoc } from 'firebase/firestore';
import { UserRole } from '../types';
import Swal from 'sweetalert2';

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
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userRegistryRef = doc(db, 'users', user.uid);
      const userRegistrySnap = await getDoc(userRegistryRef);
      
      let organizationId = null;
      let role = 'STAFF';
      let needsSync = false;

      // ATOMIC INVITATION CHECK (Always check for all users)
      const normalizedEmail = user.email?.toLowerCase() || '';
      const inviteRef = doc(db, 'invitations', normalizedEmail);
      const inviteSnap = await getDoc(inviteRef);
      
      let foundInvite = false;
      if (inviteSnap.exists()) {
        const inviteData = inviteSnap.data();
        organizationId = inviteData.organizationId;
        role = inviteData.role;
        foundInvite = true;
      }

      if (!userRegistrySnap.exists()) {
        const associatedOrgs = organizationId ? [{
          orgId: organizationId,
          role: role,
          joinedAt: new Date().toISOString()
        }] : [];

        await setDoc(userRegistryRef, {
          uid: user.uid,
          name: user.displayName || 'Google User',
          email: user.email?.toLowerCase() || '',
          role: role,
          organizationId: organizationId,
          associatedOrgs: associatedOrgs,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        });
        needsSync = true;

        if (!organizationId) {
          await Swal.fire({
            title: 'Invitation Not Found',
            html: `<div class="space-y-4">
              <div class="h-20 w-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-amber-100">
                <svg class="h-10 w-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p class="text-slate-600 font-medium">No onboarding invitation was found for your account.</p>
              <p class="text-slate-400 text-xs text-center border-t border-slate-100 pt-4">Please contact your administrator for an invitation, or proceed to set up a new workspace.</p>
            </div>`,
            icon: 'warning',
            confirmButtonText: 'Continue to Setup',
            confirmButtonColor: '#0f172a',
            customClass: {
              popup: 'rounded-[2.5rem] p-10',
              confirmButton: 'rounded-xl px-8 py-3'
            }
          });
        }
      } else {
        const regData = userRegistrySnap.data();
        
        // UPGRADE LOGIC: If a fresh invitation was found, or if they are missing an orgId in registry
        if (foundInvite && organizationId) {
          await updateDoc(userRegistryRef, {
            organizationId: organizationId,
            role: role,
            associatedOrgs: arrayUnion({
              orgId: organizationId,
              role: role,
              joinedAt: new Date().toISOString()
            }),
            lastLogin: new Date().toISOString()
          });
          needsSync = true;
        } else if (!regData.organizationId && organizationId) {
          await updateDoc(userRegistryRef, {
            organizationId: organizationId,
            role: role,
            associatedOrgs: arrayUnion({
              orgId: organizationId,
              role: role,
              joinedAt: new Date().toISOString()
            }),
            lastLogin: new Date().toISOString()
          });
          needsSync = true;
        } else {
          organizationId = regData.organizationId;
          role = regData.role;
          await updateDoc(userRegistryRef, { lastLogin: new Date().toISOString() });
        }

        if (!organizationId) {
           await Swal.fire({
             title: 'Invitation Not Found',
             html: `<div class="space-y-4">
               <div class="h-20 w-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-amber-100">
                 <svg class="h-10 w-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                 </svg>
               </div>
               <p class="text-slate-600 font-medium">Your account profile exists but no onboarding invitation was found.</p>
               <p class="text-slate-400 text-xs text-center border-t border-slate-100 pt-4">Please contact your administrator for an invitation.</p>
             </div>`,
             icon: 'warning',
             confirmButtonText: 'Continue to Setup',
             confirmButtonColor: '#0f172a',
             customClass: {
               popup: 'rounded-[2.5rem] p-10',
               confirmButton: 'rounded-xl px-8 py-3'
             }
           });
        }
      }
      
      if (organizationId && needsSync) {
        const userOrgRef = doc(db, 'organizations', organizationId, 'users', user.uid);
        await setDoc(userOrgRef, {
          uid: user.uid,
          name: user.displayName || (userRegistrySnap.exists() ? userRegistrySnap.data()?.name : null) || 'Google User',
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

        if (foundInvite) {
          try {
            const { deleteDoc } = await import('firebase/firestore');
            await deleteDoc(inviteRef);
            await deleteDoc(doc(db, 'organizations', organizationId, 'invitations', normalizedEmail));
          } catch (e) {}
        }
      }
      
      // Clear storage selection and assign fresh login identifier for multisession workspace selector
      sessionStorage.removeItem('vms_selected_org_id');
      sessionStorage.setItem('vms_fresh_login', 'true');

      Toast.fire({ icon: 'success', title: 'Signed in successfully' });
      onAuthComplete();
    } catch (error: any) {
      let errorTitle = 'Authentication Failed';
      let errorMessage = error.message || 'An unexpected error occurred during Google sign in. Please try again.';
      
      if (error.code === 'auth/user-disabled') {
        errorTitle = 'Access Revoked';
        errorMessage = 'Your access privileges for this workspace have been revoked. Please contact your primary workspace owner for assistance.';
      }

      await Swal.fire({
        title: errorTitle,
        html: `<div class="space-y-4">
          <div class="h-20 w-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-rose-100">
            <svg class="h-10 w-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p class="text-slate-600 font-medium text-sm text-center leading-relaxed px-2">${errorMessage}</p>
        </div>`,
        icon: 'error',
        confirmButtonText: 'Acknowledge',
        confirmButtonColor: '#0f172a',
        customClass: {
          popup: 'rounded-[2.5rem] p-12 shadow-2xl border border-slate-100',
          confirmButton: 'rounded-xl px-8 py-3.5 font-bold text-sm tracking-wide transition-all'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const { value: email } = await Swal.fire({
      title: 'Reset Password',
      html: `
        <div class="text-sm text-slate-500 mb-6 text-center leading-relaxed">
          Enter your email address and we'll send you a secure link to reset your password.
        </div>
      `,
      input: 'email',
      inputValue: formData.email || '',
      inputPlaceholder: 'name@domain.com',
      showCancelButton: true,
      confirmButtonText: 'Send Reset Link',
      confirmButtonColor: '#0f172a',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'rounded-[2.5rem] p-10 font-sans shadow-2xl border border-slate-100',
        input: 'rounded-xl border border-slate-200 p-3 h-12 text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all',
        confirmButton: 'rounded-xl px-8 py-3.5 font-bold text-sm tracking-wide transition-all shadow-sm',
        cancelButton: 'rounded-xl px-4 py-3 font-semibold text-sm transition-all text-slate-500 bg-slate-50 hover:bg-slate-100 hover:text-slate-700 m-0 mr-3'
      },
      buttonsStyling: true,
      inputValidator: (value) => {
        if (!value || !/^\S+@\S+\.\S+$/.test(value)) {
          return 'Please enter a valid email address';
        }
      }
    });

    if (email) {
      setLoading(true);
      const normalizedEmail = email.trim().toLowerCase();
      try {
        // First check if the email exists in our records to provide context-aware messaging
        try {
          const checkRes = await fetch('/api/auth/check-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: normalizedEmail })
          });
          
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            if (!checkData.inconclusive && !checkData.registered) {
              await Swal.fire({
                icon: 'info',
                title: 'Account Not Found',
                html: `
                  <div class="text-sm text-slate-500 mt-4 leading-relaxed text-center">
                    We couldn't find an account associated with <strong>${normalizedEmail}</strong>.<br><br>
                    If you haven't created an account yet, please sign up first.
                  </div>
                `,
                confirmButtonColor: '#0f172a',
                confirmButtonText: 'Create Account',
                showCancelButton: true,
                cancelButtonText: 'Close',
                customClass: {
                  popup: 'rounded-[2.5rem] p-10 font-sans shadow-2xl border border-slate-100',
                  confirmButton: 'rounded-xl px-8 py-3.5 font-bold text-sm tracking-wide transition-all shadow-sm',
                  cancelButton: 'rounded-xl px-6 py-3 font-semibold text-sm transition-all text-slate-500 bg-slate-50 hover:bg-slate-100'
                }
              }).then((result) => {
                if (result.isConfirmed) {
                  setIsLogin(false);
                  setFormData(prev => ({ ...prev, email: normalizedEmail }));
                }
              });
              setLoading(false);
              return; // Stop here if user not found
            }
          }
        } catch (checkErr) {
        }

        // Proceed with standard reset
        await sendPasswordResetEmail(auth, normalizedEmail);
        
        await Swal.fire({
          icon: 'success',
          title: 'Reset Link Sent',
          html: `
            <div class="text-sm text-slate-500 mt-4 leading-relaxed text-center">
              A secure password reset link has been dispatched to <strong>${normalizedEmail}</strong>.<br><br>
              Please check your inbox and spam folders.
            </div>
          `,
          confirmButtonColor: '#0f172a',
          confirmButtonText: 'Back to Login',
          customClass: {
            popup: 'rounded-[2.5rem] p-10 font-sans shadow-2xl border border-slate-100',
            confirmButton: 'rounded-xl px-8 py-3.5 font-bold text-sm tracking-wide transition-all shadow-sm'
          }
        });
      } catch (error: any) {
        
        // Handle potentially masked errors
        let errorTitle = 'Reset Failed';
        let errorMsg = 'We encountered an error processing your request. Please try again later.';
        
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
           errorMsg = 'We could not process a reset for the provided email address.';
        } else if (error.code === 'auth/too-many-requests') {
           errorTitle = 'Too Many Requests';
           errorMsg = 'We have received too many requests from this device. Please try again later.';
        }
        
        await Swal.fire({
          icon: 'error',
          title: errorTitle,
          html: `
            <div class="text-sm text-slate-500 mt-4 leading-relaxed text-center">
              ${errorMsg}
            </div>
          `,
          confirmButtonColor: '#0f172a',
          customClass: {
            popup: 'rounded-[2.5rem] p-10 font-sans shadow-2xl border border-slate-100',
            confirmButton: 'rounded-xl px-8 py-3.5 font-bold text-sm tracking-wide transition-all shadow-sm'
          }
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Clear stale workspace selections on new login or registration attempt
    sessionStorage.removeItem('vms_selected_org_id');

    try {
      if (isLogin) {
        const normalizedEmail = formData.email.toLowerCase().trim();
        try {
          await signInWithEmailAndPassword(auth, normalizedEmail, formData.password);
          const user = auth.currentUser;
          if (user) {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            let orgId = null;
            let role = 'STAFF';

            let name = user.displayName || 'User';

            if (userSnap.exists()) {
              const userData = userSnap.data();
              orgId = userData.organizationId;
              role = userData.role;
              name = user.displayName || userData.name || 'User';

              // Check for invitation if no org assigned
              if (!orgId) {
                const inviteRef = doc(db, 'invitations', normalizedEmail);
                const inviteSnap = await getDoc(inviteRef);
                if (inviteSnap.exists()) {
                  const inviteData = inviteSnap.data();
                  orgId = inviteData.organizationId;
                  role = inviteData.role || 'STAFF';

                  await setDoc(userRef, {
                    organizationId: orgId,
                    role: role
                  }, { merge: true });

                  // Invitation cleanup
                  try {
                    const { deleteDoc } = await import('firebase/firestore');
                    await deleteDoc(inviteRef);
                    if (orgId) {
                      await deleteDoc(doc(db, 'organizations', orgId, 'invitations', normalizedEmail));
                    }
                  } catch (e) {}
                }
              }
            } else {
              // User doc doesn't exist but they logged in? Check invitations anyway.
              const inviteRef = doc(db, 'invitations', normalizedEmail);
              const inviteSnap = await getDoc(inviteRef);
              if (inviteSnap.exists()) {
                const inviteData = inviteSnap.data();
                orgId = inviteData.organizationId;
                role = inviteData.role || 'STAFF';

                await setDoc(userRef, {
                  uid: user.uid,
                  email: normalizedEmail,
                  name: user.displayName || 'User',
                  organizationId: orgId,
                  role: role,
                  createdAt: new Date().toISOString()
                });

                // Invitation cleanup
                try {
                  const { deleteDoc } = await import('firebase/firestore');
                  await deleteDoc(inviteRef);
                  if (orgId) {
                    await deleteDoc(doc(db, 'organizations', orgId, 'invitations', normalizedEmail));
                  }
                } catch (e) {}
              }
            }

            await setDoc(userRef, {
              lastLogin: new Date().toISOString()
            }, { merge: true });

            if (!orgId) {
              await Swal.fire({
                title: 'Invitation Not Found',
                html: `<div class="space-y-4">
                  <div class="h-20 w-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-amber-100">
                    <svg class="h-10 w-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p class="text-slate-600 font-medium">No onboarding invitation was found for your account.</p>
                  <p class="text-slate-400 text-xs">Please contact your administrator for an invitation, or proceed to set up a new workspace.</p>
                </div>`,
                icon: 'warning',
                confirmButtonText: 'Continue to Setup',
                confirmButtonColor: '#0f172a',
                customClass: {
                  popup: 'rounded-[2.5rem] p-10',
                  confirmButton: 'rounded-xl px-8 py-3'
                }
              });
            }

            if (orgId) {
              // Sync to org collection
              await setDoc(doc(db, 'organizations', orgId, 'users', user.uid), {
                uid: user.uid,
                email: normalizedEmail,
                name: name,
                role: role,
                organizationId: orgId,
                lastLogin: new Date().toISOString()
              }, { merge: true });

              await addDoc(collection(db, 'organizations', orgId, 'activityLogs'), {
                userId: user.uid,
                organizationId: orgId,
                action: 'LOGIN',
                details: 'User logged in via Email/Password',
                timestamp: new Date().toISOString()
              });
            }
          }
          // Clear storage selection and assign fresh login identifier for multisession workspace selector
          sessionStorage.removeItem('vms_selected_org_id');
          sessionStorage.setItem('vms_fresh_login', 'true');

          Toast.fire({ icon: 'success', title: 'Signed in successfully' });
          onAuthComplete();
        } catch (error: any) {
          let errorTitle = 'Authentication Failed';
          let errorMessage = 'An unexpected error occurred. Please try again.';
          let showRegisterButton = false;
          
          if (error.code === 'auth/user-not-found') {
            errorTitle = 'Account Not Found';
            errorMessage = `No account found for "${normalizedEmail}". Please create an account to continue.`;
            showRegisterButton = true;
          } else if (error.code === 'auth/wrong-password') {
            errorTitle = 'Incorrect Password';
            errorMessage = 'The password you entered is incorrect. If you forgot your password, please use the reset option.';
          } else if (error.code === 'auth/user-disabled') {
            errorTitle = 'Access Revoked';
            errorMessage = 'Your access privileges for this workspace have been revoked. Please contact your primary workspace owner for assistance.';
          } else if (error.code === 'auth/invalid-email') {
            errorTitle = 'Invalid Email Format';
            errorMessage = 'The email address format you provided is invalid. Please ensure standard nomenclature (e.g., name@domain.com).';
          } else if (error.code === 'auth/too-many-requests') {
            errorTitle = 'Account Temporarily Locked';
            errorMessage = 'Too many failed login attempts have been detected. This account has been temporarily disabled to protect its security. Please try again later or reset your password.';
          } else if (error.code === 'auth/invalid-credential' || error.message?.toLowerCase().includes('credential')) {
            try {
              const checkRes = await fetch('/api/auth/check-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: normalizedEmail })
              });
              
              if (checkRes.ok) {
                const checkData = await checkRes.json();
                if (checkData.inconclusive) {
                  errorTitle = 'Authentication Failed';
                  errorMessage = 'Invalid username or password. Please try again.';
                } else if (checkData.disabled) {
                  errorTitle = 'Access Revoked';
                  errorMessage = 'Your access privileges for this workspace have been revoked. Please contact your primary workspace owner for assistance.';
                } else if (!checkData.registered) {
                  errorTitle = 'Account Not Found';
                  errorMessage = `No account found for "${normalizedEmail}". Please create an account to continue.`;
                  showRegisterButton = true;
                } else {
                  errorTitle = 'Incorrect Password';
                  errorMessage = 'The password you entered is incorrect. If you forgot your password, please use the reset option.';
                }
              } else {
                errorTitle = 'Authentication Failed';
                errorMessage = 'Please verify your credentials or ensure your account is correctly set up.';
              }
            } catch (err) {
              errorTitle = 'Authentication Failed';
              errorMessage = 'Please verify your credentials or ensure your account is correctly set up.';
            }
          } else {
            errorMessage = error.message || errorMessage;
          }

          if (showRegisterButton) {
            await Swal.fire({
              title: errorTitle,
              html: `<div class="space-y-4">
                <div class="h-20 w-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-rose-100">
                  <svg class="h-10 w-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p class="text-slate-600 font-medium text-sm text-center leading-relaxed px-2">${errorMessage}</p>
              </div>`,
              icon: 'error',
              showCancelButton: true,
              confirmButtonText: 'Create Account',
              confirmButtonColor: '#0f172a',
              cancelButtonText: 'Cancel',
              customClass: {
                popup: 'rounded-[2.5rem] p-12 shadow-2xl border border-slate-100',
                confirmButton: 'rounded-xl px-8 py-3.5 font-bold text-sm tracking-wide transition-all hover:bg-slate-800',
                cancelButton: 'rounded-xl px-6 py-3.5 font-semibold text-sm transition-all text-slate-400 bg-slate-50 hover:bg-slate-100'
              }
            }).then((res) => {
              if (res.isConfirmed) {
                setIsLogin(false);
              }
            });
          } else {
            await Swal.fire({
              title: errorTitle,
              html: `<div class="space-y-4">
                <div class="h-20 w-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-rose-100 animate-pulse">
                  <svg class="h-10 w-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p class="text-slate-600 font-medium text-sm text-center leading-relaxed px-2">${errorMessage}</p>
              </div>`,
              icon: 'error',
              confirmButtonText: 'Acknowledge',
              confirmButtonColor: '#0f172a',
              customClass: {
                popup: 'rounded-[2.5rem] p-12 shadow-2xl border border-slate-100',
                confirmButton: 'rounded-xl px-8 py-3.5 font-bold text-sm tracking-wide transition-all hover:opacity-95'
              }
            });
          }
        }
      } else {
        const normalizedEmail = formData.email.toLowerCase().trim();
        const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, formData.password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: formData.name });
        
        const inviteRef = doc(db, 'invitations', normalizedEmail);
        const inviteSnap = await getDoc(inviteRef);
        let organizationId = null;
        let role: UserRole = 'STAFF';
        let foundInvite = false;

        if (inviteSnap.exists()) {
          const inviteData = inviteSnap.data();
          organizationId = inviteData.organizationId;
          role = inviteData.role || 'STAFF';
          foundInvite = true;
        } else {
          // Signup without invitation?
          await Swal.fire({
            title: 'Invitation Not Found',
            html: `<div class="space-y-4">
              <div class="h-20 w-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-amber-100">
                <svg class="h-10 w-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h4 class="text-slate-900 font-bold text-lg leading-tight tracking-tight">Invitation Not Found</h4>
              <p class="text-slate-500 text-sm font-medium leading-relaxed">Your account has been created for <span class="text-indigo-600 font-bold px-1">${normalizedEmail}</span>. No active organization invitation was found matching this identity.</p>
              <div class="pt-4 border-t border-slate-100">
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-relaxed">Proceed to initialize a new organization context, or ask your administrator to trigger a fresh invitation.</p>
              </div>
            </div>`,
            icon: 'warning',
            confirmButtonText: 'I Understand',
            confirmButtonColor: '#0f172a',
            customClass: {
              popup: 'rounded-[2.5rem] p-12 shadow-2xl border border-slate-100',
              confirmButton: 'rounded-xl px-8 py-3.5 font-bold text-sm tracking-wide transition-all'
            }
          });
        }

        const associatedOrgs = organizationId ? [{
          orgId: organizationId,
          role: role,
          joinedAt: new Date().toISOString()
        }] : [];

        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: formData.name,
          email: normalizedEmail,
          role: role,
          organizationId: organizationId,
          associatedOrgs: associatedOrgs,
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

          if (foundInvite) {
            try {
              const { deleteDoc } = await import('firebase/firestore');
              await deleteDoc(inviteRef);
              await deleteDoc(doc(db, 'organizations', organizationId, 'invitations', normalizedEmail));
            } catch (e) {
            }
          }
        }

        // Clear storage selection and assign fresh login identifier for multisession workspace selector
        sessionStorage.removeItem('vms_selected_org_id');
        sessionStorage.setItem('vms_fresh_login', 'true');

        Toast.fire({ icon: 'success', title: 'Account created successfully!' });
        onAuthComplete();
      }
    } catch (error: any) {
      let errorTitle = 'Registration Failed';
      let errorMessage = error.message || 'An unexpected error occurred during account creation. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorTitle = 'Email Already in Use';
        errorMessage = 'This email address is already registered. Please proceed to Sign In instead.';
      } else if (error.code === 'auth/weak-password') {
        errorTitle = 'Weak Password';
        errorMessage = 'The password you entered is too weak. Please strengthen it with at least six characters.';
      } else if (error.code === 'auth/invalid-email') {
        errorTitle = 'Invalid Email Format';
        errorMessage = 'The email address you provided is invalid. Please ensure standard nomenclature (e.g., name@domain.com).';
      }

      await Swal.fire({
        title: errorTitle,
        html: `<div class="space-y-4">
          <div class="h-20 w-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-rose-100">
            <svg class="h-10 w-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p class="text-slate-600 font-medium text-sm text-center leading-relaxed px-2">${errorMessage}</p>
        </div>`,
        icon: 'error',
        confirmButtonText: 'Acknowledge',
        confirmButtonColor: '#0f172a',
        customClass: {
          popup: 'rounded-[2.5rem] p-12 shadow-2xl border border-slate-100',
          confirmButton: 'rounded-xl px-8 py-3.5 font-bold text-sm tracking-wide'
        }
      });
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
