/**
 * PROVENANCE
 * Created: 2025-11-15
 * Phase: 3 Lite - Empty States
 * Author: Claude Code
 *
 * LoadingSkeleton - Animated loading state for opportunity cards
 */

import React from 'react';

export default function LoadingSkeleton({ count = 3 }) {
  return (
    <div className="opportunities-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="skeleton-card"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '1.5rem',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}
        >
          <div
            style={{
              height: '24px',
              width: '70%',
              background: 'var(--bg-tertiary)',
              borderRadius: '4px',
              marginBottom: '1rem'
            }}
          />
          <div
            style={{
              height: '16px',
              width: '40%',
              background: 'var(--bg-tertiary)',
              borderRadius: '4px',
              marginBottom: '0.5rem'
            }}
          />
          <div
            style={{
              height: '16px',
              width: '50%',
              background: 'var(--bg-tertiary)',
              borderRadius: '4px',
              marginBottom: '0.5rem'
            }}
          />
          <div
            style={{
              height: '16px',
              width: '60%',
              background: 'var(--bg-tertiary)',
              borderRadius: '4px'
            }}
          />
        </div>
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
