/**
 * Match players: both squads with jersey, position and starter for this match.
 * Starters can only change before tip-off; players with events or on the floor
 * can't be removed. Photos upload to the player's profile.
 */
import { useState } from 'react';
import Avatar from './Avatar';
import { TONE, card, type Side } from './tone';
import { jersey, type RosterPlayer } from './roster';
import type { LiveConsole } from './useLiveConsole';

interface Props {
  lc: LiveConsole;
  upcoming: boolean;
  onChanged: () => unknown;
}

interface TeamPlayer {
  id: string;
  firstName: string | null;
  lastName: string | null;
  jerseyNumber: number | null;
  position: string | null;
}

const grid = 'grid grid-cols-[92px_minmax(0,1fr)_56px_86px_auto] items-center gap-2';
const editGrid = 'grid grid-cols-[64px_minmax(0,1fr)_72px_auto] items-center gap-2';

async function send(url: string, method: string, body?: unknown): Promise<string | null> {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  }).catch(() => null);
  if (res?.ok) return null;
  const data = await res?.json().catch(() => null);
  return data?.error || 'Could not save — try again';
}

export default function PlayersTab({ lc, upcoming, onChanged }: Props) {
  const [edit, setEdit] = useState<{ mpId: string; no: string; pos: string } | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [pool, setPool] = useState<TeamPlayer[]>([]);
  const [draft, setDraft] = useState({ playerId: '', no: '', pos: '' });
  const [busy, setBusy] = useState(false);

  const run = async (url: string, method: string, body: unknown, ok?: string) => {
    setBusy(true);
    const error = await send(url, method, body);
    setBusy(false);
    if (error) {
      lc.flash(error);
      return false;
    }
    if (ok) lc.flash(ok);
    await onChanged();
    return true;
  };

  const openAdd = async (teamId: string) => {
    setEdit(null);
    setAdding(teamId);
    setDraft({ playerId: '', no: '', pos: '' });
    const res = await fetch(`/api/players?teamId=${teamId}`).catch(() => null);
    const list: TeamPlayer[] = res?.ok ? await res.json() : [];
    const listed = new Set(lc.teamRoster(teamId).map((p) => p.id));
    setPool(list.filter((p) => !listed.has(p.id)));
  };

  const saveAdd = async (teamId: string) => {
    if (!draft.playerId) return lc.flash('Pick a player to add');
    const added = await run(
      `/api/matches/${lc.matchId}/players`,
      'POST',
      {
        playerId: draft.playerId,
        teamId,
        started: false,
        jerseyNumber: draft.no ? Number(draft.no) : undefined,
        position: draft.pos || undefined,
      },
      'Player added',
    );
    if (added) setAdding(null);
  };

  const saveEdit = async () => {
    if (!edit) return;
    const saved = await run(`/api/matches/${lc.matchId}/players/${edit.mpId}`, 'PUT', {
      jerseyNumber: edit.no === '' ? null : Number(edit.no),
      position: edit.pos || null,
    });
    if (saved) setEdit(null);
  };

  const uploadPhoto = async (p: RosterPlayer, file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('folder', 'players');
    const res = await fetch('/api/upload/image', { method: 'POST', body: form }).catch(() => null);
    const data = res?.ok ? await res.json() : null;
    setBusy(false);
    if (!data?.url) return lc.flash('Photo upload failed');
    await run(`/api/players/${p.id}`, 'PUT', { image: data.url }, 'Photo updated');
  };

  return (
    <>
      <div className="mb-3 rounded-xl border border-[var(--bord)] bg-[var(--surf2)] px-4 py-3 text-[13px] text-[var(--txd)]">
        {upcoming
          ? 'Admin changes here override the Team Portal lineup. Starters lock at tip-off.'
          : 'Starters are locked — use Substitutions on the court console to change who is on the floor.'}{' '}
        Photos come from each player&apos;s profile — click an avatar to upload; it updates the profile photo everywhere.
      </div>
      <div className="grid grid-cols-2 gap-4 max-[1250px]:grid-cols-1">
        {[lc.homeId, lc.awayId].map((teamId) => {
          const side: Side = teamId === lc.homeId ? 'home' : 'away';
          const squad = lc.teamRoster(teamId);
          const starters = squad.filter((p) => p.started).length;
          return (
            <div key={teamId} className={card}>
              <div className="flex flex-wrap items-center gap-3 border-b border-[var(--bord2)] px-4 py-3">
                <span className={`h-2.5 w-2.5 rounded-full ${TONE[side].bg}`} />
                <span className="min-w-0 flex-1 font-anton text-[16px] uppercase">{lc.teams[teamId]?.name}</span>
                <span
                  className={`font-mono text-[10px] font-bold uppercase tracking-[0.1em] ${
                    starters === 5 ? 'text-[var(--ok)]' : 'text-[var(--warn)]'
                  }`}
                >
                  {starters}/5 starters
                </span>
                <button
                  type="button"
                  onClick={() => openAdd(teamId)}
                  className="h-9 rounded-lg bg-[var(--brand)] px-3 text-[12px] font-bold text-white hover:bg-[var(--brandlt)]"
                >
                  Add player
                </button>
              </div>
              <div className="flex items-center gap-2 border-b border-[var(--bord2)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.1em]">
                <span className={`h-1.5 w-1.5 rounded-full ${squad.length ? 'bg-[var(--ok)]' : 'bg-[var(--warn)]'}`} />
                <span className="text-[var(--txd)]">{squad.length} players listed for this match</span>
              </div>
              <div className={`${grid} border-b border-[var(--bord2)] px-4 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--faint)]`}>
                <span>No.</span>
                <span>Player</span>
                <span>Pos</span>
                <span>Starter</span>
                <span className="text-right">Actions</span>
              </div>
              {squad.map((p) => {
                const editing = edit?.mpId === p.mpId;
                const locked = lc.events.some((e) => e.playerId === p.id) || (!upcoming && (lc.floor[teamId] ?? []).includes(p.id));
                return (
                  <div key={p.mpId} className="border-b border-[var(--bord2)] px-4 py-2 hover:bg-[var(--hov)]">
                    {!editing ? (
                      <div className={grid}>
                        <span className="flex items-center gap-2.5">
                          <label title="Upload photo" className="group relative cursor-pointer">
                            <Avatar player={p} side={side} size="h-9 w-9 text-[12px]" />
                            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 font-mono text-[8px] font-bold uppercase text-white opacity-0 group-hover:opacity-100">
                              {p.photo ? 'Change' : 'Upload'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={busy}
                              onChange={(e) => {
                                uploadPhoto(p, e.target.files?.[0]);
                                e.target.value = '';
                              }}
                            />
                          </label>
                          <span className="font-anton text-[18px]">{jersey(p)}</span>
                        </span>
                        <span className="truncate text-[13px] font-semibold">{p.name}</span>
                        <span className="font-mono text-[11px] text-[var(--txd)]">{p.pos}</span>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            if (!upcoming) return lc.flash('Starters lock at tip-off — use Substitutions');
                            run(`/api/matches/${lc.matchId}/players/${p.mpId}`, 'PUT', { started: !p.started });
                          }}
                          className={`h-7 w-[78px] rounded-md text-[11px] font-bold ${
                            p.started ? 'bg-[var(--tx)] text-[var(--bg)]' : 'border border-[var(--bord2)] text-[var(--faint)]'
                          } ${upcoming ? '' : 'cursor-default'}`}
                        >
                          {p.started ? 'Starter' : '—'}
                        </button>
                        <span className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setAdding(null);
                              setEdit({ mpId: p.mpId, no: p.no == null ? '' : String(p.no), pos: p.pos === '—' ? '' : p.pos });
                            }}
                            className="h-7 rounded-md border border-[var(--bord)] px-2 text-[11px] font-semibold text-[var(--txd)] hover:text-[var(--tx)]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              if (locked) return lc.flash('Can’t remove — player has match events or is on the floor');
                              run(`/api/matches/${lc.matchId}/players/${p.mpId}`, 'DELETE', undefined, `${p.name} removed`);
                            }}
                            className={`h-7 rounded-md border px-2 text-[11px] font-semibold ${
                              locked
                                ? 'border-[var(--bord2)] text-[var(--faint)]'
                                : 'border-[var(--bord)] text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]'
                            }`}
                          >
                            Remove
                          </button>
                        </span>
                      </div>
                    ) : (
                      <div className={editGrid}>
                        <input
                          value={edit.no}
                          onChange={(e) => setEdit({ ...edit, no: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                          placeholder="No."
                          className="mc-inp font-mono"
                        />
                        <span className="truncate px-1 text-[13px] font-semibold">{p.name}</span>
                        <input
                          value={edit.pos}
                          onChange={(e) => setEdit({ ...edit, pos: e.target.value.toUpperCase().slice(0, 3) })}
                          placeholder="Pos"
                          className="mc-inp font-mono uppercase"
                        />
                        <span className="flex gap-1">
                          <button type="button" disabled={busy} onClick={saveEdit} className="h-8 rounded-md bg-[var(--brand)] px-3 text-[12px] font-bold text-white">
                            Save
                          </button>
                          <button type="button" onClick={() => setEdit(null)} className="h-8 rounded-md border border-[var(--bord)] px-2 text-[12px] text-[var(--txd)]">
                            Cancel
                          </button>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
              {squad.length === 0 && adding !== teamId && (
                <div className="px-4 py-8 text-center text-[13px] text-[var(--txm)]">No players listed yet — use Add player.</div>
              )}
              {adding === teamId && (
                <div className={`${editGrid} bg-[var(--surf2)] px-4 py-3`}>
                  <input
                    value={draft.no}
                    onChange={(e) => setDraft({ ...draft, no: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                    placeholder="No."
                    className="mc-inp font-mono"
                  />
                  <select
                    value={draft.playerId}
                    onChange={(e) => {
                      const pl = pool.find((x) => x.id === e.target.value);
                      setDraft({
                        playerId: e.target.value,
                        no: draft.no || (pl?.jerseyNumber != null ? String(pl.jerseyNumber) : ''),
                        pos: draft.pos || (pl?.position ?? ''),
                      });
                    }}
                    className="mc-inp"
                  >
                    <option value="">{pool.length ? 'Pick a team player…' : 'No more team players'}</option>
                    {pool.map((pl) => (
                      <option key={pl.id} value={pl.id}>
                        {[pl.firstName, pl.lastName].filter(Boolean).join(' ')}
                      </option>
                    ))}
                  </select>
                  <input
                    value={draft.pos}
                    onChange={(e) => setDraft({ ...draft, pos: e.target.value.toUpperCase().slice(0, 3) })}
                    placeholder="Pos"
                    className="mc-inp font-mono uppercase"
                  />
                  <span className="flex gap-1">
                    <button type="button" disabled={busy} onClick={() => saveAdd(teamId)} className="h-8 rounded-md bg-[var(--brand)] px-3 text-[12px] font-bold text-white">
                      Add
                    </button>
                    <button type="button" onClick={() => setAdding(null)} className="h-8 rounded-md border border-[var(--bord)] px-2 text-[12px] text-[var(--txd)]">
                      Cancel
                    </button>
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
