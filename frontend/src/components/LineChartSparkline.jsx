/**
 * PROVENANCE
 * Created: 2025-11-15
 * Phase: 2.5 - Recharts Integration
 * Author: Claude Code
 *
 * LineChartSparkline - Recharts-based sparkline component
 * Replaces the inline SVG sparkline with a more robust charting solution
 * Supports dark mode via CSS variables
 */

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

/**
 * Normalize input data to a consistent format
 * Supports: [1,2,3] or [{date:'2025-01-01', value: 10}, ...]
 */
function normalizeData(raw) {
  if (!raw) return [];
  if (!raw.length) return [];

  if (typeof raw[0] === 'number') {
    return raw.map((v, i) => ({ idx: i, value: Number(v) || 0 }));
  }

  return raw.map((d, i) => {
    if (typeof d === 'number') return { idx: i, value: Number(d) || 0 };
    return {
      idx: i,
      value: Number(d.value ?? d.y ?? d.balance ?? d.available_cash ?? 0),
      date: d.date ?? d.x ?? undefined
    };
  });
}

/**
 * LineChartSparkline Component
 *
 * @param {Array} data - Array of numbers or objects with value/date fields
 * @param {number} height - Chart height in pixels (default: 48)
 * @param {string} stroke - Line stroke color (CSS variable or color)
 * @param {string} fill - Area fill color (CSS variable or color)
 */
export default function LineChartSparkline({
  data = [],
  height = 48,
  stroke = 'var(--chart-line)',
  fill = 'var(--chart-fill)'
}) {
  const chartData = useMemo(() => normalizeData(data), [data]);

  // Empty state fallback
  if (!chartData.length) {
    return (
      <div
        style={{
          width: '100%',
          height,
          background: 'var(--sparkline-bg, #f1f3f5)',
          borderRadius: 4
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div style={{ width: '100%', height }} aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 6, left: 6, bottom: 2 }}>
          <defs>
            <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={stroke} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={stroke} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="idx" hide />
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Tooltip wrapperStyle={{ display: 'none' }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="none"
            fill="url(#sparkGradient)"
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
