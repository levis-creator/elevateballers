import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  categorizeAction,
  computeStats,
  groupByDay,
  isFailureAction,
  matchesActor,
  matchesPayload,
  CATEGORY_SERVER_PREFIX,
  type AuditActionCount,
  type AuditCategory,
  type AuditLogEntry,
} from '../../../domain/usecases/audit-log-view';
import { fetchAuditActions, fetchAuditLogs, buildAuditExportUrl } from '../../../data/datasources/audit-logs';

export type OutcomeFilter = 'all' | 'failures' | 'success';
export type TimeRangeFilter = '24h' | '7d' | '30d' | 'all';

export const TIME_RANGE_LABEL: Record<TimeRangeFilter, string> = {
  '24h': 'Last 24 hours',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  all: 'All time',
};

/** Row switches from a 5-column (time/badges/description/actor/open) to a 3-column
 *  layout below this width — matches the design's `window.innerWidth >= 1000` check. */
const WIDE_BREAKPOINT = 1000;

function rangeStart(range: TimeRangeFilter): string | undefined {
  if (range === 'all') return undefined;
  const ms = range === '24h' ? 24 : range === '7d' ? 24 * 7 : 24 * 30;
  return new Date(Date.now() - ms * 60 * 60 * 1000).toISOString();
}

interface FilterChip {
  key: string;
  label: string;
  clear: () => void;
}

/**
 * Owns all state + IO for the admin Audit Logs view: filters, the paginated
 * fetch, the "last 24h" stats used by the summary tiles, the detail-drawer
 * selection, and export/refresh. Presentation components stay declarative and
 * read the derived groups/stats from here — mirrors `useMatchListData`.
 */
