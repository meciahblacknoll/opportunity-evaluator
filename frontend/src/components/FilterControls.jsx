/**
 * PROVENANCE
 * Created: 2025-11-15
 * Phase: 3 Lite - Filtering Controls
 * Author: Claude Code
 */

import React from 'react';

export default function FilterControls({ filters, onFilterChange, opportunities = [] }) {
  // Extract unique banks and types from opportunities
  const availableBanks = React.useMemo(() => {
    const banks = new Set();
    opportunities.forEach(opp => {
      if (opp.bank || opp.issuer) {
        banks.add(opp.bank || opp.issuer);
      }
    });
    return Array.from(banks).sort();
  }, [opportunities]);

  const availableTypes = React.useMemo(() => {
    const types = new Set();
    opportunities.forEach(opp => {
      if (opp.type || opp.category) {
        types.add(opp.type || opp.category);
      }
    });
    return Array.from(types).sort();
  }, [opportunities]);

  const handleBankToggle = (bank) => {
    const newBanks = filters.banks.includes(bank)
      ? filters.banks.filter(b => b !== bank)
      : [...filters.banks, bank];
    onFilterChange({ ...filters, banks: newBanks });
  };

  const handleTypeToggle = (type) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    onFilterChange({ ...filters, types: newTypes });
  };

  const handleMinAPRChange = (value) => {
    onFilterChange({ ...filters, minAPR: Number(value) || 0 });
  };

  const handleMinProfitChange = (value) => {
    onFilterChange({ ...filters, minProfit: Number(value) || 0 });
  };

  const resetFilters = () => {
    onFilterChange({
      banks: [],
      types: [],
      minAPR: 0,
      minProfit: 0
    });
  };

  const hasActiveFilters = filters.banks.length > 0 ||
                           filters.types.length > 0 ||
                           filters.minAPR > 0 ||
                           filters.minProfit > 0;

  return (
    <div style={{
      padding: '1rem',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      marginBottom: '1rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-heading)' }}>Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            style={{
              padding: '4px 12px',
              fontSize: '13px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              cursor: 'pointer',
              color: 'var(--text-primary)'
            }}
          >
            Reset
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {/* Bank Filter */}
        {availableBanks.length > 0 && (
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
              Banks
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {availableBanks.map(bank => (
                <label key={bank} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '14px', color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={filters.banks.includes(bank)}
                    onChange={() => handleBankToggle(bank)}
                  />
                  {bank}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Type Filter */}
        {availableTypes.length > 0 && (
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
              Types
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {availableTypes.map(type => (
                <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '14px', color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={filters.types.includes(type)}
                    onChange={() => handleTypeToggle(type)}
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Min APR */}
        <div>
          <label htmlFor="min-apr" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Min APR (%)
          </label>
          <input
            id="min-apr"
            type="number"
            min="0"
            step="0.1"
            value={filters.minAPR}
            onChange={(e) => handleMinAPRChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        {/* Min Profit */}
        <div>
          <label htmlFor="min-profit" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Min Profit ($)
          </label>
          <input
            id="min-profit"
            type="number"
            min="0"
            step="100"
            value={filters.minProfit}
            onChange={(e) => handleMinProfitChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}
          />
        </div>
      </div>
    </div>
  );
}
