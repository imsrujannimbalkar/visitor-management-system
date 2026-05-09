import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, Search, Filter, Calendar, User, Info, AlertTriangle, Shield, LogIn, LogOut, Trash2, PlusCircle, Edit } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { ActivityLog, User as AppUser } from '../types';

interface ActivityLogsTabProps {
  organizationId: string;
  users: AppUser[];
}

export default function ActivityLogsTab({ organizationId, users }: ActivityLogsTabProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    if (!organizationId) return;

    const q = query(
      collection(db, 'organizations', organizationId, 'activityLogs'),
      orderBy('timestamp', 'desc'),
      limit(200)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData: ActivityLog[] = [];
      snapshot.forEach((doc) => {
        logsData.push({ id: doc.id, ...doc.data() } as ActivityLog);
      });
      setLogs(logsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching logs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [organizationId]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN': return <LogIn className="h-4 w-4 text-emerald-500" />;
      case 'LOGOUT': return <LogOut className="h-4 w-4 text-amber-500" />;
      case 'SIGNUP': return <PlusCircle className="h-4 w-4 text-blue-500" />;
      case 'CREATE_VISITOR': return <PlusCircle className="h-4 w-4 text-emerald-600" />;
      case 'UPDATE_VISITOR': return <Edit className="h-4 w-4 text-amber-600" />;
      case 'DELETE_VISITOR': return <Trash2 className="h-4 w-4 text-rose-500" />;
      case 'BULK_DELETE': return <Trash2 className="h-4 w-4 text-rose-600" />;
      case 'BULK_CHECK_OUT': return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      default: return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (action.includes('UPDATE')) return 'bg-amber-50 text-amber-700 border-amber-100';
    if (action.includes('DELETE')) return 'bg-rose-50 text-rose-700 border-rose-100';
    if (action === 'LOGIN') return 'bg-blue-50 text-blue-700 border-blue-100';
    return 'bg-gray-50 text-gray-700 border-gray-100';
  };

  const filteredLogs = logs.filter(log => {
    const user = users.find(u => u.uid === log.userId);
    const matchesSearch = 
      (user?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.action.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.details.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <History className="h-8 w-8 text-brand-blue" />
            Activity Logs
          </h2>
          <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-xs">Security audit trail and system actions</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filter logs..."
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all w-60"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all cursor-pointer"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="all">All Actions</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">User</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Action</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <Shield className="h-10 w-10 text-gray-200 mb-4" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No activity logs found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const user = users.find(u => u.uid === log.userId);
                    return (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                            <Calendar className="h-3.5 w-3.5 opacity-50" />
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-brand-blue/10 rounded-lg flex items-center justify-center">
                              <User className="h-4 w-4 text-brand-blue" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 leading-none mb-1">{user?.name || 'Unknown'}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{user?.role || 'SYSTEM'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider ${getActionColor(log.action)}`}>
                            {getActionIcon(log.action)}
                            {log.action}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-bold text-gray-600 max-w-md truncate" title={log.details}>
                            {log.details}
                          </p>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
