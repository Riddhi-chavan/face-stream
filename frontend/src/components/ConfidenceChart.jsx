import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function ConfidenceChart({ data }) {
  // Data comes in descending order (newest first). 
  // We need to reverse it for the chart so time flows left to right.
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return [...data].reverse().map(item => {
      const d = new Date(item.timestamp);
      const timeStr = d.toLocaleTimeString('en-US', {
        hour12: false,
        minute: '2-digit',
        second: '2-digit'
      });
      
      return {
        time: timeStr,
        confidence: Math.round(item.confidence * 100) // Convert to percentage 0-100
      };
    });
  }, [data]);

  return (
    <div className="card-surface p-5 mt-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-800 border border-neutral-700">
          <svg className="w-4 h-4 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-neutral-100">Live Confidence</h2>
          <p className="text-[11px] text-neutral-500">Detection accuracy over time (%)</p>
        </div>
      </div>

      <div className="h-[200px] w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="#57534e" 
                fontSize={10} 
                tickMargin={10}
                tickFormatter={(val) => val}
                minTickGap={30}
              />
              <YAxis 
                stroke="#57534e" 
                fontSize={10} 
                domain={[0, 100]} 
                ticks={[0, 50, 100]} 
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1c1917', 
                  border: '1px solid #292524',
                  borderRadius: '8px',
                  color: '#f5f5f5',
                  fontSize: '12px'
                }}
                itemStyle={{ color: '#f59e0b' }}
              />
              <Line 
                type="monotone" 
                dataKey="confidence" 
                stroke="#f59e0b" 
                strokeWidth={2} 
                dot={false}
                activeDot={{ r: 4, fill: '#f59e0b', stroke: '#1c1917', strokeWidth: 2 }}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-600 text-sm">
            Waiting for detection data...
          </div>
        )}
      </div>
    </div>
  );
}
