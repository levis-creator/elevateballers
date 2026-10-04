/**
 * Match events: the full log with filters, inline add, inline edit (player
 * and action) and inline CSV import. Deleting soft-undoes with a Restore toast.
 */
import { useState } from 'react';
import ImportPanel from './ImportPanel';
import { TONE, card, type Side } from './tone';
import { periodLabel, periodLength } from '../../domain/live-console/rules';
import { EVENT_LABEL, MADE_SHOTS, MISSED_SHOTS, PLAYER_FOULS, isSubstitution, type ConsoleEvent } from '../../domain/live-console/model';
import { tag } from './roster';
import { clockNow, mmss } from './useConsoleClock';
import type { LiveConsole } from './useLiveConsole';

const TYPES = [
  'TWO_POINT_MADE', 'TWO_POINT_MISSED', 'THREE_POINT_MADE', 'THREE_POINT_MISSED', 'FREE_THROW_MADE',
  'FREE_THROW_MISSED', 'ASSIST', 'REBOUND_OFFENSIVE', 'REBOUND_DEFENSIVE', 'STEAL', 'BLOCK', 'TURNOVER',
  'FOUL_PERSONAL', 'FOUL_TECHNICAL', 'FOUL_UNSPORTSMANLIKE', 'EJECTION',
];

const grid = 'grid grid-cols-[64px_70px_84px_minmax(0,1fr)_minmax(0,1.2fr)_70px_120px] gap-2';
const field = 'flex flex-col gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--txm)]';

async function send(url: string, method: string, body: unknown): Promise<string | null> {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
  if (res?.ok) return null;
  const data = await res?.json().catch(() => null);
  return data?.error || 'Could not save — try again';
}

interface Props {
  lc: LiveConsole;
}

