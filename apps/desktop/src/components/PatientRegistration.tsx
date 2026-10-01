import { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignaturePad = SignatureCanvas as any;

// Premium Inline Error Component
const ErrorMessage = ({ message }: { message?: string }) => {
  if (!message) return null;
  return (
    <div className="mt-3 p-3.5 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl flex items-center gap-2.5 animate-slide-up">
      <svg className="w-5 h-5 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {message}
    </div>
  );
};

export function PatientRegistration({ currentUser }: { currentUser?: any }) {
  const sigPad = useRef<SignatureCanvas>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({ 
    surname: '', firstName: '', otherNames: '', 
    dob: '', gender: '', phone: '', nin: '' 
  });
  
  const [registeredPatient, setRegisteredPatient] = useState<{name: string, code: string} | null>(null);
  const [copied, setCopied] = useState(false);
  
  // NEW: State object to hold all field-specific errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCopy = async () => {
    if (registeredPatient) {
      try {
        if (window.electron) {
          await window.electron.ipcRenderer.invoke('clipboard:write', registeredPatient.code);
        } else {
          await navigator.clipboard.writeText(registeredPatient.code);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy', err);
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrors({}); // Clear previous errors
    
    const newErrors: Record<string, string> = {};
    
    // 1. Validate Names
    const nameRegex = /^[\p{L}\s\-']+$/u;
    if (!nameRegex.test(formData.surname.trim()) || formData.surname.trim().length < 2) {
      newErrors.surname = "Please enter a valid Surname (minimum 2 characters).";
    }
    if (!nameRegex.test(formData.firstName.trim()) || formData.firstName.trim().length < 2) {
      newErrors.firstName = "Please enter a valid First Name (minimum 2 characters).";
    }
    if (formData.otherNames.trim() && !nameRegex.test(formData.otherNames.trim())) {
      newErrors.otherNames = "Please enter valid Other Names.";
    }
    
    // 2. Validate DOB (DD/MM/YYYY)
    let parsedDate: Date | null = null;
    const dobRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const dobMatch = formData.dob.trim().match(dobRegex);
    if (dobMatch) {
      const day = parseInt(dobMatch[1], 10);
      const month = parseInt(dobMatch[2], 10);
      const year = parseInt(dobMatch[3], 10);
      const tempDate = new Date(year, month - 1, day);
      if (tempDate.getFullYear() === year && tempDate.getMonth() === month - 1 && tempDate.getDate() === day) {
        parsedDate = tempDate;
      }
    }
    
    if (!parsedDate || parsedDate >= new Date()) {
      newErrors.dob = "Please enter a valid past date in DD/MM/YYYY format.";
    }
    
    // 3. Validate Phone
    const phoneRegex = /^0[789]\d{9}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = "Please enter a valid 11-digit Nigerian phone number (e.g. 08012345678).";
    }
    
    // 4. Validate NIN
    if (formData.nin && !/^\d{11}$/.test(formData.nin.trim())) {
      newErrors.nin = "NIN must be exactly 11 digits.";
    }
    
    // 5. Validate Signature
    if (sigPad.current?.isEmpty()) {
      newErrors.signature = "Please capture the patient's signature for NDPR consent.";
    }

    // If any local validation fails, stop submission and display inline errors
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const signatureDataUrl = sigPad.current?.getTrimmedCanvas().toDataURL('image/png');
      const fullName = [formData.surname, formData.firstName, formData.otherNames]
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .join(' ');
      
      const dobISO = parsedDate ? `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}` : '';

      if (window.electron) {
        const response = await window.electron.ipcRenderer.invoke('patients:create', {
          fullName,
          dob: dobISO,
          gender: formData.gender,
          phone: formData.phone.trim(),
          nin: formData.nin.trim(),
          signatureData: signatureDataUrl,
          userId: currentUser?.id
        });
        
        if (response.success) {
          setRegisteredPatient({ name: fullName, code: response.data.patientCode });
          setFormData({ surname: '', firstName: '', otherNames: '', dob: '', gender: '', phone: '', nin: '' });
          sigPad.current?.clear();
          setErrors({});
        } else {
          // Show database error inline
          setErrors({ global: response.error });
        }
      }
    } catch (error) {
      setErrors({ global: "Failed to communicate with local database." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registeredPatient) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-20 font-sans animate-slide-up">
        <div className="bg-glass-panel backdrop-blur-3xl p-12 rounded-[40px] shadow-[0_24px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] border border-glass-panelBorder text-center flex flex-col items-center">
          <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 border border-emerald-100">
            <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-3xl font-black text-app-text mb-2 tracking-tight">Registration complete</h2>
          <p className="text-app-muted font-medium mb-10 text-lg">Registered: {registeredPatient.name}</p>
          
          <div className="bg-glass-input backdrop-blur-xl border border-glass-inputBorder shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] p-6 rounded-2xl w-full mb-8 flex items-center justify-between shadow-inner">
            <div className="text-left">
              <div className="text-[11px] font-bold text-app-muted uppercase tracking-widest mb-1">Patient ID</div>
              <div className="text-3xl font-black text-app-text tracking-tight">{registeredPatient.code}</div>
            </div>
            <button 
              onClick={handleCopy} 
              className={`px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-all duration-300 ${copied ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-app-muted border border-slate-200 hover:bg-slate-100 hover:text-app-text'}`}
            >
              {copied ? 'ID Copied!' : 'Copy ID'}
              {!copied && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>}
            </button>
          </div>
          <button onClick={() => setRegisteredPatient(null)} className="text-emerald-600 font-bold hover:text-emerald-800 transition-colors">Register Another Patient</button>
        </div>
      </div>
    );
  }

  const isSurnameValid = formData.surname.trim().length >= 2;
  const isFirstNameValid = formData.firstName.trim().length >= 2;
  const isPhoneValid = /^0[789]\d{9}$/.test(formData.phone.replace(/\s/g, ''));

  return (
    <div className="h-full flex flex-col font-sans relative pb-10">
      <div className="max-w-5xl mx-auto w-full">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl font-extrabold text-app-text tracking-tight">Patient Registration</h1>
          <p className="text-base text-app-muted font-medium mt-1">Add a new patient to the system.</p>
        </div>

        <div className="w-full bg-glass-panel backdrop-blur-3xl p-10 rounded-[40px] shadow-[0_24px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] border border-glass-panelBorder animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={handleRegister} className="flex flex-col gap-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Surname */}
            <div className="relative group">
              <label className="block text-[11px] font-bold text-app-muted mb-2 uppercase tracking-widest ml-1">Surname</label>
              <div className="relative">
                <input 
                  type="text" 
                  required 
                  maxLength={50}
                  value={formData.surname} 
                  onChange={e => {
                    setFormData({...formData, surname: e.target.value});
                    if (errors.surname) setErrors({...errors, surname: ''});
                  }} 
                  className={`w-full px-5 py-4 text-base font-bold text-app-text bg-glass-input backdrop-blur-xl border rounded-2xl focus:bg-white/70 focus:ring-4 outline-none transition-all placeholder:text-app-muted shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)] ${errors.surname ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200/60 focus:border-emerald-400/50 focus:ring-emerald-500/10'}`} 
                  placeholder="e.g. Johnson"
                />
              </div>
              <ErrorMessage message={errors.surname} />
            </div>

            {/* First Name */}
            <div className="relative group">
              <label className="block text-[11px] font-bold text-app-muted mb-2 uppercase tracking-widest ml-1">First Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  required 
                  maxLength={50}
                  value={formData.firstName} 
                  onChange={e => {
                    setFormData({...formData, firstName: e.target.value});
                    if (errors.firstName) setErrors({...errors, firstName: ''});
                  }} 
                  className={`w-full px-5 py-4 text-base font-bold text-app-text bg-glass-input backdrop-blur-xl border rounded-2xl focus:bg-white/70 focus:ring-4 outline-none transition-all placeholder:text-app-muted shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)] ${errors.firstName ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200/60 focus:border-emerald-400/50 focus:ring-emerald-500/10'}`} 
                  placeholder="e.g. Adebayo"
                />
              </div>
              <ErrorMessage message={errors.firstName} />
            </div>

            {/* Other Names */}
            <div className="relative group">
              <label className="block text-[11px] font-bold text-app-muted mb-2 uppercase tracking-widest ml-1">Other Names (Optional)</label>
              <div className="relative">
                <input 
                  type="text" 
                  maxLength={50}
                  value={formData.otherNames} 
                  onChange={e => {
                    setFormData({...formData, otherNames: e.target.value});
                    if (errors.otherNames) setErrors({...errors, otherNames: ''});
                  }} 
                  className={`w-full px-5 py-4 text-base font-bold text-app-text bg-glass-input backdrop-blur-xl border rounded-2xl focus:bg-white/70 focus:ring-4 outline-none transition-all placeholder:text-app-muted shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)] ${errors.otherNames ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200/60 focus:border-emerald-400/50 focus:ring-emerald-500/10'}`} 
                  placeholder="e.g. Olusegun"
                />
              </div>
              <ErrorMessage message={errors.otherNames} />
            </div>

            {/* Date of Birth */}
            <div className="relative group">
              <label className="block text-[11px] font-bold text-app-muted mb-2 uppercase tracking-widest ml-1">Date of Birth</label>
              <div className="relative">
                <input 
                  type="text" 
                  required 
                  maxLength={10}
                  value={formData.dob} 
                  onChange={e => {
                    setFormData({...formData, dob: e.target.value});
                    if (errors.dob) setErrors({...errors, dob: ''});
                  }} 
                  className={`w-full pl-5 pr-12 py-4 text-base font-bold text-app-text bg-glass-input backdrop-blur-xl border rounded-2xl focus:bg-white/70 focus:ring-4 outline-none transition-all placeholder:text-app-muted shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)] ${errors.dob ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200/60 focus:border-emerald-400/50 focus:ring-emerald-500/10'}`} 
                  placeholder="DD/MM/YYYY"
                />
                <button 
                  type="button" 
                  onClick={() => dateInputRef.current?.showPicker()}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-app-muted hover:text-emerald-600 transition-colors drop-shadow-sm"
                  title="Choose from calendar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </button>
                <input 
                  type="date"
                  ref={dateInputRef}
                  className="absolute opacity-0 w-0 h-0 p-0 overflow-hidden pointer-events-none"
                  onChange={e => {
                    const dateStr = e.target.value;
                    if (dateStr) {
                      const [y, m, d] = dateStr.split('-');
                      setFormData({...formData, dob: `${d}/${m}/${y}`});
                      if (errors.dob) setErrors({...errors, dob: ''});
                    }
                  }}
                />
              </div>
              <ErrorMessage message={errors.dob} />
            </div>

            {/* Biological Gender */}
            <div className="relative group">
              <label className="block text-[11px] font-bold text-app-muted mb-2 uppercase tracking-widest ml-1">Sex</label>
              <select 
                required 
                value={formData.gender} 
                onChange={e => setFormData({...formData, gender: e.target.value})} 
                className="w-full px-5 py-4 text-base font-bold text-app-text bg-glass-input backdrop-blur-xl border border-slate-200/60 rounded-2xl focus:bg-white/70 focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all cursor-pointer shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)]"
              >
                <option value="" disabled>Select gender...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Contact Phone */}
            <div className="relative group">
              <label className="block text-[11px] font-bold text-app-muted mb-2 uppercase tracking-widest ml-1">Phone Number</label>
              <div className="relative">
                <input 
                  type="tel" 
                  required 
                  maxLength={15}
                  value={formData.phone} 
                  onChange={e => {
                    setFormData({...formData, phone: e.target.value});
                    if (errors.phone) setErrors({...errors, phone: ''});
                  }} 
                  className={`w-full pl-5 pr-12 py-4 text-base font-bold text-app-text bg-glass-input backdrop-blur-xl border rounded-2xl focus:bg-white/70 focus:ring-4 outline-none transition-all placeholder:text-app-muted shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)] ${errors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200/60 focus:border-emerald-400/50 focus:ring-emerald-500/10'}`} 
                  placeholder="080 1234 5678" 
                />
                {isPhoneValid && !errors.phone && (
                  <svg className="w-6 h-6 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none drop-shadow-sm" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#10B981" />
                    <path d="M8 12.5L10.5 15L16 9" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <ErrorMessage message={errors.phone} />
            </div>

            {/* NIN */}
            <div className="relative group">
              <label className="block text-[11px] font-bold text-app-muted mb-2 uppercase tracking-widest ml-1">NIN (Optional)</label>
              <input 
                type="text" 
                maxLength={11}
                value={formData.nin} 
                onChange={e => {
                  setFormData({...formData, nin: e.target.value});
                  if (errors.nin) setErrors({...errors, nin: ''});
                }} 
                className={`w-full px-5 py-4 text-base font-bold text-app-text bg-glass-input backdrop-blur-xl border rounded-2xl focus:bg-white/70 focus:ring-4 outline-none transition-all placeholder:text-app-muted shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)] ${errors.nin ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200/60 focus:border-emerald-400/50 focus:ring-emerald-500/10'}`} 
                placeholder="11-digit identity number" 
              />
              <ErrorMessage message={errors.nin} />
            </div>
          </div>

          <div className="mt-2 pt-8 border-t border-slate-200/50 grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            
            <div className="flex flex-col gap-4">
              <label className="block text-[11px] font-bold text-app-muted uppercase tracking-widest ml-1">Consent</label>
              
              <label className="relative flex items-start gap-4 cursor-pointer group p-5 bg-glass-input backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)] hover:bg-white/70 hover:border-emerald-300 transition-all h-40">
                <div className="relative flex items-center justify-center w-6 h-6 mt-0.5 rounded-lg border-2 border-slate-300 bg-white group-hover:border-emerald-500 transition-colors shrink-0">
                  <input type="checkbox" required className="peer sr-only" />
                  <svg className="w-4 h-4 text-emerald-600 scale-0 peer-checked:scale-100 transition-transform duration-200 ease-out" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-app-muted leading-relaxed">
                  I explicitly consent to the collection and storage of my biometric and clinical data in accordance with the NDPR.
                </span>
              </label>
            </div>

            {/* Signature Area */}
            <div>
              <div className="flex justify-between items-end mb-4">
                <label className="block text-[11px] font-bold text-app-muted uppercase tracking-widest ml-1">Digital Signature</label>
                <button type="button" onClick={() => sigPad.current?.clear()} className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800 uppercase tracking-wider transition-colors mr-1">
                  Clear Pad
                </button>
              </div>
              <div className={`bg-glass-input backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden focus-within:bg-white transition-all p-1 relative group h-40 ${errors.signature ? 'border-red-300 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/10 bg-red-50' : 'border-slate-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 shadow-inner'}`}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20 group-focus-within:opacity-0 transition-opacity flex flex-col items-center">
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  <span className="text-xs font-bold uppercase tracking-widest">Sign Here</span>
                </div>
                <SignaturePad 
                  ref={sigPad} 
                  onBegin={() => { if (errors.signature) setErrors({...errors, signature: ''}); }}
                  canvasProps={{ className: 'w-full h-full cursor-crosshair rounded-[16px] relative z-10' }} 
                />
              </div>
              <ErrorMessage message={errors.signature} />
            </div>

          </div>

          <ErrorMessage message={errors.global} />

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full py-5 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-black rounded-2xl shadow-[0_8px_20px_rgba(5,150,105,0.25)] hover:shadow-[0_12px_24px_rgba(5,150,105,0.35)] transition-all hover:-translate-y-1 active:scale-[0.98] ${isSubmitting ? 'opacity-75 cursor-not-allowed hover:-translate-y-0' : ''}`}
          >
            {isSubmitting ? 'Saving...' : 'Save Patient'}
          </button>

        </form>
      </div>
      </div>
    </div>
  );
}