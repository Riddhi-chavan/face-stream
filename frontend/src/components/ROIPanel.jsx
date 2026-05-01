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
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-800 border border-neutral-700">
            <svg className="w-4 h-4 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">ROI Events</h2>
            <p className="text-[11px] text-neutral-500">
              {total.toLocaleString()} detections · {POLL_INTERVAL / 1000}s poll
            </p>
          </div>
        </div>

        <button
          id="refresh-roi-btn"
          onClick={fetchROI}
          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors"
          title="Refresh"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="px-3 py-2.5 rounded-lg bg-danger-500/8 border border-danger-500/15 text-danger-400 text-xs">
          Failed to load ROI data: {error}
        </div>
      )}

      {/* Loading shimmer */}
      {loading && !roiData.length && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 rounded-lg shimmer" />
          ))}
        </div>
      )}

      {/* Data table */}
      {!loading && roiData.length > 0 && (
        <div className="rounded-lg overflow-hidden border border-neutral-800">
          <div className="overflow-x-auto">
            <table className="w-full roi-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>X</th>
                  <th>Y</th>
                  <th>W</th>
                  <th>H</th>
                  <th>Conf</th>
                  <th>Face</th>
                </tr>
              </thead>
              <tbody>
                {roiData.map((event) => (
                  <tr
                    key={event.id || event.frame_id}
                    className={!event.face_detected ? 'bg-danger-500/5' : ''}
                  >
                    <td className="text-neutral-400">{formatTime(event.timestamp)}</td>
                    <td className="text-neutral-400">{event.x}</td>
                    <td className="text-neutral-400">{event.y}</td>
                    <td className="text-neutral-400">{event.width}</td>
                    <td className="text-neutral-400">{event.height}</td>
                    <td>
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-medium ${event.confidence >= 0.8
                          ? 'bg-success-500/15 text-success-400'
                          : event.confidence >= 0.5
                            ? 'bg-warn-500/15 text-warn-400'
                            : 'bg-neutral-800 text-neutral-500'
                          }`}
                      >
                        {(event.confidence * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      {event.face_detected ? (
                        <span className="inline-flex items-center gap-1 text-success-400 text-[11px]">
                          <span className="w-1 h-1 rounded-full bg-success-400" />
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-neutral-600 text-[11px]">
                          <span className="w-1 h-1 rounded-full bg-neutral-700" />
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
        <div className="text-center py-10">
          <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
            </svg>
          </div>
          <p className="text-neutral-500 text-sm">No events yet</p>
          <p className="text-neutral-600 text-xs mt-1">Start streaming to populate data</p>
        </div>
      )}
    </div>
  );
}
