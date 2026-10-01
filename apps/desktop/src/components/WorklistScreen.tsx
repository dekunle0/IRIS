import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { WorklistPriorityQueue, debounce } from '../utils/algorithms';
import { ConfirmModal } from './ConfirmModal';

interface WorklistScreenProps {
  currentUser: any;
  onRowClick: (request: any) => void;
}

const ChevronDown = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
  </svg>
);

const formatAge = (dob: string) => {
  if (!dob) return '—';
  const days = Math.floor((Date.now() - new Date(dob).getTime()) / 86400000);
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}yr`;
};

const formatWait = (createdAt: string) => {
  const diff = Date.now() - new Date(createdAt).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff / 60000) % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const formatPriority = (p: string) => {
  if (p === 'stat') return 'STAT';
  if (!p) return '';
  return p.charAt(0).toUpperCase() + p.slice(1);
};

const formatStatus = (s: string) => {
  if (!s) return '';
  return s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const priorityBadge: Record<string, string> = {
  stat: 'bg-red-100 text-red-700 border-red-200',
  urgent: 'bg-amber-100 text-amber-700 border-amber-200',
  routine: 'bg-slate-100 text-app-muted border-slate-200',
};

export function WorklistScreen({ currentUser, onRowClick }: WorklistScreenProps) {
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

  const [worklist, setWorklist] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [masterSearch, setMasterSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [reqData, setReqData] = useState({ patientCode: '', testName: 'Malaria Parasite', priority: 'routine', requestingClinician: '', clinicalNotes: '' });
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pq = useMemo(() => new WorklistPriorityQueue(), []);

  const fetchWorklist = async () => {
    try {
      if (!window.electron) return;
      const response = await window.electron.ipcRenderer.invoke('worklist:getPending');
      if (response.success) {
        pq.buildFromList(response.data);
        setWorklist(pq.toSortedArray());
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorklist();
    const intervalId = setInterval(fetchWorklist, 5000);
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const executeSearch = async (val: string) => {
    if (!val) {
      setPatientResults([]);
      setIsDropdownOpen(false);
      return;
    }
    
    if (window.electron) {
      const res = await window.electron.ipcRenderer.invoke('worklist:searchPatients', val);
      if (res.success) {
        setPatientResults(res.data);
        setIsDropdownOpen(true);
      }
    }
  };

  const debouncedSearch = useCallback(debounce(executeSearch, 300), []);

  const handlePatientSearchChange = (val: string) => {
    setPatientSearch(val);
    debouncedSearch(val);
  };

  const handleSelectPatient = (patient: any) => {
    setReqData(prev => ({ ...prev, patientCode: patient.patient_code }));
    setPatientSearch(`${patient.full_name} (${patient.patient_code})`);
    setIsDropdownOpen(false);
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqData.patientCode) {
      await requestAlert('Missing Patient', 'Select a valid patient.');
      return;
    }
    try {
      const res = await window.electron.ipcRenderer.invoke('worklist:createRequest', {
        patientCode: reqData.patientCode,
        testName: reqData.testName,
        testCategory: reqData.testName === 'Malaria Parasite' ? 'parasitology' : 'haematology',
        priority: reqData.priority,
        requestingClinician: reqData.requestingClinician,
        clinicalNotes: reqData.clinicalNotes,
        userId: currentUser?.id,
      });
      if (res.success) {
        setShowModal(false);
        setReqData({ patientCode: '', testName: 'Malaria Parasite', priority: 'routine', requestingClinician: '', clinicalNotes: '' });
        setPatientSearch('');
        fetchWorklist();
      } else {
        await requestAlert('Error', res.error);
      }
    } catch {
      await requestAlert('Error', 'Failed to connect to the backend.');
    }
  };

  const filteredWorklist = worklist
    .filter((item: any) => {
      const search = masterSearch.trim().toLowerCase();
      if (search && !item.patientName?.toLowerCase().includes(search) && !item.patientCode?.toLowerCase().includes(search)) {
        return false;
      }
      return statusFilter === 'All' || item.status.toLowerCase() === statusFilter.toLowerCase();
    })
    .sort((a: any, b: any) => pq.getWeight(b) - pq.getWeight(a));

  const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-app-text font-medium placeholder:text-app-muted shadow-sm';
  const selectCls = `${inputCls} appearance-none cursor-pointer pr-8`;

  return (
    <div className="h-full flex flex-col font-sans relative">
      <div className="mb-8 flex justify-between items-end animate-slide-up">
        <div>
          <h1 className="text-3xl font-extrabold text-app-text tracking-tight">Test worklist</h1>
          <p className="text-base text-app-muted mt-1 font-medium">Pending tests and slides.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-4 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer shadow-sm"
            >
              <option value="All">All Statuses</option>
              <option value="requested">Requested</option>
              <option value="review">Awaiting Review</option>
              <option value="released">Released</option>
              <option value="unable_to_analyse">Unable to Analyse</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search patients..."
              value={masterSearch}
              onChange={e => setMasterSearch(e.target.value)}
              className="pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-app-text font-medium w-64 transition-all shadow-sm"
            />
          </div>

          {currentUser?.role !== 'viewer' && (
            <button
              onClick={() => { setShowModal(true); handlePatientSearchChange(''); }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm tracking-wide"
            >
              Add test
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <div className="absolute inset-[-40px] flex items-center justify-center z-50 bg-slate-900/30 backdrop-blur-md animate-fade-in-blur p-6">
          <div className="bg-glass-panel backdrop-blur-3xl p-8 rounded-[40px] w-full max-w-sm shadow-[0_24px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] border border-glass-panelBorder animate-slide-up relative overflow-hidden">
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h2 className="text-xl font-black text-app-text">Add test</h2>
              <button onClick={() => setShowModal(false)} className="text-app-muted hover:text-app-muted transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateRequest} className="space-y-5">
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-bold text-app-muted mb-1.5 uppercase tracking-wide">Patient</label>
                <input
                  type="text"
                  value={patientSearch}
                  onChange={e => handlePatientSearchChange(e.target.value)}
                  onFocus={() => { if (patientSearch === '') handlePatientSearchChange(''); setIsDropdownOpen(true); }}
                  placeholder="Search name or ID..."
                  className={inputCls}
                />
                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
                    {patientResults.length === 0 ? (
                      <div className="p-3 text-center text-sm font-medium text-app-muted">No patients found.</div>
                    ) : (
                      patientResults.map(p => (
                        <div key={p.patient_code} onClick={() => handleSelectPatient(p)} className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors">
                          <div className="text-sm font-bold text-app-text">{p.full_name}</div>
                          <div className="text-xs font-semibold text-app-muted flex justify-between mt-1 tracking-wide">
                            <span>{p.patient_code}</span>
                            <span>{formatAge(p.dob)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-app-muted mb-1.5 uppercase tracking-wide">Test</label>
                <div className="relative">
                  <select value={reqData.testName} onChange={e => setReqData(prev => ({ ...prev, testName: e.target.value }))} className={selectCls}>
                    <option value="Malaria Parasite">Malaria Parasite</option>
                    <option value="WBC Differential">WBC Differential</option>
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-app-muted"><ChevronDown /></div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-app-muted mb-1.5 uppercase tracking-wide">Priority</label>
                <div className="relative">
                  <select value={reqData.priority} onChange={e => setReqData(prev => ({ ...prev, priority: e.target.value }))} className={selectCls}>
                    <option value="routine">Routine</option>
                    <option value="urgent">Urgent</option>
                    <option value="stat">STAT (Emergency)</option>
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-app-muted"><ChevronDown /></div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-app-muted mb-1.5 uppercase tracking-wide">Requesting Clinician</label>
                <input type="text" value={reqData.requestingClinician} onChange={e => setReqData(prev => ({ ...prev, requestingClinician: e.target.value }))} className={inputCls} placeholder="Dr. Smith (Optional)" />
              </div>

              <div>
                <label className="block text-xs font-bold text-app-muted mb-1.5 uppercase tracking-wide">Clinical Notes</label>
                <textarea value={reqData.clinicalNotes} onChange={e => setReqData(prev => ({ ...prev, clinicalNotes: e.target.value }))} className={`${inputCls} min-h-[60px] py-2`} placeholder="Suspected condition, symptoms..." />
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm tracking-wide">
                  Add test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex-1 bg-glass-panel backdrop-blur-3xl rounded-3xl border border-glass-panelBorder shadow-[0_24px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col min-h-0">
          {isLoading ? (
            <div className="p-12 text-center font-semibold text-app-muted text-sm flex-1 flex items-center justify-center">Loading worklist...</div>
          ) : filteredWorklist.length === 0 ? (
            <div className="p-12 text-center font-semibold text-app-muted text-sm flex-1 flex items-center justify-center">No pending tests.</div>
          ) : (
            <div className="overflow-x-auto flex-1 custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/60 backdrop-blur-md sticky top-0 z-10">
                  <tr className="border-b border-slate-200/60">
                    <th className="px-5 py-3 text-[10px] font-bold text-app-muted uppercase tracking-widest">Patient</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-app-muted uppercase tracking-widest">Age</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-app-muted uppercase tracking-widest">Test</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-app-muted uppercase tracking-widest">Priority</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-app-muted uppercase tracking-widest">Status</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-app-muted uppercase tracking-widest">Wait</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60">
                  {filteredWorklist.map(row => {
                    const isStat = row.priority === 'stat';
                    return (
                      <tr
                        key={row.requestId}
                        onClick={() => onRowClick(row)}
                        className={`group cursor-pointer hover:bg-glass-panel transition-colors ${isStat ? 'bg-red-50/40 hover:bg-red-50/70' : ''}`}
                      >
                        <td className="px-5 py-4 relative">
                          {isStat && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />}
                          <div className="text-sm font-bold text-app-text group-hover:text-emerald-700 transition-colors">{row.patientName}</div>
                          <div className="text-[10px] font-bold tracking-wide text-app-muted mt-0.5">{row.patientCode}</div>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-app-muted">{formatAge(row.patientDob)}</td>
                        <td className="px-5 py-4 text-sm font-bold text-app-muted">{row.testName}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border ${priorityBadge[row.priority] ?? priorityBadge.routine}`}>
                            {formatPriority(row.priority)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-app-muted">{formatStatus(row.status)}</td>
                        <td className="px-5 py-4 text-sm font-mono font-medium text-app-muted">{formatWait(row.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </div>
      <ConfirmModal {...confirmState} />
    </div>
  );
}
