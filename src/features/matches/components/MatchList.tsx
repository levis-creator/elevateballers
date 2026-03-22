/**
 * MatchList — admin table for managing matches
 * Uses the shared DataTable component for layout and interactions.
 */

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable, type ColumnDef, type RowAction, type BulkAction } from '@/components/DataTable';
import { useMatchStore } from '../stores/useMatchStore';
import { getLeagueName } from '../../domain/usecases/league-helpers';
import { getTeam1Name, getTeam2Name } from '../../domain/usecases/team-helpers';
import { getMatchStatusLabel, getMatchStatusColor, formatMatchDate, formatMatchTime } from '../../domain/usecases/utils';
import { Trophy, Plus, Eye, Pencil, Trash2, Calendar } from 'lucide-react';
import type { Match } from '@prisma/client';

const STATUS_VARIANT: Record<string, string> = {
  UPCOMING: 'bg-blue-100 text-blue-700',
  LIVE: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
};

export default function MatchList() {
  const {
    matches,
    loading,
    error,
    fetchMatches,
    filters,
    setStatusFilter,
    setLeagueFilter,
    setSearchTerm,
    getFilteredMatches,
  } = useMatchStore();

  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchMatches();
  }, []);

  const filteredMatches = useMemo(() => getFilteredMatches(matches), [matches, filters]);

  const leagues = useMemo(
    () => Array.from(new Set(matches.map((m) => getLeagueName(m)).filter(Boolean))).sort() as string[],
    [matches]
  );

  const showError = (msg: string) => {
    setActionError(msg);
    setTimeout(() => setActionError(''), 5000);
  };

  const handleDelete = async (match: Match) => {
    if (!window.confirm('Delete this match? This cannot be undone.')) return;
    const res = await fetch(`/api/matches/${match.id}`, { method: 'DELETE' });
    if (!res.ok) {
      showError('Failed to delete match.');
    } else {
      fetchMatches();
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (!window.confirm(`Delete ${ids.length} match(es)? This cannot be undone.`)) return;
    const res = await fetch('/api/matches/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showError(data.error ?? 'Failed to delete matches.');
      throw new Error(); // keep bulk bar open on failure
    }
    fetchMatches();
  };

  // ── Column definitions ────────────────────────────────────────────────────
  const columns: ColumnDef<Match>[] = [
    {
      key: 'date',
      header: 'Date',
      className: 'w-36',
      cell: (m) => (
        <div>
          <div className="text-sm font-medium text-foreground">{formatMatchDate(m.date)}</div>
          <div className="text-xs text-muted-foreground">{formatMatchTime(m.date)}</div>
        </div>
      ),
    },
    {
      key: 'teams',
      header: 'Teams',
      cell: (m) => (
        <div className="flex items-center gap-1.5 font-medium text-sm">
          <span>{getTeam1Name(m)}</span>
          <span className="text-muted-foreground font-normal text-xs">vs</span>
          <span>{getTeam2Name(m)}</span>
        </div>
      ),
    },
    {
      key: 'league',
      header: 'League',
      cell: (m) => (
        <span className="text-sm text-muted-foreground">{getLeagueName(m) ?? '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-32',
      cell: (m) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_VARIANT[m.status] ?? 'bg-muted text-muted-foreground'}`}
        >
          {getMatchStatusLabel(m.status)}
        </span>
      ),
    },
    {
      key: 'score',
      header: 'Score',
      className: 'w-24',
      cell: (m) =>
        m.team1Score !== null && m.team2Score !== null ? (
          <span className="font-mono text-sm font-semibold tabular-nums">
            {m.team1Score} – {m.team2Score}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

  // ── Row actions ───────────────────────────────────────────────────────────
  const rowActions: RowAction<Match>[] = [
    {
      label: 'View',
      icon: <Eye size={14} />,
      href: (m) => `/admin/matches/view/${m.id}`,
    },
    {
      label: 'Edit',
      icon: <Pencil size={14} />,
      href: (m) => `/admin/matches/${m.id}`,
    },
    {
      label: 'Delete',
      icon: <Trash2 size={14} />,
      destructive: true,
      separator: true,
      onClick: handleDelete,
    },
  ];

  // ── Bulk actions ──────────────────────────────────────────────────────────
  const bulkActions: BulkAction[] = [
    {
      label: 'Delete',
      icon: <Trash2 size={14} />,
      variant: 'destructive',
      onClick: handleBulkDelete,
    },
  ];

  // ── Filters slot ──────────────────────────────────────────────────────────
  const filtersSlot = (
    <>
      <Select value={filters.statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="h-9 w-40 text-sm">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="upcoming">Upcoming</SelectItem>
          <SelectItem value="live">Live</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>

      {leagues.length > 0 && (
        <Select value={filters.leagueFilter} onValueChange={setLeagueFilter}>
          <SelectTrigger className="h-9 w-44 text-sm">
            <SelectValue placeholder="All leagues" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Leagues</SelectItem>
            {leagues.map((league) => (
              <SelectItem key={league} value={league}>
                {league}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </>
  );

  return (
    <>
      {actionError && (
        <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          {actionError}
        </div>
      )}
      <DataTable
        title="Matches"
        description="Manage match schedule and results"
        icon={<Trophy size={24} />}
        headerAction={
          <Button asChild size="sm">
            <a href="/admin/matches/new" data-astro-prefetch>
              <Plus size={16} className="mr-1.5" />
              Create Match
            </a>
          </Button>
        }
        data={filteredMatches}
        columns={columns}
        rowKey={(m) => m.id}
        onRowClick={(m) => { window.location.href = `/admin/matches/view/${m.id}`; }}
        loading={loading}
        error={error}
        onRetry={fetchMatches}
        searchValue={filters.searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by team or league…"
        filters={filtersSlot}
        rowActions={rowActions}
        bulkActions={bulkActions}
        emptyIcon={<Calendar size={48} />}
        emptyTitle={
          filters.searchTerm || filters.statusFilter !== 'all' || filters.leagueFilter !== 'all'
            ? 'No matches found'
            : 'No matches yet'
        }
        emptyDescription={
          filters.searchTerm || filters.statusFilter !== 'all' || filters.leagueFilter !== 'all'
            ? 'Try adjusting your search or filters.'
            : 'Create your first match to get started.'
        }
        emptyAction={
          !(filters.searchTerm || filters.statusFilter !== 'all' || filters.leagueFilter !== 'all') && (
            <Button asChild size="sm">
              <a href="/admin/matches/new" data-astro-prefetch>
                <Plus size={16} className="mr-1.5" />
                Create Match
              </a>
            </Button>
          )
        }
      />
    </>
  );
}
