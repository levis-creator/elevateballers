import { TONE, card, type Side } from './tone';
import { periodLabel } from '../../domain/live-console/rules';
import { disqualification, emptyLine, lineOf } from '../../domain/live-console/derive';
import { INCIDENTS, MADE_SHOTS, POINTS, TURNOVER_TYPES } from '../../domain/live-console/model';
import { jersey } from './roster';
import { mmss } from './useConsoleClock';
import type { LiveConsole } from './useLiveConsole';

const sideOf = (lc: LiveConsole, teamId: string | null): Side => (teamId === lc.awayId ? 'away' : 'home');

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

const TIMELINE = new Set([...MADE_SHOTS, 'TIMEOUT', ...INCIDENTS]);

export function TimelineTab({ lc }: { lc: LiveConsole }) {
  const periods = [...new Set(lc.events.map((e) => e.period))].sort((a, b) => a - b);
  const home = lc.d.teams.get(lc.homeId)!;
  const away = lc.d.teams.get(lc.awayId)!;
  return (
    <div className={`${card} p-4`}>
      <div className="mb-3 grid grid-cols-[minmax(0,1fr)_96px_minmax(0,1fr)] font-anton text-[14px] uppercase">
        <span className="text-right text-[var(--home)]">{lc.teams[lc.homeId]?.name}</span>
        <span />
        <span className="text-[var(--away)]">{lc.teams[lc.awayId]?.short}</span>
      </div>
      {periods.map((p) => (
        <div key={p}>
          <div className="my-3 flex items-center gap-3">
            <span className="h-px flex-1 bg-[var(--bord)]" />
            <span className="rounded-full border border-[var(--bord)] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em]">
              {periodLabel(p, lc.rules)} · {home.byPeriod[p] ?? 0}–{away.byPeriod[p] ?? 0}
            </span>
            <span className="h-px flex-1 bg-[var(--bord)]" />
          </div>
          {lc.events
            .filter((e) => e.period === p && TIMELINE.has(e.eventType))
            .map((e) => {
              const x = lc.describe(e, lc.players);
              const pts = POINTS[e.eventType];
              const text = pts ? `+${pts} ${x.who}` : `${x.action}${e.playerId ? ` · ${x.who}` : ''}`;
              const side = sideOf(lc, e.teamId);
              const cls = `rounded-lg px-2.5 py-1 text-[12px] font-semibold ${
                pts ? `${TONE[side].bgT} text-[var(--tx)]` : 'border border-[var(--bord)] text-[var(--txd)]'
              }`;
              return (
                <div key={e.key} className="grid grid-cols-[minmax(0,1fr)_96px_minmax(0,1fr)] items-center">
                  <div className="flex justify-end pr-3">{side === 'home' && <span className={cls}>{text}</span>}</div>
                  <div className="flex flex-col items-center border-x border-[var(--bord2)] py-1">
                    <span className="font-mono text-[10px] text-[var(--txm)]">{mmss(e.secondsRemaining)}</span>
                    <span className="font-mono text-[11px] font-bold">{lc.d.scoreAt.get(e.key) ?? ''}</span>
                  </div>
                  <div className="flex pl-3">{side === 'away' && <span className={cls}>{text}</span>}</div>
                </div>
              );
            })}
        </div>
      ))}
      {lc.events.length === 0 && (
        <div className="py-10 text-center text-[13px] text-[var(--txm)]">The timeline fills in as events are recorded.</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Box score
// ---------------------------------------------------------------------------

export function BoxScoreTab({ lc, final = false }: { lc: LiveConsole; final?: boolean }) {
  const maxP = Math.max(lc.rules.periods, lc.period, ...lc.events.map((e) => e.period));
  const head = [...Array.from({ length: maxP }, (_, i) => periodLabel(i + 1, lc.rules)), 'T'];
  const cols = 'grid grid-cols-[40px_minmax(160px,1fr)_repeat(12,56px)] gap-1';

  return (
    <>
      <div className="mb-3 overflow-x-auto rounded-2xl border border-[var(--bord)] bg-[var(--surf)]">
        <div className="flex min-w-[520px] items-center gap-2 border-b border-[var(--bord2)] px-4 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--faint)]">
          <span className="flex-1">{final ? 'Final' : 'Live'} · line score</span>
          {head.map((h) => (
            <span key={h} className="w-12 text-center">
              {h}
            </span>
          ))}
        </div>
        {[lc.homeId, lc.awayId].map((t) => {
          const totals = lc.d.teams.get(t)!;
          return (
            <div key={t} className="flex min-w-[520px] items-center gap-2 border-b border-[var(--bord2)] px-4 py-2.5 last:border-b-0">
              <span className={`h-2.5 w-2.5 rounded-full ${TONE[sideOf(lc, t)].bg}`} />
              <span className="flex-1 font-anton text-[15px] uppercase">{lc.teams[t]?.short}</span>
              {Array.from({ length: maxP }, (_, i) => (
                <span key={i} className="w-12 text-center font-mono text-[13px]">
                  {final || i + 1 <= lc.period ? String(totals.byPeriod[i + 1] ?? 0) : '–'}
                </span>
              ))}
              <span className="w-12 text-center font-mono text-[13px]">{totals.score}</span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-4">
        {[lc.homeId, lc.awayId].map((t) => {
          const totals = lc.d.teams.get(t)!;
          const side = sideOf(lc, t);
          const sum = emptyLine();
          const players = lc.teamRoster(t);
          const rows = players.map((p) => {
            const x = lineOf(lc.d, p.id);
            (Object.keys(sum) as Array<keyof typeof sum>).forEach((k) => (sum[k] += x[k]));
            const played = lc.d.involved.has(p.id) || p.started || (lc.floor[t] ?? []).includes(p.id);
            const dq = disqualification(x, lc.rules);
            const cells = played
              ? [x.pts, `${x.fgm}-${x.fga}`, `${x.tpm}-${x.tpa}`, `${x.ftm}-${x.fta}`, x.oreb, x.dreb, x.oreb + x.dreb, x.ast, x.stl, x.blk, x.tov, x.pf + x.tf + x.uf + x.ej]
              : ['DNP', '', '', '', '', '', '', '', '', '', '', ''];
            return { p, cells, tag: `${p.started ? 'S' : ''}${dq ? ` · ${dq}` : ''}` };
          });
          const tot = [sum.pts, `${sum.fgm}-${sum.fga}`, `${sum.tpm}-${sum.tpa}`, `${sum.ftm}-${sum.fta}`, sum.oreb, sum.dreb, sum.oreb + sum.dreb, sum.ast, sum.stl, sum.blk, sum.tov, sum.pf + sum.tf + sum.uf + sum.ej];
          const fouls: Array<[string, number]> = [
            ['Personal', sum.pf],
            ['Technical', sum.tf],
            ['Unsport.', sum.uf],
            ['Disqualif.', sum.ej],
            ['Bench T', totals.benchTechs],
            ['Coach T', totals.coachTechs],
          ];
          const tovs = TURNOVER_TYPES.map((k) => [k.label, totals.turnoversByKind[k.value] ?? 0] as [string, number]);
          const Tile = ({ label, val }: { label: string; val: number }) => (
            <div className="flex items-baseline justify-between rounded-lg border border-[var(--bord2)] bg-[var(--surf2)] px-2.5 py-2">
              <span className="text-[12px] text-[var(--txd)]">{label}</span>
              <span className="font-anton text-[18px]">{val}</span>
            </div>
          );
          return (
            <div key={t} className={card}>
              <div className="flex items-center gap-3 border-b border-[var(--bord2)] px-4 py-3">
                <span className={`h-2.5 w-2.5 rounded-full ${TONE[side].bg}`} />
                <span className="flex-1 font-anton text-[16px] uppercase">{lc.teams[t]?.name}</span>
                <span className="font-anton text-[26px] leading-none">{totals.score}</span>
              </div>
              <div className="mc-scroll overflow-x-auto">
                <div className="min-w-[880px]">
                  <div className={`${cols} border-b border-[var(--bord2)] px-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--faint)]`}>
                    <span>No.</span>
                    <span>Player</span>
                    {['Pts', 'FG', '3P', 'FT', 'Oreb', 'Dreb', 'Reb', 'Ast', 'Stl', 'Blk', 'TO', 'Fls'].map((h) => (
                      <span key={h} className="text-right">
                        {h}
                      </span>
                    ))}
                  </div>
                  {rows.map((r) => (
                    <div key={r.p.id} className={`${cols} items-center border-b border-[var(--bord2)] px-4 py-1.5 font-mono text-[12px] hover:bg-[var(--hov)]`}>
                      <span className="font-anton text-[15px]">{jersey(r.p)}</span>
                      <span className="truncate font-archivo text-[13px] font-semibold">
                        {r.p.name}
                        <span className="ml-1.5 font-mono text-[9px] uppercase text-[var(--txm)]">{r.tag}</span>
                      </span>
                      {r.cells.map((c, i) => (
                        <span key={i} className="text-right">
                          {c}
                        </span>
                      ))}
                    </div>
                  ))}
                  <div className={`${cols} items-center bg-[var(--surf2)] px-4 py-2 font-mono text-[12px] font-bold`}>
                    <span />
                    <span className="font-archivo text-[13px] uppercase">Team totals</span>
                    {tot.map((c, i) => (
                      <span key={i} className="text-right">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-[var(--bord2)] p-4 max-[760px]:grid-cols-1">
                <div>
                  <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--faint)]">
                    Fouls by type · {fouls.reduce((a, [, v]) => a + v, 0)}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {fouls.map(([label, val]) => (
                      <Tile key={label} label={label} val={val} />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--faint)]">Turnovers by type · {sum.tov}</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {tovs.map(([label, val]) => (
                      <Tile key={label} label={label} val={val} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
