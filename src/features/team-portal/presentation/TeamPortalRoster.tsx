import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, Check, Users, X } from 'lucide-react';

type Player = {
  id: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  stats: { gp: number; ppg: number; reb: number; ast: number } | null;
  jerseyNumber: number | null;
  position: string | null;
  proposalNote: string | null;
  player: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    image: string | null;
    position: string | null;
    jerseyNumber: number | null;
    email: string | null;
    dateOfBirth: string | null;
    phone: string | null;
  };
};
type RosterData = {
  team: { name: string };
  season: { name: string } | null;
  leagueName: string | null;
  seasonTeamId: string | null;
  players: Player[];
};

const rosterStyles = `.portal-roster-card{background:var(--portal-surface,#111010);border-color:var(--portal-border,rgba(255,255,255,.08))}.portal-roster-toolbar{background:var(--portal-surface,#111010);border-color:var(--portal-border,rgba(255,255,255,.08))}.portal-roster-row{border-color:var(--portal-border-muted,rgba(255,255,255,.06))}.portal-roster-number,.portal-roster-edit{border-color:var(--portal-border,rgba(255,255,255,.08));background:var(--portal-surface-muted,rgba(255,255,255,.03))}.portal-roster-action{cursor:pointer}.portal-roster-filter{flex-shrink:0;min-height:40px;padding:9px 14px;border-radius:999px!important;font-family:'Space Mono',monospace;font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap}.portal-roster-filter:not(.roster-filter-active){border-color:var(--portal-border);background:var(--portal-surface-muted);color:var(--portal-muted,#8a817a)}.portal-roster-filter.roster-filter-active{border-color:#e4002b;background:rgba(228,0,43,.14);color:#ff5a72}.portal-roster-edit{min-height:44px;padding:11px 16px;border-radius:9px!important;font-family:Archivo,sans-serif;font-size:12px;font-weight:700;white-space:nowrap;color:var(--portal-text-muted,#b8afa6)}.portal-roster-primary{border-color:#e4002b;background:#e4002b;color:#fff}.portal-roster-edit:hover{border-color:#e4002b;color:#e4002b}.portal-roster-primary:hover{background:#ff2d43;color:#fff}.portal-light .portal-roster-card,.portal-light .portal-roster-toolbar{--portal-surface:#fff;--portal-border:#e6e1d8;--portal-border-muted:#ece7df;--portal-surface-muted:#f4f1ea;--portal-muted:#6f665c;--portal-text-muted:#4a443d}.portal-light .portal-roster-card .text-cream{color:#141009!important}.portal-light .portal-roster-card .text-\[\#8a817a\]{color:#6f665c!important}.portal-light .portal-roster-card .text-\[\#5f574e\]{color:#9a9084!important}`;

