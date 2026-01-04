/**
 * MatchCard component
 * Displays a single match in card format
 */

import type { Match } from '@prisma/client';
import { formatMatchDate, formatMatchTime, getMatchStatusColor, getMatchStatusLabel } from '../lib/utils';
import { getTeam1Name, getTeam1Logo, getTeam2Name, getTeam2Logo } from '../lib/team-helpers';
import { getLeagueName } from '../lib/league-helpers';

interface MatchCardProps {
  match: Match;
  showLeague?: boolean;
  showDate?: boolean;
  showTime?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

export default function MatchCard({
  match,
  showLeague = true,
  showDate = true,
  showTime = true,
  compact = false,
  onClick,
}: MatchCardProps) {
  const statusColor = getMatchStatusColor(match.status);
  const statusLabel = getMatchStatusLabel(match.status);
  const hasScore = match.team1Score !== null && match.team2Score !== null;
  const team1Name = getTeam1Name(match);
  const team1Logo = getTeam1Logo(match);
  const team2Name = getTeam2Name(match);
  const team2Logo = getTeam2Logo(match);

  if (compact) {
    return (
      <div
        className={`match-card-compact ${onClick ? 'clickable' : ''}`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        <div className="match-card-header-compact">
          {showLeague && <span className="match-league-compact">{getLeagueName(match)}</span>}
          <span
            className="match-status-badge-compact"
            style={{ backgroundColor: statusColor, color: 'white' }}
          >
            {statusLabel}
          </span>
        </div>
        <div className="match-teams-compact">
          <div className="match-team-compact">
            {team1Logo && (
              <img
                src={team1Logo}
                alt={team1Name}
                className="team-logo-compact"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <span className="team-name-compact">{team1Name}</span>
            {hasScore && <span className="team-score-compact">{match.team1Score}</span>}
          </div>
          <span className="vs-compact">vs</span>
          <div className="match-team-compact">
            {team2Logo && (
              <img
                src={team2Logo}
                alt={team2Name}
                className="team-logo-compact"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <span className="team-name-compact">{team2Name}</span>
            {hasScore && <span className="team-score-compact">{match.team2Score}</span>}
          </div>
        </div>
        {(showDate || showTime) && (
          <div className="match-date-compact">
            {showDate && formatMatchDate(match.date)}
            {showDate && showTime && ' • '}
            {showTime && formatMatchTime(match.date)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`match-card ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
        <div className="match-card-header">
          {showLeague && <span className="match-league">{getLeagueName(match)}</span>}
        <span
          className="match-status-badge"
          style={{ backgroundColor: statusColor, color: 'white' }}
        >
          {statusLabel}
        </span>
      </div>
      <div className="match-card-teams">
        <div className="match-team">
          {team1Logo && (
            <img
              src={team1Logo}
              alt={team1Name}
              className="team-logo"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <span className="team-name">{team1Name}</span>
          {hasScore && <span className="team-score">{match.team1Score}</span>}
        </div>
        <span className="vs">vs</span>
        <div className="match-team">
          {team2Logo && (
            <img
              src={team2Logo}
              alt={team2Name}
              className="team-logo"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <span className="team-name">{team2Name}</span>
          {hasScore && <span className="team-score">{match.team2Score}</span>}
        </div>
      </div>
      {(showDate || showTime) && (
        <div className="match-card-footer">
          <div className="match-date">
            {showDate && formatMatchDate(match.date)}
            {showDate && showTime && ' • '}
            {showTime && formatMatchTime(match.date)}
          </div>
        </div>
      )}

      <style>{`
        .match-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
          transition: all 0.3s;
        }

        .match-card.clickable {
          cursor: pointer;
        }

        .match-card.clickable:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .match-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .match-league {
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 500;
        }

        .match-status-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.3rem 0.6rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .match-card-teams {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .match-team {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .team-logo {
          width: 40px;
          height: 40px;
          object-fit: contain;
        }

        .team-name {
          flex: 1;
          font-weight: 600;
          color: #1e293b;
          font-size: 1rem;
        }

        .team-score {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
        }

        .vs {
          text-align: center;
          color: #94a3b8;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .match-card-footer {
          padding-top: 1rem;
          border-top: 1px solid #f1f5f9;
        }

        .match-date {
          font-size: 0.875rem;
          color: #64748b;
        }

        /* Compact variant */
        .match-card-compact {
          background: white;
          border-radius: 8px;
          padding: 1rem;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
        }

        .match-card-compact.clickable {
          cursor: pointer;
        }

        .match-card-compact.clickable:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .match-card-header-compact {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .match-league-compact {
          font-size: 0.75rem;
          color: #64748b;
        }

        .match-status-badge-compact {
          display: inline-flex;
          padding: 0.2rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .match-teams-compact {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .match-team-compact {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .team-logo-compact {
          width: 24px;
          height: 24px;
          object-fit: contain;
        }

        .team-name-compact {
          flex: 1;
          font-weight: 500;
          color: #1e293b;
          font-size: 0.875rem;
        }

        .team-score-compact {
          font-size: 1rem;
          font-weight: 700;
          color: #1e293b;
        }

        .vs-compact {
          text-align: center;
          color: #94a3b8;
          font-size: 0.75rem;
        }

        .match-date-compact {
          font-size: 0.75rem;
          color: #64748b;
        }
      `}</style>
    </div>
  );
}

