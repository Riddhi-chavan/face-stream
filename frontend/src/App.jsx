import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useWebSocket } from './hooks/useWebSocket';
import VideoCapture from './components/VideoCapture';
import VideoDisplay from './components/VideoDisplay';
import ROIPanel from './components/ROIPanel';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FaceStreamApp isViewerMode={false} />} />
      <Route path="/viewer" element={<FaceStreamApp isViewerMode={true} />} />
    </Routes>
  );
}

function FaceStreamApp({ isViewerMode }) {
  const WS_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/${isViewerMode ? 'feed' : 'stream'}`;
  const { sendFrame, lastFrame, connectionStatus, connect, disconnect, isStreamLive } = useWebSocket(WS_URL, { autoConnect: isViewerMode });
  const [showPanel, setShowPanel] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraErrorMsg, setCameraErrorMsg] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

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
          {!isViewerMode ? (
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
          ) : (
            <div className="hidden sm:block">
              <span className="px-3 py-1.5 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-400 text-xs font-bold tracking-widest uppercase shadow-[0_0_10px_rgba(var(--color-accent-500),0.2)]">
                Live Broadcast
              </span>
            </div>
          )}

          {/* Right: Status + Toggle */}
          <div className="flex items-center gap-4">
            {!isViewerMode && (
              <button
                onClick={() => setShowShareModal(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 border border-surface-700 text-surface-200 text-xs font-medium transition-colors"
              >
                <svg className="w-4 h-4 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
            )}
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
            {/* Camera Input Card (Hidden in Viewer Mode) */}
            {!isViewerMode && (
              <section className="glass rounded-2xl p-5 card-hover">
                <VideoCapture sendFrame={sendFrame} connectionStatus={connectionStatus} onCameraStateChange={setIsCameraActive} />
              </section>
            )}

            {/* Detected Output Card */}
            <section className="glass rounded-2xl p-5 card-hover">
              <VideoDisplay lastFrame={lastFrame} connectionStatus={connectionStatus} isCameraActive={isViewerMode ? isStreamLive : isCameraActive} isViewerMode={isViewerMode} />
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

      {/* ──── Share Modal ──── */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass p-6 rounded-2xl w-full max-w-md shadow-2xl border border-surface-700 animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-500 to-violet-600"></div>
            <h3 className="text-xl font-bold text-white mb-2">Share Stream</h3>
            <p className="text-sm text-surface-400 mb-5">Anyone with this link can watch your stream in real-time.</p>
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly 
                value={`${window.location.origin}/viewer`} 
                className="flex-1 bg-surface-900/80 text-surface-200 text-sm px-3 py-2.5 rounded-lg border border-surface-700 outline-none focus:border-accent-500/50 transition-colors" 
              />
              <button 
                onClick={() => { 
                  navigator.clipboard.writeText(`${window.location.origin}/viewer`); 
                  const btn = document.getElementById('copy-btn-text');
                  if (btn) { btn.innerText = 'Copied!'; setTimeout(() => btn.innerText = 'Copy Link', 2000); }
                }} 
                className="bg-accent-600 hover:bg-accent-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span id="copy-btn-text">Copy Link</span>
              </button>
            </div>
            <button 
              onClick={() => setShowShareModal(false)} 
              className="mt-6 w-full text-center py-2.5 text-surface-400 hover:text-white bg-surface-800/50 hover:bg-surface-700/50 rounded-lg transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

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
