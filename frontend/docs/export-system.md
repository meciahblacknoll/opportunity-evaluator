# Export System

## Overview
Client-side CSV and JSON export using pure browser APIs. No backend required.

## Implementation
**Component:** `src/components/ExportButtons.jsx`

### Features
- CSV export with proper escaping
- JSON export with pretty-printing
- Blob API + URL.createObjectURL for downloads
- Handles nested objects and arrays
- UTF-8 encoding

### CSV Format
- Headers from object keys
- Nested objects/arrays converted to JSON strings
- Quote escaping (double quotes)
- Comma and newline handling

### Usage Locations
1. **TopOpportunities:** Exports filtered opportunity list
2. **SimulatePage:** Exports complete simulation results

### File Naming
- `opportunities.csv` / `opportunities.json`
- `simulation.csv` / `simulation.json`

## Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Supported
