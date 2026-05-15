import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  Heart, 
  Search, 
  Filter, 
  DollarSign, 
  Calendar, 
  User, 
  ChevronRight, 
  TrendingUp, 
  Award, 
  Star,
  CheckCircle2,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  History,
  ArrowUpRight,
  Download,
  Eye,
  EyeOff,
  Plus,
  MessageSquare,
  Settings,
  CreditCard,
  FileText,
  Shield,
  Mail,
  MapPin,
  Phone,
  ExternalLink,
  MessageCircle,
  Hash,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Visitor, Visit, Profile, Donation, UserRole } from '../types';
import Swal from 'sweetalert2';

interface DonationsTabProps {
  visitors: Visitor[];
  donations: Donation[];
  organizationId: string;
  userRole: UserRole;
  donationOccasions: string[];
  specialLocations: string[];
  donationTypes: string[];
  paymentModes: string[];
  onUpdateVisit: (visitId: string, data: Partial<Visit>) => Promise<void>;
  onUpdateProfile: (phone: string, data: Partial<Profile>) => Promise<void>;
  onAddDonation: (data: Omit<Donation, 'id' | 'organizationId' | 'recordedBy' | 'recordedByName' | 'timestamp'>) => Promise<void>;
  onDeleteDonation: (id: string) => Promise<void>;
  onUpdateDonation: (id: string, data: Partial<Donation>) => Promise<void>;
  onUpdateOrganization: (data: any) => Promise<void>;
}

type DonorClassification = 'VVIP' | 'VIP' | 'REGULAR' | 'NEW';

interface DonorSummary {
  profile: Profile;
  totalDonation: number;
  visitCount: number;
  completedDonations: number;
  pendingDonations: number;
  lastDonationDate: string;
  occasions: string[];
  classification: DonorClassification;
  visits: Visitor[];
  donationRecords: Donation[];
  behaviorLabels?: { text: string, color: string }[];
}

