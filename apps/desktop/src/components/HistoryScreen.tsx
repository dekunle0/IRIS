import { useState, useEffect, useMemo } from 'react';
import { mergeSortLogs } from '../utils/algorithms';
import { ConfirmModal } from './ConfirmModal';

export function HistoryScreen({ currentUser }: { currentUser?: any }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const limit = 50;
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
  
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [details, setDetails] = useState<any>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  const fetchHistory = async () => {
    setIsLoading(true);
    if (window.electron) {
      const res = await window.electron.ipcRenderer.invoke('system:getHistory', { 
        userId: currentUser?.id, 
        role: currentUser?.role,
        limit,
        offset: (page - 1) * limit
      });
      if (res.success) setLogs(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [currentUser, page]);

  const handleExport = async () => {
    if (!window.electron) return;
    const res = await window.electron.ipcRenderer.invoke('system:exportAuditLog');
    if (!res.success) await requestAlert('Export Failed', res.error);
    else await requestAlert('Export Success', 'Audit log exported successfully.');
  };

  const filteredLogs = useMemo(() => {
    let filtered = logs;
    if (filterAction !== 'all') {
      filtered = filtered.filter(log => log.action === filterAction);
    }
    // Algorithm: O(N log N) Stable Merge Sort
    return mergeSortLogs(filtered, sortOrder);
  }, [logs, filterAction, sortOrder]);

  const handleRowClick = async (log: any) => {
    if (log.action !== 'create_patient' && log.action !== 'release_result' && log.action !== 'approve_result') return;
    
    setSelectedLog(log);
    setIsDetailsLoading(true);
    if (window.electron) {
      const res = await window.electron.ipcRenderer.invoke('system:getAuditDetails', {
        action: log.action,
        entityId: log.entity_id
      });
      if (res.success) setDetails(res.data);
    }
    setIsDetailsLoading(false);
  };

  const formatAction = (action: string) => {
    const actionMap: Record<string, { label: string, color: string }> = {
      'login': { label: 'User Login', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
      'logout': { label: 'User Logout', color: 'text-app-muted bg-slate-100 border-slate-200' },
      'create_patient': { label: 'Registered Patient', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
      'release_result': { label: 'Released Result', color: 'text-blue-700 bg-blue-50 border-blue-200' },
      'approve_result': { label: 'Approved Result', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
      'create_test_request': { label: 'Test Requested', color: 'text-purple-700 bg-purple-50 border-purple-200' },
      'change_password': { label: 'Security Update', color: 'text-amber-700 bg-amber-50 border-amber-200' },
      'system_initialized': { label: 'System Setup', color: 'text-rose-700 bg-rose-50 border-rose-200' }
    };
    const mapped = actionMap[action] || { label: action.replace('_', ' '), color: 'text-app-muted bg-slate-100 border-slate-200' };
    return <span className={`px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest rounded-lg border ${mapped.color}`}>{mapped.label}</span>;
  };

  const formatRole = (role: string) => {
    if (!role) return 'Personnel';
    if (role === 'admin') return 'Administrator';
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="h-full flex flex-col font-sans relative pb-10">
      <div className="mb-10 flex justify-between items-end animate-slide-up">
        <div>
          <h1 className="text-3xl font-extrabold text-app-text tracking-tight">History</h1>
          <p className="text-base text-app-muted mt-1 font-medium">
            {currentUser?.role === 'admin' ? 'Audit log of all actions.' : 'Your action history.'}
          </p>
        </div>
        
        <div className="flex gap-3">
          {currentUser?.role === 'admin' && (
            <button onClick={handleExport} className="px-5 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
              Export CSV
            </button>
          )}
          <div className="relative group">
            <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className="w-64 pl-5 pr-12 py-3 bg-glass-panel backdrop-blur-md border border-white/80 text-app-text font-bold rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] appearance-none outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400/50 cursor-pointer transition-all">
              <option value="all">All Actions</option>
              {currentUser?.role === 'admin' && <option value="login">Logins</option>}
              <option value="create_patient">Patient Registrations</option>
              <option value="approve_result">Approved Results</option>
              <option value="release_result">Released Results</option>
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-app-muted group-focus-within:text-emerald-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <div className="relative group">
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')} className="w-48 pl-5 pr-12 py-3 bg-glass-panel backdrop-blur-md border border-white/80 text-app-text font-bold rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] appearance-none outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400/50 cursor-pointer transition-all">
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-app-muted group-focus-within:text-emerald-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-glass-panel backdrop-blur-3xl rounded-[40px] border border-glass-panelBorder shadow-[0_24px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {isLoading ? (
          <div className="p-16 text-center text-app-muted font-bold">Loading history...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center text-app-muted font-bold text-xl flex-1 flex items-center justify-center">No history recorded yet.</div>
        ) : (
          <div className="overflow-x-auto flex-1 p-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-app-muted text-[11px] font-bold uppercase tracking-widest border-b border-slate-100">
                  <th className="px-8 py-5">Timestamp</th>
                  <th className="px-8 py-5">Action Taken</th>
                  <th className="px-8 py-5">User</th>
                  <th className="px-8 py-5">Entity ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredLogs.map((log, index) => {
                  const isClickable = log.action === 'create_patient' || log.action === 'release_result' || log.action === 'approve_result';
                  return (
                    <tr 
                      key={log.id} 
                      onClick={() => isClickable && handleRowClick(log)}
                      className={`group transition-colors duration-300 animate-slide-up ${isClickable ? 'cursor-pointer hover:bg-slate-50' : ''}`} 
                      style={{ animationDelay: `${0.15 + (index * 0.02)}s` }}
                    >
                      <td className="px-8 py-6 font-bold text-app-muted">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-8 py-6">
                        {formatAction(log.action)}
                      </td>
                      <td className="px-8 py-6">
                        <div className="font-extrabold text-app-text">{log.userName || 'System'}</div>
                        <div className="text-[10px] font-bold text-app-muted uppercase tracking-widest mt-1">{formatRole(log.role)}</div>
                      </td>
                      <td className="px-8 py-6 font-mono text-xs font-semibold text-app-muted">
                        {log.entity_id}
                        {isClickable && <span className="ml-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity font-sans font-bold text-sm tracking-normal">View Details &rarr;</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {filteredLogs.length > 0 && (
          <div className="flex justify-between items-center px-8 py-4 bg-slate-50/50 backdrop-blur-md border-t border-slate-200/50">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 font-bold text-app-muted hover:text-app-text disabled:opacity-50">
              &larr; Previous
            </button>
            <span className="text-sm font-bold text-app-muted">Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={filteredLogs.length < limit} className="px-4 py-2 font-bold text-app-muted hover:text-app-text disabled:opacity-50">
              Next &rarr;
            </button>
          </div>
        )}
      </div>

      {selectedLog && (
        <div className="absolute inset-[-40px] animate-fade-in-blur flex items-center justify-center z-50 p-10 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-glass-panel backdrop-blur-3xl p-12 rounded-[40px] w-full max-w-3xl shadow-[0_24px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] border border-glass-panelBorder animate-slide-up relative overflow-hidden">
            <div className="flex justify-between items-start mb-8 border-b border-slate-200/50 pb-6 relative z-10">
              <div>
                <h2 className="text-3xl font-black text-app-text mb-2 tracking-tight">
                  {selectedLog.action === 'create_patient' ? 'Patient Registration Record' : (selectedLog.action === 'approve_result' ? 'Approved Result Record' : 'Released Result Record')}
                </h2>
                <p className="text-app-muted font-medium">Secured on {new Date(selectedLog.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => {setSelectedLog(null); setDetails(null);}} className="p-3 bg-glass-panel backdrop-blur-md rounded-2xl hover:bg-white border border-slate-200/60 transition-all shadow-sm">
                <svg className="w-6 h-6 text-app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {isDetailsLoading ? (
              <div className="py-16 text-center text-app-muted font-bold">Retrieving encrypted details...</div>
            ) : details ? (
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-8 bg-glass-input backdrop-blur-xl p-8 rounded-3xl border border-glass-inputBorder shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)]">
                  <div>
                    <div className="text-[11px] font-bold text-app-muted uppercase tracking-widest mb-1">Patient ID Code</div>
                    <div className="text-xl font-black text-app-text">{details.patient_code}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-app-muted uppercase tracking-widest mb-1">Legal Full Name</div>
                    <div className="text-xl font-black text-app-text">{details.full_name}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-app-muted uppercase tracking-widest mb-1">Demographics</div>
                    <div className="text-lg font-bold text-app-muted">{details.gender} • {details.dob}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-app-muted uppercase tracking-widest mb-1">Contact Phone</div>
                    <div className="text-lg font-bold text-app-muted">{details.phone}</div>
                  </div>
                </div>

                {(selectedLog.action === 'release_result' || selectedLog.action === 'approve_result') && (
                  <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-200 shadow-inner">
                    <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest mb-3">Clinical Findings ({details.test_name})</div>
                    <p className="text-app-text font-medium text-lg leading-relaxed mb-6 whitespace-pre-wrap">{details.edited_findings}</p>
                    
                    <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest mb-2">Interpretive Comment</div>
                    <p className="text-app-muted font-medium leading-relaxed whitespace-pre-wrap">{details.interpretive_comment}</p>
                  </div>
                )}

                <div className="flex flex-col gap-6">
                  {details.signature && (
                    <div>
                      <div className="text-[11px] font-bold text-app-muted uppercase tracking-widest mb-3 ml-1">NDPR Consent Signature</div>
                      {details.signature !== 'mock' && details.signature !== 'lis-sync' ? (
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 inline-block shadow-sm">
                          <img src={details.signature} alt="Patient Signature" className="h-24 object-contain" />
                        </div>
                      ) : (
                        <div className="text-sm font-bold text-app-muted italic bg-glass-input backdrop-blur-xl p-4 rounded-xl inline-block border border-glass-inputBorder shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)]">
                          Signature waived (System generated / External LIS Integration)
                        </div>
                      )}
                    </div>
                  )}

                  {details.approvalSignature && (
                    <div>
                      <div className="text-[11px] font-bold text-app-muted uppercase tracking-widest mb-3 ml-1">Clinical Approval Signature</div>
                      {details.approvalSignature !== 'mock' ? (
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 inline-block shadow-sm">
                          <img src={details.approvalSignature} alt="Scientist Signature" className="h-24 object-contain" />
                        </div>
                      ) : (
                        <div className="text-sm font-bold text-app-muted italic bg-glass-input backdrop-blur-xl p-4 rounded-xl inline-block border border-glass-inputBorder shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)]">
                          Signature waived (System generated)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-red-500 font-bold">Could not locate original record. It may have been purged during a factory reset.</div>
            )}
          </div>
        </div>
      )}
      <ConfirmModal {...confirmState} />
    </div>
  );
}