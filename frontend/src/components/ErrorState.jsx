/**
 * PROVENANCE
 * Created: 2025-11-15
 * Phase: 3 Lite - Empty States
 * Author: Claude Code
 *
 * ErrorState - Displayed when an error occurs during data fetching
 */

import React from 'react';

export default function ErrorState({ error, onRetry = null }) {
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
        border: '2px solid var(--error-border, #fee)',
        borderRadius: '12px',
        minHeight: '300px'
      }}
    >
      <svg
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--error-text, #dc3545)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginBottom: '1rem' }}
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
      <h3
        style={{
          margin: 0,
          marginBottom: '0.5rem',
          fontSize: '1.25rem',
          fontWeight: 600,
          color: 'var(--error-text, #dc3545)'
        }}
      >
        Error Loading Opportunities
      </h3>
      <p
        style={{
          margin: 0,
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          color: 'var(--text-muted)',
          maxWidth: '400px'
        }}
      >
        {error || 'An unexpected error occurred while fetching data.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '0.5rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--text-on-primary)',
            background: 'var(--accent-primary)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => (e.target.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.target.style.opacity = '1')}
        >
          Try Again
        </button>
      )}
    </div>
  );
}
