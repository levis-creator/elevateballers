import React from 'react';
import { formatMatchDate } from '../../matches/lib/utils';

interface Fixture {
  id: string;
  date: Date | string;
  team1Name: string;
  team2Name: string;
  league: string;
  venue?: string;
  status: string;
}

interface FixturesTableProps {
  matches: Fixture[];
}

function abbr(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return name.slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const STATUS_COLORS: Record<string, string> = {
  LIVE: '#ef4444',
  UPCOMING: '#3b82f6',
  POSTPONED: '#f59e0b',
};

export const FixturesTable: React.FC<FixturesTableProps> = ({ matches }) => {
  if (matches.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
        No upcoming fixtures scheduled.
      </div>
    );
  }

  return (
    <>
      <div className="match-card-grid">
        {matches.map((match) => {
          const statusColor = STATUS_COLORS[match.status] ?? '#6b7280';
          return (
            <a
              key={match.id}
              href={`/matches/${match.id}`}
              className="match-card match-card--fixture"
              aria-label={`${match.team1Name} vs ${match.team2Name}`}
            >
              {/* Card header */}
              <div className="match-card__header">
                <span className="match-card__league">{match.league.toUpperCase()}</span>
                <span className="match-card__date">{formatMatchDate(match.date)}</span>
              </div>

              {/* Teams row */}
              <div className="match-card__body">
                <div className="match-card__team match-card__team--left">
                  <span className="match-card__badge">{abbr(match.team1Name)}</span>
                  <span className="match-card__team-name">{match.team1Name}</span>
                </div>

                <div className="match-card__vs">
                  <span>VS</span>
                  <span
                    className="match-card__status"
                    style={{ backgroundColor: statusColor }}
                  >
                    {match.status}
                  </span>
                </div>

                <div className="match-card__team match-card__team--right">
                  <span className="match-card__team-name">{match.team2Name}</span>
                  <span className="match-card__badge">{abbr(match.team2Name)}</span>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      <style>{`
        .match-card-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        @media (max-width: 767px) {
          .match-card-grid {
            grid-template-columns: 1fr;
          }
        }

        .match-card {
          display: block;
          background: #16152c;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 1rem 1.25rem 1.25rem;
          text-decoration: none;
          color: inherit;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
        }

        .match-card:hover {
          border-color: rgba(221, 51, 51, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }

        .match-card__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.875rem;
        }

        .match-card__league {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #2dd4bf;
        }

        .match-card__date {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .match-card__body {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .match-card__team {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.625rem;
          min-width: 0;
        }

        .match-card__team--right {
          flex-direction: row-reverse;
          text-align: right;
        }

        .match-card__badge {
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #2a2847;
          color: #e5e7eb;
          font-size: 0.7rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .match-card__team-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: #f3f4f6;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .match-card__vs {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .match-card__vs > span:first-child {
          font-size: 0.85rem;
          font-weight: 800;
          color: #ffba00;
          letter-spacing: 0.05em;
        }

        .match-card__status {
          font-size: 0.55rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #fff;
          padding: 2px 6px;
          border-radius: 999px;
          text-transform: uppercase;
        }
      `}</style>
    </>
  );
};
