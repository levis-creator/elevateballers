import React, { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../../../shared/components/DataTable/DataTable';
import type { TeamStanding } from '../../data/standingsData';

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
          const isTop3 = rank <= 3;
          return (
            <div className="flex items-center justify-center">
              <span
                className={cn(
                  'inline-flex h-7 min-w-[28px] items-center justify-center rounded px-1 text-xs font-semibold',
                  isTop3
                    ? 'bg-gradient-to-br from-yellow-400 to-yellow-300 text-gray-900 shadow-sm'
                    : 'bg-gray-100 text-gray-600',
                )}
              >
                {rank}
              </span>
            </div>
          );
        },
        meta: { className: 'text-center' },
      },
      {
        header: 'Team',
        accessorKey: 'team',
        cell: (info) => {
          const team = info.row.original;
          const content = (
            <div className="flex items-center gap-3">
              {team.logo && (
                <img
                  src={team.logo}
                  alt={team.team}
                  className="h-8 w-8 rounded object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <span className="font-bold text-brand-body">{team.team}</span>
            </div>
          );

          return team.url ? (
            <a
              href={team.url}
              className="block no-underline transition-colors hover:[&_span]:text-brand-link"
            >
              {content}
            </a>
          ) : (
            content
          );
        },
        meta: { className: 'text-left pl-5' },
      },
      { header: 'P',   accessorKey: 'played',         meta: { className: 'text-center' } },
      { header: 'W',   accessorKey: 'won',             meta: { className: 'text-center' } },
      { header: 'D',   accessorKey: 'drawn',           meta: { className: 'text-center' } },
      { header: 'L',   accessorKey: 'lost',            meta: { className: 'text-center' } },
      { header: 'GF',  accessorKey: 'goalsFor',        meta: { className: 'text-center' } },
      { header: 'GA',  accessorKey: 'goalsAgainst',    meta: { className: 'text-center' } },
      {
        header: 'GD',
        accessorKey: 'goalDifference',
        cell: (info) => {
          const val = info.getValue<number>();
          const colorClass =
            val > 0 ? 'text-green-600' : val < 0 ? 'text-red-600' : 'text-gray-500';
          return (
            <span className={`font-semibold ${colorClass}`}>
              {val > 0 ? '+' : ''}{val}
            </span>
          );
        },
        meta: { className: 'text-center' },
      },
      {
        header: 'Pts',
        accessorKey: 'points',
        cell: (info) => (
          <strong className="text-base font-bold text-brand-red">
            {info.getValue<number>()}
          </strong>
        ),
        meta: { className: 'text-center' },
      },
    ],
    [],
  );

  return <DataTable data={standings} columns={columns} />;
};

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}
