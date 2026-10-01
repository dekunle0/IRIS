import { useState, useEffect } from 'react';
import { ConfirmModal } from './ConfirmModal';

export function QCDashboard() {
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

  const [stats, setStats] = useState({
    totalAnalyses: 0,
    totalCorrections: 0,
    agreementRate: 100,
    scientistWorkload: [] as any[],
    chartData: [] as any[]
  });
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    const fetchQCStats = async () => {
      try {
        if (window.electron) {
          const res = await window.electron.ipcRenderer.invoke('qc:getStats', { period });
          if (res.success) setStats(res.data);
        }
      } catch (err) {
        console.error("Failed to load QC stats:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQCStats();
    const intervalId = setInterval(fetchQCStats, 60000);
    return () => clearInterval(intervalId);
  }, [period]);

  if (isLoading) {
    return <div className="p-20 text-center text-app-muted font-bold text-xl animate-pulse">Loading QC dashboard...</div>;
  }

  const maxCorrections = Math.max(...stats.chartData.map(d => d.corrections), 1);

  const handleExport = async () => {
    if (!window.electron) return;
    try {
      const res = await window.electron.ipcRenderer.invoke('qc:exportSummary', { period });
      if (!res.success && !res.canceled) {
        await requestAlert('Export Failed', `Export failed: ${res.error}`);
      }
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  return (
    <div className="h-full flex flex-col font-sans pb-10 max-w-7xl mx-auto w-full">
      <div className="mb-10 flex justify-between items-end animate-slide-up">
        <div>
          <h1 className="text-3xl font-extrabold text-app-text tracking-tight">QC Dashboard</h1>
          <p className="text-base text-app-muted mt-1 font-medium">AI performance and lab workload.</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2.5 bg-glass-input backdrop-blur-sm border border-glass-inputBorder text-app-text font-bold rounded-xl outline-none shadow-sm cursor-pointer"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
          <button 
            onClick={handleExport}
            className="px-5 py-2.5 bg-glass-input backdrop-blur-sm border border-glass-inputBorder text-app-text font-bold rounded-xl hover:bg-glass-panel hover:shadow-sm transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Premium KPI Cards */}
      <div className="grid grid-cols-3 gap-8 mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="bg-glass-panel backdrop-blur-3xl border border-glass-panelBorder rounded-[40px] shadow-[0_24px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] p-8  flex flex-col justify-between">
          <h3 className="text-[11px] font-bold text-app-muted uppercase tracking-widest mb-4 ml-1">AI Agreement Rate</h3>
          <div>
            <div className="text-6xl font-black text-app-text mb-2 tracking-tighter">{stats.agreementRate}%</div>
            <p className={`text-sm font-bold ${stats.agreementRate > 90 ? 'text-emerald-600' : 'text-amber-500'}`}>
              {stats.totalCorrections === 0 ? 'No manual corrections needed' : 'Actionable deviations recorded'}
            </p>
          </div>
        </div>

        <div className="bg-glass-panel backdrop-blur-3xl border border-glass-panelBorder rounded-[40px] shadow-[0_24px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] p-8  flex flex-col justify-between">
          <h3 className="text-[11px] font-bold text-app-muted uppercase tracking-widest mb-4 ml-1">Total Analyses</h3>
          <div>
            <div className="text-6xl font-black text-app-text mb-2 tracking-tighter">{stats.totalAnalyses}</div>
            <p className="text-sm font-bold text-app-muted">Approved results in database</p>
          </div>
        </div>

        <div className="bg-glass-panel backdrop-blur-3xl border border-glass-panelBorder rounded-[40px] shadow-[0_24px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] p-8  flex flex-col justify-between">
          <h3 className="text-[11px] font-bold text-app-muted uppercase tracking-widest mb-4 ml-1">Total Corrections</h3>
          <div>
            <div className="text-6xl font-black text-app-text mb-2 tracking-tighter">{stats.totalCorrections}</div>
            <p className="text-sm font-bold text-rose-600">AI findings manually overridden</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 flex-1 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        
        {/* The Chart */}
        <div className="bg-glass-panel backdrop-blur-3xl border border-glass-panelBorder rounded-[40px] shadow-[0_24px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] p-10  flex flex-col">
          <div className="mb-8 border-b border-slate-100 pb-5">
            <h3 className="text-2xl font-black text-app-text tracking-tight">Override frequency</h3>
            <p className="text-sm text-app-muted font-medium mt-1">Most overridden AI results</p>
          </div>
          
          <div className="flex-1 flex flex-col justify-center space-y-10 px-2">
            {stats.chartData.length === 0 ? (
              <div className="text-center text-app-muted font-bold">No test data available yet.</div>
            ) : (
              stats.chartData.map((item, index) => {
                const widthPct = (item.corrections / maxCorrections) * 100;
                const barColor = index % 2 === 0 ? 'bg-amber-500' : 'bg-rose-500'; 
                
                return (
                  <div key={index} className="w-full">
                    <div className="flex justify-between text-sm font-bold text-app-text mb-3">
                      <span>{item.name}</span>
                      <span className="text-app-muted">{item.corrections} overrides</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-5 overflow-hidden border border-slate-200 shadow-inner">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${widthPct > 0 ? barColor : 'bg-transparent'}`} 
                        style={{ width: `${widthPct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* The Workload Table */}
        <div className="bg-glass-panel backdrop-blur-3xl border border-glass-panelBorder rounded-[40px] shadow-[0_24px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] p-10  flex flex-col">
          <div className="mb-6 border-b border-slate-100 pb-5">
            <h3 className="text-2xl font-black text-app-text tracking-tight">Scientist output</h3>
            <p className="text-sm text-app-muted font-medium mt-1">Lab workload and sign-offs</p>
          </div>
          
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-app-muted text-[11px] font-bold uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                  <th className="py-5 px-6 rounded-tl-xl">Scientist</th>
                  <th className="py-5 px-6 text-right rounded-tr-xl">Total Analyses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.scientistWorkload.map((sw: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-6 px-6">
                      <div className="font-extrabold text-app-text text-lg">{sw.name}</div>
                      <div className="text-[11px] font-bold text-app-muted uppercase tracking-widest mt-1">
                        {sw.role === 'admin' ? 'Administrator' : sw.role.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="py-6 px-6 font-black text-app-muted text-right text-xl">{sw.analyses}</td>
                  </tr>
                ))}
                {stats.scientistWorkload.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-12 text-center text-app-muted font-bold">No active scientists found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
      <ConfirmModal {...confirmState} />
    </div>
  );
}