import React, { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../../shared/components/DataTable/DataTable';

interface Player {
  id: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  height?: string;
  weight?: string;
  jerseyNumber?: string | number;
  stats?: Record<string, any>;
}

interface TeamDetailsTableProps {
  players: Player[];
}

const getPlayerName = (player: Player): string => {
  if (player.firstName && player.lastName) {
    return `${player.firstName} ${player.lastName}`;
  }
  return player.firstName || player.lastName || 'Unknown Player';
};

const getStat = (stats: any, key: string): number => {
  if (!stats || typeof stats !== 'object') return 0;
  return stats[key] || 0;
};

const formatStat = (value: number): string => {
  return value === 0 ? "-" : value.toFixed(1);
};

const formatPercent = (value: number): string => {
  return value === 0 ? "-" : value.toFixed(1);
};

export const TeamDetailsTable: React.FC<TeamDetailsTableProps> = ({ players }) => {
  const hasAnyStats = useMemo(() => players.some((p) => p.stats && Object.keys(p.stats).length > 0), [players]);

  const columns = useMemo<ColumnDef<Player>[]>(
    () => {
      const baseColumns: ColumnDef<Player>[] = [
        {
          header: 'Player',
          accessorFn: (row) => getPlayerName(row),
          cell: (info) => (
            <a href={`/players/${info.row.original.id}`} className="sp-player-name">
              {info.getValue<string>()}
            </a>
          ),
          meta: { className: 'data-name' },
        },
        {
          header: 'Position',
          accessorKey: 'position',
          cell: (info) => info.getValue() || '-',
          meta: { className: 'data-position' },
        },
        {
          header: 'Height',
          accessorKey: 'height',
          cell: (info) => info.getValue() || '-',
          meta: { className: 'data-height' },
        },
        {
          header: 'Weight',
          accessorKey: 'weight',
          cell: (info) => info.getValue() || '-',
          meta: { className: 'data-weight' },
        },
        {
          header: 'Jersey',
          accessorKey: 'jerseyNumber',
          cell: (info) => info.getValue() || '-',
          meta: { className: 'data-jersey' },
        },
      ];

      if (hasAnyStats) {
        const statCols: ColumnDef<Player>[] = [
          {
            header: 'FG%',
            accessorFn: (row) => getStat(row.stats, 'fgPercent') || getStat(row.stats, 'fg'),
            cell: (info) => formatPercent(info.getValue<number>()),
            meta: { className: 'data-fg' },
          },
          {
            header: 'FT%',
            accessorFn: (row) => getStat(row.stats, 'ftPercent') || getStat(row.stats, 'ft'),
            cell: (info) => formatPercent(info.getValue<number>()),
            meta: { className: 'data-ft' },
          },
          {
            header: '3P%',
            accessorFn: (row) => getStat(row.stats, 'threePointPercent') || getStat(row.stats, '3p'),
            cell: (info) => formatPercent(info.getValue<number>()),
            meta: { className: 'data-3p' },
          },
          {
            header: 'RPG',
            accessorFn: (row) => getStat(row.stats, 'rpg'),
            cell: (info) => formatStat(info.getValue<number>()),
            meta: { className: 'data-rpg' },
          },
          {
            header: 'APG',
            accessorFn: (row) => getStat(row.stats, 'apg'),
            cell: (info) => formatStat(info.getValue<number>()),
            meta: { className: 'data-apg' },
          },
          {
            header: 'SPG',
            accessorFn: (row) => getStat(row.stats, 'spg'),
            cell: (info) => formatStat(info.getValue<number>()),
            meta: { className: 'data-spg' },
          },
          {
            header: 'BPG',
            accessorFn: (row) => getStat(row.stats, 'bpg'),
            cell: (info) => formatStat(info.getValue<number>()),
            meta: { className: 'data-bpg' },
          },
          {
            header: 'PPG',
            accessorFn: (row) => getStat(row.stats, 'ppg'),
            cell: (info) => formatStat(info.getValue<number>()),
            meta: { className: 'data-ppg' },
          },
          {
            header: 'EFF',
            accessorFn: (row) => getStat(row.stats, 'eff'),
            cell: (info) => formatStat(info.getValue<number>()),
            meta: { className: 'data-eff' },
          },
        ];
        return [...baseColumns, ...statCols];
      }

      return baseColumns;
    },
    [hasAnyStats]
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
