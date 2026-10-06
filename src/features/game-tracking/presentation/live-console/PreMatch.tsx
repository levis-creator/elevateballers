import Avatar from './Avatar';
import { card, cardHead, cardTitle, type Side } from './tone';
import { rulesShort, type ConsoleRules } from '../../domain/live-console/rules';
import { jersey, type RosterPlayer } from './roster';
import { KEY_LEGEND, KeyLegend } from './KeyLegend';
import type { LiveConsole } from './useLiveConsole';

export interface Check {
  ok: boolean;
  title: string;
  detail: string;
  action?: { label: string; run: () => void };
}

export function CheckList({ title, checks, countLabel }: { title: string; checks: Check[]; countLabel: string }) {
  const done = checks.filter((c) => c.ok).length;
  return (
    <div className={card}>
      <div className={cardHead}>
        <span className={cardTitle}>{title}</span>
        <span
          className={`font-mono text-[10px] font-bold uppercase tracking-[0.12em] ${
            done === checks.length ? 'text-[var(--ok)]' : 'text-[var(--warn)]'
          }`}
        >
          {done} of {checks.length} {countLabel}
        </span>
      </div>
      <div>
        {checks.map((c) => (
          <div key={c.title} className="flex items-center gap-3 border-b border-[var(--bord2)] px-4 py-3 last:border-b-0">
            <span
              className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
                c.ok ? 'bg-[var(--ok)] text-[var(--bg)]' : 'border-2 border-[var(--warn)] text-[var(--warn)]'
              }`}
            >
              {c.ok ? '✓' : '!'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold">{c.title}</div>
              <div className="mt-0.5 text-[12px] text-[var(--txd)]">{c.detail}</div>
            </div>
            {c.action && (
              <button
                type="button"
                onClick={c.action.run}
                className="h-9 rounded-lg border border-[var(--bord)] px-3 text-[12px] font-semibold text-[var(--txd)] hover:border-[var(--tx)] hover:text-[var(--tx)]"
              >
                {c.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function rulesList(rules: ConsoleRules) {
  return [
    { k: 'Periods', v: `${rules.periods} × ${rules.periodMin}:00` },
    { k: 'Halftime', v: `After Q${rules.halftimePeriod}` },
    { k: 'Overtime', v: `${rules.otMin}:00 each` },
    { k: 'Timeouts', v: `${rules.timeoutsFirstHalf} first half · ${rules.timeoutsSecondHalf} second · ${rules.timeoutsPerOT} per OT` },
    { k: 'Team foul bonus', v: `At ${rules.foulsForBonus}${rules.teamFoulsCarryIntoOT ? ` · Q${rules.periods} carries into OT` : ''}` },
    { k: 'Disqualification', v: `${rules.foulsToFoulOut} fouls · 2 T · 2 U · T + U` },
    { k: 'Turnover types', v: rules.trackTurnoverTypes ? 'Tracked' : 'Not tracked' },
  ];
}

/** Jersey numbers used more than once in a team's squad. */
export function duplicateNumbers(players: RosterPlayer[]): number[] {
  const seen = new Set<number>();
  const dupes = new Set<number>();
  for (const p of players) {
    if (p.no == null) continue;
    if (seen.has(p.no)) dupes.add(p.no);
    seen.add(p.no);
  }
  return [...dupes];
}

export function canStartGame(lc: LiveConsole): boolean {
  return [lc.homeId, lc.awayId].every((t) => {
    const squad = lc.teamRoster(t);
    return squad.filter((p) => p.started).length === 5 && duplicateNumbers(squad).length === 0;
  });
}

interface PreMatchProps {
  lc: LiveConsole;
  tipTime: string;
  tipIn: string;
  tipDay: string;
  starting: boolean;
  onStart: () => void;
  onReviewPlayers: () => void;
}

export default function PreMatch({ lc, tipTime, tipIn, tipDay, starting, onStart, onReviewPlayers }: PreMatchProps) {
  const teams = [lc.homeId, lc.awayId];
  const starters = (t: string) => lc.teamRoster(t).filter((p) => p.started);
  const dupes = teams.flatMap((t) => duplicateNumbers(lc.teamRoster(t)));
  const review = { label: 'Review', run: onReviewPlayers };
  const checks: Check[] = [
    ...teams.map((t) => {
      const n = starters(t).length;
      return {
        ok: n === 5,
        title: `${lc.teams[t]?.name} lineup`,
        detail: `${lc.teamRoster(t).length} players · ${n}/5 starters`,
        action: review,
      };
    }),
    {
      ok: dupes.length === 0,
      title: 'Jersey numbers',
      detail: dupes.length ? `Duplicate numbers: ${dupes.join(', ')}` : 'All unique on both rosters',
      action: dupes.length ? { label: 'Fix', run: onReviewPlayers } : undefined,
    },
    {
      ok: true,
      title: 'Game rules',
      detail: `${lc.rules.label} · ${rulesShort(lc.rules)} · timeouts ${lc.rules.timeoutsFirstHalf} / ${lc.rules.timeoutsSecondHalf} / ${lc.rules.timeoutsPerOT} · bonus at ${lc.rules.foulsForBonus} team fouls`,
    },
    {
      ok: lc.isOnline,
      title: 'Console connection',
      detail: lc.isOnline
        ? 'Connected · events queue locally if the signal drops'
        : 'Offline — events will queue until reconnected',
    },
  ];
  const ready = canStartGame(lc);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_360px] items-start gap-4 max-[1250px]:grid-cols-1">
      <div className="flex min-w-0 flex-col gap-4">
        <CheckList title="Pre-match checklist" checks={checks} countLabel="ready" />
        <div className="grid grid-cols-2 gap-4 max-[860px]:grid-cols-1">
          {teams.map((t) => {
            const side: Side = t === lc.homeId ? 'home' : 'away';
            const list = starters(t);
            return (
              <div key={t} className={card}>
                <div className={cardHead}>
                  <span className={`${cardTitle} min-w-0 truncate`}>{lc.teams[t]?.name} · starting five</span>
                  <span
                    className={`font-mono text-[10px] font-bold uppercase tracking-[0.1em] ${
                      list.length === 5 ? 'text-[var(--ok)]' : 'text-[var(--warn)]'
                    }`}
                  >
                    {list.length}/5 starters
                  </span>
                </div>
                <div className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--txm)]">
                  {lc.teamRoster(t).length} players listed
                </div>
                <div className="flex flex-col gap-1.5 px-4 pb-4">
                  {list.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-lg border border-[var(--bord2)] bg-[var(--surf2)] px-3 py-2">
                      <Avatar player={p} side={side} size="h-8 w-8 text-[11px]" />
                      <span className="w-7 font-anton text-[18px] leading-none">{jersey(p)}</span>
                      <span className="flex-1 text-[14px] font-semibold">{p.name}</span>
                      <span className="font-mono text-[10px] uppercase text-[var(--txm)]">{p.pos}</span>
                    </div>
                  ))}
                  {list.length === 0 && (
                    <div className="rounded-lg border border-dashed border-[var(--bord)] px-3 py-4 text-center text-[12px] text-[var(--txm)]">
                      No starters marked yet.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4 min-[1251px]:sticky min-[1251px]:top-[76px]">
        <div className={`${card} p-5`}>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--txm)]">Tip-off</div>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="font-anton text-[52px] leading-none">{tipTime}</span>
            <span className="whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--txd)]">{tipIn}</span>
          </div>
          <div className="mt-1 text-[13px] text-[var(--txd)]">{tipDay}</div>
          <button
            type="button"
            disabled={!ready || starting}
            onClick={onStart}
            className={`mt-4 h-12 w-full rounded-lg text-[14px] font-bold ${
              ready ? 'bg-[var(--brand)] text-white hover:bg-[var(--brandlt)]' : 'bg-[var(--chip)] text-[var(--faint)]'
            }`}
          >
            {starting ? 'Starting…' : 'Start game'}
          </button>
          <div className="mt-2 text-[12px] text-[var(--txm)]">
            {ready
              ? `Starts Q1 at ${lc.rules.periodMin}:00 and opens the court console.`
              : 'Needs 5 starters per team and unique jersey numbers.'}
          </div>
        </div>

        <div className={card}>
          <div className={cardHead}>
            <span className={cardTitle}>Game rules</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--txm)]">GameRules · {lc.rules.label}</span>
          </div>
          <div className="flex flex-col px-4 py-2">
            {rulesList(lc.rules).map((r) => (
              <div key={r.k} className="flex justify-between gap-3 border-b border-[var(--bord2)] py-2 text-[13px] last:border-b-0">
                <span className="text-[var(--txd)]">{r.k}</span>
                <span className="text-right font-semibold">{r.v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={card}>
          <div className={cardHead}>
            <span className={cardTitle}>Scorer shortcuts</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--warn)]">3 keys changed</span>
          </div>
          <div className="border-b border-[var(--bord2)] bg-[var(--surf2)] px-4 py-2.5 text-[12px] leading-[1.45] text-[var(--txd)]">
            Brief your scorers before tip-off: <b className="text-[var(--tx)]">V</b> is now turnover (then pick the type — steals live there,{' '}
            <b className="text-[var(--tx)]">S</b> is gone),{' '}
            <b className="text-[var(--tx)]">G</b> is technical, and <b className="text-[var(--tx)]">X</b> is offensive rebound —{' '}
            <b className="text-[var(--tx)]">O</b> only picks a player.
          </div>
          <div className="flex flex-col gap-1 px-4 py-3 font-mono text-[11px] text-[var(--txd)]">
            <KeyLegend items={KEY_LEGEND(lc.teams[lc.homeId]?.name ?? '', lc.teams[lc.awayId]?.short ?? '')} />
          </div>
        </div>
      </div>
    </div>
  );
}
