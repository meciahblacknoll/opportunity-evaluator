/**
 * PROVENANCE
 * Created: 2025-11-15
 * Phase: 3 Lite - Sorting Controls
 * Author: Claude Code
 *
 * SortControls - Dropdown for sorting opportunities
 */

import React from 'react';

const SORT_OPTIONS = [
  { value: 'score-desc', label: 'Score (High to Low)' },
  { value: 'score-asc', label: 'Score (Low to High)' },
  { value: 'apr-desc', label: 'APR (High to Low)' },
  { value: 'apr-asc', label: 'APR (Low to High)' },
  { value: 'profit-desc', label: 'Profit (High to Low)' },
  { value: 'profit-asc', label: 'Profit (Low to High)' }
];

export default function SortControls({ sortBy, onSortChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <label
        htmlFor="sort-select"
        style={{
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--text-primary)'
        }}
      >
        Sort by:
      </label>
      <select
        id="sort-select"
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        style={{
          padding: '8px 12px',
          fontSize: '14px',
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          minWidth: '180px'
        }}
        aria-label="Sort opportunities"
      >
        {SORT_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
