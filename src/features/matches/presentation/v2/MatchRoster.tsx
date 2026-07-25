import { useMemo, useState } from 'react';
import { AlertCircle, Check, Search, Sparkles, Users } from 'lucide-react';
import { getTeamInitials } from '../../domain/usecases/team-helpers';
import { useMatchRoster, type PoolPlayer, type RosterPlayer } from './hooks/useMatchRoster';
import type { DraftRosterPlayer } from './hooks/useMatchForm';

const HOME = '#e4002b';
const AWAY = '#38bdf8';

const playerName = (p: PoolPlayer) => `${p.firstName} ${p.lastName}`.trim();

function TeamRoster({
  name,
  teamId,
  accent,
  pool,
  roster,
  busy,
  addPlayer,
  removePlayer,
  toggleStarter,
}: {
  name: string;
  teamId: string;
  accent: string;
  pool: PoolPlayer[];
  roster: RosterPlayer[];
  busy: Set<string>;
  addPlayer: (player: PoolPlayer, teamId: string) => Promise<void>;
  removePlayer: (player: RosterPlayer) => Promise<void>;
  toggleStarter: (player: RosterPlayer) => Promise<void>;
}) {
  const [query, setQuery] = useState('');
  const [selectedOnly, setSelectedOnly] = useState(false);
  const selected = useMemo(() => new Map(roster.map((p) => [p.playerId, p])), [roster]);
  const starters = roster.filter((p) => p.started).length;
  const normalizedQuery = query.trim().toLowerCase();
  const visible = pool.filter((player) => {
    if (selectedOnly && !selected.has(player.id)) return false;
    if (!normalizedQuery) return true;
    return `${playerName(player)} ${player.position ?? ''} ${player.jerseyNumber ?? ''}`.toLowerCase().includes(normalizedQuery);
  });

  const setAll = async () => {
    if (roster.length === pool.length) {
      await Promise.all(roster.map(removePlayer));
      return;
    }
    await Promise.all(pool.filter((player) => !selected.has(player.id)).map((player) => addPlayer(player, teamId)));
  };

  const setAutoStarters = async () => {
    const chosen = roster.slice(0, 5);
    await Promise.all([
      ...chosen.filter((player) => !player.started).map(toggleStarter),
      ...roster.slice(5).filter((player) => player.started).map(toggleStarter),
    ]);
  };

  return (
    <section className="overflow-hidden rounded-xl border bg-[var(--surf2)]" style={{ borderColor: `${accent}33` }}>
      <div className="flex items-center gap-3 border-b border-[var(--bord2)] px-4 py-3.5">
        <span
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-['Anton'] text-[12px] uppercase"
          style={{ background: `${accent}22`, color: accent }}
        >
          {getTeamInitials(name)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-['Anton'] text-[16px] uppercase leading-none text-[var(--tx)]">{name}</h3>
          <p className="mt-1 font-['Space_Mono'] text-[9.5px] uppercase tracking-[0.06em] text-[var(--txm)]">
            {roster.length} selected · {starters} starters · {pool.length} squad
          </p>
        </div>
      </div>

      <div className="border-b border-[var(--bord2)] p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--faint)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search squad…"
            className="eb-in !h-9 !rounded-md !pl-9 !text-[12px]"
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedOnly((value) => !value)}
            className="rounded-md border px-2.5 py-1 font-['Space_Mono'] text-[9px] font-bold uppercase tracking-[0.04em]"
            style={selectedOnly ? { borderColor: `${accent}88`, background: `${accent}1c`, color: accent } : { borderColor: 'var(--bord)', color: 'var(--txm)' }}
          >
            {selectedOnly ? 'Showing selected' : 'Show selected only'}
          </button>
        </div>
      </div>

      <div className="eb-scroll m-3 flex max-h-[268px] flex-col gap-1.5 overflow-y-auto pr-1">
        {visible.length === 0 ? (
          <div className="py-8 text-center font-['Archivo'] text-[12px] text-[var(--txm)]">No players match this view.</div>
        ) : (
          visible.map((player) => {
            const matchPlayer = selected.get(player.id);
            const isSelected = Boolean(matchPlayer);
            const isBusy = busy.has(`add-${player.id}`) || (matchPlayer ? busy.has(matchPlayer.id) : false);
            return (
              <div
                key={player.id}
                className="flex items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-colors"
                style={{ borderColor: isSelected ? `${accent}55` : 'var(--bord2)', background: isSelected ? `${accent}12` : 'transparent', opacity: isBusy ? 0.55 : 1 }}
              >
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => matchPlayer ? removePlayer(matchPlayer) : addPlayer(player, teamId)}
                  aria-label={`${isSelected ? 'Remove' : 'Select'} ${playerName(player)}`}
                  className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px]"
                  style={{ borderColor: isSelected ? accent : 'var(--bord)', background: isSelected ? accent : 'transparent' }}
                >
                  {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </button>
                <span className="w-7 flex-shrink-0 text-center font-['Space_Mono'] text-[10px] text-[var(--faint)]">
                  {player.jerseyNumber != null ? `#${player.jerseyNumber}` : '—'}
                </span>
                <span className="min-w-0 flex-1 truncate font-['Archivo'] text-[12.5px] font-semibold text-[var(--tx)]">{playerName(player)}</span>
                <span className="font-['Space_Mono'] text-[9px] uppercase text-[var(--txm)]">{player.position || '—'}</span>
                <button
                  type="button"
                  disabled={!matchPlayer || isBusy}
                  onClick={() => matchPlayer && toggleStarter(matchPlayer)}
                  className="min-w-[62px] rounded-md border px-2 py-1 font-['Space_Mono'] text-[8.5px] font-bold uppercase tracking-[0.04em] disabled:cursor-not-allowed disabled:opacity-35"
                  style={matchPlayer?.started
                    ? { borderColor: '#f5b30188', background: 'rgba(245,179,1,0.16)', color: '#f5b301' }
                    : { borderColor: 'var(--bord)', color: 'var(--txm)' }}
                >
                  {matchPlayer?.started ? 'Starter' : 'Bench'}
                </button>
              </div>
            );
          })
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-[var(--bord2)] p-3">
        <button type="button" onClick={setAll} className="rounded-lg border border-[var(--bord)] bg-[var(--surf)] px-3 py-2 font-['Archivo'] text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]">
          {roster.length === pool.length && pool.length > 0 ? 'Clear all' : 'Select all'}
        </button>
        <button type="button" onClick={setAutoStarters} disabled={roster.length === 0} className="inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--bord)] bg-[var(--surf)] px-3 py-2 font-['Archivo'] text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--txd)] hover:border-[#f5b301] disabled:opacity-40">
          <Sparkles className="h-3 w-3" /> Auto starters
        </button>
      </div>
    </section>
  );
}

export default function MatchRoster({
  matchId,
  team1Id,
  team1Name,
  team2Id,
  team2Name,
  onDraftChange,
}: {
  matchId?: string;
  team1Id: string;
  team1Name: string;
  team2Id: string;
  team2Name: string;
  onDraftChange?: (players: DraftRosterPlayer[]) => void;
}) {
  const enabled = Boolean(team1Id && team2Id && team1Id !== team2Id);
  const roster = useMatchRoster({ matchId, team1Id, team2Id, enabled });
  const [draft, setDraft] = useState<RosterPlayer[]>([]);
  const displayedRoster = matchId ? {
    forTeam: roster.rosterFor,
    add: roster.addPlayer,
    remove: roster.removePlayer,
    toggle: roster.toggleStarter,
  } : {
    forTeam: (teamId: string) => draft.filter((player) => player.teamId === teamId),
    add: async (player: PoolPlayer, teamId: string) => {
      const next = [...draft, { id: `draft-${player.id}`, playerId: player.id, teamId, started: false, jerseyNumber: player.jerseyNumber, name: playerName(player) }];
      setDraft(next);
      onDraftChange?.(next.map(({ playerId, teamId: id, started, jerseyNumber }) => ({ playerId, teamId: id, started, jerseyNumber })));
    },
    remove: async (player: RosterPlayer) => {
      const next = draft.filter((item) => item.id !== player.id);
      setDraft(next);
      onDraftChange?.(next.map(({ playerId, teamId: id, started, jerseyNumber }) => ({ playerId, teamId: id, started, jerseyNumber })));
    },
    toggle: async (player: RosterPlayer) => {
      const next = draft.map((item) => item.id === player.id ? { ...item, started: !item.started } : item);
      setDraft(next);
      onDraftChange?.(next.map(({ playerId, teamId: id, started, jerseyNumber }) => ({ playerId, teamId: id, started, jerseyNumber })));
    },
  };

  return (
    <div className="rounded-2xl border border-[var(--bord)] bg-[var(--surf)] p-6 max-[600px]:p-5">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand)]/[0.12] text-[var(--brand)]">
          <Users className="h-[18px] w-[18px]" />
        </span>
        <div>
          <h2 className="font-['Anton'] text-[18px] uppercase leading-none text-[var(--tx)]">Match Roster</h2>
          <p className="mt-1 font-['Space_Mono'] text-[11px] text-[var(--txm)]">Select players and assign the starting five · {roster.totals.count} selected</p>
        </div>
      </div>

      {roster.error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--brand)]/40 bg-[var(--brand)]/[0.08] px-3 py-2 text-[12.5px] text-[var(--brandsoft)]">
          <AlertCircle className="h-4 w-4" /> {roster.error}
        </div>
      )}

      {!enabled ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--bord)] bg-[var(--surf2)] px-5 py-10 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surf)] text-[var(--txm)]"><Users className="h-[18px] w-[18px]" /></span>
          <div className="font-['Archivo'] text-[13px] font-bold text-[var(--tx)]">Select both teams first</div>
          <p className="max-w-[300px] font-['Archivo'] text-[12px] text-[var(--txm)]">Once the matchup is set, each squad&apos;s players load here for selection.</p>
        </div>
      ) : roster.loading ? (
        <div className="grid grid-cols-2 gap-4 max-[760px]:grid-cols-1">
          <div className="h-72 animate-pulse rounded-xl bg-[var(--surf2)]" />
          <div className="h-72 animate-pulse rounded-xl bg-[var(--surf2)]" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 max-[760px]:grid-cols-1">
          {team1Id && <TeamRoster name={team1Name || 'Home'} teamId={team1Id} accent={HOME} pool={roster.poolFor(team1Id)} roster={displayedRoster.forTeam(team1Id)} busy={roster.busy} addPlayer={displayedRoster.add} removePlayer={displayedRoster.remove} toggleStarter={displayedRoster.toggle} />}
          {team2Id && <TeamRoster name={team2Name || 'Away'} teamId={team2Id} accent={AWAY} pool={roster.poolFor(team2Id)} roster={displayedRoster.forTeam(team2Id)} busy={roster.busy} addPlayer={displayedRoster.add} removePlayer={displayedRoster.remove} toggleStarter={displayedRoster.toggle} />}
        </div>
      )}
    </div>
  );
}
