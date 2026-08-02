import React, { useState, useEffect } from 'react';
import { StandingsFilter } from './StandingsFilter';
import { StandingsTable } from './StandingsTable';
import type { TeamStanding } from '../../data/standingsData';
import styles from './StandingsPage.module.css';
import type { PublicCompetitionSettings } from '@/features/settings/application/competitionSettings';
import type { PublicStandingsSettings } from '@/features/settings/application/standingsSettings';

interface StandingsPageProps {
  initialStandings: TeamStanding[];
  settings: PublicStandingsSettings;
  competitionSettings: PublicCompetitionSettings;
}

export const StandingsPage: React.FC<StandingsPageProps> = ({ initialStandings, settings, competitionSettings }) => {
  const [standings, setStandings] = useState<TeamStanding[]>(initialStandings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // Fetch all standings on initial mount (client-side) to ensure fresh data
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const response = await fetch('/api/standings');
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setStandings(data);
          }
        }
      } catch (err) {
        console.error('Error fetching initial standings:', err);
      }
    };
    fetchInitial();
  }, []);

  const handleFilterChange = async (leagueId?: string, seasonId?: string) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (leagueId) params.append('leagueId', leagueId);
      if (seasonId) params.append('seasonId', seasonId);

      const response = await fetch(`/api/standings?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch standings');
      }

      const data = await response.json();
      setStandings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching standings:', err);
      setError('Failed to load standings. Please try again.');
      setStandings(initialStandings);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.standingsPage}>
      <StandingsFilter onFilterChange={handleFilterChange} settings={competitionSettings} />
      {settings.search && <input aria-label="Search teams" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search teams…" style={{ width: '100%', margin: '0 0 24px', padding: '12px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,.16)', background: '#211c33', color: '#fff' }} />}
      
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading standings...</p>
        </div>
      ) : standings.filter((row) => row.team.toLowerCase().includes(query.trim().toLowerCase())).length === 0 ? (
        <div className={styles.emptyState}>
          <p>No standings data available for the selected filters.</p>
        </div>
      ) : (
        <StandingsTable standings={standings.filter((row) => row.team.toLowerCase().includes(query.trim().toLowerCase()))} settings={settings} />
      )}
    </div>
  );
};
