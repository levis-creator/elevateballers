/**
 * MatchDetail component
 * Displays detailed information about a single match
 */

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

interface MatchDetailProps {
  match: Match;
}

export default function MatchDetail({ match }: MatchDetailProps) {
  const statusColor = getMatchStatusColor(match.status);
  const statusLabel = getMatchStatusLabel(match.status);
  const hasScore = match.team1Score !== null && match.team2Score !== null;
  const relativeTime = getRelativeTimeDescription(match.date);
  const team1Name = getTeam1Name(match);
  const team1Logo = getTeam1Logo(match);
  const team2Name = getTeam2Name(match);
  const team2Logo = getTeam2Logo(match);

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

