"use client";

import { useEffect, useState } from 'react';
import { Download, Monitor, Apple, Terminal, ChevronDown, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function DownloadsPage() {
  const [activeTab, setActiveTab] = useState<'windows' | 'mac' | 'linux'>('windows');
  const [releaseData, setReleaseData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('mac')) setActiveTab('mac');
    else if (ua.includes('linux')) setActiveTab('linux');
    else setActiveTab('windows');

    fetch('/api/releases').then(res => res.json()).then(setReleaseData);
  }, []);

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!releaseData) return <div className="min-h-screen flex items-center justify-center text-emerald-700 font-bold">Loading releases...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <div className="bg-[#030712] text-white pt-24 pb-16 px-6 text-center border-b-4 border-[#059669]">
        <h1 className="text-5xl font-black tracking-tight mb-4">Download IRIS Desktop</h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          The complete, standalone clinical workstation. Operates entirely offline. No cloud dependency.
        </p>
        <div className="mt-8 flex items-center justify-center gap-2 text-sm font-bold bg-[#059669]/20 text-[#34D399] w-max mx-auto px-4 py-2 rounded-full border border-[#059669]/30">
          <ShieldCheck className="w-4 h-4" /> Version {releaseData.version} • Released {releaseData.release_date}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-8 relative z-10">
        <div className="flex bg-white rounded-2xl shadow-sm p-2 mb-8 border border-slate-200">
          {[
            { id: 'windows', icon: Monitor, label: 'Windows' },
            { id: 'mac', icon: Apple, label: 'macOS' },
            { id: 'linux', icon: Terminal, label: 'Linux' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'bg-[#059669] text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <tab.icon className="w-5 h-5" /> {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-3xl p-10 shadow-lg shadow-emerald-900/5 border border-slate-200 mb-8">
          {activeTab === 'windows' && (
            <div>
              <h2 className="text-2xl font-black mb-2">Windows 10 / 11 (64-bit)</h2>
              <p className="text-slate-500 mb-8 font-medium">Standard executable installer for clinical workstations.</p>
              <button className="w-full flex items-center justify-center gap-3 bg-[#059669] hover:bg-[#047857] text-white py-5 rounded-2xl font-extrabold text-xl transition-all shadow-[0_8px_20px_rgba(5,150,105,0.25)] hover:-translate-y-1">
                <Download className="w-6 h-6" /> Download for Windows
              </button>
              <div className="mt-6 flex flex-col items-center gap-2 text-sm">
                <span className="text-slate-500 font-semibold">{releaseData.builds.windows.filename} • {releaseData.builds.windows.size_mb} MB</span>
                <button onClick={() => handleCopy(releaseData.builds.windows.sha256)} className="text-slate-400 hover:text-[#059669] font-mono flex items-center gap-1">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-[#059669]" /> : 'SHA-256:'} {releaseData.builds.windows.sha256.substring(0, 16)}... (click to copy)
                </button>
              </div>
            </div>
          )}

          {activeTab === 'mac' && (
            <div>
              <h2 className="text-2xl font-black mb-2">macOS Monterey 12+</h2>
              <p className="text-slate-500 mb-8 font-medium">Universal DMG for Apple Silicon (M1/M2/M3) and Intel Macs.</p>
              <button className="w-full flex items-center justify-center gap-3 bg-[#059669] hover:bg-[#047857] text-white py-5 rounded-2xl font-extrabold text-xl transition-all shadow-[0_8px_20px_rgba(5,150,105,0.25)] hover:-translate-y-1">
                <Download className="w-6 h-6" /> Download for macOS
              </button>
              <div className="mt-6 flex flex-col items-center gap-2 text-sm">
                <span className="text-slate-500 font-semibold">{releaseData.builds.mac.filename} • {releaseData.builds.mac.size_mb} MB</span>
              </div>
            </div>
          )}

          {activeTab === 'linux' && (
            <div>
              <h2 className="text-2xl font-black mb-2">Linux Distributions</h2>
              <p className="text-slate-500 mb-8 font-medium">Supported on Ubuntu 20.04+, Debian 11+, and Fedora 36+.</p>
              <div className="grid grid-cols-2 gap-4">
                {releaseData.builds.linux.map((build: any) => (
                  <button key={build.type} className="flex flex-col items-center justify-center p-6 border-2 border-[#059669]/20 rounded-2xl hover:bg-[#ecfdf5] hover:border-[#059669] transition-all group">
                    <span className="text-xl font-extrabold text-[#047857] group-hover:text-[#064E3B]">.{build.type}</span>
                    <span className="text-sm font-semibold text-slate-500 mt-2">{build.size_mb} MB</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <details className="bg-white rounded-2xl shadow-sm border border-slate-200 group overflow-hidden">
            <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-bold text-lg text-slate-800">
              System Requirements
              <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="p-6 pt-0 border-t border-slate-100 bg-slate-50 text-slate-600 font-medium">
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Processor:</strong> Intel Core i5 / AMD Ryzen 5 or equivalent</li>
                <li><strong>Memory:</strong> 8GB RAM minimum (16GB recommended)</li>
                <li><strong>Storage:</strong> 256GB SSD (500GB+ recommended for local video retention)</li>
                <li><strong>Network:</strong> Local Wi-Fi or Ethernet adapter for device pairing and LIS sync. Internet connection is NOT required for operation.</li>
              </ul>
            </div>
          </details>

          <details className="bg-white rounded-2xl shadow-sm border border-slate-200 group overflow-hidden" open>
            <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-bold text-lg text-slate-800">
              Release Notes
              <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="p-6 pt-0 border-t border-slate-100 bg-slate-50">
              <div className="space-y-6">
                {releaseData.release_notes.map((rn: any) => (
                  <div key={rn.version}>
                    <h4 className="font-extrabold text-[#059669] mb-1">Version {rn.version}</h4>
                    <p className="text-slate-600 font-medium text-sm leading-relaxed">{rn.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}