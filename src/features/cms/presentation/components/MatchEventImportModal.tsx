import { useState, useRef } from 'react';
import Papa from 'papaparse';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const VALID_EVENT_TYPES = [
  'TWO_POINT_MADE', 'TWO_POINT_MISSED',
  'THREE_POINT_MADE', 'THREE_POINT_MISSED',
  'FREE_THROW_MADE', 'FREE_THROW_MISSED',
  'ASSIST', 'REBOUND_OFFENSIVE', 'REBOUND_DEFENSIVE',
  'STEAL', 'BLOCK', 'TURNOVER',
  'FOUL_PERSONAL', 'FOUL_TECHNICAL', 'FOUL_FLAGRANT',
  'SUBSTITUTION_IN', 'SUBSTITUTION_OUT',
  'TIMEOUT', 'INJURY', 'BREAK', 'PLAY_RESUMED', 'OTHER',
] as const;

const REQUIRED_COLUMNS = ['eventType', 'minute'];
const OPTIONAL_COLUMNS = ['period', 'secondsRemaining', 'teamId', 'playerId', 'assistPlayerId', 'description'];
const ALL_COLUMNS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];

interface ParsedRow {
  eventType: string;
  minute: string;
  period?: string;
  secondsRemaining?: string;
  teamId?: string;
  playerId?: string;
  assistPlayerId?: string;
  description?: string;
  _rowError?: string;
}

interface MatchEventImportModalProps {
  matchId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function downloadTemplate() {
  const header = ALL_COLUMNS.join(',');
  const example = 'TWO_POINT_MADE,5,1,300,team-id-here,player-id-here,,Made shot in the paint';
  const blob = new Blob([header + '\n' + example + '\n'], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'match_events_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function MatchEventImportModal({
  matchId,
  isOpen,
  onClose,
  onSuccess,
}: MatchEventImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; errors: { row: number; message: string }[] } | null>(null);

  const validRows = rows.filter((r) => !r._rowError);
  const invalidRows = rows.filter((r) => r._rowError);

