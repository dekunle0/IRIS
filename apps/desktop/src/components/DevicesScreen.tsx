import { useEffect, useState } from 'react';
import { ConfirmModal } from './ConfirmModal';

export function DevicesScreen({ currentUser }: { currentUser: any }) {
  const [devices, setDevices] = useState<any[]>([]);
  const [serialNumber, setSerialNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPairing, setIsPairing] = useState(false);
  const [error, setError] = useState('');
  const canManageDevices = currentUser?.role !== 'viewer';
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', isDestructive: false, isAlert: false, onConfirm: () => {}, onCancel: () => {} });

  const requestConfirm = (title: string, message: string, isDestructive = false): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true, title, message, isDestructive, isAlert: false,
        onConfirm: () => { setConfirmState(prev => ({ ...prev, isOpen: false })); resolve(true); },
        onCancel: () => { setConfirmState(prev => ({ ...prev, isOpen: false })); resolve(false); }
      });
    });
  };

  const requestAlert = (title: string, message: string): Promise<void> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true, title, message, isDestructive: false, isAlert: true,
        onConfirm: () => { setConfirmState(prev => ({ ...prev, isOpen: false })); resolve(); },
        onCancel: () => { setConfirmState(prev => ({ ...prev, isOpen: false })); resolve(); }
      });
    });
  };

  const loadDevices = async () => {
    setIsLoading(true);
    const response = await window.electron?.ipcRenderer.invoke('devices:getAll');
    if (response?.success) setDevices(response.data);
    else setError(response?.error || 'Unable to load devices.');
    setIsLoading(false);
  };

  useEffect(() => { loadDevices(); }, []);

  const handlePair = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!serialNumber.trim()) return;
    setIsPairing(true);
    setError('');
    const response = await window.electron?.ipcRenderer.invoke('devices:pair', { serialNumber });
    if (response?.success) { setSerialNumber(''); await loadDevices(); }
    else setError(response?.error || 'Unable to pair device.');
    setIsPairing(false);
  };

  const handleUnpair = async (device: any) => {
    const confirm = await requestConfirm("Unpair Device?", `Are you sure you want to unpair ${device.serialNumber}?`, true);
    if (!confirm) return;
    const response = await window.electron?.ipcRenderer.invoke('devices:unpair', { deviceId: device.id });
    if (response?.success) await loadDevices();
    else setError(response?.error || 'Unable to unpair device.');
  };

  const handleFirmware = async (device: any) => {
    const response = await window.electron?.ipcRenderer.invoke('devices:selectFirmware', { deviceId: device.id });
    if (response?.success) await requestAlert('Success', response.message);
    else if (!response?.canceled) setError(response?.error || 'Unable to select firmware package.');
  };

  const [isDiscovering, setIsDiscovering] = useState(false);
  const handleDiscover = async () => {
    setIsDiscovering(true);
    setError('');
    const response = await window.electron?.ipcRenderer.invoke('devices:discover');
    if (response?.success) {
      await loadDevices();
    } else {
      setError(response?.error || 'Failed to discover devices.');
    }
    setIsDiscovering(false);
  };

  const isOld = (device: any) => !device.lastSeenAt || (Date.now() - new Date(device.lastSeenAt).getTime()) > 30 * 24 * 60 * 60 * 1000;

  return (
    <div className="max-w-7xl mx-auto w-full font-sans flex flex-col h-full">
      <div className="flex flex-wrap justify-between items-end gap-5 mb-10 animate-slide-up">
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold text-app-text tracking-tight">Connected microscopes</h1>
          <p className="text-base text-app-muted mt-1 font-medium">Manage connected hardware.</p>
        </div>
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          {canManageDevices && (
            <button 
              onClick={handleDiscover}
              disabled={isDiscovering}
              className="px-6 py-3 bg-indigo-600/10 text-indigo-700 font-bold rounded-2xl shadow-sm hover:bg-indigo-600/20 border border-indigo-600/20 transition-all duration-200"
            >
              {isDiscovering ? 'Scanning USB/WiFi...' : 'Discover Hardware'}
            </button>
          )}
          {canManageDevices && (
            <form onSubmit={handlePair} className="flex flex-wrap gap-3 w-full lg:w-auto">
              <input
                value={serialNumber}
                onChange={e => setSerialNumber(e.target.value)}
                placeholder="Device serial number"
                className="min-w-0 flex-1 lg:w-64 px-5 py-3 bg-glass-input backdrop-blur-xl border border-slate-200/60 text-app-text font-bold rounded-2xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)] outline-none focus:bg-white/70 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400/50 transition-all placeholder-slate-400"
            />
            <button
              disabled={isPairing}
              className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl shadow-[0_8px_20px_rgba(5,150,105,0.25)] hover:bg-emerald-500 hover:shadow-[0_12px_24px_rgba(5,150,105,0.35)] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isPairing ? 'Connecting...' : 'Connect'}
            </button>
          </form>
        )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50/80 backdrop-blur-sm border border-red-200/60 text-red-700 font-bold flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="p-16 text-center text-app-muted font-bold">Loading microscopes...</div>
      ) : devices.length === 0 ? (
        <div className="p-16 text-center bg-glass-panel backdrop-blur-3xl border border-glass-panelBorder rounded-[40px] shadow-[0_24px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] text-app-muted font-bold">
          No microscopes are connected.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {devices.map((device, index) => {
            const notSeenRecently = isOld(device);
            return (
              <div
                key={device.id}
                className="min-w-0 bg-glass-panel backdrop-blur-3xl border border-slate-200/60 rounded-[28px] p-6 2xl:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] flex flex-wrap gap-6 items-center justify-between animate-slide-up"
                style={{ animationDelay: `${0.1 + (index * 0.05)}s` }}
              >
                <div className="flex items-center gap-5 min-w-0">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border backdrop-blur-sm ${notSeenRecently ? 'bg-slate-50/80 border-slate-200/60' : 'bg-emerald-50/80 border-emerald-200/60'}`}>
                    <svg className={`w-8 h-8 ${notSeenRecently ? 'text-app-muted' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      <h2 className="text-2xl font-black text-app-text break-all">{device.serialNumber}</h2>
                      <span className={`px-3 py-1 text-xs font-extrabold rounded-lg uppercase tracking-wider ${notSeenRecently ? 'bg-amber-50 text-amber-700 border border-amber-200/60' : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'}`}>
                        {notSeenRecently ? 'Not connected' : 'Connected'}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-app-muted">Firmware: {device.firmwareVersion || 'Unknown'} &bull; Last seen: {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : 'Never'} &bull; Last paired: {device.lastPairedAt ? new Date(device.lastPairedAt).toLocaleString() : 'Never'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-app-muted uppercase tracking-wider text-[10px]">Battery</span>
                    <span className="font-black text-lg text-app-text">{device.batteryPct == null ? '—' : `${device.batteryPct}%`}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-app-muted uppercase tracking-wider text-[10px]">Storage</span>
                    <span className="font-black text-lg text-app-text">{device.storageUsedGb == null ? '—' : `${device.storageUsedGb.toFixed(1)} / ${device.storageTotalGb} GB`}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-app-muted uppercase tracking-wider text-[10px]">Calibration due</span>
                    <span className="font-black text-lg text-app-text">{device.calibrationDueAt ? new Date(device.calibrationDueAt).toLocaleDateString() : 'Not set'}</span>
                  </div>
                  {canManageDevices && (
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => handleFirmware(device)} className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-slate-200/60 text-app-muted font-bold rounded-xl hover:bg-white hover:shadow-sm transition-all duration-200 text-sm">Firmware</button>
                      <button onClick={() => handleUnpair(device)} className="px-4 py-2 bg-red-50/80 backdrop-blur-sm border border-red-200/60 text-red-700 font-bold rounded-xl hover:bg-red-50 transition-all duration-200 text-sm">Unpair</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ConfirmModal {...confirmState} />
    </div>
  );
}
