import { useRef, useEffect, useCallback, useState } from 'react';

const JPEG_QUALITY = 0.8;

/**
 * VideoCapture — accesses webcam, captures frames, sends over WebSocket.
 *
 * @param {{ sendFrame: Function, connectionStatus: string, onCameraStateChange: Function }} props
 */
export default function VideoCapture({ sendFrame, connectionStatus, onCameraStateChange }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const lastCaptureRef = useRef(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [targetFps, setTargetFps] = useState(30);
  const targetFpsRef = useRef(30);

  const handleFpsChange = (e) => {
    const fps = Number(e.target.value);
    setTargetFps(fps);
    targetFpsRef.current = fps;
  };

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera access denied. Please allow camera permissions.'
          : 'Failed to access camera. Make sure a webcam is connected.'
      );
      setCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Frame capture loop
  const captureLoop = useCallback(
    (timestamp) => {
      const interval = 1000 / targetFpsRef.current;

      if (timestamp - lastCaptureRef.current >= interval) {
        lastCaptureRef.current = timestamp;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video && canvas && video.readyState >= 2 && connectionStatus === 'connected') {
          const ctx = canvas.getContext('2d');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);

          canvas.toBlob(
            (blob) => {
              if (blob) sendFrame(blob);
            },
            'image/jpeg',
            JPEG_QUALITY
          );
        }
      }

      animationRef.current = requestAnimationFrame(captureLoop);
    },
    [connectionStatus, sendFrame]
  );

  // Sync camera state with parent
  useEffect(() => {
    if (onCameraStateChange) {
      onCameraStateChange(cameraActive);
    }
  }, [cameraActive, onCameraStateChange]);

  // Start capture loop when camera is active and connected
  useEffect(() => {
    if (cameraActive && connectionStatus === 'connected') {
      animationRef.current = requestAnimationFrame(captureLoop);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [cameraActive, connectionStatus, captureLoop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-800 border border-neutral-700">
            <svg className="w-4 h-4 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">Camera Input</h2>
            <p className="text-[11px] text-neutral-500">{targetFps} fps · webcam</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={targetFps}
            onChange={handleFpsChange}
            className="bg-neutral-800 text-neutral-200 text-xs font-medium rounded-lg px-2.5 py-1.5 border border-neutral-700 outline-none focus:border-neutral-600 transition-colors cursor-pointer appearance-none"
          >
            <option value={30}>30 fps</option>
            <option value={60}>60 fps</option>
            <option value={120}>120 fps</option>
          </select>

          <button
            id="camera-toggle-btn"
            onClick={cameraActive ? stopCamera : startCamera}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
              ${cameraActive
                ? 'bg-neutral-800 text-danger-400 hover:bg-neutral-700 border border-neutral-700'
                : 'bg-accent-500 text-neutral-950 hover:bg-accent-400 font-semibold'
              }
            `}
          >
            {cameraActive ? 'Stop' : 'Start Camera'}
          </button>
        </div>
      </div>

      {/* Video Preview */}
      <div className="video-container aspect-video flex items-center justify-center">
        {cameraError ? (
          <div className="text-center p-6">
            <div className="w-10 h-10 rounded-full bg-danger-500/10 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-danger-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-danger-400 text-sm">{cameraError}</p>
          </div>
        ) : !cameraActive ? (
          <div className="text-center p-6">
            <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-neutral-500 text-sm">Click "Start Camera" to begin</p>
          </div>
        ) : null}
        <video
          ref={videoRef}
          className={`w-full h-full object-cover rounded-[7px] ${!cameraActive ? 'hidden' : ''}`}
          autoPlay
          playsInline
          muted
        />
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Status bar */}
      <div className="flex items-center gap-3 text-[11px] text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${cameraActive ? 'bg-success-400 status-dot' : 'bg-neutral-700'}`} />
          {cameraActive ? 'Active' : 'Inactive'}
        </span>
        <span className="text-neutral-800">|</span>
        <span>{videoRef.current?.videoWidth || '—'}×{videoRef.current?.videoHeight || '—'}</span>
      </div>
    </div>
  );
}
