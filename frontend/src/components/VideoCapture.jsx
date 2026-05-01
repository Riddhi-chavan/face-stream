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
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-500/10 border border-accent-500/20">
            <svg className="w-5 h-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-surface-100">Camera Input</h2>
            <p className="text-xs text-surface-400">Live webcam feed at {targetFps}fps</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={targetFps}
            onChange={handleFpsChange}
            className="bg-surface-800 text-surface-100 text-sm font-medium rounded-lg px-3 py-2 border border-surface-700 outline-none focus:border-accent-500/50 transition-colors cursor-pointer"
          >
            <option value={30}>30 FPS</option>
            <option value={60}>60 FPS</option>
            <option value={120}>120 FPS</option>
          </select>

          <button
            id="camera-toggle-btn"
            onClick={cameraActive ? stopCamera : startCamera}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${cameraActive
                ? 'bg-danger-500/20 text-danger-400 hover:bg-danger-500/30 border border-danger-500/30'
                : 'bg-accent-500/20 text-accent-400 hover:bg-accent-500/30 border border-accent-500/30'
              }
            `}
          >
            {cameraActive ? '⏹ Stop' : '▶ Start Camera'}
          </button>
        </div>
      </div>

      {/* Video Preview */}
      <div className="video-container bg-surface-950 aspect-video rounded-xl flex items-center justify-center">
        {cameraError ? (
          <div className="text-center p-6">
            <div className="text-4xl mb-3">📷</div>
            <p className="text-danger-400 text-sm">{cameraError}</p>
          </div>
        ) : !cameraActive ? (
          <div className="text-center p-6">
            <div className="text-5xl mb-4 opacity-30">🎥</div>
            <p className="text-surface-500 text-sm">Click "Start Camera" to begin</p>
          </div>
        ) : null}
        <video
          ref={videoRef}
          className={`w-full h-full object-cover rounded-xl ${!cameraActive ? 'hidden' : ''}`}
          autoPlay
          playsInline
          muted
        />
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Status bar */}
      <div className="flex items-center gap-4 text-xs text-surface-400">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-success-400 status-dot' : 'bg-surface-600'}`} />
          Camera: {cameraActive ? 'Active' : 'Inactive'}
        </span>
        <span className="text-surface-700">|</span>
        <span>Resolution: {videoRef.current?.videoWidth || '—'}×{videoRef.current?.videoHeight || '—'}</span>
      </div>
    </div>
  );
}
