import { useState } from 'react';

export function SettingsScreen() {
  const [lisNetworkMode, setLisNetworkMode] = useState(false);

  const toggleLis = () => {
    if (!lisNetworkMode) {
      const confirm = window.confirm("WARNING: Enabling LIS-network mode exposes the local API beyond localhost to your hospital's LAN. Ensure you are on a trusted network.");
      if (confirm) setLisNetworkMode(true);
    } else {
      setLisNetworkMode(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full font-sans pb-20">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">System Settings</h1>
        <p className="text-lg text-slate-500 mt-2 font-medium">Workstation, institutional, and connectivity configuration.</p>
      </div>

      <div className="space-y-8">
        {/* Licence Section */}
        <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-extrabold text-slate-800 mb-6 border-b border-slate-100 pb-4">Licence Status</h2>
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-black text-primary-dark">Professional Tier</span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-lg uppercase tracking-wider border border-emerald-200">Active</span>
              </div>
              <p className="text-sm font-bold text-slate-500">Expires: December 31, 2027</p>
            </div>
            <button className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">Update Licence</button>
          </div>
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-800 text-sm font-semibold">
            An expired licence restricts new analyses only; all existing records remain accessible.
          </div>
        </section>

        {/* Sync & Backup */}
        <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-extrabold text-slate-800 mb-6 border-b border-slate-100 pb-4">Offline Backup & Sync</h2>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Encrypted Local Backup</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">Target: /Volumes/IRIS_BACKUP_DRIVE (Last successful: 2 hours ago)</p>
            </div>
            <button className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">Configure</button>
          </div>
        </section>

        {/* LIS Integration */}
        <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-extrabold text-slate-800 mb-6 border-b border-slate-100 pb-4">LIS Integration (REST API)</h2>
          
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Local Network Mode</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">Allow LIS connections from the hospital LAN (Default: Localhost only)</p>
            </div>
            <button 
              onClick={toggleLis}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${lisNetworkMode ? 'bg-[#059669]' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${lisNetworkMode ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 mb-3">Active API Tokens</h3>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center">
              <span className="font-mono text-sm text-slate-600 font-bold">local-dev-token-***</span>
              <button className="text-error text-sm font-bold hover:underline">Revoke</button>
            </div>
            <button className="mt-4 text-[#059669] text-sm font-bold hover:underline">+ Generate New Token</button>
          </div>
        </section>

        {/* Connected Features */}
        <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-extrabold text-slate-800 mb-2">Connected Features</h2>
          <p className="text-sm font-medium text-slate-500 mb-6 border-b border-slate-100 pb-4">
            These features require an active internet connection. IRIS is fully functional without them.
          </p>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800">Email & SMS Delivery</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Distribute approved results via external gateways.</p>
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-extrabold rounded-lg uppercase">OFF (Default)</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}