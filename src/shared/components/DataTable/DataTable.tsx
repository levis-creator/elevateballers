import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  className?: string;
  pageSize?: number;
}

export function DataTable<TData>({
  data,
  columns,
  className = '',
  pageSize = 10,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize });

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const { pageIndex } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const showPagination = pageCount > 1;

  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    if (pageCount <= 7) {
      for (let i = 0; i < pageCount; i++) pages.push(i);
    } else {
      pages.push(0);
      if (pageIndex > 2) pages.push('...');
      const start = Math.max(1, pageIndex - 1);
      const end = Math.min(pageCount - 2, pageIndex + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (pageIndex < pageCount - 3) pages.push('...');
      pages.push(pageCount - 1);
    }
    return pages;
  };

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-0 hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                const canSort = header.column.getCanSort();
                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'h-auto bg-brand-red text-white font-normal uppercase text-xs py-3 px-2 text-center',
                      canSort && 'cursor-pointer select-none',
                      header.column.columnDef.meta?.className as string,
                    )}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center justify-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className="shrink-0">
                            {sorted === 'asc' ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : sorted === 'desc' ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronsUpDown className="h-3 w-3 opacity-50" />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                No data available.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row, index) => (
              <TableRow
                key={row.id}
                className={cn(
                  'border-0 transition-colors',
                  index % 2 === 0
                    ? 'bg-white hover:bg-gray-50'
                    : 'bg-table-alt hover:brightness-95',
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      'py-3 px-2 text-sm text-center',
                      cell.column.columnDef.meta?.className as string,
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {showPagination && (
        <div className="flex flex-wrap items-center justify-center gap-1 pt-4 pb-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className={cn(
              'inline-flex items-center gap-1 rounded border px-3 py-1.5 text-xs font-medium transition-colors',
              'border-gray-300 bg-white text-gray-600 hover:bg-gray-50',
              !table.getCanPreviousPage() && 'pointer-events-none opacity-40',
            )}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </button>

          {getPageNumbers().map((page, i) =>
            page === '...' ? (
              <span key={`ellipsis-${i}`} className="px-1 text-xs text-gray-400">
                …
              </span>
            ) : (
              <button
                key={page}
                onClick={() => table.setPageIndex(page as number)}
                className={cn(
                  'h-8 min-w-[2rem] rounded border px-2 text-xs font-medium transition-colors',
                  page === pageIndex
                    ? 'border-brand-red bg-brand-red font-bold text-white'
                    : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50',
                )}
              >
                {(page as number) + 1}
              </button>
            ),
          )}

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className={cn(
              'inline-flex items-center gap-1 rounded border px-3 py-1.5 text-xs font-medium transition-colors',
              'border-gray-300 bg-white text-gray-600 hover:bg-gray-50',
              !table.getCanNextPage() && 'pointer-events-none opacity-40',
            )}
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
