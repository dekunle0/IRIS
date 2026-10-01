import { useEffect, useRef, useState, useMemo } from 'react';
import { DotLoader } from './DotLoader';
import { CircularTelemetryQueue } from '../utils/algorithms';

export function CaptureScreen({ currentUser }: { currentUser?: any }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [deviceStatus, setDeviceStatus] = useState({ connected: false, battery: 0, storageGb: 0 });
  const [focusScore, setFocusScore] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const [aiStage, setAiStage] = useState<string | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [globalError, setGlobalError] = useState<string>('');

  const focusSmoother = useMemo(() => new CircularTelemetryQueue(10), []);

  useEffect(() => {
    const fetchWorklist = async () => {
      if (window.electron) {
        const res = await window.electron.ipcRenderer.invoke('worklist:getPending');
        if (res.success) {
          const pending = res.data;
          setPendingRequests(pending);
          if (pending.length > 0) {
            setSelectedRequestId(pending[0].requestId);
            setSearchQuery(pending[0].patientCode + ' - ' + pending[0].patientName);
          }
        }
      }
    };
    fetchWorklist();
  }, []);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const captureInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const getFocusColorClass = () => {
    if (focusScore < 40) return 'border-red-500';
    if (focusScore <= 75) return 'border-amber-500';
    return 'border-emerald-500 shadow-[0_0_30px_rgba(5,150,105,0.4)]'; 
  };

  const connectMockDevice = async () => {
    setGlobalError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setDeviceStatus({ connected: true, battery: 85, storageGb: 42 });
      setFocusScore(0);
      
      // Real time blur detection (focus score proxy)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        captureInterval.current = setInterval(() => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Compute Tenengrad sharpness (gradient magnitude) on luma channel
          const data = imageData.data;
          const width = canvas.width;
          const height = canvas.height;
          let totalGradient = 0;
          let count = 0;
          
          // Fast luma approximation and gradient calculation, skipping edges
          for (let y = 1; y < height - 1; y += 2) {
            for (let x = 1; x < width - 1; x += 2) {
              const i = (y * width + x) * 4;
              const lumaC = data[i]*0.299 + data[i+1]*0.587 + data[i+2]*0.114;
              const lumaR = data[i+4]*0.299 + data[i+5]*0.587 + data[i+6]*0.114;
              const lumaB = data[i+width*4]*0.299 + data[i+width*4+1]*0.587 + data[i+width*4+2]*0.114;
              
              const dx = lumaR - lumaC;
              const dy = lumaB - lumaC;
              const gradSquared = dx*dx + dy*dy;
              
              // Only count significant edges to avoid noise inflating the score
              if (gradSquared > 100) {
                totalGradient += gradSquared;
              }
              count++;
            }
          }
          
          // Average gradient energy
          const avgGradient = totalGradient / Math.max(1, count);
          
          // Map to 0-100 using a calibrated curve. 
          // An average webcam might peak around 1500-2500 on sharp edges.
          // We use an asymptotic curve so it approaches 100 smoothly.
          const maxExpectedGradient = 2500;
          const rawScore = Math.min(100, Math.max(0, (avgGradient / maxExpectedGradient) * 100));
          setFocusScore(focusSmoother.enqueue(rawScore));
        }, 500);
      }
    } catch (err) {
      setGlobalError("Hardware connection failed: Camera access denied or device unavailable.");
    }
  };

  const disconnectDevice = () => {
    if (captureInterval.current) {
      clearInterval(captureInterval.current);
      captureInterval.current = null;
    }
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setDeviceStatus({ connected: false, battery: 0, storageGb: 0 });
    setFocusScore(0);
    setIsRecording(false);
    setRecordingTime(0);
    setAiStage(null);
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => disconnectDevice();
  }, []);

  useEffect(() => {
    if (focusScore > 75 && deviceStatus.connected && !isRecording && !aiStage && !analysisComplete) {
      // Auto-trigger recording when focus crosses threshold
      if (videoRef.current && videoRef.current.srcObject) {
        setIsRecording(true);
        recordedChunks.current = [];
        const stream = videoRef.current.srcObject as MediaStream;
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        mediaRecorder.current = recorder;
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) recordedChunks.current.push(e.data);
        };
        recorder.start();
      }
    }
  }, [focusScore, deviceStatus.connected, isRecording, aiStage]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRecording) {
      interval = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startAiPipeline = async (videoPath: string) => {
    setGlobalError('');
    if (!selectedRequestId) {
      setGlobalError('Please select a patient test first.');
      return;
    }

    setAiStage("Analyzing slide...");
    setAnalysisComplete(false);

    try {
      if (window.electron) {
        const selectedReq = pendingRequests.find(r => r.requestId === selectedRequestId);
        
        let ageInYears: number | undefined = undefined;
        if (selectedReq?.patientDob) {
          const diffDays = Math.floor((Date.now() - new Date(selectedReq.patientDob).getTime()) / (1000 * 60 * 60 * 24));
          ageInYears = Math.floor(diffDays / 365);
        }
        
        const response = await window.electron.ipcRenderer.invoke('ai:analyze', {
          testRequestId: selectedRequestId,
          videoPath: videoPath,
          testType: selectedReq?.testName || 'Malaria Parasite',
          patientContext: { age: ageInYears, gender: selectedReq?.patientGender || 'Unknown' },
          userId: currentUser?.id
        });

        if (response.success) {
          setAnalysisComplete(true);
        } else {
          setGlobalError(`Analysis failed: ${response.error}`);
        }
      }
    } catch (err) {
      setGlobalError("System encountered an error communicating with the analysis engine.");
    } finally {
      setAiStage(null);
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
        const arrayBuffer = await blob.arrayBuffer();
        if (window.electron) {
          const res = await window.electron.ipcRenderer.invoke('ai:saveLiveCapture', arrayBuffer);
          if (res.success) {
            startAiPipeline(res.filePath);
          } else {
            setGlobalError('Failed to save captured video.');
          }
        }
      };
      mediaRecorder.current.stop();
    }
  };

  const handleManualUpload = async () => {
    setGlobalError('');
    if (window.electron) {
      const filePath = await window.electron.ipcRenderer.invoke('dialog:openVideo');
      if (filePath) startAiPipeline(filePath);
    }
  };

  const blurAmount = Math.max(0, (80 - focusScore) / 8);

  const filteredRequests = pendingRequests.filter(req => 
    req.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (req.patientCode && req.patientCode.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 50);

  return (
    <div className="h-full flex flex-col font-sans relative pb-10">
      <div className="flex justify-between items-end mb-8 animate-slide-up">
        <div>
          <h1 className="text-3xl font-extrabold text-app-text tracking-tight">Microscope feed</h1>
          <p className="text-base text-app-muted mt-1 font-medium">Capture slide images and analyze.</p>
        </div>

        <div className="flex gap-6 items-center bg-white px-6 py-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <span className={`h-4 w-4 rounded-full shadow-inner ${deviceStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
            <span className="text-base font-bold text-app-text">{deviceStatus.connected ? 'System Camera (Mock Mode)' : 'No Hardware Detected'}</span>
          </div>
          {deviceStatus.connected && (
            <button onClick={disconnectDevice} className="ml-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold rounded-xl transition-colors border border-red-100">
              Disconnect
            </button>
          )}
        </div>
      </div>

      {globalError && (
        <div className="mb-6 p-5 bg-red-50/90 backdrop-blur-md border border-red-200 text-red-800 rounded-2xl text-sm font-bold flex items-center gap-3 shadow-sm animate-slide-up">
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
          {globalError}
        </div>
      )}

      <div className="grid grid-cols-12 gap-8 mt-6">
        <div className="col-span-8 relative aspect-[16/9] bg-slate-900 rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.1)] border-4 border-slate-800 overflow-hidden flex items-center justify-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
          
          <video 
            ref={videoRef} 
            autoPlay playsInline muted 
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            style={{ opacity: deviceStatus.connected ? 1 : 0, filter: `blur(${blurAmount}px)`, transform: 'scale(1.05)' }}
          />
          
          {aiStage && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center z-30 animate-fade-in-blur">
              <DotLoader stage={aiStage} />
            </div>
          )}

          {analysisComplete && !aiStage && (
            <div className="absolute inset-0 bg-emerald-900/95 backdrop-blur-md flex flex-col items-center justify-center z-30 animate-fade-in-blur text-white p-10 text-center">
              <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h3 className="text-4xl font-black mb-2 tracking-tight">Analysis complete</h3>
              <p className="text-emerald-200 text-lg font-medium mb-10">Slide analyzed successfully.</p>
              <button onClick={() => { setAnalysisComplete(false); setFocusScore(0); }} className="px-10 py-5 bg-white text-emerald-900 font-extrabold text-lg rounded-2xl hover:bg-emerald-50 transition-all shadow-lg hover:-translate-y-1">
                Capture next slide
              </button>
            </div>
          )}

          {deviceStatus.connected && !aiStage && !analysisComplete && (
            <div className={`absolute inset-6 border-[6px] rounded-2xl transition-all duration-300 pointer-events-none z-20 ${getFocusColorClass()}`}>
              <div className="absolute top-6 right-6 bg-slate-900/80 backdrop-blur-md text-white px-5 py-2.5 rounded-xl font-mono text-lg font-bold shadow-lg border border-slate-700">
                FOCUS: {focusScore}%
              </div>
              {isRecording && (
                <div className="absolute top-6 left-6 bg-red-600 text-white px-5 py-2.5 rounded-xl font-mono text-lg font-bold shadow-lg animate-pulse flex items-center gap-3">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                  REC {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}
                </div>
              )}
            </div>
          )}

          {!deviceStatus.connected && !aiStage && !analysisComplete && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-20 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4">
                <button onClick={connectMockDevice} className="px-10 py-5 bg-emerald-600 text-white text-lg font-black rounded-2xl hover:bg-emerald-500 shadow-[0_8px_20px_rgba(5,150,105,0.25)] transition-all hover:-translate-y-1">
                  Connect Camera (Mock Mode)
                </button>
                <p className="text-slate-400 font-medium text-sm">IRIS eyepiece hardware bridge is not yet implemented.</p>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-4 flex flex-col gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          
          <div className="relative z-50 bg-glass-panel p-8 rounded-[40px] border border-glass-panelBorder shadow-[0_24px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] flex flex-col gap-5 isolation-auto" style={{ transform: "translateZ(100px)" }}>
            <h3 className="text-xl font-black text-app-text border-b border-slate-200/50 pb-4 tracking-tight">Select patient</h3>
            
            {pendingRequests.length === 0 ? (
              <div className="p-5 bg-amber-50/80 backdrop-blur-md border border-amber-200/60 text-amber-800 rounded-2xl text-sm font-bold leading-relaxed">
                Worklist is currently empty. Please register a patient first.
              </div>
            ) : (
              <div className="relative group">
                <label className="block text-[11px] font-bold text-app-muted mb-2 uppercase tracking-widest ml-1">Search & Select Patient</label>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Type patient code or name..."
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
                    onFocus={() => setIsDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                    className="w-full pl-6 pr-12 py-4 text-base font-bold text-slate-800 bg-white/40 border border-white/60 rounded-full outline-none focus:ring-0 focus:outline-none focus:border-white transition-all placeholder:text-slate-500 shadow-[inset_0_2px_8px_rgba(255,255,255,0.3)] backdrop-blur-xl"
                  />
                  <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-slate-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  {isDropdownOpen && filteredRequests.length > 0 && (
                    <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white/90 backdrop-blur-3xl rounded-[24px] shadow-[0_24px_50px_rgba(0,0,0,0.15)] border border-white/60 overflow-hidden z-[9999]" style={{ transform: "translateZ(999px)", isolation: "isolate" }}>
                      <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {filteredRequests.map(req => (
                          <div 
                            key={req.requestId}
                            onClick={() => { 
                              setSelectedRequestId(req.requestId); 
                              setSearchQuery(req.patientCode + ' - ' + req.patientName); 
                              setIsDropdownOpen(false); 
                            }}
                            className="px-5 py-4 bg-transparent hover:bg-white rounded-[16px] cursor-pointer transition-colors border-b border-slate-100 last:border-0"
                          >
                            <div className="text-sm font-extrabold text-slate-800">{req.patientCode} - {req.patientName}</div>
                            <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{req.testName}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-glass-panel p-8 rounded-[40px] border border-glass-panelBorder shadow-[0_24px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] flex flex-col gap-6">
            <h3 className="text-xl font-black text-app-text border-b border-slate-200/50 pb-4 tracking-tight">Microscope feed</h3>
            
            {!isRecording ? (
              <button
                disabled={!deviceStatus.connected || focusScore < 76 || !!aiStage || !selectedRequestId}
                onClick={() => setIsRecording(true)}
                className={`w-full py-5 rounded-2xl font-black text-lg text-white transition-all ${
                  !deviceStatus.connected || focusScore < 76 || !!aiStage || !selectedRequestId
                    ? 'bg-slate-300/80 cursor-not-allowed text-app-muted'
                    : 'bg-emerald-600 shadow-[0_8px_20px_rgba(5,150,105,0.25)] hover:shadow-[0_12px_24px_rgba(5,150,105,0.35)] hover:bg-emerald-500 hover:-translate-y-1'
                }`}
              >
                Start capture
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="w-full py-5 rounded-2xl font-black text-lg text-white bg-red-600 hover:bg-red-500 animate-pulse shadow-[0_8px_20px_rgba(220,38,38,0.3)] hover:-translate-y-1 transition-all"
              >
                Stop & Analyze
              </button>
            )}
          </div>

          <div className="bg-glass-panel p-8 rounded-[40px] border border-glass-panelBorder shadow-[0_24px_60px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)]">
            <h3 className="text-xl font-black text-app-text border-b border-slate-200/50 pb-4 mb-6 tracking-tight">Import video file</h3>
            <button 
              onClick={handleManualUpload}
              disabled={!!aiStage || !selectedRequestId}
              className="w-full py-5 border-2 border-dashed border-emerald-500/40 text-emerald-600 font-extrabold text-lg rounded-2xl hover:bg-white hover:border-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select file
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}