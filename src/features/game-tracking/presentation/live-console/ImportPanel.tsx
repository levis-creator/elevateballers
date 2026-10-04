/**
 * Inline CSV import for the Match events tab. Rows are parsed and validated
 * against the match players in the browser; only valid rows are sent, each
 * with a key so importing the same file twice doesn't duplicate events.
 */
import { useRef, useState } from 'react';
import { parseImport, type ImportRow } from '../../domain/live-console/importCsv';
import { EVENT_LABEL } from '../../domain/live-console/model';
import { periodLabel } from '../../domain/live-console/rules';
import { mmss } from './useConsoleClock';
import type { LiveConsole } from './useLiveConsole';

export default function ImportPanel({ lc, onDone }: { lc: LiveConsole; onDone: () => void }) {
  const [text, setText] = useState('');
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  const teams = [lc.homeId, lc.awayId].map((id) => ({ id, short: lc.teams[id]?.short ?? '', name: lc.teams[id]?.name ?? '' }));
  const validate = (value = text) =>
    setRows(parseImport(value, { rules: lc.rules, teams, homeId: lc.homeId, awayId: lc.awayId, players: lc.roster }));

  const load = async (f: File | undefined) => {
    if (!f) return;
    const value = await f.text();
    setText(value);
    validate(value);
  };

  const valid = (rows ?? []).filter((r) => r.event);
  const bad = (rows ?? []).filter((r) => r.error);

  const importRows = async () => {
    if (!valid.length) return;
    setBusy(true);
    const res = await fetch(`/api/matches/${lc.matchId}/events/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: valid.map((r) => r.event) }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => null) : null;
    setBusy(false);
    if (!res?.ok) {
      lc.flash(data?.error || 'Import failed — nothing was saved');
      return;
    }
    const failed = data?.errors?.length ?? 0;
    lc.flash(`Imported ${data?.created ?? 0} event${data?.created === 1 ? '' : 's'}${failed ? ` · ${failed} failed` : ''}`);
    await lc.refreshEvents();
    onDone();
  };

  const name = (r: ImportRow) => {
    const e = r.event!;
    const who = e.playerId ? lc.players.get(e.playerId) : null;
    return `${periodLabel(e.period, lc.rules)} ${e.secondsRemaining == null ? '—' : mmss(e.secondsRemaining)} · ${lc.teams[e.teamId ?? '']?.short ?? ''} · ${who ? `#${who.no} ${who.short}` : 'team'} · ${EVENT_LABEL[e.eventType] ?? e.eventType}`;
  };

  return (
    <div className="border-b border-[var(--bord2)] bg-[var(--surf2)] p-4">
      <button
        type="button"
        onClick={() => file.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          load(e.dataTransfer.files[0]);
        }}
        className={`flex min-h-[120px] w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-center ${
          over ? 'border-[var(--brand)]' : 'border-[var(--bord)] hover:border-[var(--tx)]'
        }`}
      >
        <span className="text-[14px] font-semibold">Drop a CSV or paste rows</span>
        <span className="font-mono text-[11px] text-[var(--txm)]">period, clock, team, jersey, action[, detail]</span>
        <span className="font-mono text-[11px] text-[var(--txm)]">e.g. 2, 04:12, {teams[0].short || 'HOME'}, 7, 3PT_MADE</span>
        <input ref={file} type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={(e) => load(e.target.files?.[0])} />
      </button>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setRows(null);
        }}
        rows={4}
        placeholder={'or paste here, one event per line\nActions: 2PT_MADE 2PT_MISSED 3PT_MADE 3PT_MISSED FT_MADE FT_MISSED AST OREB DREB STL BLK TOV PF TF UF EJ BTF CTF TIMEOUT'}
        className="mc-inp mt-3 resize-y font-mono text-[12px]"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="min-w-0 flex-1 text-[12px] text-[var(--txd)]">
          {rows
            ? `${valid.length} ready${bad.length ? ` · ${bad.length} with problems (skipped)` : ''}`
            : 'Rows are validated against Match players before anything is written. Existing events are kept.'}
        </span>
        <button
          type="button"
          disabled={!text.trim()}
          onClick={() => validate()}
          className={`h-9 rounded-lg border px-3 text-[12px] font-semibold ${
            text.trim() ? 'border-[var(--bord)] text-[var(--txd)] hover:text-[var(--tx)]' : 'border-[var(--bord)] text-[var(--faint)]'
          }`}
        >
          Validate {text.trim() ? text.trim().split(/\n/).filter((l) => l.trim() && !l.trim().startsWith('#')).length : 0} rows
        </button>
        {rows && valid.length > 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={importRows}
            className="h-9 rounded-lg bg-[var(--brand)] px-3 text-[12px] font-bold text-white hover:bg-[var(--brandlt)] disabled:opacity-60"
          >
            {busy ? 'Importing…' : `Import ${valid.length}`}
          </button>
        )}
      </div>
      {rows && rows.length > 0 && (
        <div className="mc-scroll mt-3 max-h-[220px] overflow-y-auto rounded-lg border border-[var(--bord2)] bg-[var(--surf)]">
          {rows.map((r) => (
            <div key={r.line} className="flex items-start gap-3 border-b border-[var(--bord2)] px-3 py-1.5 font-mono text-[11px] last:border-b-0">
              <span className="w-10 flex-shrink-0 text-[var(--faint)]">L{r.line}</span>
              <span className={r.error ? 'text-[var(--warn)]' : 'text-[var(--ok)]'}>{r.error ? '!' : '✓'}</span>
              <span className={`min-w-0 flex-1 ${r.error ? 'text-[var(--txd)]' : 'text-[var(--tx)]'}`}>
                {r.error ? `${r.text} — ${r.error}` : name(r)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
