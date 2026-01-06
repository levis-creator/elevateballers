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
        cell: (info) => formatMatchDate(info.getValue<Date | string>()),
        meta: { className: 'data-date' },
      },
      {
        header: 'Time',
        accessorKey: 'time',
        accessorFn: (row) => row.date,
        cell: (info) => formatMatchTime(info.getValue<Date | string>()),
        meta: { className: 'data-time' },
      },
      {
        header: 'Home',
        accessorKey: 'team1Name',
        cell: (info) => (
          <a href={`/matches/${info.row.original.id}`}>
            {info.getValue<string>()}
          </a>
        ),
        meta: { className: 'data-home' },
      },
      {
        header: 'Away',
        accessorKey: 'team2Name',
        cell: (info) => (
          <a href={`/matches/${info.row.original.id}`}>
            {info.getValue<string>()}
          </a>
        ),
        meta: { className: 'data-away' },
      },
      {
        header: 'Venue',
        accessorKey: 'venue',
        cell: (info) => info.getValue() || '-',
        meta: { className: 'data-venue' },
      },
      {
        header: 'League',
        accessorKey: 'league',
        meta: { className: 'data-league' },
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
    </div>
  );
};
