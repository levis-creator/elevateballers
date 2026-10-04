/**
 * State and actions behind the live match console.
 *
 * Local-first: every tap changes the board immediately and is handed to the
 * outbox (see outbox.ts), which saves it on the device and sends it in order
 * in the background. Score, fouls, timeouts and stat lines are derived from
 * the event log — saved events plus those still in the outbox — so nothing
 * on screen waits for the network.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGameTrackingStore } from '../stores/useGameTrackingStore';
import type { MatchWithFullDetails } from '../../../cms/types';
import { getTeam1Id, getTeam2Id, getTeam1Name, getTeam2Name } from '../../../matches/lib/team-helpers';
import {
  toConsoleRules,
  gameMinute,
  periodLength,
  periodLabel,
  timeoutWindow,
  type ConsoleRules,
} from '../../domain/live-console/rules';
import {
  EVENT_LABEL,
  fromServerEvent,
  isSubstitution,
  lastUndoable,
  linkedKeys,
  sortEvents,
  type ConsoleEvent,
  type ConsoleEventMeta,
} from '../../domain/live-console/model';
import { derive } from '../../domain/live-console/derive';
import { applySwaps, reconcileSlots } from '../../domain/live-console/floor';
import { baseFloor, teamShort, toRosterPlayer, tag, type RosterPlayer } from './roster';
import { clockNow, useClockWorker } from './useConsoleClock';
import { LiveOutbox, type OutboxSnapshot } from './outbox';
import type { GameStateData } from '../../types';

interface SubBatch {
  teamId: string;
  pairs: Array<{ playerOutId: string; playerInId: string }>;
}

export interface Toast {
  msg: string;
  action?: { label: string; run: () => void };
}

interface PostInput {
  eventType: string;
  teamId: string;
  playerId?: string | null;
  description?: string | null;
  metadata?: ConsoleEventMeta;
}

/** How often a live console picks up changes made on other devices. */
const LIVE_SYNC_MS = 4000;

const newCid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `c${Date.now()}${Math.random().toString(36).slice(2)}`;

