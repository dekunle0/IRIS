import { useState, useEffect } from 'react';
import { ConfirmModal } from './ConfirmModal';

export function UsersScreen({ currentUser }: { currentUser?: any }) {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', username: '', password: '', role: 'scientist_l1', mlscnVerified: false });
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

  const fetchUsers = async () => {
    if (window.electron) {
      const res = await window.electron.ipcRenderer.invoke('users:getAll');
      if (res.success) setUsers(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.electron) return;
    
    // Quick validation on frontend as well
    const STRONG_PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!STRONG_PWD_REGEX.test(formData.password)) {
      await requestAlert('Invalid Password', 'Initial password must be at least 8 characters long and include an uppercase letter, a number, and a special character.');
      return;
    }
    if (formData.role !== 'viewer' && formData.role !== 'admin' && formData.role !== 'operator' && !formData.mlscnVerified) {
      const confirm = await requestConfirm("Missing MLSCN Verification", 'WARNING: You are creating a scientific user without verifying their MLSCN ID. They will be unable to approve clinical reports. Proceed anyway?', true);
      if (!confirm) return;
    }

    const res = await window.electron.ipcRenderer.invoke('users:create', formData);
    if (res.success) {
      setShowModal(false);
      setFormData({ fullName: '', username: '', password: '', role: 'scientist_l1', mlscnVerified: false });
      fetchUsers(); 
    } else {
      await requestAlert('Error', `Error creating user: ${res.error}`);
    }
  };

  const handleRemoveUser = async (targetId: string, name: string) => {
    const confirm = await requestConfirm("Revoke Access?", `Are you sure you want to revoke access for ${name}?`, true);
    if (!confirm) return;

    if (window.electron) {
      const res = await window.electron.ipcRenderer.invoke('users:remove', {
        targetUserId: targetId,
        currentUserId: currentUser?.id
      });
      if (res.success) {
        fetchUsers();
      } else {
        await requestAlert('Error', `Error removing user: ${res.error}`);
      }
    }
  };

  const handleResetPassword = async (targetId: string, name: string) => {
    const newPwd = await requestPrompt("Reset Password", `Enter new password for ${name}:`);
    if (!newPwd) return;
    if (window.electron) {
      const res = await window.electron.ipcRenderer.invoke('users:forcePasswordReset', { targetUserId: targetId, newPassword: newPwd });
      await requestAlert('Password Reset', res.success ? 'Password reset successfully.' : res.error);
    }
  };

  const handleReset2FA = async (targetId: string, name: string) => {
    const confirm = await requestConfirm("Reset 2FA?", `Reset 2FA for ${name}? They will need to enroll again.`, true);
    if (!confirm) return;
    if (window.electron) {
      const res = await window.electron.ipcRenderer.invoke('users:reset2FA', { targetUserId: targetId });
      await requestAlert('2FA Reset', res.success ? '2FA reset successfully.' : res.error);
      if (res.success) fetchUsers();
    }
  };

  const handleChangeRole = async (targetId: string, name: string, currentRole: string) => {
    const newRole = await requestPrompt("Change Role", `Enter new role for ${name} (admin, pathologist, scientist_l2, scientist_l1, operator, viewer):`, currentRole);
    if (!newRole || newRole === currentRole) return;
    if (window.electron) {
      const res = await window.electron.ipcRenderer.invoke('users:updateRole', { targetUserId: targetId, newRole });
      if (res.success) fetchUsers();
      else await requestAlert('Error', res.error);
    }
  };

  // Helper to format raw DB roles into Professional Titles
  const formatRole = (role: string) => {
    if (!role) return 'Personnel';
    if (role === 'admin') return 'Administrator';
    if (role === 'pathologist') return 'Consultant Pathologist';
    if (role === 'scientist_l1') return 'Scientist L1';
    if (role === 'scientist_l2') return 'Senior Scientist L2';
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="h-full flex flex-col font-sans relative">
      <div className="mb-10 flex justify-between items-end animate-slide-up">
        <div>
          <h1 className="text-3xl font-extrabold text-app-text tracking-tight">Users</h1>
          <p className="text-base text-app-muted mt-1 font-medium">Manage lab personnel accounts.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl shadow-[0_8px_20px_rgba(5,150,105,0.25)] hover:bg-emerald-500 hover:shadow-[0_12px_24px_rgba(5,150,105,0.35)] hover:-translate-y-0.5 transition-all duration-200">
          + Add User
        </button>
      </div>

      <div className="flex-1 bg-glass-panel backdrop-blur-3xl border border-glass-panelBorder rounded-[40px] shadow-[0_24px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {isLoading ? (
          <div className="p-16 text-center text-app-muted font-bold">Loading users...</div>
        ) : (
          <div className="overflow-x-auto flex-1 p-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-app-muted text-[10px] font-bold uppercase tracking-widest border-b border-slate-100/80">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50/80">
                {users.map((user, index) => (
                  <tr key={user.id} className="group hover:bg-glass-panel transition-colors duration-200 animate-slide-up" style={{ animationDelay: `${0.15 + (index * 0.05)}s` }}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform duration-300 ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-app-muted'}`}>
                          {user.fullName.charAt(0)}
                        </div>
                        <div className={`font-extrabold text-lg transition-colors ${user.isActive ? 'text-app-text group-hover:text-emerald-700' : 'text-app-muted line-through decoration-slate-300 decoration-2'}`}>
                          {user.fullName}
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-5 font-bold ${user.isActive ? 'text-app-muted' : 'text-slate-300'}`}>{user.username}</td>
                    <td className="px-6 py-5">
                      <span className={`px-4 py-1.5 text-xs font-extrabold tracking-wider uppercase rounded-lg border ${!user.isActive ? 'bg-slate-50 border-slate-200/60 text-app-muted' : user.role === 'admin' ? 'bg-indigo-50 border-indigo-200/60 text-indigo-700' : 'bg-emerald-50 border-emerald-200/60 text-emerald-700'}`}>
                        {formatRole(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        {user.isActive ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-app-muted bg-slate-100/80 px-3 py-1 rounded-full">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Enabled
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50/80 border border-red-100/60 px-3 py-1 rounded-full">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span> Revoked
                          </span>
                        )}
                        {currentUser?.id === user.id && (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300/60 px-2 py-0.5 rounded-md shadow-sm">You</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                      {currentUser?.role === 'admin' && user.isActive === 1 && (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleChangeRole(user.id, user.fullName, user.role)} className="p-2 text-app-muted hover:text-indigo-600 hover:bg-indigo-50/80 rounded-xl transition-colors" title="Change Role">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"/></svg>
                          </button>
                          <button onClick={() => handleResetPassword(user.id, user.fullName)} className="p-2 text-app-muted hover:text-amber-600 hover:bg-amber-50/80 rounded-xl transition-colors" title="Force Password Reset">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                          </button>
                          <button onClick={() => handleReset2FA(user.id, user.fullName)} className="p-2 text-app-muted hover:text-emerald-600 hover:bg-emerald-50/80 rounded-xl transition-colors" title="Reset 2FA">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                          </button>
                          {currentUser.id !== user.id && (
                            <button onClick={() => handleRemoveUser(user.id, user.fullName)} className="p-2 text-app-muted hover:text-red-600 hover:bg-red-50/80 rounded-xl transition-colors" title="Revoke Access">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="absolute inset-[-40px] animate-fade-in-blur flex items-center justify-center z-50 p-10 bg-slate-900/30 backdrop-blur-md">
          <div className="bg-glass-panel backdrop-blur-3xl p-10 rounded-[40px] w-full max-w-lg shadow-[0_24px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] border border-glass-panelBorder animate-slide-up relative overflow-hidden">
            <h2 className="text-3xl font-black text-app-text mb-2 relative z-10">Add User</h2>
            <p className="text-app-muted font-medium mb-8 relative z-10">Create a local account.</p>
            
            <form onSubmit={handleCreateUser} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-app-muted mb-2 uppercase tracking-widest">Full Name</label>
                <input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-4 text-base font-bold text-app-text bg-glass-input backdrop-blur-xl border border-slate-200/60 rounded-2xl outline-none focus:bg-white/70 focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)]" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-app-muted mb-2 uppercase tracking-widest">Username (MLSCN ID)</label>
                <input type="text" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full p-4 text-base font-bold text-app-text bg-glass-input backdrop-blur-xl border border-slate-200/60 rounded-2xl outline-none focus:bg-white/70 focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-app-muted mb-2 uppercase tracking-widest">Initial Password</label>
                  <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-4 text-base font-bold text-app-text bg-glass-input backdrop-blur-xl border border-slate-200/60 rounded-2xl outline-none focus:bg-white/70 focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)]" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-app-muted mb-2 uppercase tracking-widest">System Role</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-4 text-base font-bold text-app-text bg-glass-input backdrop-blur-xl border border-slate-200/60 rounded-2xl outline-none focus:bg-white/70 focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)]">
                    <option value="pathologist">Consultant Pathologist</option>
                    <option value="scientist_l2">Senior Scientist (L2)</option>
                    <option value="scientist_l1">Scientist (L1)</option>
                    <option value="operator">Operator</option>
                    <option value="viewer">Viewer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              {['pathologist', 'scientist_l1', 'scientist_l2'].includes(formData.role) && (
                <label className="flex items-start gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl cursor-pointer hover:bg-emerald-500/10 transition-colors">
                  <input type="checkbox" checked={formData.mlscnVerified} onChange={e => setFormData({...formData, mlscnVerified: e.target.checked})} className="mt-1 w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300" />
                  <div>
                    <div className="font-bold text-app-text text-sm">I have physically verified this user's MLSCN license</div>
                    <div className="text-xs text-app-muted font-medium mt-0.5">Required before this user can approve clinical reports per safety guidelines.</div>
                  </div>
                </label>
              )}
              
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 font-bold text-app-muted bg-glass-panel backdrop-blur-md border border-white/80 rounded-2xl hover:bg-white transition-all duration-200">Cancel</button>
                <button type="submit" className="flex-[2] py-4 font-extrabold text-white bg-emerald-600 rounded-2xl shadow-[0_8px_20px_rgba(5,150,105,0.25)] hover:bg-emerald-500 hover:shadow-[0_12px_24px_rgba(5,150,105,0.35)] hover:-translate-y-0.5 transition-all duration-200">Add User</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal {...confirmState} />
    </div>
  );
}
