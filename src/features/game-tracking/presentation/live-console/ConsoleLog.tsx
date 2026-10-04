import Avatar from './Avatar';
import { TONE, card, cardTitle, segCls, type Side } from './tone';
import { periodLabel, timeoutWindow } from '../../domain/live-console/rules';
import { disqualification, lineOf } from '../../domain/live-console/derive';
import { isSubstitution, type ConsoleEvent } from '../../domain/live-console/model';
import { jersey } from './roster';
import { mmss } from './useConsoleClock';
import type { LiveConsole } from './useLiveConsole';
import type { Scorer } from './useScorer';

interface Props {
  lc: LiveConsole;
  sc: Scorer;
  onAllEvents: () => void;
}

export interface LogRow {
  key: string;
  event: ConsoleEvent;
  when: string;
  action: string;
  who: string;
  score: string;
  queued: boolean;
  linked: boolean;
  side: Side;
  sub: boolean;
}

/** Play-by-play rows, oldest first; a batch of substitutions is one row. */
export function buildLogRows(lc: LiveConsole): LogRow[] {
  const rows: Array<LogRow & { ins: string[]; outs: string[] }> = [];
  for (const e of lc.events) {
    const side: Side = e.teamId === lc.awayId ? 'away' : 'home';
    const when = `${periodLabel(e.period, lc.rules)} ${e.secondsRemaining == null ? '—' : mmss(e.secondsRemaining)}`;
    if (isSubstitution(e)) {
      const prev = rows[rows.length - 1];
      const target =
        prev && prev.sub && prev.event.teamId === e.teamId && prev.event.period === e.period && prev.event.secondsRemaining === e.secondsRemaining
          ? prev
          : null;
      const row = target ?? {
        key: e.key, event: e, when, action: '', who: '', score: '', queued: e.queued, linked: false, side, sub: true, ins: [], outs: [],
      };
      const no = `#${jersey(e.playerId ? lc.players.get(e.playerId) : undefined)}`;
      (e.eventType === 'SUBSTITUTION_IN' ? row.ins : row.outs).push(no);
      row.action = `Sub ${lc.teams[e.teamId ?? '']?.short ?? ''}`;
      row.who = `${row.ins.join(', ')} in · ${row.outs.join(', ')} out`;
      if (!target) rows.push(row);
      continue;
    }
    const x = lc.describe(e, lc.players);
    rows.push({
      key: e.key,
      event: e,
      when,
      action: `${e.metadata.parentCid ? '↳ ' : ''}${x.action}`,
      who: x.who,
      score: lc.d.scoreAt.get(e.key) ?? '',
      queued: e.queued,
      linked: !!e.metadata.parentCid,
      side,
      sub: false,
      ins: [],
      outs: [],
    });
  }
  return rows;
}

function PlayByPlay({ lc, onAllEvents }: Omit<Props, 'sc'>) {
  const rows = buildLogRows(lc).slice(-80).reverse();
  return (
    <div className={`flex flex-col ${card}`}>
      <div className="flex items-center gap-3 border-b border-[var(--bord2)] px-4 py-3">
        <span className={cardTitle}>Play-by-play</span>
        <span className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--txm)]">{lc.events.length} events</span>
        <button type="button" onClick={onAllEvents} className="ml-auto text-[12px] font-semibold text-[var(--txd)] hover:text-[var(--tx)]">
          All events →
        </button>
      </div>
      <div className="mc-scroll max-h-[560px] overflow-y-auto">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center gap-3 border-b border-[var(--bord2)] px-4 py-2 hover:bg-[var(--hov)]">
            <span className="w-[74px] flex-shrink-0 font-mono text-[11px] text-[var(--txm)]">{r.when}</span>
            <span className={`h-6 w-1 flex-shrink-0 rounded-full ${TONE[r.side].bg}`} />
            <span className={`min-w-0 flex-1 truncate text-[13px] ${r.linked ? 'pl-4' : ''}`}>
              <span className="font-semibold text-[var(--tx)]">{r.action}</span> <span className="text-[var(--txd)]">{r.who}</span>
            </span>
            {r.queued && (
              <span className="rounded border border-[var(--warn)] px-1.5 py-[1px] font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--warn)]">
                Queued
              </span>
            )}
            <span className="w-[58px] text-right font-mono text-[12px] font-bold">{r.score}</span>
            <button
              type="button"
              disabled={r.sub}
              title={r.sub ? 'Substitutions can’t be undone — record a new swap instead' : undefined}
              onClick={() => lc.undo(r.event, lc.players)}
              className="h-7 rounded-md border border-[var(--bord2)] px-2 text-[11px] font-semibold text-[var(--txm)] hover:border-[var(--bord)] hover:text-[var(--tx)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Undo
            </button>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="px-4 py-10 text-center text-[13px] text-[var(--txm)]">No events yet. Pick a player, then an action.</div>
        )}
      </div>
    </div>
  );
}

