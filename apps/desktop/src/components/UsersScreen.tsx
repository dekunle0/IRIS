import { useState } from 'react';

export function UsersScreen() {
  const [users] = useState([
    { id: 'u1', name: 'System Administrator', role: 'admin', mlscn: null, lastActive: 'Just now', twoFa: true, locked: false },
    { id: 'u2', name: 'Dr. Amina Bello', role: 'scientist_l2', mlscn: 'MLSCN-99382', lastActive: '2 hours ago', twoFa: true, locked: false },
    { id: 'u3', name: 'Chukwudi Eze', role: 'scientist_l1', mlscn: 'MLSCN-88471', lastActive: '1 day ago', twoFa: false, locked: true },
  ]);

  const handleCreate = () => alert("Opening 'Create User' modal...");
  const handleAudit = (name: string) => alert(`Opening side panel for ${name}'s immutable audit trail...`);

  return (
    <div className="max-w-7xl mx-auto w-full font-sans h-full flex flex-col">
      <div className="flex justify-between items-end mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Access Control</h1>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-extrabold rounded-lg uppercase tracking-wider border border-amber-200">Admin Only</span>
          </div>
          <p className="text-lg text-slate-500 font-medium">Manage local clinical accounts and audit trails.</p>
        </div>
        <button onClick={handleCreate} className="px-6 py-3 bg-[#059669] text-white font-bold rounded-xl shadow-sm hover:bg-[#047857] transition-colors">
          + Create User
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-200">
              <th className="px-8 py-5">Personnel</th>
              <th className="px-8 py-5">Role & Credential</th>
              <th className="px-8 py-5">Security Status</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${u.locked ? 'opacity-60' : ''}`}>
                <td className="px-8 py-6">
                  <div className="text-base font-extrabold text-slate-900">{u.name}</div>
                  <div className="text-sm font-bold text-slate-400 mt-1">Last Active: {u.lastActive}</div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-1.5 items-start">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-extrabold uppercase rounded-md border border-slate-200">{u.role.replace('_', ' ')}</span>
                    {u.mlscn && <span className="text-xs font-bold text-[#059669] bg-[#ecfdf5] px-2 py-0.5 rounded border border-[#a7f3d0] flex items-center gap-1">✓ {u.mlscn}</span>}
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-1.5">
                    <span className={`text-xs font-bold flex items-center gap-1.5 ${u.twoFa ? 'text-slate-600' : 'text-warning'}`}>
                      <div className={`w-2 h-2 rounded-full ${u.twoFa ? 'bg-slate-400' : 'bg-warning'}`}></div>
                      2FA {u.twoFa ? 'Enabled' : 'Disabled'}
                    </span>
                    {u.locked && <span className="text-xs font-bold text-error flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-error"></div>Account Locked</span>}
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-3">
                    <button onClick={() => handleAudit(u.name)} className="text-sm font-bold text-[#059669] hover:text-[#047857]">Audit Trail</button>
                    <span className="text-slate-300">•</span>
                    <button className="text-sm font-bold text-slate-500 hover:text-slate-800">{u.locked ? 'Unlock' : 'Lock'}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}