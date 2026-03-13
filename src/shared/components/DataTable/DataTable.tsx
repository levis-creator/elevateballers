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

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  className?: string;
  tableClassName?: string;
  pageSize?: number;
}

export function DataTable<TData>({
  data,
  columns,
  className = '',
  tableClassName = '',
  pageSize = 10,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    initialState: {
      pagination: { pageSize, pageIndex: 0 },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const { pageIndex } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const showPagination = pageCount > 1;

  // Build page number list with ellipsis
  const getPageNumbers = () => {
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
    <div className={`sp-table-wrapper ${className}`}>
      <table className={`sp-data-table ${tableClassName}`}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={header.column.columnDef.meta?.className as string}
                  onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                  style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === 'asc' ? ' 🔼' : header.column.getIsSorted() === 'desc' ? ' 🔽' : null}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={cell.column.columnDef.meta?.className as string}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {showPagination && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          padding: '16px 0 8px',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            style={btnStyle(!table.getCanPreviousPage())}
          >
            &laquo; Prev
          </button>

          {getPageNumbers().map((page, i) =>
            page === '...' ? (
              <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: '#888' }}>…</span>
            ) : (
              <button
                key={page}
                onClick={() => table.setPageIndex(page as number)}
                style={pageStyle(page === pageIndex)}
              >
                {(page as number) + 1}
              </button>
            )
          )}

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            style={btnStyle(!table.getCanNextPage())}
          >
            Next &raquo;
          </button>
        </div>
      )}
    </div>
  );
}

const base: React.CSSProperties = {
  padding: '6px 12px',
  border: '1px solid #ddd',
  borderRadius: '3px',
  background: '#fff',
  color: '#535353',
  fontSize: '13px',
  cursor: 'pointer',
  lineHeight: 1.4,
};

const btnStyle = (disabled: boolean): React.CSSProperties => ({
  ...base,
  opacity: disabled ? 0.4 : 1,
  cursor: disabled ? 'default' : 'pointer',
});

const pageStyle = (active: boolean): React.CSSProperties => ({
  ...base,
  background: active ? '#dd3333' : '#fff',
  color: active ? '#fff' : '#535353',
  borderColor: active ? '#dd3333' : '#ddd',
  fontWeight: active ? 700 : 400,
});
