import { useEffect, useRef, useState } from 'react';
import { DotLoader } from './DotLoader';

export function CaptureScreen() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [deviceStatus, setDeviceStatus] = useState({ connected: false, battery: 0, storageGb: 0 });
  const [focusScore, setFocusScore] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [aiStage, setAiStage] = useState<string | null>(null);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);

  // Playbook Requirement: Color states based on score
  const getFocusColorClass = () => {
    if (focusScore < 40) return 'border-error';
    if (focusScore <= 75) return 'border-warning';
    return 'border-[#059669] iris-focus-ring-green shadow-[0_0_30px_rgba(5,150,105,0.4)]'; 
  };

  const connectMockDevice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setDeviceStatus({ connected: true, battery: 85, storageGb: 42 });
      setFocusScore(15); 
      setHasAutoStarted(false);
    } catch (err) {
      alert("Hardware connection failed (webcam access denied).");
    }
  };

  const disconnectDevice = () => {
    // Properly release the webcam hardware
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    // Reset all states
    setDeviceStatus({ connected: false, battery: 0, storageGb: 0 });
    setFocusScore(0);
    setIsRecording(false);
    setRecordingTime(0);
    setHasAutoStarted(false);
    setAiStage(null);
  };

  // 1. Realistic Hardware Auto-Focus Simulator
  useEffect(() => {
    let focusTimeout: ReturnType<typeof setTimeout>;
    
    if (deviceStatus.connected && !isRecording && !aiStage && focusScore < 82) {
      focusTimeout = setTimeout(() => {
        setFocusScore(prev => {
          const jump = Math.random() > 0.15 ? Math.floor(Math.random() * 6) + 2 : -2;
          const next = Math.max(0, prev + jump);
          return next > 82 ? 82 : next; 
        });
      }, 350); 
    }
    
    return () => clearTimeout(focusTimeout);
  }, [deviceStatus.connected, isRecording, aiStage, focusScore]);

  // 2. Playbook Requirement: Auto-start capture when Green (>75%) is reached
  useEffect(() => {
    if (focusScore <= 75) {
      setHasAutoStarted(false);
    } else if (focusScore > 75 && deviceStatus.connected && !isRecording && !aiStage && !hasAutoStarted) {
      setIsRecording(true);
      setHasAutoStarted(true);
    }
  }, [focusScore, deviceStatus.connected, isRecording, aiStage, hasAutoStarted]);

  // 3. Handle the recording timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRecording) {
      interval = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    } else {
      setRecordingTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const startAiPipeline = async () => {
    const stages = [
      "Extracting frames",
      "Segmenting cells",
      "Classifying morphology",
      "Generating report"
    ];
    let currentStage = 0;
    
    setAiStage(stages[currentStage]);
    const loaderInterval = setInterval(() => {
      currentStage = Math.min(currentStage + 1, stages.length - 1);
      setAiStage(stages[currentStage]);
    }, 1500);

    const completeAnalysis = () => {
      clearInterval(loaderInterval);
      setAiStage(null);
      // Reset the focus to simulate a new slide being placed
      setFocusScore(15);
      setHasAutoStarted(false);
    };

    try {
      if (window.electron) {
        const response = await window.electron.ipcRenderer.invoke('ai:analyze', {
          captureId: `cap-${Date.now()}`,
          videoPath: '/local/captures/vid_active.mp4',
          testType: 'Malaria Parasite',
          patientContext: { age: 35, gender: 'Male' }
        });
        completeAnalysis();
        if (response.success) alert("Local AI Analysis Complete! Result securely saved.");
      } else {
        setTimeout(() => {
          completeAnalysis();
          alert("[Browser Mode] Simulated AI Analysis Complete!");
        }, 6000);
      }
    } catch (err) {
      completeAnalysis();
      alert("Failed to communicate with Electron Main Process.");
    }
  };

  const handleStopRecording = () => {
    if (recordingTime < 15) {
      const confirm = window.confirm("Warning: Capture is under 15 seconds. This may result in low AI confidence. Stop anyway?");
      if (!confirm) return;
    }
    setIsRecording(false);
    startAiPipeline();
  };

  const handleManualUpload = () => {
    alert("Opening native file picker to import video into local encrypted store (No cloud upload).");
    startAiPipeline();
  };

  const blurAmount = Math.max(0, (80 - focusScore) / 8);

  return (
    <div className="max-w-7xl mx-auto w-full font-sans pb-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">Capture Feed</h2>
          <p className="text-lg text-slate-500 mt-2 font-medium">Live from IRIS Eyepiece</p>
        </div>

        <div className="flex gap-6 items-center bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <span className={`h-4 w-4 rounded-full shadow-inner ${deviceStatus.connected ? 'bg-[#059669]' : 'bg-slate-300'}`}></span>
            <span className="text-base font-bold text-slate-700">{deviceStatus.connected ? 'IRIS-001 Connected' : 'No Device'}</span>
          </div>
          {deviceStatus.connected && (
            <>
              <div className="text-base font-medium text-slate-500 border-l border-slate-200 pl-6">🔋 {deviceStatus.battery}%</div>
              <div className="text-base font-medium text-slate-500 border-l border-slate-200 pl-6">💾 {deviceStatus.storageGb}GB Free</div>
              <button 
                onClick={disconnectDevice} 
                className="ml-2 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 text-sm font-bold rounded-lg transition-colors border border-red-100"
              >
                Disconnect
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Main Camera Viewport */}
        <div className="col-span-8 relative aspect-[16/9] bg-slate-900 rounded-3xl shadow-xl border border-slate-800 overflow-hidden flex items-center justify-center">
          
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            style={{ 
              opacity: deviceStatus.connected ? 1 : 0,
              filter: `blur(${blurAmount}px)`,
              transform: 'scale(1.05)'
            }}
          />
          
          {aiStage && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center z-30">
              <DotLoader stage={aiStage} />
            </div>
          )}

          {deviceStatus.connected && !aiStage && (
            <div className={`absolute inset-6 border-[8px] rounded-2xl transition-all duration-300 pointer-events-none z-20 ${getFocusColorClass()}`}>
              <div className="absolute top-6 right-6 bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-lg font-mono text-lg font-bold shadow-lg transition-colors">
                FOCUS: {focusScore}%
              </div>
              {isRecording && (
                <div className="absolute top-6 left-6 bg-error text-white px-4 py-2 rounded-lg font-mono text-lg font-bold shadow-lg animate-pulse flex items-center gap-2">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                  REC {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}
                </div>
              )}
            </div>
          )}

          {!deviceStatus.connected && !aiStage && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 z-20">
              <button onClick={connectMockDevice} className="px-8 py-4 bg-[#059669] text-white text-lg font-bold rounded-xl shadow-lg hover:bg-[#047857] hover:scale-105 transition-all">
                Connect Local Device
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Controls */}
        <div className="col-span-4 flex flex-col gap-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-6">
            <h3 className="text-xl font-extrabold text-slate-800 border-b border-slate-100 pb-4">Capture Controls</h3>
            
            {!isRecording ? (
              <button
                disabled={!deviceStatus.connected || focusScore < 76 || !!aiStage}
                onClick={() => setIsRecording(true)}
                className={`w-full py-5 rounded-xl font-extrabold text-lg text-white transition-all shadow-md ${
                  !deviceStatus.connected || focusScore < 76 || !!aiStage
                    ? 'bg-slate-300 cursor-not-allowed shadow-none'
                    : 'bg-[#059669] hover:bg-[#047857] hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
                }`}
              >
                {focusScore > 0 && focusScore <= 75 ? 'Waiting for focus...' : 'Start Capture'}
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="w-full py-5 rounded-xl font-extrabold text-lg text-white bg-error hover:bg-red-700 animate-pulse shadow-lg cursor-pointer"
              >
                STOP RECORDING
              </button>
            )}

            <div className="text-sm font-medium text-slate-500 text-center bg-slate-50 p-4 rounded-xl border border-slate-100">
              Auto-start enables at &gt;75% focus. Minimum 15 seconds required.
            </div>

            {deviceStatus.connected && !isRecording && !aiStage && (
              <button 
                onClick={() => setFocusScore(15)} 
                className="mt-2 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider flex items-center justify-center gap-1"
                title="Simulate re-focusing a new slide"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                Restart Sweep
              </button>
            )}
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-extrabold text-slate-800 border-b border-slate-100 pb-4 mb-6">Manual Fallback</h3>
            <button 
              onClick={handleManualUpload}
              disabled={!!aiStage}
              className="w-full py-4 border-2 border-dashed border-[#059669]/50 text-[#059669] font-bold text-lg rounded-xl hover:bg-[#ecfdf5] hover:border-[#059669] transition-all"
            >
              Import Video File
            </button>
            <p className="text-sm font-medium text-slate-500 mt-4 leading-relaxed">
              For labs without a paired IRIS device yet. Accesses local file system only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}