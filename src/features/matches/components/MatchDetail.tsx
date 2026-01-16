/**
 * MatchDetail component
 * Displays detailed information about a single match
 */

import { useState, useEffect } from 'react';
import type { Match } from '@prisma/client';
import {
  formatMatchDate,
  formatMatchTime,
  formatMatchDateTime,
  getMatchStatusColor,
  getMatchStatusLabel,
  getRelativeTimeDescription,
} from '../lib/utils';
import { getTeam1Name, getTeam1Logo, getTeam2Name, getTeam2Logo } from '../lib/team-helpers';
import { getLeagueName } from '../lib/league-helpers';
import { useGameTrackingStore } from '../../game-tracking/stores/useGameTrackingStore';
import { Button } from '@/components/ui/button';

interface MatchDetailProps {
  match: Match;
}

export default function MatchDetail({ match: initialMatch }: MatchDetailProps) {
  const [match, setMatch] = useState(initialMatch);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { startGame, endGame } = useGameTrackingStore();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        // User is not authenticated
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const statusColor = getMatchStatusColor(match.status);
  const statusLabel = getMatchStatusLabel(match.status);
  const hasScore = match.team1Score !== null && match.team2Score !== null;
  const relativeTime = getRelativeTimeDescription(match.date);
  const team1Name = getTeam1Name(match);
  const team1Logo = getTeam1Logo(match);
  const team2Name = getTeam2Name(match);
  const team2Logo = getTeam2Logo(match);

  const handleStartGame = async () => {
    setIsLoading(true);
    try {
      await startGame(match.id);
      // Refresh match data
      const response = await fetch(`/api/matches/${match.id}`);
      if (response.ok) {
        const updatedMatch = await response.json();
        setMatch(updatedMatch);
      }
    } catch (error) {
      console.error('Failed to start game:', error);
      alert('Failed to start game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndGame = async () => {
    if (!confirm('Are you sure you want to end this game? This action cannot be undone.')) {
      return;
    }
    setIsLoading(true);
    try {
      await endGame(match.id);
      // Refresh match data
      const response = await fetch(`/api/matches/${match.id}`);
      if (response.ok) {
        const updatedMatch = await response.json();
        setMatch(updatedMatch);
      }
    } catch (error) {
      console.error('Failed to end game:', error);
      alert('Failed to end game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="match-detail">
      <div className="match-detail-header">
        <div className="match-detail-meta">
          <span className="match-league">{getLeagueName(match)}</span>
          <span
            className="match-status-badge"
            style={{ backgroundColor: statusColor, color: 'white' }}
          >
            {statusLabel}
          </span>
        </div>
        <div className="match-detail-date">
          <span className="date-label">Match Date</span>
          <span className="date-value">{formatMatchDateTime(match.date)}</span>
          <span className="date-relative">({relativeTime})</span>
        </div>
      </div>

      <div className="match-detail-teams">
        <div className="match-team-detail">
          {team1Logo && (
            <img
              src={team1Logo}
              alt={team1Name}
              className="team-logo-large"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <h3 className="team-name-large">{team1Name}</h3>
          {hasScore && (
            <div className="team-score-large">{match.team1Score}</div>
          )}
        </div>

        <div className="match-vs">
          <span className="vs-text">VS</span>
          {hasScore && (
            <span className="score-separator">-</span>
          )}
        </div>

        <div className="match-team-detail">
          {team2Logo && (
            <img
              src={team2Logo}
              alt={team2Name}
              className="team-logo-large"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <h3 className="team-name-large">{team2Name}</h3>
          {hasScore && (
            <div className="team-score-large">{match.team2Score}</div>
          )}
        </div>
      </div>

      {!hasScore && match.status === 'UPCOMING' && (
        <div className="match-detail-upcoming">
          <p>Match scheduled for {formatMatchDateTime(match.date)}</p>
        </div>
      )}

      {/* Game Control Buttons */}
      <div className="match-detail-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #f1f5f9', minHeight: '60px' }}>
        {match.status === 'UPCOMING' && (
          <button
            onClick={handleStartGame}
            disabled={isLoading}
            className="match-control-button start-button"
            style={{
              minWidth: '150px',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              borderRadius: '8px',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              backgroundColor: '#10b981',
              color: 'white',
              transition: 'all 0.2s',
            }}
          >
            {isLoading ? 'Starting...' : 'Start Game'}
          </button>
        )}
        {match.status === 'LIVE' && (
          <button
            onClick={handleEndGame}
            disabled={isLoading}
            className="match-control-button end-button"
            style={{
              minWidth: '150px',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              borderRadius: '8px',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              backgroundColor: '#ef4444',
              color: 'white',
              transition: 'all 0.2s',
            }}
          >
            {isLoading ? 'Ending...' : 'End Game'}
          </button>
        )}
        {match.status === 'COMPLETED' && (
          <div className="match-status-completed" style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
            <p>This match has been completed.</p>
          </div>
        )}
        {match.status !== 'UPCOMING' && match.status !== 'LIVE' && match.status !== 'COMPLETED' && (
          <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Match status: {match.status}
          </div>
        )}
      </div>

      <style>{`
        .match-detail {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .match-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 2px solid #f1f5f9;
        }

        .match-detail-meta {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .match-league {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
        }

        .match-status-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          width: fit-content;
        }

        .match-detail-date {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
        }

        .date-label {
          font-size: 0.75rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .date-value {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
        }

        .date-relative {
          font-size: 0.875rem;
          color: #64748b;
        }

        .match-detail-teams {
          display: flex;
          align-items: center;
          justify-content: space-around;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .match-team-detail {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .team-logo-large {
          width: 120px;
          height: 120px;
          object-fit: contain;
        }

        .team-name-large {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          text-align: center;
          margin: 0;
        }

        .team-score-large {
          font-size: 3rem;
          font-weight: 800;
          color: #1e293b;
        }

        .match-vs {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .vs-text {
          font-size: 1.25rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .score-separator {
          font-size: 2rem;
          font-weight: 700;
          color: #94a3b8;
        }

        .match-detail-upcoming {
          text-align: center;
          padding: 1.5rem;
          background: #f8fafc;
          border-radius: 8px;
          color: #64748b;
        }

        .match-detail-controls {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 2px solid #f1f5f9;
          min-height: 60px;
        }

        .match-control-button {
          min-width: 150px;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          font-weight: 600;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .match-control-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .start-button {
          background-color: #10b981 !important;
          color: white !important;
        }

        .start-button:hover:not(:disabled) {
          background-color: #059669 !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }

        .end-button {
          background-color: #ef4444 !important;
          color: white !important;
        }

        .end-button:hover:not(:disabled) {
          background-color: #dc2626 !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
        }

        .match-status-completed {
          text-align: center;
          color: #64748b;
          font-size: 0.875rem;
        }

        @media (max-width: 768px) {
          .match-detail {
            padding: 1.5rem;
          }

          .match-detail-header {
            flex-direction: column;
            gap: 1rem;
          }

          .match-detail-date {
            align-items: flex-start;
          }

          .match-detail-teams {
            flex-direction: column;
            gap: 1.5rem;
          }

          .team-logo-large {
            width: 80px;
            height: 80px;
          }

          .team-name-large {
            font-size: 1.25rem;
          }

          .team-score-large {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
}

