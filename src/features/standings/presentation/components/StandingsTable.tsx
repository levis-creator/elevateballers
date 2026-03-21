import React, { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../../../shared/components/DataTable/DataTable';
import type { TeamStanding } from '../../data/standingsData';
import styles from './StandingsTable.module.css';

interface StandingsTableProps {
  standings: TeamStanding[];
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ standings }) => {
  const columns = useMemo<ColumnDef<TeamStanding>[]>(
    () => [
      {
        header: 'Rank',
        accessorKey: 'rank',
        cell: (info) => {
          const rank = info.getValue<number>();
          return (
            <div className={styles.rankCell}>
              <span className={`${styles.rankBadge} ${rank <= 3 ? styles.topThree : ''}`}>
                {rank}
              </span>
            </div>
          );
        },
        meta: { className: 'data-rank' },
      },
      {
        header: 'Team',
        accessorKey: 'team',
        cell: (info) => {
          const team = info.row.original;
          const content = (
            <div className={styles.teamCell}>
              {team.logo && (
                <img 
                  src={team.logo} 
                  alt={team.team}
                  className={styles.teamLogo}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <span className={styles.teamName}>{team.team}</span>
            </div>
          );
          
          return team.url ? (
            <a href={team.url} className={styles.teamLink}>{content}</a>
          ) : (
            content
          );
        },
        meta: { className: 'data-name' },
      },
      {
        header: 'P',
        accessorKey: 'played',
        meta: { className: 'data-played', headerTitle: 'Played' },
      },
      {
        header: 'W',
        accessorKey: 'won',
        meta: { className: 'data-won', headerTitle: 'Won' },
      },
      {
        header: 'D',
        accessorKey: 'drawn',
        meta: { className: 'data-drawn', headerTitle: 'Drawn' },
      },
      {
        header: 'L',
        accessorKey: 'lost',
        meta: { className: 'data-lost', headerTitle: 'Lost' },
      },
      {
        header: 'GF',
        accessorKey: 'goalsFor',
        meta: { className: 'data-goals-for', headerTitle: 'Goals For' },
      },
      {
        header: 'GA',
        accessorKey: 'goalsAgainst',
        meta: { className: 'data-goals-against', headerTitle: 'Goals Against' },
      },
      {
        header: 'GD',
        accessorKey: 'goalDifference',
        cell: (info) => {
          const val = info.getValue<number>();
          const className = val > 0 ? styles.positive : val < 0 ? styles.negative : styles.neutral;
          return (
            <span className={`${styles.goalDiff} ${className}`}>
              {val > 0 ? '+' : ''}{val}
            </span>
          );
        },
        meta: { className: 'data-goal-difference', headerTitle: 'Goal Difference' },
      },
      {
        header: 'Pts',
        accessorKey: 'points',
        cell: (info) => {
          const points = info.getValue<number>();
          return <strong className={styles.pointsCell}>{points}</strong>;
        },
        meta: { className: 'data-points', headerTitle: 'Points' },
      },
    ],
    []
  );

  return (
    <div className="sp-template sp-template-league-table">
      <DataTable 
        data={standings} 
        columns={columns} 
        tableClassName="sp-league-table"
      />
    </div>
  );
};


