/**
 * PROVENANCE
 * Created: 2025-11-15
 * Phase: 2.5 - Dark Mode Implementation
 * Author: Claude Code
 *
 * ThemeToggle - Simple toggle for dark/light theme
 * Persists theme preference in localStorage
 */

import React, { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    // Initialize from localStorage or system preference
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';

    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Apply theme to html element
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={toggleTheme}
      style={{
        padding: '8px 12px',
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        color: 'var(--text-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s ease'
      }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? '☀️' : '🌙'}
      <span>{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
