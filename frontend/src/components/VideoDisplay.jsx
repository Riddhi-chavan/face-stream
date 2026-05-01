import { useState, useEffect, useRef } from 'react';

/**
 * VideoDisplay — renders annotated video frames received from the backend.
 *
 * @param {{ lastFrame: string|null, connectionStatus: string, isCameraActive: boolean }} props
 */
export default function VideoDisplay({ lastFrame, connectionStatus, isCameraActive }) {
  const [frameCount, setFrameCount] = useState(0);
  const [fps, setFps] = useState(0);
  const fpsCounterRef = useRef({ count: 0, lastTime: Date.now() });

  // Count frames for FPS display
  useEffect(() => {
    if (lastFrame) {
      setFrameCount((prev) => prev + 1);

      const now = Date.now();
      fpsCounterRef.current.count++;

      if (now - fpsCounterRef.current.lastTime >= 1000) {
        setFps(fpsCounterRef.current.count);
        fpsCounterRef.current.count = 0;
        fpsCounterRef.current.lastTime = now;
      }
    }
  }, [lastFrame]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-success-500/10 border border-success-500/20">
            <svg className="w-5 h-5 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-surface-100">Detected Output</h2>
            <p className="text-xs text-surface-400">Annotated frames with face ROI</p>
          </div>
        </div>

        {/* Live stats badges */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-surface-800/60 border border-surface-700/40 text-surface-300">
            {fps} fps
          </span>
          <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-surface-800/60 border border-surface-700/40 text-surface-300">
            #{frameCount}
          </span>
        </div>
      </div>

      {/* Annotated Video Display */}
      <div className="video-container bg-surface-950 aspect-video rounded-xl flex items-center justify-center overflow-hidden">
        {lastFrame ? (
          <img
            id="annotated-frame"
            src={lastFrame}
            alt="Annotated video frame with face detection"
            className="w-full h-full object-cover rounded-xl"
          />
        ) : (
          <div className="text-center p-6">
            <div className="text-5xl mb-4 opacity-20">🔍</div>
            <p className="text-surface-500 text-sm">
              {connectionStatus === 'connected' && !isCameraActive
                ? 'Camera stopped. Turn it on to see frames.'
                : connectionStatus === 'connected'
                ? 'Waiting for frames...'
                : 'Connect to see annotated output'}
            </p>
          </div>
        )}

        {/* Overlay: Connection and Camera status */}
        {connectionStatus !== 'connected' && lastFrame ? (
          <div className="absolute inset-0 bg-surface-950/70 flex items-center justify-center rounded-xl">
            <div className="glass px-4 py-2 rounded-lg">
              <span className="text-sm text-surface-300">⏸ Stream paused</span>
            </div>
          </div>
        ) : connectionStatus === 'connected' && !isCameraActive && lastFrame ? (
          <div className="absolute inset-0 bg-surface-950/70 flex items-center justify-center rounded-xl">
            <div className="glass px-4 py-2 rounded-lg">
              <span className="text-sm text-surface-300">⏹ Camera stopped</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 text-xs text-surface-400">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-success-400 status-dot' :
            connectionStatus === 'connecting' ? 'bg-yellow-400 status-dot' :
            connectionStatus === 'error' ? 'bg-danger-400' :
            'bg-surface-600'
          }`} />
          Stream: {connectionStatus}
        </span>
        <span className="text-surface-700">|</span>
        <span>Frames processed: {frameCount.toLocaleString()}</span>
      </div>
    </div>
  );
}
