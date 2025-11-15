/**
 * PROVENANCE
 * Created: 2025-11-15
 * Phase: 2.5 - CSV/JSON Export (Task Group 4)
 * Author: Claude Code
 *
 * ExportButtons - Shared component for exporting data to CSV and JSON
 * Uses pure browser APIs, no backend required
 */

import React from 'react';

/**
 * Convert data to JSON and trigger download
 * @param {*} data - Data to export (array or object)
 * @param {string} filenameBase - Base filename without extension
 */
function exportJSON(data, filenameBase) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenameBase}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Convert data to CSV and trigger download
 * @param {*} data - Data to export (array of objects or single object)
 * @param {string} filenameBase - Base filename without extension
 */
function exportCSV(data, filenameBase) {
  // Normalize data to array
  const dataArray = Array.isArray(data) ? data : [data];

  if (dataArray.length === 0) {
    // Empty data - create CSV with no rows
    const blob = new Blob([''], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filenameBase}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  // Extract headers from first object
  const headers = Object.keys(dataArray[0]);

  // Helper to escape CSV values
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';

    // Convert objects/arrays to JSON strings
    if (typeof value === 'object') {
      value = JSON.stringify(value);
    }

    // Convert to string
    const stringValue = String(value);

    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  };

  // Build CSV content
  const csvRows = [];

  // Add header row
  csvRows.push(headers.map(escapeCSV).join(','));

  // Add data rows
  for (const row of dataArray) {
    const values = headers.map(header => escapeCSV(row[header]));
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenameBase}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * ExportButtons Component
 *
 * @param {Object} props
 * @param {*} props.data - Data to export
 * @param {string} props.filenameBase - Base filename without extension
 * @param {boolean} props.disabled - Whether buttons are disabled
 */
function ExportButtons({ data, filenameBase, disabled = false }) {
  const handleJSONExport = () => {
    if (!disabled && data) {
      exportJSON(data, filenameBase);
    }
  };

  const handleCSVExport = () => {
    if (!disabled && data) {
      exportCSV(data, filenameBase);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}
    >
      <button
        onClick={handleCSVExport}
        disabled={disabled}
        style={{
          padding: '8px 16px',
          background: disabled ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
          color: disabled ? 'var(--text-secondary)' : '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: 500,
          transition: 'all 0.2s ease',
          opacity: disabled ? 0.6 : 1
        }}
        onMouseOver={(e) => {
          if (!disabled) {
            e.currentTarget.style.opacity = '0.9';
          }
        }}
        onMouseOut={(e) => {
          if (!disabled) {
            e.currentTarget.style.opacity = '1';
          }
        }}
        aria-label="Export data as CSV"
      >
        📊 Export CSV
      </button>

      <button
        onClick={handleJSONExport}
        disabled={disabled}
        style={{
          padding: '8px 16px',
          background: disabled ? 'var(--bg-tertiary)' : 'var(--accent-success)',
          color: disabled ? 'var(--text-secondary)' : '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: 500,
          transition: 'all 0.2s ease',
          opacity: disabled ? 0.6 : 1
        }}
        onMouseOver={(e) => {
          if (!disabled) {
            e.currentTarget.style.opacity = '0.9';
          }
        }}
        onMouseOut={(e) => {
          if (!disabled) {
            e.currentTarget.style.opacity = '1';
          }
        }}
        aria-label="Export data as JSON"
      >
        📄 Export JSON
      </button>
    </div>
  );
}

export default React.memo(ExportButtons)