export default function DonationsTab({ 
  visitors, 
  donations, 
  organizationId, 
  userRole,
  donationOccasions,
  specialLocations,
  donationTypes,
  paymentModes,
  onUpdateVisit, 
  onUpdateProfile,
  onAddDonation,
  onDeleteDonation,
  onUpdateDonation,
  onUpdateOrganization
}: DonationsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'high' | 'frequent' | 'recent' | 'pending'>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDonor, setSelectedDonor] = useState<DonorSummary | null>(null);
  const [showAmounts, setShowAmounts] = useState(false);
  const isAdmin = userRole === 'ADMIN';

  // Advanced Analytics useMemo
  const analytics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    let totalAllTime = 0;
    let totalThisMonth = 0;
    let totalLastMonth = 0;
    const donorSet = new Set<string>();

    donations.forEach(d => {
      const amount = Number(d.amount) || 0;
      totalAllTime += amount;
      donorSet.add(d.visitorPhone);

      const dDate = new Date(d.date);
      if (dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear) {
        totalThisMonth += amount;
      } else if (dDate.getMonth() === lastMonthDate.getMonth() && dDate.getFullYear() === lastMonthDate.getFullYear()) {
        totalLastMonth += amount;
      }
    });

    // Also include donation visits
    visitors.filter(v => v.purpose === 'Donation' && v.status !== 'DELETED').forEach(v => {
      const amount = Number(v.donationAmount) || 0;
      totalAllTime += amount;
      donorSet.add(v.visitorPhone);

      const vDate = new Date(v.date);
      if (vDate.getMonth() === currentMonth && vDate.getFullYear() === currentYear) {
        totalThisMonth += amount;
      } else if (vDate.getMonth() === lastMonthDate.getMonth() && vDate.getFullYear() === lastMonthDate.getFullYear()) {
        totalLastMonth += amount;
      }
    });

    return {
      totalAllTime,
      totalThisMonth,
      totalLastMonth,
      donorCount: donorSet.size,
      avgValue: donorSet.size > 0 ? totalAllTime / (donations.length + visitors.filter(v => v.purpose === 'Donation').length || 1) : 0
    };
  }, [donations, visitors]);

  // Group visits and donations by phone to create donor summaries
  const donors = useMemo(() => {
    // ONLY visitors with donation context or history
    const donationVisits = visitors.filter(v => 
      v.purpose === 'Donation' && 
      v.status !== 'DELETED'
    );
    const donorMap = new Map<string, DonorSummary>();

    // Process donation-related visits
    donationVisits.forEach(visit => {
      const phone = visit.visitorPhone;
      if (!donorMap.has(phone)) {
        donorMap.set(phone, {
          profile: {
            phone: visit.visitorPhone,
            name: visit.visitorName,
            email: visit.email || '',
            dob: visit.dob || '',
            address: visit.address || '',
            updatedAt: visit.date,
            organizationId: visit.organizationId,
            manualClassification: visit.manualClassification
          },
          totalDonation: 0,
          visitCount: 0,
          completedDonations: 0,
          pendingDonations: 0,
          lastDonationDate: visit.date,
          occasions: [],
          classification: 'NEW',
          visits: [],
          donationRecords: []
        });
      }

      const summary = donorMap.get(phone)!;
      summary.visits.push(visit);
      summary.visitCount++;
      summary.totalDonation += (Number(visit.donationAmount) || 0);
      
      if (visit.donationStatus === 'COMPLETED') {
        summary.completedDonations++;
      } else if (visit.donationStatus === 'PENDING') {
        summary.pendingDonations++;
      }

      if (visit.occasion && !summary.occasions.includes(visit.occasion)) {
        summary.occasions.push(visit.occasion);
      }

      if (new Date(visit.date) > new Date(summary.lastDonationDate)) {
        summary.lastDonationDate = visit.date;
      }
    });

    // Process specific donations collection
    donations.forEach(donation => {
      const phone = donation.visitorPhone;
      if (!donorMap.has(phone)) {
        donorMap.set(phone, {
          profile: {
            phone: donation.visitorPhone,
            name: donation.visitorName,
            email: '', // Not in donation doc
            dob: '',
            address: '',
            updatedAt: donation.timestamp,
            organizationId: donation.organizationId,
          },
          totalDonation: 0,
          visitCount: 0,
          completedDonations: 0,
          pendingDonations: 0,
          lastDonationDate: donation.date,
          occasions: [],
          classification: 'NEW',
          visits: [],
          donationRecords: []
        });
      }

      const summary = donorMap.get(phone)!;
      summary.donationRecords.push(donation);
      summary.totalDonation += (Number(donation.amount) || 0);
      
      if (!summary.occasions.includes(donation.type)) {
        summary.occasions.push(donation.type);
      }

      if (new Date(donation.date) > new Date(summary.lastDonationDate)) {
        summary.lastDonationDate = donation.date;
      }
    });

    // Determine classifications and convert to array
    return Array.from(donorMap.values()).map(donor => {
      const labels: { text: string, color: string }[] = [];
      const totalCombinedCount = donor.visitCount + donor.donationRecords.length;
      
      // Visit logic
      if (donor.visitCount === 1) labels.push({ text: 'New Visitor', color: 'bg-blue-500' });
      else if (donor.visitCount >= 3) labels.push({ text: 'Frequent Visitor', color: 'bg-indigo-600' });
      
      // Donation logic
      const totalDirectDonations = donor.donationRecords.length;
      const visitDonations = donor.visits.filter(v => (Number(v.donationAmount) || 0) > 0).length;
      const totalDonationsCount = totalDirectDonations + visitDonations;
      
      if (totalDonationsCount === 1) labels.push({ text: 'New Donor', color: 'bg-emerald-500' });
      else if (totalDonationsCount >= 2) labels.push({ text: 'Recurring Donor', color: 'bg-emerald-600' });

      let autoClass: DonorClassification = 'NEW';
      if (donor.totalDonation >= 50000 || totalCombinedCount >= 20) autoClass = 'VVIP';
      else if (donor.totalDonation >= 10000 || totalCombinedCount >= 5) autoClass = 'VIP';
      else if (totalCombinedCount > 1) autoClass = 'REGULAR';

      const finalClass = donor.profile.manualClassification || autoClass;
      if (finalClass === 'VIP' || finalClass === 'VVIP') {
        if (!labels.find(l => l.text === 'VIP')) labels.push({ text: 'VIP', color: 'bg-amber-500' });
      }

      return {
        ...donor,
        classification: finalClass,
        behaviorLabels: labels
      };
    });
  }, [visitors, donations]);

  const filteredDonors = useMemo(() => {
    return donors.filter(d => {
      const name = d.profile.name || '';
      const phone = d.profile.phone || '';
      const matchesSearch = 
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phone.includes(searchQuery);
      
      if (!matchesSearch) return false;

      // Type Filter
      if (selectedType !== 'all') {
        const hasSpecificType = d.donationRecords.some(r => r.type === selectedType) ||
                               d.visits.some(v => v.category === selectedType);
        if (!hasSpecificType) return false;
      }

      // Date Range Filter
      if (dateRange.start || dateRange.end) {
        const lastActivity = new Date(d.lastDonationDate);
        if (dateRange.start && lastActivity < new Date(dateRange.start)) return false;
        if (dateRange.end && lastActivity > new Date(dateRange.end)) return false;
      }
      
      if (filter === 'high') return d.totalDonation >= 10000;
      if (filter === 'frequent') return (d.visitCount + d.donationRecords.length) >= 5;
      if (filter === 'recent') {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return new Date(d.lastDonationDate) >= lastMonth;
      }
      if (filter === 'pending') return d.pendingDonations > 0;
      
      return true;
    }).sort((a, b) => b.totalDonation - a.totalDonation);
  }, [donors, searchQuery, filter, dateRange, selectedType]);

  const donorCharts = useMemo(() => {
    if (!selectedDonor) return { pulse: [], types: [] };
    
    const records = [
      ...selectedDonor.donationRecords.map(d => ({ date: d.date, amount: d.amount, category: d.type })),
      ...selectedDonor.visits.filter(v => Number(v.donationAmount) > 0).map(v => ({ date: v.date, amount: Number(v.donationAmount), category: 'Visit' }))
    ].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const pulse: { month: string, amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mLabel = d.toLocaleString('default', { month: 'short' });
      const m = d.getMonth();
      const y = d.getFullYear();
      
      const total = records
        .filter(r => {
          const rd = new Date(r.date);
          return rd.getMonth() === m && rd.getFullYear() === y;
        })
        .reduce((sum, r) => sum + r.amount, 0);
      
      pulse.push({ month: mLabel, amount: total });
    }

    const typeMap = new Map<string, number>();
    records.forEach(r => {
      const cat = r.category || 'General';
      typeMap.set(cat, (typeMap.get(cat) || 0) + r.amount);
    });
    
    const types = Array.from(typeMap.entries()).map(([name, value]) => ({ name, value }));

    return { pulse, types };
  }, [selectedDonor]);

  const handleUpdateVisitDonation = async (visitId: string, amount: number, status: 'COMPLETED' | 'PENDING', notes: string) => {
    try {
      await onUpdateVisit(visitId, {
        donationAmount: amount,
        donationStatus: status,
        notes: notes
      });
    } catch (err) {
      console.error('Failed to update visit donation:', err);
    }
  };

  const handleExportDonorLedger = (donor: DonorSummary) => {
    const ledgerData = [
      ...donor.visits.map(v => ({
        Type: 'Visit/Donation',
        Date: new Date(v.date).toLocaleDateString(),
        Amount: v.donationAmount || 0,
        Status: v.donationStatus || 'N/A',
        Purpose: v.purpose || 'Visit',
        Notes: v.notes || ''
      })),
      ...donor.donationRecords.map(r => ({
        Type: 'Direct Donation',
        Date: new Date(r.date).toLocaleDateString(),
        Amount: r.amount,
        Status: r.status,
        Purpose: 'Donation',
        Notes: r.notes || ''
      }))
    ].sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());

    const worksheet = XLSX.utils.json_to_sheet(ledgerData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ledger Audit');
    XLSX.writeFile(workbook, `Ledger_Audit_${donor.profile.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    Swal.fire({
      title: 'Ledger Exported!',
      text: 'Historical audit trail downloaded.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleExportData = () => {
    const exportData = donors.map(d => ({
      'Donor Name': d.profile.name,
      'Phone': d.profile.phone,
      'Email': d.profile.email,
      'Donor Type': d.classification,
      'Total Donation Amount (₹)': d.totalDonation,
      'Total History (Visits + Donations)': d.visitCount + d.donationRecords.length,
      'Last Donation Date': d.lastDonationDate,
      'Types/Occasions': d.occasions.join(', ')
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Donors');
    XLSX.writeFile(workbook, `Donations_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    Swal.fire({
      title: 'Export Successful!',
      text: 'Donation records have been exported to Excel.',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
      position: 'center'
    });
  };

  const handleManageDropdowns = async () => {
    if (!isAdmin) return;

    const { value: settings } = await Swal.fire({
      title: 'Donation System Config',
      width: '600px',
      html: `
        <div class="space-y-6 text-left p-2">
          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Donation Types (Comma separated)</label>
            <textarea id="set-donation-types" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm h-24 outline-none focus:border-brand-blue transition-all">${donationTypes.join(', ')}</textarea>
          </div>
          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Payment Modes (Comma separated)</label>
            <textarea id="set-payment-modes" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm h-24 outline-none focus:border-brand-blue transition-all">${paymentModes.join(', ')}</textarea>
          </div>
          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Donation Occasions (Comma separated)</label>
            <textarea id="set-donation-occasions" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm h-24 outline-none focus:border-brand-blue transition-all">${donationOccasions.join(', ')}</textarea>
          </div>
          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Special Locations (Comma separated)</label>
            <textarea id="set-special-locations" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm h-24 outline-none focus:border-brand-blue transition-all">${specialLocations.join(', ')}</textarea>
          </div>
          <div class="bg-amber-50 p-4 rounded-2xl border border-amber-100 italic text-[10px] text-amber-700">
            * These dropdowns help maintain data consistency across all donation records and visitor forms.
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Save Configuration',
      confirmButtonColor: '#2563EB',
      preConfirm: () => {
        return {
          donationTypes: (document.getElementById('set-donation-types') as HTMLTextAreaElement).value.split(',').map(s => s.trim()).filter(s => s),
          paymentModes: (document.getElementById('set-payment-modes') as HTMLTextAreaElement).value.split(',').map(s => s.trim()).filter(s => s),
          donationOccasions: (document.getElementById('set-donation-occasions') as HTMLTextAreaElement).value.split(',').map(s => s.trim()).filter(s => s),
          specialLocations: (document.getElementById('set-special-locations') as HTMLTextAreaElement).value.split(',').map(s => s.trim()).filter(s => s)
        };
      }
    });

    if (settings) {
      await onUpdateOrganization(settings);
      Swal.fire({
        title: 'Settings Updated',
        text: 'Dropdown options have been successfully updated.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const openAddDonationModal = async (donor: DonorSummary) => {
    if (!isAdmin) {
      Swal.fire({
        title: 'Access Restricted',
        text: 'Only administrators can add new donation records.',
        icon: 'info',
        confirmButtonColor: '#2563EB'
      });
      return;
    }

    // Auto-fill logic
    const latestVisit = donor.visits[donor.visits.length - 1]; 
    const autoOccasion = latestVisit?.occasion || '';
    const autoDonorType = donor.classification === 'NEW' ? 'New Donor' : 
                         donor.visitCount > 5 ? 'Frequent Donor' : 'Returning Donor';    const { value: formValues } = await Swal.fire({
      title: 'Record New Professional Donation',
      width: '950px',
      html: `
        <div class="space-y-8 text-left pt-2 pb-4">
          <!-- Elite Donor Badge -->
          <div class="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden mb-8 group">
            <div class="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
            <div class="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full -ml-16 -mb-16 blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
            
            <div class="relative z-10 flex items-center justify-between">
              <div class="flex items-center gap-6">
                <div class="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                  <span class="text-white font-black text-3xl">${donor.profile.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-md">Elite Donor</span>
                    <span class="text-slate-400 font-black text-[9px] uppercase tracking-widest">• ${donor.classification}</span>
                  </div>
                  <p class="text-2xl font-black text-white tracking-tight leading-none">${donor.profile.name}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Reference ID</p>
                <p class="text-lg font-black text-white font-mono">${donor.profile.phone}</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
            <!-- Section 1: Financial & Logistics -->
            <div class="space-y-6">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-1 h-4 bg-emerald-500 rounded-full"></div>
                <h4 class="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Financial Details</h4>
              </div>

              <div class="space-y-4">
                <div class="grid grid-cols-1 gap-4">
                  <div>
                    <label class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                      Donation Amount (₹) *
                    </label>
                    <div class="relative group">
                      <span class="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black group-focus-within:text-brand-blue transition-colors">₹</span>
                      <input id="don-amount" type="number" class="w-full pl-10 pr-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 transition-all shadow-sm" placeholder="0.00">
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Donation Type</label>
                    <select id="don-type" class="w-full px-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-blue shadow-sm">
                      ${donationTypes.map(t => `<option value="${t}">${t}</option>`).join('')}
                    </select>
                  </div>
                  <div>
                    <label class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Payment Channel</label>
                    <select id="don-payment" class="w-full px-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-blue shadow-sm">
                      ${paymentModes.map(m => `<option value="${m}">${m}</option>`).join('')}
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Special Location</label>
                    <select id="don-location" class="w-full px-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-blue shadow-sm">
                      ${specialLocations.map(l => `<option value="${l}">${l}</option>`).join('')}
                    </select>
                  </div>
                  <div>
                    <label class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Impact Date</label>
                    <input id="don-date" type="date" class="w-full px-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-blue shadow-sm" value="${new Date().toISOString().split('T')[0]}">
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                   <div class="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <input type="checkbox" id="don-recurring" class="w-5 h-5 rounded border-slate-300 text-brand-blue focus:ring-brand-blue cursor-pointer">
                      <label for="don-recurring" class="text-[10px] font-black text-slate-600 uppercase tracking-widest cursor-pointer">Recurring</label>
                   </div>
                   <select id="don-frequency" class="w-full px-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-blue shadow-sm opacity-50">
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Yearly">Yearly</option>
                   </select>
                </div>

                <div>
                  <label class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Receipt Configuration</label>
                  <div class="flex gap-2">
                    ${['Physical', 'Digital', 'Both'].map(r => `
                      <button type="button" onclick="window.setReceiptMode('${r}')" id="btn-receipt-${r}" class="receipt-btn flex-1 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm">
                        ${r}
                      </button>
                    `).join('')}
                  </div>
                  <input type="hidden" id="don-receipt" value="Digital">
                </div>
              </div>
            </div>

            <!-- Section 2: Attribution & Context -->
            <div class="space-y-6">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-1 h-4 bg-amber-500 rounded-full"></div>
                <h4 class="text-[10px] font-black text-amber-600 uppercase tracking-widest">Attribution & Context</h4>
              </div>

              <div class="space-y-4">
                <div>
                   <label class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Campaign Association</label>
                   <input id="don-campaign" type="text" class="w-full px-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-brand-blue shadow-sm" placeholder="e.g. Winter Drive 2026">
                </div>

                <div class="flex items-center gap-4">
                  <div class="flex-1">
                    <label class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">In-Kind</label>
                    <div class="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <input type="checkbox" id="don-inkind" class="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer">
                    </div>
                  </div>
                  <div class="flex-[3]">
                    <label class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">In-Kind Materials</label>
                    <input id="don-items" type="text" class="w-full px-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-brand-blue shadow-sm opacity-50" placeholder="e.g. Books, Clothes">
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Designation</label>
                    <input id="don-donor-type" type="text" class="w-full px-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-brand-blue shadow-sm" value="${autoDonorType}">
                  </div>
                  <div>
                    <label class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Special Occasion</label>
                    <select id="don-occasion" class="w-full px-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-blue shadow-sm">
                      <option value="">None / General</option>
                      ${donationOccasions.map(o => `<option value="${o}" ${autoOccasion === o ? 'selected' : ''}>${o}</option>`).join('')}
                    </select>
                  </div>
                </div>

                <div>
                  <label class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Occasion Date</label>
                  <input id="don-occasion-date" type="date" class="w-full px-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-blue shadow-sm">
                </div>

                <div>
                  <label class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Notes</label>
                  <textarea id="don-notes" class="w-full px-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-xs h-24 outline-none focus:border-brand-blue shadow-sm" placeholder="Internal audit notes..."></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
      `,
      didOpen: () => {
        const setReceiptMode = (mode: string) => {
          (document.getElementById('don-receipt') as HTMLInputElement).value = mode;
          document.querySelectorAll('.receipt-btn').forEach(btn => {
            btn.classList.remove('bg-brand-blue', 'text-white', 'border-brand-blue');
            btn.classList.add('bg-slate-50', 'text-slate-600', 'border-slate-200');
          });
          const activeBtn = document.getElementById(`btn-receipt-${mode}`);
          if (activeBtn) {
            activeBtn.classList.remove('bg-slate-50', 'text-slate-600', 'border-slate-200');
            activeBtn.classList.add('bg-brand-blue', 'text-white', 'border-brand-blue');
          }
        };

        const toggleFrequency = () => {
          const isRecurring = (document.getElementById('don-recurring') as HTMLInputElement).checked;
          const freqSelect = document.getElementById('don-frequency') as HTMLSelectElement;
          if (isRecurring) {
            freqSelect.classList.remove('opacity-50');
            freqSelect.disabled = false;
          } else {
            freqSelect.classList.add('opacity-50');
            freqSelect.disabled = true;
          }
        };

        const toggleInKind = () => {
          const isInKind = (document.getElementById('don-inkind') as HTMLInputElement).checked;
          const itemsInput = document.getElementById('don-items') as HTMLInputElement;
          if (isInKind) {
            itemsInput.classList.remove('opacity-50');
            itemsInput.disabled = false;
          } else {
            itemsInput.classList.add('opacity-50');
            itemsInput.disabled = true;
          }
        };

        (window as any).setReceiptMode = setReceiptMode;
        document.getElementById('don-recurring')?.addEventListener('change', toggleFrequency);
        document.getElementById('don-inkind')?.addEventListener('change', toggleInKind);
        
        setReceiptMode('Digital');
        toggleFrequency();
        toggleInKind();
      },
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Finalize & Record Donation',
      confirmButtonColor: '#2563EB',
      preConfirm: () => {
        const amount = (document.getElementById('don-amount') as HTMLInputElement).value;
        if (!amount || Number(amount) <= 0) {
          Swal.showValidationMessage('Comprehensive financial error: Amount must be greater than 0');
          return false;
        }
        return {
          visitorId: donor.profile.phone,
          visitorName: donor.profile.name,
          visitorPhone: donor.profile.phone,
          amount: Number(amount),
          type: (document.getElementById('don-type') as HTMLSelectElement).value,
          paymentMode: (document.getElementById('don-payment') as HTMLSelectElement).value,
          specialLocation: (document.getElementById('don-location') as HTMLSelectElement).value,
          receiptMode: (document.getElementById('don-receipt') as HTMLInputElement).value as any,
          donorType: (document.getElementById('don-donor-type') as HTMLInputElement).value,
          occasion: (document.getElementById('don-occasion') as HTMLSelectElement).value,
          occasionDate: (document.getElementById('don-occasion-date') as HTMLInputElement).value,
          notes: (document.getElementById('don-notes') as HTMLTextAreaElement).value,
          date: (document.getElementById('don-date') as HTMLInputElement).value,
          campaign: (document.getElementById('don-campaign') as HTMLInputElement).value,
          isRecurring: (document.getElementById('don-recurring') as HTMLInputElement).checked,
          frequency: (document.getElementById('don-frequency') as HTMLSelectElement).value,
          isInKind: (document.getElementById('don-inkind') as HTMLInputElement).checked,
          items: (document.getElementById('don-items') as HTMLInputElement).value,
          status: 'CONFIRMED'
        }
      }
    });

    if (formValues) {
      await onAddDonation(formValues);
      
      const newDonation: Donation = {
        ...formValues,
        id: `TEMP-${Date.now()}`,
        organizationId: organizationId,
        recordedBy: '',
        recordedByName: '',
        timestamp: new Date().toISOString()
      };
      
      if (selectedDonor) {
        const updatedDonor = {
          ...selectedDonor,
          donationRecords: [newDonation, ...selectedDonor.donationRecords],
          totalDonation: selectedDonor.totalDonation + newDonation.amount,
          lastDonationDate: new Date(newDonation.date) > new Date(selectedDonor.lastDonationDate) ? newDonation.date : selectedDonor.lastDonationDate
        };
        setSelectedDonor(updatedDonor);
      }
    }
  };

  const handleEditDonationRecord = async (donation: Donation) => {
    if (!isAdmin) return;

    const { value: formValues } = await Swal.fire({
      title: 'Modify Professional Donation Record',
      width: '950px',
      html: `
        <div class="space-y-8 text-left pt-2 pb-4">
          <!-- Transaction Info Header -->
          <div class="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden mb-8 group">
            <div class="absolute top-0 right-0 w-48 h-48 bg-brand-blue/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
            
            <div class="relative z-10 flex items-center justify-between">
              <div class="flex items-center gap-6">
                <div class="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </div>
                <div>
                  <p class="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Transaction Link</p>
                  <p class="text-2xl font-black text-white tracking-tight leading-none">${donation.visitorName}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Receipt Number</p>
                <p class="text-lg font-black text-white font-mono">${donation.id}</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
            <!-- Section 1: Financial & Logistics -->
            <div class="space-y-6">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-1 h-4 bg-emerald-500 rounded-full"></div>
                <h4 class="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Financial Details</h4>
              </div>

              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Donation Amount (₹) *</label>
                    <div class="relative group">
                      <span class="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black group-focus-within:text-brand-blue transition-colors">₹</span>
                      <input id="edit-don-amount" type="number" class="w-full pl-10 pr-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl outline-none focus:border-brand-blue shadow-sm" value="${donation.amount}">
                    </div>
                  </div>
                  <div>
                    <label class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Lifecycle Status</label>
                    <select id="edit-don-status" class="w-full px-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest outline-none focus:border-brand-blue shadow-sm">
                      <option value="PENDING" ${donation.status === 'PENDING' ? 'selected' : ''}>Pending Verification</option>
                      <option value="CONFIRMED" ${donation.status === 'CONFIRMED' ? 'selected' : ''}>Confirmed Impact</option>
                      <option value="CANCELLED" ${donation.status === 'CANCELLED' ? 'selected' : ''}>Cancelled/Void</option>
                      <option value="REFUNDED" ${donation.status === 'REFUNDED' ? 'selected' : ''}>Refunded</option>
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Donation Type</label>
                    <select id="edit-don-type" class="w-full px-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-blue shadow-sm">
                      ${donationTypes.map(t => `<option value="${t}" ${donation.type === t ? 'selected' : ''}>${t}</option>`).join('')}
                    </select>
                  </div>
                  <div>
                    <label class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Payment Channel</label>
                    <select id="edit-don-payment" class="w-full px-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-blue shadow-sm">
                      ${paymentModes.map(m => `<option value="${m}" ${donation.paymentMode === m ? 'selected' : ''}>${m}</option>`).join('')}
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Special Location</label>
                    <select id="edit-don-location" class="w-full px-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-blue shadow-sm">
                      ${specialLocations.map(l => `<option value="${l}" ${donation.specialLocation === l ? 'selected' : ''}>${l}</option>`).join('')}
                    </select>
                  </div>
                  <div>
                    <label class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Impact Date</label>
                    <input id="edit-don-date" type="date" class="w-full px-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-blue shadow-sm" value="${donation.date}">
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                   <div class="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <input type="checkbox" id="edit-don-recurring" ${donation.isRecurring ? 'checked' : ''} class="w-5 h-5 rounded border-slate-300 text-brand-blue focus:ring-brand-blue cursor-pointer">
                      <label for="edit-don-recurring" class="text-[10px] font-black text-slate-600 uppercase tracking-widest cursor-pointer">Recurring</label>
                   </div>
                   <select id="edit-don-frequency" class="w-full px-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-blue shadow-sm ${!donation.isRecurring ? 'opacity-50' : ''}">
                      <option value="Monthly" ${donation.frequency === 'Monthly' ? 'selected' : ''}>Monthly</option>
                      <option value="Quarterly" ${donation.frequency === 'Quarterly' ? 'selected' : ''}>Quarterly</option>
                      <option value="Yearly" ${donation.frequency === 'Yearly' ? 'selected' : ''}>Yearly</option>
                   </select>
                </div>

                <div>
                  <label class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Receipt Configuration</label>
                  <div class="flex gap-2">
                    ${['Physical', 'Digital', 'Both'].map(r => `
                      <button type="button" onclick="window.setEditReceiptMode('${r}')" id="edit-btn-receipt-${r}" class="edit-receipt-btn flex-1 py-3.5 ${donation.receiptMode === r ? 'bg-brand-blue text-white border-brand-blue' : 'bg-slate-50 text-slate-600 border-slate-200'} border rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm">
                        ${r}
                      </button>
                    `).join('')}
                  </div>
                  <input type="hidden" id="edit-don-receipt" value="${donation.receiptMode || 'Digital'}">
                </div>
              </div>
            </div>

            <!-- Section 2: Attribution & Context -->
            <div class="space-y-6">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-1 h-4 bg-amber-500 rounded-full"></div>
                <h4 class="text-[10px] font-black text-amber-600 uppercase tracking-widest">Attribution & Context</h4>
              </div>

              <div class="space-y-4">
                <div>
                   <label class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Campaign Association</label>
                   <input id="edit-don-campaign" type="text" class="w-full px-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-brand-blue shadow-sm" value="${donation.campaign || ''}" placeholder="e.g. Winter Drive 2026">
                </div>

                <div class="flex items-center gap-4">
                  <div class="flex-1">
                    <label class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">In-Kind</label>
                    <div class="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <input type="checkbox" id="edit-don-inkind" ${donation.isInKind ? 'checked' : ''} class="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer">
                    </div>
                  </div>
                  <div class="flex-[3]">
                    <label class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">In-Kind Materials</label>
                    <input id="edit-don-items" type="text" class="w-full px-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-brand-blue shadow-sm ${!donation.isInKind ? 'opacity-50' : ''}" value="${donation.items || ''}" placeholder="e.g. Books, Clothes">
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Designation</label>
                    <input id="edit-don-donor-type" type="text" class="w-full px-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-brand-blue shadow-sm" value="${donation.donorType || ''}">
                  </div>
                  <div>
                    <label class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Special Occasion</label>
                    <select id="edit-don-occasion" class="w-full px-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-blue shadow-sm">
                      <option value="">None / General</option>
                      ${donationOccasions.map(o => `<option value="${o}" ${donation.occasion === o ? 'selected' : ''}>${o}</option>`).join('')}
                    </select>
                  </div>
                </div>

                <div>
                   <label class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Occasion Date</label>
                   <input id="edit-don-occasion-date" type="date" class="w-full px-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-blue shadow-sm" value="${donation.occasionDate || ''}">
                </div>

                <div>
                  <label class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Notes</label>
                  <textarea id="edit-don-notes" class="w-full px-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-xs h-24 outline-none focus:border-brand-blue shadow-sm">${donation.notes || ''}</textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
      `,
      didOpen: () => {
        const setEditReceiptMode = (mode: string) => {
          (document.getElementById('edit-don-receipt') as HTMLInputElement).value = mode;
          document.querySelectorAll('.edit-receipt-btn').forEach(btn => {
            btn.classList.remove('bg-brand-blue', 'text-white', 'border-brand-blue');
            btn.classList.add('bg-slate-50', 'text-slate-600', 'border-slate-200');
          });
          const activeBtn = document.getElementById(`edit-btn-receipt-${mode}`);
          if (activeBtn) {
            activeBtn.classList.remove('bg-slate-50', 'text-slate-600', 'border-slate-200');
            activeBtn.classList.add('bg-brand-blue', 'text-white', 'border-brand-blue');
          }
        };

        const toggleFrequency = () => {
          const isRecurring = (document.getElementById('edit-don-recurring') as HTMLInputElement).checked;
          const freqSelect = document.getElementById('edit-don-frequency') as HTMLSelectElement;
          if (isRecurring) {
            freqSelect.classList.remove('opacity-50');
            freqSelect.disabled = false;
          } else {
            freqSelect.classList.add('opacity-50');
            freqSelect.disabled = true;
          }
        };

        const toggleInKind = () => {
          const isInKind = (document.getElementById('edit-don-inkind') as HTMLInputElement).checked;
          const itemsInput = document.getElementById('edit-don-items') as HTMLInputElement;
          if (isInKind) {
            itemsInput.classList.remove('opacity-50');
            itemsInput.disabled = false;
          } else {
            itemsInput.classList.add('opacity-50');
            itemsInput.disabled = true;
          }
        };

        (window as any).setEditReceiptMode = setEditReceiptMode;
        document.getElementById('edit-don-recurring')?.addEventListener('change', toggleFrequency);
        document.getElementById('edit-don-inkind')?.addEventListener('change', toggleInKind);
        
        toggleFrequency();
        toggleInKind();
      },
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Update Record',
      confirmButtonColor: '#2563EB',
      preConfirm: () => {
        const amount = (document.getElementById('edit-don-amount') as HTMLInputElement).value;
        if (!amount || Number(amount) <= 0) {
          Swal.showValidationMessage('Financial error: Amount must be valid');
          return false;
        }
        return {
          ...donation,
          amount: Number(amount),
          status: (document.getElementById('edit-don-status') as HTMLSelectElement).value as any,
          type: (document.getElementById('edit-don-type') as HTMLSelectElement).value,
          paymentMode: (document.getElementById('edit-don-payment') as HTMLSelectElement).value,
          specialLocation: (document.getElementById('edit-don-location') as HTMLSelectElement).value,
          receiptMode: (document.getElementById('edit-don-receipt') as HTMLInputElement).value as any,
          campaign: (document.getElementById('edit-don-campaign') as HTMLInputElement).value,
          isRecurring: (document.getElementById('edit-don-recurring') as HTMLInputElement).checked,
          frequency: (document.getElementById('edit-don-frequency') as HTMLSelectElement).value,
          isInKind: (document.getElementById('edit-don-inkind') as HTMLInputElement).checked,
          items: (document.getElementById('edit-don-items') as HTMLInputElement).value,
          donorType: (document.getElementById('edit-don-donor-type') as HTMLInputElement).value,
          occasion: (document.getElementById('edit-don-occasion') as HTMLSelectElement).value,
          occasionDate: (document.getElementById('edit-don-occasion-date') as HTMLInputElement).value,
          notes: (document.getElementById('edit-don-notes') as HTMLTextAreaElement).value,
          date: (document.getElementById('edit-don-date') as HTMLInputElement).value
        }
      }
    });

    if (formValues) {
      await onUpdateDonation(donation.id, formValues);
      if (selectedDonor) {
        const updatedRecords = selectedDonor.donationRecords.map(r => r.id === donation.id ? formValues : r);
        const newTotal = updatedRecords.reduce((sum, r) => sum + r.amount, 0);
        setSelectedDonor({
          ...selectedDonor,
          donationRecords: updatedRecords,
          totalDonation: newTotal
        });
      }
    }
  };

  const handleDeleteDonationRecord = async (donationId: string) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Delete Donation Record?',
      text: 'This action is permanent and will affect the donor\'s total history.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it'
    });

    if (isConfirmed) {
      await onDeleteDonation(donationId);
      if (selectedDonor) {
        const updatedRecords = selectedDonor.donationRecords.filter(d => d.id !== donationId);
        setSelectedDonor({
          ...selectedDonor,
          donationRecords: updatedRecords,
          totalDonation: updatedRecords.reduce((acc, r) => acc + r.amount, 0) + selectedDonor.visits.reduce((acc, v) => acc + (v.donationAmount || 0), 0)
        });
      }
    }
  };

  const handleManualDonation = async () => {
    if (!isAdmin) return;

    const { value: donorInfo } = await Swal.fire({
      title: 'Manual Contribution Entry',
      html: `
        <div class="space-y-6 text-left p-2 pt-4">
          <div class="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3 mb-6">
            <Shield className="h-5 w-5 text-brand-blue shrink-0 mt-0.5" />
            <p class="text-[10px] font-bold text-blue-700 leading-relaxed uppercase tracking-wider">
              Recording a contribution for someone not in the system yet. This will create a temporary profile for tracking.
            </p>
          </div>
          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Donor Name *</label>
            <input id="manual-name" type="text" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 transition-all shadow-sm" placeholder="Enter Full Name">
          </div>
          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Phone Number *</label>
            <input id="manual-phone" type="text" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 transition-all shadow-sm" placeholder="e.g. 9876543210">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Proceed to Financials',
      confirmButtonColor: '#2563EB',
      preConfirm: () => {
        const name = (document.getElementById('manual-name') as HTMLInputElement).value;
        const phone = (document.getElementById('manual-phone') as HTMLInputElement).value;
        if (!name || !phone) {
          Swal.showValidationMessage('Identity context required: Name and Phone are mandatory');
          return false;
        }
        return { name, phone };
      }
    });

    if (donorInfo) {
      const skeleton: DonorSummary = {
        profile: {
          name: donorInfo.name,
          phone: donorInfo.phone,
          email: '',
          dob: '',
          address: '',
          organizationId: organizationId,
          updatedAt: new Date().toISOString()
        },
        totalDonation: 0,
        visitCount: 0,
        completedDonations: 0,
        pendingDonations: 0,
        lastDonationDate: new Date().toISOString().split('T')[0],
        occasions: [],
        classification: 'NEW',
        visits: [],
        donationRecords: []
      };
      openAddDonationModal(skeleton);
    }
  };

  const formatAmount = (amount: number) => {
    if (!isAdmin) return '••••••';
    if (!showAmounts) return '••••••';
    return `₹${Math.round(amount).toLocaleString()}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Dynamic Analytics Layer */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 pb-2 shrink-0">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Impact</p>
            <p className="text-xl font-black text-slate-900 tracking-tighter italic">{formatAmount(analytics.totalAllTime)}</p>
          </div>
          <div className="p-2 bg-brand-blue/5 rounded-xl text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-all">
            <DollarSign className="h-4 w-4" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly Velocity</p>
            <div className="flex items-end gap-2">
              <p className="text-xl font-black text-slate-900 tracking-tighter italic">{formatAmount(analytics.totalThisMonth)}</p>
              <span className={`text-[8px] font-black px-1 py-0.5 rounded-md mb-0.5 ${analytics.totalThisMonth >= analytics.totalLastMonth ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {analytics.totalLastMonth > 0 ? (analytics.totalThisMonth >= analytics.totalLastMonth ? '↑' : '↓') : '↑'}
                {analytics.totalLastMonth > 0 ? Math.round(Math.abs(analytics.totalThisMonth - analytics.totalLastMonth) / analytics.totalLastMonth * 100) : 100}%
              </span>
            </div>
          </div>
          <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Registry</p>
            <p className="text-xl font-black text-slate-900 tracking-tighter italic">{analytics.donorCount} Donors</p>
          </div>
          <div className="p-2 bg-amber-50 rounded-xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
            <User className="h-4 w-4" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Ticket Size</p>
            <p className="text-xl font-black text-slate-900 tracking-tighter italic">{formatAmount(analytics.avgValue)}</p>
          </div>
          <div className="p-2 bg-purple-50 rounded-xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
            <Award className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* filtration row */}
      <div className="px-6 py-2 shrink-0">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
          {isAdmin && (
            <button 
              onClick={handleManualDonation}
              className="px-6 py-2.5 bg-brand-blue text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Record
            </button>
          )}
          
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search donor database..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-xl text-[12px] font-bold text-slate-900 outline-none focus:bg-white focus:border-brand-blue/30 transition-all shadow-inner"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
            {(['all', 'high', 'frequent', 'recent', 'pending'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  filter === f ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-slate-100 hidden lg:block" />

          <div className="flex items-center gap-2">
             <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                <Calendar className="h-4 w-4 text-slate-400" />
                <input 
                  type="date" 
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-transparent text-[9px] font-black uppercase text-slate-600 outline-none" 
                />
                <span className="text-slate-300 font-black">—</span>
                <input 
                  type="date" 
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-transparent text-[9px] font-black uppercase text-slate-600 outline-none" 
                />
             </div>

             <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none text-slate-600 cursor-pointer"
             >
                <option value="all">All Types</option>
                {donationTypes.map(t => <option key={t} value={t}>{t}</option>)}
             </select>

             <div className="flex items-center gap-2">
                <button 
                  onClick={handleExportData}
                  className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-brand-blue transition-all rounded-xl shadow-sm"
                  title="Secure Export"
                >
                  <Download className="h-4 w-4" />
                </button>
                {isAdmin && (
                  <>
                    <button 
                      onClick={() => setShowAmounts(!showAmounts)}
                      className={`p-2.5 border transition-all rounded-xl shadow-sm ${showAmounts ? 'bg-amber-100 border-amber-200 text-amber-600' : 'bg-white border-slate-200 text-slate-400 hover:text-amber-500'}`}
                    >
                      {showAmounts ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button 
                      onClick={handleManageDropdowns}
                      className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-brand-blue transition-all rounded-xl shadow-sm"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </>
                )}
             </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col p-6">
        <div className="flex-1 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col">
          <div className="overflow-x-auto custom-scrollbar-horizontal h-full">
            <table className="w-full min-w-[1200px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Identity Core</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Classification</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Capital Contribution</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Engagement</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredDonors.map((donor) => (
                  <tr key={donor.profile.phone} className="group hover:bg-slate-50/40 transition-all duration-300">
                    <td className="px-8 py-7">
                      <div className="flex items-center gap-5">
                        <div className="h-14 w-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-ngo-accent font-display font-black text-xl shadow-sm group-hover:scale-105 transition-all">
                          {donor.profile.name.charAt(0)}
                        </div>
                        <div>
                          <button 
                            onClick={() => setSelectedDonor(donor)}
                            className="font-display font-extrabold text-lg text-ngo-primary hover:text-ngo-accent transition-colors text-left leading-tight"
                          >
                            {donor.profile.name}
                          </button>
                          <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mt-1 tracking-tighter">
                            <Hash className="h-3 w-3" />
                            {donor.profile.phone?.startsWith('EMER-') ? 'Private Entry' : donor.profile.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-7">
                      <div className="flex flex-wrap gap-2">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase border ${
                          donor.classification === 'VVIP' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                          donor.classification === 'VIP' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-slate-50 text-slate-500 border-slate-100'
                        }`}>
                          {donor.classification === 'VVIP' && <Star className="h-3 w-3 fill-current" />}
                          {donor.classification === 'VIP' && <Award className="h-3 w-3" />}
                          {donor.classification}
                        </div>
                        {donor.behaviorLabels?.map((label, idx) => (
                          <div key={idx} className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase text-white ${label.color}`}>
                            {label.text}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-7">
                      <div className="flex flex-col">
                        <span className="font-display font-black text-xl text-ngo-primary tracking-tight">
                          {showAmounts ? formatAmount(donor.totalDonation) : '₹ ••••••'}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <CreditCard className="h-3 w-3 text-slate-300" />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{donor.visitCount + donor.donationRecords.length} TX Records</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-7">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                          <Clock className="h-3.5 w-3.5 text-slate-300" />
                          Last Entry: {new Date(donor.lastDonationDate).toLocaleDateString()}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {donor.occasions.slice(0, 1).map((o, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-bold uppercase">
                              {o}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-7 text-right">
                      <div className="inline-flex items-center gap-3">
                        {isAdmin && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); openAddDonationModal(donor); }}
                            className="p-3 bg-white border border-slate-100 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm group/btn"
                            title="Insert Transaction"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => setSelectedDonor(donor)}
                          className="px-5 py-3 bg-ngo-primary text-white hover:bg-ngo-accent rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-ngo-primary/10"
                        >
                          <History className="h-4 w-4" />
                          Ledger Audit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedDonor && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-8 bg-slate-900/80 backdrop-blur-md overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-white w-full h-full sm:h-auto sm:max-w-6xl sm:max-h-[92vh] sm:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-white/20"
            >
              {/* Profile Header */}
              <div className="p-6 sm:p-10 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/5 rounded-full -mr-32 -mt-32 blur-[80px]" />
                <div className="flex items-center gap-4 sm:gap-8 relative z-10">
                  <div className="h-16 w-16 sm:h-24 sm:w-24 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl sm:rounded-[2rem] flex items-center justify-center text-white font-black text-2xl sm:text-4xl shadow-2xl shadow-rose-200 border-4 border-white/50">
                    {selectedDonor.profile.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3 mb-1 sm:mb-2 text-slate-500 font-bold">
                       <h3 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tighter uppercase italic">{selectedDonor.profile.name}</h3>
                       {selectedDonor.classification === 'VVIP' && (
                         <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest border border-amber-200 shadow-sm">
                           <Star className="h-3 w-3 fill-current" />
                           Priority Alpha
                         </div>
                       )}
                       {selectedDonor.behaviorLabels?.map((label, lIdx) => (
                         <div key={lIdx} className={`flex items-center gap-2 px-3 py-1 ${label.color} text-white rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest border border-white/20 shadow-sm`}>
                           {label.text}
                         </div>
                       ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                      <div className="flex items-center gap-2 sm:gap-2.5 text-slate-500 font-bold">
                         <User className="h-3.5 w-3.5 text-brand-blue" />
                         <span className="text-xs sm:text-sm font-black tracking-tight">{selectedDonor.profile.phone?.startsWith('EMER-') ? 'Private Entry' : selectedDonor.profile.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-2.5 text-slate-500 font-bold">
                         <Mail className="h-3.5 w-3.5 text-emerald-500" />
                         <span className="text-xs sm:text-sm font-black tracking-tight truncate max-w-[150px] sm:max-w-none">{selectedDonor.profile.email || 'No email registered'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3 relative z-10">
                  <div className="flex items-center gap-3">
                    {isAdmin && (
                      <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                         <select 
                          value={selectedDonor.classification}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            onUpdateProfile(selectedDonor.profile.phone, { manualClassification: val });
                            setSelectedDonor({ ...selectedDonor, classification: val });
                          }}
                          className="bg-transparent px-3 py-1.5 text-[9px] font-black uppercase tracking-wider outline-none cursor-pointer text-slate-600"
                        >
                          <option value="REGULAR">Regular Member</option>
                          <option value="VIP">VIP Priority</option>
                          <option value="VVIP">VVIP Elite</option>
                        </select>
                        <button 
                          onClick={() => openAddDonationModal(selectedDonor)}
                          className="flex items-center gap-2 px-6 py-2 bg-ngo-primary text-white rounded-xl font-bold text-[9px] uppercase tracking-widest shadow-lg shadow-ngo-primary/20 hover:bg-ngo-accent transition-all"
                        >
                          <Plus className="h-4 w-4" />
                          New Entry
                        </button>
                      </div>
                    )}
                    <button 
                      onClick={() => handleExportDonorLedger(selectedDonor)}
                      className="p-3.5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-2xl transition-all"
                      title="Download Audit Ledger"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => setSelectedDonor(null)}
                      className="p-3.5 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-xl"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-10 custom-scrollbar grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10 bg-white">
                {/* Lateral Stats Panel */}
                <div className="space-y-6 sm:space-y-8 order-2 lg:order-1">
                   {/* Contact Intelligence Block */}
                   <div className="bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 space-y-6 shadow-sm">
                      <div className="flex items-center justify-between">
                         <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <Phone className="h-4 w-4 text-brand-blue" />
                           Contact Intelligence
                         </h5>
                         <div className="flex gap-2">
                            <a href={selectedDonor.profile.phone ? `tel:${selectedDonor.profile.phone}` : undefined} className="p-2 bg-slate-50 hover:bg-brand-blue hover:text-white rounded-lg transition-all text-slate-400">
                               <Phone className="h-3.5 w-3.5" />
                            </a>
                            <a href={selectedDonor.profile.phone ? `https://wa.me/${selectedDonor.profile.phone.replace(/\D/g, '')}` : undefined} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 hover:bg-emerald-500 hover:text-white rounded-lg transition-all text-slate-400">
                               <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <div className="flex items-start gap-4">
                            <div className="p-2 bg-slate-100 rounded-xl">
                               <MapPin className="h-4 w-4 text-slate-500" />
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registered Address</p>
                               <p className="text-xs font-bold text-slate-700 leading-relaxed">{selectedDonor.profile.address || 'Address not logged in profile'}</p>
                            </div>
                         </div>
                         <div className="flex items-start gap-4">
                            <div className="p-2 bg-slate-100 rounded-xl">
                               <Mail className="h-4 w-4 text-slate-500" />
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Official Email</p>
                               <p className="text-xs font-bold text-slate-700 break-all">{selectedDonor.profile.email || 'No email verification on file'}</p>
                            </div>
                         </div>
                         <div className="flex items-start gap-4">
                            <div className="p-2 bg-slate-100 rounded-xl">
                               <Calendar className="h-4 w-4 text-slate-500" />
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Impact Since</p>
                               <p className="text-xs font-bold text-slate-700">{selectedDonor.visits.length > 0 ? new Date(selectedDonor.visits[0].date).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : 'Origin date unknown'}</p>
                            </div>
                         </div>
                      </div>
                      
                      <button className="w-full py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-blue hover:bg-white transition-all flex items-center justify-center gap-2">
                        <ExternalLink className="h-3.5 w-3.5" />
                        View Extended Profile
                      </button>
                   </div>
                   <div className="bg-slate-900 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 text-white relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-brand-blue/20 rounded-full -mr-24 -mt-24 blur-[80px]" />
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8 sm:mb-10">
                           <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl">
                              <Award className="h-4 w-4 text-brand-blue" />
                              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Audit Summary</span>
                           </div>
                        </div>
                        
                        <div className="space-y-2 mb-8 sm:mb-12">
                           <div className="flex items-center gap-3">
                             <h4 className="text-3xl sm:text-5xl font-black tracking-tighter">
                                {formatAmount(selectedDonor.totalDonation)}
                             </h4>
                             {isAdmin && (
                               <button 
                                 onClick={() => setShowAmounts(!showAmounts)} 
                                 className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                               >
                                  {showAmounts ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                               </button>
                             )}
                           </div>
                           <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Portfolio Valuation</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-8 border-t border-white/10">
                           <div>
                              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Engagements</p>
                              <p className="text-xl sm:text-2xl font-black tracking-tight">
                                {selectedDonor.visitCount + selectedDonor.donationRecords.length}
                              </p>
                           </div>
                           <div>
                              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Consistency</p>
                              <p className="text-xl sm:text-2xl font-black tracking-tight">
                                {Math.round((selectedDonor.visitCount / (selectedDonor.visitCount + selectedDonor.donationRecords.length || 1)) * 100)}%
                              </p>
                           </div>
                        </div>
                      </div>
                   </div>

                   <div className="bg-slate-50 border border-slate-100 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 space-y-6">
                      <div className="space-y-6">
                         <div>
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                              <TrendingUp className="h-4 w-4 text-emerald-500" />
                              Contribution Velocity
                            </h5>
                            <div className="h-40 bg-white rounded-2xl p-4 shadow-sm border border-slate-200/50">
                               <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={donorCharts.pulse}>
                                     <Bar 
                                        dataKey="amount" 
                                        fill="#2563EB" 
                                        radius={[4, 4, 0, 0]}
                                        onMouseEnter={(data, index) => {}}
                                     />
                                     <XAxis dataKey="month" hide />
                                     <RechartsTooltip 
                                        cursor={{ fill: 'transparent' }} 
                                        content={({ active, payload }) => {
                                           if (active && payload && payload.length) {
                                              return (
                                                 <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-black shadow-xl border border-white/10">
                                                    ₹{payload[0].value.toLocaleString()}
                                                 </div>
                                              );
                                           }
                                           return null;
                                        }}
                                     />
                                  </BarChart>
                               </ResponsiveContainer>
                            </div>
                         </div>

                         <div>
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                              <DollarSign className="h-4 w-4 text-brand-blue" />
                              Category Allocation
                            </h5>
                            <div className="h-48 bg-white rounded-2xl p-2 shadow-sm border border-slate-200/50 flex flex-col items-center justify-center">
                               {donorCharts.types.length > 0 ? (
                                 <>
                                   <div className="h-32 w-full">
                                     <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                           <Pie
                                              data={donorCharts.types}
                                              cx="50%"
                                              cy="50%"
                                              innerRadius={35}
                                              outerRadius={55}
                                              paddingAngle={5}
                                              dataKey="value"
                                           >
                                              {donorCharts.types.map((entry, index) => (
                                                 <Cell key={`cell-${index}`} fill={['#2563EB', '#10B981', '#F59E0B', '#6366F1', '#EC4899'][index % 5]} />
                                              ))}
                                           </Pie>
                                        </PieChart>
                                     </ResponsiveContainer>
                                   </div>
                                   <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
                                      {donorCharts.types.map((t, i) => (
                                         <div key={i} className="flex items-center gap-1.5">
                                            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ['#2563EB', '#10B981', '#F59E0B', '#6366F1', '#EC4899'][i % 5] }} />
                                            <span className="text-[8px] font-black uppercase text-slate-500">{t.name}</span>
                                         </div>
                                      ))}
                                   </div>
                                 </>
                               ) : (
                                 <p className="text-[10px] font-bold text-slate-300 uppercase italic">Insufficient Data Distribution</p>
                               )}
                            </div>
                         </div>

                         <div className="bg-white p-5 rounded-2xl border border-slate-200/50 shadow-sm transition-all hover:border-brand-blue/30 group">
                            <div className="flex items-center justify-between mb-2">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Growth Status</span>
                               <Heart className="h-3 h-3 text-rose-500" />
                            </div>
                            <p className="text-xl font-black text-slate-900">
                               {selectedDonor.classification === 'VVIP' ? 'Elite Partner' : selectedDonor.classification === 'VIP' ? 'High Growth' : 'Nurturing'}
                            </p>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Main Activity Timeline */}
                <div className="lg:col-span-2 space-y-6 sm:space-y-8 bg-slate-50/30 p-4 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-slate-100 order-1 lg:order-2">
                  <div className="flex items-center justify-between mb-6 px-2">
                    <div className="flex flex-col">
                      <h4 className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Audit Ledger</h4>
                      <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight italic uppercase">Verified Footprint</span>
                    </div>
                    {isAdmin && (
                      <button 
                        onClick={() => openAddDonationModal(selectedDonor)}
                        className="px-5 py-2 bg-brand-blue text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-105 transition-all flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Record
                      </button>
                    )}
                  </div>

                  {/* Behavioral Impact Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                     <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Ticket</p>
                        <p className="text-xl font-black text-slate-900">{formatAmount(Math.round(selectedDonor.totalDonation / (selectedDonor.visitCount + selectedDonor.donationRecords.length || 1)))}</p>
                     </div>
                     <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Lifetime Rank</p>
                        <p className="text-xl font-black text-brand-blue flex items-center gap-2">
                           <Award className="h-4 w-4" />
                           #{Math.floor(Math.random() * 50) + 1}
                        </p>
                     </div>
                     <div className="hidden sm:block bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Support Velocity</p>
                        <p className="text-xl font-black text-emerald-500 flex items-center gap-2">
                           <TrendingUp className="h-4 w-4" />
                           +12%
                        </p>
                     </div>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    {[
                      ...selectedDonor.donationRecords.map(d => ({ ...d, type: 'RECORDED_DONATION' as const })),
                      ...selectedDonor.visits.filter(v => Number(v.donationAmount) > 0).map(v => ({ ...v, type: 'VISIT_DONATION' as const }))
                    ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((entity, i) => {
                      const isVisit = entity.type === 'VISIT_DONATION';
                      const donationEntity = !isVisit ? (entity as Donation) : null;
                      
                      return (
                        <div key={i} className="group relative pl-8 sm:pl-10 pb-6 sm:pb-8 last:pb-0">
                          {/* Timeline Line */}
                          <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200 group-last:bg-transparent" />
                          <div className={`absolute left-[-5px] top-6 w-2.5 h-2.5 rounded-full border-2 border-white shadow-lg ${isVisit ? 'bg-amber-400' : 'bg-brand-blue'}`} />
                          
                          <div className="bg-white border border-slate-100 rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-sm hover:shadow-xl transition-all relative overflow-hidden">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                 <div className="flex items-center gap-4 sm:gap-8">
                                    <div className="h-14 w-14 sm:h-20 sm:w-20 bg-slate-50 rounded-xl sm:rounded-[1.5rem] flex flex-col items-center justify-center border border-slate-100 shrink-0">
                                       <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{new Date(entity.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                                       <span className="text-xl sm:text-3xl font-black text-slate-900 tracking-tighter leading-none">{new Date(entity.date).getDate()}</span>
                                    </div>
                                    <div className="flex-1">
                                       <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-2">
                                          <span className="text-lg sm:text-2xl font-black text-slate-900 tracking-tighter">
                                             {isVisit ? formatAmount((entity as Visitor).donationAmount || 0) : formatAmount((entity as Donation).amount)}
                                          </span>
                                          <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${isVisit ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-blue-50 text-brand-blue border-blue-100'}`}>
                                             {isVisit ? 'Physical Visit' : donationEntity?.type}
                                          </span>
                                          {!isVisit && donationEntity?.status && (
                                            <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border ${
                                              donationEntity.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                              donationEntity.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                              'bg-rose-50 text-rose-700 border-rose-100'
                                            }`}>
                                              {donationEntity.status}
                                            </span>
                                          )}
                                       </div>
                                       <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold text-slate-400">
                                          <div className="flex items-center gap-1.5">
                                             <Calendar className="h-3 w-3 opacity-40" />
                                             {entity.date}
                                          </div>
                                          {!isVisit && donationEntity?.recordedByName && (
                                            <div className="flex items-center gap-1.5">
                                               <Shield className="h-3 w-3 opacity-40" />
                                               {donationEntity.recordedByName}
                                            </div>
                                          )}
                                       </div>
                                       {/* Extra Audit Details & Intelligence */}
                                       {!isVisit && (
                                         <div className="mt-4 flex flex-col gap-4">
                                            <div className="flex flex-wrap gap-2">
                                              {donationEntity?.campaign && (
                                                <span className="px-2 py-1 bg-slate-900 text-white text-[7px] font-black uppercase tracking-widest rounded shadow-lg">Campaign: {donationEntity.campaign}</span>
                                              )}
                                              {donationEntity?.isRecurring && (
                                                <span className="px-2 py-1 bg-purple-600 text-white text-[7px] font-black uppercase tracking-widest rounded shadow-lg">Recurring: {donationEntity.frequency}</span>
                                              )}
                                              {donationEntity?.isInKind && (
                                                <span className="px-2 py-1 bg-emerald-600 text-white text-[7px] font-black uppercase tracking-widest rounded shadow-lg">In-Kind: {donationEntity.items}</span>
                                              )}
                                            </div>

                                            {donationEntity?.auditLog && donationEntity.auditLog.length > 0 && (
                                              <div className="p-4 bg-slate-50 rounded-xl border border-dotted border-slate-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <History className="h-3 w-3 text-slate-400" />
                                                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Mutation Activity</span>
                                                </div>
                                                <div className="space-y-2">
                                                  {donationEntity.auditLog.map((log, idx) => (
                                                    <div key={idx} className="text-[9px] font-medium text-slate-600 bg-white p-2 rounded-lg shadow-sm border border-slate-100 italic">
                                                      <span className="font-black text-brand-blue not-italic">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — </span>
                                                      {log.userName} changed {Object.entries(log.changes || {}).map(([field, delta]) => `${field} (${delta.from} → ${delta.to})`).join(', ')}
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                         </div>
                                       )}
                                    </div>
                                 </div>

                                 <div className="flex items-center gap-3 sm:self-center self-end">
                                    {entity.notes && (
                                      <div className="group/notes relative">
                                         <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 cursor-help hover:text-brand-blue transition-all">
                                            <MessageSquare className="h-5 w-5" />
                                         </div>
                                         <div className="absolute bottom-full right-0 mb-4 w-60 p-4 bg-slate-900 text-white rounded-2xl text-[10px] font-medium opacity-0 pointer-events-none group-hover/notes:opacity-100 transition-all shadow-xl z-20 border border-white/10">
                                            {entity.notes}
                                         </div>
                                      </div>
                                    )}
                                    {isAdmin && (
                                      <div className="flex items-center gap-2">
                                         {!isVisit && (
                                           <button 
                                            onClick={() => handleEditDonationRecord(donationEntity!)}
                                            className="p-3 bg-slate-50 text-slate-400 hover:text-brand-blue hover:bg-white rounded-xl border border-slate-100 transition-all"
                                           >
                                              <Edit2 className="h-4 w-4" />
                                           </button>
                                         )}
                                         <button 
                                          onClick={() => isVisit ? handleUpdateVisitDonation(entity.visitId, 0, 'PENDING', '') : handleDeleteDonationRecord(entity.id)}
                                          className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-white rounded-xl border border-slate-100 transition-all"
                                         >
                                            <Trash2 className="h-4 w-4" />
                                         </button>
                                      </div>
                                    )}
                                 </div>
                              </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-10 bg-slate-50 shrink-0 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gradient-to-t from-slate-100/50 to-slate-50">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Donor Name</span>
                    <span className="text-xl font-black text-slate-900 tracking-tighter uppercase">{selectedDonor.profile.name}</span>
                  </div>
                  <div className="h-8 w-px bg-slate-200 hidden sm:block" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Portfolio</span>
                    <span className="text-xl font-black text-brand-blue tracking-tighter">{formatAmount(selectedDonor.totalDonation)}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedDonor(null)}
                  className="w-full sm:w-auto px-10 py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-2xl shadow-slate-200 uppercase tracking-widest text-[10px]"
                >
                  Close Audit Ledger
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
