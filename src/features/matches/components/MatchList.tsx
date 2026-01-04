/**
 * MatchList component
 * Displays a list of matches with filtering and sorting
 */

import { useState, useEffect } from 'react';
import type { Match, MatchStatus } from '@prisma/client';
import MatchCard from './MatchCard';
import { formatMatchDate, formatMatchTime } from '../lib/utils';

interface MatchListProps {
  matches: Match[];
  showFilters?: boolean;
  showLeague?: boolean;
  compact?: boolean;
  onMatchClick?: (match: Match) => void;
}

export default function MatchList({
  matches,
  showFilters = false,
  showLeague = true,
  compact = false,
  onMatchClick,
}: MatchListProps) {
  const [filteredMatches, setFilteredMatches] = useState<Match[]>(matches);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [leagueFilter, setLeagueFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    let filtered = [...matches];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((m) => m.status === statusFilter.toUpperCase());
    }

    // League filter
    if (leagueFilter !== 'all') {
      filtered = filtered.filter((m) => getLeagueName(m) === leagueFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          (m.team1Name && m.team1Name.toLowerCase().includes(term)) ||
          (m.team2Name && m.team2Name.toLowerCase().includes(term)) ||
          getLeagueName(m).toLowerCase().includes(term)
      );
    }

    setFilteredMatches(filtered);
  }, [matches, statusFilter, leagueFilter, searchTerm]);

  // Get unique leagues for filter
  const leagues = Array.from(new Set(matches.map((m) => getLeagueName(m)))).sort();

  if (matches.length === 0) {
    return (
      <div className="match-list-empty">
        <p>No matches found.</p>
      </div>
    );
  }

  return (
    <div className="match-list">
      {showFilters && (
        <div className="match-list-filters">
          <div className="filter-group">
            <label htmlFor="status-filter">Status:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="upcoming">Upcoming</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {leagues.length > 0 && (
            <div className="filter-group">
              <label htmlFor="league-filter">League:</label>
              <select
                id="league-filter"
                value={leagueFilter}
                onChange={(e) => setLeagueFilter(e.target.value)}
              >
                <option value="all">All Leagues</option>
                {leagues.map((league) => (
                  <option key={league} value={league}>
                    {league}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="filter-group">
            <label htmlFor="search-filter">Search:</label>
            <input
              id="search-filter"
              type="text"
              placeholder="Search matches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}

      {filteredMatches.length === 0 ? (
        <div className="match-list-empty">
          <p>No matches match your filters.</p>
        </div>
      ) : (
        <div className={`match-list-grid ${compact ? 'compact' : ''}`}>
          {filteredMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              showLeague={showLeague}
              compact={compact}
              onClick={onMatchClick ? () => onMatchClick(match) : undefined}
            />
          ))}
        </div>
      )}

      <style>{`
        .match-list {
          width: 100%;
        }

        .match-list-filters {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #1e293b;
        }

        .filter-group select,
        .filter-group input {
          padding: 0.5rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.875rem;
          background: white;
          color: #1e293b;
        }

        .filter-group select:focus,
        .filter-group input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .match-list-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .match-list-grid.compact {
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
        }

        .match-list-empty {
          text-align: center;
          padding: 3rem 1rem;
          color: #64748b;
        }

        @media (max-width: 768px) {
          .match-list-grid {
            grid-template-columns: 1fr;
          }

          .match-list-filters {
            flex-direction: column;
          }

          .filter-group {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

