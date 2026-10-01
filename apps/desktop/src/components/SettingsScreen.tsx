import { useState, useEffect } from 'react';
import { ConfirmModal } from './ConfirmModal';

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

export function SettingsScreen({ currentUser, onLogout }: { currentUser?: any, onLogout?: () => void }) {
  const [lisNetworkMode, setLisNetworkMode] = useState(false);
  const [licence, setLicence] = useState<any>(null);
  
  const [resetStage, setResetStage] = useState(0); 
  const [confirmText, setConfirmText] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [feedback, setFeedback] = useState<{type: 'error' | 'success', msg: string} | null>(null);

  
  const [qrCode, setQrCode] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpInput, setTotpInput] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [twoFaFeedback, setTwoFaFeedback] = useState<{type: 'error' | 'success', msg: string} | null>(null);

  const handleEnroll2FA = async () => {
    if (!window.electron) return;
    const res = await window.electron.ipcRenderer.invoke('auth:generate2FA');
    if (res.success) {
      setQrCode(res.qrCode);
      setTotpSecret(res.secret);
      setTwoFaFeedback(null);
    }
  };

  const handleVerify2FA = async () => {
    if (!window.electron) return;
    const res = await window.electron.ipcRenderer.invoke('auth:verify2FAEnrollment', { secret: totpSecret, token: totpInput });
    if (res.success) {
      setTwoFaFeedback({ type: 'success', msg: '2FA Enabled Successfully!' });
      setIs2FAEnabled(true);
      setQrCode('');
      setTotpSecret('');
    } else {
      setTwoFaFeedback({ type: 'error', msg: res.error });
    }
  };

  const [pwdData, setPwdData] = useState({ current: '', newPwd: '', confirm: '' });
  const [pwdFeedback, setPwdFeedback] = useState<{type: 'error' | 'success', msg: string} | null>(null);
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'system');
  const [isResetting, setIsResetting] = useState(false);
  const [confirmState, setConfirmState] = useState<any>({ isOpen: false, title: '', message: '', isDestructive: false, isAlert: false, isPrompt: false, promptValue: '', onPromptChange: () => {}, onConfirm: () => {}, onCancel: () => {} });

  const requestConfirm = (title: string, message: string, isDestructive = false): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true, title, message, isDestructive, isAlert: false, isPrompt: false, promptValue: '', onPromptChange: () => {},
        onConfirm: () => { setConfirmState((prev: any) => ({ ...prev, isOpen: false })); resolve(true); },
        onCancel: () => { setConfirmState((prev: any) => ({ ...prev, isOpen: false })); resolve(false); }
      });
    });
  };

  const requestAlert = (title: string, message: string): Promise<void> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true, title, message, isDestructive: false, isAlert: true, isPrompt: false, promptValue: '', onPromptChange: () => {},
        onConfirm: () => { setConfirmState((prev: any) => ({ ...prev, isOpen: false })); resolve(); },
        onCancel: () => { setConfirmState((prev: any) => ({ ...prev, isOpen: false })); resolve(); }
      });
    });
  };

  const requestPrompt = (title: string, message: string, defaultValue = ''): Promise<string | null> => {
    return new Promise((resolve) => {
      let currentVal = defaultValue;
      const handleChange = (val: string) => { currentVal = val; setConfirmState((prev: any) => ({ ...prev, promptValue: val })); };
      setConfirmState({
        isOpen: true, title, message, isDestructive: false, isAlert: false, isPrompt: true, promptValue: currentVal, onPromptChange: handleChange,
        onConfirm: () => { setConfirmState((prev: any) => ({ ...prev, isOpen: false })); resolve(currentVal); },
        onCancel: () => { setConfirmState((prev: any) => ({ ...prev, isOpen: false })); resolve(null); }
      });
    });
  };
  
  useEffect(() => {
    if (window.electron) {
      window.electron.ipcRenderer.invoke('system:getSettings').then(res => {
        if (res.success && res.data) {
          setLisNetworkMode(res.data.lisNetworkMode === true);
          setIs2FAEnabled(res.data.is2FAEnabled === true);
          setLicence(res.data.licence);
        }
      });
    }
  }, []);

  const toggleLis = async () => {
    const newValue = !lisNetworkMode;
    if (newValue) {
      const confirm = await requestConfirm("Enable LIS-Network Mode?", "WARNING: Enabling LIS-network mode exposes the local API beyond localhost to your hospital's LAN. Ensure you are on a trusted network.", true);
      if (!confirm) return;
    }
    
    setLisNetworkMode(newValue);
    if (window.electron) {
      await window.electron.ipcRenderer.invoke('system:updateSettings', { lisNetworkMode: newValue });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.electron) return;
    setPwdFeedback(null);
    
    if (pwdData.newPwd !== pwdData.confirm) {
      setPwdFeedback({ type: 'error', msg: "New passwords do not match." });
      return;
    }
    const STRONG_PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!STRONG_PWD_REGEX.test(pwdData.newPwd)) {
      setPwdFeedback({ type: 'error', msg: "Password must be at least 8 characters long and include an uppercase letter, a number, and a special character." });
      return;
    }

    setIsChangingPwd(true);
    try {
      const res = await window.electron.ipcRenderer.invoke('auth:changePassword', {
        currentPassword: pwdData.current,
        newPassword: pwdData.newPwd
      });
      
      if (res.success) {
        setPwdFeedback({ type: 'success', msg: "Password updated successfully! Logging you out..." });
        setPwdData({ current: '', newPwd: '', confirm: '' });
        setTimeout(() => {
          if (onLogout) onLogout();
        }, 1500);
      } else {
        setPwdFeedback({ type: 'error', msg: res.error });
      }
    } catch (err: any) {
      setPwdFeedback({ type: 'error', msg: "System error updating password." });
    } finally {
      setIsChangingPwd(false);
    }
  };

  const handleResetData = async () => {
    setFeedback(null);
    if (!adminPassword) {
      setFeedback({ type: 'error', msg: "Administrator password is required." });
      return;
    }

    if (!window.electron) return;
    setIsResetting(true);

    try {
      const res = await window.electron.ipcRenderer.invoke('system:factoryReset', {
        userId: currentUser?.id,
        password: adminPassword
      });
      
      if (res.success) {
        setFeedback({ type: 'success', msg: "Data wiped successfully. Logging out..." });
        setTimeout(() => onLogout && onLogout(), 1500); 
      } else {
        setFeedback({ type: 'error', msg: `Database Error: ${res.error}` });
        setResetStage(2); 
      }
    } catch (err: any) {
      setFeedback({ type: 'error', msg: `System Error: ${err.message}` });
      setResetStage(2);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="h-full flex flex-col font-sans relative pb-20">
      <div className="max-w-5xl mx-auto w-full">
        <div className="mb-10 animate-slide-up">
          <h1 className="text-3xl font-extrabold text-app-text tracking-tight">Settings</h1>
          <p className="text-base text-app-muted mt-1 font-medium">Manage local workstation settings.</p>
        </div>
        
        <div className="w-full max-w-4xl animate-slide-up bg-glass-panel backdrop-blur-3xl border border-glass-panelBorder rounded-[32px] shadow-[0_24px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden divide-y divide-slate-400/20">
          
          <section className="p-8 flex flex-col md:flex-row justify-between md:items-center gap-6 hover:bg-slate-900/5 transition-colors">
            <div>
              <h2 className="text-xl font-extrabold text-app-text">Appearance</h2>
              <p className="text-sm text-app-muted font-medium mt-1">Select your preferred user interface theme.</p>
            </div>
            <div className="flex bg-glass-input border border-glass-inputBorder rounded-2xl p-1 shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)]">
              {(['light', 'dark', 'system', 'amoled'] as const).map(t => (
                <button 
                  key={t}
                  onClick={() => { setTheme(t); localStorage.setItem('app-theme', t); document.documentElement.setAttribute('data-theme', t); }}
                  className={`py-2.5 px-5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${theme === t ? 'bg-emerald-600 text-white shadow-md' : 'text-app-text hover:bg-glass-panel'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>

          <section className="p-8 hover:bg-slate-900/5 transition-colors">
            <h2 className="text-xl font-extrabold text-app-text">Account Security</h2>
            <p className="text-sm text-app-muted font-medium mt-1 mb-6">Update your administrator password.</p>
            
            {pwdFeedback && (
              <div className={`mb-6 p-4 rounded-2xl font-bold border ${pwdFeedback.type === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                {pwdFeedback.msg}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-[11px] font-bold text-app-muted mb-2 uppercase tracking-widest">Current Password</label>
                <div className="relative">
                  <input 
                    type={showCurrent ? 'text' : 'password'}
                    required 
                    value={pwdData.current} 
                    onChange={e => setPwdData({...pwdData, current: e.target.value})}
                    className="w-full px-4 py-3 pr-11 bg-glass-input backdrop-blur-xl border border-glass-inputBorder rounded-2xl outline-none focus:bg-white/70 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400/50 transition-all font-bold text-app-text shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)]"
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-text transition-colors">
                    {showCurrent ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              <div className="flex-1 w-full">
                <label className="block text-[11px] font-bold text-app-muted mb-2 uppercase tracking-widest">New Password</label>
                <div className="relative">
                  <input 
                    type={showNew ? 'text' : 'password'}
                    required 
                    value={pwdData.newPwd} 
                    onChange={e => setPwdData({...pwdData, newPwd: e.target.value})}
                    className="w-full px-4 py-3 pr-11 bg-glass-input backdrop-blur-xl border border-glass-inputBorder rounded-2xl outline-none focus:bg-white/70 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400/50 transition-all font-bold text-app-text shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)]"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-text transition-colors">
                    {showNew ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              <div className="flex-1 w-full">
                <label className="block text-[11px] font-bold text-app-muted mb-2 uppercase tracking-widest">Confirm New</label>
                <input 
                  type="password"
                  required 
                  value={pwdData.confirm} 
                  onChange={e => setPwdData({...pwdData, confirm: e.target.value})}
                  className="w-full px-4 py-3 bg-glass-input backdrop-blur-xl border border-glass-inputBorder rounded-2xl outline-none focus:bg-white/70 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400/50 transition-all font-bold text-app-text shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)]"
                />
              </div>
              <button 
                type="submit" 
                disabled={isChangingPwd}
                className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-colors disabled:opacity-50 h-[46px] shadow-md"
              >
                {isChangingPwd ? '...' : 'Update'}
              </button>
            </form>

            <div className="mt-8 p-6 bg-slate-900/5 rounded-2xl">
              <h3 className="text-sm font-extrabold text-app-text mb-2">Two-Factor Authentication (2FA)</h3>
              <p className="text-xs text-app-muted font-medium mb-4">Enhance security by requiring a time-based code from any standard authenticator app (e.g., Google Authenticator, Authy).</p>
              
              {twoFaFeedback && (
                <div className={`mb-4 p-3 rounded-xl font-bold text-xs ${twoFaFeedback.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                  {twoFaFeedback.msg}
                </div>
              )}

              {!is2FAEnabled && !qrCode && (
                <button type="button" onClick={handleEnroll2FA} className="px-5 py-2.5 bg-slate-800 text-white font-bold rounded-xl text-sm shadow-sm hover:bg-slate-700 transition-colors">
                  Setup Authenticator App
                </button>
              )}

              {is2FAEnabled && (
                <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-emerald-700">Authenticator App Enabled</div>
                      <div className="text-xs font-medium text-emerald-600/80">Your account is protected.</div>
                    </div>
                  </div>
                  <button type="button" onClick={async () => {
                    const confirm = await requestConfirm("Disable 2FA?", "Are you sure you want to disable Two-Factor Authentication?", true);
                    if (!confirm || !window.electron) return;
                    const res = await window.electron.ipcRenderer.invoke('auth:disable2FA');
                    if (res.success) {
                      setIs2FAEnabled(false);
                      setTwoFaFeedback({ type: 'success', msg: '2FA has been disabled.' });
                    }
                  }} className="px-4 py-2 bg-white/50 hover:bg-white text-red-600 font-bold text-xs rounded-lg transition-colors border border-red-200/50 shadow-sm">
                    Disable 2FA
                  </button>
                </div>
              )}

              {qrCode && (
                <div className="flex flex-col gap-4 max-w-sm">
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 rounded-xl shadow-sm border border-slate-200/50" />
                  <div className="flex gap-2">
                    <input type="text" placeholder="6-digit code" value={totpInput} onChange={e => setTotpInput(e.target.value)} className="flex-1 px-4 py-2 bg-white/50 border border-slate-200/60 rounded-xl outline-none text-sm font-bold" />
                    <button type="button" onClick={handleVerify2FA} className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm shadow-sm hover:bg-emerald-500">Verify & Enable</button>
                  </div>
                </div>
              )}
            </div>

          </section>
          <section className="p-8 flex flex-col md:flex-row justify-between md:items-center gap-6 hover:bg-slate-900/5 transition-colors">
            <div>
              <h2 className="text-xl font-extrabold text-app-text">Licence Status</h2>
              <p className="text-sm text-app-muted font-medium mt-1">Manage your system subscription.</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="flex items-center justify-end gap-3 mb-1">
                  <span className={`text-lg font-black capitalize ${licence?.isActive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {licence ? `${licence.tier} Tier` : 'Unknown Tier'}
                  </span>
                  <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-md uppercase tracking-widest border ${
                    licence?.isActive 
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                      : 'bg-red-500/10 text-red-600 border-red-500/20'
                  }`}>
                    {licence?.isActive ? 'Active' : 'Expired'}
                  </span>
                </div>
                <p className="text-xs font-bold text-app-muted">
                  {licence?.expiresAt ? `Expires: ${new Date(licence.expiresAt).toLocaleDateString()}` : 'No expiry set'}
                </p>
              </div>
              <button 
                className="px-5 py-2.5 bg-glass-input backdrop-blur-sm border border-glass-inputBorder text-app-text font-bold rounded-xl hover:bg-glass-panel hover:shadow-sm transition-all duration-200"
                onClick={() => requestAlert('Licence Renewal', 'Please contact your distributor to renew your licence.')}
              >
                Renew
              </button>
            </div>
          </section>

          <section className="p-8 flex flex-col md:flex-row justify-between md:items-center gap-6 hover:bg-slate-900/5 transition-colors">
            <div>
              <h2 className="text-xl font-extrabold text-app-text">LIS Integration</h2>
              <p className="text-sm text-app-muted font-medium mt-1">Allow LIS connections from the hospital LAN (Default: Localhost only).</p>
            </div>
            <button onClick={toggleLis} className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors shadow-inner shrink-0 ${lisNetworkMode ? 'bg-emerald-500' : 'bg-slate-300/50'}`}>
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md ${lisNetworkMode ? 'translate-x-9' : 'translate-x-1'}`} />
            </button>
          </section>

          {currentUser?.role === 'admin' && (
            <section className="p-8 hover:bg-slate-900/5 transition-colors border-t border-slate-400/20">
              <h2 className="text-xl font-extrabold text-app-text">Disaster Recovery</h2>
              <p className="text-sm text-app-muted font-medium mt-1 mb-6">Create or restore encrypted off-site backups.</p>

              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full max-w-sm">
                  <label className="block text-[11px] font-bold text-app-muted mb-2 uppercase tracking-widest">Encryption Password</label>
                  <input 
                    type="password"
                    placeholder="Required for backup/restore"
                    value={pwdData.confirm} // Reusing pwdData.confirm state for convenience in UI, or could add dedicated state
                    onChange={e => setPwdData({...pwdData, confirm: e.target.value})}
                    className="w-full px-4 py-3 bg-glass-input backdrop-blur-xl border border-glass-inputBorder rounded-2xl outline-none focus:bg-white/70 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400/50 transition-all font-bold text-app-text shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)]"
                  />
                </div>
                <button 
                  onClick={async () => {
                    if (!pwdData.confirm) { setFeedback({ type: 'error', msg: 'Password required' }); return; }
                    try {
                      const res = await window.electron.ipcRenderer.invoke('system:backupDatabase', { password: pwdData.confirm });
                      if (res.success) {
                        setFeedback({ type: 'success', msg: `Backup saved securely. Timestamp: ${res.timestamp}` });
                        localStorage.setItem('iris_last_backup', res.timestamp);
                        setPwdData({ current: '', newPwd: '', confirm: '' });
                      } else if (!res.canceled) {
                        setFeedback({ type: 'error', msg: res.error || 'Backup failed' });
                      }
                    } catch (err: any) { setFeedback({ type: 'error', msg: err.message }); }
                  }}
                  className="px-6 py-3 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition-colors h-[46px] shadow-sm"
                >
                  Create Backup
                </button>
                <button 
                  onClick={async () => {
                    if (!pwdData.confirm) { setFeedback({ type: 'error', msg: 'Password required to decrypt' }); return; }
                    const proceed = await requestConfirm("Restore Database?", "Restoring will overwrite the current database and restart the application. Continue?", true);
                    if (!proceed) return;
                    try {
                      setFeedback({ type: 'success', msg: 'Restoring... Please wait.' });
                      const res = await window.electron.ipcRenderer.invoke('system:restoreDatabase', { password: pwdData.confirm });
                      if (!res.success && !res.canceled) setFeedback({ type: 'error', msg: res.error || 'Restore failed' });
                    } catch (err: any) { setFeedback({ type: 'error', msg: err.message }); }
                  }}
                  className="px-6 py-3 bg-amber-600 text-white font-bold rounded-2xl hover:bg-amber-700 transition-colors h-[46px] shadow-sm"
                >
                  Restore
                </button>
              </div>
            </section>
          )}

          </div>

          {currentUser?.role === 'admin' && (
            <div className="w-full max-w-4xl mt-6 animate-slide-up bg-red-500/5 backdrop-blur-3xl border border-red-500/20 rounded-[32px] shadow-[0_24px_60px_rgba(239,68,68,0.05)] overflow-hidden">
              <section className="p-8 relative overflow-hidden">
                
                {feedback && (
                  <div className={`mb-6 p-4 rounded-2xl font-bold border ${feedback.type === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                    {feedback.msg}
                  </div>
                )}

                <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-red-500">Clear Local Data</h2>
                    <p className="text-sm text-app-muted font-medium mt-1">Delete all patient records, captures, and AI results. <br/><span className="text-emerald-600/80">Audit logs, users, and licences are permanently preserved to comply with regulatory requirements.</span></p>
                  </div>
                  
                  {resetStage === 0 && (
                    <button onClick={() => setResetStage(1)} className="px-6 py-2.5 bg-red-500/10 backdrop-blur-sm border border-red-500/30 text-red-500 font-bold rounded-xl hover:bg-red-500/20 transition-all duration-200 shadow-sm whitespace-nowrap shrink-0">
                      Erase Data
                    </button>
                  )}

                  {resetStage === 1 && (
                    <div className="flex items-center gap-3">
                      <button onClick={() => setResetStage(0)} className="px-5 py-2.5 bg-glass-input border border-glass-inputBorder text-app-text font-bold rounded-xl hover:bg-glass-panel transition-all text-sm">Cancel</button>
                      <button onClick={() => setResetStage(2)} className="px-5 py-2.5 bg-red-500/20 border border-red-500/40 text-red-600 hover:bg-red-600 hover:text-white font-bold rounded-xl transition-all text-sm">Yes, I'm sure</button>
                    </div>
                  )}

                  {resetStage === 2 && (
                    <div className="flex flex-wrap items-center gap-3">
                      <input 
                        type="password" 
                        placeholder="Admin Password"
                        value={adminPassword}
                        onChange={e => setAdminPassword(e.target.value)}
                        className="px-4 py-2 bg-white/50 dark:bg-black/20 border border-red-500/20 rounded-xl outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 font-bold text-sm text-app-text"
                      />
                      <input 
                        type="text" 
                        placeholder="Type DELETE"
                        value={confirmText}
                        onChange={e => setConfirmText(e.target.value)}
                        className="px-4 py-2 w-32 bg-white/50 dark:bg-black/20 border border-red-500/20 rounded-xl outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 font-bold text-sm text-app-text uppercase"
                      />
                      <button 
                        onClick={handleResetData}
                        disabled={isResetting || confirmText !== 'DELETE' || !adminPassword}
                        className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        {isResetting ? '...' : 'Confirm'}
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {currentUser?.role === 'admin' && (
            <div className="w-full max-w-4xl mt-6 animate-slide-up bg-glass-panel backdrop-blur-3xl border border-glass-panelBorder rounded-[32px] overflow-hidden">
              <section className="p-8">
                <h2 className="text-xl font-extrabold text-app-text">NDPR Data Subject Requests</h2>
                <p className="text-sm text-app-muted font-medium mt-1 mb-6">Process patient rights to data access and erasure (NDPR §3.1).</p>
                <div className="flex gap-4">
                  <button onClick={async () => {
                    const id = await requestPrompt("Export Data", "Enter Patient Internal ID for NDPR Export:");
                    if (id && window.electron) {
                      const res = await window.electron.ipcRenderer.invoke('patients:exportData', id);
                      await requestAlert('Export Data', res.success ? 'Data exported.' : res.error);
                    }
                  }} className="px-5 py-2.5 bg-glass-input border border-glass-inputBorder text-app-text font-bold rounded-xl hover:bg-glass-panel transition-all">Export JSON/PDF</button>
                  <button onClick={async () => {
                    const id = await requestPrompt("Erase PII", "Enter Patient Internal ID for NDPR Erasure:");
                    if (!id || !window.electron) return;
                    const confirm = await requestConfirm("Erase PII?", "WARNING: Erasing PII is irreversible.", true);
                    if (confirm) {
                      const res = await window.electron.ipcRenderer.invoke('patients:eraseData', id);
                      await requestAlert('Erase PII', res.success ? 'PII Erased.' : res.error);
                    }
                  }} className="px-5 py-2.5 bg-red-500/10 border border-red-500/20 text-red-600 font-bold rounded-xl hover:bg-red-500/20 transition-all">Erase PII</button>
                </div>
              </section>
            </div>
          )}

          <div className="w-full max-w-4xl mt-6 animate-slide-up bg-glass-panel backdrop-blur-3xl border border-glass-panelBorder rounded-[32px] overflow-hidden">
            <section className="p-8">
              <h2 className="text-xl font-extrabold text-app-text">About & System Info</h2>
              <p className="text-sm text-app-muted font-medium mt-1 mb-4">Version strings for support.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-app-muted">App Version</div>
                  <div className="font-mono text-sm font-bold text-app-text mt-1">1.0.0-rc2</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-app-muted">DB Schema</div>
                  <div className="font-mono text-sm font-bold text-app-text mt-1">v3.4.1</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-app-muted">ML Model</div>
                  <div className="font-mono text-sm font-bold text-app-text mt-1">Hema_v2_QAT</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-app-muted">Framework</div>
                  <div className="font-mono text-sm font-bold text-app-text mt-1">Electron 31</div>
                </div>
              </div>
            </section>
          </div>

        </div>
      <ConfirmModal {...confirmState} />
    </div>
  );
}