export default function TeamPortalRoster({
  teamId,
  teamName,
}: {
  teamId: string;
  teamName: string;
}) {
  const [data, setData] = useState<RosterData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'cleared' | 'pending' | 'docs'>('all');
  const [proposalOpen, setProposalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Player | null>(null);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [proposalMessage, setProposalMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    jerseyNumber: '',
    position: '',
    dateOfBirth: '',
    phone: '',
    note: '',
  });
  const loadRoster = useCallback(() => {
    setLoading(true);
    return fetch(`/api/team-portal/roster?teamId=${encodeURIComponent(teamId)}`, {
      cache: 'no-store',
    })
      .then(async (response) => {
        const value = await response.json();
        if (!response.ok) throw new Error(value.error || 'Unable to load roster.');
        return value;
      })
      .then(setData)
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load roster.'))
      .finally(() => setLoading(false));
  }, [teamId]);
  useEffect(() => {
    void loadRoster();
  }, [loadRoster]);
  const openEdit = (entry: Player) => {
    setEditingEntry(entry);
    setForm({
      firstName: entry.player.firstName || '',
      lastName: entry.player.lastName || '',
      email: entry.player.email || '',
      jerseyNumber: String(entry.jerseyNumber ?? entry.player.jerseyNumber ?? ''),
      position: entry.position || entry.player.position || '',
      dateOfBirth: entry.player.dateOfBirth ? entry.player.dateOfBirth.slice(0, 10) : '',
      phone: entry.player.phone || '',
      note: entry.proposalNote || '',
    });
    setProposalError(null);
    setProposalMessage(null);
    setProposalOpen(true);
  };
  const submitProposal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setProposalError(null);
    setProposalMessage(null);
    try {
      const response = await fetch('/api/team-portal/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          ...(editingEntry ? { rosterId: editingEntry.id } : {}),
          ...form,
        }),
      });
      const value = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(value.error || 'Unable to propose player.');
      setProposalMessage(
        value.message ||
          (editingEntry
            ? 'Roster edit sent for admin approval.'
            : 'Player proposal sent for admin approval.')
      );
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        jerseyNumber: '',
        position: '',
        dateOfBirth: '',
        phone: '',
        note: '',
      });
      setEditingEntry(null);
      await loadRoster();
    } catch (cause) {
      setProposalError(cause instanceof Error ? cause.message : 'Unable to propose player.');
    } finally {
      setSubmitting(false);
    }
  };
  const players = data?.players ?? [];
  const visiblePlayers = players.filter((entry) => {
    if (filter === 'cleared') return entry.status === 'APPROVED';
    if (filter === 'pending') return entry.status === 'PENDING';
    if (filter === 'docs') return !entry.player.email;
    return true;
  });
  return (
    <div className="mx-auto max-w-[1180px]">
      <style>{rosterStyles}</style>
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-center gap-2 rounded-xl border border-brand/30 bg-brand/[0.08] px-4 py-3 text-[13px] text-brandsoft"
        >
          <AlertCircle size={17} />
          {error}
        </div>
      )}
      {loading ? (
        <section className="portal-roster-card rounded-2xl border px-5 py-8 text-[13px] text-[#8a817a]">
          Loading your approved roster…
        </section>
      ) : (
        <div className="grid gap-4">
          <div className="portal-roster-toolbar flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3.5">
            <div className="flex flex-wrap gap-1.5">
              <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
                All {players.length}
              </FilterButton>
              <FilterButton active={filter === 'cleared'} onClick={() => setFilter('cleared')}>
                Cleared {players.filter((entry) => entry.status === 'APPROVED').length}
              </FilterButton>
              <FilterButton active={filter === 'pending'} onClick={() => setFilter('pending')}>
                Pending {players.filter((entry) => entry.status === 'PENDING').length}
              </FilterButton>
              <FilterButton active={filter === 'docs'} onClick={() => setFilter('docs')}>
                Docs {players.filter((entry) => !entry.player.email).length}
              </FilterButton>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingEntry(null);
                setForm({
                  firstName: '',
                  lastName: '',
                  email: '',
                  jerseyNumber: '',
                  position: '',
                  dateOfBirth: '',
                  phone: '',
                  note: '',
                });
                setProposalOpen(true);
                setProposalError(null);
                setProposalMessage(null);
              }}
              aria-haspopup="dialog"
              className="portal-roster-action portal-roster-edit portal-roster-primary ml-auto border disabled:cursor-not-allowed disabled:opacity-50"
            >
              + Propose a player
            </button>
          </div>
          {proposalOpen && (
            <div
              className="portal-roster-modal fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setProposalOpen(false);
              }}
            >
              <form
                onSubmit={submitProposal}
                className="portal-roster-card w-full max-w-[620px] rounded-2xl border p-5 shadow-2xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="propose-player-title"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-brandsoft">
                      Roster proposal
                    </p>
                    <h2
                      id="propose-player-title"
                      className="mt-1 font-display text-[24px] uppercase text-cream"
                    >
                      {editingEntry ? 'Propose an edit' : 'Propose a player'}
                    </h2>
                    <p className="mt-2 text-[12.5px] text-[#8a817a]">
                      {editingEntry
                        ? 'Updated roster details will apply after admin approval.'
                        : 'The player will be added to the active season after admin approval.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProposalOpen(false)}
                    className="portal-roster-action border border-white/[0.1] bg-white/[0.04] p-2 text-[#8a817a]"
                    aria-label="Close proposal form"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ['firstName', 'First name'],
                      ['lastName', 'Last name'],
                      ['email', 'Email address'],
                      ['jerseyNumber', 'Jersey number'],
                      ['position', 'Position'],
                      ['dateOfBirth', 'Date of birth'],
                      ['phone', 'Phone'],
                      ['note', 'Note to the league office'],
                    ] as const
                  ).map(([key, label]) => (
                    <label
                      key={key}
                      className={key === 'email' || key === 'note' ? 'sm:col-span-2' : ''}
                    >
                      <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.1em] text-[#8a817a]">
                        {label}
                        {['firstName', 'lastName', 'email', 'dateOfBirth'].includes(key)
                          ? ' *'
                          : ''}
                      </span>
                      {key === 'position' ? (
                        <select
                          value={form.position}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, position: event.target.value }))
                          }
                          className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2.5 text-[13px] text-cream outline-none focus:border-brand"
                        >
                          <option value="">Select position</option>
                          <option value="PG">PG · Point guard</option>
                          <option value="SG">SG · Shooting guard</option>
                          <option value="SF">SF · Small forward</option>
                          <option value="PF">PF · Power forward</option>
                          <option value="C">C · Center</option>
                        </select>
                      ) : key === 'note' ? (
                        <textarea
                          rows={3}
                          value={form.note}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, note: event.target.value }))
                          }
                          placeholder="Add context for the league office"
                          className="w-full resize-y rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2.5 text-[13px] text-cream outline-none focus:border-brand"
                        />
                      ) : (
                        <input
                          required={
                            !editingEntry &&
                            ['firstName', 'lastName', 'email', 'dateOfBirth'].includes(key)
                          }
                          disabled={Boolean(
                            editingEntry &&
                            ['firstName', 'lastName', 'email', 'dateOfBirth'].includes(key)
                          )}
                          type={
                            key === 'email'
                              ? 'email'
                              : key === 'jerseyNumber'
                                ? 'number'
                                : key === 'dateOfBirth'
                                  ? 'date'
                                  : 'tel'
                          }
                          min={key === 'jerseyNumber' ? 0 : undefined}
                          max={key === 'jerseyNumber' ? 99 : undefined}
                          value={form[key]}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, [key]: event.target.value }))
                          }
                          className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2.5 text-[13px] text-cream outline-none focus:border-brand"
                        />
                      )}
                    </label>
                  ))}
                </div>
                {(proposalError || proposalMessage) && (
                  <div
                    role={proposalError ? 'alert' : 'status'}
                    className={`mt-4 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[12px] ${proposalError ? 'border-brand/30 bg-brand/[0.08] text-brandsoft' : 'border-[#4ea36a]/30 bg-[#4ea36a]/[0.1] text-[#4ea36a]'}`}
                  >
                    {proposalError ? <AlertCircle size={15} /> : <Check size={15} />}
                    {proposalError || proposalMessage}
                  </div>
                )}
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setProposalOpen(false)}
                    className="portal-roster-action border border-white/[0.1] bg-white/[0.04] px-3.5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#8a817a]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="portal-roster-action border border-brand bg-brand px-3.5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? 'Sending…' : 'Send proposal'}
                  </button>
                </div>
              </form>
            </div>
          )}
          <section
            aria-label={`${teamName} roster`}
            className="portal-roster-card overflow-hidden rounded-2xl border"
          >
            {visiblePlayers.length ? (
              <div className="grid gap-0">
                {visiblePlayers.map((entry) => (
                  <PlayerRow key={entry.id} entry={entry} onEdit={() => openEdit(entry)} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
                <Users className="h-8 w-8 text-[#5f574e]" />
                <h3 className="font-display text-[19px] uppercase text-cream">
                  No approved players yet
                </h3>
                <p className="max-w-[380px] text-[12.5px] text-[#8a817a]">
                  Players will appear here after their season registrations are approved.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function PlayerRow({ entry, onEdit }: { entry: Player; onEdit: () => void }) {
  const name =
    `${entry.player.firstName || ''} ${entry.player.lastName || ''}`.trim() || 'Unnamed player';
  const number = entry.jerseyNumber ?? entry.player.jerseyNumber;
  const position = entry.position || entry.player.position || 'Position not set';
  return (
    <div className="portal-roster-row border-b px-5 py-4 last:border-b-0">
      <div className="flex flex-wrap items-center gap-4">
        <div className="portal-roster-number flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-lg border font-display text-[15px] leading-none text-[#b8afa6]">
          {number ?? '—'}
        </div>
        <div className="min-w-[170px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-[13.5px] font-bold text-cream">{name}</div>
            <span
              className={`rounded-md border px-2 py-1 font-mono text-[8.5px] uppercase tracking-[0.08em] ${entry.status === 'PENDING' ? 'border-[#d99a2b]/30 bg-[#d99a2b]/[0.12] text-[#d99a2b]' : 'border-[#4ea36a]/30 bg-[#4ea36a]/[0.12] text-[#4ea36a]'}`}
            >
              {entry.status === 'PENDING' ? 'Pending approval' : 'Cleared'}
            </span>
          </div>
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#8a817a]">
            {position}
            {number != null ? ` · #${number}` : ''}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {entry.status === 'APPROVED' && entry.stats ? (
            <>
              <Metric label="PPG" value={entry.stats.ppg.toFixed(1)} />
              <Metric label="REB" value={entry.stats.reb.toFixed(1)} />
              <Metric label="AST" value={entry.stats.ast.toFixed(1)} />
            </>
          ) : (
            <>
              <Metric label="Position" value={position} />
              <Metric label="Status" value="Pending" />
            </>
          )}
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Propose an edit for ${name}`}
            className="portal-roster-action portal-roster-edit border disabled:opacity-50"
          >
            Propose edit
          </button>
        </div>
      </div>
    </div>
  );
}
function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`portal-roster-action portal-roster-filter border transition-colors ${active ? 'roster-filter-active' : ''}`}
    >
      {children}
    </button>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <div className="font-display text-[15px] leading-none text-cream">{value}</div>
      <div className="mt-0.5 font-mono text-[8.5px] uppercase tracking-[0.1em] text-[#8a817a]">
        {label}
      </div>
    </div>
  );
}
