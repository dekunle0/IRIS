import { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignaturePad = SignatureCanvas as any;

export function PatientRegistration() {
  const sigPad = useRef<SignatureCanvas>(null);
  const [formData, setFormData] = useState({ fullName: '', dob: '', gender: '', phone: '', nin: '' });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sigPad.current?.isEmpty()) {
      alert("Please capture the patient's signature for NDPR consent.");
      return;
    }
    const signatureData = sigPad.current?.getCanvas().toDataURL('image/png');
    
    try {
      if (window.electron) {
        const response = await window.electron.ipcRenderer.invoke('patients:create', { ...formData, signatureData });
        if (response.success) {
          alert(`Patient ${formData.fullName} registered! ID: ${response.data.patientCode}`);
          setFormData({ fullName: '', dob: '', gender: '', phone: '', nin: '' });
          sigPad.current?.clear();
        } else {
          alert("Error saving patient to database.");
        }
      } else {
        alert(`[Browser Mode] Simulated save for ${formData.fullName}`);
        setFormData({ fullName: '', dob: '', gender: '', phone: '', nin: '' });
        sigPad.current?.clear();
      }
    } catch (error) {
      alert("Failed to communicate with the local database.");
    }
  };

  return (
    <div className="w-full font-sans">
      <div className="mb-10">
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Register Patient</h2>
      </div>
      
      <div className="bg-white p-10 rounded-[32px] shadow-sm border border-slate-200">
        <form onSubmit={handleRegister} className="flex flex-col gap-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Full Name</label>
              <input 
                type="text" required 
                value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} 
                className="w-full p-5 text-lg font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-[20px] focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Date of Birth</label>
              <input 
                type="date" required 
                value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})}
                className="w-full p-5 text-lg font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-[20px] focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Gender</label>
              <select 
                required value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}
                className="w-full p-5 text-lg font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-[20px] focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm"
              >
                <option value="" disabled>Select Gender...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Phone Number</label>
              <input 
                type="tel" required 
                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full p-5 text-lg font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-[20px] focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm"
                placeholder="080..."
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">NIN (Encrypted at Rest)</label>
              <input 
                type="text" 
                value={formData.nin} onChange={e => setFormData({...formData, nin: e.target.value})}
                className="w-full p-5 text-lg font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-[20px] focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="mt-4 pt-8 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest">NDPR Consent Signature</label>
            <div className="bg-slate-50 border border-slate-200 rounded-[24px] overflow-hidden focus-within:bg-white focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all p-2 shadow-sm">
              <SignaturePad 
                ref={sigPad} 
                canvasProps={{ className: 'w-full h-40 cursor-crosshair rounded-[16px]' }} 
              />
            </div>
            <div className="flex justify-end mt-3">
              <button 
                type="button" 
                onClick={() => sigPad.current?.clear()}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                Clear Signature
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full mt-2 py-6 bg-primary text-white text-xl font-extrabold rounded-[24px] shadow-md hover:bg-primary-dark hover:-translate-y-0.5 transition-all"
          >
            Create Record
          </button>
        </form>
      </div>
    </div>
  );
}