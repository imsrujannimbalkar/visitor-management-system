import React, { useState, useEffect } from 'react';
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
  Share2,
  Eye,
  Trash2,
  AlertCircle,
  UserPlus,
  LogOut
} from 'lucide-react';
import { db } from '../firebase';
import { sanitizeForFirestore } from '../lib/utils';
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
  addDoc
} from 'firebase/firestore';
import { PreRegistration, User as UserType, PurposeType } from '../types';
import Swal from 'sweetalert2';
import SignatureModal from './SignatureModal';

interface PreRegistrationTabProps {
  organizationId: string;
  user: UserType | null;
  initialStatus?: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHECKED_IN' | 'COMPLETED';
  onCheckOut?: (preRegId: string) => void;
}

export default function PreRegistrationTab({ 
  organizationId, 
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

  useEffect(() => {
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

  const handleWhatsAppNotification = (req: PreRegistration, status: 'APPROVED' | 'REJECTED') => {
    if (!req || !organizationId) return;

    const baseUrl = window.location.origin;
    const passUrl = `${baseUrl}/?passId=${encodeURIComponent(req.id)}&orgId=${encodeURIComponent(organizationId)}`;
    const visitorName = req.name || 'Visitor';
    
    let message = '';
    if (status === 'APPROVED') {
      message = `*Visit Approved!* ✅\n\nHello ${visitorName},\n\nYour visit request for *${req.visitDate}* has been *APPROVED*.\n\n*View Your Digital Pass:* ${passUrl}\n\nPlease present this digital pass at the entrance for check-in.\n\nPowered by VMS Global Secure`;
    } else {
      message = `*Visit Update* ⚠️\n\nHello ${visitorName},\n\nWe regret to inform you that your visit request for *${req.visitDate}* was *NOT APPROVED* at this time.\n\nFor more information, please contact us directly.\n\nPowered by VMS Global Secure`;
    }

    const digitsOnly = req.phone?.replace(/\D/g, '') || '';
    
    if (!digitsOnly || digitsOnly.length < 10) {
      console.warn('Invalid phone number for WhatsApp:', req.phone);
      return;
    }
    
    let formattedPhone = digitsOnly;
    if (formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }
    
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp in a new tab
    const newWindow = window.open(whatsappUrl, '_blank');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.location.href = whatsappUrl;
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
          text: 'The visitor request has been approved. They can now use their pass for entry. Opening WhatsApp to notify them...',
          icon: 'success',
          timer: 3000,
          showConfirmButton: false
        });
        
        // Trigger WhatsApp
        setTimeout(() => handleWhatsAppNotification(req, 'APPROVED'), 1000);
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
          text: 'The visitor request has been rejected. Opening WhatsApp to notify them...',
          icon: 'info',
          timer: 3000,
          showConfirmButton: false
        });

        // Trigger WhatsApp
        setTimeout(() => handleWhatsAppNotification(req, 'REJECTED'), 1000);
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
      position: 'top-end'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'CHECKED_IN': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'COMPLETED': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
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
        
        <button
          onClick={copyPublicLink}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
        >
          {copying ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
          Copy Registration Link
        </button>
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
              {status === 'CHECKED_IN' ? 'Insider' : status === 'COMPLETED' ? 'Finished' : status === 'ALL' ? 'Everything' : status.charAt(0) + status.slice(1).toLowerCase()}
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
                          {req.name.charAt(0)}
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
    </div>
  );
}
