import { useEffect, useState } from 'react';
import { formatMatchDate } from '@/features/matches/lib/utils';
import { getLeagueName } from '@/features/matches/lib/league-helpers';

// The API includes the full team relation so logos/names from the relation
// take priority over the denormalised match-level fields.
type MatchWithTeams = {
  id: string;
  date: string | Date;
  status: string;
  leagueName?: string | null;
  team1Name?: string | null;
  team2Name?: string | null;
  team1Score?: number | null;
  team2Score?: number | null;
  // Denormalised logo fields (populated when match was created without a team relation)
  team1Logo?: string | null;
  team2Logo?: string | null;
  // Relation objects returned by the API include
  team1?: { id: string; name: string; logo?: string | null } | null;
  team2?: { id: string; name: string; logo?: string | null } | null;
  league?: { name: string } | null;
};

/** Resolve the best available logo URL, preferring the team relation logo. */
function resolveLogo(match: MatchWithTeams, side: 'team1' | 'team2'): string | null {
  const fromRelation = match[side]?.logo;
  const fromField   = side === 'team1' ? match.team1Logo : match.team2Logo;
  const raw = fromRelation || fromField || null;
  if (!raw) return null;
  // Make relative paths absolute so <img src> always works
  return raw.startsWith('/') || raw.startsWith('http') ? raw : `/${raw}`;
}

/** Resolve the best available team name. */
function resolveName(match: MatchWithTeams, side: 'team1' | 'team2'): string {
  const fromRelation = match[side]?.name;
  const fromField   = side === 'team1' ? match.team1Name : match.team2Name;
  return fromRelation || fromField || (side === 'team1' ? 'Team 1' : 'Team 2');
}

export default function RecentResultsCarousel() {
  const [matches, setMatches] = useState<MatchWithTeams[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/matches?status=completed')
      .then((res) => res.json())
      .then((data) => {
        setMatches(data.slice(0, 5));
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching results:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="upcoming-matches-redesign loading">
        <div className="section-header">
          <h2 className="section-title">RECENT RESULTS</h2>
          <div className="title-underline results-accent"></div>
        </div>
        <div className="skeleton-container">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card"></div>
          ))}
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return null;
  }

  return (
    <div className="upcoming-matches-redesign results-theme">
      <div className="section-header">
        <div className="header-content">
          <h2 className="section-title">RECENT RESULTS</h2>
          <span className="match-count">LATEST {matches.length} GAMES</span>
        </div>
        <div className="title-underline results-accent"></div>
      </div>

      <div className="matches-grid">
        {matches.map((match) => {
          const logo1  = resolveLogo(match, 'team1');
          const logo2  = resolveLogo(match, 'team2');
          const name1  = resolveName(match, 'team1');
          const name2  = resolveName(match, 'team2');
          return (
          <a key={match.id} href={`/matches/${(match as any).slug || match.id}/`} className="match-card-modern result-card">
            <div className="match-card-header">
              <span className="league-tag">{getLeagueName(match as any) || match.league?.name || match.leagueName || 'ELEVATE LEAGUE'}</span>
              <span className="match-time">{formatMatchDate(match.date as any)}</span>
            </div>

            <div className="match-card-body">
              <div className="team-entry team-home">
                <div className="logo-wrap">
                  {logo1 ? (
                    <img src={logo1} alt={name1} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <div className="initials">{name1.substring(0, 2).toUpperCase()}</div>
                  )}
                </div>
                <span className="name">{name1}</span>
              </div>

              <div className="score-display">
                <span className={`score ${Number(match.team1Score) > Number(match.team2Score) ? 'winner' : ''}`}>
                  {match.team1Score ?? '-'}
                </span>
                <span className="score-divider">-</span>
                <span className={`score ${Number(match.team2Score) > Number(match.team1Score) ? 'winner' : ''}`}>
                  {match.team2Score ?? '-'}
                </span>
              </div>

              <div className="team-entry team-away">
                <span className="name">{name2}</span>
                <div className="logo-wrap">
                  {logo2 ? (
                    <img src={logo2} alt={name2} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <div className="initials">{name2.substring(0, 2).toUpperCase()}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="match-card-footer">
              <span className="final-badge">FINAL RESULT</span>
              <span className="view-details">
                RECAP <i className="fas fa-arrow-right"></i>
              </span>
            </div>
          </a>
          );
        })}
      </div>

      <style>{`
        .upcoming-matches-redesign.results-theme {
          color: white;
          padding: 1rem 0;
        }

        .results-accent {
          background: #10b981 !important;
        }

        .score-display {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(0, 0, 0, 0.4);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .score {
          font-family: var(--font-heading);
          font-size: 1.8rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.6);
          min-width: 30px;
          text-align: center;
        }

        .score.winner {
          color: white;
          text-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
        }

        .score-divider {
          opacity: 0.3;
          font-weight: 900;
        }

        .result-card::before {
          background: #10b981 !important;
        }

        .final-badge {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 1px;
        }

        /* Re-using styles from NextMatchCarousel for consistency */
        .section-header { margin-bottom: 2rem; }
        .header-content { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 0.5rem; }
        .section-title { font-family: var(--font-heading); font-size: 2.5rem; margin: 0; color: white !important; line-height: 1; }
        .match-count { font-family: var(--font-heading); color: #10b981; letter-spacing: 2px; font-weight: 600; font-size: 0.9rem; }
        .title-underline { height: 4px; width: 60px; background: var(--color-primary, #dd3333); border-radius: 2px; }
        .matches-grid { display: flex; flex-direction: column; gap: 1rem; max-height: 600px; overflow-y: auto; padding-right: 0.5rem; }
        .matches-grid::-webkit-scrollbar { width: 4px; }
        .matches-grid::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        
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

        .match-card-header { display: flex; justify-content: space-between; align-items: center; }
        .league-tag { font-size: 0.75rem; font-weight: 700; color: #10b981; text-transform: uppercase; letter-spacing: 1px; }
        .match-time { font-size: 0.8rem; opacity: 0.7; font-weight: 500; }
        .match-card-body { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        .team-entry { flex: 1; display: flex; align-items: center; gap: 1rem; min-width: 0; }
        .team-away { justify-content: flex-end; text-align: right; }
        .logo-wrap { width: 36px; height: 36px; flex-shrink: 0; background: rgba(255, 255, 255, 0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 4px; }
        .logo-wrap img { width: 100%; height: 100%; object-fit: contain; }
        .initials { font-weight: 700; font-size: 0.8rem; color: var(--color-gray-400); }
        .name { font-family: var(--font-heading); font-size: 1.4rem; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .match-card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.05); font-size: 0.75rem; }
        .view-details { font-weight: 700; color: #10b981; display: flex; align-items: center; gap: 0.5rem; transition: transform 0.3s ease; }
        .match-card-modern:hover .view-details { transform: translateX(3px); }

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
          .section-title { font-size: 2rem; }
          .name { font-size: 1.1rem; }
          .team-entry { gap: 0.5rem; }
          .score { font-size: 1.4rem; }
        }
      `}</style>
    </div>
  );
}
