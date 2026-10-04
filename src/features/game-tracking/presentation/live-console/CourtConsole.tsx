import { useState } from 'react';
import Avatar from './Avatar';
import { TONE, kbdCls, kbdOnLight, pipCls, type Side } from './tone';
import { disqualification, lineOf, personalFoulCount } from '../../domain/live-console/derive';
import { TURNOVER_TYPES } from '../../domain/live-console/model';
import type { LiveConsole } from './useLiveConsole';
import type { Action, Scorer } from './useScorer';
import { jersey, tag } from './roster';
import { KEY_LEGEND, KeyLegend } from './KeyLegend';
import { buildLogRows } from './ConsoleLog';

const KEYS: Record<Side, string[]> = { home: ['Q', 'W', 'E', 'R', 'T'], away: ['Y', 'U', 'I', 'O', 'P'] };

interface Props {
  lc: LiveConsole;
  sc: Scorer;
}

function FloorColumn({ lc, sc, side }: Props & { side: Side }) {
  const teamId = side === 'home' ? lc.homeId : lc.awayId;
  const team = lc.teams[teamId];
  const tone = TONE[side];
  const prompt = sc.prompt;
  const floorIds = lc.floor[teamId] ?? [];
  const bench = lc.teamRoster(teamId).filter((p) => !floorIds.includes(p.id));

  return (
    <div
      className={`flex flex-col rounded-2xl border border-[var(--bord)] bg-[var(--surf)] ${
        side === 'home'
          ? 'col-start-1 row-start-1'
          : 'col-start-3 row-start-1 max-[1370px]:col-start-1 max-[1370px]:row-start-2'
      }`}
    >
      <div className="flex items-center gap-2 border-b border-[var(--bord2)] px-3.5 py-2.5">
        <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${tone.bg}`} />
        <span className="min-w-0 flex-1 truncate font-anton text-[15px] uppercase">{team?.name}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--txm)]">{KEYS[side].join(' ')}</span>
      </div>
      <div className="flex flex-col gap-1.5 p-2">
        {floorIds.length === 0 && (
          <div className="rounded-xl border border-dashed border-[var(--bord)] px-3 py-6 text-center text-[12px] text-[var(--txm)]">
            No players on the floor. Mark starters in Match players.
          </div>
        )}
        {floorIds.map((pid, i) => {
          const p = lc.players.get(pid);
          if (!p) return null;
          const line = lineOf(lc.d, pid);
          const dq = disqualification(line, lc.rules);
          const fouls = personalFoulCount(line);
          const selected = sc.sel?.pid === pid;
          let eligible = true;
          if (prompt) {
            if (prompt.kind === 'ast') eligible = teamId === prompt.team && pid !== prompt.pid;
            else if (prompt.kind === 'stl') eligible = teamId === prompt.team;
            else if (prompt.kind === 'reb') eligible = true;
            else eligible = false;
          }
          let cls = 'flex w-full min-h-[62px] cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors ';
          if (selected) cls += `${tone.border} ${tone.bgT} ring-1 ${tone.ring}`;
          else if (prompt && eligible) cls += `border-dashed ${tone.border} bg-[var(--surf2)] ${tone.hoverBgT}`;
          else if (prompt || dq) cls += 'border-[var(--bord2)] bg-[var(--surf2)] opacity-40';
          else cls += `border-[var(--bord2)] bg-[var(--surf2)] ${tone.hoverBorder}`;
          return (
            <button key={pid} type="button" onClick={() => sc.pickPlayer(teamId, pid)} className={cls}>
              <kbd
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold ${
                  selected ? `${tone.bg} text-[var(--bg)]` : 'bg-[var(--chip)] text-[var(--txd)]'
                }`}
              >
                {KEYS[side][i]}
              </kbd>
              <span className="relative flex-shrink-0">
                <Avatar player={p} side={side} size="h-11 w-11 text-[14px]" />
                <span className="absolute -bottom-1 -right-2 rounded-md bg-[var(--bg)] px-1 font-anton text-[13px] leading-[16px] text-[var(--tx)] ring-1 ring-[color:var(--bord)]">
                  {jersey(p)}
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold leading-tight">{p.name}</span>
                <span className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--txm)]">
                  <span>{p.pos}</span>
                  <span className="flex gap-[3px]">
                    {Array.from({ length: lc.rules.foulsToFoulOut }, (_, k) => (
                      <span key={k} className={pipCls(k < fouls)} />
                    ))}
                  </span>
                  {dq && <span className="font-bold text-[var(--tx)]">{dq}</span>}
                </span>
              </span>
              <span className="text-right">
                <span className="block font-anton text-[22px] leading-none">{line.pts}</span>
                <span className="font-mono text-[9px] uppercase text-[var(--txm)]">pts</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="border-t border-[var(--bord2)] px-3.5 py-2.5">
        <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--faint)]">Bench · tap to sub in</div>
        <div className="flex flex-wrap gap-1">
          {bench.map((p) => {
            const dq = !!disqualification(lineOf(lc.d, p.id), lc.rules);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  if (dq) return;
                  sc.setSub({ team: teamId, in: [p.id], out: [] });
                  lc.flash('Pick who comes off in Substitutions');
                }}
                className={`h-7 whitespace-nowrap rounded-md border border-[var(--bord2)] px-2 text-[11px] font-semibold ${
                  dq ? 'text-[var(--faint)] line-through' : `text-[var(--txd)] ${tone.hoverBorder} hover:text-[var(--tx)]`
                }`}
              >
                {tag(p)}
              </button>
            );
          })}
          {bench.length === 0 && <span className="text-[11px] text-[var(--txm)]">No bench players listed.</span>}
        </div>
      </div>
    </div>
  );
}

