import { useState, useEffect } from 'react';

export function DevicesScreen() {
  const [devices, setDevices] = useState<any[]>([]);

  useEffect(() => {
    // Simulated local database fetch for testing
    setDevices([
      {
        id: 'dev-1',
        serialNumber: 'IRIS-HW-9021',
        firmwareVersion: 'v1.1.0',
        lastPairedAt: new Date().toISOString(),
        batteryPct: 85,
        storageUsedGb: 12.4,
        storageTotalGb: 64.0,
        calibrationDueAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'dev-2',
        serialNumber: 'IRIS-HW-7734',
        firmwareVersion: 'v1.0.2',
        lastPairedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days ago
        batteryPct: 0,
        storageUsedGb: 45.1,
        storageTotalGb: 64.0,
        calibrationDueAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ]);
  }, []);

  const handlePair = () => alert("Initiating local device discovery (USB-C / Wi-Fi Direct / Bluetooth)...");
  const handleFirmware = () => alert("Opening native file picker to select a signed firmware package (.bin)...");

  const isOld = (dateString: string) => {
    return (Date.now() - new Date(dateString).getTime()) > 30 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="max-w-7xl mx-auto w-full font-sans flex flex-col h-full">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Paired Devices</h1>
          <p className="text-lg text-slate-500 mt-2 font-medium">Manage IRIS eyepiece hardware linked to this workstation.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={handleFirmware} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors">
            Push Firmware Update
          </button>
          <button onClick={handlePair} className="px-6 py-3 bg-[#059669] text-white font-bold rounded-xl shadow-sm hover:bg-[#047857] transition-colors">
            Pair New Device
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {devices.map((device) => {
          const notSeenRecently = isOld(device.lastPairedAt);
          return (
            <div key={device.id} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${notSeenRecently ? 'bg-slate-50 border-slate-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <svg className={`w-8 h-8 ${notSeenRecently ? 'text-slate-400' : 'text-[#059669]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-black text-slate-800">{device.serialNumber}</h2>
                    {notSeenRecently && (
                      <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-extrabold rounded-lg uppercase tracking-wider">
                        Not Seen Recently
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-slate-400">Firmware: {device.firmwareVersion} • Last paired: {new Date(device.lastPairedAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex gap-10 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-xs">Battery</span>
                  <span className={`font-black text-lg ${device.batteryPct > 20 ? 'text-slate-800' : 'text-red-600'}`}>{device.batteryPct}%</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-xs">Storage</span>
                  <span className="font-black text-lg text-slate-800">{device.storageUsedGb.toFixed(1)} <span className="text-slate-400 text-sm">/ {device.storageTotalGb} GB</span></span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-xs">Calibration Due</span>
                  <span className="font-black text-lg text-slate-800">{new Date(device.calibrationDueAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}