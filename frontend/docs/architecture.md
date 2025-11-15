# Frontend Architecture

## Overview
React 18 + Vite 5 single-page application for opportunity evaluation and financial simulation.

## Tech Stack
- **Framework:** React 18.2.0
- **Build Tool:** Vite 5.0.8
- **Routing:** React Router DOM 7.9.6
- **Charting:** Recharts 2.8.0
- **Testing:** Vitest 4.0.9 + React Testing Library

## Folder Structure
```
src/
├── components/     # Reusable UI components
├── pages/          # Route-level page components
├── hooks/          # Custom React hooks
├── utils/          # Pure utility functions
├── styles/         # Global CSS and variables
└── __tests__/      # Test files
```

## Key Components
- **OpportunityCard:** Displays single opportunity with metrics
- **ExportButtons:** CSV/JSON export functionality
- **ThemeToggle:** Dark mode toggle with localStorage persistence
- **ChartWrapper:** Lazy-loaded Recharts container

## State Management
- Local component state (useState)
- localStorage for theme and scoring mode preferences
- No global state management library

## Styling
- Pure CSS with CSS variables
- No CSS-in-JS or utility frameworks
- Dark mode via `.dark` class on html element
- Responsive breakpoints: 767px (mobile), 1023px (tablet)
