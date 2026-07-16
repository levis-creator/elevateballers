import { useEffect, useRef, useState } from 'react';
import { Users, UserPlus, X, Star, AlertCircle } from 'lucide-react';
import { getTeamInitials } from '../../domain/usecases/team-helpers';
import { useMatchRoster, type PoolPlayer, type RosterPlayer } from './hooks/useMatchRoster';

const HOME = '#e4002b';
const AWAY = '#2a6fdb';

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-[var(--bord)] bg-[var(--surf)] ${className}`}>{children}</div>
);

const playerLabel = (p: PoolPlayer) => `${p.firstName} ${p.lastName}`.trim();

/** Searchable dropdown to add a team player to the match roster. */
function AddPlayerPicker({
  accent,
  available,
  busy,
  onAdd,
}: {
  accent: string;
  available: PoolPlayer[];
  busy: (id: string) => boolean;
  onAdd: (p: PoolPlayer) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = (q ? available.filter((p) => playerLabel(p).toLowerCase().includes(q)) : available).slice(0, 10);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={available.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--bord)] px-3 py-2 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] hover:border-[var(--brand)]/50 hover:text-[var(--tx)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <UserPlus className="h-4 w-4" />
        {available.length === 0 ? 'All players added' : 'Add player'}
      </button>
      {open && filtered.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-[var(--bord)] bg-[var(--surf)] p-1 shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search players…"
            className="eb-in mb-1 !py-2 !text-[12.5px]"
          />
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={busy(`add-${p.id}`)}
              onClick={() => {
                onAdd(p);
                setQuery('');
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left hover:bg-[var(--hov)] disabled:opacity-50"
            >
              <span
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-['Anton'] text-[10px]"
                style={{ background: `${accent}22`, color: accent }}
              >
                {getTeamInitials(playerLabel(p))}
              </span>
              <span className="font-['Archivo'] text-[13px] text-[var(--tx)]">{playerLabel(p)}</span>
              {p.jerseyNumber != null && (
                <span className="ml-auto font-['Space_Mono'] text-[11px] text-[var(--txm)]">#{p.jerseyNumber}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TeamColumn({
  name,
  teamId,
  accent,
  roster,
  available,
  busy,
  onAdd,
  onRemove,
  onToggle,
}: {
  name: string;
  teamId: string;
  accent: string;
  roster: RosterPlayer[];
  available: PoolPlayer[];
  busy: (id: string) => boolean;
  onAdd: (p: PoolPlayer, teamId: string) => void;
  onRemove: (mp: RosterPlayer) => void;
  onToggle: (mp: RosterPlayer) => void;
}) {
  const starters = roster.filter((r) => r.started).length;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-['Anton'] text-[12px] uppercase"
          style={{ border: `2px solid ${accent}`, background: `${accent}1f`, color: accent }}
        >
          {getTeamInitials(name)}
        </span>
        <div className="min-w-0">
          <div className="truncate font-['Anton'] text-[15px] uppercase text-[var(--tx)]">{name}</div>
          <div className="font-['Space_Mono'] text-[10px] uppercase tracking-[0.08em] text-[var(--txm)]">
            {roster.length} players · {starters} starters
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {roster.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--bord)] px-3 py-4 text-center font-['Archivo'] text-[12.5px] text-[var(--txm)]">
            No players on the roster yet.
          </div>
        ) : (
          roster.map((mp) => {
            const rowBusy = busy(mp.id);
            return (
              <div
                key={mp.id}
                className={`flex items-center gap-2.5 rounded-lg border border-[var(--bord2)] bg-[var(--surf2)] px-3 py-2 ${rowBusy ? 'opacity-60' : ''}`}
              >
                <span className="w-7 flex-shrink-0 text-center font-['Space_Mono'] text-[11px] text-[var(--faint)]">
                  {mp.jerseyNumber != null ? `#${mp.jerseyNumber}` : '—'}
                </span>
                <span className="min-w-0 flex-1 truncate font-['Archivo'] text-[13px] font-semibold text-[var(--tx)]">{mp.name}</span>
                <button
                  type="button"
                  disabled={rowBusy}
                  onClick={() => onToggle(mp)}
                  aria-pressed={mp.started}
                  title={mp.started ? 'Starter — click to move to bench' : 'Bench — click to mark starter'}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 font-['Space_Mono'] text-[9px] font-bold uppercase tracking-[0.06em] transition-colors ${
                    mp.started
                      ? 'border-[#f5c518] bg-[#f5c518]/15 text-[#f5c518]'
                      : 'border-[var(--bord)] text-[var(--txm)] hover:text-[var(--tx)]'
                  }`}
                >
                  <Star className="h-[11px] w-[11px]" fill={mp.started ? '#f5c518' : 'none'} />
                  {mp.started ? 'Starter' : 'Bench'}
                </button>
                <button
                  type="button"
                  disabled={rowBusy}
                  onClick={() => onRemove(mp)}
                  aria-label={`Remove ${mp.name}`}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[var(--txm)] hover:bg-[var(--brand)]/10 hover:text-[var(--brand)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })
        )}
        <AddPlayerPicker accent={accent} available={available} busy={busy} onAdd={(p) => onAdd(p, teamId)} />
      </div>
    </div>
  );
}

export default function MatchRoster({
  matchId,
  team1Id,
  team1Name,
  team2Id,
  team2Name,
}: {
  matchId?: string;
  team1Id: string;
  team1Name: string;
  team2Id: string;
  team2Name: string;
}) {
  const enabled = Boolean(matchId) && Boolean(team1Id || team2Id);
  const r = useMatchRoster({ matchId, team1Id, team2Id, enabled });

  if (!enabled) return null;

  return (
    <Card className="mt-4 p-6 max-[600px]:p-4">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--brand)]/[0.12] text-[var(--brand)]">
          <Users className="h-[18px] w-[18px]" />
        </span>
        <div>
          <h2 className="font-['Anton'] text-[18px] uppercase leading-none text-[var(--tx)]">Match Roster</h2>
          <p className="mt-1 font-['Space_Mono'] text-[11px] text-[var(--txm)]">
            Pick who plays and mark the starters · {r.totals.count} selected
          </p>
        </div>
      </div>

      {r.error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--brand)]/40 bg-[var(--brand)]/[0.08] px-3 py-2 font-['Archivo'] text-[12.5px] text-[var(--brandsoft)]">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {r.error}
        </div>
      )}

      {r.loading ? (
        <div className="grid grid-cols-2 gap-6 max-[640px]:grid-cols-1">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-[var(--surf2)]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 max-[640px]:grid-cols-1">
          {team1Id ? (
            <TeamColumn
              name={team1Name || 'Home'}
              teamId={team1Id}
              accent={HOME}
              roster={r.rosterFor(team1Id)}
              available={r.availableFor(team1Id)}
              busy={(id) => r.busy.has(id)}
              onAdd={r.addPlayer}
              onRemove={r.removePlayer}
              onToggle={r.toggleStarter}
            />
          ) : (
            <RosterUnavailable name={team1Name} />
          )}
          {team2Id ? (
            <TeamColumn
              name={team2Name || 'Away'}
              teamId={team2Id}
              accent={AWAY}
              roster={r.rosterFor(team2Id)}
              available={r.availableFor(team2Id)}
              busy={(id) => r.busy.has(id)}
              onAdd={r.addPlayer}
              onRemove={r.removePlayer}
              onToggle={r.toggleStarter}
            />
          ) : (
            <RosterUnavailable name={team2Name} />
          )}
        </div>
      )}
    </Card>
  );
}

function RosterUnavailable({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--bord)] px-4 py-8 text-center">
      <span className="font-['Archivo'] text-[13px] font-bold text-[var(--txd)]">{name || 'Custom team'}</span>
      <p className="max-w-[220px] font-['Archivo'] text-[12px] text-[var(--txm)]">
        Roster management is available for registered teams. Pick a team from the list to manage its players.
      </p>
    </div>
  );
}
