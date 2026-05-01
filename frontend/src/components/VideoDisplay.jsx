import { useState, useEffect, useRef } from 'react';

/**
 * VideoDisplay — renders annotated video frames received from the backend.
 *
 * @param {{ lastFrame: string|null, connectionStatus: string, isCameraActive: boolean, isViewerMode?: boolean }} props
 */
export default function VideoDisplay({ lastFrame, connectionStatus, isCameraActive, isViewerMode = false }) {
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

  const getPlaceholderText = () => {
    if (isViewerMode && connectionStatus === 'connected' && !isCameraActive) {
      return 'Broadcaster is offline. Waiting for stream…';
    }
    if (connectionStatus === 'connected' && !isCameraActive) {
      return 'Camera stopped. Turn it on to see frames.';
    }
    if (connectionStatus === 'connected') {
      return 'Waiting for frames…';
    }
    return 'Connect to see annotated output';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-800 border border-neutral-700">
            <svg className="w-4 h-4 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">Detection Output</h2>
            <p className="text-[11px] text-neutral-500">Annotated frames with face ROI</p>
          </div>
        </div>

        {/* Live stats */}
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-1 rounded-md text-[11px] font-mono bg-neutral-800 border border-neutral-700/60 text-neutral-400">
            {fps} fps
          </span>
          <span className="px-2 py-1 rounded-md text-[11px] font-mono bg-neutral-800 border border-neutral-700/60 text-neutral-400">
            #{frameCount}
          </span>
        </div>
      </div>

      {/* Annotated Video Display */}
      <div className="video-container aspect-video flex items-center justify-center overflow-hidden">
        {lastFrame ? (
          <img
            id="annotated-frame"
            src={lastFrame}
            alt="Annotated video frame with face detection"
            className="w-full h-full object-cover rounded-[7px]"
          />
        ) : (
          <div className="text-center p-6">
            <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <p className="text-neutral-500 text-sm">{getPlaceholderText()}</p>
          </div>
        )}

        {/* Overlay: Connection and Camera status */}
        {connectionStatus !== 'connected' && lastFrame ? (
          <div className="absolute inset-0 bg-neutral-950/80 flex items-center justify-center rounded-[7px]">
            <div className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-lg">
              <span className="text-sm text-neutral-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                Stream paused
              </span>
            </div>
          </div>
        ) : connectionStatus === 'connected' && !isCameraActive && lastFrame ? (
          <div className="absolute inset-0 bg-neutral-950/80 flex items-center justify-center rounded-[7px]">
            <div className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-lg">
              <span className="text-sm text-neutral-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                Camera stopped
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-3 text-[11px] text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${
            connectionStatus === 'connected' ? 'bg-success-400 status-dot' :
            connectionStatus === 'connecting' ? 'bg-warn-400 status-dot' :
            connectionStatus === 'error' ? 'bg-danger-400' :
            'bg-neutral-700'
          }`} />
          {connectionStatus}
        </span>
        <span className="text-neutral-800">|</span>
        <span>Frames: {frameCount.toLocaleString()}</span>
      </div>
    </div>
  );
}
