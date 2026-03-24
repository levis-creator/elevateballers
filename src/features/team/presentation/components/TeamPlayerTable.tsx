import React, { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../../../shared/components/DataTable/DataTable';
import type { TeamPlayer } from '../../data/teamData';

interface TeamPlayerTableProps {
  players: TeamPlayer[];
}

function formatStat(value: number): string {
  return value === 0 ? '-' : value.toFixed(1);
}

function formatPercent(value: number): string {
  return value === 0 ? '-' : value.toFixed(1);
}

export const TeamPlayerTable: React.FC<TeamPlayerTableProps> = ({ players }) => {
  const columns = useMemo<ColumnDef<TeamPlayer>[]>(
    () => [
      {
        header: 'Player',
        accessorKey: 'name',
        cell: (info) => {
          const player = info.row.original;
          return player.url ? (
            <a
              href={player.url}
              className="font-bold text-brand-body no-underline transition-colors hover:text-brand-link"
            >
              {player.name}
            </a>
          ) : (
            <span className="font-bold text-brand-body">{player.name}</span>
          );
        },
        meta: { className: 'text-left pl-4' },
      },
      { header: 'Position', accessorKey: 'position',          meta: { className: 'text-center' } },
      { header: 'Height',   accessorKey: 'height',            meta: { className: 'text-center' } },
      { header: 'Weight',   accessorKey: 'weight',            meta: { className: 'text-center' } },
      { header: 'FG%',      accessorKey: 'fgPercent',         cell: (info) => formatPercent(info.getValue<number>()), meta: { className: 'text-center' } },
      { header: 'FT%',      accessorKey: 'ftPercent',         cell: (info) => formatPercent(info.getValue<number>()), meta: { className: 'text-center' } },
      { header: '3P%',      accessorKey: 'threePointPercent', cell: (info) => formatPercent(info.getValue<number>()), meta: { className: 'text-center' } },
      { header: 'RPG',      accessorKey: 'rpg',               cell: (info) => formatStat(info.getValue<number>()),    meta: { className: 'text-center' } },
      { header: 'APG',      accessorKey: 'apg',               cell: (info) => formatStat(info.getValue<number>()),    meta: { className: 'text-center' } },
      { header: 'SPG',      accessorKey: 'spg',               cell: (info) => formatStat(info.getValue<number>()),    meta: { className: 'text-center' } },
      { header: 'BPG',      accessorKey: 'bpg',               cell: (info) => formatStat(info.getValue<number>()),    meta: { className: 'text-center' } },
      { header: 'PPG',      accessorKey: 'ppg',               cell: (info) => formatStat(info.getValue<number>()),    meta: { className: 'text-center' } },
      { header: 'EFF',      accessorKey: 'eff',               cell: (info) => formatStat(info.getValue<number>()),    meta: { className: 'text-center' } },
    ],
    [],
  );

  return <DataTable data={players} columns={columns} />;
};
