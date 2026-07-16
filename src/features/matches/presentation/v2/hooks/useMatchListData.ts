import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePermissions } from '@/features/rbac/usePermissions';
import type { ListMatch } from '../../../domain/usecases/match-list-view';
import {
  computeStats,
  groupByDate,
  matchesQuery,
  sortByDate,
  type MatchDateGroup,
  type MatchStats,
} from '../../../domain/usecases/match-list-view';

export type ViewMode = 'list' | 'grid';
export type StatusFilter = 'all' | 'upcoming' | 'live' | 'completed';

/** Matches shown per page. Grouping by date happens within the current page. */
export const MATCHES_PER_PAGE = 12;

interface NamedOption {
  id: string;
  name: string;
}

/** Tolerate the various admin list response envelopes (`[]`, `{data:[]}`). */
async function fetchList<T = any>(url: string): Promise<T[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

/**
 * Owns all state + IO for the admin Matches list: filter controls, the matches
 * fetch (status/season/league filtered server-side), option lists for the
 * dropdowns, row selection, and delete / bulk-delete mutations. Presentation
 * components stay declarative and read the derived groups/stats from here.
 */
export function useMatchListData() {
  const { can } = usePermissions();

  const [matches, setMatches] = useState<ListMatch[]>([]);
  const [seasons, setSeasons] = useState<NamedOption[]>([]);
  const [leagues, setLeagues] = useState<NamedOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [seasonId, setSeasonId] = useState('all');
  const [leagueId, setLeagueId] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Filter server-side so future-dated matches aren't truncated by the
      // API's default 50-row window (mirrors the v1 list behaviour).
      const params = new URLSearchParams({ limit: '200' });
      if (status !== 'all') params.set('status', status);
      if (seasonId !== 'all') params.set('seasonId', seasonId);
      if (leagueId !== 'all') params.set('leagueId', leagueId);
      setMatches(await fetchList<ListMatch>(`/api/matches?${params.toString()}`));
    } catch (err: any) {
      setError(err?.message || 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  }, [status, seasonId, leagueId]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Option lists for the filter dropdowns — loaded once.
  useEffect(() => {
    fetchList<NamedOption>('/api/seasons').then(setSeasons).catch(() => setSeasons([]));
    fetchList<NamedOption>('/api/leagues').then(setLeagues).catch(() => setLeagues([]));
  }, []);

  // Client-side text search, then order newest-first so page 1 holds the most
  // recent matches (and each page's date groups read latest → oldest).
  const filtered = useMemo(
    () => sortByDate(matches.filter((m) => matchesQuery(m, search)), 'desc'),
    [matches, search],
  );

  const stats: MatchStats = useMemo(() => computeStats(matches), [matches]);

  const hasActiveFilters =
    Boolean(search.trim()) || status !== 'all' || seasonId !== 'all' || leagueId !== 'all';

  // Pagination — reset to page 1 whenever the result set changes, and clamp the
  // active page so it can never point past the last page (e.g. after a delete).
  useEffect(() => {
    setPage(1);
  }, [search, status, seasonId, leagueId]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / MATCHES_PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => filtered.slice((currentPage - 1) * MATCHES_PER_PAGE, currentPage * MATCHES_PER_PAGE),
    [filtered, currentPage],
  );

  // Group the current page by date (grouping is intentionally page-scoped).
  const groups: MatchDateGroup[] = useMemo(() => groupByDate(pageItems), [pageItems]);

  // Selection ----------------------------------------------------------------
  const toggleOne = useCallback((id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  // Select-all applies to the current page (what the user can see), not the
  // whole filtered set spread across pages.
  const toggleAll = useCallback(
    (checked: boolean) => {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const m of pageItems) {
          if (checked) next.add(m.id);
          else next.delete(m.id);
        }
        return next;
      });
    },
    [pageItems],
  );

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const allSelected =
    pageItems.length > 0 && pageItems.every((m) => selected.has(m.id));

  // Mutations ----------------------------------------------------------------
  const deleteOne = useCallback(
    async (id: string) => {
      if (!window.confirm('Delete this match?\n\nThis action cannot be undone.')) return;
      try {
        const res = await fetch(`/api/matches/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete match');
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        fetchMatches();
      } catch (err: any) {
        setError(err?.message || 'Failed to delete match');
        setTimeout(() => setError(''), 5000);
      }
    },
    [fetchMatches],
  );

  const deleteSelected = useCallback(async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} match(es)?\n\nThis action cannot be undone.`)) return;
    setBulkBusy(true);
    try {
      const res = await fetch('/api/matches/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || 'Failed to delete matches');
      }
      clearSelection();
      fetchMatches();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete matches');
      setTimeout(() => setError(''), 5000);
    } finally {
      setBulkBusy(false);
    }
  }, [selected, clearSelection, fetchMatches]);

  return {
    // data
    loading,
    error,
    groups,
    filtered,
    pageItems,
    stats,
    seasons,
    leagues,
    hasActiveFilters,
    // pagination
    page: currentPage,
    pageCount,
    setPage,
    perPage: MATCHES_PER_PAGE,
    // filter state
    search,
    setSearch,
    status,
    setStatus,
    seasonId,
    setSeasonId,
    leagueId,
    setLeagueId,
    viewMode,
    setViewMode,
    // selection
    selected,
    allSelected,
    toggleOne,
    toggleAll,
    clearSelection,
    // mutations
    bulkBusy,
    deleteOne,
    deleteSelected,
    refetch: fetchMatches,
    // permissions
    can,
  };
}
