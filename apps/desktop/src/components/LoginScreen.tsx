import { useState } from 'react';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export function LoginScreen({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (window.electron) {
        const response = await window.electron.ipcRenderer.invoke('auth:login', { username, password });
        if (response.success) {
          onLoginSuccess(response.user);
        } else {
          setError(response.error || 'Authentication failed');
        }
      } else {
        if (username === 'Admin' && password === 'admin') {
          onLoginSuccess({ id: 'local-test', name: 'Browser Tester', role: 'admin' });
        } else {
          setError('Use Admin / admin for browser testing');
        }
      }
    } catch (err) {
      setError('System error connecting to local database.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-200/40 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-teal-100/40 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[440px] p-12 bg-white/50 backdrop-blur-3xl rounded-[40px] shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-white z-10 relative">
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="h-16 w-16 bg-slate-900 rounded-[20px] flex items-center justify-center shadow-lg shadow-slate-900/10 mb-6">
            <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3a9 9 0 0 1 9 9" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">IRIS</h1>
          <p className="text-slate-500 font-semibold mt-2">Clinical Workstation</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-50/80 backdrop-blur-md border border-red-100/50 text-red-600 text-sm font-bold rounded-2xl flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-[12px] font-bold text-slate-400 mb-2 uppercase tracking-widest ml-2">MLSCN Credential</label>
            <input
              type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 text-base bg-white/60 backdrop-blur-md border border-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] rounded-[20px] focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400/50 outline-none transition-all duration-300 font-semibold text-slate-800 placeholder-slate-300"
              placeholder="MLSCN-12345"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-slate-400 mb-2 uppercase tracking-widest ml-2">Passcode</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 text-base bg-white/60 backdrop-blur-md border border-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] rounded-[20px] focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400/50 outline-none transition-all duration-300 font-semibold text-slate-800 placeholder-slate-300"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 mt-4 rounded-[20px] font-bold text-lg text-white transition-all duration-300 ease-out ${
              isLoading 
                ? 'bg-slate-300 cursor-not-allowed' 
                : 'bg-emerald-600 shadow-[0_8px_20px_rgba(5,150,105,0.25)] hover:shadow-[0_12px_24px_rgba(5,150,105,0.35)] hover:bg-emerald-500 hover:-translate-y-0.5 active:scale-[0.98]'
            }`}
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}