function ActionPad({ lc, sc }: Props) {
  const [showKeys, setShowKeys] = useState(false);
  const prompt = sc.prompt;
  const dim = !sc.sel && !prompt;
  const sp = sc.sel ? lc.players.get(sc.sel.pid) : undefined;
  const selSide: Side | null = sc.sel ? (sc.sel.team === lc.homeId ? 'home' : 'away') : null;
  const last = buildLogRows(lc).at(-1);
  const lastText = last ? `${last.action.replace(/^↳ /, '')} — ${last.who}` : '';

  const optCls = (side: Side) =>
    `flex h-10 items-center gap-2 rounded-lg border ${TONE[side].border} ${TONE[side].bgT} px-3 text-[13px] font-semibold text-[var(--tx)] hover:bg-[var(--surf2)]`;
  const optKey = 'rounded bg-[var(--chip)] px-1 font-mono text-[10px] text-[var(--txd)]';

  type Opt = { key: string; label: string; cls: string; onClick: () => void; pid?: string; side?: Side };
  const playerOpts = (teamId: string, filter: (pid: string) => boolean): Opt[] => {
    const side: Side = teamId === lc.homeId ? 'home' : 'away';
    return (lc.floor[teamId] ?? [])
      .map((pid, i) => ({ pid, i }))
      .filter((o) => filter(o.pid))
      .map((o) => ({
        key: KEYS[side][o.i],
        label: tag(lc.players.get(o.pid)),
        cls: optCls(side),
        pid: o.pid,
        side,
        onClick: () => sc.pickPlayer(teamId, o.pid),
      }));
  };

  let promptTitle = '';
  let promptSub = '';
  let promptSkip = 'Skip';
  let opts: Opt[] = [];
  if (prompt) {
    if (prompt.kind === 'ast') {
      promptSub = prompt.label;
      promptTitle = 'Assisted by?';
      promptSkip = 'No assist';
      opts = playerOpts(prompt.team, (pid) => pid !== prompt.pid && !sc.isOut(pid));
    } else if (prompt.kind === 'reb') {
      promptSub = prompt.label;
      promptTitle = 'Who got the rebound?';
      const other = lc.opp(prompt.team);
      opts = [
        ...playerOpts(prompt.team, () => true),
        ...playerOpts(other, () => true),
        {
          key: 'N',
          label: `Team rebound · ${lc.teams[other]?.short ?? ''}`,
          cls: 'flex h-10 items-center gap-2 rounded-lg border border-[var(--bord)] px-3 text-[13px] font-semibold text-[var(--txd)] hover:text-[var(--tx)]',
          onClick: sc.teamRebound,
        },
      ];
    } else if (prompt.kind === 'stl') {
      promptSub = prompt.label;
      promptTitle = 'Stolen by?';
      promptSkip = 'No steal';
      opts = playerOpts(prompt.team, () => true);
    } else if (prompt.kind === 'tov') {
      promptSub = `Turnover · ${tag(lc.players.get(prompt.pid))}`;
      promptTitle = 'What kind?';
      promptSkip = 'Cancel';
      opts = TURNOVER_TYPES.map((t, i) => ({
        key: String(i + 1),
        label: t.label,
        cls: 'flex h-10 items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3 text-[13px] font-semibold text-[var(--tx)] hover:border-[var(--tx)]',
        onClick: () => sc.pickTurnover(i),
      }));
    } else if (prompt.kind === 'team') {
      promptSub = prompt.type === 'FOUL_BENCH_TECHNICAL' ? 'Bench technical' : 'Coach technical';
      promptTitle = 'Which bench?';
      promptSkip = 'Cancel';
      opts = [lc.homeId, lc.awayId].map((t, i) => ({
        key: String(i + 1),
        label: lc.teams[t]?.name ?? '',
        cls: optCls(i === 0 ? 'home' : 'away'),
        onClick: () => sc.pickBench(t),
      }));
    }
  }

  const shotCols: Array<{ key: string; label: string; big: string; made: Action; miss: Action }> = [
    { key: '2', label: '2PT', big: '+2', made: 'TWO_POINT_MADE', miss: 'TWO_POINT_MISSED' },
    { key: '3', label: '3PT', big: '+3', made: 'THREE_POINT_MADE', miss: 'THREE_POINT_MISSED' },
    { key: 'M', label: 'FT', big: '+1', made: 'FREE_THROW_MADE', miss: 'FREE_THROW_MISSED' },
  ];
  const small = `flex h-11 items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-2.5 text-[12px] font-semibold text-[var(--tx)] hover:border-[var(--tx)] ${dim ? 'opacity-45' : ''}`;
  const smallTeam =
    'flex h-11 items-center gap-2 rounded-lg border border-dashed border-[var(--bord)] bg-[var(--surf2)] px-2.5 text-[12px] font-semibold text-[var(--txd)] hover:border-[var(--tx)] hover:text-[var(--tx)]';
  const playBtns: Array<[string, string, Action]> = [
    ['Assist', 'A', 'ASSIST'],
    ['Off reb', 'X', 'REBOUND_OFFENSIVE'],
    ['Def reb', 'D', 'REBOUND_DEFENSIVE'],
    ['Steal', 'S', 'STEAL'],
    ['Block', 'B', 'BLOCK'],
    ['Turnover', 'V', 'TURNOVER'],
  ];
  const foulBtns: Array<[string, string, Action]> = [
    ['Personal', 'F', 'FOUL_PERSONAL'],
    ['Technical', 'G', 'FOUL_TECHNICAL'],
    ['Unsport.', 'H', 'FOUL_UNSPORTSMANLIKE'],
    ['Ejection', 'J', 'EJECTION'],
    ['Bench T', 'K', 'FOUL_BENCH_TECHNICAL'],
    ['Coach T', 'L', 'FOUL_COACH_TECHNICAL'],
  ];

  const homeShort = lc.teams[lc.homeId]?.short ?? '';
  const awayShort = lc.teams[lc.awayId]?.short ?? '';
  const sl = sp ? lineOf(lc.d, sp.id) : null;

  return (
    <div className="col-start-2 row-start-1 flex flex-col rounded-2xl border border-[var(--bord)] bg-[var(--surf)] max-[1370px]:sticky max-[1370px]:top-[76px] max-[1370px]:row-span-2 max-[1370px]:self-start max-[760px]:static max-[760px]:col-start-1 max-[760px]:row-start-3 max-[760px]:row-span-1">
      <div className="min-h-[96px] border-b border-[var(--bord2)] px-4 py-3">
        {prompt ? (
          <div className="mc-in">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--txm)]">{promptSub}</div>
                <div className="font-anton text-[22px] uppercase leading-tight">{promptTitle}</div>
              </div>
              <button
                type="button"
                onClick={sc.skipPrompt}
                className="h-9 flex-shrink-0 rounded-lg border border-[var(--bord)] px-3 text-[12px] font-semibold text-[var(--txd)] hover:text-[var(--tx)]"
              >
                {promptSkip} <kbd className={kbdCls}>Esc</kbd>
              </button>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {opts.map((o) => {
                const p = o.pid ? lc.players.get(o.pid) : undefined;
                return (
                  <button key={`${o.key}-${o.label}`} type="button" onClick={o.onClick} className={o.cls}>
                    <kbd className={optKey}>{o.key}</kbd>
                    {p && o.side && <Avatar player={p} side={o.side} size="h-6 w-6 text-[9px]" />}
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              {sp && selSide && <Avatar player={sp} side={selSide} size="h-14 w-14 text-[18px]" />}
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--txm)]">
                  {sp && sl && sc.sel
                    ? `${lc.teams[sc.sel.team]?.name} · ${sp.pos} · ${sl.pts} pts · ${personalFoulCount(sl)} fouls`
                    : `Q W E R T · ${lc.teams[lc.homeId]?.name ?? homeShort}    Y U I O P · ${awayShort}`}
                </div>
                <div
                  className={`mt-0.5 truncate font-anton text-[28px] uppercase leading-tight ${
                    sp && selSide ? TONE[selSide].text : 'text-[var(--faint)]'
                  }`}
                >
                  {sp ? `#${jersey(sp)} ${sp.name}` : 'Pick a player'}
                </div>
              </div>
            </div>
            {sc.hint && <div className="mt-1 text-[12px] font-semibold text-[var(--warn)]">{sc.hint}</div>}
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3">
        <div className="grid grid-cols-3 gap-2">
          {shotCols.map((s) => (
            <div key={s.key} className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => sc.act(s.made)}
                className={`flex min-h-[96px] flex-col justify-between rounded-xl bg-[var(--tx)] p-3 text-left text-[var(--bg)] transition-opacity hover:opacity-90 active:scale-[0.98] ${dim ? 'opacity-45' : ''}`}
              >
                <span className="flex w-full items-start justify-between">
                  <span className="font-anton text-[34px] leading-none">{s.big}</span>
                  <kbd className={kbdOnLight}>{s.key}</kbd>
                </span>
                <span className="text-[12px] font-bold uppercase tracking-[0.04em]">Made {s.label}</span>
              </button>
              <button
                type="button"
                onClick={() => sc.act(s.miss)}
                className={`flex h-11 items-center gap-2 rounded-xl border border-[var(--bord)] bg-[var(--surf2)] px-3 text-[12px] font-bold uppercase tracking-[0.04em] text-[var(--txd)] hover:border-[var(--tx)] hover:text-[var(--tx)] ${dim ? 'opacity-45' : ''}`}
              >
                <span>Miss {s.label}</span>
                <kbd className={kbdCls}>⇧{s.key}</kbd>
              </button>
            </div>
          ))}
        </div>
        <div>
          <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--faint)]">Plays</div>
          <div className="grid grid-cols-6 gap-1.5 max-[1360px]:grid-cols-3">
            {playBtns.map(([label, key, type]) => (
              <button key={type} type="button" onClick={() => sc.act(type)} className={small}>
                <span>{label}</span>
                <kbd className={kbdCls}>{key}</kbd>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--faint)]">Fouls</div>
          <div className="grid grid-cols-6 gap-1.5 max-[1360px]:grid-cols-3">
            {foulBtns.map(([label, key, type]) => (
              <button
                key={type}
                type="button"
                onClick={() => sc.act(type)}
                className={type === 'FOUL_BENCH_TECHNICAL' || type === 'FOUL_COACH_TECHNICAL' ? smallTeam : small}
              >
                <span>{label}</span>
                <kbd className={kbdCls}>{key}</kbd>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--bord2)] px-4 py-2.5">
        {last && (
          <>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--txm)]">Last</span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{lastText}</span>
            <button
              type="button"
              onClick={() => lc.undoLast(lc.players)}
              className="h-8 rounded-md border border-[var(--bord)] px-3 text-[12px] font-semibold text-[var(--txd)] hover:text-[var(--tx)]"
            >
              Undo <kbd className={kbdCls}>⌘Z</kbd>
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => setShowKeys((v) => !v)}
          className="h-8 rounded-md px-2 text-[12px] font-semibold text-[var(--txm)] hover:text-[var(--tx)]"
        >
          {showKeys ? 'Hide shortcuts' : 'Shortcuts'}
        </button>
      </div>
      {showKeys && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 border-t border-[var(--bord2)] px-4 py-3 font-mono text-[11px] text-[var(--txd)] max-[600px]:grid-cols-1">
          <KeyLegend items={KEY_LEGEND(lc.teams[lc.homeId]?.name ?? homeShort, awayShort)} />
        </div>
      )}
    </div>
  );
}

export default function CourtConsole({ lc, sc }: Props) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)_minmax(0,1fr)] gap-3 max-[1370px]:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] max-[760px]:grid-cols-1">
      <FloorColumn lc={lc} sc={sc} side="home" />
      <FloorColumn lc={lc} sc={sc} side="away" />
      <ActionPad lc={lc} sc={sc} />
    </div>
  );
}
