import React from 'react';
import { formatMatchDate } from '../../matches/lib/utils';

interface Result {
  id: string;
  date: Date | string;
  team1Name: string;
  team2Name: string;
  team1Score: number | string;
  team2Score: number | string;
  league: string;
  winnerName?: string;
  status: string;
}

interface ResultsTableProps {
  matches: Result[];
}

function abbr(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return name.slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ matches }) => {
  if (matches.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
        No results yet.
      </div>
    );
  }

  return (
    <>
      <div className="match-card-grid">
        {matches.map((match) => {
          const score1 = match.team1Score ?? '-';
          const score2 = match.team2Score ?? '-';
          const team1Won = match.winnerName === match.team1Name;
          const team2Won = match.winnerName === match.team2Name;

          return (
            <a
              key={match.id}
              href={`/matches/${match.id}`}
              className="match-card match-card--result"
              aria-label={`${match.team1Name} ${score1} - ${score2} ${match.team2Name}`}
            >
              {/* Card header */}
              <div className="match-card__header">
                <span className="match-card__league">{match.league.toUpperCase()}</span>
                <span className="match-card__date">{formatMatchDate(match.date)}</span>
              </div>

              {/* Teams + score row */}
              <div className="match-card__body">
                <div className={`match-card__team match-card__team--left${team1Won ? ' match-card__team--winner' : ''}`}>
                  <span className="match-card__badge">{abbr(match.team1Name)}</span>
                  <span className="match-card__team-name">{match.team1Name}</span>
                </div>

                <div className="match-card__scores">
                  <span className={`match-card__score${team1Won ? ' match-card__score--winner' : ''}`}>{score1}</span>
                  <span className={`match-card__score${team2Won ? ' match-card__score--winner' : ''}`}>{score2}</span>
                </div>

                <div className={`match-card__team match-card__team--right${team2Won ? ' match-card__team--winner' : ''}`}>
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

        .match-card__team--winner .match-card__team-name {
          color: #ffffff;
          font-weight: 700;
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
          color: #d1d5db;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .match-card__scores {
          flex-shrink: 0;
          display: flex;
          gap: 0.25rem;
        }

        .match-card__score {
          min-width: 2.5rem;
          padding: 0.375rem 0.5rem;
          background: #0f0e1a;
          border-radius: 6px;
          font-size: 1.3rem;
          font-weight: 900;
          color: #9ca3af;
          text-align: center;
          line-height: 1;
        }

        .match-card__score--winner {
          color: #ffffff;
        }
      `}</style>
    </>
  );
};
