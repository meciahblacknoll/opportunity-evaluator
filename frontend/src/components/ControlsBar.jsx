/**
 * PROVENANCE
 * Created: 2025-11-15
 * Phase: 3 Lite - ControlsBar Layout Component
 * Author: Claude Code
 *
 * ControlsBar - Wraps controls in a clean layout bar
 * - Horizontal on desktop
 * - Vertical stack on mobile
 * - Light border + subtle shadow
 * - Dark mode compatible
 */

import React from 'react';

export default function ControlsBar({ children, className = '' }) {
  return (
    <div
      className={`controls-bar ${className}`}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '1rem',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '1rem'
      }}
    >
      {children}
    </div>
  );
}
