/**
 * PROVENANCE
 * Created: 2025-11-15
 * Phase: 3 Lite - Empty States
 * Author: Claude Code
 *
 * EmptyState - Displayed when no opportunities exist
 */

import React from 'react';

export default function EmptyState({ message = 'No opportunities found', action = null }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1rem',
        textAlign: 'center',
        background: 'var(--bg-secondary)',
        border: '2px dashed var(--border-color)',
        borderRadius: '12px',
        minHeight: '300px'
      }}
    >
      <svg
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--text-muted)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginBottom: '1rem', opacity: 0.5 }}
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <h3
        style={{
          margin: 0,
          marginBottom: '0.5rem',
          fontSize: '1.25rem',
          fontWeight: 600,
          color: 'var(--text-heading)'
        }}
      >
        {message}
      </h3>
      <p
        style={{
          margin: 0,
          fontSize: '0.875rem',
          color: 'var(--text-muted)',
          maxWidth: '400px'
        }}
      >
        {action ? (
          action
        ) : (
          'Add some opportunities via the API to get started!'
        )}
      </p>
    </div>
  );
}
