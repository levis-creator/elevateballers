import React, { useState, useEffect } from 'react';
import styles from './StandingsFilter.module.css';
import { configuredLeagueName, type PublicCompetitionSettings } from '@/features/settings/application/competitionSettings';

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
  settings: PublicCompetitionSettings;
}

export const StandingsFilter: React.FC<StandingsFilterProps> = ({ onFilterChange, settings }) => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Fetch leagues on mount
  useEffect(() => {
    const fetchLeagues = async () => {
      setLoading(true);
      try {
        const activeResponse = await fetch('/api/leagues?active=true');
        if (!activeResponse.ok) {
          throw new Error('Failed to fetch active leagues');
        }

        const activeLeagues = await activeResponse.json();
        if (Array.isArray(activeLeagues) && activeLeagues.length > 0) {
          setLeagues(activeLeagues);
          return;
        }

        const allResponse = await fetch('/api/leagues');
        if (!allResponse.ok) {
          throw new Error('Failed to fetch leagues');
        }

        const allLeagues = await allResponse.json();
        setLeagues(Array.isArray(allLeagues) ? allLeagues : []);
      } catch (error) {
        console.error('Failed to fetch leagues:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeagues();
  }, []);

  useEffect(() => {
    if (!leagues.length || selectedLeague) return;
    const remembered = settings.defaultLeague === 'Remember last choice' ? window.localStorage.getItem('eb-public-legacy-league') : null;
    const configured = settings.defaultLeague === 'Remember last choice'
      ? leagues.find((league) => league.id === remembered)
      : leagues.find((league, index) => configuredLeagueName(league.name, settings, index)?.code === settings.defaultLeague);
    if (configured) {
      setSelectedLeague(configured.id);
      onFilterChange(configured.id, undefined);
    }
  }, [leagues, selectedLeague, settings, onFilterChange]);

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
    if (settings.defaultLeague === 'Remember last choice' && leagueId) window.localStorage.setItem('eb-public-legacy-league', leagueId);
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
        <div className={styles.selectShell}>
          <select
            id="league-filter"
            value={selectedLeague}
            onChange={handleLeagueChange}
            className={styles.filterSelect}
          >
            {settings.allLabel && <option value="">{settings.allLabel}</option>}
            {leagues.map((league, index) => (
              <option key={league.id} value={league.id}>
                {configuredLeagueName(league.name, settings, index)?.name ?? league.name}
              </option>
            ))}
          </select>
          <span className={styles.selectChevron} aria-hidden="true">▾</span>
        </div>
      </div>

      {selectedLeague && seasons.length > 0 && (
        <div className={styles.filterGroup}>
          <label htmlFor="season-filter" className={styles.filterLabel}>
            Season:
          </label>
          <div className={styles.selectShell}>
            <select
              id="season-filter"
              value={selectedSeason}
              onChange={handleSeasonChange}
              className={styles.filterSelect}
            >
              <option value="">All Seasons</option>
            {seasons.slice(0, settings.archive ? settings.archiveYears : 1).map((season) => (
                <option key={season.id} value={season.id}>
                  {settings.seasonLabel ? `${season.name.replace(/\s+Season$/i, '')} ${settings.seasonLabel}` : season.name.replace(/\s+Season$/i, '')}
                </option>
              ))}
            </select>
            <span className={styles.selectChevron} aria-hidden="true">▾</span>
          </div>
        </div>
      )}
    </div>
  );
};
