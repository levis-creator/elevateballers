import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, Check, Users, X } from 'lucide-react';

type Player = {
  id: string;
  jerseyNumber: number | null;
  position: string | null;
  player: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    image: string | null;
    position: string | null;
    jerseyNumber: number | null;
    email: string | null;
  };
};
type RosterData = {
  team: { name: string };
  season: { name: string } | null;
  leagueName: string | null;
  seasonTeamId: string | null;
  players: Player[];
};

const rosterStyles = `.portal-roster-card{background:#111010;border-color:rgba(255,255,255,.08)}.portal-roster-action{border-radius:12px!important}.portal-roster-card button{border-radius:12px!important}.portal-light .portal-roster-card{background:#fff!important;border-color:#e6e1d8!important}.portal-light .portal-roster-card .text-cream{color:#141009!important}.portal-light .portal-roster-card .text-\[\#8a817a\]{color:#6f665c!important}.portal-light .portal-roster-card .text-\[\#5f574e\]{color:#9a9084!important}`;

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
  const [filter, setFilter] = useState<'all' | 'cleared'>('all');
  const [proposalOpen, setProposalOpen] = useState(false);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [proposalMessage, setProposalMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    jerseyNumber: '',
    position: '',
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
  const submitProposal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setProposalError(null);
    setProposalMessage(null);
    try {
      const response = await fetch('/api/team-portal/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, ...form }),
      });
      const value = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(value.error || 'Unable to propose player.');
      setProposalMessage(value.message || 'Player proposal sent for admin approval.');
      setForm({ firstName: '', lastName: '', email: '', jerseyNumber: '', position: '' });
      await loadRoster();
    } catch (cause) {
      setProposalError(cause instanceof Error ? cause.message : 'Unable to propose player.');
    } finally {
      setSubmitting(false);
    }
  };
  const players = data?.players ?? [];
  const visiblePlayers =
    filter === 'cleared' ? players.filter((entry) => entry.player.id) : players;
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
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3.5">
            <div className="flex flex-wrap gap-1.5">
              <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
                All {players.length}
              </FilterButton>
              <FilterButton active={filter === 'cleared'} onClick={() => setFilter('cleared')}>
                Cleared {players.length}
              </FilterButton>
            </div>
            <button
              type="button"
              onClick={() => {
                setProposalOpen(true);
                setProposalError(null);
                setProposalMessage(null);
              }}
              aria-haspopup="dialog"
              className="portal-roster-action ml-auto border border-white/[0.1] bg-white/[0.04] px-3.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#8a817a] disabled:cursor-not-allowed disabled:opacity-70"
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
                className="portal-roster-card w-full max-w-[520px] rounded-2xl border p-5 shadow-2xl"
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
                      Propose a player
                    </h2>
                    <p className="mt-2 text-[12.5px] text-[#8a817a]">
                      The player will be added to the active season after admin approval.
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
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className={key === 'email' ? 'sm:col-span-2' : ''}>
                      <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.1em] text-[#8a817a]">
                        {label}
                        {key !== 'jerseyNumber' && key !== 'position' ? ' *' : ''}
                      </span>
                      <input
                        required={key !== 'jerseyNumber' && key !== 'position'}
                        type={
                          key === 'email' ? 'email' : key === 'jerseyNumber' ? 'number' : 'text'
                        }
                        min={key === 'jerseyNumber' ? 0 : undefined}
                        max={key === 'jerseyNumber' ? 99 : undefined}
                        value={form[key]}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, [key]: event.target.value }))
                        }
                        className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2.5 text-[13px] text-cream outline-none focus:border-brand"
                      />
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
                  <PlayerRow key={entry.id} entry={entry} />
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

function PlayerRow({ entry }: { entry: Player }) {
  const name =
    `${entry.player.firstName || ''} ${entry.player.lastName || ''}`.trim() || 'Unnamed player';
  const number = entry.jerseyNumber ?? entry.player.jerseyNumber;
  const position = entry.position || entry.player.position || 'Position not set';
  return (
    <div className="border-b border-white/[0.06] px-5 py-4 last:border-b-0">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.03] font-display text-[15px] text-[#b8afa6]">
          {entry.player.image ? (
            <img src={entry.player.image} alt="" className="h-full w-full object-cover" />
          ) : (
            (number ?? '—')
          )}
        </div>
        <div className="min-w-[170px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-[13.5px] font-bold text-cream">{name}</div>
            <span className="rounded-md border border-[#4ea36a]/30 bg-[#4ea36a]/[0.12] px-2 py-1 font-mono text-[8.5px] uppercase tracking-[0.08em] text-[#4ea36a]">
              Cleared
            </span>
          </div>
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#8a817a]">
            {position}
            {number != null ? ` · #${number}` : ''}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Metric label="Role" value="Player" />
          <Metric label="Status" value="Approved" />
          <button
            type="button"
            disabled
            className="portal-roster-action border border-white/[0.1] bg-white/[0.04] px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-[#8a817a] disabled:opacity-70"
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
      className={`portal-roster-action border px-3 py-2 font-mono text-[9.5px] uppercase tracking-[0.08em] transition-colors ${active ? 'border-brand/40 bg-brand/[0.12] text-brandsoft' : 'border-transparent bg-transparent text-[#8a817a] hover:border-white/[0.1] hover:bg-white/[0.04]'}`}
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
