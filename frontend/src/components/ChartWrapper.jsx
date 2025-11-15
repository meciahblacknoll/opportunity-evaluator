/**
 * PROVENANCE
 * Created: 2025-11-15
 * Phase: 2.5 - Recharts Integration
 * Author: Claude Code
 *
 * ChartWrapper - Lazy-loading wrapper for LineChartSparkline
 * Reduces initial bundle size by loading Recharts on-demand
 */

import React, { Suspense, lazy } from 'react';

// Lazy load the LineChartSparkline component
const LineChartSparkline = lazy(() => import('./LineChartSparkline'));

/**
 * ChartWrapper Component
 *
 * Wraps LineChartSparkline in Suspense for lazy loading
 * Shows a simple fallback while the chart component loads
 *
 * @param {Array} data - Chart data points
 * @param {number} height - Chart height in pixels
 * @param {string} stroke - Line stroke color
 * @param {string} fill - Area fill color
 * @param {number} width - Chart width (optional, defaults to responsive)
 */
export default function ChartWrapper({ data, height = 48, stroke, fill, width }) {
  return (
    <Suspense
      fallback={
        <div
          style={{
            width: width || '100%',
            height,
            background: 'var(--sparkline-bg, #f1f3f5)',
            borderRadius: 4
          }}
        />
      }
    >
      <LineChartSparkline
        data={data}
        height={height}
        stroke={stroke}
        fill={fill}
      />
    </Suspense>
  );
}
