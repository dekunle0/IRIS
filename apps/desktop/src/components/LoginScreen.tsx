import { useEffect, useState } from 'react';
import { ConfirmModal } from './ConfirmModal';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export function LoginScreen({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [requiresTotp, setRequiresTotp] = useState(false);
  const [totpToken, setTotpToken] = useState('');

  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', isDestructive: false, isAlert: false, onConfirm: () => {}, onCancel: () => {} });

  const requestAlert = (title: string, message: string): Promise<void> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true, title, message, isDestructive: false, isAlert: true,
        onConfirm: () => { setConfirmState(prev => ({ ...prev, isOpen: false })); resolve(); },
        onCancel: () => { setConfirmState(prev => ({ ...prev, isOpen: false })); resolve(); }
      });
    });
  };

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [initialCredentials, setInitialCredentials] = useState<{ username: string; password: string; recoveryCode?: string } | null>(null);
  const [copiedField, setCopiedField] = useState<'username' | 'password' | 'recoveryCode' | null>(null);
  const [showDismissConfirm, setShowDismissConfirm] = useState(false);

  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryData, setRecoveryData] = useState({ username: '', recoveryCode: '', newPassword: '' });

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRecovering(true);
    try {
      const res = await window.electron?.ipcRenderer.invoke('auth:recoverPassword', recoveryData);
      if (res?.success) {
        await requestAlert('Success', 'Password successfully reset. You may now log in.');
        setShowRecoveryModal(false);
        setRecoveryData({ username: '', recoveryCode: '', newPassword: '' });
      } else {
        await requestAlert('Recovery Failed', `Recovery failed: ${res?.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      await requestAlert('Error', err.message);
    } finally {
      setIsRecovering(false);
    }
  };

  useEffect(() => {
    const loadInitialCredentials = async () => {
      const response = await window.electron?.ipcRenderer.invoke('auth:getInitialCredentials');
      if (response?.success && response.data) setInitialCredentials(response.data);
    };
    loadInitialCredentials();
  }, []);

  const copyCredential = async (field: 'username' | 'password' | 'recoveryCode') => {
    if (!initialCredentials || !initialCredentials[field]) return;
    try {
      if (window.electron) {
        await window.electron.ipcRenderer.invoke('clipboard:write', initialCredentials[field]!);
      } else {
        await navigator.clipboard.writeText(initialCredentials[field]!);
      }
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1800);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const dismissInitialCredentials = () => setShowDismissConfirm(true);

  const confirmDismiss = async () => {
    await window.electron?.ipcRenderer.invoke('auth:clearInitialCredentials');
    setInitialCredentials(null);
    setShowDismissConfirm(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!window.electron) throw new Error("The desktop app is not available.");

      const response = await window.electron.ipcRenderer.invoke('auth:login', { username, password, totpToken });

      if (response.success) {
        if (window.electron.setAuthToken && response.token) {
          window.electron.setAuthToken(response.token);
          sessionStorage.setItem('iris_session_token', response.token);
          sessionStorage.setItem('iris_user', JSON.stringify(response.user));
        }
        onLoginSuccess(response.user);
      } else if (response.requiresTOTP) {
        setRequiresTotp(true);
        if (response.error) setError(response.error);
      } else {
        setError(response.error || 'Authentication failed');
      }
    } catch (err: any) {
      setError(err.message || 'Could not connect to the local database.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-app-from via-app-via to-app-to relative overflow-hidden font-sans">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-200/40 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-teal-100/40 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[440px] p-12 bg-glass-panel backdrop-blur-3xl rounded-[40px] shadow-[0_24px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] border border-glass-panelBorder z-10 relative">
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="h-16 w-16 bg-slate-900 rounded-[20px] flex items-center justify-center shadow-lg shadow-slate-900/10 mb-6">
            <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3a9 9 0 0 1 9 9" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-app-text tracking-tight">IRIS</h1>
          <p className="text-app-muted font-semibold mt-2">Lab Workstation</p>
        </div>

        {initialCredentials && (
          <div className="mb-7 p-6 bg-glass-input backdrop-blur-xl border border-glass-inputBorder shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] rounded-[24px] text-left">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-extrabold text-app-text">System Initialization</h2>
                <p className="text-[13px] font-medium text-app-muted mt-1 leading-relaxed">Secure these temporary credentials. You will be prompted to set a permanent password after logging in.</p>
              </div>
              <button type="button" onClick={dismissInitialCredentials} className="text-xs font-bold text-app-muted hover:text-app-muted transition-colors">Dismiss</button>
            </div>
            <div className="space-y-3">
              {(['username', 'password', 'recoveryCode'] as const).map((field) => initialCredentials[field] && (
                <div key={field} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1 px-4 py-3 bg-white/50 backdrop-blur-md border border-slate-200/60 rounded-xl shadow-sm">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-app-muted mb-0.5">{field === 'recoveryCode' ? 'Recovery Code' : field}</div>
                    <div className="break-all text-sm font-bold text-app-text">
                      {field === 'username' ? initialCredentials[field] : '•••••••••••••••• (hidden)'}
                    </div>
                  </div>
                  <button type="button" onClick={() => copyCredential(field)} className="shrink-0 px-4 py-4 bg-glass-panel hover:bg-white/90 backdrop-blur-md border border-slate-200/60 rounded-xl text-xs font-bold text-app-muted shadow-sm transition-all">{copiedField === field ? 'Copied' : 'Copy'}</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50/80 backdrop-blur-sm border border-red-200/60 text-red-700 font-bold text-center flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5 animate-slide-up">
          <div className="mb-6">
            <label className="block text-[12px] font-bold text-app-muted mb-2 uppercase tracking-widest ml-2">Username or MLSCN ID</label>
            <input
              type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 text-base bg-glass-input backdrop-blur-xl border border-glass-inputBorder shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] rounded-[20px] focus:bg-white/70 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400/50 outline-none transition-all duration-300 font-bold text-app-text placeholder-slate-400"
              placeholder="e.g. Adebayo or MLSCN-123"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-app-muted mb-2 uppercase tracking-widest ml-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 pr-14 text-base bg-glass-input backdrop-blur-xl border border-glass-inputBorder shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] rounded-[20px] focus:bg-white/70 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400/50 outline-none transition-all duration-300 font-bold text-app-text placeholder-slate-400"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-muted transition-colors p-1">
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          
          {requiresTotp && (
            <div className="mb-6 animate-slide-up">
              <label className="block text-[12px] font-bold text-app-muted mb-2 uppercase tracking-widest ml-2">Authenticator Code</label>
              <input
                type="text" required value={totpToken} onChange={(e) => setTotpToken(e.target.value)}
                className="w-full px-5 py-4 text-base bg-glass-input backdrop-blur-xl border border-glass-inputBorder shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] rounded-[20px] focus:bg-white/70 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400/50 outline-none transition-all duration-300 font-bold text-app-text placeholder-slate-400 text-center tracking-[0.5em]"
                placeholder="000000"
                maxLength={6}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 mt-8 rounded-[20px] font-bold text-lg text-white transition-all duration-300 ease-out ${
              isLoading
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-emerald-600 shadow-[0_8px_20px_rgba(5,150,105,0.25)] hover:shadow-[0_12px_24px_rgba(5,150,105,0.35)] hover:bg-emerald-500 hover:-translate-y-0.5 active:scale-[0.98]'
            }`}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
          {!initialCredentials && (
            <div className="text-center mt-4">
              <button type="button" onClick={() => setShowRecoveryModal(true)} className="text-xs font-bold text-app-muted hover:text-app-text transition-colors">
                Administrator Recovery
              </button>
            </div>
          )}
        </form>
      </div>

      {showRecoveryModal && (
        <div className="absolute inset-[-40px] animate-fade-in-blur flex items-center justify-center z-50 p-10 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-glass-panel backdrop-blur-3xl p-10 rounded-[40px] w-full max-w-lg shadow-[0_24px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] border border-glass-panelBorder animate-slide-up relative overflow-hidden">
            <h2 className="text-2xl font-black text-app-text mb-2">Account Recovery</h2>
            <p className="text-app-muted font-medium mb-8 text-sm">Reset an Administrator password using a Master Recovery Code.</p>
            
            <form onSubmit={handleRecovery} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-app-muted mb-2 uppercase tracking-widest">Username / MLSCN ID</label>
                <input type="text" required value={recoveryData.username} onChange={e => setRecoveryData({...recoveryData, username: e.target.value})} className="w-full p-4 text-sm font-bold text-app-text bg-glass-input backdrop-blur-xl border border-slate-200/60 rounded-2xl outline-none focus:bg-white/70 focus:border-emerald-400/50" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-app-muted mb-2 uppercase tracking-widest">Master Recovery Code</label>
                <input type="text" required value={recoveryData.recoveryCode} onChange={e => setRecoveryData({...recoveryData, recoveryCode: e.target.value})} className="w-full p-4 text-sm font-bold text-app-text bg-glass-input backdrop-blur-xl border border-slate-200/60 rounded-2xl outline-none focus:bg-white/70 focus:border-emerald-400/50" placeholder="RC-..." />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-app-muted mb-2 uppercase tracking-widest">New Password</label>
                <input type="password" required value={recoveryData.newPassword} onChange={e => setRecoveryData({...recoveryData, newPassword: e.target.value})} className="w-full p-4 text-sm font-bold text-app-text bg-glass-input backdrop-blur-xl border border-slate-200/60 rounded-2xl outline-none focus:bg-white/70 focus:border-emerald-400/50" />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowRecoveryModal(false)} className="flex-1 py-4 font-bold text-app-muted bg-glass-panel backdrop-blur-md border border-white/80 rounded-2xl hover:bg-white transition-colors">Cancel</button>
                <button type="submit" disabled={isRecovering} className="flex-[2] py-4 font-extrabold text-white bg-amber-600 rounded-2xl shadow-sm hover:bg-amber-500 disabled:opacity-50 transition-colors">
                  {isRecovering ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDismissConfirm && (
        <div className="absolute inset-[-40px] animate-fade-in-blur flex items-center justify-center z-50 p-10 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-glass-panel backdrop-blur-3xl p-10 rounded-[40px] w-full max-w-md shadow-[0_24px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] border border-glass-panelBorder animate-slide-up relative overflow-hidden">
            <h2 className="text-xl font-black text-app-text mb-3">Dismiss Credentials?</h2>
            <p className="text-app-muted font-medium mb-8 text-[13px] leading-relaxed">
              <strong>WARNING:</strong> Have you securely copied BOTH the initial password and the Recovery Code? 
              If you lose these, you will be permanently locked out of the system. This cannot be undone.
            </p>
            <div className="flex gap-4 pt-2">
              <button type="button" onClick={() => setShowDismissConfirm(false)} className="flex-1 py-4 font-bold text-app-muted bg-glass-panel backdrop-blur-md border border-white/80 rounded-2xl hover:bg-white transition-colors">Go Back</button>
              <button type="button" onClick={confirmDismiss} className="flex-1 py-4 font-extrabold text-white bg-red-600 rounded-2xl shadow-sm hover:bg-red-500 transition-colors">Yes, Dismiss</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal {...confirmState} />
    </div>
  );
}