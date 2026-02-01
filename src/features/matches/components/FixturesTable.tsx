import React, { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../../shared/components/DataTable/DataTable';
import { formatMatchDate, formatMatchTime } from '../../matches/lib/utils';

interface Fixture {
  id: string;
  date: Date | string;
  team1Name: string;
  team2Name: string;
  league: string;
  venue?: string;
  status: string;
}

interface FixturesTableProps {
  matches: Fixture[];
}

export const FixturesTable: React.FC<FixturesTableProps> = ({ matches }) => {
  const columns = useMemo<ColumnDef<Fixture>[]>(
    () => [
      {
        header: 'Date',
        accessorKey: 'date',
        cell: (info) => (
          <a href={`/matches/${info.row.original.id}`} className="data-link">
            {formatMatchDate(info.getValue<Date | string>())}
          </a>
        ),
        meta: { className: 'data-date' },
      },
      {
        header: 'Time',
        accessorKey: 'time',
        accessorFn: (row) => row.date,
        cell: (info) => (
          <a href={`/matches/${info.row.original.id}`} className="data-link">
            {formatMatchTime(info.getValue<Date | string>())}
          </a>
        ),
        meta: { className: 'data-time' },
      },
      {
        header: 'Home',
        accessorKey: 'team1Name',
        cell: (info) => (
          <a href={`/matches/${info.row.original.id}`} className="data-link font-bold">
            {info.getValue<string>()}
          </a>
        ),
        meta: { className: 'data-home' },
      },
      {
        header: 'Away',
        accessorKey: 'team2Name',
        cell: (info) => (
          <a href={`/matches/${info.row.original.id}`} className="data-link font-bold">
            {info.getValue<string>()}
          </a>
        ),
        meta: { className: 'data-away' },
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: (info) => {
          const status = info.getValue<string>();
          let color = '#64748b';
          if (status === 'LIVE') color = '#ef4444';
          if (status === 'UPCOMING') color = '#3b82f6';
          
          return (
            <span 
              className="px-2 py-1 rounded-full text-[10px] font-bold text-white uppercase"
              style={{ backgroundColor: color }}
            >
              {status}
            </span>
          );
        },
        meta: { className: 'data-status text-center' },
      },
      {
        header: 'Venue',
        accessorKey: 'venue',
        cell: (info) => (
          <a href={`/matches/${info.row.original.id}`} className="data-link">
            {info.getValue<string>() || '-'}
          </a>
        ),
        meta: { className: 'data-venue' },
      },
      {
        header: 'League',
        accessorKey: 'league',
        cell: (info) => (
          <a href={`/matches/${info.row.original.id}`} className="data-link">
            {info.getValue<string>()}
          </a>
        ),
        meta: { className: 'data-league' },
      },
      {
        header: 'Details',
        id: 'view',
        cell: (info) => (
          <a href={`/matches/${info.row.original.id}`} className="text-red-600 font-bold text-xs uppercase hover:underline">
            Full Info
          </a>
        ),
        meta: { className: 'data-view text-center' },
      },
    ],
    []
  );

  return (
    <div className="sp-template sp-template-event-list">
      <DataTable 
        data={matches} 
        columns={columns} 
        tableClassName="sp-event-list"
      />
      <style>{`
        .data-link {
          text-decoration: none;
          color: inherit;
          display: block;
          width: 100%;
          height: 100%;
        }
        .data-link:hover {
          color: #dd3333;
        }
        .sp-event-list thead th {
          text-align: center !important;
        }
      `}</style>
    </div>
  );
};
