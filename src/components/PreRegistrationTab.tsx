import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  Copy,
  Check,
  MoreVertical,
  Mail,
  Loader2,
  MessageSquare,
  Share2,
  Eye,
  Trash2,
  AlertCircle,
  UserPlus,
  LogOut,
  Settings,
  Plus,
  X,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { db } from '../firebase';
import { sanitizeForFirestore } from '../lib/utils';
import { useToast } from './Toast';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  setDoc,
  serverTimestamp,
  orderBy,
  addDoc,
  getDoc
} from 'firebase/firestore';
import { PreRegistration, User as UserType, PurposeType } from '../types';
import { DEFAULT_WHATSAPP_TEMPLATES } from '../constants';
import Swal from 'sweetalert2';
import SignatureModal from './SignatureModal';
import { PURPOSES, TYPES } from './VisitorForm';

interface PreRegistrationTabProps {
  organizationId: string;
  organizationName?: string;
  user: UserType | null;
  initialStatus?: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHECKED_IN' | 'COMPLETED';
  onCheckOut?: (preRegId: string) => void;
}

// No longer need local DEFAULT_TEMPLATES
export default function PreRegistrationTab({ 
  organizationId, 
  organizationName = 'VMS Global',
  user, 
  initialStatus = 'PENDING',
  onCheckOut
}: PreRegistrationTabProps) {
  const [requests, setRequests] = useState<PreRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHECKED_IN' | 'COMPLETED'>(initialStatus as any);
  const [copying, setCopying] = useState(false);
  const [isSigModalOpen, setIsSigModalOpen] = useState(false);
  const [pendingCheckInReq, setPendingCheckInReq] = useState<PreRegistration | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    purposes: [...PURPOSES],
    visitorTypes: [...TYPES],
    defaultLocation: organizationName,
    templates: {
      preRegApproved: '',
      preRegRejected: '',
      digitalPass: '',
      thankYou: ''
    }
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!organizationId) return;

    // Load Settings
    const loadSettings = async () => {
      try {
        const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
        if (orgDoc.exists()) {
          const data = orgDoc.data();
          if (data.preRegSettings) {
            setSettings(prev => ({
              purposes: data.preRegSettings.purposes || prev.purposes,
              visitorTypes: data.preRegSettings.visitorTypes || prev.visitorTypes,
              defaultLocation: data.preRegSettings.defaultLocation || prev.defaultLocation,
              templates: {
                ...prev.templates,
                ...(data.preRegSettings.templates || {})
              }
            }));
          }
        }
      } catch (err) {
        console.error('Error loading pre-reg settings:', err);
      }
    };
    loadSettings();

    const q = query(
      collection(db, 'organizations', organizationId, 'preRegistrations'),
      orderBy('submittedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as PreRegistration))
        .filter(req => !req.deleted);
      setRequests(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [organizationId]);

  const handleWhatsAppNotification = async (req: PreRegistration, status: 'APPROVED' | 'REJECTED', customLocation?: string) => {
    if (!req || !organizationId) return;

    try {
      const baseUrl = window.location.origin;
      const passUrl = `${baseUrl}/?passId=${encodeURIComponent(req.id)}&orgId=${encodeURIComponent(organizationId)}`;
      const visitorName = req.name || 'Visitor';
      const visitDate = new Date(req.visitDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const location = customLocation || settings.defaultLocation || organizationName || 'VMS Global';
      
      let message = '';
      
      const replacePlaceholders = (tmpl: string) => {
        return tmpl
          .replace(/{{name}}/g, visitorName)
          .replace(/{{date}}/g, visitDate)
          .replace(/{{location}}/g, location)
          .replace(/{{url}}/g, passUrl);
      };

      if (status === 'APPROVED') {
        message = replacePlaceholders(settings.templates.preRegApproved || DEFAULT_WHATSAPP_TEMPLATES.preRegApproved);
      } else {
        message = replacePlaceholders(settings.templates.preRegRejected || DEFAULT_WHATSAPP_TEMPLATES.preRegRejected);
      }

      const digitsOnly = req.phone?.replace(/\D/g, '') || '';
      
      if (!digitsOnly || digitsOnly.length < 10) {
        console.warn('Invalid phone number for WhatsApp:', req.phone);
        showToast('Invalid phone number for WhatsApp notification', 'error');
        return;
      }
      
      let formattedPhone = digitsOnly;
      if (formattedPhone.length === 10) {
        formattedPhone = '91' + formattedPhone;
      }
      
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
      
      // Open WhatsApp immediately to avoid popup blockers
      const newWindow = window.open(whatsappUrl, '_blank');
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        window.location.href = whatsappUrl;
      }
      showToast(`WhatsApp link opened for ${req.name}`, 'info');

      // Update Firestore status in background
      await updateDoc(doc(db, 'organizations', organizationId, 'preRegistrations', req.id), {
        whatsappStatus: 'SENT',
        whatsappSentAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      showToast('Failed to update WhatsApp status', 'error');
    }
  };

  const handleManualNotification = async (req: PreRegistration) => {
    const { value: location } = await Swal.fire({
      title: 'WhatsApp Notification',
      input: 'text',
      inputLabel: 'Set Visit Location / Address',
      inputValue: settings.defaultLocation || organizationName || '',
      inputPlaceholder: 'Enter the specific address or location...',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return 'You need to specify a location!';
        }
      },
      confirmButtonText: 'Send WhatsApp',
      confirmButtonColor: '#10b981', // emerald-500
    });

    if (location) {
      handleWhatsAppNotification(req, req.status === 'REJECTED' ? 'REJECTED' : 'APPROVED', location);
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: 'APPROVED' | 'REJECTED') => {
    try {
      const req = requests.find(r => r.id === requestId);
      if (!req) return;

      await updateDoc(doc(db, 'organizations', organizationId, 'preRegistrations', requestId), {
        status: newStatus,
        processedAt: new Date().toISOString(),
        processedBy: user?.uid || 'SYSTEM'
      });

      if (newStatus === 'APPROVED') {
        // Add Notification for approval
        console.log('Creating approval notification for:', requestId);
        await addDoc(collection(db, 'organizations', organizationId, 'notifications'), {
          organizationId,
          title: 'Reg. Approved',
          message: `The visit request from ${req.name} for ${req.visitDate} has been approved.`,
          type: 'SYSTEM',
          read: false,
          timestamp: new Date().toISOString(),
          relatedId: requestId
        }).then(() => console.log('Approval notification created')).catch(err => console.error('Error creating approval notification:', err));

        Swal.fire({
          title: 'Approved!',
          text: 'The visitor request has been approved. Use the WhatsApp button to notify them.',
          icon: 'success',
          timer: 3000,
          showConfirmButton: false
        });
      } else if (newStatus === 'REJECTED') {
         // Add Notification for rejection
         await addDoc(collection(db, 'organizations', organizationId, 'notifications'), {
          organizationId,
          title: 'Reg. Rejected',
          message: `The visit request from ${req.name} for ${req.visitDate} was rejected.`,
          type: 'SYSTEM',
          read: false,
          timestamp: new Date().toISOString(),
          relatedId: requestId
        });

        Swal.fire({
          title: 'Rejected',
          text: 'The visitor request has been rejected. Use the WhatsApp button to notify them.',
          icon: 'info',
          timer: 3000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Swal.fire('Error', 'Failed to update request status', 'error');
    }
  };

  const handleCheckIn = (req: PreRegistration) => {
    setPendingCheckInReq(req);
    setIsSigModalOpen(true);
  };

  const confirmCheckIn = async (signatureData: string) => {
    if (!pendingCheckInReq) return;
    const req = pendingCheckInReq;
    
    try {
      setLoading(true);
      // 1. Create a Visit record
      const visitId = `v_${Date.now()}`;
      const timestamp = new Date().toISOString();
      const date = new Date().toISOString().split('T')[0];
      const checkInTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

      const visitData = {
        visitId,
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
        organizationId,
        createdBy: user?.uid || 'SYSTEM',
        recordedBy: user?.uid || 'SYSTEM',
        recordedByName: user?.name || 'Staff',
        signature: signatureData || req.signature || '',
        preRegistrationId: req.id
      };

      const visitRef = doc(db, 'organizations', organizationId, 'visits', visitId);
      await setDoc(visitRef, sanitizeForFirestore(visitData));

      // 1.5 Update/Create profile record so DOB and Address are stored in the core profile metadata in Firestore
      const profileRef = doc(db, 'organizations', organizationId, 'profiles', req.phone);
      await setDoc(profileRef, sanitizeForFirestore({
        phone: req.phone,
        name: req.name,
        email: req.email || '',
        dob: req.dob || '',
        address: req.address || '',
        organizationId,
        updatedAt: new Date().toISOString()
      }), { merge: true });

      // 2. Mark pre-registration as CHECKED_IN
      await updateDoc(doc(db, 'organizations', organizationId, 'preRegistrations', req.id), {
        status: 'CHECKED_IN',
        processedAt: timestamp,
        processedBy: user?.uid || 'SYSTEM'
      });

      Swal.fire('Success', 'Visitor has been checked in successfully!', 'success');
    } catch (error) {
      console.error('Check-in error:', error);
      Swal.fire('Error', 'Failed to complete check-in', 'error');
    } finally {
      setLoading(false);
      setPendingCheckInReq(null);
      setIsSigModalOpen(false);
    }
  };

  const handleDelete = async (requestId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await updateDoc(doc(db, 'organizations', organizationId, 'preRegistrations', requestId), {
          deleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy: user?.uid || 'SYSTEM'
        });
        Swal.fire('Deleted!', 'Request has been removed from view.', 'success');
      } catch (error) {
        console.error('Error deleting request:', error);
        Swal.fire('Error', 'Failed to delete request', 'error');
      }
    }
  };

  const copyPublicLink = () => {
    const baseUrl = window.location.origin;
    const publicLink = `${baseUrl}/?view=register&orgId=${organizationId}`;
    navigator.clipboard.writeText(publicLink);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
    Swal.fire({
      title: 'Link Copied!',
      text: 'Share this link with visitors to allow them to pre-register.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'center'
    });
  };

  const saveSettings = async () => {
    if (!organizationId) return;
    setIsSavingSettings(true);
    try {
      await updateDoc(doc(db, 'organizations', organizationId), {
        preRegSettings: settings
      });
      setShowSettings(false);
      Swal.fire({
        title: 'Settings Saved',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'center'
      });
    } catch (err) {
      console.error('Error saving settings:', err);
      Swal.fire('Error', 'Failed to save settings', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const addItem = (type: 'purposes' | 'visitorTypes') => {
    Swal.fire({
      title: `Add ${type === 'purposes' ? 'Purpose' : 'Visitor Type'}`,
      input: 'text',
      showCancelButton: true,
      inputValidator: (value) => !value && 'Field cannot be empty!'
    }).then(result => {
      if (result.isConfirmed) {
        setSettings(prev => ({
          ...prev,
          [type]: [...prev[type], result.value]
        }));
      }
    });
  };

  const removeItem = (type: 'purposes' | 'visitorTypes', index: number) => {
    setSettings(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const statusColorMap = {
    'APPROVED': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'CHECKED_IN': 'bg-blue-100 text-blue-700 border-blue-200',
    'COMPLETED': 'bg-slate-100 text-slate-600 border-slate-200',
    'REJECTED': 'bg-red-100 text-red-700 border-red-200',
    'PENDING': 'bg-amber-100 text-amber-700 border-amber-200'
  };

  const getStatusColor = (status: string) => {
    return statusColorMap[status as keyof typeof statusColorMap] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.phone.includes(searchTerm) ||
      (req.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Pre-registration Requests</h2>
          <p className="text-slate-500">Manage incoming visitor requests and approvals</p>
        </div>
        
        <div className="flex items-center gap-3">
          {(user?.role === 'ADMIN' || user?.role === 'MASTER_ADMIN') && (
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              title="Pre-reg Settings"
            >
              <Settings className="w-5 h-5 text-slate-400" />
              Settings
            </button>
          )}
          <button
            onClick={copyPublicLink}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
          >
            {copying ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
            Copy Registration Link
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
          {(['PENDING', 'APPROVED', 'CHECKED_IN', 'COMPLETED', 'REJECTED', 'ALL'] as const).map((status) => (
            <button
               key={status}
               onClick={() => setStatusFilter(status)}
               className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                 statusFilter === status 
                   ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' 
                   : 'text-slate-500 hover:text-slate-700'
               }`}
            >
              {status === 'CHECKED_IN' ? 'Insider' : status === 'COMPLETED' ? 'Finished' : status === 'ALL' ? 'Everything' : (status?.charAt(0) || '') + status?.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p>Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-slate-400 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Calendar className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No requests found</h3>
            <p className="max-w-xs">There are no pre-registration requests matching your current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-sm font-bold text-slate-600">Visitor Details</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600">Scheduled For</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600">Purpose</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600">Status</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600">Submitted</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => (
                  <motion.tr 
                    layout
                    key={req.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                          {(req.name || 'V').charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{req.name}</p>
                          <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5" />
                              {req.phone}
                            </span>
                            {req.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5" />
                                {req.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">
                          {new Date(req.visitDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full border border-slate-200">
                        {req.purpose}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${getStatusColor(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-0.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(req.submittedAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3" />
                          {new Date(req.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {req.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(req.id, 'APPROVED')}
                              className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                              title="Approve"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(req.id, 'REJECTED')}
                              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        {req.status === 'APPROVED' && (
                          <button
                            onClick={() => handleCheckIn(req)}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1 px-3"
                            title="Check-in Now"
                          >
                            <UserPlus className="w-5 h-5" />
                            <span className="text-xs font-bold">Check-in</span>
                          </button>
                        )}
                        {req.status === 'CHECKED_IN' && onCheckOut && (
                          <button
                            onClick={() => onCheckOut(req.id)}
                            className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors flex items-center gap-1 px-3"
                            title="Check-out Now"
                          >
                            <LogOut className="w-5 h-5" />
                            <span className="text-xs font-bold">Check-out</span>
                          </button>
                        )}
                        {(req.status === 'APPROVED' || req.status === 'REJECTED') && (
                          req.whatsappStatus === 'SENT' ? (
                            <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                              <Check className="w-4 h-4" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-[#059669]">Redirected</span>
                              <button 
                                onClick={() => handleManualNotification(req)}
                                className="ml-1 p-1 hover:bg-emerald-100 rounded-md transition-colors"
                                title="Retry WhatsApp"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleManualNotification(req)}
                              className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2 group/wa"
                              title="Notify via WhatsApp"
                            >
                              <MessageSquare className="w-5 h-5" />
                              <span className="hidden group-hover/wa:block text-[10px] font-black uppercase tracking-widest pr-1">Notify</span>
                            </button>
                          )
                        )}
                        <button
                          onClick={() => {
                            const baseUrl = window.location.origin;
                            const passUrl = `${baseUrl}/?passId=${encodeURIComponent(req.id)}&orgId=${encodeURIComponent(organizationId)}`;
                            window.open(passUrl, '_blank');
                          }}
                          className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                          title="View Digital Pass"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(req.id)}
                          className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                          title="Delete Request"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SignatureModal 
        isOpen={isSigModalOpen}
        onClose={() => setIsSigModalOpen(false)}
        onConfirm={confirmCheckIn}
        title={`Signature - ${pendingCheckInReq?.name}`}
      />

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Settings className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Pre-registration Settings</h3>
                    <p className="text-sm text-slate-500">Customize forms and notifications</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">
                {/* Default Location */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 tracking-tight block px-1">
                    Custom Location / Address (for WhatsApp)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={settings.defaultLocation}
                      onChange={(e) => setSettings(prev => ({ ...prev, defaultLocation: e.target.value }))}
                      placeholder="e.g. Main Gate, Building A, 123 Tech Lane..."
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-900 pr-12"
                    />
                  </div>
                  <p className="text-xs text-slate-400 px-1 italic">
                    This location will be used by default in approval/rejection messages.
                  </p>
                </div>

                {/* Purposes Dropdown */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-700 tracking-tight px-1">
                      Visit Purposes
                    </label>
                    <button
                      onClick={() => addItem('purposes')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add New
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {settings.purposes.map((purpose, index) => (
                      <div 
                        key={index}
                        className="group flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-white transition-all shadow-sm"
                      >
                        {purpose}
                        <button 
                          onClick={() => removeItem('purposes', index)}
                          className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visitor Types Dropdown */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-700 tracking-tight px-1">
                      Visitor Types / Categories
                    </label>
                    <button
                      onClick={() => addItem('visitorTypes')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add New
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {settings.visitorTypes.map((type, index) => (
                      <div 
                        key={index}
                        className="group flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-white transition-all shadow-sm"
                      >
                        {type}
                        <button 
                          onClick={() => removeItem('visitorTypes', index)}
                          className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* WhatsApp Message Templates */}
                <div className="space-y-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 px-1">
                    <MessageSquare className="w-5 h-5 text-indigo-500" />
                    <label className="text-sm font-bold text-slate-700 tracking-tight">
                      WhatsApp message Templates
                    </label>
                  </div>
                  
                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">
                        Dynamic Variables: <code className="text-indigo-600 bg-white px-1.5 py-0.5 rounded border border-indigo-100">{"{{name}}"}</code> <code className="text-indigo-600 bg-white px-1.5 py-0.5 rounded border border-indigo-100">{"{{date}}"}</code> <code className="text-indigo-600 bg-white px-1.5 py-0.5 rounded border border-indigo-100">{"{{location}}"}</code> <code className="text-indigo-600 bg-white px-1.5 py-0.5 rounded border border-indigo-100">{"{{url}}"}</code>
                      </p>
                      <button 
                        onClick={() => {
                          Swal.fire({
                            title: 'Reset All Templates?',
                            text: "This will replace all your custom templates with professional defaults.",
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#indigo-600',
                            confirmButtonText: 'Yes, Reset All'
                          }).then(result => {
                            if (result.isConfirmed) {
                              setSettings(prev => ({
                                ...prev,
                                templates: { ...DEFAULT_WHATSAPP_TEMPLATES }
                              }));
                            }
                          });
                        }}
                        className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                      >
                         <RotateCcw className="w-3 h-3" />
                         Reset All
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-slate-500">Pre-registration Approved</label>
                          <button 
                            onClick={() => setSettings(prev => ({ ...prev, templates: { ...prev.templates, preRegApproved: DEFAULT_WHATSAPP_TEMPLATES.preRegApproved } }))}
                            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-600"
                          >
                            Reset to Default
                          </button>
                        </div>
                        <textarea
                          value={settings.templates.preRegApproved}
                          onChange={(e) => setSettings(prev => ({ ...prev, templates: { ...prev.templates, preRegApproved: e.target.value } }))}
                          placeholder="Leave empty for default professional message..."
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm min-h-[100px]"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-slate-500">Pre-registration Rejected</label>
                          <button 
                            onClick={() => setSettings(prev => ({ ...prev, templates: { ...prev.templates, preRegRejected: DEFAULT_WHATSAPP_TEMPLATES.preRegRejected } }))}
                            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-600"
                          >
                            Reset to Default
                          </button>
                        </div>
                        <textarea
                          value={settings.templates.preRegRejected}
                          onChange={(e) => setSettings(prev => ({ ...prev, templates: { ...prev.templates, preRegRejected: e.target.value } }))}
                          placeholder="Leave empty for default professional message..."
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm min-h-[100px]"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-slate-500">Digital Visitor Pass</label>
                          <button 
                            onClick={() => setSettings(prev => ({ ...prev, templates: { ...prev.templates, digitalPass: DEFAULT_WHATSAPP_TEMPLATES.digitalPass } }))}
                            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-600"
                          >
                            Reset to Default
                          </button>
                        </div>
                        <textarea
                          value={settings.templates.digitalPass}
                          onChange={(e) => setSettings(prev => ({ ...prev, templates: { ...prev.templates, digitalPass: e.target.value } }))}
                          placeholder="Leave empty for default professional message..."
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm min-h-[100px]"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-slate-500">Thank You Message</label>
                          <button 
                            onClick={() => setSettings(prev => ({ ...prev, templates: { ...prev.templates, thankYou: DEFAULT_WHATSAPP_TEMPLATES.thankYou } }))}
                            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-600"
                          >
                            Reset to Default
                          </button>
                        </div>
                        <textarea
                          value={settings.templates.thankYou}
                          onChange={(e) => setSettings(prev => ({ ...prev, templates: { ...prev.templates, thankYou: e.target.value } }))}
                          placeholder="Leave empty for default professional message..."
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm min-h-[100px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-4">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-6 py-2.5 text-slate-600 font-bold hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSettings}
                  disabled={isSavingSettings}
                  className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSavingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
