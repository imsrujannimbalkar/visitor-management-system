import React from 'react';
import { motion } from 'motion/react';
import { LogOut, ArrowRight, Building2, Briefcase, UserCheck, ShieldAlert, Award } from 'lucide-react';

interface OrgWorkspace {
  id: string;
  name: string;
  logoUrl?: string;
  role: string;
}

interface WorkspaceSelectorProps {
  orgs: OrgWorkspace[];
  onSelect: (orgId: string) => void;
  onLogout: () => void;
}

export default function WorkspaceSelector({ orgs, onSelect, onLogout }: WorkspaceSelectorProps) {
  const getRoleBadgeColor = (role: string) => {
    switch (role.toUpperCase()) {
      case 'MASTER_ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'ADMIN':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toUpperCase()) {
      case 'MASTER_ADMIN':
        return <Award className="h-3.5 w-3.5 mr-1" />;
      case 'ADMIN':
        return <ShieldAlert className="h-3.5 w-3.5 mr-1" />;
      default:
        return <UserCheck className="h-3.5 w-3.5 mr-1" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-6 selection:bg-indigo-100 relative overflow-hidden font-sans">
      {/* Decorative ambient elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto space-y-10">
        {/* Header Branding */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 px-4 y-2 bg-white border border-slate-100 rounded-2xl shadow-sm text-brand-blue text-[10px] font-black uppercase tracking-widest"
          >
            <Briefcase className="h-4 w-4 text-indigo-600" />
            Security Gateway
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-4xl sm:text-5xl font-black text-slate-950 tracking-tight leading-none mb-1 text-center"
          >
            SELECT WORKSPACE
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 font-bold text-[11px] uppercase tracking-widest"
          >
            Your account is associated with multiple organizations. Choose one to log in:
          </motion.p>
        </div>

        {/* Organizations Grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {orgs.map((org, index) => (
            <motion.div
              key={org.id}
              whileHover={{ y: -6, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="bg-white rounded-3xl p-8 border border-slate-100 hover:border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group absolute-layout gap-8"
            >
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  {/* Organization Logo */}
                  <div className="w-16 h-16 bg-gradient-to-tr from-slate-50 to-slate-100/60 rounded-2xl flex items-center justify-center border border-slate-200/50 shadow-inner group-hover:from-indigo-50 group-hover:to-indigo-100/50 group-hover:border-indigo-150 transition-all duration-350">
                    {org.logoUrl ? (
                      <img
                        src={org.logoUrl}
                        alt={org.name}
                        className="w-10 h-10 object-contain rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Building2 className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    )}
                  </div>

                  {/* Active Role Badge */}
                  <div className={`inline-flex items-center px-3.5 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${getRoleBadgeColor(org.role)}`}>
                    {getRoleIcon(org.role)}
                    {org.role.replace('_', ' ')}
                  </div>
                </div>

                {/* Organization Information */}
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight line-clamp-1 mb-1">
                    {org.name}
                  </h3>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                    ID: {org.id}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelect(org.id)}
                className="w-full py-4 bg-slate-950 text-white hover:bg-indigo-600 font-bold rounded-2xl group-hover:shadow-lg shadow-indigo-500/10 transition-all duration-350 flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
              >
                Enter Workspace
                <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1.5 transition-transform" />
              </button>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center pt-4"
        >
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2.5 px-6 py-3 bg-red-50 hover:bg-red-150 border border-red-100/50 hover:border-red-200 hover:text-red-700 text-red-600 rounded-2xl transition-all font-bold uppercase text-[10px] tracking-widest"
          >
            <LogOut className="h-4 w-4" />
            Sign out of this session
          </button>
        </motion.div>
      </div>
    </div>
  );
}