export function useAuditLogsData() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [actions, setActions] = useState<AuditActionCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<{ createdAt: string; id: string } | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [payload, setPayload] = useState('');
  const [debouncedPayload, setDebouncedPayload] = useState('');
  const [actor, setActor] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [category, setCategory] = useState<AuditCategory | 'all'>('all');
  const [outcome, setOutcome] = useState<OutcomeFilter>('all');
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('7d');
  const [limit, setLimit] = useState(25);
  const [dense, setDense] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const [wide, setWide] = useState(true);
  useEffect(() => {
    const check = () => setWide(window.innerWidth >= WIDE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedPayload(payload.trim()), 300);
    return () => clearTimeout(t);
  }, [payload]);

  const serverActionFilter = category !== 'all' ? CATEGORY_SERVER_PREFIX[category] ?? '' : '';
  // Memoized on timeRange alone — rangeStart() stamps `Date.now()`, so recomputing it on
  // every render would produce a new `from` value each time and retrigger the fetch effect
  // in an infinite loop (loading would flicker forever and the list would never settle).
  const from = useMemo(() => rangeStart(timeRange), [timeRange]);

  const fetchLogs = useCallback(
    async (reset: boolean, cursorOverride?: { createdAt: string; id: string } | null) => {
      reset ? setLoading(true) : setIsLoadingMore(true);
      setError('');
      try {
        const activeCursor = reset ? null : cursorOverride ?? cursor;
        const page = await fetchAuditLogs({
          limit,
          search: debouncedSearch || undefined,
          metadataSearch: debouncedPayload || undefined,
          action: serverActionFilter || undefined,
          from,
          cursorCreatedAt: activeCursor?.createdAt,
          cursorId: activeCursor?.id,
        });
        setLogs((prev) => (reset ? page.logs : [...prev, ...page.logs]));
        setTotal(page.total);
        setCursor(page.nextCursor);
        setHasMore(Boolean(page.nextCursor));
      } catch (err: any) {
        setError(err?.message || 'Failed to load audit logs');
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [limit, debouncedSearch, debouncedPayload, serverActionFilter, from],
  );

  useEffect(() => {
    fetchLogs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, debouncedPayload, serverActionFilter, from, limit]);

  useEffect(() => {
    fetchAuditActions().then(setActions).catch(() => setActions([]));
  }, []);

  // Category buckets with multiple action prefixes (Users & roles, Content,
  // Competition) can't be expressed as a single `contains` filter server-side,
  // so they're refined client-side on the fetched page. Outcome, actor and
  // payload-contains are always client-side (not stored/queryable columns).
  const visible = useMemo(() => {
    return logs.filter((log) => {
      if (category !== 'all' && categorizeAction(log.action) !== category) return false;
      if (outcome === 'failures' && !isFailureAction(log.action)) return false;
      if (outcome === 'success' && isFailureAction(log.action)) return false;
      if (!matchesActor(log, actor)) return false;
      if (!matchesPayload(log, debouncedPayload)) return false;
      return true;
    });
  }, [logs, category, outcome, actor, debouncedPayload]);

  const groups = useMemo(() => groupByDay(visible), [visible]);
  const stats = useMemo(() => computeStats(logs), [logs]);

  const openEntry = useMemo(() => visible.find((e) => e.id === openId) ?? null, [visible, openId]);
  const relatedEntries = useMemo(() => {
    if (!openEntry) return [];
    const idx = visible.findIndex((e) => e.id === openEntry.id);
    if (idx === -1) return [];
    return visible.slice(Math.max(0, idx - 2), idx + 3).filter((e) => e.id !== openEntry.id);
  }, [visible, openEntry]);

  const hasActiveFilters =
    Boolean(debouncedSearch) ||
    category !== 'all' ||
    outcome !== 'all' ||
    timeRange !== 'all' ||
    Boolean(actor) ||
    Boolean(debouncedPayload);

  const activeFilterChips: FilterChip[] = useMemo(() => {
    const chips: FilterChip[] = [];
    if (timeRange !== 'all') {
      chips.push({ key: 'range', label: TIME_RANGE_LABEL[timeRange], clear: () => setTimeRange('all') });
    }
    if (debouncedSearch) chips.push({ key: 'search', label: `"${debouncedSearch}"`, clear: () => setSearch('') });
    if (category !== 'all') chips.push({ key: 'category', label: category, clear: () => setCategory('all') });
    if (outcome !== 'all') {
      chips.push({
        key: 'outcome',
        label: outcome === 'failures' ? 'Failures only' : 'Successful only',
        clear: () => setOutcome('all'),
      });
    }
    if (actor) chips.push({ key: 'actor', label: `By ${actor}`, clear: () => setActor('') });
    if (debouncedPayload) {
      chips.push({ key: 'payload', label: `Payload: ${debouncedPayload}`, clear: () => setPayload('') });
    }
    return chips;
  }, [debouncedSearch, category, outcome, timeRange, actor, debouncedPayload]);

  const clearAll = useCallback(() => {
    setSearch('');
    setPayload('');
    setActor('');
    setCategory('all');
    setOutcome('all');
    setTimeRange('all');
  }, []);

  const exportLogs = useCallback(
    (format: 'csv' | 'json') => {
      window.location.href = buildAuditExportUrl(
        {
          search: debouncedSearch || undefined,
          metadataSearch: debouncedPayload || undefined,
          action: serverActionFilter || undefined,
          from,
        },
        format,
      );
    },
    [debouncedSearch, debouncedPayload, serverActionFilter, from],
  );

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || loading) return;
    fetchLogs(false);
  }, [hasMore, isLoadingMore, loading, fetchLogs]);

  const filterByActor = useCallback(() => {
    if (!openEntry) return;
    const name = openEntry.performedByUser?.name || openEntry.performedBy;
    setActor(name);
    setOpenId(null);
    setAdvancedOpen(true);
  }, [openEntry]);

  const filterByAction = useCallback(() => {
    if (!openEntry) return;
    setSearch(openEntry.action);
    setOpenId(null);
  }, [openEntry]);

  return {
    loading,
    isLoadingMore,
    error,
    total,
    hasMore,
    groups,
    visible,
    stats,
    actions,
    wide,

    search,
    setSearch,
    payload,
    setPayload,
    actor,
    setActor,
    advancedOpen,
    setAdvancedOpen,
    category,
    setCategory,
    outcome,
    setOutcome,
    timeRange,
    setTimeRange,
    limit,
    setLimit,
    dense,
    setDense,

    hasActiveFilters,
    activeFilterChips,
    clearAll,
    refresh: () => fetchLogs(true),
    loadMore,
    exportLogs,

    openId,
    setOpenId,
    openEntry,
    relatedEntries,
    filterByActor,
    filterByAction,
  };
}
