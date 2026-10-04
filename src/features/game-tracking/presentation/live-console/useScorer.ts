/**
 * Scorer interaction: pick a player, record an action, answer the follow-up
 * prompt (assist, rebound, steal, turnover kind, which bench).
 *
 * Keyboard: Q–T / Y–P pick the floor slots, 2 · 3 · M made shots (⇧ for a
 * miss), A X D assist and rebounds, S B V steal / block / turnover, F G H J
 * personal / technical / unsportsmanlike / ejection, K L bench and coach
 * technicals, Space the clock, ← → possession, Esc skip, ⌘Z / Ctrl+Z undo.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { TURNOVER_TYPES, EVENT_LABEL } from '../../domain/live-console/model';
import { disqualification, emptyLine, lineOf } from '../../domain/live-console/derive';
import type { LiveConsole } from './useLiveConsole';
import { tag } from './roster';

export type Action =
  | 'TWO_POINT_MADE'
  | 'TWO_POINT_MISSED'
  | 'THREE_POINT_MADE'
  | 'THREE_POINT_MISSED'
  | 'FREE_THROW_MADE'
  | 'FREE_THROW_MISSED'
  | 'ASSIST'
  | 'REBOUND_OFFENSIVE'
  | 'REBOUND_DEFENSIVE'
  | 'STEAL'
  | 'BLOCK'
  | 'TURNOVER'
  | 'FOUL_PERSONAL'
  | 'FOUL_TECHNICAL'
  | 'FOUL_UNSPORTSMANLIKE'
  | 'EJECTION'
  | 'FOUL_BENCH_TECHNICAL'
  | 'FOUL_COACH_TECHNICAL';

export type Prompt =
  | { kind: 'ast'; parentCid: string; team: string; pid: string; label: string }
  | { kind: 'reb'; parentCid: string; team: string; pid: string; label: string }
  | { kind: 'stl'; parentCid: string; team: string; label: string }
  | { kind: 'tov'; team: string; pid: string }
  | { kind: 'team'; type: 'FOUL_BENCH_TECHNICAL' | 'FOUL_COACH_TECHNICAL' };

export interface Selection {
  team: string;
  pid: string;
}

const KEY_SLOTS: Record<string, ['home' | 'away', number]> = {
  KeyQ: ['home', 0], KeyW: ['home', 1], KeyE: ['home', 2], KeyR: ['home', 3], KeyT: ['home', 4],
  KeyY: ['away', 0], KeyU: ['away', 1], KeyI: ['away', 2], KeyO: ['away', 3], KeyP: ['away', 4],
};

const keyAction = (code: string, shift: boolean): Action | null => {
  const map: Record<string, Action> = {
    Digit2: shift ? 'TWO_POINT_MISSED' : 'TWO_POINT_MADE',
    Digit3: shift ? 'THREE_POINT_MISSED' : 'THREE_POINT_MADE',
    KeyM: shift ? 'FREE_THROW_MISSED' : 'FREE_THROW_MADE',
    KeyA: 'ASSIST',
    KeyX: 'REBOUND_OFFENSIVE',
    KeyD: 'REBOUND_DEFENSIVE',
    KeyS: 'STEAL',
    KeyB: 'BLOCK',
    KeyV: 'TURNOVER',
    KeyF: 'FOUL_PERSONAL',
    KeyG: 'FOUL_TECHNICAL',
    KeyH: 'FOUL_UNSPORTSMANLIKE',
    KeyJ: 'EJECTION',
    KeyK: 'FOUL_BENCH_TECHNICAL',
    KeyL: 'FOUL_COACH_TECHNICAL',
  };
  return map[code] ?? null;
};

export interface SubDraft {
  team: string;
  out: string[];
  in: string[];
}

/** `enabled` is false outside LIVE so the keyboard never records events. */
export function useScorer(lc: LiveConsole, consoleTabActive: boolean, enabled = true) {
  const [sel, setSel] = useState<Selection | null>(null);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [sub, setSub] = useState<SubDraft>({ team: lc.homeId, out: [], in: [] });

  const isOut = useCallback((pid: string) => !!disqualification(lineOf(lc.d, pid), lc.rules), [lc.d, lc.rules]);

  const sideTeam = useCallback((side: 'home' | 'away') => (side === 'home' ? lc.homeId : lc.awayId), [lc.homeId, lc.awayId]);

  const promptPick = useCallback(
    (team: string, pid: string) => {
      if (!prompt) return;
      if (prompt.kind === 'ast') {
        if (team !== prompt.team || pid === prompt.pid) {
          setHint('Assist must come from a teammate on the floor.');
          return;
        }
        lc.post({ eventType: 'ASSIST', teamId: team, playerId: pid, metadata: { parentCid: prompt.parentCid } });
      } else if (prompt.kind === 'reb') {
        const type = team === prompt.team ? 'REBOUND_OFFENSIVE' : 'REBOUND_DEFENSIVE';
        lc.post({ eventType: type, teamId: team, playerId: pid, metadata: { parentCid: prompt.parentCid } });
        lc.setPossession(team);
      } else if (prompt.kind === 'stl') {
        if (team !== prompt.team) return;
        lc.post({ eventType: 'STEAL', teamId: team, playerId: pid, metadata: { parentCid: prompt.parentCid } });
      } else {
        return;
      }
      setPrompt(null);
      setHint(null);
    },
    [prompt, lc],
  );

  const pickPlayer = useCallback(
    (team: string, pid: string) => {
      if (prompt) return promptPick(team, pid);
      if (isOut(pid)) {
        setHint(`#${lc.players.get(pid)?.no ?? ''} is out of the game — substitute first.`);
        return;
      }
      setSel((s) => (s && s.pid === pid ? null : { team, pid }));
      setHint(null);
    },
    [prompt, promptPick, isOut, lc.players],
  );

  const pickSlot = useCallback(
    (side: 'home' | 'away', i: number) => {
      const team = sideTeam(side);
      const pid = lc.floor[team]?.[i];
      if (pid) pickPlayer(team, pid);
    },
    [sideTeam, lc.floor, pickPlayer],
  );

  const recordTurnover = useCallback(
    (team: string, pid: string, kind: (typeof TURNOVER_TYPES)[number] | null) => {
      const e = lc.post({
        eventType: 'TURNOVER',
        teamId: team,
        playerId: pid,
        description: kind?.label ?? null,
        metadata: kind ? { subtype: kind.value } : {},
      });
      lc.setPossession(lc.opp(team));
      // A steal only follows a live-ball turnover; without types we still ask.
      const steal = !kind || kind.value === 'BAD_PASS' || kind.value === 'LOST_BALL';
      setPrompt(steal ? { kind: 'stl', parentCid: e.cid!, team: lc.opp(team), label: `Turnover${kind ? ` · ${kind.label}` : ''}` } : null);
    },
    [lc],
  );

  const act = useCallback(
    (type: Action) => {
      if (type === 'FOUL_BENCH_TECHNICAL' || type === 'FOUL_COACH_TECHNICAL') {
        if (!sel) {
          setPrompt({ kind: 'team', type });
          return;
        }
        lc.post({ eventType: type, teamId: sel.team });
        setSel(null);
        lc.flash(`${EVENT_LABEL[type]} — ${lc.teams[sel.team]?.short ?? ''}`);
        return;
      }
      if (!sel) {
        setHint('Pick a player first — Q W E R T or Y U I O P.');
        return;
      }
      const { team, pid } = sel;
      setSel(null);
      setHint(null);
      if (type === 'TURNOVER') {
        if (lc.rules.trackTurnoverTypes) setPrompt({ kind: 'tov', team, pid });
        else recordTurnover(team, pid, null);
        return;
      }
      const e = lc.post({ eventType: type, teamId: team, playerId: pid });
      const p = lc.players.get(pid);
      const label = `${EVENT_LABEL[type]} · ${tag(p)}`;
      if (type === 'TWO_POINT_MADE' || type === 'THREE_POINT_MADE') {
        lc.setPossession(lc.opp(team));
        const mates = (lc.floor[team] ?? []).filter((x) => x !== pid && !isOut(x));
        if (mates.length) setPrompt({ kind: 'ast', parentCid: e.cid!, team, pid, label });
      }
      if (type === 'REBOUND_DEFENSIVE' || type === 'STEAL') lc.setPossession(team);
      if (type === 'TWO_POINT_MISSED' || type === 'THREE_POINT_MISSED' || type === 'FREE_THROW_MISSED') {
        setPrompt({ kind: 'reb', parentCid: e.cid!, team, pid, label });
      }
      if (['FOUL_PERSONAL', 'FOUL_TECHNICAL', 'FOUL_UNSPORTSMANLIKE', 'EJECTION'].includes(type)) {
        const next = { ...emptyLine(), ...lineOf(lc.d, pid) };
        if (type === 'FOUL_PERSONAL') next.pf++;
        if (type === 'FOUL_TECHNICAL') next.tf++;
        if (type === 'FOUL_UNSPORTSMANLIKE') next.uf++;
        if (type === 'EJECTION') next.ej++;
        const why = disqualification(next, lc.rules);
        if (why) {
          setSub({ team, out: [pid], in: [] });
          lc.flash(`${tag(p)} — ${why} · pick a sub`);
        }
      }
    },
    [sel, lc, isOut, recordTurnover],
  );

  const pickTurnover = useCallback(
    (i: number) => {
      if (prompt?.kind !== 'tov') return;
      recordTurnover(prompt.team, prompt.pid, TURNOVER_TYPES[i]);
    },
    [prompt, recordTurnover],
  );

  const pickBench = useCallback(
    (team: string) => {
      if (prompt?.kind !== 'team') return;
      lc.post({ eventType: prompt.type, teamId: team });
      lc.flash(`${EVENT_LABEL[prompt.type]} — ${lc.teams[team]?.short ?? ''}`);
      setPrompt(null);
    },
    [prompt, lc],
  );

  const teamRebound = useCallback(() => {
    if (prompt?.kind !== 'reb') return;
    const t = lc.opp(prompt.team);
    lc.post({ eventType: 'REBOUND_DEFENSIVE', teamId: t, metadata: { parentCid: prompt.parentCid, teamRebound: true } });
    lc.setPossession(t);
    setPrompt(null);
  }, [prompt, lc]);

  const skipPrompt = useCallback(() => {
    setPrompt(null);
    setHint(null);
  }, []);

  // ---- keyboard ------------------------------------------------------------
  const ref = useRef({ act, pickSlot, pickTurnover, pickBench, teamRebound, skipPrompt, prompt, consoleTabActive, enabled, lc });
  ref.current = { act, pickSlot, pickTurnover, pickBench, teamRebound, skipPrompt, prompt, consoleTabActive, enabled, lc };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!ref.current.enabled) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (document.querySelector('[role="dialog"]')) return;
      const r = ref.current;
      const c = e.code;
      if (e.metaKey || e.ctrlKey) {
        if (c === 'KeyZ' && !e.shiftKey) {
          e.preventDefault();
          r.lc.undoLast(r.lc.players);
        }
        return;
      }
      if (e.altKey) return;
      if (c === 'Space') {
        e.preventDefault();
        r.lc.toggleClock();
        return;
      }
      if (!r.consoleTabActive) return;
      const pr = r.prompt;
      if (c === 'Escape') {
        if (pr) r.skipPrompt();
        else {
          setSel(null);
          setHint(null);
        }
        return;
      }
      if (c === 'ArrowLeft') return r.lc.setPossession(r.lc.homeId);
      if (c === 'ArrowRight') return r.lc.setPossession(r.lc.awayId);
      if (KEY_SLOTS[c]) {
        e.preventDefault();
        r.pickSlot(...KEY_SLOTS[c]);
        return;
      }
      if (pr?.kind === 'tov' && /^Digit[1-6]$/.test(c)) return r.pickTurnover(Number(c.slice(5)) - 1);
      if (pr?.kind === 'team' && (c === 'Digit1' || c === 'Digit2')) return r.pickBench(c === 'Digit1' ? r.lc.homeId : r.lc.awayId);
      if (pr?.kind === 'reb' && c === 'KeyN') return r.teamRebound();
      const action = keyAction(c, e.shiftKey);
      if (action) {
        e.preventDefault();
        if (pr) setPrompt(null);
        r.act(action);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return {
    sel,
    prompt,
    hint,
    isOut,
    pickPlayer,
    act,
    pickTurnover,
    pickBench,
    teamRebound,
    skipPrompt,
    sub,
    setSub,
  };
}

export type Scorer = ReturnType<typeof useScorer>;
