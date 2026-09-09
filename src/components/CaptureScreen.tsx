import { useEffect, useRef, useState, useCallback } from 'react';

export function CaptureScreen() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Function to turn OFF the camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setHasCamera(false);
  }, []);

  // Hook into the computer's camera when the component loads
  useEffect(() => {
    let isMounted = true; // Track if the tab is still open

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        // RACE CONDITION FIX: If the user clicked away BEFORE the camera finished warming up,
        // kill this stream immediately so it doesn't become a ghost process!
        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        streamRef.current = stream;
        setHasCamera(true);
      } catch (err) {
        console.error("Camera access denied or unavailable:", err);
      }
    };

    initCamera();

    // When switching tabs, flag that we left and stop the camera
    return () => {
      isMounted = false; 
      stopCamera();
    };
  }, [stopCamera]);

  // Function for the manual "Turn On" button
  const handleTurnOnCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setHasCamera(true);
    } catch (err) {
      alert("Could not access the camera.");
    }
  };

  const handleCapture = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setTimeout(() => alert("Frame captured and sent to the offline AI for processing!"), 50);
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">Microscope Feed Capture</h2>
          <p className="text-primary-mid font-medium">
            Status: {hasCamera ? 'Live Stream Active' : 'Camera Disconnected'}
          </p>
        </div>
        
        {/* Hardware Toggle Buttons */}
        <div>
          {hasCamera ? (
            <button 
              onClick={stopCamera}
              className="px-4 py-2 bg-red-100 text-red-700 font-semibold rounded hover:bg-red-200 transition-colors cursor-pointer"
            >
              Turn Off Camera
            </button>
          ) : (
            <button 
              onClick={handleTurnOnCamera}
              className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded hover:bg-gray-300 transition-colors cursor-pointer"
            >
              Turn On Camera
            </button>
          )}
        </div>
      </div>

      {/* Camera Viewport */}
      <div 
        className={`relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden flex items-center justify-center transition-all duration-300 border-4 ${
          isAnalyzing 
            ? 'border-primary animate-iris-pulse' 
            : 'border-muted-foreground/30'
        }`}
      >
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className={`w-full h-full object-cover ${hasCamera ? 'opacity-100' : 'opacity-0'}`} 
        />
        
        {isAnalyzing && (
          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-[2px]">
            <span className="text-white text-3xl font-bold tracking-widest animate-pulse drop-shadow-md">
              ANALYZING...
            </span>
          </div>
        )}

        {!hasCamera && (
          <span className="absolute text-white font-medium">
            Camera is currently off.
          </span>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={handleCapture}
          disabled={!hasCamera || isAnalyzing}
          className={`px-8 py-4 rounded-lg font-bold text-lg transition-colors ${
            isAnalyzing || !hasCamera 
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
              : 'bg-primary hover:bg-primary-dark text-white shadow-lg cursor-pointer'
          }`}
        >
          {isAnalyzing ? 'Processing AI...' : 'Capture & Analyze Frame'}
        </button>
      </div>
    </div>
  );
}