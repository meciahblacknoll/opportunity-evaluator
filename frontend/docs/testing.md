# Testing Guide

## Test Framework
- **Runner:** Vitest 4.0.9
- **Library:** React Testing Library 16.3.0
- **Environment:** jsdom

## Running Tests
```bash
npm test              # Run all tests once
npm run test:watch    # Watch mode
```

## Test Structure
```
__tests__/
├── setup.js                    # Global test setup
├── test-utils.jsx              # Custom render helpers
├── utils/                      # Utility function tests
├── components/                 # Component tests
└── pages/                      # Page component tests
```

## Testing Patterns
- Mock heavy dependencies (Recharts, fetch)
- Use `renderWithProviders()` for router context
- Test user interactions, not implementation
- Verify accessibility with aria queries

## Coverage Areas
- Utility functions (100%)
- Critical components (OpportunityCard, ExportButtons)
- Page rendering and data flow
- Export functionality
