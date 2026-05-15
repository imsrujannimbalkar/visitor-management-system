import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PhoneCall, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  MessageSquare, 
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Trash2,
  Edit2,
  ChevronDown,
  ArrowRight,
  Download,
  UserCheck,
  Bell,
  Check
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Inquiry, Organization, User as AppUser, PurposeType } from '../types';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { sanitizeForFirestore } from '../lib/utils';
import { useToast } from './Toast';

interface InquiryTrackerProps {
  organization: Organization;
  user: AppUser | null;
}

export default function InquiryTracker({ organization, user }: InquiryTrackerProps) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInquiry, setEditingInquiry] = useState<Inquiry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'newest'>('newest');
  const { showToast } = useToast();
  
  // Form state
  const [formData, setFormData] = useState({
    callerName: '',
    callerPhone: '',
    callerEmail: '',
    purpose: '',
    followUpDate: format(new Date(), 'yyyy-MM-dd'),
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    notes: '',
    reminderSet: false
  });

  useEffect(() => {
    if (!organization?.id) return;

    const q = query(
      collection(db, 'organizations', organization.id, 'inquiries'),
      where('deleted', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Inquiry[];
      
      setInquiries(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [organization?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !organization) return;

    try {
      const inquiryData = {
        organizationId: organization.id,
        callerName: formData.callerName,
        callerPhone: formData.callerPhone,
        callerEmail: formData.callerEmail,
        purpose: formData.purpose,
        followUpDate: formData.followUpDate,
        status: editingInquiry ? editingInquiry.status : 'PENDING' as const,
        priority: formData.priority,
        notes: formData.notes,
        reminderSet: formData.reminderSet,
        recordedBy: user.uid,
        recordedByName: user.name,
        updatedAt: new Date().toISOString(),
        deleted: false
      };

      if (editingInquiry) {
        await updateDoc(doc(db, 'organizations', organization.id, 'inquiries', editingInquiry.id), inquiryData);
        Swal.fire('Updated!', 'Inquiry has been updated.', 'success');
      } else {
        await addDoc(collection(db, 'organizations', organization.id, 'inquiries'), {
          ...inquiryData,
          createdAt: new Date().toISOString(),
          reminded: false
        });
        Swal.fire('Success!', 'New inquiry added.', 'success');
      }

      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving inquiry:', error);
      Swal.fire('Error', 'Failed to save inquiry.', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      callerName: '',
      callerPhone: '',
      callerEmail: '',
      purpose: '',
      followUpDate: format(new Date(), 'yyyy-MM-dd'),
      priority: 'MEDIUM',
      notes: '',
      reminderSet: false
    });
    setEditingInquiry(null);
  };

  const handleDelete = async (id: string) => {
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
        await updateDoc(doc(db, 'organizations', organization.id, 'inquiries', id), {
          deleted: true,
          updatedAt: new Date().toISOString()
        });
        Swal.fire('Deleted!', 'Inquiry has been removed.', 'success');
      } catch (error) {
        console.error('Error deleting inquiry:', error);
      }
    }
  };

  const updateStatus = async (id: string, nextStatus: Inquiry['status']) => {
    try {
      await updateDoc(doc(db, 'organizations', organization.id, 'inquiries', id), {
        status: nextStatus,
        updatedAt: new Date().toISOString()
      });
      
      const statusLabels = {
        'PENDING': 'set to Pending',
        'IN_PROGRESS': 'moved to In Progress',
        'COMPLETED': 'marked as Completed',
        'CANCELLED': 'cancelled'
      };

      Swal.fire({
        title: 'Status Updated',
        text: `Inquiry has been ${statusLabels[nextStatus]}.`,
        icon: 'success',
        toast: true,
        position: 'center',
        showConfirmButton: false,
        timer: 2000
      });
    } catch (error) {
      console.error('Error updating status:', error);
      Swal.fire({
        title: 'Update Failed',
        text: 'Failed to update inquiry status.',
        icon: 'error',
        position: 'center'
      });
    }
  };

  const sendWhatsAppFollowup = async (inquiry: Inquiry) => {
    try {
      const phone = inquiry.callerPhone.replace(/\D/g, '');
      const formattedPhone = phone.length === 10 ? '91' + phone : phone;
      
      const message = `Dear ${inquiry.callerName},\n\nThis is regarding your inquiry about *${inquiry.purpose}* at *${organization.name}*.\n\nWe would like to follow up with you. Please let us know if you have any further questions.\n\nRegards,\n*${user?.name || organization.name}*`;
      
      const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
      
      // Update status in Firestore
      await updateDoc(doc(db, 'organizations', organization.id, 'inquiries', inquiry.id), {
        whatsappStatus: 'SENT',
        whatsappSentAt: new Date().toISOString()
      });

      window.open(url, '_blank');
      showToast(`Follow-up sent to ${inquiry.callerName}`, 'success');
    } catch (error) {
      console.error('Error sending WhatsApp follow-up:', error);
      showToast('Failed to send WhatsApp follow-up', 'error');
    }
  };

  const handleManualCheckIn = async (inquiry: Inquiry) => {
    const result = await Swal.fire({
      title: 'Direct Check-In?',
      text: `Do you want to check in ${inquiry.callerName} as an active visitor?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Check In'
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const visitId = `v_${Date.now()}`;
        const timestamp = new Date().toISOString();
        const date = new Date().toISOString().split('T')[0];
        const checkInTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

        // Map Inquiry Purpose to PurposeType or 'Other'
        const validPurposes: PurposeType[] = [
          'Meeting', 'Donation', 'Volunteering', 'Inquiry', 'Event', 'Interview', 
          'Student Visit', 'Service Visit', 'Delivery', 'Official Visit', 
          'Company Visit', 'Maintenance Work', 'Other'
        ];
        
        let mappedPurpose: PurposeType = 'Inquiry';
        if (validPurposes.includes(inquiry.purpose as PurposeType)) {
          mappedPurpose = inquiry.purpose as PurposeType;
        }

        const visitData = {
          visitId,
          visitorPhone: inquiry.callerPhone,
          visitorName: inquiry.callerName,
          visitorEmail: inquiry.callerEmail || '',
          purpose: mappedPurpose,
          category: 'Guest',
          notes: inquiry.notes || `Referenced from Inquiry ID: ${inquiry.id}`,
          date,
          checkInTime,
          status: 'INSIDE' as const,
          organizationId: organization.id,
          createdBy: user?.uid || 'SYSTEM',
          recordedBy: user?.uid || 'SYSTEM',
          recordedByName: user?.name || 'Staff'
        };

        await setDoc(doc(db, 'organizations', organization.id, 'visits', visitId), sanitizeForFirestore(visitData));
        
        // Mark inquiry as COMPLETED
        await updateDoc(doc(db, 'organizations', organization.id, 'inquiries', inquiry.id), {
          status: 'COMPLETED',
          updatedAt: new Date().toISOString()
        });

        Swal.fire({
          title: 'Checked In!',
          text: 'Visitor has been registered as INSIDE.',
          icon: 'success',
          position: 'center'
        });
      } catch (error) {
        console.error('Error during manual check-in:', error);
        Swal.fire({
          title: 'Check-In Failed',
          text: 'An error occurred during the process.',
          icon: 'error',
          position: 'center'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const exportToCSV = () => {
    if (inquiries.length === 0) return;

    const headers = [
      'Name', 'Phone', 'Email', 'Purpose', 'Follow-up Date', 'Priority', 'Status', 'CreatedAt', 'Recorded By'
    ];

    const csvContent = [
      headers.join(','),
      ...inquiries.map(i => [
        `"${i.callerName}"`,
        `"${i.callerPhone}"`,
        `"${i.callerEmail || ''}"`,
        `"${i.purpose}"`,
        `"${i.followUpDate}"`,
        `"${i.priority}"`,
        `"${i.status}"`,
        `"${i.createdAt}"`,
        `"${i.recordedByName}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Inquiries_${organization.name}_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Inquiries exported successfully', 'success');
  };

  const filteredAndSortedInquiries = React.useMemo(() => {
    let result = inquiries.filter(i => {
      const matchesSearch = 
        i.callerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.callerPhone.includes(searchTerm) ||
        i.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || i.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    if (sortBy === 'priority') {
      const priorityMap: Record<string, number> = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      result.sort((a, b) => {
        const diff = priorityMap[b.priority] - priorityMap[a.priority];
        if (diff !== 0) return diff;
        return new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime();
      });
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      result.sort((a, b) => new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime());
    }

    return result;
  }, [inquiries, searchTerm, statusFilter, sortBy]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'MEDIUM': return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const getStatusConfig = (status: Inquiry['status']) => {
    switch (status) {
      case 'COMPLETED': return { icon: <CheckCircle2 className="h-5 w-5" />, color: 'emerald', label: 'Completed' };
      case 'CANCELLED': return { icon: <XCircle className="h-5 w-5" />, color: 'slate', label: 'Cancelled' };
      case 'IN_PROGRESS': return { icon: <ArrowRight className="h-5 w-5" />, color: 'indigo', label: 'In Progress' };
      default: return { icon: <Clock className="h-5 w-5" />, color: 'amber', label: 'Pending' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <PhoneCall className="h-7 w-7 text-indigo-600" />
            Inquiry Tracker
          </h2>
          <p className="text-sm font-medium text-slate-500">Manage calls and follow-up schedules</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm active:scale-95"
          >
            <Download className="h-5 w-5" />
            Export
          </button>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Add Inquiry
          </button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: inquiries.length, color: 'indigo', icon: PhoneCall },
          { label: 'Pending', value: inquiries.filter(i => i.status === 'PENDING').length, color: 'amber', icon: Clock },
          { label: 'In Progress', value: inquiries.filter(i => i.status === 'IN_PROGRESS').length, color: 'blue', icon: ArrowRight },
          { label: 'Completed', value: inquiries.filter(i => i.status === 'COMPLETED').length, color: 'emerald', icon: CheckCircle2 }
        ].map(stat => (
          <div key={stat.label} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              <p className="text-xl font-black text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Sorting */}
      <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone or purpose..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar">
            {(['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  statusFilter === status 
                    ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block mx-1"></div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sort:</span>
            <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-2xl border border-slate-200">
              <button
                onClick={() => setSortBy('newest')}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  sortBy === 'newest' 
                    ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                New
              </button>
              <button
                onClick={() => setSortBy('date')}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  sortBy === 'date' 
                    ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Follow
              </button>
              <button
                onClick={() => setSortBy('priority')}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  sortBy === 'priority' 
                    ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Priority
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inquiry List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredAndSortedInquiries.map((inquiry) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={inquiry.id}
              className={`group bg-white rounded-2xl border p-5 transition-all hover:shadow-xl hover:-translate-y-1 ${
                inquiry.status === 'COMPLETED' ? 'opacity-75 border-slate-100 grayscale-[0.3]' : 'border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${
                    inquiry.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 
                    inquiry.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600' : 
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {getStatusConfig(inquiry.status).icon}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 leading-none">{inquiry.callerName}</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1">{inquiry.callerPhone}</p>
                  </div>
                </div>
                
                <div className="relative group/menu">
                  <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                  <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 w-48">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 space-y-1">
                      <button
                        onClick={() => { setEditingInquiry(inquiry); setFormData({
                          callerName: inquiry.callerName,
                          callerPhone: inquiry.callerPhone,
                          callerEmail: inquiry.callerEmail || '',
                          purpose: inquiry.purpose,
                          followUpDate: inquiry.followUpDate,
                          priority: inquiry.priority,
                          notes: inquiry.notes || '',
                          reminderSet: inquiry.reminderSet || false
                        }); setShowAddModal(true); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all"
                      >
                        <Edit2 className="h-4 w-4" /> Edit Inquiry
                      </button>
                      <button
                        onClick={() => sendWhatsAppFollowup(inquiry)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                          inquiry.whatsappStatus === 'SENT' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <PhoneCall className="h-4 w-4" /> 
                          {inquiry.whatsappStatus === 'SENT' ? 'Follow-up Sent' : 'WhatsApp Follow-up'}
                        </div>
                        {inquiry.whatsappStatus === 'SENT' && <CheckCircle2 className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleManualCheckIn(inquiry)}
                        disabled={inquiry.status === 'COMPLETED'}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                          inquiry.status === 'COMPLETED' ? 'opacity-50 cursor-not-allowed text-slate-400' : 'text-indigo-600 hover:bg-indigo-50'
                        }`}
                      >
                        <UserCheck className="h-4 w-4" /> Convert to Visit
                      </button>
                      <div className="h-px bg-slate-50 my-1"></div>
                      <button
                        onClick={() => handleDelete(inquiry.id)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 className="h-4 w-4" /> Delete Record
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-slate-400 shrink-0" />
                  <p className="text-sm font-bold text-slate-600 line-clamp-1">{inquiry.purpose}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className={`text-xs font-black uppercase tracking-tighter ${
                    new Date(inquiry.followUpDate) < new Date() && (inquiry.status === 'PENDING' || inquiry.status === 'IN_PROGRESS')
                      ? 'text-rose-600 underline decoration-2'
                      : 'text-slate-500'
                  }`}>
                    Follow up: {format(new Date(inquiry.followUpDate), 'dd MMM yyyy')}
                  </span>
                  {inquiry.reminderSet && (
                    <Bell className={`h-3.5 w-3.5 ${inquiry.reminded ? 'text-emerald-500' : 'text-indigo-500 animate-pulse'}`} />
                  )}
                </div>

                {inquiry.notes && (
                  <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2 italic font-medium">
                    "{inquiry.notes}"
                  </p>
                )}

                <div className="pt-2 flex flex-col gap-2 border-t border-slate-50">
                  <div className="flex items-center justify-between">
                    <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest border ${getPriorityColor(inquiry.priority)}`}>
                      {inquiry.priority}
                    </div>
                    <div className={`text-[10px] font-black text-slate-400 flex items-center gap-1`}>
                      <Clock className="h-3 w-3" />
                      {format(new Date(inquiry.createdAt), 'MMM d')}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100">
                    {(['PENDING', 'IN_PROGRESS', 'COMPLETED'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => updateStatus(inquiry.id, status)}
                        className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                          inquiry.status === status
                            ? status === 'COMPLETED' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' :
                              status === 'IN_PROGRESS' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-100' :
                              'bg-amber-500 text-white shadow-lg shadow-amber-100'
                            : 'text-slate-400 hover:text-slate-600 px-1'
                        }`}
                      >
                        {status === 'IN_PROGRESS' ? 'WORKING' : status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredAndSortedInquiries.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center">
            <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-200">
              <PhoneCall className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-black text-slate-700">No inquiries found</h3>
            <p className="text-slate-500 font-medium max-w-xs mx-auto mt-1">Start tracking incoming calls and follow-ups today.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-auto max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
            >
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex justify-between items-center shrink-0">
                <h3 className="text-white font-black text-lg">
                  {editingInquiry ? 'Edit Inquiry' : 'Add New Inquiry'}
                </h3>
                <button
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 ml-1">
                      <User className="h-3 w-3 text-indigo-500" /> Caller Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                      <input
                        required
                        type="text"
                        placeholder="e.g. John Doe"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold placeholder:text-slate-300 placeholder:font-medium"
                        value={formData.callerName}
                        onChange={e => setFormData({ ...formData, callerName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 ml-1">
                      <PhoneCall className="h-3 w-3 text-indigo-500" /> Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative group">
                      <PhoneCall className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                      <input
                        required
                        type="tel"
                        placeholder="+91 98765 43210"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold font-mono placeholder:text-slate-300 placeholder:font-medium"
                        value={formData.callerPhone}
                        onChange={e => setFormData({ ...formData, callerPhone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 ml-1">
                    <Mail className="h-3 w-3 text-indigo-500" /> Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="email"
                      placeholder="john@example.com"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold placeholder:text-slate-300 placeholder:font-medium"
                      value={formData.callerEmail}
                      onChange={e => setFormData({ ...formData, callerEmail: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 ml-1">
                    <MessageSquare className="h-3 w-3 text-indigo-500" /> Purpose of Inquiry <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      required
                      type="text"
                      placeholder="e.g. Donation inquiry, Membership, etc."
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold placeholder:text-slate-300 placeholder:font-medium"
                      value={formData.purpose}
                      onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 ml-1">
                      <Calendar className="h-3 w-3 text-indigo-500" /> Follow-up Date <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative group">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors z-10" />
                      <input
                        required
                        type="date"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold"
                        value={formData.followUpDate}
                        onChange={e => setFormData({ ...formData, followUpDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 ml-1">
                      <AlertCircle className="h-3 w-3 text-indigo-500" /> Priority <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative group">
                      <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors z-10 pointer-events-none" />
                      <select
                        className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold appearance-none cursor-pointer"
                        value={formData.priority}
                        onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                      >
                        <option value="LOW">Low Priority</option>
                        <option value="MEDIUM">Medium Priority</option>
                        <option value="HIGH">High Priority</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 ml-1">
                    <Edit2 className="h-3 w-3 text-indigo-500" /> Additional Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Add any specific details or conversation summary..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold resize-none placeholder:text-slate-300 placeholder:font-medium"
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 group cursor-pointer" onClick={() => setFormData({ ...formData, reminderSet: !formData.reminderSet })}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.reminderSet ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}>
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Set Follow-up Reminder</p>
                    <p className="text-[9px] font-bold text-slate-400">Receive a system notification on the follow-up date</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${formData.reminderSet ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200'}`}>
                    {formData.reminderSet && <Check className="h-3 w-3 text-white" />}
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowAddModal(false); resetForm(); }}
                    className="flex-1 px-6 py-3 border border-slate-200 rounded-2xl text-sm font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                  >
                    {editingInquiry ? 'Update Inquiry' : 'Record Inquiry'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
