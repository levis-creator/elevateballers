/**
 * SeasonSelector — dropdown that navigates between seasons' playoff pages.
 */
import React from 'react';
import { navigate } from 'astro:transitions/client';

export interface SeasonOption {
  slug: string;
  name: string;
}

interface SeasonSelectorProps {
  seasons: SeasonOption[];
  currentSlug: string;
}

export default function SeasonSelector({ seasons, currentSlug }: SeasonSelectorProps) {
  if (seasons.length <= 1) return null;

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const slug = event.target.value;
    if (slug && slug !== currentSlug) {
      navigate(`/playoffs/${slug}/`);
    }
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
        Season
      </span>
      <select
        value={currentSlug}
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
        {seasons.map((season) => (
          <option key={season.slug} value={season.slug}>
            {season.name}
          </option>
        ))}
      </select>
    </label>
  );
}
