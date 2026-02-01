import React, { useState, useEffect } from 'react';
import styles from './StandingsFilter.module.css';

interface League {
  id: string;
  name: string;
  slug: string;
}

interface Season {
  id: string;
  name: string;
  slug: string;
  leagueId: string;
}

interface StandingsFilterProps {
  onFilterChange: (leagueId?: string, seasonId?: string) => void;
}

export const StandingsFilter: React.FC<StandingsFilterProps> = ({ onFilterChange }) => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Fetch leagues on mount
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const response = await fetch('/api/leagues');
        if (response.ok) {
          const data = await response.json();
          setLeagues(data);
        }
      } catch (error) {
        console.error('Failed to fetch leagues:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeagues();
  }, []);

  // Fetch seasons when league changes
  useEffect(() => {
    if (!selectedLeague) {
      setSeasons([]);
      setSelectedSeason('');
      return;
    }

    const fetchSeasons = async () => {
      try {
        const response = await fetch(`/api/seasons?leagueId=${selectedLeague}`);
        if (response.ok) {
          const data = await response.json();
          setSeasons(data);
        }
      } catch (error) {
        console.error('Failed to fetch seasons:', error);
      }
    };

    fetchSeasons();
  }, [selectedLeague]);

  const handleLeagueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const leagueId = e.target.value;
    setSelectedLeague(leagueId);
    setSelectedSeason('');
    onFilterChange(leagueId || undefined, undefined);
  };

  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const seasonId = e.target.value;
    setSelectedSeason(seasonId);
    onFilterChange(selectedLeague || undefined, seasonId || undefined);
  };

  if (loading) {
    return <div className={styles.filterLoading}>Loading filters...</div>;
  }

  if (leagues.length === 0) {
    return null;
  }

  return (
    <div className={styles.filterContainer}>
      <div className={styles.filterGroup}>
        <label htmlFor="league-filter" className={styles.filterLabel}>
          League:
        </label>
        <select
          id="league-filter"
          value={selectedLeague}
          onChange={handleLeagueChange}
          className={styles.filterSelect}
        >
          <option value="">All Leagues</option>
          {leagues.map((league) => (
            <option key={league.id} value={league.id}>
              {league.name}
            </option>
          ))}
        </select>
      </div>

      {selectedLeague && seasons.length > 0 && (
        <div className={styles.filterGroup}>
          <label htmlFor="season-filter" className={styles.filterLabel}>
            Season:
          </label>
          <select
            id="season-filter"
            value={selectedSeason}
            onChange={handleSeasonChange}
            className={styles.filterSelect}
          >
            <option value="">All Seasons</option>
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
