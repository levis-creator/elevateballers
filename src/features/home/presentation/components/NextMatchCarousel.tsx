import { useEffect, useState } from 'react';
import type { Match } from '@prisma/client';
import { formatMatchDate } from '@/features/matches/lib/utils';
import { getLeagueName } from '@/features/matches/lib/league-helpers';
import { getTeam1Logo, getTeam1Name, getTeam2Logo, getTeam2Name } from '@/features/matches/lib/team-helpers';

export default function NextMatchCarousel() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/matches?status=upcoming')
      .then((res) => res.json())
      .then((data) => {
        setMatches(data.slice(0, 5));
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching matches:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="upcoming-matches-redesign loading">
        <div className="section-header">
          <h2 className="section-title">UPCOMING MATCHES</h2>
          <div className="title-underline"></div>
        </div>
        <div className="skeleton-container">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="upcoming-matches-redesign">
      <div className="section-header">
        <div className="header-content">
          <h2 className="section-title">UPCOMING MATCHES</h2>
          <span className="match-count">{matches.length} SCHEDULED</span>
        </div>
        <div className="title-underline"></div>
      </div>

      {matches.length === 0 ? (
        <div className="no-matches-card">
          <div className="icon-wrap">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>NO MATCHES SCHEDULED</h3>
          <p>We're preparing the next season's schedule. Check back soon for the heat!</p>
          <a href="/upcoming_matches" className="btn-secondary-outline">View Full Schedule</a>
        </div>
      ) : (
        <div className="matches-grid">
          {matches.map((match) => {
            const team1Name = getTeam1Name(match);
            const team1Logo = getTeam1Logo(match);
            const team2Name = getTeam2Name(match);
            const team2Logo = getTeam2Logo(match);

            return (
              <a key={match.id} href={`/matches/${match.id}`} className="match-card-modern">
                <div className="match-card-header">
                  <span className="league-tag">{getLeagueName(match) || match.leagueName || 'ELEVATE LEAGUE'}</span>
                  <span className="match-time">{formatMatchDate(match.date)}</span>
                </div>
                
                <div className="match-card-body">
                  <div className="team-entry team-home">
                    <div className="logo-wrap">
                      {team1Logo ? (
                        <img src={team1Logo} alt={team1Name} />
                      ) : (
                        <div className="initials">{team1Name.substring(0, 2).toUpperCase()}</div>
                      )}
                    </div>
                    <span className="name">{team1Name}</span>
                  </div>

                  <div className="vs-divider">
                    <span className="vs-pill">VS</span>
                  </div>

                  <div className="team-entry team-away">
                    <span className="name">{team2Name}</span>
                    <div className="logo-wrap">
                      {team2Logo ? (
                        <img src={team2Logo} alt={team2Name} />
                      ) : (
                        <div className="initials">{team2Name.substring(0, 2).toUpperCase()}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="match-card-footer">
                  <span className="venue-info">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    MAIN ARENA
                  </span>
                  <span className="view-details">
                    DETAILS <i className="fas fa-arrow-right"></i>
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}

      <style>{`
        .upcoming-matches-redesign {
          color: white;
          padding: 1rem 0;
        }

        .section-header {
          margin-bottom: 2rem;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 0.5rem;
        }

        .section-title {
          font-family: var(--font-heading);
          font-size: 2.5rem;
          margin: 0;
          color: white !important;
          line-height: 1;
        }

        .match-count {
          font-family: var(--font-heading);
          color: var(--color-secondary, #ffba00);
          letter-spacing: 2px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .title-underline {
          height: 4px;
          width: 60px;
          background: var(--color-primary, #dd3333);
          border-radius: 2px;
        }

        .matches-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 600px;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .matches-grid::-webkit-scrollbar {
          width: 4px;
        }

        .matches-grid::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }

        .match-card-modern {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          text-decoration: none;
          color: white;
          transition: all 0.3s ease;
          position: relative;
        }

        .match-card-modern::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 4px;
          border-radius: 12px 0 0 12px;
          background: var(--color-primary, #dd3333);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .match-card-modern:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(5px);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .match-card-modern:hover::before {
          opacity: 1;
        }

        .match-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .league-tag {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--color-secondary, #ffba00);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .match-time {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.88);
          font-weight: 500;
        }

        .match-card-body {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .team-entry {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .team-away {
          justify-content: flex-end;
          text-align: right;
        }

        .logo-wrap {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 4px;
        }

        .logo-wrap img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .initials {
          font-weight: 700;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.9);
        }

        .name {
          font-family: var(--font-heading);
          font-size: 1.4rem;
          color: #ffffff;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .vs-divider {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .vs-pill {
          font-size: 0.7rem;
          font-weight: 900;
          background: var(--color-gray-800, #1a1a1c);
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--color-secondary, #ffba00);
          font-style: italic;
        }

        .match-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 0.75rem;
        }

        .venue-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.82);
        }

        .view-details {
          font-weight: 700;
          color: #ff6b6b;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: transform 0.3s ease;
        }

        .match-card-modern:hover .view-details {
          transform: translateX(3px);
        }

        /* Empty State */
        .no-matches-card {
          background: rgba(255, 255, 255, 0.03);
          border: 2px dashed rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 3rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .icon-wrap {
          color: var(--color-primary, #dd3333);
          background: rgba(221, 51, 51, 0.1);
          padding: 1.5rem;
          border-radius: 50%;
          margin-bottom: 0.5rem;
        }

        .no-matches-card h3 {
          margin: 0;
          font-size: 1.8rem;
          color: white !important;
        }

        .no-matches-card p {
          color: rgba(255, 255, 255, 0.6);
          max-width: 300px;
          margin: 0 auto;
        }

        .btn-secondary-outline {
          margin-top: 1rem;
          padding: 0.6rem 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 100px;
          color: white;
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .btn-secondary-outline:hover {
          background: white;
          color: black;
          border-color: white;
        }

        /* Skeleton Loading */
        .skeleton-card {
          height: 140px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          margin-bottom: 1rem;
          animation: pulse 1.5s infinite ease-in-out;
        }

        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 0.8; }
          100% { opacity: 0.5; }
        }

        @media (max-width: 768px) {
          .section-title {
            font-size: 2rem;
          }
          
          .name {
            font-size: 1.1rem;
          }
          
          .team-entry {
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}
