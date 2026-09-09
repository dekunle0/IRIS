import { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

export function PatientRegistration() {
  const sigPad = useRef<SignatureCanvas>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    gender: '',
    phone: '',
    nin: '',
    hospitalNumber: ''
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure signature is captured per NDPA/NDPC requirements
    if (sigPad.current?.isEmpty()) {
      alert("Please capture the patient's signature for NDPR consent.");
      return;
    }

    const signatureData = sigPad.current?.getCanvas().toDataURL('image/png');
    
    try {
      // Check if we are running inside the actual Electron shell
      if (window.electron) {
        const response = await window.electron.ipcRenderer.invoke('patients:create', { 
          ...formData, 
          signatureData 
        });
        
        if (response.success) {
          alert(`Patient ${formData.fullName} registered! ID: ${response.data.patientCode}`);
          setFormData({ fullName: '', dob: '', gender: '', phone: '', nin: '', hospitalNumber: '' });
          sigPad.current?.clear();
        } else {
          alert("Error saving patient to database.");
        }
      } else {
        // Fallback for browser preview testing
        alert(`[Browser Mode] Simulated save for ${formData.fullName}`);
        setFormData({ fullName: '', dob: '', gender: '', phone: '', nin: '', hospitalNumber: '' });
        sigPad.current?.clear();
      }
    } catch (error) {
      alert("Failed to communicate with the local database.");
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui' }}>
      <h2>IRIS Offline Patient Registration</h2>
      <p style={{ color: '#059669' }}>Status: Local Storage Only (No Internet Required)</p>
      
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="text" placeholder="Full Name" required 
          value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} 
          style={{ padding: '8px' }}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="date" required 
            value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})}
            style={{ padding: '8px', flex: 1 }}
          />
          <select 
            required value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}
            style={{ padding: '8px', flex: 1 }}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        
        <input 
          type="text" placeholder="Phone Number" required 
          value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
          style={{ padding: '8px' }}
        />
        <input 
          type="text" placeholder="NIN (Optional - Will be Encrypted)" 
          value={formData.nin} onChange={e => setFormData({...formData, nin: e.target.value})}
          style={{ padding: '8px' }}
        />

        <div style={{ border: '1px solid #ccc', padding: '10px', marginTop: '10px' }}>
          <h4>NDPR Consent Signature</h4>
          <p style={{ fontSize: '12px', color: '#666' }}>
            I consent to the capture and local analysis of my specimen by the IRIS platform.
          </p>
          <div style={{ border: '1px dashed #059669', background: '#f9f9f9' }}>
            <SignatureCanvas 
              ref={sigPad} 
              canvasProps={{ width: 500, height: 150, className: 'sigCanvas' }} 
            />
          </div>
          <button type="button" onClick={() => sigPad.current?.clear()} style={{ marginTop: '5px' }}>
            Clear Signature
          </button>
        </div>

        <button type="submit" style={{ padding: '12px', background: '#059669', color: 'white', border: 'none', cursor: 'pointer' }}>
          Save Patient & Generate Local Barcode
        </button>
      </form>
    </div>
  );
}