/**
 * DataTable — reusable admin data table component
 *
 * Usage:
 *   <DataTable
 *     title="Matches"
 *     description="Manage match schedule and results"
 *     icon={<TrophyIcon size={28} />}
 *     headerAction={<Button asChild><a href="/admin/matches/new">Create</a></Button>}
 *     data={matches}
 *     columns={columns}
 *     rowKey={(m) => m.id}
 *     loading={loading}
 *     error={error}
 *     onRetry={fetchMatches}
 *     searchValue={search}
 *     onSearchChange={setSearch}
 *     rowActions={rowActions}
 *     bulkActions={bulkActions}
 *     onRowClick={(m) => { window.location.href = `/admin/matches/${m.id}`; }}
 *   />
 */

import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertCircle, RefreshCw, Search, MoreVertical } from 'lucide-react';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ColumnDef<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Extra Tailwind classes applied to both <th> and <td>. */
  className?: string;
}

export interface RowAction<T> {
  label: string;
  icon?: ReactNode;
  /** Navigate to this URL instead of calling onClick. */
  href?: (row: T) => string;
  onClick?: (row: T) => void;
  /** Renders the item in destructive (red) style. */
  destructive?: boolean;
  /** Render a separator line before this item. */
  separator?: boolean;
  /** Return true to hide this action for a given row. */
  hidden?: (row: T) => boolean;
}

export interface BulkAction {
  label: string;
  icon?: ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  /** Receives the array of selected row keys. */
  onClick: (selectedIds: string[]) => void;
}

export interface DataTableProps<T> {
  // ── Data ──────────────────────────────────────────────────────────────────
  data: T[];
  columns: ColumnDef<T>[];
  /** Unique key for each row (used for selection and React keys). */
  rowKey: (row: T) => string;

  // ── Async state ───────────────────────────────────────────────────────────
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;

  // ── Header ────────────────────────────────────────────────────────────────
  title: string;
  description?: string;
  icon?: ReactNode;
  /** Slot rendered top-right of the header (e.g. a Create button). */
  headerAction?: ReactNode;

  // ── Row click ─────────────────────────────────────────────────────────────
  /** Fires when a data cell is clicked. Checkbox and actions columns are excluded. */
  onRowClick?: (row: T) => void;

  // ── Search ────────────────────────────────────────────────────────────────
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  // ── Extra filter controls (rendered next to search) ───────────────────────
  filters?: ReactNode;

  // ── Actions ───────────────────────────────────────────────────────────────
  rowActions?: RowAction<T>[];
  bulkActions?: BulkAction[];

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DataTable<T>({
  data,
  columns,
  rowKey,
  loading = false,
  error,
  onRetry,
  title,
  description,
  icon,
  headerAction,
  onRowClick,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
  rowActions,
  bulkActions,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: DataTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState<string | null>(null);

  const allSelected = data.length > 0 && selectedIds.size === data.length;

  const toggleAll = (checked: boolean) =>
    setSelectedIds(checked ? new Set(data.map(rowKey)) : new Set());

  const toggleRow = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    checked ? next.add(id) : next.delete(id);
    setSelectedIds(next);
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkAction = async (action: BulkAction) => {
    setBulkLoading(action.label);
    try {
      await action.onClick(Array.from(selectedIds));
      clearSelection();
    } finally {
      setBulkLoading(null);
    }
  };

  const selectable = (bulkActions?.length ?? 0) > 0;
  const hasRowActions = (rowActions?.length ?? 0) > 0;
  const showSearch = onSearchChange !== undefined;
  const showFilters = filters !== undefined;
  const showToolbar = showSearch || showFilters;
  const showBulkBar = selectable && selectedIds.size > 0;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <PageHeader title={title} description={description} icon={icon} action={headerAction} />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <PageHeader title={title} description={description} icon={icon} action={headerAction} />
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <AlertCircle size={24} className="text-destructive" />
              <div>
                <p className="font-semibold mb-2">Error Loading {title}</p>
                <p className="text-muted-foreground">{error}</p>
              </div>
              {onRetry && (
                <Button onClick={onRetry} variant="default">
                  <RefreshCw size={18} className="mr-2" />
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <PageHeader title={title} description={description} icon={icon} action={headerAction} />

      {/* Toolbar */}
      {showToolbar && (
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          {showSearch && (
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange!(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
          {showFilters && <div className="flex flex-wrap gap-2">{filters}</div>}
        </div>
      )}

      {/* Bulk action toolbar */}
      {showBulkBar && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="text-sm font-medium text-foreground">
                {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'} selected
              </div>
              <div className="flex gap-2 flex-wrap">
                {bulkActions!.map((action) => (
                  <Button
                    key={action.label}
                    variant={action.variant ?? 'outline'}
                    size="sm"
                    onClick={() => handleBulkAction(action)}
                    disabled={bulkLoading !== null}
                  >
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {bulkLoading === action.label ? 'Working...' : action.label}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  disabled={bulkLoading !== null}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {data.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              {emptyIcon && <div className="text-muted-foreground">{emptyIcon}</div>}
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {emptyTitle ?? `No ${title.toLowerCase()} found`}
                </h3>
                {emptyDescription && (
                  <p className="text-muted-foreground">{emptyDescription}</p>
                )}
              </div>
              {emptyAction}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Table */
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                {selectable && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                )}
                {columns.map((col) => (
                  <TableHead key={col.key} className={col.className}>
                    {col.header}
                  </TableHead>
                ))}
                {hasRowActions && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => {
                const id = rowKey(row);
                const isSelected = selectedIds.has(id);

                return (
                  <TableRow
                    key={id}
                    data-state={isSelected ? 'selected' : undefined}
                    className={onRowClick ? 'cursor-pointer' : undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {selectable && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => toggleRow(id, checked as boolean)}
                          aria-label="Select row"
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.key} className={col.className}>
                        {col.cell(row)}
                      </TableCell>
                    ))}
                    {hasRowActions && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <RowActionsMenu actions={rowActions!} row={row} />
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PageHeader({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b">
      <div>
        <h1 className="text-3xl font-heading font-semibold mb-2 text-foreground flex items-center gap-2">
          {icon}
          {title}
        </h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function RowActionsMenu<T>({ actions, row }: { actions: RowAction<T>[]; row: T }) {
  const visible = actions.filter((a) => !a.hidden?.(row));
  if (visible.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Row actions">
          <MoreVertical size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {visible.map((action, i) => (
          <span key={action.label}>
            {action.separator && i > 0 && <DropdownMenuSeparator />}
            {action.href ? (
              <DropdownMenuItem asChild>
                <a
                  href={action.href(row)}
                  data-astro-prefetch
                  className={action.destructive ? 'text-destructive focus:text-destructive' : ''}
                >
                  {action.icon && <span className="mr-2">{action.icon}</span>}
                  {action.label}
                </a>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => action.onClick?.(row)}
                className={action.destructive ? 'text-destructive focus:text-destructive' : ''}
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </DropdownMenuItem>
            )}
          </span>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
