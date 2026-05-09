import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  ChevronUp, 
  ChevronDown, 
  Globe, 
  ExternalLink, 
  RefreshCw, 
  Activity, 
  LucideClock, 
  CheckCircle2, 
  Shield, 
  Copy, 
  Zap, 
  Plus, 
  Calendar,
  Clock,
  Trash2
} from 'lucide-react';

interface GoogleIntegrationProps {
  userEmail?: string | null;
  googleStatus: { 
    connected: boolean; 
    spreadsheetId?: string | null; 
    calendarId?: string | null; 
    birthdayCalendarId?: string | null;
    lastSyncTime?: string | null;
    totalRecordsSynced?: number | null;
    totalEventsSynced?: number | null;
    loading?: boolean 
  };
  availableSheets: { id: string; name: string }[];
  availableCalendars: { id: string; summary: string }[];
  isFetchingSheets: boolean;
  isFetchingCalendars: boolean;
  isSyncingGoogle: boolean;
  onConnectGoogle: () => void;
  onDisconnectGoogle: () => void;
  onSelectSheet: (id: string) => void;
  onCreateSheet: () => void;
  onSelectCalendar: (id: string, type?: 'primary' | 'birthday') => void;
  onCreateCalendar: (type?: 'primary' | 'birthday') => void;
  onSyncNow: () => void;
  onRefreshLists: () => void;
  autoSyncEnabled?: boolean;
}

