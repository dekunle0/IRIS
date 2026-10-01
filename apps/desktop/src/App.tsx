import '../../../packages/shared-ui/globals.css';
import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { PatientRegistration } from './components/PatientRegistration';
import { CaptureScreen } from './components/CaptureScreen';
import { WorklistScreen } from './components/WorklistScreen';
import { ResultReviewScreen } from './components/ResultReviewScreen';
import { QCDashboard } from './components/QCDashboard';
import { DevicesScreen } from './components/DevicesScreen';
import { UsersScreen } from './components/UsersScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { SyncStatusIndicator } from './components/SyncStatusIndicator';

type Route = 'worklist' | 'register' | 'capture' | 'qc' | 'devices' | 'users' | 'settings' | 'review' | 'history';

const TitleBar = () => (
  <div
    className="absolute top-0 left-0 w-full h-8 z-50 select-none"
    style={{ WebkitAppRegion: 'drag' } as any}
  />
);

interface NavItemProps {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

const NavItem = ({ label, active, onClick, icon }: NavItemProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm transition-all duration-200 ${
      active
        ? 'bg-emerald-500/15 shadow-sm text-app-text font-bold'
        : 'text-app-muted hover:text-app-text hover:bg-slate-900/5 font-medium'
    }`}
  >
    <span className={`w-4 h-4 shrink-0 ${active ? 'text-emerald-600' : 'text-slate-500'}`}>{icon}</span>
    <span>{label}</span>
  </button>
);

const formatRole = (role: string) => {
  if (!role) return '';
  if (role === 'admin') return 'Administrator';
  if (role === 'scientist_l1') return 'Scientist L1';
  if (role === 'scientist_l2') return 'Senior Scientist L2';
  return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

// Eye icon SVGs
const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export { EyeIcon, EyeOffIcon };

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentRoute, setCurrentRoute] = useState<Route>('worklist');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('iris_session_token');
    const savedUser = sessionStorage.getItem('iris_user');
    if (savedToken && savedUser && window.electron) {
      window.electron.setAuthToken(savedToken);
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  if (!currentUser) {
    return (
      <div className="relative min-h-screen">
        <TitleBar />
        <LoginScreen onLoginSuccess={user => { setCurrentUser(user); setCurrentRoute('worklist'); }} />
      </div>
    );
  }

  const handleLogout = async () => {
    if (window.electron) {
      await window.electron.ipcRenderer.invoke('auth:logout', { userId: currentUser.id, institutionId: currentUser.institutionId });
      window.electron.setAuthToken('');
    }
    sessionStorage.removeItem('iris_session_token');
    sessionStorage.removeItem('iris_user');
    setCurrentUser(null);
  };

  const canModify = currentUser.role !== 'viewer';
  const isAdmin = currentUser.role === 'admin';
  const worklistActive = currentRoute === 'worklist' || currentRoute === 'review';

  const worklist = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect width="8" height="4" x="8" y="2" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></svg>;
  const registerIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" /></svg>;
  const captureIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="m14 12 3 3 3-3" /><path d="M14 6h7a2 2 0 0 1 2 2v7" /><circle cx="8" cy="8" r="6" /><circle cx="8" cy="8" r="2" /><path d="M8 14v7" /><path d="M5 18h6" /></svg>;
  const qcIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>;
  const historyIcon = <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M12 8v4l3 3" /><path d="M3.05 11a9 9 0 1 0 .5-4.5" /><path d="M3 3v5h5" /></svg>;
  const devicesIcon = <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>;
  const usersIcon = <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
  const settingsIcon = <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;

  return (
    <div className="min-h-screen flex font-sans text-app-text antialiased selection:bg-emerald-500/20 relative overflow-hidden bg-gradient-to-br from-app-from via-app-via to-app-to">
      <TitleBar />

      {/* Ambient blobs */}
      <div className="fixed top-[-10%] left-[10%] w-[40%] h-[40%] bg-emerald-300/20 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[5%] w-[35%] h-[35%] bg-teal-200/20 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="w-64 my-4 ml-4 rounded-[32px] border border-slate-200/50 bg-glass-input backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col justify-between shrink-0 relative z-10 pt-4 pb-2 overflow-hidden">
          <div className="flex flex-col">
            <div className="px-6 pt-6 pb-5 border-b border-slate-200/40">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm border border-slate-800/50">
                  <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 1 9 9" /><circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-app-text tracking-tight">IRIS</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-900/10 text-app-muted border border-slate-300/60 uppercase">v1.1</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Offline</span>
                  </div>
                </div>
              </div>
            </div>

            <nav className="p-4 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 pt-3 pb-2">Workflow</p>

              <NavItem label="Worklist & Results" active={worklistActive} onClick={() => setCurrentRoute('worklist')} icon={worklist} />
              {canModify && (
                <>
                  <NavItem label="Register Patient" active={currentRoute === 'register'} onClick={() => setCurrentRoute('register')} icon={registerIcon} />
                  <NavItem label="Capture Feed" active={currentRoute === 'capture'} onClick={() => setCurrentRoute('capture')} icon={captureIcon} />
                </>
              )}

              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 pt-4 pb-2">Governance</p>

              <NavItem label="QC Dashboard" active={currentRoute === 'qc'} onClick={() => setCurrentRoute('qc')} icon={qcIcon} />
              <NavItem label="History & Audit" active={currentRoute === 'history'} onClick={() => setCurrentRoute('history')} icon={historyIcon} />
              <NavItem label="Hardware Devices" active={currentRoute === 'devices'} onClick={() => setCurrentRoute('devices')} icon={devicesIcon} />
              {isAdmin && (
                <NavItem label="Access Control" active={currentRoute === 'users'} onClick={() => setCurrentRoute('users')} icon={usersIcon} />
              )}
              <NavItem label="System Settings" active={currentRoute === 'settings'} onClick={() => setCurrentRoute('settings')} icon={settingsIcon} />
            </nav>
          </div>

          {/* Sync Status */}
          <div className="px-5 pb-2 flex justify-center">
            <SyncStatusIndicator />
          </div>

          {/* User card */}
          <div className="p-3 m-3 bg-white/50 backdrop-blur-md rounded-2xl border border-slate-200/60 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-8 w-8 rounded-xl bg-slate-900 flex items-center justify-center font-bold text-white shrink-0 text-xs shadow-sm">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-app-text truncate leading-tight">{currentUser.name}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight mt-0.5">{formatRole(currentUser.role)}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50/80 transition-colors shrink-0"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" />
              </svg>
            </button>
          </div>
        </aside>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        {/* Sidebar toggle button — always visible */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-4 left-4 z-40 p-2 bg-glass-panel backdrop-blur-md border border-slate-200/60 rounded-xl text-slate-500 hover:text-app-text hover:bg-white/90 shadow-sm transition-all"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="h-full p-6 pt-16 lg:p-10 lg:pt-16">
          {currentRoute === 'worklist' && (
            <WorklistScreen
              currentUser={currentUser}
              onRowClick={request => { setSelectedRequest(request); setCurrentRoute('review'); }}
            />
          )}
          {currentRoute === 'review' && selectedRequest && (
            <ResultReviewScreen
              requestId={selectedRequest.requestId}
              patientName={selectedRequest.patientName}
              testName={selectedRequest.testName}
              currentUser={currentUser}
              onBack={() => { setSelectedRequest(null); setCurrentRoute('worklist'); }}
            />
          )}
          {currentRoute === 'register' && <PatientRegistration currentUser={currentUser} />}
          {currentRoute === 'capture' && <CaptureScreen currentUser={currentUser} />}
          {currentRoute === 'qc' && <QCDashboard />}
          {currentRoute === 'history' && <HistoryScreen currentUser={currentUser} />}
          {currentRoute === 'devices' && <DevicesScreen currentUser={currentUser} />}
          {currentRoute === 'users' && <UsersScreen currentUser={currentUser} />}
          {currentRoute === 'settings' && <SettingsScreen currentUser={currentUser} onLogout={handleLogout} />}
        </div>
      </main>
    </div>
  );
}