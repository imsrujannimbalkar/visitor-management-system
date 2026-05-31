import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Report } from '../types';

interface ReportsTabProps {
  organizationId: string;
}

export default function ReportsTab({ organizationId }: ReportsTabProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports?organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setReports(data || []);
      } else {
        throw new Error('Failed to fetch reports');
      }
    } catch (err) {
      setError('Could not load reports. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchReports();
    }
  }, [organizationId]);

  const handleDownload = (reportId: string) => {
    window.open(`/api/reports/${reportId}/download?organizationId=${organizationId}`, '_blank');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Reports & Backups</h2>
          <p className="text-slate-500 text-lg">Manage your automated monthly data exports and recovery files.</p>
        </div>
        <button 
          onClick={fetchReports}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all font-medium shadow-sm"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 border border-blue-100 p-8 rounded-3xl space-y-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-xl">Automated Backups</h3>
            <p className="text-slate-600 mt-2">Monthly visitor data is automatically archived and emailed to the master admin on the 1st of each month.</p>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl space-y-4">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-xl">Monthly Intervals</h3>
            <p className="text-slate-600 mt-2">Reports cover a full calendar month of activity, formatted in professional Excel spreadsheets.</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 p-8 rounded-3xl space-y-4">
          <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-xl">Data Recovery</h3>
            <p className="text-slate-600 mt-2">In the event of database issues, these external backups provide a reliable way to restore your records.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-8 py-10 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            Generated Reports
          </h3>
          <span className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full text-sm font-semibold">
            {reports.length} Total
          </span>
        </div>

        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="p-20 text-center space-y-4">
              <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-slate-500 font-medium tracking-wide uppercase text-xs">Loading Backup History...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8 text-slate-300" />
              </div>
              <div>
                <p className="text-slate-900 font-bold text-xl">No reports found</p>
                <p className="text-slate-500 mt-2">Your implementation of reports will start appearing here once the next month begins.</p>
              </div>
            </div>
          ) : (
            reports.map((report) => (
              <motion.div 
                key={report.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 hover:bg-slate-50/50 transition-colors group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shadow-sm ${
                      report.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {report.status === 'COMPLETED' ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-xl font-bold text-slate-900">
                          {new Date(report.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          report.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Layers className="w-4 h-4 opacity-70" />
                          {report.stats.totalVisitors} Visitors Exported
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        <span>{(report.stats.fileSize / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleDownload(report.id)}
                      disabled={report.status !== 'COMPLETED'}
                      className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-md ${
                        report.status === 'COMPLETED' 
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 active:scale-95' 
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Download className="w-5 h-5" />
                      Download Data
                      <ArrowRight className="w-5 h-5 ml-1 opacity-50 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
        
        {!loading && reports.length > 0 && (
          <div className="bg-slate-50/50 p-8 border-t border-slate-100 text-center">
            <p className="text-slate-500 font-medium flex items-center justify-center gap-2 italic">
              <AlertCircle className="w-5 h-5 opacity-70" />
              Exports are generated in .xlsx format for wide compatibility.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
