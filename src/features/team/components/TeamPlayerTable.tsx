import React, { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../../shared/components/DataTable/DataTable';
import type { TeamPlayer } from '../data/teamData';

interface TeamPlayerTableProps {
  players: TeamPlayer[];
}

/**
 * Format a number to one decimal place, or "-" if zero
 */
function formatStat(value: number): string {
  return value === 0 ? "-" : value.toFixed(1);
}

/**
 * Format a percentage to one decimal place, or "-" if zero
 */
function formatPercent(value: number): string {
  return value === 0 ? "-" : value.toFixed(1);
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
            <a href={player.url} className="sp-player-name">
              {player.name}
            </a>
          ) : (
            <span className="sp-player-name">{player.name}</span>
          );
        },
        meta: { className: 'data-name' },
      },
      {
        header: 'Position',
        accessorKey: 'position',
        meta: { className: 'data-position' },
      },
      {
        header: 'Height',
        accessorKey: 'height',
        meta: { className: 'data-height' },
      },
      {
        header: 'Weight',
        accessorKey: 'weight',
        meta: { className: 'data-weight' },
      },
      {
        header: 'FG%',
        accessorKey: 'fgPercent',
        cell: (info) => formatPercent(info.getValue<number>()),
        meta: { className: 'data-fg' },
      },
      {
        header: 'FT%',
        accessorKey: 'ftPercent',
        cell: (info) => formatPercent(info.getValue<number>()),
        meta: { className: 'data-ft' },
      },
      {
        header: '3P%',
        accessorKey: 'threePointPercent',
        cell: (info) => formatPercent(info.getValue<number>()),
        meta: { className: 'data-3p' },
      },
      {
        header: 'RPG',
        accessorKey: 'rpg',
        cell: (info) => formatStat(info.getValue<number>()),
        meta: { className: 'data-rpg' },
      },
      {
        header: 'APG',
        accessorKey: 'apg',
        cell: (info) => formatStat(info.getValue<number>()),
        meta: { className: 'data-apg' },
      },
      {
        header: 'SPG',
        accessorKey: 'spg',
        cell: (info) => formatStat(info.getValue<number>()),
        meta: { className: 'data-spg' },
      },
      {
        header: 'BPG',
        accessorKey: 'bpg',
        cell: (info) => formatStat(info.getValue<number>()),
        meta: { className: 'data-bpg' },
      },
      {
        header: 'PPG',
        accessorKey: 'ppg',
        cell: (info) => formatStat(info.getValue<number>()),
        meta: { className: 'data-ppg' },
      },
      {
        header: 'EFF',
        accessorKey: 'eff',
        cell: (info) => formatStat(info.getValue<number>()),
        meta: { className: 'data-eff' },
      },
    ],
    []
  );

  return (
    <div className="sp-template sp-template-player-list">
      <DataTable 
        data={players} 
        columns={columns} 
        tableClassName="sp-player-list"
      />
    </div>
  );
};
