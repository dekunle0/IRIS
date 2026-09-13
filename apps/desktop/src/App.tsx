import { useState } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { PatientRegistration } from './components/PatientRegistration';
import { CaptureScreen } from './components/CaptureScreen';
import { WorklistScreen } from './components/WorklistScreen';
import { ResultReviewScreen } from './components/ResultReviewScreen';
import { QCDashboard } from './components/QCDashboard';
import { DevicesScreen } from './components/DevicesScreen';
import { UsersScreen } from './components/UsersScreen';
import { SettingsScreen } from './components/SettingsScreen';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentRoute, setCurrentRoute] = useState<'worklist' | 'register' | 'capture' | 'qc' | 'review' | 'devices' | 'users' | 'settings'>('worklist');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  const handleLogout = async () => {
    if (window.electron) {
      await window.electron.ipcRenderer.invoke('auth:logout', { userId: currentUser.id, institutionId: currentUser.institutionId });
    }
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 antialiased selection:bg-emerald-500/20">
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-[1px_0_4px_rgba(0,0,0,0.02)]">
        
        <div className="flex flex-col">
          <div className="px-7 pt-7 pb-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-slate-900 flex items-center justify-center shadow-md border border-slate-800">
                <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 1 9 9" /><circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black tracking-tight text-slate-900">IRIS</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">v1.1</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-semibold text-slate-500">Offline Workstation</span>
                </div>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-1.5">
            <div className="px-3 pt-4 pb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Clinical Workflow</span>
            </div>

            <button 
              onClick={() => setCurrentRoute('worklist')}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-150 ${
                currentRoute === 'worklist' || currentRoute === 'review'
                  ? 'bg-emerald-500/10 text-emerald-900 font-bold border border-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <svg className={`w-5 h-5 shrink-0 ${currentRoute === 'worklist' || currentRoute === 'review' ? 'text-emerald-700' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></svg>
              <span>Worklist & Results</span>
            </button>

            <button 
              onClick={() => setCurrentRoute('register')}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-150 ${
                currentRoute === 'register'
                  ? 'bg-emerald-500/10 text-emerald-900 font-bold border border-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <svg className={`w-5 h-5 shrink-0 ${currentRoute === 'register' ? 'text-emerald-700' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" /></svg>
              <span>Register Patient</span>
            </button>

            <button 
              onClick={() => setCurrentRoute('capture')}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-150 ${
                currentRoute === 'capture'
                  ? 'bg-emerald-500/10 text-emerald-900 font-bold border border-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <svg className={`w-5 h-5 shrink-0 ${currentRoute === 'capture' ? 'text-emerald-700' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m14 12 3 3 3-3" /><path d="M14 6h7a2 2 0 0 1 2 2v7" /><circle cx="8" cy="8" r="6" /><circle cx="8" cy="8" r="2" /><path d="M8 14v7" /><path d="M5 18h6" /></svg>
              <span>Capture Slide</span>
            </button>

            <div className="px-3 pt-6 pb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Governance</span>
            </div>

            <button 
              onClick={() => setCurrentRoute('qc')}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-150 ${
                currentRoute === 'qc'
                  ? 'bg-emerald-500/10 text-emerald-900 font-bold border border-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <svg className={`w-5 h-5 shrink-0 ${currentRoute === 'qc' ? 'text-emerald-700' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
              <span>QC Dashboard</span>
            </button>

            <button 
              onClick={() => setCurrentRoute('devices')}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-150 ${
                currentRoute === 'devices'
                  ? 'bg-emerald-500/10 text-emerald-900 font-bold border border-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <svg className={`w-5 h-5 shrink-0 ${currentRoute === 'devices' ? 'text-emerald-700' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
              <span>Hardware Devices</span>
            </button>

            <button 
              onClick={() => setCurrentRoute('users')}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-150 ${
                currentRoute === 'users' ? 'bg-emerald-500/10 text-emerald-900 font-bold border border-emerald-500/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <svg className={`w-5 h-5 shrink-0 ${currentRoute === 'users' ? 'text-emerald-700' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              <span>Access Control</span>
            </button>

            <button 
              onClick={() => setCurrentRoute('settings')}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-150 ${
                currentRoute === 'settings' ? 'bg-emerald-500/10 text-emerald-900 font-bold border border-emerald-500/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <svg className={`w-5 h-5 shrink-0 ${currentRoute === 'settings' ? 'text-emerald-700' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              <span>System Settings</span>
            </button>
          </nav>
        </div>

        <div className="p-4 m-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-700 shrink-0 text-sm">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-extrabold text-slate-900 truncate leading-tight">{currentUser.name}</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide leading-tight mt-1">{currentUser.role?.replace('_', ' ') || 'Scientist'}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            title="Sign Out"
            className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors shrink-0"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="h-full p-10 lg:p-14">
          {currentRoute === 'worklist' && <WorklistScreen onRowClick={(request) => { setSelectedRequest(request); setCurrentRoute('review'); }} />}
          {currentRoute === 'review' && selectedRequest && <ResultReviewScreen requestId={selectedRequest.requestId} patientName={selectedRequest.patientName} testName={selectedRequest.testName} onBack={() => { setSelectedRequest(null); setCurrentRoute('worklist'); }} />}
          {currentRoute === 'register' && <div className="max-w-4xl mx-auto"><PatientRegistration /></div>}
          {currentRoute === 'capture' && <div className="max-w-6xl mx-auto"><CaptureScreen /></div>}
          {currentRoute === 'qc' && <QCDashboard />}
          {currentRoute === 'devices' && <DevicesScreen />}
          {currentRoute === 'users' && <UsersScreen />}
          {currentRoute === 'settings' && <SettingsScreen />}
        </div>
      </main>
    </div>
  );
}