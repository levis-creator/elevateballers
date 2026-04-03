import React from 'react';
import type { TeamStanding } from '../../data/standingsData';
import styles from './StandingsTable.module.css';

interface StandingsTableProps {
  standings: TeamStanding[];
}

function teamInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'TM';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

function statTone(value: number) {
  if (value > 0) return styles.positive;
  if (value < 0) return styles.negative;
  return styles.neutral;
}

function TeamIdentity({ standing }: { standing: TeamStanding }) {
  const content = (
    <div className={styles.teamIdentity}>
      <div className={styles.logoShell}>
        {standing.logo ? (
          <img
            src={standing.logo}
            alt={standing.team}
            className={styles.teamLogo}
            onError={(event) => {
              (event.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <span className={styles.teamInitials}>{teamInitials(standing.team)}</span>
        )}
      </div>
      <div className={styles.teamMeta}>
        <span className={styles.teamName}>{standing.team}</span>
        <span className={styles.teamRecord}>
          {standing.won}W · {standing.lost}L{standing.drawn ? ` · ${standing.drawn}D` : ''}
        </span>
      </div>
    </div>
  );

  if (!standing.url) return content;

  return (
    <a href={standing.url} className={styles.teamLink}>
      {content}
    </a>
  );
}

function SummaryCards({ standings }: { standings: TeamStanding[] }) {
  const leaders = standings.slice(0, 3);

  if (leaders.length === 0) return null;

  return (
    <div className={styles.summaryGrid}>
      {leaders.map((standing, index) => (
        <div key={standing.teamId || standing.team} className={styles.summaryCard}>
          <div className={styles.summaryTop}>
            <span className={styles.summaryRank}>#{standing.rank}</span>
            <span className={styles.summaryLabel}>
              {index === 0 ? 'League Leader' : index === 1 ? 'Chasing Pack' : 'Top Contender'}
            </span>
          </div>
          <TeamIdentity standing={standing} />
          <div className={styles.summaryStats}>
            <div>
              <span className={styles.summaryStatLabel}>Points</span>
              <strong className={styles.summaryStatValue}>{standing.points}</strong>
            </div>
            <div>
              <span className={styles.summaryStatLabel}>Played</span>
              <strong className={styles.summaryStatValue}>{standing.played}</strong>
            </div>
            <div>
              <span className={styles.summaryStatLabel}>Diff</span>
              <strong className={`${styles.summaryStatValue} ${statTone(standing.goalDifference)}`}>
                {standing.goalDifference > 0 ? '+' : ''}
                {standing.goalDifference}
              </strong>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ standings }) => {
  const openStanding = (standing: TeamStanding) => {
    if (!standing.url || typeof window === 'undefined') return;
    window.location.href = standing.url;
  };

  const handleRowKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>, standing: TeamStanding) => {
    if (!standing.url) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openStanding(standing);
    }
  };

  return (
    <div className={styles.standingsBoard}>
      <SummaryCards standings={standings} />

      <div className={styles.desktopTableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Team</th>
              <th>P</th>
              <th>W</th>
              <th>D</th>
              <th>L</th>
              <th>PF</th>
              <th>PA</th>
              <th>Diff</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standing) => (
              <tr
                key={standing.teamId || standing.team}
                className={standing.url ? styles.clickableRow : undefined}
                onClick={standing.url ? () => openStanding(standing) : undefined}
                onKeyDown={standing.url ? (event) => handleRowKeyDown(event, standing) : undefined}
                tabIndex={standing.url ? 0 : undefined}
                role={standing.url ? 'link' : undefined}
              >
                <td>
                  <span className={`${styles.rankBadge} ${standing.rank <= 3 ? styles.rankBadgeTop : ''}`}>
                    {standing.rank}
                  </span>
                </td>
                <td>
                  <TeamIdentity standing={standing} />
                </td>
                <td>{standing.played}</td>
                <td>{standing.won}</td>
                <td>{standing.drawn}</td>
                <td>{standing.lost}</td>
                <td>{standing.goalsFor}</td>
                <td>{standing.goalsAgainst}</td>
                <td className={statTone(standing.goalDifference)}>
                  {standing.goalDifference > 0 ? '+' : ''}
                  {standing.goalDifference}
                </td>
                <td>
                  <strong className={styles.pointsValue}>{standing.points}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.mobileList}>
        {standings.map((standing) => (
          <div key={standing.teamId || standing.team} className={styles.mobileCard}>
            <div className={styles.mobileCardTop}>
              <span className={`${styles.rankBadge} ${standing.rank <= 3 ? styles.rankBadgeTop : ''}`}>
                {standing.rank}
              </span>
              <span className={styles.mobilePoints}>{standing.points} pts</span>
            </div>
            <TeamIdentity standing={standing} />
            <div className={styles.mobileStats}>
              <div>
                <span>Played</span>
                <strong>{standing.played}</strong>
              </div>
              <div>
                <span>Wins</span>
                <strong>{standing.won}</strong>
              </div>
              <div>
                <span>Losses</span>
                <strong>{standing.lost}</strong>
              </div>
              <div>
                <span>Diff</span>
                <strong className={statTone(standing.goalDifference)}>
                  {standing.goalDifference > 0 ? '+' : ''}
                  {standing.goalDifference}
                </strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .${styles.table} {
          background: #14111f;
        }

        .${styles.table} thead tr {
          background: #ffba00 !important;
        }

        .${styles.table} thead th {
          background: transparent !important;
          color: #261f45 !important;
        }

        .${styles.table} tbody tr {
          background: #14111f !important;
        }

        .${styles.table} tbody tr:hover {
          background: #211c33 !important;
        }

        .${styles.table} tbody td {
          background: transparent !important;
          color: #e5e7eb !important;
        }
      `}</style>
    </div>
  );
};

export default StandingsTable;
