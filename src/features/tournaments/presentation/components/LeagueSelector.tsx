/**
 * LeagueSelector — picks which league's playoffs to view. Each option carries
 * its own destination href, so the loader decides whether choosing a league
 * filters the current season (?league=) or switches to another season entirely.
 */
import React from 'react';
import { navigate } from 'astro:transitions/client';

export interface LeagueOption {
  label: string;
  value: string;
  href: string;
}

interface LeagueSelectorProps {
  options: LeagueOption[];
  currentValue: string;
}

export default function LeagueSelector({ options, currentValue }: LeagueSelectorProps) {
  // Nothing to switch between → don't render a single-option dropdown.
  if (options.length <= 1) return null;

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === currentValue) return;
    const target = options.find((o) => o.value === value);
    if (target) navigate(target.href);
  };

  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        fontWeight: 700,
        color: '#1f2733',
      }}
    >
      <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        League
      </span>
      <select
        value={currentValue}
        onChange={handleChange}
        style={{
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid #d9dee5',
          background: '#fff',
          fontSize: '0.95rem',
          fontWeight: 600,
          color: '#1f2733',
          cursor: 'pointer',
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
