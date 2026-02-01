import React, { useState, useEffect } from 'react';
import { StandingsFilter } from './StandingsFilter';
import { StandingsTable } from './StandingsTable';
import type { TeamStanding } from '../data/standingsData';
import styles from './StandingsPage.module.css';

interface StandingsPageProps {
  initialStandings: TeamStanding[];
}

export const StandingsPage: React.FC<StandingsPageProps> = ({ initialStandings }) => {
  const [standings, setStandings] = useState<TeamStanding[]>(initialStandings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setStandings(data.length > 0 ? data : initialStandings);
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
      <StandingsFilter onFilterChange={handleFilterChange} />
      
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
      ) : standings.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No standings data available for the selected filters.</p>
        </div>
      ) : (
        <StandingsTable standings={standings} />
      )}
    </div>
  );
};
