import React, { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../../shared/components/DataTable/DataTable';
import type { TeamStanding } from '../data/standingsData';

interface StandingsTableProps {
  standings: TeamStanding[];
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ standings }) => {
  const columns = useMemo<ColumnDef<TeamStanding>[]>(
    () => [
      {
        header: 'Rank',
        accessorKey: 'rank',
        meta: { className: 'data-rank' },
      },
      {
        header: 'Team',
        accessorKey: 'team',
        cell: (info) => {
          const team = info.row.original;
          return team.url ? (
            <a href={team.url}>{team.team}</a>
          ) : (
            team.team
          );
        },
        meta: { className: 'data-name' },
      },
      {
        header: 'P',
        accessorKey: 'played',
        meta: { className: 'data-played' },
      },
      {
        header: 'W',
        accessorKey: 'won',
        meta: { className: 'data-won' },
      },
      {
        header: 'D',
        accessorKey: 'drawn',
        meta: { className: 'data-drawn' },
      },
      {
        header: 'L',
        accessorKey: 'lost',
        meta: { className: 'data-lost' },
      },
      {
        header: 'GF',
        accessorKey: 'goalsFor',
        meta: { className: 'data-goals-for' },
      },
      {
        header: 'GA',
        accessorKey: 'goalsAgainst',
        meta: { className: 'data-goals-against' },
      },
      {
        header: 'GD',
        accessorKey: 'goalDifference',
        cell: (info) => {
          const val = info.getValue<number>();
          return `${val > 0 ? '+' : ''}${val}`;
        },
        meta: { className: 'data-goal-difference' },
      },
      {
        header: 'Pts',
        accessorKey: 'points',
        meta: { className: 'data-points' },
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
