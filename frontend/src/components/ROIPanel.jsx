import { useState, useEffect, useCallback } from 'react';

const POLL_INTERVAL = 2000; // 2 seconds
const DEFAULT_LIMIT = 10;

/**
 * ROIPanel — polls /api/roi and displays recent ROI data.
 */
export default function ROIPanel() {
  const [roiData, setRoiData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchROI = useCallback(async () => {
    try {
      const res = await fetch(`/api/roi?limit=${DEFAULT_LIMIT}&offset=0`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRoiData(data.results || []);
      setTotal(data.total || 0);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll on interval
  useEffect(() => {
    fetchROI();
    const interval = setInterval(fetchROI, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchROI]);

  const formatTime = (isoString) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-surface-100">ROI Events</h2>
            <p className="text-xs text-surface-400">
              {total.toLocaleString()} total detections · Polling every {POLL_INTERVAL / 1000}s
            </p>
          </div>
        </div>

        <button
          id="refresh-roi-btn"
          onClick={fetchROI}
          className="p-2 rounded-lg text-surface-400 hover:text-accent-400 hover:bg-accent-500/10 transition-all duration-200"
          title="Refresh"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm">
          ⚠ Failed to load ROI data: {error}
        </div>
      )}

      {/* Loading shimmer */}
      {loading && !roiData.length && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 rounded-lg shimmer" />
          ))}
        </div>
      )}

      {/* Data table */}
      {!loading && roiData.length > 0 && (
        <div className="rounded-xl overflow-hidden border border-surface-700/30">
          <div className="overflow-x-auto">
            <table className="w-full roi-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>X</th>
                  <th>Y</th>
                  <th>W</th>
                  <th>H</th>
                  <th>Confidence</th>
                  <th>Detected</th>
                </tr>
              </thead>
              <tbody>
                {roiData.map((event) => (
                  <tr
                    key={event.id || event.frame_id}
                    className={!event.face_detected ? 'bg-danger-500/5' : ''}
                  >
                    <td className="text-surface-300">{formatTime(event.timestamp)}</td>
                    <td className="text-surface-300">{event.x}</td>
                    <td className="text-surface-300">{event.y}</td>
                    <td className="text-surface-300">{event.width}</td>
                    <td className="text-surface-300">{event.height}</td>
                    <td>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${event.confidence >= 0.8
                          ? 'bg-success-500/20 text-success-400'
                          : event.confidence >= 0.5
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-surface-700/40 text-surface-400'
                          }`}
                      >
                        {(event.confidence * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      {event.face_detected ? (
                        <span className="inline-flex items-center gap-1 text-success-400 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-success-400" />
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-surface-500 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-surface-600" />
                          No
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && roiData.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3 opacity-20">📊</div>
          <p className="text-surface-500 text-sm">No ROI events recorded yet</p>
          <p className="text-surface-600 text-xs mt-1">Start streaming to populate detection data</p>
        </div>
      )}
    </div>
  );
}
