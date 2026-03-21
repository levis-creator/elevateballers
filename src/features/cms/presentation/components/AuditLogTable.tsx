import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AuditUserRef {
  id: string;
  name: string;
  email: string;
}

interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  performedBy: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: AuditUserRef | null;
  performedByUser: AuditUserRef | null;
}

interface AuditLogResponse {
  logs: AuditLogEntry[];
  limit: number;
  total: number;
  nextCursor?: { createdAt: string; id: string } | null;
}

export default function AuditLogTable({ canManage = true }: { canManage?: boolean }) {

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [metadataSearch, setMetadataSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<{ createdAt: string; id: string } | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [actions, setActions] = useState<{ action: string; count: number }[]>([]);
  const [icons, setIcons] = useState<{
    Search?: ComponentType<any>;
    RefreshCw?: ComponentType<any>;
    Download?: ComponentType<any>;
    FileText?: ComponentType<any>;
    Filter?: ComponentType<any>;
  }>({});

  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debouncedMetadataSearch, setDebouncedMetadataSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMetadataSearch(metadataSearch.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [metadataSearch]);

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        Search: mod.Search,
        RefreshCw: mod.RefreshCw,
        Download: mod.Download,
        FileText: mod.FileText,
        Filter: mod.Filter,
      });
    });
  }, []);

  useEffect(() => {
    fetchLogs(true);
  }, [debouncedSearch, debouncedMetadataSearch, actionFilter, fromDate, toDate, limit]);

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchLogs = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setLogs([]);
      } else {
        setIsLoadingMore(true);
      }
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (debouncedMetadataSearch) params.set('metadataSearch', debouncedMetadataSearch);
      if (actionFilter) params.set('action', actionFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      if (!reset && cursor) {
        params.set('cursorCreatedAt', cursor.createdAt);
        params.set('cursorId', cursor.id);
      }

      const response = await fetch(`/api/audit-logs?${params.toString()}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch audit logs');
      }

      const data: AuditLogResponse = await response.json();
      const nextLogs = Array.isArray(data.logs) ? data.logs : [];
      setLogs((prev) => (reset ? nextLogs : [...prev, ...nextLogs]));
      setTotal(data.total ?? 0);
      const nextCursor = data.nextCursor ?? null;
      setCursor(nextCursor ? { createdAt: String(nextCursor.createdAt), id: nextCursor.id } : null);
      setHasMore(Boolean(nextCursor));
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const fetchActions = async () => {
    try {
      const response = await fetch('/api/audit-logs/actions');
      if (!response.ok) return;
      const data = await response.json();
      setActions(Array.isArray(data.actions) ? data.actions : []);
    } catch {
      // ignore
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    const params = new URLSearchParams();
    params.set('format', format);
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (debouncedMetadataSearch) params.set('metadataSearch', debouncedMetadataSearch);
    if (actionFilter) params.set('action', actionFilter);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    window.location.href = `/api/audit-logs/export?${params.toString()}`;
  };

  const resetFilters = () => {
    setSearchTerm('');
    setMetadataSearch('');
    setActionFilter('');
    setFromDate('');
    setToDate('');
    setCursor(null);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const summary = useMemo(() => {
    if (total === 0) return 'No audit logs found';
    const start = logs.length ? 1 : 0;
    const end = Math.min(logs.length, total);
    return `Showing ${start}-${end} of ${total}`;
  }, [logs.length, total]);

  const SearchIcon = icons.Search;
  const RefreshIcon = icons.RefreshCw;
  const DownloadIcon = icons.Download;
  const FileTextIcon = icons.FileText;
  const FilterIcon = icons.Filter;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px]">
                {SearchIcon && (
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                )}
                <Input
                  type="search"
                  placeholder="Search action, user, or actor"
                  value={searchTerm}
                  onChange={(e) => {
                    setCursor(null);
                    setSearchTerm(e.target.value);
                  }}
                  className={cn('pl-9')}
                />
              </div>

              <div className="flex items-center gap-2 min-w-[200px]">
                {FilterIcon && <FilterIcon className="h-4 w-4 text-muted-foreground" />}
                <Select
                  value={actions.some((item) => item.action === actionFilter) ? actionFilter : 'all'}
                  onValueChange={(value) => {
                    setCursor(null);
                    setActionFilter(value === 'all' ? '' : value);
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All actions</SelectItem>
                    {actions.map((item) => (
                      <SelectItem key={item.action} value={item.action}>
                        {item.action} ({item.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setCursor(null);
                    setFromDate(e.target.value);
                  }}
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setCursor(null);
                    setToDate(e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Input
                  placeholder="Metadata search (full-text)"
                  value={metadataSearch}
                  onChange={(e) => {
                    setCursor(null);
                    setMetadataSearch(e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Quick filters:</span>
              <Button
                variant={actionFilter.startsWith('ROLE_') ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setCursor(null);
                  setActionFilter(actionFilter.startsWith('ROLE_') ? '' : 'ROLE_');
                }}
              >
                ROLE_*
              </Button>
              <Button
                variant={actionFilter.startsWith('SETTING_') ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setCursor(null);
                  setActionFilter(actionFilter.startsWith('SETTING_') ? '' : 'SETTING_');
                }}
              >
                SETTING_*
              </Button>
              <Button
                variant={actionFilter.startsWith('NEWS_') ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setCursor(null);
                  setActionFilter(actionFilter.startsWith('NEWS_') ? '' : 'NEWS_');
                }}
              >
                NEWS_*
              </Button>
              <Button
                variant={actionFilter.startsWith('USER_') ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setCursor(null);
                  setActionFilter(actionFilter.startsWith('USER_') ? '' : 'USER_');
                }}
              >
                USER_*
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {FileTextIcon && <FileTextIcon className="h-4 w-4" />}
                <span>{summary}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={String(limit)}
                  onValueChange={(value) => {
                    setCursor(null);
                    setLimit(parseInt(value, 10));
                  }}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 / page</SelectItem>
                    <SelectItem value="25">25 / page</SelectItem>
                    <SelectItem value="50">50 / page</SelectItem>
                    <SelectItem value="100">100 / page</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={resetFilters}>
                  Reset
                </Button>
                <Button variant="outline" onClick={() => fetchLogs(true)} disabled={loading}>
                  {RefreshIcon && <RefreshIcon className="mr-2 h-4 w-4" />}
                  Refresh
                </Button>

                {canManage && (
                  <>
                    <Button variant="outline" onClick={() => handleExport('csv')}>
                      {DownloadIcon && <DownloadIcon className="mr-2 h-4 w-4" />}
                      Export CSV
                    </Button>
                    <Button variant="outline" onClick={() => handleExport('json')}>
                      {DownloadIcon && <DownloadIcon className="mr-2 h-4 w-4" />}
                      Export JSON
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="rounded-xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead className="w-[200px]">Action</TableHead>
                  <TableHead>Target User</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton className="h-4 w-[140px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[260px]" /></TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      No audit logs found for the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-[0.7rem]">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium text-foreground">
                            {log.user?.name || 'Unknown'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {log.user?.email || log.userId}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium text-foreground">
                            {log.performedByUser?.name || 'Unknown'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {log.performedByUser?.email || log.performedBy}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground max-w-[320px]">
                          {log.metadata ? JSON.stringify(log.metadata) : '—'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">{summary}</div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!hasMore || loading || isLoadingMore}
                onClick={() => fetchLogs(false)}
              >
                {isLoadingMore ? 'Loading…' : hasMore ? 'Has more' : 'No more'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
