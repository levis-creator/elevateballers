import { jsx, jsxs } from 'react/jsx-runtime';
import React__default from 'react';
import { useReactTable, getSortedRowModel, getCoreRowModel, flexRender } from '@tanstack/react-table';

function DataTable({
  data,
  columns,
  className = "",
  tableClassName = ""
}) {
  const [sorting, setSorting] = React__default.useState([]);
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });
  return /* @__PURE__ */ jsx("div", { className: `sp-table-wrapper ${className}`, children: /* @__PURE__ */ jsxs("table", { className: `sp-data-table ${tableClassName}`, children: [
    /* @__PURE__ */ jsx("thead", { children: table.getHeaderGroups().map((headerGroup) => /* @__PURE__ */ jsx("tr", { children: headerGroup.headers.map((header) => /* @__PURE__ */ jsxs(
      "th",
      {
        className: header.column.columnDef.meta?.className,
        onClick: header.column.getCanSort() ? header.column.getToggleSortingHandler() : void 0,
        style: { cursor: header.column.getCanSort() ? "pointer" : "default" },
        children: [
          header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext()),
          header.column.getIsSorted() === "asc" ? " 🔼" : header.column.getIsSorted() === "desc" ? " 🔽" : null
        ]
      },
      header.id
    )) }, headerGroup.id)) }),
    /* @__PURE__ */ jsx("tbody", { children: table.getRowModel().rows.map((row) => /* @__PURE__ */ jsx("tr", { children: row.getVisibleCells().map((cell) => /* @__PURE__ */ jsx(
      "td",
      {
        className: cell.column.columnDef.meta?.className,
        children: flexRender(cell.column.columnDef.cell, cell.getContext())
      },
      cell.id
    )) }, row.id)) })
  ] }) });
}

export { DataTable as D };
