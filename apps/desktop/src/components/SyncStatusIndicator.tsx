import { useEffect, useState } from 'react';

export function SyncStatusIndicator() {
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  useEffect(() => {
    const checkBackup = () => {
      setLastBackup(localStorage.getItem('iris_last_backup'));
    };
    checkBackup();
    window.addEventListener('storage', checkBackup);
    // Poll periodically to catch in-app local storage changes if event doesn't fire across same window
    const interval = setInterval(checkBackup, 2000);
    return () => {
      window.removeEventListener('storage', checkBackup);
      clearInterval(interval);
    };
  }, []);

  if (!lastBackup) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-app-muted shadow-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
        Local only
      </div>
    );
  }

  const timeStr = new Date(lastBackup).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#ecfdf5] border border-[#a7f3d0] rounded-lg text-xs font-bold text-[#059669] shadow-sm">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
      Last backup: {timeStr}
    </div>
  );
}
