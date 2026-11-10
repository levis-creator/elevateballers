/**
 * CSV building for admin exports. Cells that start with a formula character are
 * prefixed with a quote so spreadsheet apps show them as text instead of
 * running them (public registration fields are user-supplied).
 */
export function csvCell(value: unknown): string {
  let text = value instanceof Date ? value.toISOString() : String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: unknown[][]): string {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
}

const BOM = String.fromCharCode(0xfeff);

export function csvResponse(rows: unknown[][], filename: string): Response {
  // The BOM makes Excel read names with accents correctly.
  return new Response(`${BOM}${toCsv(rows)}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

/** `YYYY-MM-DD` for file names. */
export const csvDateStamp = () => new Date().toISOString().slice(0, 10);