export default function EventsTab({ lc }: Props) {
  const [filter, setFilter] = useState<'all' | 'score' | 'fouls'>('all');
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ae, setAe] = useState({ team: lc.homeId, pid: '', type: 'TWO_POINT_MADE', period: String(lc.period), clock: '' });
  const [ee, setEe] = useState<{ id: string; team: string; pid: string; type: string } | null>(null);

  const maxP = Math.max(lc.rules.periods + 1, lc.period, ...lc.events.map((e) => e.period));
  const list = lc.events
    .filter((e) =>
      filter === 'all'
        ? true
        : filter === 'score'
          ? MADE_SHOTS.has(e.eventType) || MISSED_SHOTS.has(e.eventType)
          : PLAYER_FOULS.has(e.eventType) || e.eventType === 'FOUL_BENCH_TECHNICAL' || e.eventType === 'FOUL_COACH_TECHNICAL',
    )
    .slice()
    .reverse();

  const save = async (url: string, method: string, body: unknown, ok: string) => {
    setBusy(true);
    const error = await send(url, method, body);
    setBusy(false);
    if (error) {
      lc.flash(error);
      return false;
    }
    lc.flash(ok);
    await lc.refreshEvents();
    return true;
  };

  const saveAdd = async () => {
    const m = ae.clock.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (ae.clock && !m) return lc.flash('Clock must be mm:ss');
    if (!ae.pid) return lc.flash('Pick a player');
    const period = Number(ae.period);
    const len = periodLength(period, lc.rules);
    const secs = m ? Math.min(len, Number(m[1]) * 60 + Number(m[2])) : null;
    const before = Math.min(period - 1, lc.rules.periods) * lc.rules.periodMin + Math.max(0, period - 1 - lc.rules.periods) * lc.rules.otMin;
    const minute = before + Math.floor((len - (secs ?? len)) / 60) + 1;
    const ok = await save(
      `/api/matches/${lc.matchId}/events`,
      'POST',
      { eventType: ae.type, teamId: ae.team, playerId: ae.pid, period, secondsRemaining: secs, minute },
      'Event added',
    );
    if (ok) setAdding(false);
  };

  const saveEdit = async () => {
    if (!ee) return;
    const ok = await save(`/api/matches/${lc.matchId}/events/${ee.id}`, 'PUT', { playerId: ee.pid, eventType: ee.type }, 'Event updated');
    if (ok) setEe(null);
  };

  const playerOptions = (teamId: string) =>
    lc.teamRoster(teamId).map((p) => (
      <option key={p.id} value={p.id}>
        {tag(p)}
      </option>
    ));
  const typeOptions = TYPES.map((t) => (
    <option key={t} value={t}>
      {EVENT_LABEL[t]}
    </option>
  ));

  const row = (e: ConsoleEvent) => {
    const x = lc.describe(e, lc.players);
    const sub = isSubstitution(e);
    const action = sub ? (e.eventType === 'SUBSTITUTION_IN' ? 'Sub in' : 'Sub out') : x.action;
    const who = sub ? tag(e.playerId ? lc.players.get(e.playerId) : undefined) : x.who;
    const editable = !!e.id && !sub && !!e.playerId && TYPES.includes(e.eventType);
    const editing = ee?.id === e.id;
    const side: Side = e.teamId === lc.awayId ? 'away' : 'home';
    return (
      <div
        key={e.key}
        className={`${grid} items-center border-b border-[var(--bord2)] px-4 py-2 text-[13px] hover:bg-[var(--hov)] max-[1150px]:grid-cols-[40px_44px_52px_minmax(0,1fr)_auto]`}
      >
        <span className="font-mono text-[11px] text-[var(--txm)]">{periodLabel(e.period, lc.rules)}</span>
        <span className="font-mono text-[11px] text-[var(--txm)]">{e.secondsRemaining == null ? '—' : mmss(e.secondsRemaining)}</span>
        <span className={`font-mono text-[11px] font-bold ${TONE[side].text}`}>{lc.teams[e.teamId ?? '']?.short}</span>
        {editing && ee ? (
          <>
            <select value={ee.pid} onChange={(ev) => setEe({ ...ee, pid: ev.target.value })} className="mc-inp py-1">
              {playerOptions(ee.team)}
            </select>
            <select value={ee.type} onChange={(ev) => setEe({ ...ee, type: ev.target.value })} className="mc-inp py-1">
              {typeOptions}
            </select>
          </>
        ) : (
          <>
            <span className="truncate text-[var(--txd)] max-[1150px]:hidden">{who}</span>
            <span className="truncate font-semibold">{action}</span>
          </>
        )}
        <span className="font-mono text-[12px] font-bold max-[1150px]:hidden">{lc.d.scoreAt.get(e.key) ?? ''}</span>
        <span className="flex justify-end gap-1">
          {editing ? (
            <>
              <button type="button" disabled={busy} onClick={saveEdit} className="h-7 rounded-md bg-[var(--brand)] px-2 text-[11px] font-bold text-white">
                Save
              </button>
              <button type="button" onClick={() => setEe(null)} className="h-7 rounded-md border border-[var(--bord)] px-2 text-[11px] text-[var(--txd)]">
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={!editable}
                onClick={() => e.id && e.teamId && e.playerId && setEe({ id: e.id, team: e.teamId, pid: e.playerId, type: e.eventType })}
                className={`h-7 rounded-md border px-2 text-[11px] font-semibold ${
                  editable ? 'border-[var(--bord)] text-[var(--txd)] hover:text-[var(--tx)]' : 'border-[var(--bord2)] text-[var(--faint)]'
                }`}
              >
                Edit
              </button>
              <button
                type="button"
                disabled={sub}
                onClick={() => lc.undo(e, lc.players)}
                className="h-7 rounded-md border border-[var(--bord)] px-2 text-[11px] font-semibold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)] disabled:opacity-40"
              >
                Delete
              </button>
            </>
          )}
        </span>
      </div>
    );
  };

  return (
    <div className={card}>
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--bord2)] px-4 py-3">
        <span className="whitespace-nowrap font-anton text-[15px] uppercase">Match events</span>
        <div className="ml-2 inline-flex gap-1 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] p-1">
          {(
            [
              ['all', 'All'],
              ['score', 'Shots'],
              ['fouls', 'Fouls'],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={`rounded-md px-2.5 py-1 text-[12px] font-semibold ${
                filter === k ? 'bg-[var(--tx)] text-[var(--bg)]' : 'text-[var(--txd)] hover:text-[var(--tx)]'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => {
              setImporting((v) => !v);
              setAdding(false);
            }}
            className="h-9 rounded-lg border border-[var(--bord)] px-3 text-[12px] font-semibold text-[var(--txd)] hover:text-[var(--tx)]"
          >
            Import
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding((v) => !v);
              setImporting(false);
              setAe({ team: lc.homeId, pid: lc.teamRoster(lc.homeId)[0]?.id ?? '', type: 'TWO_POINT_MADE', period: String(lc.period), clock: clockNow() == null ? '' : mmss(clockNow()) });
            }}
            className="h-9 rounded-lg bg-[var(--brand)] px-3 text-[12px] font-bold text-white hover:bg-[var(--brandlt)]"
          >
            Add event
          </button>
        </div>
      </div>

      {importing && <ImportPanel lc={lc} onDone={() => setImporting(false)} />}

      {adding && (
        <div className="grid grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)_90px_90px_auto] items-end gap-2 border-b border-[var(--bord2)] bg-[var(--surf2)] p-4 max-[1150px]:grid-cols-2">
          <label className={field}>
            Team
            <select
              value={ae.team}
              onChange={(e) => setAe({ ...ae, team: e.target.value, pid: lc.teamRoster(e.target.value)[0]?.id ?? '' })}
              className="mc-inp"
            >
              {[lc.homeId, lc.awayId].map((t) => (
                <option key={t} value={t}>
                  {lc.teams[t]?.short}
                </option>
              ))}
            </select>
          </label>
          <label className={field}>
            Player
            <select value={ae.pid} onChange={(e) => setAe({ ...ae, pid: e.target.value })} className="mc-inp">
              {playerOptions(ae.team)}
            </select>
          </label>
          <label className={field}>
            Action
            <select value={ae.type} onChange={(e) => setAe({ ...ae, type: e.target.value })} className="mc-inp">
              {typeOptions}
            </select>
          </label>
          <label className={field}>
            Period
            <select value={ae.period} onChange={(e) => setAe({ ...ae, period: e.target.value })} className="mc-inp">
              {Array.from({ length: maxP }, (_, i) => (
                <option key={i} value={i + 1}>
                  {periodLabel(i + 1, lc.rules)}
                </option>
              ))}
            </select>
          </label>
          <label className={field}>
            Clock
            <input value={ae.clock} onChange={(e) => setAe({ ...ae, clock: e.target.value })} placeholder="mm:ss" className="mc-inp font-mono" />
          </label>
          <button type="button" disabled={busy} onClick={saveAdd} className="h-[38px] rounded-lg bg-[var(--brand)] px-4 text-[12px] font-bold text-white disabled:opacity-60">
            Add
          </button>
        </div>
      )}

      <div className={`${grid} border-b border-[var(--bord2)] px-4 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--faint)] max-[1150px]:hidden`}>
        <span>Period</span>
        <span>Clock</span>
        <span>Team</span>
        <span>Player</span>
        <span>Action</span>
        <span>Score</span>
        <span className="text-right">Actions</span>
      </div>
      <div className="mc-scroll max-h-[640px] overflow-y-auto">
        {list.map(row)}
        {list.length === 0 && <div className="px-4 py-10 text-center text-[13px] text-[var(--txm)]">No events recorded.</div>}
      </div>
    </div>
  );
}