function Timeouts({ lc }: { lc: LiveConsole }) {
  const all = [lc.homeId, lc.awayId]
    .flatMap((t) => lc.d.teams.get(t)?.timeouts ?? [])
    .sort((a, b) => a.period - b.period || (b.secondsRemaining ?? 0) - (a.secondsRemaining ?? 0));
  return (
    <div className={card}>
      <div className="flex items-center justify-between border-b border-[var(--bord2)] px-4 py-3">
        <span className={cardTitle}>Timeouts</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--txm)]">{timeoutWindow(lc.period, lc.rules).label}</span>
      </div>
      <div className="flex flex-col gap-2 p-3">
        {[lc.homeId, lc.awayId].map((t) => {
          const side: Side = t === lc.homeId ? 'home' : 'away';
          const x = lc.timeoutsLeft(t);
          return (
            <div key={t} className="flex items-center gap-3 rounded-xl border border-[var(--bord2)] bg-[var(--surf2)] px-3 py-2.5">
              <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${TONE[side].bg}`} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold">{lc.teams[t]?.name}</div>
                <div className="mt-1 flex items-center gap-1">
                  {Array.from({ length: x.cap }, (_, i) => (
                    <span key={i} className={`h-2 w-5 rounded-full ${i < x.left ? TONE[side].bg : 'bg-[var(--track)]'}`} />
                  ))}
                  <span className="ml-1.5 font-mono text-[10px] uppercase text-[var(--txm)]">{x.left} left</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => lc.callTimeout(t)}
                className={`h-10 rounded-lg border px-3 text-[12px] font-bold ${
                  x.left ? 'border-[var(--bord)] text-[var(--tx)] hover:border-[var(--tx)]' : 'border-[var(--bord2)] text-[var(--faint)]'
                }`}
              >
                Call timeout
              </button>
            </div>
          );
        })}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {all.map((e) => (
            <span
              key={e.key}
              className={`rounded-md border px-2 py-1 font-mono text-[10px] font-bold uppercase text-[var(--txd)] ${
                e.teamId === lc.homeId ? TONE.home.border : TONE.away.border
              }`}
            >
              {lc.teams[e.teamId ?? '']?.short} · {periodLabel(e.period, lc.rules)} {mmss(e.secondsRemaining)}
            </span>
          ))}
          {all.length === 0 && <span className="text-[12px] text-[var(--txm)]">No timeouts taken.</span>}
        </div>
      </div>
    </div>
  );
}

function Substitutions({ lc, sc }: { lc: LiveConsole; sc: Scorer }) {
  const { sub, setSub } = sc;
  const side: Side = sub.team === lc.homeId ? 'home' : 'away';
  const floorIds = lc.floor[sub.team] ?? [];
  const bench = lc.teamRoster(sub.team).filter((p) => !floorIds.includes(p.id));
  const canSub = sub.out.length > 0 && sub.out.length === sub.in.length;
  const summary =
    !sub.out.length && !sub.in.length
      ? 'Tap players off and on — any number, as long as they match.'
      : `${sub.out.length} off · ${sub.in.length} on${canSub ? '' : ' — counts must match'}`;

  const row = (pid: string, isFloor: boolean) => {
    const p = lc.players.get(pid);
    if (!p) return null;
    const dq = !!disqualification(lineOf(lc.d, pid), lc.rules);
    const list = isFloor ? sub.out : sub.in;
    const on = list.includes(pid);
    return (
      <button
        key={pid}
        type="button"
        onClick={() => {
          if (dq && !isFloor) return;
          const next = on ? list.filter((x) => x !== pid) : [...list, pid];
          setSub({ ...sub, [isFloor ? 'out' : 'in']: next });
        }}
        className={`flex h-9 items-center gap-2 rounded-lg border px-2 text-left text-[12px] font-semibold ${
          on
            ? `${TONE[side].border} ${TONE[side].bgT} text-[var(--tx)]`
            : dq && !isFloor
              ? 'border-[var(--bord2)] text-[var(--faint)]'
              : 'border-[var(--bord2)] bg-[var(--surf2)] text-[var(--txd)] hover:text-[var(--tx)]'
        }`}
      >
        <Avatar player={p} side={side} size="h-6 w-6 text-[9px]" />
        <span className="w-6 font-anton text-[15px]">{jersey(p)}</span>
        <span className="min-w-0 flex-1 truncate">{p.short}</span>
        <span className="font-mono text-[9px] uppercase">{dq ? 'Out' : on ? (isFloor ? 'Off' : 'On') : ''}</span>
      </button>
    );
  };

  return (
    <div className={card}>
      <div className="flex items-center justify-between gap-2 border-b border-[var(--bord2)] px-4 py-3">
        <span className={cardTitle}>Substitutions</span>
        <div className="inline-flex gap-1 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] p-1">
          {[lc.homeId, lc.awayId].map((t) => (
            <button key={t} type="button" onClick={() => setSub({ team: t, out: [], in: [] })} className={segCls(sub.team === t)}>
              {lc.teams[t]?.short}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 p-3">
        <div>
          <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--faint)]">Off the floor</div>
          <div className="flex flex-col gap-1">{floorIds.map((pid) => row(pid, true))}</div>
        </div>
        <div>
          <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--faint)]">On from bench</div>
          <div className="flex flex-col gap-1">{bench.map((p) => row(p.id, false))}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-[var(--bord2)] px-3 py-2.5">
        <span className="min-w-0 flex-1 text-[12px] text-[var(--txd)]">{summary}</span>
        <button
          type="button"
          onClick={() => setSub({ ...sub, out: [], in: [] })}
          className="h-9 rounded-lg px-3 text-[12px] font-semibold text-[var(--txm)] hover:text-[var(--tx)]"
        >
          Clear
        </button>
        <button
          type="button"
          disabled={!canSub}
          onClick={() => {
            if (lc.recordSubs(sub.team, sub.out, sub.in)) setSub({ ...sub, out: [], in: [] });
          }}
          className={`h-9 rounded-lg px-4 text-[12px] font-bold ${
            canSub ? 'bg-[var(--brand)] text-white hover:bg-[var(--brandlt)]' : 'bg-[var(--chip)] text-[var(--faint)]'
          }`}
        >
          Confirm swap
        </button>
      </div>
    </div>
  );
}

export default function ConsoleLog({ lc, sc, onAllEvents }: Props) {
  return (
    <div className="mt-3 grid grid-cols-[minmax(0,1fr)_400px] gap-3 max-[1370px]:grid-cols-1">
      <PlayByPlay lc={lc} onAllEvents={onAllEvents} />
      <div className="flex flex-col gap-3">
        <Timeouts lc={lc} />
        <Substitutions lc={lc} sc={sc} />
      </div>
    </div>
  );
}
