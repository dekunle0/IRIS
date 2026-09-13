import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function QCDashboard() {
  // Realistic clinical mock data for Malaria Parasite Phase 1
  const [kpis] = useState({
    aiAgreementRate: 88.4,
    totalAnalyses: 1245,
    avgTurnaroundMin: 12.5,
    totalCorrections: 144
  });

  // Correction frequency by field (identifies where the AI needs retraining)
  const [correctionData] = useState([
    { field: 'Ring Stage', overrides: 68 },
    { field: 'Trophozoite', overrides: 42 },
    { field: 'Gametocyte', overrides: 18 },
    { field: 'Uninfected RBC', overrides: 11 },
    { field: 'Leukocyte (WBC)', overrides: 5 },
  ]);

  // Per-scientist workload and performance
  const [workloadData] = useState([
    { id: 'u1', name: 'Dr. Amina Bello', role: 'Scientist L2', analyses: 512, avgTime: '11.2m', correctionRate: '8.5%' },
    { id: 'u2', name: 'Chukwudi Eze', role: 'Scientist L1', analyses: 489, avgTime: '14.1m', correctionRate: '12.2%' },
    { id: 'u3', name: 'Dr. Sarah Ojo', role: 'Scientist L2', analyses: 244, avgTime: '10.8m', correctionRate: '7.9%' },
  ]);

  const handleExport = () => {
    alert("Generating local MLS-format QC Period Summary PDF for accreditation recordkeeping...");
  };

  return (
    <div className="max-w-7xl mx-auto w-full font-sans pb-10 flex flex-col h-full">
      
      {/* Header section matching PRD C.6 */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Quality Control</h1>
          <p className="text-lg text-slate-500 mt-2 font-medium">Local AI performance and laboratory workload analytics.</p>
        </div>
        <div className="flex gap-4">
          <select className="px-4 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-[#059669]">
            <option>Last 30 Days</option>
            <option>Last 7 Days</option>
            <option>This Quarter</option>
          </select>
          <button onClick={handleExport} className="px-6 py-3 bg-[#059669] text-white font-bold rounded-xl shadow-sm hover:bg-[#047857] transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Export Period Summary
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">AI Agreement Rate</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-800">{kpis.aiAgreementRate}%</span>
          </div>
          <div className="text-sm font-semibold text-[#059669] mt-2">No manual corrections needed</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Total Analyses</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-800">{kpis.totalAnalyses}</span>
          </div>
          <div className="text-sm font-semibold text-slate-500 mt-2">Approved results in period</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Avg Turnaround</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-800">{kpis.avgTurnaroundMin}</span>
            <span className="text-lg font-bold text-slate-500">mins</span>
          </div>
          <div className="text-sm font-semibold text-slate-500 mt-2">Capture to Final Approval</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Total Corrections</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-800">{kpis.totalCorrections}</span>
          </div>
          <div className="text-sm font-semibold text-warning mt-2">AI findings overridden</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8 flex-1 min-h-0">
        
        {/* Correction Frequency Chart */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col">
          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-slate-800">Correction Frequency by Field</h2>
            <p className="text-sm text-slate-500 font-medium">Which AI classifications get overridden most (Retraining targets)</p>
          </div>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={correctionData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} fontWeight={600} />
                <YAxis dataKey="field" type="category" stroke="#64748b" fontSize={13} fontWeight={700} width={120} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="overrides" radius={[0, 6, 6, 0]}>
                  {correctionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#DC2626' : index === 1 ? '#D97706' : '#059669'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scientist Workload Table */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col overflow-hidden">
          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-slate-800">Reviewer Workload & Performance</h2>
            <p className="text-sm text-slate-500 font-medium">Per-scientist metrics</p>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-200">
                  <th className="px-4 py-3 rounded-tl-xl">Scientist</th>
                  <th className="px-4 py-3">Analyses</th>
                  <th className="px-4 py-3">Avg Turnaround</th>
                  <th className="px-4 py-3 rounded-tr-xl">Correction Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workloadData.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-extrabold text-slate-800">{user.name}</div>
                      <div className="text-xs font-bold text-slate-400 mt-0.5">{user.role}</div>
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-700">{user.analyses}</td>
                    <td className="px-4 py-4 font-bold text-slate-700">{user.avgTime}</td>
                    <td className="px-4 py-4 font-bold text-[#059669]">{user.correctionRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}