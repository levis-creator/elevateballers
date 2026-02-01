import React, { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../../shared/components/DataTable/DataTable';
import { formatMatchDate } from '../../matches/lib/utils';

interface Result {
  id: string;
  date: Date | string;
  team1Name: string;
  team2Name: string;
  team1Score: number | string;
  team2Score: number | string;
  league: string;
  winnerName?: string;
  status: string;
}

interface ResultsTableProps {
  matches: Result[];
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ matches }) => {
  const columns = useMemo<ColumnDef<Result>[]>(
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
        header: 'Result',
        id: 'score',
        cell: (info) => (
          <a href={`/matches/${info.row.original.id}`} className="data-link">
            <div className="bg-slate-100 px-3 py-1 rounded font-black text-lg inline-block">
              {info.row.original.team1Score} - {info.row.original.team2Score}
            </div>
          </a>
        ),
        meta: { className: 'data-score text-center' },
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
        header: 'Status',
        accessorKey: 'status',
        cell: (info) => {
          const status = info.getValue<string>();
          let color = '#64748b';
          if (status === 'LIVE') color = '#ef4444';
          if (status === 'COMPLETED') color = '#10b981';
          
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
        header: 'Winner',
        accessorKey: 'winnerName',
        cell: (info) => info.getValue() ? (
          <div className="flex items-center justify-center gap-1 text-yellow-600">
            <span>🏆</span>
            <span className="text-sm font-medium">{info.getValue<string>()}</span>
          </div>
        ) : '-',
        meta: { className: 'data-winner text-center' },
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
