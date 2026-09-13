import { useEffect, useState } from 'react';

interface WorklistScreenProps {
  onRowClick: (request: any) => void;
}

export function WorklistScreen({ onRowClick }: WorklistScreenProps) {
  const [worklist, setWorklist] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWorklist = async () => {
    try {
      if (window.electron) {
        const response = await window.electron.ipcRenderer.invoke('worklist:getPending');
        if (response.success) {
          setWorklist(response.data);
        } else {
          setError('Failed to load worklist from database.');
        }
      } else {
        setWorklist([
          { requestId: 'req-1', patientName: 'Adebayo Johnson', patientCode: 'PT-123456', testName: 'Malaria Parasite', priority: 'stat', status: 'requested', assignedTo: 'System Administrator', createdAt: new Date().toISOString() },
          { requestId: 'req-2', patientName: 'Ngozi Okafor', patientCode: 'PT-987654', testName: 'WBC Differential', priority: 'routine', status: 'requested', assignedTo: null, createdAt: new Date(Date.now() - 7200000).toISOString() }
        ]);
      }
    } catch (err) {
      setError('Connection to local database lost.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorklist();
    const intervalId = setInterval(() => { fetchWorklist(); }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const calculateAge = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="h-full flex flex-col font-sans">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Laboratory Worklist</h1>
        <p className="text-lg text-slate-500 mt-2 font-medium">Live offline database view</p>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-600 font-bold rounded-xl shadow-sm flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          {error}
        </div>
      )}

      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 font-bold text-lg flex-1 flex items-center justify-center">
            Syncing local records...
          </div>
        ) : worklist.length === 0 ? (
          <div className="p-16 text-center text-slate-400 font-bold text-xl flex-1 flex items-center justify-center">
            No pending work — the worklist clears as results are approved.
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-200">
                  <th className="px-8 py-5">Patient Record</th>
                  <th className="px-8 py-5">Analysis Type</th>
                  <th className="px-8 py-5">Priority</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5">Assigned To</th>
                  <th className="px-8 py-5">Age</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {worklist.map((row) => {
                  const isStat = row.priority === 'stat';
                  return (
                    <tr 
                      key={row.requestId} 
                      onClick={() => onRowClick(row)}
                      className={`group cursor-pointer hover:bg-slate-50 transition-colors duration-150 ${isStat ? 'bg-red-50/30' : ''}`}
                    >
                      <td className="px-8 py-6 relative">
                        {isStat && <div className="absolute left-0 top-0 bottom-0 w-2 bg-red-500"></div>}
                        <div className="text-lg font-extrabold text-slate-900 group-hover:text-primary transition-colors">{row.patientName}</div>
                        <div className="text-sm font-bold text-slate-400 mt-1">{row.patientCode}</div>
                      </td>
                      <td className="px-8 py-6 text-base font-bold text-slate-700">{row.testName}</td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 text-xs font-extrabold tracking-wider uppercase rounded-lg border ${
                          isStat ? 'bg-red-100 border-red-200 text-red-700' : 
                          row.priority === 'urgent' ? 'bg-amber-100 border-amber-200 text-amber-700' : 
                          'bg-slate-100 border-slate-200 text-slate-600'
                        }`}>
                          {row.priority}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-base font-bold text-slate-600 capitalize">{row.status.replace('_', ' ')}</td>
                      <td className="px-8 py-6 text-base font-medium text-slate-500">{row.assignedTo || 'Unassigned'}</td>
                      <td className="px-8 py-6 text-base font-extrabold text-slate-400">{calculateAge(row.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}