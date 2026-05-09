import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  X, 
  Star, 
  Clock, 
  Gift, 
  AlertCircle, 
  CheckCircle2,
  Trash2,
  Inbox,
  Heart,
  Calendar,
  Shield,
  ThumbsUp
} from 'lucide-react';
import { Notification } from '../types';
import { db } from '../firebase';
import { doc, updateDoc, deleteDoc, writeBatch, collection } from 'firebase/firestore';

interface NotificationsCenterProps {
  notifications: Notification[];
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function NotificationsCenter({ 
  notifications, 
  isOpen, 
  onClose,
  organizationId,
  addToast
}: NotificationsCenterProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    if (!organizationId) {
        console.error('Cannot mark all as read: no organizationId');
        addToast('Error: Organization ID missing', 'error');
        return;
    }
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    
    const batch = writeBatch(db);
    unread.forEach(n => {
      const ref = doc(db, 'organizations', organizationId, 'notifications', n.id);
      batch.update(ref, { read: true });
    });
    try {
      await batch.commit();
      addToast('Marked all as read', 'success');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      addToast('Failed to mark all as read', 'error');
    }
  };

  const clearAllNotifications = async () => {
    if (!organizationId) {
        console.error('Cannot clear all: no organizationId');
        addToast('Error: Organization ID missing', 'error');
        return;
    }
    const batch = writeBatch(db);
    notifications.forEach(n => {
      const ref = doc(db, 'organizations', organizationId, 'notifications', n.id);
      batch.update(ref, { 
        deleted: true,
        deletedAt: new Date().toISOString()
      });
    });
    try {
      await batch.commit();
      addToast('All notifications cleared', 'success');
    } catch (err) {
      console.error('Failed to clear notifications:', err);
      addToast('Failed to clear notifications', 'error');
    }
  };

  const markAsRead = async (id: string) => {
    console.log('markAsRead called with orgId:', organizationId, 'and notificationId:', id);
    if (!organizationId) {
        console.error('Cannot mark as read: no organizationId');
        addToast('Error: Organization ID missing', 'error');
        return;
    }
    try {
      const ref = doc(db, 'organizations', organizationId, 'notifications', id);
      await updateDoc(ref, { read: true });
      addToast('Marked as read', 'success');
    } catch (err) {
      console.error('Failed to mark as read:', err);
      addToast('Failed to mark as read', 'error');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const ref = doc(db, 'organizations', organizationId, 'notifications', id);
      await updateDoc(ref, { 
        deleted: true,
        deletedAt: new Date().toISOString()
      });
      addToast('Notification deleted', 'success');
    } catch (err) {
      console.error('Failed to delete notification:', err);
      addToast('Failed to delete notification', 'error');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'REVIEW': return <Star className="h-4 w-4 text-amber-500" />;
      case 'WAITING': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'BIRTHDAY': return <Gift className="h-4 w-4 text-emerald-500" />;
      case 'DONATION': return <Heart className="h-4 w-4 text-rose-500" />;
      case 'ANNIVERSARY': return <Heart className="h-4 w-4 text-rose-500" />;
      case 'PRE_REG': return <Calendar className="h-4 w-4 text-brand-blue" />;
      case 'OCCASION': return <Calendar className="h-4 w-4 text-brand-blue" />;
      case 'SYSTEM': return <Shield className="h-4 w-4 text-slate-700" />;
      case 'KIOSK_ASSISTANCE': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-slate-500" />;
    }
  };

  const approveKioskExit = async (id: string) => {
    try {
      const ref = doc(db, 'organizations', organizationId, 'notifications', id);
      await updateDoc(ref, { 
        title: 'Kiosk Exit Approved',
        message: 'Exit authorized by staff.',
        approved: true,
        read: true 
      });
      addToast('Kiosk exit approved', 'success');
    } catch (err) {
      console.error('Failed to approve kiosk exit:', err);
      addToast('Failed to approve kiosk exit', 'error');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[8000]"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-2xl z-[8001] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center relative">
                  <Bell className="h-5 w-5 text-slate-900" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center ring-2 ring-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Notifications</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workspace Alerts</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            {/* Actions */}
            {notifications.length > 0 && (
              <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <button 
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="text-[10px] font-black text-brand-blue uppercase tracking-widest hover:text-blue-700 disabled:opacity-40 flex items-center gap-2"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Mark all as read
                </button>
                <button 
                  onClick={clearAllNotifications}
                  className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-700 flex items-center gap-2"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear All
                </button>
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
                  <Inbox className="h-12 w-12 text-slate-300" />
                  <div>
                    <p className="font-bold text-slate-900 uppercase tracking-widest text-xs">All caught up!</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">No new alerts found</p>
                  </div>
                </div>
              ) : (
                notifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl border transition-all group ${
                      notif.read 
                        ? 'bg-white border-slate-100 opacity-60' 
                        : 'bg-slate-50 border-slate-200 ring-2 ring-brand-blue/5'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                        notif.read ? 'bg-slate-100' : 'bg-white shadow-sm'
                      }`}>
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">
                            {notif.title}
                          </h3>
                          <span className="text-[9px] font-black text-slate-300 uppercase shrink-0 pt-0.5">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                           {!notif.read && (
                             <div className="flex gap-2">
                               {notif.type === 'KIOSK_ASSISTANCE' && (
                                 <button 
                                   onClick={() => approveKioskExit(notif.id)}
                                   className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-800 flex items-center gap-1"
                                 >
                                   <ThumbsUp className="h-3 w-3" />
                                   Approve Exit
                                 </button>
                               )}
                               <button 
                                 onClick={() => markAsRead(notif.id)}
                                 className="text-[9px] font-black text-brand-blue uppercase tracking-widest hover:text-blue-700"
                               >
                                 Mark Read
                               </button>
                             </div>
                           )}
                           <button 
                             onClick={() => deleteNotification(notif.id)}
                             className="text-[9px] font-black text-slate-300 hover:text-red-500 uppercase tracking-widest ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                             <Trash2 className="h-3 w-3" />
                           </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/30">
               <p className="text-[10px] font-medium text-slate-400 text-center uppercase tracking-[0.2em]">
                 End of alerts
               </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
