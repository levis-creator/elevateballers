import { useMemo, useState } from 'react';
import { PermissionProvider, usePermissions } from '@/features/rbac/usePermissions';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChevronLeft, Zap, AlertCircle, RefreshCw, Repeat } from 'lucide-react';
import type { MatchView, BoxRow, PbpEvent, MatchState, TimelineKind } from '../../domain/entities/match-detail-v2';
import { computeLeaders } from '../../domain/usecases/match-detail-leaders';
import { useMatchDetailData } from './hooks/useMatchDetailData';

/* -------------------------------------------------------------------------- */
/* Presentational constants                                                   */
/* -------------------------------------------------------------------------- */

const HOME = '#e4002b';
const AWAY = '#f5c518';
const GOLD = '#f5c518';

const sideColor = (side: 'home' | 'away' | 'neutral') =>
  side === 'home' ? HOME : side === 'away' ? AWAY : 'var(--txm)';

/** Play-by-play chip colour by category (made shots green, playmaking blue, negatives red). */
function chipColor(cat: string): string {
  if (cat === '2PT' || cat === '3PT' || cat === 'FT') return '#1f9d55';
  if (cat === 'TO' || cat === 'FOUL') return '#e4002b';
  return '#2a6fdb';
}

function statePill(state: MatchState): { label: string; color: string } {
  if (state === 'live') return { label: 'Live', color: '#e4002b' };
  if (state === 'final') return { label: 'Completed', color: '#1f9d55' };
  return { label: 'Scheduled', color: '#d98324' };
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* -------------------------------------------------------------------------- */
/* Shared bits                                                                */
/* -------------------------------------------------------------------------- */

function Crest({ abbr, color, size }: { abbr: string; color: string; size: number }) {
  return (
    <span
      className="flex flex-shrink-0 items-center justify-center rounded-full font-['Anton'] uppercase leading-none"
      style={{
        width: size,
        height: size,
        border: `2px solid ${color}`,
        background: `${color}1f`,
        color,
        fontSize: size * 0.34,
      }}
    >
      {abbr}
    </span>
  );
}

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-[var(--bord)] bg-[var(--surf)] ${className}`}>{children}</div>
);

/* -------------------------------------------------------------------------- */
/* Scoreboard                                                                 */
/* -------------------------------------------------------------------------- */

function Scoreboard({ view }: { view: MatchView }) {
  const pill = statePill(view.state);
  const { home, away } = view;
  const isFinal = view.state === 'final';
  const homeWon = isFinal && home.score != null && away.score != null && home.score > away.score;
  const awayWon = isFinal && home.score != null && away.score != null && away.score > home.score;

  const sideLabel = (won: boolean) =>
    view.state === 'live' ? 'LIVE' : isFinal ? (won ? 'WINNER' : 'FINAL') : (view.time || 'SCHEDULED');

  const TeamCol = ({ side, won, color }: { side: typeof home; won: boolean; color: string }) => (
    <div className="flex flex-1 flex-col items-center gap-2 text-center">
      <Crest abbr={side.abbr} color={color} size={64} />
      <div className="font-['Anton'] text-[19px] uppercase leading-tight text-[var(--tx)]">{side.name}</div>
      <div
        className="font-['Space_Mono'] text-[10px] uppercase tracking-[0.14em]"
        style={{ color: won ? '#1f9d55' : 'var(--txm)' }}
      >
        {sideLabel(won)}
      </div>
    </div>
  );

  const scoreCls = (won: boolean, hasScore: boolean) =>
    `font-['Anton'] text-[64px] leading-none max-[600px]:text-[44px] ${
      !hasScore ? 'text-[var(--faint)]' : won ? 'text-[var(--brand)]' : 'text-[var(--txd)]'
    }`;

  return (
    <Card className="relative overflow-hidden p-6 max-[600px]:p-4">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(90% 130% at 50% -20%, rgba(228,0,43,0.10), transparent 60%)' }}
      />
      <div className="relative mb-5 flex flex-wrap items-center justify-center gap-3 text-center">
        <span
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-['Space_Mono'] text-[10px] font-bold uppercase tracking-[0.1em]"
          style={{ background: `${pill.color}1f`, color: pill.color }}
        >
          <span className="h-[6px] w-[6px] rounded-full" style={{ background: pill.color }} />
          {pill.label}
        </span>
        <span className="font-['Space_Mono'] text-[11px] uppercase tracking-[0.1em] text-[var(--txm)]">
          {[view.scoreboardTag, view.dateText, view.time].filter(Boolean).join(' · ')}
        </span>
      </div>

      <div className="relative flex items-center justify-center gap-4 max-[600px]:gap-2">
        <TeamCol side={home} won={homeWon} color={HOME} />
        <div className="flex items-center gap-3 max-[600px]:gap-1.5">
          <span className={scoreCls(homeWon, home.score != null)}>{home.score ?? '–'}</span>
          <span className="font-['Anton'] text-[28px] text-[var(--faint)]">-</span>
          <span className={scoreCls(awayWon, away.score != null)}>{away.score ?? '–'}</span>
        </div>
        <TeamCol side={away} won={awayWon} color={AWAY} />
      </div>

      {/* quarter breakdown */}
      {view.quarters.length > 0 && view.periodLabels.length > 0 && (
        <div className="relative mx-auto mt-6 max-w-[460px] overflow-x-auto">
          <table className="w-full border-collapse font-['Space_Mono'] text-[12px]">
            <thead>
              <tr className="text-[var(--txm)]">
                <th className="py-1.5 pr-3 text-left text-[10px] uppercase tracking-[0.1em]">Team</th>
                {view.periodLabels.map((p) => (
                  <th key={p} className="px-2 py-1.5 text-center text-[10px] uppercase tracking-[0.08em]">{p}</th>
                ))}
                <th className="pl-2 py-1.5 text-center text-[10px] uppercase tracking-[0.1em] text-[var(--tx)]">T</th>
              </tr>
            </thead>
            <tbody>
              {view.quarters.map((q, i) => {
                const won = (i === 0 && homeWon) || (i === 1 && awayWon);
                return (
                  <tr key={q.abbr + i} className="border-t border-[var(--bord2)]">
                    <td className="py-2 pr-3 text-left font-bold text-[var(--tx)]">{q.abbr}</td>
                    {q.scores.map((s, j) => (
                      <td key={j} className="px-2 py-2 text-center text-[var(--txd)]">{s}</td>
                    ))}
                    <td
                      className="pl-2 py-2 text-center font-bold"
                      style={{ color: won ? 'var(--brand)' : 'var(--tx)' }}
                    >
                      {q.total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Leader cards                                                               */
/* -------------------------------------------------------------------------- */

function LeaderCards({ view }: { view: MatchView }) {
  const leaders = useMemo(
    () => computeLeaders(view.box, view.home.abbr, view.away.abbr),
    [view.box, view.home.abbr, view.away.abbr],
  );
  if (leaders.length === 0) return null;
  return (
    <div className="grid grid-cols-3 gap-3 max-[720px]:grid-cols-1">
      {leaders.map((l) => (
        <Card key={l.key} className="p-4">
          <div className="mb-2.5 font-['Space_Mono'] text-[10px] uppercase tracking-[0.12em] text-[var(--txm)]">{l.label}</div>
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-['Anton'] text-[13px]"
              style={{ background: `${GOLD}1f`, color: GOLD }}
            >
              {initials(l.name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-['Archivo'] text-[13.5px] font-bold text-[var(--tx)]">{l.name}</div>
              <div className="font-['Space_Mono'] text-[10.5px] text-[var(--txm)]">{l.team}</div>
            </div>
            <span className="font-['Anton'] text-[26px] leading-none" style={{ color: GOLD }}>{l.value}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Box score                                                                  */
/* -------------------------------------------------------------------------- */

const BOX_COLS: { key: keyof BoxRow; label: string }[] = [
  { key: 'pts', label: 'PTS' },
  { key: 'reb', label: 'REB' },
  { key: 'ast', label: 'AST' },
  { key: 'stl', label: 'STL' },
  { key: 'blk', label: 'BLK' },
  { key: 'pf', label: 'PF' },
];

function TeamBox({
  name,
  abbr,
  color,
  score,
  rows,
}: {
  name: string;
  abbr: string;
  color: string;
  score: number | null;
  rows: BoxRow[];
}) {
  const totals = BOX_COLS.reduce((acc, c) => {
    acc[c.key] = rows.reduce((s, r) => s + (r[c.key] as number), 0);
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--bord2)] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Crest abbr={abbr} color={color} size={26} />
          <h3 className="font-['Anton'] text-[17px] uppercase text-[var(--tx)]">{name}</h3>
        </div>
        <span className="font-['Anton'] text-[22px]" style={{ color: GOLD }}>{score ?? '–'}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="font-['Space_Mono'] text-[10px] uppercase tracking-[0.08em] text-[var(--txm)]">
              <th className="py-2 pl-4 pr-2 text-left font-normal">Player</th>
              {BOX_COLS.map((c) => (
                <th key={c.key} className="px-2 py-2 text-right font-normal last:pr-4">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={BOX_COLS.length + 1} className="px-4 py-6 text-center font-['Archivo'] text-[13px] text-[var(--txm)]">
                  No players recorded.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.name + i} className="border-t border-[var(--bord2)]">
                  <td className="py-2.5 pl-4 pr-2">
                    <span className="flex items-center gap-2">
                      {r.num && <span className="font-['Space_Mono'] text-[11px] text-[var(--faint)]">{r.num.replace('#', '')}</span>}
                      <span className="font-['Archivo'] text-[13px] font-semibold text-[var(--tx)]">{r.name}</span>
                      {r.starter && (
                        <span className="rounded bg-[var(--chip)] px-1.5 py-0.5 font-['Space_Mono'] text-[8.5px] uppercase tracking-[0.06em] text-[var(--txm)]">ST</span>
                      )}
                    </span>
                  </td>
                  {BOX_COLS.map((c) => (
                    <td
                      key={c.key}
                      className={`px-2 py-2.5 text-right tabular-nums last:pr-4 ${
                        c.key === 'pts' ? "font-['Archivo'] font-bold text-[var(--tx)]" : 'text-[var(--txd)]'
                      }`}
                    >
                      {r[c.key] as number}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-[var(--bord)] font-['Space_Mono'] text-[11px] uppercase tracking-[0.06em] text-[var(--txm)]">
                <td className="py-2.5 pl-4 pr-2 text-left">Totals</td>
                {BOX_COLS.map((c) => (
                  <td key={c.key} className="px-2 py-2.5 text-right font-bold text-[var(--tx)] last:pr-4">{totals[c.key]}</td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Play-by-play                                                               */
/* -------------------------------------------------------------------------- */

interface FlatPbp extends PbpEvent {
  period: string;
}

function PlayByPlay({ view }: { view: MatchView }) {
  const [period, setPeriod] = useState<string>('all');
  const flat: FlatPbp[] = useMemo(
    () => view.pbpPeriods.flatMap((p) => (view.pbpByPeriod[p] || []).map((e) => ({ ...e, period: p }))),
    [view.pbpPeriods, view.pbpByPeriod],
  );

  if (flat.length === 0) {
    return (
      <Card className="px-6 py-12 text-center font-['Archivo'] text-[13px] text-[var(--txm)]">
        No play-by-play recorded for this match.
      </Card>
    );
  }

  const shown = period === 'all' ? flat : flat.filter((e) => e.period === period);
  const pills = ['all', ...view.pbpPeriods];

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--bord2)] px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-['Anton'] text-[18px] uppercase text-[var(--tx)]">Play-by-Play</h2>
          <div className="flex flex-wrap gap-1.5">
            {pills.map((p) => {
              const on = period === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  aria-pressed={on}
                  className={`rounded-full border px-2.5 py-0.5 font-['Space_Mono'] text-[10px] font-bold uppercase tracking-[0.06em] transition-colors ${
                    on
                      ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]'
                      : 'border-[var(--bord)] text-[var(--txm)] hover:text-[var(--tx)]'
                  }`}
                >
                  {p === 'all' ? 'All' : p}
                </button>
              );
            })}
          </div>
        </div>
        <span className="font-['Space_Mono'] text-[10px] uppercase tracking-[0.1em] text-[var(--txm)]">{shown.length} events</span>
      </div>
      <div>
        {shown.map((e, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-[var(--bord2)] py-2.5 pl-4 pr-4 last:border-b-0"
            style={{ borderLeft: `3px solid ${sideColor(e.side)}` }}
          >
            <div className="w-[52px] flex-shrink-0 text-center font-['Space_Mono'] text-[10px] leading-tight text-[var(--txm)]">
              <div>{e.period}</div>
              <div className="text-[var(--faint)]">{e.t}</div>
            </div>
            <span
              className="w-[42px] flex-shrink-0 rounded px-1.5 py-1 text-center font-['Space_Mono'] text-[9px] font-bold uppercase tracking-[0.04em]"
              style={{ background: `${chipColor(e.cat)}22`, color: chipColor(e.cat) }}
            >
              {e.cat}
            </span>
            <span className="min-w-0 flex-1 truncate font-['Archivo'] text-[13px] text-[var(--txd)]">{e.text}</span>
            <span className="flex-shrink-0 font-['Space_Mono'] text-[12px] font-bold tabular-nums text-[var(--tx)]">{e.score}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Substitution timeline                                                      */
/* -------------------------------------------------------------------------- */

const TL_FILTERS: { key: 'all' | TimelineKind; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'scoring', label: 'Scoring' },
  { key: 'subs', label: 'Subs' },
  { key: 'fouls', label: 'Fouls' },
];

function Timeline({ view }: { view: MatchView }) {
  const [filter, setFilter] = useState<'all' | TimelineKind>('all');

  if (view.timeline.length === 0) {
    return (
      <Card className="px-6 py-12 text-center font-['Archivo'] text-[13px] text-[var(--txm)]">
        No timeline recorded for this match.
      </Card>
    );
  }

  const shown = filter === 'all' ? view.timeline : view.timeline.filter((e) => e.kind === filter);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--bord2)] px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--brand)]/[0.12] text-[var(--brand)]">
            <Repeat className="h-[15px] w-[15px]" />
          </span>
          <h2 className="font-['Anton'] text-[18px] uppercase text-[var(--tx)]">Match Timeline</h2>
          <div className="flex flex-wrap gap-1.5">
            {TL_FILTERS.map((f) => {
              const on = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  aria-pressed={on}
                  className={`rounded-full border px-2.5 py-0.5 font-['Space_Mono'] text-[10px] font-bold uppercase tracking-[0.06em] transition-colors ${
                    on
                      ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]'
                      : 'border-[var(--bord)] text-[var(--txm)] hover:text-[var(--tx)]'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
        <span className="font-['Space_Mono'] text-[10px] uppercase tracking-[0.1em] text-[var(--txm)]">{shown.length} events</span>
      </div>

      <div className="relative p-5">
        {shown.length > 1 && (
          <span className="pointer-events-none absolute bottom-8 left-[24px] top-8 w-px bg-[var(--bord)]" />
        )}
        <div className="relative flex flex-col gap-3">
          {shown.map((e, i) => (
            <div key={i} className="flex items-start gap-3">
              <span
                className="relative z-10 mt-[9px] h-[10px] w-[10px] flex-shrink-0 rounded-full ring-4 ring-[var(--surf)]"
                style={{ background: e.color }}
              />
              <div className="flex-1 rounded-lg border border-[var(--bord2)] bg-[var(--surf2)] px-4 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span
                      className="rounded px-1.5 py-0.5 font-['Space_Mono'] text-[8.5px] font-bold uppercase tracking-[0.06em]"
                      style={{ background: `${e.color}22`, color: e.color }}
                    >
                      {e.chip}
                    </span>
                    <span className="font-['Archivo'] text-[13px] font-bold text-[var(--tx)]">{e.title}</span>
                    {e.team && <span className="font-['Space_Mono'] text-[11px] text-[var(--txm)]">· {e.team}</span>}
                  </div>
                  <span className="flex-shrink-0 font-['Space_Mono'] text-[10.5px] text-[var(--txm)]">{e.t}</span>
                </div>
                {e.detail && <div className="mt-0.5 font-['Archivo'] text-[12px] text-[var(--txm)]">{e.detail}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Main content                                                               */
/* -------------------------------------------------------------------------- */

type TabKey = 'box' | 'pbp' | 'timeline';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'box', label: 'Box Score' },
  { key: 'pbp', label: 'Play-by-Play' },
  { key: 'timeline', label: 'Timeline' },
];

function ConsoleButton({ matchId, state }: { matchId: string; state: MatchState }) {
  const { can } = usePermissions();
  // Completed matches are read-only — no scoring console entry point.
  if (state === 'final' || !can('matches:update')) return null;
  const cfg =
    state === 'live'
      ? { label: 'Live Console', color: '#e4002b' }
      : { label: 'Score Console', color: '#2a6fdb' };
  return (
    <a
      href={`/admin/matches/console/${matchId}`}
      data-astro-prefetch
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 font-['Archivo'] text-[12px] font-extrabold uppercase tracking-[0.05em] text-white no-underline transition-opacity hover:opacity-90"
      style={{ background: cfg.color }}
    >
      <Zap className="h-4 w-4" /> {cfg.label}
    </a>
  );
}

function MatchDetailContent({ matchId }: { matchId: string }) {
  const { view, loading, error, refetch } = useMatchDetailData(matchId);
  const [tab, setTab] = useState<TabKey>('box');

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-52 rounded-2xl bg-[var(--surf)]" />
        <div className="grid grid-cols-3 gap-3 max-[720px]:grid-cols-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-[var(--surf)]" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-[var(--surf)]" />
      </div>
    );
  }

  if (error || !view) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[var(--bord)] bg-[var(--surf)] px-6 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surf2)] text-[var(--txm)]">
          <AlertCircle className="h-6 w-6" />
        </span>
        <div>
          <h3 className="font-['Anton'] text-[22px] uppercase text-[var(--tx)]">Could not load match</h3>
          <p className="mt-1 font-['Archivo'] text-[13.5px] text-[var(--txm)]">{error || 'Match not found.'}</p>
        </div>
        <button
          type="button"
          onClick={refetch}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--bord)] px-4 py-2.5 font-['Archivo'] text-[12px] font-extrabold uppercase tracking-[0.05em] text-[var(--txd)] hover:text-[var(--tx)]"
        >
          <RefreshCw className="h-4 w-4" /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="font-['Archivo'] text-[var(--tx)]">
      {/* action bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <a href="/admin/matches" className="inline-flex items-center gap-1.5 font-['Space_Mono'] text-[11px] uppercase tracking-[0.1em] text-[var(--txm)] no-underline hover:text-[var(--tx)]">
          <ChevronLeft className="h-4 w-4" /> All Matches
        </a>
        <ConsoleButton matchId={view.id || matchId} state={view.state} />
      </div>

      <div className="space-y-4">
        <Scoreboard view={view} />
        <LeaderCards view={view} />

        {view.showStats ? (
          <>
            {/* tabs */}
            <div className="flex gap-6 border-b border-[var(--bord2)]">
              {TABS.map((t) => {
                const on = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={`relative -mb-px pb-2.5 pt-1 font-['Archivo'] text-[12px] font-extrabold uppercase tracking-[0.05em] ${
                      on ? 'text-[var(--tx)]' : 'text-[var(--txm)] hover:text-[var(--txd)]'
                    }`}
                  >
                    {t.label}
                    {on && <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-[var(--brand)]" />}
                  </button>
                );
              })}
            </div>

            {tab === 'box' && (
              <div className="space-y-4">
                <TeamBox name={view.home.name} abbr={view.home.abbr} color={HOME} score={view.home.score} rows={view.box.home} />
                <TeamBox name={view.away.name} abbr={view.away.abbr} color={AWAY} score={view.away.score} rows={view.box.away} />
              </div>
            )}
            {tab === 'pbp' && <PlayByPlay view={view} />}
            {tab === 'timeline' && <Timeline view={view} />}
          </>
        ) : (
          <Card className="px-6 py-14 text-center">
            <h3 className="font-['Anton'] text-[20px] uppercase text-[var(--tx)]">Match hasn't started</h3>
            <p className="mt-1.5 font-['Archivo'] text-[13.5px] text-[var(--txm)]">
              Box score, play-by-play and the substitution timeline appear once the game tips off.
            </p>
          </Card>
        )}
      </div>

      <div className="py-6 text-center font-['Space_Mono'] text-[11px] tracking-[0.04em] text-[var(--faint)]">
        Elevate Ballers CMS · v2 · Nairobi, Kenya
      </div>
    </div>
  );
}

export default function MatchDetailV2({ matchId }: { matchId: string }) {
  return (
    <ErrorBoundary>
      <PermissionProvider>
        <MatchDetailContent matchId={matchId} />
      </PermissionProvider>
    </ErrorBoundary>
  );
}