export function useLiveConsole(match: MatchWithFullDetails, onRosterChanged: () => unknown, onMatchChanged: () => unknown) {
  const matchId = match.id;
  const homeId = getTeam1Id(match) ?? '';
  const awayId = getTeam2Id(match) ?? '';
  const teams = useMemo(
    () => ({
      [homeId]: { id: homeId, side: 'home' as const, name: getTeam1Name(match), short: teamShort(match.team1, getTeam1Name(match)) },
      [awayId]: { id: awayId, side: 'away' as const, name: getTeam2Name(match), short: teamShort(match.team2, getTeam2Name(match)) },
    }),
    [match, homeId, awayId],
  );
  const opp = useCallback((t: string) => (t === homeId ? awayId : homeId), [homeId, awayId]);

  // ---- rules ---------------------------------------------------------------
  const [rules, setRules] = useState<ConsoleRules>(() => toConsoleRules(null));
  useEffect(() => {
    fetch(`/api/games/${matchId}/rules`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((r) => setRules(toConsoleRules(r)))
      .catch(() => undefined);
  }, [matchId]);

  // ---- toast ---------------------------------------------------------------
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flash = useCallback((msg: string, action?: Toast['action']) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, action });
    toastTimer.current = setTimeout(() => setToast(null), action ? 6000 : 2400);
  }, []);
  const clearToast = useCallback(() => {
    clearTimeout(toastTimer.current);
    setToast(null);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // ---- game state ----------------------------------------------------------
  const gameState = useGameTrackingStore((s) => s.gameState);
  const fetchGameState = useGameTrackingStore((s) => s.fetchGameState);
  const storeEndGame = useGameTrackingStore((s) => s.endGame);

  const isLive = match.status === 'LIVE';
  useEffect(() => {
    fetchGameState(matchId);
    if (!isLive) return;
    const poll = () => {
      if (document.visibilityState === 'visible') fetchGameState(matchId);
    };
    // Every few seconds, so a second device's clock, period and possession show
    // up promptly. The store skips this while our own writes are queued.
    const id = setInterval(poll, LIVE_SYNC_MS);
    document.addEventListener('visibilitychange', poll);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', poll);
    };
  }, [matchId, fetchGameState, isLive]);

  const period = gameState?.period ?? match.currentPeriod ?? 1;

  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  // ---- events --------------------------------------------------------------
  const [serverEvents, setServerEvents] = useState<ConsoleEvent[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const [outboxSnap, setOutboxSnap] = useState<OutboxSnapshot>({ items: [], status: 'idle' });
  const serverRef = useRef<ConsoleEvent[]>([]);
  serverRef.current = serverEvents;
  /** When each event was added from a save reply, so a slower refetch can't drop it. */
  const savedAt = useRef(new Map<string, number>());
  const fetching = useRef<Promise<void> | null>(null);
  const refetchAgain = useRef(false);
  /** Server time of the last sync; changes after it are fetched incrementally. */
  const cursor = useRef<string | null>(null);

  const refreshEvents = useCallback(async (): Promise<void> => {
    if (fetching.current) {
      refetchAgain.current = true;
      return fetching.current;
    }
    const startedAt = Date.now();
    const run = (async () => {
      try {
        const res = await fetch(`/api/games/${matchId}/play-by-play?_=${startedAt}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.serverTime === 'string') cursor.current = data.serverTime;
        const list: ConsoleEvent[] = (data.events ?? []).map(fromServerEvent);
        setServerEvents((prev) => {
          const ids = new Set(list.map((e) => e.id));
          const newer = prev.filter((e) => e.id && !ids.has(e.id) && (savedAt.current.get(e.id) ?? 0) > startedAt);
          return sortEvents([...list, ...newer]);
        });
        setEventsLoaded(true);
      } catch {
        /* offline — keep what we have */
      }
    })();
    fetching.current = run;
    await run;
    fetching.current = null;
    if (refetchAgain.current) {
      refetchAgain.current = false;
      await refreshEvents();
    }
  }, [matchId]);

  // Full refetch on load, when the page reloads events (CSV import), and every
  // 30s while nothing is waiting to send. Never once per tap.
  useEffect(() => {
    refreshEvents();
  }, [refreshEvents, match.events]);

  // ---- outbox --------------------------------------------------------------
  const outboxRef = useRef<LiveOutbox | null>(null);
  const flashRef = useRef(flash);
  flashRef.current = flash;
  const rosterChangedRef = useRef(onRosterChanged);
  rosterChangedRef.current = onRosterChanged;
  /** Swaps the server has saved but the refetched roster doesn't show yet. */
  const [syncedBatches, setSyncedBatches] = useState<SubBatch[]>([]);
  useEffect(() => setSyncedBatches([]), [match.matchPlayers]);
  useEffect(() => {
    const box = new LiveOutbox(matchId, {
      onSaved: (item, data) => {
        if (item.kind === 'event' && data && typeof data === 'object' && 'id' in data) {
          const saved = fromServerEvent(data as Parameters<typeof fromServerEvent>[0]);
          savedAt.current.set(saved.key, Date.now());
          setServerEvents((prev) => sortEvents([...prev.filter((e) => e.id !== saved.id && e.cid !== saved.cid), saved]));
        }
        if (item.kind === 'subs') {
          setSyncedBatches((prev) => [...prev, item.body as unknown as SubBatch]);
          rosterChangedRef.current();
        }
        if (item.kind === 'timeout' || item.kind === 'subs' || (item.kind === 'patch' && item.body.isUndone === false)) {
          refreshEvents();
        }
      },
      onRejected: (item, message) => {
        flashRef.current(item.kind === 'patch' || item.kind === 'state' ? message : `Not saved: ${message}`);
        if (item.kind !== 'state' && item.kind !== 'clock') refreshEvents();
      },
      onChange: (snap) => {
        setOutboxSnap(snap);
        // Hold back the 30s state poll while clock/period/possession writes are
        // waiting, so it can't overwrite them with older server values.
        const st = useGameTrackingStore.getState();
        const writes = snap.items.some((i) => i.kind === 'state' || i.kind === 'clock' || i.kind === 'timeout');
        if (st.gameState && st.isUpdating !== writes) useGameTrackingStore.setState({ isUpdating: writes });
      },
      resolveId: (cid) => serverRef.current.find((e) => e.cid === cid)?.id ?? null,
    });
    outboxRef.current = box;
    box.load();
    const reconcile = setInterval(() => {
      if (document.visibilityState === 'visible' && box.count() === 0) refreshEvents();
    }, 30000);
    return () => {
      clearInterval(reconcile);
      box.dispose();
      outboxRef.current = null;
      useGameTrackingStore.setState({ isUpdating: false });
    };
  }, [matchId, refreshEvents]);

  const send = useCallback((item: Parameters<LiveOutbox['add']>[0]) => outboxRef.current?.add(item), []);

  // ---- other devices -------------------------------------------------------
  // Pull only what changed since the last sync (added, edited or undone
  // events) so a second scorer or an admin edit appears within seconds.
  const syncing = useRef(false);
  const syncChanges = useCallback(async () => {
    if (!cursor.current || syncing.current || fetching.current) return;
    syncing.current = true;
    try {
      // Overlap a few seconds: merging is idempotent and covers clock skew
      // between the database and the app server.
      const since = new Date(new Date(cursor.current).getTime() - 3000).toISOString();
      const res = await fetch(`/api/games/${matchId}/play-by-play?since=${encodeURIComponent(since)}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data: { changes?: Array<Parameters<typeof fromServerEvent>[0] & { isUndone: boolean }>; serverTime?: string } = await res.json();
      if (data.serverTime) cursor.current = data.serverTime;
      const changes = data.changes ?? [];
      if (!changes.length) return;
      const known = new Set(serverRef.current.map((e) => e.id));
      let rosterMoved = false;
      setServerEvents((prev) => {
        const byId = new Map(prev.map((e) => [e.id ?? e.key, e]));
        for (const c of changes) {
          if (c.isUndone) byId.delete(c.id);
          else byId.set(c.id, fromServerEvent(c));
        }
        return sortEvents([...byId.values()]);
      });
      for (const c of changes) {
        if (!known.has(c.id) && (c.eventType === 'SUBSTITUTION_IN' || c.eventType === 'SUBSTITUTION_OUT')) rosterMoved = true;
      }
      if (rosterMoved) rosterChangedRef.current();
    } catch {
      /* offline — try again next tick */
    } finally {
      syncing.current = false;
    }
  }, [matchId]);

  useEffect(() => {
    if (!isLive) return;
    const tick = () => {
      if (document.visibilityState === 'visible') syncChanges();
    };
    const id = setInterval(tick, LIVE_SYNC_MS);
    return () => clearInterval(id);
  }, [isLive, syncChanges]);

  /** Events (and timeouts) still in the outbox, shown as if saved. */
  const pending = useMemo(() => {
    const stalled = outboxSnap.status === 'offline' || outboxSnap.status === 'retrying' || outboxSnap.status === 'slow';
    return outboxSnap.items
      .filter((i) => i.kind === 'event' || i.kind === 'timeout')
      .map<ConsoleEvent>((i) => {
        const b = i.body as Record<string, unknown>;
        return {
          key: i.cid ?? `o${i.createdAt}`,
          id: null,
          cid: i.cid ?? null,
          eventType: i.kind === 'timeout' ? 'TIMEOUT' : String(b.eventType),
          teamId: (b.teamId as string) ?? null,
          playerId: (b.playerId as string | null) ?? null,
          period: Number(b.period ?? 1),
          secondsRemaining: (b.secondsRemaining as number | null) ?? null,
          sequence: 1e13 + i.createdAt,
          description: (b.description as string | null) ?? null,
          metadata: (b.metadata as ConsoleEventMeta) ?? {},
          queued: stalled,
        };
      });
  }, [outboxSnap]);

  const events = useMemo(() => {
    const saved = new Set(serverEvents.map((e) => e.cid).filter(Boolean));
    const merged = [...serverEvents, ...pending.filter((e) => !(e.cid && saved.has(e.cid)))];
    return merged.filter((e) => !hidden.has(e.key) && !(e.cid && hidden.has(e.cid)));
  }, [serverEvents, pending, hidden]);

  const d = useMemo(() => derive(events, homeId, awayId), [events, homeId, awayId]);

  // ---- clock & state writes -------------------------------------------------
  /** Apply a game-state change on screen now; the outbox sends it. */
  const applyLocal = useCallback((u: Partial<GameStateData>) => {
    const st = useGameTrackingStore.getState();
    if (!st.gameState) return;
    useGameTrackingStore.setState({
      gameState: { ...st.gameState, ...u },
      localClockSeconds: 'clockSeconds' in u ? (u.clockSeconds ?? null) : st.localClockSeconds,
    });
  }, []);

  const writeState = useCallback(
    (u: { clockRunning?: boolean; clockSeconds?: number | null; period?: number; possessionTeamId?: string }) => {
      const local: Partial<GameStateData> = { ...u };
      if (u.clockRunning === false) Object.assign(local, { clockStartedAt: null, clockSecondsAtStart: null });
      applyLocal(local);
      const { period: p, ...rest } = u;
      send({ kind: 'state', url: `/api/games/${matchId}/state`, method: 'PUT', body: p === undefined ? rest : { ...rest, currentPeriod: p } });
    },
    [applyLocal, send, matchId],
  );

  const [half, setHalfState] = useState(false);
  const halfKey = `mc-half-${matchId}`;
  useEffect(() => {
    try {
      setHalfState(sessionStorage.getItem(halfKey) === String(period));
    } catch {
      /* storage blocked */
    }
  }, [halfKey, period]);
  const setHalf = (on: boolean) => {
    setHalfState(on);
    try {
      if (on) sessionStorage.setItem(halfKey, String(period));
      else sessionStorage.removeItem(halfKey);
    } catch {
      /* storage blocked */
    }
  };

  const secondsNow = () => {
    const s = clockNow();
    return s === null ? null : Math.ceil(s);
  };

  /** Start or stop the clock. The board reacts on the tap. */
  const setRunning = useCallback(
    (run: boolean, at?: number) => {
      const s = at ?? secondsNow() ?? periodLength(period, rules);
      if (run) {
        applyLocal({ clockRunning: true, clockStartedAt: new Date().toISOString(), clockSecondsAtStart: s, clockSeconds: s });
      } else {
        applyLocal({ clockRunning: false, clockStartedAt: null, clockSecondsAtStart: null, clockSeconds: s });
      }
      send({ kind: 'clock', url: `/api/games/${matchId}/pause`, method: 'POST', body: { running: run, clockSeconds: s } });
    },
    [applyLocal, send, matchId, period, rules],
  );

  /** Stop the clock and set its value (and optionally the period). */
  const stopAt = useCallback(
    (seconds: number | null, extra: { period?: number } = {}) => {
      const s = seconds ?? secondsNow();
      writeState({ clockRunning: false, clockSeconds: s == null ? null : Math.ceil(s), ...extra });
    },
    [writeState],
  );

  useClockWorker(gameState, () => {
    if (useGameTrackingStore.getState().gameState?.clockRunning) setRunning(false, 0);
  });
  const running = !!gameState?.clockRunning;

  const toggleClock = useCallback(() => {
    const s = clockNow();
    if (half || (s !== null && s <= 0)) {
      flash('Move to the next period first');
      return;
    }
    setRunning(!useGameTrackingStore.getState().gameState?.clockRunning);
  }, [half, setRunning, flash]);

  const setClock = useCallback(
    (seconds: number) => stopAt(Math.min(periodLength(period, rules), Math.max(0, Math.round(seconds)))),
    [period, rules, stopAt],
  );

  const adjustClock = useCallback((delta: number) => setClock((clockNow() ?? 0) + delta), [setClock]);

  const applySet = useCallback(
    (value: string) => {
      const v = value.trim();
      const m = v.match(/^(\d{1,2}):(\d{2})$/) || v.match(/^()(\d{1,3})$/);
      if (!m) {
        flash('Use mm:ss');
        return false;
      }
      setClock(Number(m[1] || 0) * 60 + Number(m[2]));
      return true;
    },
    [setClock, flash],
  );

  const tied = d.teams.get(homeId)!.score === d.teams.get(awayId)!.score;
  const nextPeriod = useCallback(() => {
    const H = rules.halftimePeriod;
    if (half) {
      setHalf(false);
      stopAt(periodLength(H + 1, rules), { period: H + 1 });
      return;
    }
    if (period === H) {
      setHalf(true);
      if (useGameTrackingStore.getState().gameState?.clockRunning) stopAt(null);
      return;
    }
    if (period >= rules.periods && !tied) {
      flash('Regulation is over — use End game');
      return;
    }
    stopAt(periodLength(period + 1, rules), { period: period + 1 });
  }, [half, period, rules, tied, stopAt, flash]);

  const nextLabel = half
    ? `Start ${periodLabel(rules.halftimePeriod + 1, rules)}`
    : period === rules.halftimePeriod
      ? 'Halftime'
      : period >= rules.periods
        ? tied
          ? `Start ${periodLabel(period + 1, rules)}`
          : 'Regulation over'
        : `Start ${periodLabel(period + 1, rules)}`;

  // ---- possession ----------------------------------------------------------
  const possession = gameState?.possessionTeamId ?? null;
  const setPossession = useCallback(
    (teamId: string) => {
      if (useGameTrackingStore.getState().gameState?.possessionTeamId !== teamId) writeState({ possessionTeamId: teamId });
    },
    [writeState],
  );

  // ---- recording events ----------------------------------------------------
  const post = useCallback(
    (input: PostInput): ConsoleEvent => {
      const cid = newCid();
      const secondsRemaining = secondsNow();
      const metadata: ConsoleEventMeta = { ...(input.metadata ?? {}), cid };
      const body = {
        matchId,
        eventType: input.eventType,
        teamId: input.teamId,
        playerId: input.playerId ?? null,
        period,
        secondsRemaining,
        minute: gameMinute(period, secondsRemaining, rules),
        description: input.description ?? null,
        metadata,
      };
      send({ kind: 'event', url: `/api/matches/${matchId}/events`, method: 'POST', body, cid });
      return {
        key: cid, id: null, cid, eventType: input.eventType, teamId: input.teamId, playerId: input.playerId ?? null,
        period, secondsRemaining, sequence: 1e13 + Date.now(), description: input.description ?? null, metadata, queued: false,
      };
    },
    [period, matchId, rules, send],
  );

  // ---- undo / restore ------------------------------------------------------
  const describe = useCallback(
    (e: ConsoleEvent, players: Map<string, RosterPlayer>) => {
      const team = e.teamId ? teams[e.teamId] : undefined;
      let action = EVENT_LABEL[e.eventType] ?? e.eventType;
      let who = e.playerId ? tag(players.get(e.playerId)) : team?.short ?? '';
      if (e.eventType === 'TURNOVER' && e.metadata.subtype) action += ` · ${e.description ?? e.metadata.subtype}`;
      if (e.metadata.teamRebound) {
        action = 'Team rebound';
        who = team?.name ?? '';
      }
      if (['TIMEOUT', 'FOUL_BENCH_TECHNICAL', 'FOUL_COACH_TECHNICAL'].includes(e.eventType)) who = team?.name ?? '';
      if (e.eventType === 'OTHER') action = e.description || 'Other';
      return { action, who };
    },
    [teams],
  );

  const setUndone = useCallback(
    (e: ConsoleEvent, isUndone: boolean) =>
      send({
        kind: 'patch',
        url: `/api/matches/${matchId}/events/:id`,
        method: 'PUT',
        body: { isUndone },
        refId: e.id,
        refCid: e.cid,
      }),
    [send, matchId],
  );

  const undo = useCallback(
    (target: ConsoleEvent, players: Map<string, RosterPlayer>) => {
      if (isSubstitution(target)) {
        flash('Substitutions can’t be undone — record a new swap instead');
        return;
      }
      const keys = linkedKeys(events, target);
      const removed = events.filter((e) => keys.has(e.key));
      const tokens = removed.flatMap((e) => [e.key, ...(e.cid ? [e.cid] : [])]);
      setHidden((prev) => new Set([...prev, ...tokens]));
      removed.forEach((e) => setUndone(e, true));
      const x = describe(target, players);
      const extra = removed.length > 1 ? ` + ${removed.length - 1} linked` : '';
      flash(`Removed ${x.action}${x.who ? ` — ${x.who}` : ''}${extra}`, {
        label: 'Restore',
        run: () => {
          clearToast();
          // Put saved copies back in case a refetch dropped them meanwhile.
          setServerEvents((prev) => {
            const have = new Set(prev.map((e) => e.key));
            return sortEvents([...prev, ...removed.filter((e) => e.id && !have.has(e.key))]);
          });
          setHidden((prev) => {
            const next = new Set(prev);
            tokens.forEach((k) => next.delete(k));
            return next;
          });
          removed.forEach((e) => setUndone(e, false));
        },
      });
    },
    [events, setUndone, describe, flash, clearToast],
  );

  // ---- roster & floor ------------------------------------------------------
  const roster = useMemo(() => (match.matchPlayers ?? []).filter((mp) => mp.player).map(toRosterPlayer), [match.matchPlayers]);
  const players = useMemo(() => new Map(roster.map((p) => [p.id, p])), [roster]);
  const teamRoster = useCallback((teamId: string) => roster.filter((p) => p.teamId === teamId), [roster]);

  const queuedBatches = useMemo(
    () => outboxSnap.items.filter((i) => i.kind === 'subs').map((i) => i.body as unknown as SubBatch),
    [outboxSnap],
  );

  const slotsRef = useRef<Record<string, string[]>>({});
  const floor = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const teamId of [homeId, awayId]) {
      let ids = baseFloor(teamRoster(teamId));
      ids = reconcileSlots(slotsRef.current[teamId] ?? [], ids);
      for (const b of [...syncedBatches, ...queuedBatches]) {
        if (b.teamId === teamId) ids = applySwaps(ids, b.pairs);
      }
      out[teamId] = ids.slice(0, 5);
    }
    slotsRef.current = out;
    return out;
  }, [homeId, awayId, teamRoster, syncedBatches, queuedBatches]);

  const recordSubs = useCallback(
    (teamId: string, outIds: string[], inIds: string[]) => {
      if (!outIds.length || outIds.length !== inIds.length) return false;
      send({
        kind: 'subs',
        url: `/api/games/${matchId}/substitutions`,
        method: 'POST',
        body: {
          teamId,
          period,
          secondsRemaining: secondsNow(),
          pairs: outIds.map((playerOutId, i) => ({ playerOutId, playerInId: inIds[i] })),
          clientBatchId: newCid(),
        },
      });
      flash(`Substitution recorded — ${teams[teamId]?.short ?? ''}`);
      return true;
    },
    [send, matchId, period, flash, teams],
  );

  // ---- timeouts ------------------------------------------------------------
  const timeoutsLeft = useCallback(
    (teamId: string) => {
      const w = timeoutWindow(period, rules);
      const used = (d.teams.get(teamId)?.timeouts ?? []).filter((e) => w.inWindow(e.period)).length;
      return { used, cap: w.cap, left: Math.max(0, w.cap - used) };
    },
    [period, rules, d],
  );

  const callTimeout = useCallback(
    (teamId: string) => {
      const short = teams[teamId]?.short ?? '';
      if (timeoutsLeft(teamId).left <= 0) {
        flash(`No timeouts left for ${short}`);
        return;
      }
      const secondsRemaining = secondsNow();
      stopAt(secondsRemaining);
      const cid = newCid();
      send({
        kind: 'timeout',
        url: `/api/games/${matchId}/timeout`,
        method: 'POST',
        body: { teamId, period, timeoutType: 'SIXTY_SECOND', secondsRemaining, clientId: cid },
        cid,
      });
      flash(`Timeout — ${short} · clock stopped`);
    },
    [teams, timeoutsLeft, flash, stopAt, send, period, matchId],
  );

  // ---- end game ------------------------------------------------------------
  const [ending, setEnding] = useState(false);
  const endGame = useCallback(async () => {
    setEnding(true);
    try {
      stopAt(null);
      // The server totals the score from saved events, so everything must be
      // in before the game is sealed.
      const left = (await outboxRef.current?.drain(15000)) ?? 0;
      if (left > 0) {
        flash(`${left} changes still unsent — reconnect, then end the game`);
        return;
      }
      await storeEndGame(matchId);
      await onMatchChanged();
    } finally {
      setEnding(false);
    }
  }, [stopAt, flash, storeEndGame, matchId, onMatchChanged]);

  const queuedCount = outboxSnap.items.length;
  const syncState: 'ok' | 'syncing' | 'offline' = !isOnline || outboxSnap.status === 'offline'
    ? 'offline'
    : outboxSnap.status === 'slow' || outboxSnap.status === 'retrying'
      ? 'syncing'
      : 'ok';

  return {
    matchId,
    homeId,
    awayId,
    teams,
    opp,
    rules,
    gameState,
    period,
    half,
    running,
    toggleClock,
    adjustClock,
    applySet,
    nextPeriod,
    nextLabel,
    endGame,
    ending,
    possession,
    setPossession,
    events,
    eventsLoaded,
    d,
    post,
    undo,
    undoLast: (pl: Map<string, RosterPlayer>) => {
      const target = lastUndoable(events);
      if (!target) {
        if (events.length) flash('Substitutions can’t be undone — record a new swap instead');
        return;
      }
      undo(target, pl);
    },
    describe,
    roster,
    players,
    teamRoster,
    floor,
    recordSubs,
    timeoutsLeft,
    callTimeout,
    isOnline,
    queuedCount,
    syncState,
    toast,
    flash,
    clearToast,
    refreshEvents,
  };
}

export type LiveConsole = ReturnType<typeof useLiveConsole>;
