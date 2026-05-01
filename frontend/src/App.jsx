import { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import VideoCapture from './components/VideoCapture';
import VideoDisplay from './components/VideoDisplay';
import ROIPanel from './components/ROIPanel';

const WS_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/stream`;

export default function App() {
  const { sendFrame, lastFrame, connectionStatus, connect, disconnect } = useWebSocket(WS_URL);
  const [showPanel, setShowPanel] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraErrorMsg, setCameraErrorMsg] = useState('');

  const handleConnectClick = () => {
    if (connectionStatus === 'connected') {
      disconnect();
    } else {
      if (!isCameraActive) {
        setCameraErrorMsg('Please start your camera first!');
        setTimeout(() => setCameraErrorMsg(''), 3000);
        return;
      }
      connect();
    }
  };

  const statusConfig = {
    connected: { color: 'bg-success-400', label: 'Connected', textColor: 'text-success-400' },
    connecting: { color: 'bg-yellow-400', label: 'Connecting...', textColor: 'text-yellow-400' },
    disconnected: { color: 'bg-surface-500', label: 'Disconnected', textColor: 'text-surface-400' },
    error: { color: 'bg-danger-400', label: 'Error', textColor: 'text-danger-400' },
  };

  const status = statusConfig[connectionStatus] || statusConfig.disconnected;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ──── Top Navigation ──── */}
      <header className="glass sticky top-0 z-50 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-500 to-violet-600 flex items-center justify-center shadow-lg shadow-accent-500/20">
                <span className="text-white text-lg font-bold">F</span>
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-900 ${status.color} ${connectionStatus === 'connected' ? 'status-dot' : ''}`} />
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text tracking-tight">FaceStream</h1>
              <p className="text-[10px] text-surface-500 -mt-0.5">Real-Time Face Detection</p>
            </div>
          </div>

          {/* Center: Connection Controls */}
          <div className="flex items-center gap-3 relative">
            {cameraErrorMsg && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-danger-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg z-50">
                {cameraErrorMsg}
                {/* Little triangle pointer */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-danger-500 rotate-45"></div>
              </div>
            )}
            <button
              id="ws-connect-btn"
              onClick={handleConnectClick}
              className={`
                group relative px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 overflow-hidden
                ${connectionStatus === 'connected'
                  ? 'bg-danger-500/10 text-danger-400 hover:bg-danger-500/20 border border-danger-500/20'
                  : 'bg-accent-500/10 text-accent-400 hover:bg-accent-500/20 border border-accent-500/20 animate-glow'
                }
              `}
            >
              <span className="relative z-10 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${status.color} ${connectionStatus === 'connected' ? 'status-dot' : ''}`} />
                {connectionStatus === 'connected' ? 'Disconnect' : 'Connect Stream'}
              </span>
            </button>
          </div>

          {/* Right: Status + Toggle */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg glass-light">
              <span className={`w-2 h-2 rounded-full ${status.color}`} />
              <span className={`text-xs font-medium ${status.textColor}`}>{status.label}</span>
            </div>

            <button
              id="toggle-panel-btn"
              onClick={() => setShowPanel(!showPanel)}
              className="p-2 rounded-lg text-surface-400 hover:text-accent-400 hover:bg-accent-500/10 transition-all duration-200"
              title="Toggle ROI Panel"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={showPanel
                  ? "M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                  : "M4 6h16M4 12h16M4 18h16"
                } />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ──── Main Content ──── */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        <div className={`grid gap-6 ${showPanel ? 'lg:grid-cols-[1fr_1fr]' : 'grid-cols-1'}`}>
          {/* Left Column: Video Feeds */}
          <div className="space-y-6">
            {/* Camera Input Card */}
            <section className="glass rounded-2xl p-5 card-hover">
              <VideoCapture sendFrame={sendFrame} connectionStatus={connectionStatus} onCameraStateChange={setIsCameraActive} />
            </section>

            {/* Detected Output Card */}
            <section className="glass rounded-2xl p-5 card-hover">
              <VideoDisplay lastFrame={lastFrame} connectionStatus={connectionStatus} />
            </section>
          </div>

          {/* Right Column: ROI Data */}
          {showPanel && (
            <aside className="glass rounded-2xl p-5 card-hover lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
              <ROIPanel />
            </aside>
          )}
        </div>
      </main>

      {/* ──── Footer ──── */}
      <footer className="glass-light px-6 py-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-surface-500">
          <p>FaceStream v1.0 — Real-Time Face Detection System</p>
          <p className="flex items-center gap-1.5">
            Powered by
            <span className="text-accent-400 font-medium">MediaPipe</span>
            <span className="text-surface-700">•</span>
            <span className="text-accent-400 font-medium">Flask</span>
            <span className="text-surface-700">•</span>
            <span className="text-accent-400 font-medium">React</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
