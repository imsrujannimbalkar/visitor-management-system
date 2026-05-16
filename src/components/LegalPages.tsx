import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  FileText, 
  Mail, 
  MessageSquare, 
  CheckCircle, 
  ExternalLink,
  ChevronRight,
  Lock,
  Eye,
  Database,
  Globe,
  X,
  Bug
} from 'lucide-react';

interface LegalPagesProps {
  appName?: string;
  supportEmail?: string;
  organizationName?: string;
}

export const PrivacyPolicy: React.FC<LegalPagesProps> = ({ 
  appName = "Visitor Management System", 
  organizationName = "The Organization" 
}) => {
  const points = [
    {
      title: "Secure Data Handling",
      description: "Secure handling of visitor and organization data ensuring end-to-end encryption.",
      icon: <Shield className="h-5 w-5" />
    },
    {
      title: "Data Isolation",
      description: "Organization-level data isolation and protected access to prevent cross-contamination.",
      icon: <Lock className="h-5 w-5" />
    },
    {
      title: "Cloud Infrastructure",
      description: "Use of Firebase, Firestore, and secure cloud infrastructure for maximum reliability.",
      icon: <Database className="h-5 w-5" />
    },
    {
      title: "Operational Continuity",
      description: "Comprehensive backup and recovery systems for operational continuity and data safety.",
      icon: <Globe className="h-5 w-5" />
    },
    {
      title: "Audited Communication",
      description: "Full authentication, audit logs, and encrypted communication for every interaction.",
      icon: <Eye className="h-5 w-5" />
    }
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {points.map((pt, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex gap-4">
              <div className="shrink-0 w-10 h-10 bg-brand-blue/5 dark:bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center">
                {pt.icon}
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{pt.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {pt.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-4 w-4 text-brand-blue" />
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Document Purpose</h4>
        </div>
        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider">Privacy Policy</span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 italic">Explains how platform data is collected and protected</span>
        </div>
      </div>
    </div>
  );
};

export const TermsOfService: React.FC<LegalPagesProps> = ({ 
  appName = "Visitor Management System" 
}) => {
  const guidelines = [
    {
      title: "Intended Use",
      description: "Platform strictly intended for NGO and visitor management workflows only.",
      icon: <Globe className="h-5 w-5" />
    },
    {
      title: "Account Security",
      description: "Users are responsible for account security and authorized use at all times.",
      icon: <Lock className="h-5 w-5" />
    },
    {
      title: "Service Continuity",
      description: "Service interruptions may occur during scheduled maintenance or system upgrades.",
      icon: <Database className="h-5 w-5" />
    },
    {
      title: "Prohibited Access",
      description: "Unauthorized access or misuse of organization data is strictly prohibited.",
      icon: <Shield className="h-5 w-5" />
    },
    {
      title: "Accepted Protocols",
      description: "Continued use of the platform implies full acceptance of all system terms.",
      icon: <CheckCircle className="h-5 w-5" />
    }
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {guidelines.map((pt, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex gap-4">
              <div className="shrink-0 w-10 h-10 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 rounded-xl flex items-center justify-center">
                {pt.icon}
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{pt.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {pt.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-4 w-4 text-brand-blue" />
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Document Purpose</h4>
        </div>
        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider">Terms of Service</span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 italic">Defines acceptable use and operational responsibilities</span>
        </div>
      </div>
    </div>
  );
};

interface SupportPageProps {
  supportEmail?: string;
  onOpenFeedback?: () => void;
  onOpenBugReport?: () => void;
}

export const SupportPage: React.FC<SupportPageProps> = ({ 
  supportEmail = "imsrujan@outlook.com",
  onOpenFeedback,
  onOpenBugReport
}) => {
  const [selectedArticle, setSelectedArticle] = React.useState<typeof HELP_ARTICLES[0] | null>(null);

  const contactMethods = [
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Email Support",
      description: "Direct assistance for technical issues or data requests.",
      value: supportEmail,
      onClick: () => window.location.href = `mailto:${supportEmail}`
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Feedback Hub",
      description: "Share your thoughts on how we can improve the experience.",
      value: "Submit Feedback",
      onClick: onOpenFeedback
    }
  ];

  return (
    <div className="space-y-6 sm:space-y-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {contactMethods.map((method, idx) => (
          <button 
            key={idx}
            onClick={method.onClick}
            className="group p-6 sm:p-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-brand-blue/30 transition-all duration-500 text-left w-full active:scale-[0.98]"
          >
            <div className="h-12 w-12 sm:h-16 sm:w-16 bg-slate-50 dark:bg-slate-800 text-brand-blue rounded-xl sm:rounded-[1.5rem] flex items-center justify-center mb-4 sm:mb-8 border border-slate-100 dark:border-slate-700 group-hover:scale-110 group-hover:bg-brand-blue group-hover:text-white transition-all duration-500 shadow-sm">
              {React.cloneElement(method.icon as any, { className: "h-6 w-6 sm:h-8 sm:w-8" })}
            </div>
            <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2 italic">
              {method.title.split(' ')[0]} <span className="text-brand-blue not-italic">{method.title.split(' ')[1]}</span>
            </h4>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-6 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
              {method.description}
            </p>
            <div className="flex items-center text-brand-blue font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em] pt-4 border-t border-slate-50 dark:border-slate-800">
              {method.value}
              <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-2 transition-transform" />
            </div>
          </button>
        ))}
      </div>

      <div className="p-8 sm:p-14 bg-slate-900 dark:bg-black rounded-[2.5rem] sm:rounded-[4rem] text-white overflow-hidden relative shadow-2xl">
        <div className="relative z-10 space-y-6 sm:space-y-8">
          <div className="space-y-2">
            <h4 className="text-2xl sm:text-4xl font-black italic tracking-tighter uppercase leading-none">
              Urgent <span className="text-brand-blue not-italic">Technical</span> Help?
            </h4>
            <p className="text-slate-400 text-[10px] sm:text-sm font-medium max-w-md leading-relaxed">
              Our engineering team handles high-priority configuration issues, OAuth failures, and mission-critical bugs instantly.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
            <button 
              onClick={() => window.location.href = `mailto:${supportEmail}`}
              className="group bg-brand-blue hover:bg-blue-600 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-[11px] transition-all shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] active:scale-95 flex items-center justify-center gap-3"
            >
              <Mail className="h-4 w-4" />
              Contact Admin
            </button>
            <button 
              onClick={onOpenBugReport}
              className="bg-white/5 hover:bg-white/10 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-[11px] transition-all border border-white/10 active:scale-95 flex items-center justify-center gap-3 group"
            >
              <Bug className="h-4 w-4 text-rose-500 group-hover:scale-125 transition-transform" />
              Log Critical Bug
            </button>
          </div>
        </div>
        
        <div className="absolute -top-1/4 -right-1/4 w-[500px] h-[500px] bg-brand-blue/10 rounded-full blur-[120px]" />
        <Globe className="absolute top-1/2 -right-12 h-40 w-40 sm:h-64 sm:w-64 text-white/5 -rotate-12 transform -translate-y-1/2" />
      </div>

      <div className="space-y-6">
        <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Common Resources</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {HELP_ARTICLES.map((article, idx) => (
            <button 
              key={idx} 
              onClick={() => setSelectedArticle(article)}
              className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 group cursor-pointer hover:bg-white transition-all text-left"
            >
              <span className="text-sm font-bold text-slate-700">{article.title}</span>
              <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-brand-blue transition-colors" />
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/20"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-blue/10 text-brand-blue rounded-xl">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{selectedArticle.title}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Application Guide</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedArticle(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 sm:p-10 custom-scrollbar space-y-6">
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {selectedArticle.description}
                  </p>
                  <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 italic text-sm text-slate-500 leading-relaxed">
                    {selectedArticle.content}
                  </div>
                </div>

                <div className="mt-12 flex flex-col items-center p-8 bg-brand-blue/5 rounded-[2rem] border border-brand-blue/10">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Still need help?</h4>
                  <p className="text-xs text-slate-500 text-center mb-6">If this guide doesn't resolve your issue, our support team is happy to assist.</p>
                  <button 
                    onClick={() => window.location.href = `mailto:${supportEmail}?subject=Support Request: ${selectedArticle.title}`}
                    className="flex items-center gap-3 bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl active:scale-95"
                  >
                    <Mail className="h-4 w-4" />
                    Contact Support for {selectedArticle.title}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const HELP_ARTICLES = [
  {
    title: "Admin Documentation",
    description: "Learn how to manage your organization, configure staff roles, and manage your data.",
    content: "To begin as an administrator, navigate to the 'Security' or 'Settings' tab. Here you can configure your organization name, logo, and active visitor categories. Role management allows you to designate users as Staff (limited access) or Admin (full system control)."
  },
  {
    title: "Check-in Guide",
    description: "A step-by-step walkthrough for visitors and kiosk attendants on the standard check-in process.",
    content: "The check-in process is designed for speed and security. Visitors should select their 'Purpose of Visit', enter their full name and contact number, and provide a digital signature. For returning visitors, the system will offer to pre-fill their details if they use the same contact information. Staff can authorize check-ins manually or allow visitors to use the Kiosk mode for self-service."
  },
  {
    title: "Data Export Help",
    description: "Guidance on how to export your visitor logs and donation records for offline reporting.",
    content: "Your data is automatically synced to our secure backend database. However, you can also perform manual exports via the 'Analysis' or 'Visitors' tabs. Look for the 'Download CSV' or 'File Spreadsheet' icons to generate an instant report. If you encounter issues with exports, contact your system administrator."
  },
  {
    title: "Emergency Protocols",
    description: "Standard operating procedures for using the Emergency Entry protocol during critical situations.",
    content: "In critical scenarios, use the 'Emergency' floating button. This bypasses the standard check-in fields to log identity and purpose immediately. The system will prioritize these entries and mark them with a high-visibility alert in the logs. Ensure all staff are trained on when to use this feature versus the standard check-in form."
  }
];

export default function LegalCenter({ 
  organizationName, 
  onClose,
  initialView = 'support',
  onOpenFeedback,
  onOpenBugReport
}: { 
  organizationName?: string;
  onClose?: () => void;
  initialView?: 'privacy' | 'terms' | 'support';
  onOpenFeedback?: () => void;
  onOpenBugReport?: () => void;
}) {
  const [activeView, setActiveView] = React.useState<'privacy' | 'terms' | 'support'>(initialView);

  React.useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  const tabs = [
    { id: 'support', label: 'Support', icon: <Mail className="h-4 w-4" /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield className="h-4 w-4" /> },
    { id: 'terms', label: 'Terms', icon: <FileText className="h-4 w-4" /> },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-10 sm:mb-12">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-brand-blue mb-2">
            <Lock className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Security Center</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black italic tracking-tighter text-slate-900 uppercase leading-none">
            Help & <span className="text-brand-blue not-italic">Compliance</span>
          </h2>
        </div>
 
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`
                flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-300 text-[10px] sm:text-[11px] font-black uppercase tracking-wider
                ${activeView === tab.id 
                  ? 'bg-white text-brand-blue shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }
              `}
            >
              <span className="hidden sm:inline">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={activeView}
        initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.4 }}
      >
        {activeView === 'privacy' && <PrivacyPolicy organizationName={organizationName} />}
        {activeView === 'terms' && <TermsOfService />}
        {activeView === 'support' && (
          <SupportPage 
            onOpenFeedback={onOpenFeedback} 
            onOpenBugReport={onOpenBugReport} 
          />
        )}
      </motion.div>

      <div className="mt-20 pt-8 border-t border-slate-100 text-center">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
          <CheckCircle className="h-3 w-3 text-emerald-500" />
          End-to-End Encrypted Data Management System
        </p>
      </div>
    </div>
  );
}
