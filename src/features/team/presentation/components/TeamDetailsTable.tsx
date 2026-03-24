import React, { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../../../shared/components/DataTable/DataTable';

interface Player {
  id: string;
  slug?: string | null;
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
  if (player.firstName && player.lastName) return `${player.firstName} ${player.lastName}`;
  return player.firstName || player.lastName || 'Unknown Player';
};

const getStat = (stats: any, key: string): number => {
  if (!stats || typeof stats !== 'object') return 0;
  return stats[key] || 0;
};

const formatStat    = (v: number) => (v === 0 ? '-' : v.toFixed(1));
const formatPercent = (v: number) => (v === 0 ? '-' : v.toFixed(1));

export const TeamDetailsTable: React.FC<TeamDetailsTableProps> = ({ players }) => {
  const hasAnyStats = useMemo(
    () => players.some((p) => p.stats && Object.keys(p.stats).length > 0),
    [players],
  );

  const columns = useMemo<ColumnDef<Player>[]>(() => {
    const baseColumns: ColumnDef<Player>[] = [
      {
        header: 'Player',
        accessorFn: (row) => getPlayerName(row),
        cell: (info) => (
          <a
            href={`/players/${info.row.original.slug || info.row.original.id}`}
            className="font-bold text-brand-body no-underline transition-colors hover:text-brand-link"
          >
            {info.getValue<string>()}
          </a>
        ),
        meta: { className: 'text-left pl-4' },
      },
      { header: 'Position', accessorKey: 'position',    cell: (info) => info.getValue() || '-', meta: { className: 'text-center' } },
      { header: 'Height',   accessorKey: 'height',      cell: (info) => info.getValue() || '-', meta: { className: 'text-center' } },
      { header: 'Weight',   accessorKey: 'weight',      cell: (info) => info.getValue() || '-', meta: { className: 'text-center' } },
      { header: 'Jersey',   accessorKey: 'jerseyNumber', cell: (info) => info.getValue() || '-', meta: { className: 'text-center' } },
    ];

    if (!hasAnyStats) return baseColumns;

    const statCols: ColumnDef<Player>[] = [
      { header: 'FG%', accessorFn: (r) => getStat(r.stats, 'fgPercent') || getStat(r.stats, 'fg'),              cell: (i) => formatPercent(i.getValue<number>()), meta: { className: 'text-center' } },
      { header: 'FT%', accessorFn: (r) => getStat(r.stats, 'ftPercent') || getStat(r.stats, 'ft'),              cell: (i) => formatPercent(i.getValue<number>()), meta: { className: 'text-center' } },
      { header: '3P%', accessorFn: (r) => getStat(r.stats, 'threePointPercent') || getStat(r.stats, '3p'),      cell: (i) => formatPercent(i.getValue<number>()), meta: { className: 'text-center' } },
      { header: 'RPG', accessorFn: (r) => getStat(r.stats, 'rpg'),  cell: (i) => formatStat(i.getValue<number>()), meta: { className: 'text-center' } },
      { header: 'APG', accessorFn: (r) => getStat(r.stats, 'apg'),  cell: (i) => formatStat(i.getValue<number>()), meta: { className: 'text-center' } },
      { header: 'SPG', accessorFn: (r) => getStat(r.stats, 'spg'),  cell: (i) => formatStat(i.getValue<number>()), meta: { className: 'text-center' } },
      { header: 'BPG', accessorFn: (r) => getStat(r.stats, 'bpg'),  cell: (i) => formatStat(i.getValue<number>()), meta: { className: 'text-center' } },
      { header: 'PPG', accessorFn: (r) => getStat(r.stats, 'ppg'),  cell: (i) => formatStat(i.getValue<number>()), meta: { className: 'text-center' } },
      { header: 'EFF', accessorFn: (r) => getStat(r.stats, 'eff'),  cell: (i) => formatStat(i.getValue<number>()), meta: { className: 'text-center' } },
    ];

    return [...baseColumns, ...statCols];
  }, [hasAnyStats]);

  return <DataTable data={players} columns={columns} />;
};