  function reset() {
    setRows([]);
    setParseError(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleClose() {
    reset();
    onClose();
  }

  function validateRow(row: Record<string, string>, index: number): ParsedRow {
    const eventType = (row.eventType ?? '').trim().toUpperCase();
    if (!eventType) return { ...row, eventType, _rowError: 'Missing eventType' } as ParsedRow;
    if (!(VALID_EVENT_TYPES as readonly string[]).includes(eventType))
      return { ...row, eventType, _rowError: `Unknown eventType: ${eventType}` } as ParsedRow;

    const minute = (row.minute ?? '').trim();
    if (minute === '' || isNaN(Number(minute)) || Number(minute) < 0)
      return { ...row, eventType, _rowError: `Invalid minute: ${minute}` } as ParsedRow;

    return {
      eventType,
      minute,
      period: row.period ?? '',
      secondsRemaining: row.secondsRemaining ?? '',
      teamId: row.teamId ?? '',
      playerId: row.playerId ?? '',
      assistPlayerId: row.assistPlayerId ?? '',
      description: row.description ?? '',
    };
  }

  async function handleFile(file: File) {
    reset();
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete(res: Papa.ParseResult<Record<string, string>>) {
          if (res.errors.length > 0 && res.data.length === 0) {
            setParseError(`CSV parse error: ${res.errors[0].message}`);
            return;
          }
          const parsed = res.data.map((row, i) => validateRow(row, i));
          setRows(parsed);
        },
        error(err: Error) {
          setParseError(`Failed to parse CSV: ${err.message}`);
        },
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      try {
        const { read, utils } = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const wb = read(buffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
        const parsed = data.map((row, i) => validateRow(row, i));
        setRows(parsed);
      } catch (err: any) {
        setParseError(`Failed to parse Excel file: ${err?.message ?? 'Unknown error'}`);
      }
    } else {
      setParseError('Unsupported file type. Please upload a .csv or .xlsx file.');
    }
  }

  async function handleImport() {
    if (validRows.length === 0) return;
    setImporting(true);
    setResult(null);
    try {
      const response = await fetch(`/api/matches/${matchId}/events/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: validRows.map((r) => ({
            eventType: r.eventType,
            minute: Number(r.minute),
            period: r.period ? Number(r.period) : undefined,
            secondsRemaining: r.secondsRemaining ? Number(r.secondsRemaining) : undefined,
            teamId: r.teamId || undefined,
            playerId: r.playerId || undefined,
            assistPlayerId: r.assistPlayerId || undefined,
            description: r.description || undefined,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setParseError(data.error ?? 'Import failed');
        return;
      }

      setResult({ created: data.created, errors: data.errors ?? [] });
      if (data.created > 0) onSuccess();
    } catch (err: any) {
      setParseError(`Network error: ${err?.message ?? 'Unknown error'}`);
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Match Events</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to bulk-import events. Required columns:{' '}
            <code className="text-xs bg-muted px-1 rounded">eventType</code>,{' '}
            <code className="text-xs bg-muted px-1 rounded">minute</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template download */}
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={downloadTemplate}>
              Download Template
            </Button>
            <span className="text-xs text-muted-foreground">
              Download a pre-formatted CSV template to get started.
            </span>
          </div>

          {/* Valid event types */}
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Valid eventType values ({VALID_EVENT_TYPES.length})
            </summary>
            <div className="mt-2 flex flex-wrap gap-1">
              {VALID_EVENT_TYPES.map((t) => (
                <code key={t} className="bg-muted px-1 rounded text-xs">{t}</code>
              ))}
            </div>
          </details>

          {/* File input */}
          <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Drag & drop or click to select a file
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Select File (.csv / .xlsx)
            </Button>
          </div>

          {/* Parse error */}
          {parseError && (
            <Alert variant="destructive">
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {rows.length > 0 && !result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="default">{validRows.length} valid</Badge>
                {invalidRows.length > 0 && (
                  <Badge variant="destructive">{invalidRows.length} invalid (will be skipped)</Badge>
                )}
              </div>

              {invalidRows.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <p className="font-medium mb-1">Rows with errors (will be skipped):</p>
                    <ul className="text-xs space-y-0.5">
                      {invalidRows.slice(0, 5).map((r, i) => (
                        <li key={i}>Row {rows.indexOf(r) + 1}: {r._rowError}</li>
                      ))}
                      {invalidRows.length > 5 && <li>…and {invalidRows.length - 5} more</li>}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="overflow-x-auto max-h-60 border rounded">
                <table className="text-xs w-full">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left">#</th>
                      {ALL_COLUMNS.map((col) => (
                        <th key={col} className="px-2 py-1 text-left">{col}</th>
                      ))}
                      <th className="px-2 py-1 text-left">status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className={row._rowError ? 'bg-red-50' : i % 2 === 0 ? 'bg-white' : 'bg-muted/30'}>
                        <td className="px-2 py-1 text-muted-foreground">{i + 1}</td>
                        {ALL_COLUMNS.map((col) => (
                          <td key={col} className="px-2 py-1 max-w-[120px] truncate">
                            {(row as any)[col] ?? ''}
                          </td>
                        ))}
                        <td className="px-2 py-1">
                          {row._rowError ? (
                            <span className="text-red-600">{row._rowError}</span>
                          ) : (
                            <span className="text-green-600">OK</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import result */}
          {result && (
            <Alert variant={result.errors.length === 0 ? 'default' : 'destructive'}>
              <AlertDescription>
                <p className="font-medium">
                  Import complete: {result.created} event{result.created !== 1 ? 's' : ''} created.
                </p>
                {result.errors.length > 0 && (
                  <ul className="text-xs mt-1 space-y-0.5">
                    {result.errors.slice(0, 5).map((e, i) => (
                      <li key={i}>Row {e.row}: {e.message}</li>
                    ))}
                    {result.errors.length > 5 && <li>…and {result.errors.length - 5} more errors</li>}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button
              onClick={handleImport}
              disabled={validRows.length === 0 || importing}
            >
              {importing ? 'Importing…' : `Import ${validRows.length} Event${validRows.length !== 1 ? 's' : ''}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