export default function GoogleIntegration({
  userEmail,
  googleStatus,
  availableSheets,
  availableCalendars,
  isFetchingSheets,
  isFetchingCalendars,
  isSyncingGoogle,
  onConnectGoogle,
  onDisconnectGoogle,
  onSelectSheet,
  onCreateSheet,
  onSelectCalendar,
  onCreateCalendar,
  onSyncNow,
  onRefreshLists,
  autoSyncEnabled = true
}: GoogleIntegrationProps) {
  const [spreadsheetExpanded, setSpreadsheetExpanded] = useState(true);
  const [calendarExpanded, setCalendarExpanded] = useState(true);

  if (googleStatus.loading && !googleStatus.connected) {
    return (
      <div className="bg-white rounded-[2rem] border border-slate-100 p-8 space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-slate-100 rounded-xl" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-slate-100 rounded w-1/4" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
          </div>
        </div>
        <div className="h-40 bg-slate-50 rounded-2xl" />
      </div>
    );
  }

  const activeSheet = availableSheets.find(s => s.id === googleStatus.spreadsheetId);
  const activeSheetName = activeSheet?.name || 'VMS Visitor Logs';
  
  const activeCalendar = availableCalendars.find(c => c.id === googleStatus.calendarId) || 
                       availableCalendars.find(c => c.id === googleStatus.birthdayCalendarId);
  const activeCalendarName = activeCalendar?.summary || 'Visitor Birthdays';

  return (
    <div className="space-y-6 font-sans">
      {/* Header with Title and User Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
              <img 
                src="https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png" 
                alt="Google" 
                className="w-6 h-6"
                referrerPolicy="no-referrer"
              />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Google Integration</h2>
          </div>
          <p className="text-slate-500 text-sm">Manage your Google services integration and sync settings</p>
        </div>

        {googleStatus.connected ? (
          <div className="bg-[#E6F4EA] border border-[#CEEAD6] rounded-2xl px-6 py-3 flex items-center justify-between min-w-[320px]">
            <div className="flex items-center gap-3">
              <div className="bg-[#0F9D58] h-5 w-5 rounded-full flex items-center justify-center">
                <CheckCircle2 size={12} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#188038]">Google Account Connected</span>
                <span className="text-[11px] text-[#188038]/80">{userEmail || 'nimbalkar.srujan@gmail.com'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={onRefreshLists}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                title="Refresh Assets"
              >
                <RefreshCw size={14} className={isFetchingSheets || isFetchingCalendars ? 'animate-spin' : ''} />
              </button>
              <div className="w-[1px] h-4 bg-slate-200 mx-2" />
              <button 
                onClick={onDisconnectGoogle}
                className="text-slate-400 hover:text-rose-500 transition-colors"
                title="Disconnect Google Account"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={onConnectGoogle}
            className="px-8 py-3 bg-[#051739] text-white rounded-2xl font-bold text-sm hover:bg-black transition-all flex items-center gap-3 active:scale-95 shadow-lg shadow-slate-200"
          >
            <ExternalLink size={18} />
            Connect Google Account
          </button>
        )}
      </div>

      {!googleStatus.connected ? (
        <div className="py-20 bg-white rounded-[2rem] border border-dashed border-slate-200 text-center space-y-6">
          <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Globe size={40} className="text-slate-300" />
          </div>
          <div className="space-y-2">
            <h4 className="text-2xl font-bold text-slate-900">Google Account Not Linked</h4>
            <p className="text-sm text-slate-400 max-w-[400px] mx-auto">Authorize VMS Global to interact with your Google Workspace to enable automated spreadsheet and calendar synchronization.</p>
          </div>
          <button 
            onClick={onConnectGoogle}
            className="px-12 py-5 bg-[#051739] text-white rounded-[2rem] font-bold text-sm hover:bg-black transition-all flex items-center gap-3 mx-auto active:scale-95 shadow-2xl shadow-slate-200"
          >
            <ExternalLink size={20} />
            Establish Google Connection
          </button>
        </div>
      ) : (
        <>
          {/* Google Sheets Integration Card */}
      <div className="bg-white rounded-[2rem] border border-slate-200 outline-none overflow-hidden transition-all duration-300">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <div className="h-12 w-12 flex items-center justify-center">
                 <img 
                  src="https://www.gstatic.com/images/branding/product/2x/sheets_48dp.png" 
                  alt="Sheets" 
                  className="w-10 h-10"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Google Sheets Integration</h3>
                <p className="text-sm text-slate-500">Sync all visitor records to a Google Spreadsheet automatically.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`flex items-center gap-2 px-4 py-1.5 ${googleStatus.spreadsheetId ? 'bg-[#E6F4EA] text-[#188038] border-[#CEEAD6]' : 'bg-slate-100 text-slate-400 border-slate-200'} text-[11px] font-bold rounded-full border`}>
                <div className={`w-1.5 h-1.5 ${googleStatus.spreadsheetId ? 'bg-[#188038]' : 'bg-slate-300'} rounded-full`} />
                {googleStatus.spreadsheetId ? 'Connected' : 'Not Linked'}
              </span>
              <button 
                onClick={() => setSpreadsheetExpanded(!spreadsheetExpanded)}
                className="text-slate-400 p-2 hover:bg-slate-50 rounded-full transition-colors"
              >
                {spreadsheetExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
          </div>

          {spreadsheetExpanded && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-top-2 duration-500">
              {/* Left Settings */}
              <div className="lg:col-span-2 space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SELECT SPREADSHEET</label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <select 
                        value={googleStatus.spreadsheetId || ''}
                        onChange={(e) => onSelectSheet(e.target.value)}
                        className="w-full h-14 pl-12 pr-10 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 appearance-none focus:ring-2 focus:ring-[#0F9D58]/20 focus:border-[#0F9D58] outline-none transition-all disabled:opacity-50"
                        disabled={isFetchingSheets}
                      >
                        <option value="">{isFetchingSheets ? 'Loading Sheets...' : 'Select Spreadsheet'}</option>
                        {availableSheets.length > 0 ? (
                          availableSheets.map(sheet => (
                            <option key={sheet.id} value={sheet.id}>{sheet.name}</option>
                          ))
                        ) : !isFetchingSheets ? (
                          <option disabled className="text-slate-400">No spreadsheets found (try refreshing)</option>
                        ) : null}
                      </select>
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0F9D58]">
                        <img 
                          src="https://www.gstatic.com/images/branding/product/2x/sheets_48dp.png" 
                          alt="" 
                          className="w-5 h-5"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <ChevronDown size={18} />
                      </div>
                    </div>
                    <button 
                      onClick={onRefreshLists}
                      className="px-6 h-14 bg-slate-50 text-slate-600 font-bold text-sm rounded-2xl flex items-center gap-2 hover:bg-slate-100 border border-slate-200 transition-colors"
                    >
                      <RefreshCw size={18} className={isFetchingSheets ? 'animate-spin' : ''} />
                      Refresh List
                    </button>
                  </div>
                </div>

                <div className="bg-[#F8F9FA] border border-slate-200 rounded-2xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-[#E6F4EA] rounded-xl flex items-center justify-center text-[#188038]">
                      <FileSpreadsheet size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ACTIVE SPREADSHEET</p>
                      <p className="text-base font-bold text-slate-900 truncate">{activeSheetName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[11px] text-slate-500 font-medium truncate">Spreadsheet ID: {googleStatus.spreadsheetId || 'None connected'}</p>
                        {googleStatus.spreadsheetId && <Copy size={12} className="text-slate-400 cursor-pointer hover:text-slate-600" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Sync Status */}
              <div className="lg:col-span-1">
                <div className="h-full bg-[#F3FBF6] border border-[#CEEAD6] rounded-2xl p-8 flex flex-col justify-between">
                  <p className="text-[11px] font-bold text-[#188038] uppercase tracking-wider mb-6">SYNC STATUS</p>
                  
                  <div className="space-y-8">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-5 w-5 rounded-full bg-[#188038] flex items-center justify-center text-white">
                        <CheckCircle2 size={12} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-none mb-2">Last synced</p>
                        <p className="text-xs text-slate-400 font-medium">{googleStatus.lastSyncTime || 'Never synced'}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 mb-1 font-medium">Total records synced</p>
                      <p className="text-2xl font-bold text-slate-900">{googleStatus.totalRecordsSynced || '0'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Buttons */}
              <div className="lg:col-span-1 flex flex-col gap-3">
                <button 
                  onClick={onSyncNow}
                  disabled={isSyncingGoogle || !googleStatus.spreadsheetId}
                  className="w-full py-4 bg-[#0F9D58] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#0B8043] transition-all disabled:opacity-50 shadow-md shadow-[#0F9D58]/10"
                >
                  <RefreshCw size={18} className={isSyncingGoogle ? 'animate-spin' : ''} />
                  Sync Now
                </button>
                <button 
                  onClick={onCreateSheet}
                  className="w-full py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all border border-slate-200"
                >
                  <Plus size={18} className="text-[#0F9D58]" />
                  Create New Spreadsheet
                </button>
                <button 
                  onClick={onDisconnectGoogle}
                  className="w-full py-4 bg-white border border-[#FAD2CF] text-[#D93025] rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#FEF7F6] transition-all mt-auto"
                >
                  <Trash2 size={18} />
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Google Calendar Integration Card */}
      <div className="bg-white rounded-[2rem] border border-slate-200 outline-none overflow-hidden transition-all duration-300">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <div className="h-12 w-12 flex items-center justify-center">
                 <img 
                  src="https://www.gstatic.com/images/branding/product/2x/calendar_48dp.png" 
                  alt="Calendar" 
                  className="w-10 h-10"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Google Calendar Integration</h3>
                <p className="text-sm text-slate-500">Sync visitor birthdays and meetings to Google Calendar automatically.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`flex items-center gap-2 px-4 py-1.5 ${googleStatus.calendarId || googleStatus.birthdayCalendarId ? 'bg-[#E6F4EA] text-[#188038] border-[#CEEAD6]' : 'bg-slate-100 text-slate-400 border-slate-200'} text-[11px] font-bold rounded-full border`}>
                <div className={`w-1.5 h-1.5 ${googleStatus.calendarId || googleStatus.birthdayCalendarId ? 'bg-[#188038]' : 'bg-slate-300'} rounded-full`} />
                {googleStatus.calendarId || googleStatus.birthdayCalendarId ? 'Connected' : 'Not Linked'}
              </span>
              <button 
                onClick={() => setCalendarExpanded(!calendarExpanded)}
                className="text-slate-400 p-2 hover:bg-slate-50 rounded-full transition-colors"
              >
                {calendarExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
          </div>

          {calendarExpanded && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-top-2 duration-500">
              {/* Left Settings */}
              <div className="lg:col-span-2 space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SELECT CALENDAR</label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <select 
                        value={googleStatus.calendarId || googleStatus.birthdayCalendarId || ''}
                        onChange={(e) => onSelectCalendar(e.target.value, 'primary')}
                        className="w-full h-14 pl-12 pr-10 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 appearance-none focus:ring-2 focus:ring-[#1A73E8]/20 focus:border-[#1A73E8] outline-none transition-all disabled:opacity-50"
                        disabled={isFetchingCalendars}
                      >
                        <option value="">{isFetchingCalendars ? 'Loading Calendars...' : 'Default Calendar (primary)'}</option>
                        {availableCalendars.length > 0 ? (
                          availableCalendars.map(calendar => (
                            <option key={calendar.id} value={calendar.id}>{calendar.summary}</option>
                          ))
                        ) : !isFetchingCalendars ? (
                          <option disabled className="text-slate-400">No additional calendars found (try refreshing)</option>
                        ) : null}
                      </select>
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A73E8]">
                        <Calendar size={20} />
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <ChevronDown size={18} />
                      </div>
                    </div>
                    <button 
                      onClick={onRefreshLists}
                      className="px-6 h-14 bg-slate-50 text-slate-600 font-bold text-sm rounded-2xl flex items-center gap-2 hover:bg-slate-100 border border-slate-200 transition-colors"
                    >
                      <RefreshCw size={18} className={isFetchingCalendars ? 'animate-spin' : ''} />
                      Refresh List
                    </button>
                  </div>
                </div>

                <div className="bg-[#F8F9FA] border border-slate-200 rounded-2xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-[#E8F0FE] rounded-xl flex items-center justify-center text-[#1A73E8]">
                      <Calendar size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ACTIVE CALENDAR</p>
                      <p className="text-base font-bold text-slate-900 truncate">{activeCalendarName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[11px] text-slate-500 font-medium truncate">ID: {googleStatus.calendarId || googleStatus.birthdayCalendarId || 'primary'}</p>
                        <Copy size={12} className="text-slate-400 cursor-pointer hover:text-slate-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Sync Status */}
              <div className="lg:col-span-1">
                <div className="h-full bg-[#F3FBF6] border border-[#CEEAD6] rounded-2xl p-8 flex flex-col justify-between">
                  <p className="text-[11px] font-bold text-[#188038] uppercase tracking-wider mb-6">SYNC STATUS</p>
                  
                  <div className="space-y-8">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-5 w-5 rounded-full bg-[#188038] flex items-center justify-center text-white">
                        <CheckCircle2 size={12} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-none mb-2">Last synced</p>
                        <p className="text-xs text-slate-400 font-medium">{googleStatus.lastSyncTime || 'Never synced'}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 mb-1 font-medium">Total events synced</p>
                      <p className="text-2xl font-bold text-slate-900">{googleStatus.totalEventsSynced || '0'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Buttons */}
              <div className="lg:col-span-1 flex flex-col gap-3">
                <button 
                  onClick={onSyncNow}
                  disabled={isSyncingGoogle || (!googleStatus.calendarId && !googleStatus.birthdayCalendarId)}
                  className="w-full py-4 bg-[#0F9D58] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#0B8043] transition-all shadow-md shadow-[#0F9D58]/10"
                >
                  <RefreshCw size={18} className={isSyncingGoogle ? 'animate-spin' : ''} />
                  Sync Now
                </button>
                <button 
                  onClick={() => onCreateCalendar('primary')}
                  className="w-full py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all border border-slate-200 shadow-sm"
                >
                  <Calendar size={18} className="text-[#0F9D58]" />
                  Create New Calendar
                </button>
                <button 
                  onClick={onRefreshLists}
                  className="w-full py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all border border-slate-200 shadow-sm"
                >
                  <Calendar size={18} className="text-[#0F9D58]" />
                  Select Different Calendar
                </button>
                <button 
                  onClick={onDisconnectGoogle}
                  className="w-full py-4 bg-white border border-[#FAD2CF] text-[#D93025] rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#FEF7F6] transition-all mt-auto"
                >
                  <Trash2 size={18} />
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )}

  {/* How it works footer */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-8">
        <div className="flex gap-4 items-start">
          <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
             <div className="bg-blue-600 rounded-full h-5 w-5 flex items-center justify-center text-white text-[10px] font-bold">
               i
             </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-2">How it works</h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
              Once connected, visitor check-ins, pre-registrations, and birthdays will be synced automatically to your selected Google services. You can manually sync anytime using the "Sync Now" buttons.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
