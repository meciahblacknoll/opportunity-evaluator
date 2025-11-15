# Dark Mode Implementation

## System
CSS variables + `.dark` class on `<html>` element

## Theme Toggle
**Component:** `src/components/ThemeToggle.jsx`

### Features
- Detects system preference on initial load
- Persists choice in localStorage
- Smooth transitions (0.3s ease)
- Keyboard accessible

## CSS Variables

### Light Mode
```css
--bg-primary: #f5f5f5
--bg-secondary: #ffffff
--text-primary: #333333
--accent-primary: #3498db
--accent-success: #27ae60
```

### Dark Mode
```css
--bg-primary: #1a202c
--bg-secondary: #2d3748
--text-primary: #e2e8f0
--accent-primary: #4299e1
--accent-success: #48bb78
```

## Implementation Pattern
All colors use `var(--variable-name)` instead of hardcoded values.

## Chart Colors
Recharts components inherit colors via CSS variables:
- `--chart-line`: Line stroke color
- `--chart-fill`: Area fill color
- `--sparkline-bg`: Empty state background

## Testing
Verify all pages in both modes:
- Navigation visibility
- Card readability
- Chart contrast
- Button states
