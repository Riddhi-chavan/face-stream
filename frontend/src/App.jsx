import { useState, useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useWebSocket } from './hooks/useWebSocket';
import VideoCapture from './components/VideoCapture';
import VideoDisplay from './components/VideoDisplay';
import ROIPanel from './components/ROIPanel';
import ConfidenceChart from './components/ConfidenceChart';

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
  const [copied, setCopied] = useState(false);
  const [mirrored, setMirrored] = useState(true);

  // ROI Polling State
  const POLL_INTERVAL = 2000; // 2 seconds
  const DEFAULT_LIMIT = 30; // Get 30 for the chart

  const [roiData, setRoiData] = useState([]);
  const [totalRoi, setTotalRoi] = useState(0);
  const [roiLoading, setRoiLoading] = useState(true);
  const [roiError, setRoiError] = useState(null);

  const fetchROI = useCallback(async () => {
    try {
      const res = await fetch(`/api/roi?limit=${DEFAULT_LIMIT}&offset=0`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRoiData(data.results || []);
      setTotalRoi(data.total || 0);
      setRoiError(null);
    } catch (err) {
      setRoiError(err.message);
    } finally {
      setRoiLoading(false);
    }
  }, []);

  // Poll on interval
  useEffect(() => {
    fetchROI();
    const interval = setInterval(fetchROI, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchROI]);

  const handleConnectClick = () => {
    if (connectionStatus === 'connected') {
      disconnect();
    } else {
      if (!isCameraActive) {
        setCameraErrorMsg('Start your camera first');
        setTimeout(() => setCameraErrorMsg(''), 3000);
        return;
      }
      connect();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/viewer`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusMap = {
    connected: { dot: 'bg-success-400', label: 'Connected', text: 'text-success-400' },
    connecting: { dot: 'bg-warn-400', label: 'Connecting…', text: 'text-warn-400' },
    disconnected: { dot: 'bg-neutral-600', label: 'Disconnected', text: 'text-neutral-500' },
    error: { dot: 'bg-danger-400', label: 'Error', text: 'text-danger-400' },
  };

  const status = statusMap[connectionStatus] || statusMap.disconnected;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950">
      {/* ──── Header ──── */}
      <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-5 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                <svg className="w-4 h-4 text-accent-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-neutral-950 ${status.dot} ${connectionStatus === 'connected' ? 'status-dot' : ''}`} />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-neutral-100 tracking-tight">FaceStream</h1>
              <p className="text-[10px] text-neutral-500 leading-none mt-0.5">Real-time detection</p>
            </div>
          </div>

          {/* Center controls */}
          {!isViewerMode ? (
            <div className="flex items-center gap-2 relative">
              {cameraErrorMsg && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-danger-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg z-50 animate-fade-in">
                  {cameraErrorMsg}
                </div>
              )}
              <button
                id="ws-connect-btn"
                onClick={handleConnectClick}
                className={`
                  px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${connectionStatus === 'connected'
                    ? 'bg-neutral-800 text-danger-400 hover:bg-neutral-700 border border-neutral-700'
                    : 'bg-accent-500 text-neutral-950 hover:bg-accent-400 font-semibold'
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-danger-400' : 'bg-neutral-950'}`} />
                  {connectionStatus === 'connected' ? 'Disconnect' : 'Go Live'}
                </span>
              </button>
            </div>
          ) : (
            <div className="hidden sm:block">
              <span className="badge bg-accent-500/10 text-accent-400 border border-accent-500/20 text-[11px] font-semibold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-400 status-dot" />
                Live
              </span>
            </div>
          )}

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {!isViewerMode && (
              <button
                onClick={() => setShowShareModal(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
            )}

            {/* Status chip */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800">
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              <span className={`text-[11px] font-medium ${status.text}`}>{status.label}</span>
            </div>

            {/* Panel toggle */}
            <button
              id="toggle-panel-btn"
              onClick={() => setShowPanel(!showPanel)}
              className={`p-2 rounded-lg transition-colors ${showPanel ? 'bg-neutral-800 text-neutral-200' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'}`}
              title="Toggle data panel"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
      <main className="flex-1 p-4 sm:p-5 max-w-[1400px] mx-auto w-full">
        <div className={`grid gap-5 ${showPanel ? 'lg:grid-cols-[1fr_440px]' : 'grid-cols-1'}`}>
          {/* Left Column: Video Feeds */}
          <div className="space-y-5">
            {/* Camera Input Card */}
            {!isViewerMode && (
              <section className="card-surface p-5">
                <VideoCapture sendFrame={sendFrame} connectionStatus={connectionStatus} onCameraStateChange={setIsCameraActive} mirrored={mirrored} onMirrorToggle={() => setMirrored(m => !m)} />
              </section>
            )}

            {/* Detected Output Card */}
            <section className="card-surface p-5">
              <VideoDisplay lastFrame={lastFrame} connectionStatus={connectionStatus} isCameraActive={isViewerMode ? isStreamLive : isCameraActive} isViewerMode={isViewerMode} />
            </section>

            {/* Live Confidence Chart */}
            {showPanel && <ConfidenceChart data={roiData} />}
          </div>

          {/* Right Column: ROI Data */}
          {showPanel && (
            <aside className="card-surface p-5 lg:sticky lg:top-[72px] lg:self-start lg:max-h-[calc(100vh-92px)] lg:overflow-y-auto">
              <ROIPanel roiData={roiData} total={totalRoi} loading={roiLoading} error={roiError} fetchROI={fetchROI} pollInterval={POLL_INTERVAL} />
            </aside>
          )}
        </div>
      </main>

      {/* ──── Share Modal ──── */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl w-full max-w-md shadow-2xl modal-enter" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-neutral-100 mb-1">Share your stream</h3>
            <p className="text-sm text-neutral-500 mb-5">Anyone with this link can watch in real-time.</p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/viewer`}
                className="flex-1 bg-neutral-950 text-neutral-300 text-sm px-3 py-2.5 rounded-lg border border-neutral-800 outline-none focus:border-neutral-600 transition-colors font-mono text-xs"
              />
              <button
                onClick={handleCopyLink}
                className="bg-accent-500 hover:bg-accent-400 text-neutral-950 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 shrink-0"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="mt-4 w-full text-center py-2 text-neutral-500 hover:text-neutral-300 bg-neutral-800/50 hover:bg-neutral-800 rounded-lg transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ──── Footer ──── */}
      <footer className="border-t border-neutral-800/50 px-5 py-3.5 mt-auto">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-neutral-600">
          <p>FaceStream v1.0</p>
          <p className="flex items-center gap-1.5">
            Built with
            <span className="text-neutral-400">MediaPipe</span>
            <span className="text-neutral-700">·</span>
            <span className="text-neutral-400">Flask</span>
            <span className="text-neutral-700">·</span>
            <span className="text-neutral-400">React</span>
          </p>
        </div>
      </footer>
    </div>
  );
}