import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileWarning,
  Loader2,
  Search,
  Shield,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';

type Kind = 'PLAYER' | 'TEAM' | 'ROSTER';
const key = (kind: Kind, id: string) => `${kind}:${id}`;
const REQUEST_LABEL: Record<string, string> = {
  NEW: 'Add player',
  EDIT: 'Edit player',
  REMOVAL: 'Remove player',
  DROPOUT: 'Player dropped out',
};

type Queue = {
  players: any[];
  teams: any[];
  rosterProposals: any[];
  duplicates: { key: string; ids: string[] }[];
  page: number;
  total: number;
  totalPages: number;
};

const emptyQueue: Queue = { players: [], teams: [], rosterProposals: [], duplicates: [], page: 1, total: 0, totalPages: 1 };
const statusLabel: Record<string, string> = { PENDING: 'Pending', APPROVED: 'Approved', REJECTED: 'Rejected' };

function statusClass(status: string) {
  if (status === 'APPROVED') return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300';
  if (status === 'REJECTED') return 'border-rose-500/25 bg-rose-500/10 text-rose-300';
  return 'border-amber-500/25 bg-amber-500/10 text-amber-300';
}

function displayName(row: any, kind: Kind) {
  if (kind === 'TEAM') return row.name || 'Unnamed team';
  return `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'Unnamed player';
}

function TypeIcon({ kind }: { kind: Kind }) {
  if (kind === 'TEAM') return <Shield className="h-4 w-4" />;
  if (kind === 'ROSTER') return <ClipboardCheck className="h-4 w-4" />;
  return <UserRound className="h-4 w-4" />;
}

export default function RegistrationReviewQueue() {
  const [queue, setQueue] = useState<Queue>(emptyQueue);
  const [kind, setKind] = useState(() => typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('kind') || '');
  const [status, setStatus] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async (page = 1) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: '25', ...(kind && { kind }), ...(status && { status }), ...(search && { search }) });
    try {
      const response = await fetch(`/api/registration/review-queue?${params}`);
      if (!response.ok) throw new Error('Could not load registrations.');
      setQueue(await response.json());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [kind, status]);

  const players = queue.players;
  const teams = queue.teams;
  const rosterProposals = queue.rosterProposals;
  const visibleKeys = useMemo(() => [
    ...players.map((row) => key('PLAYER', row.id)),
    ...teams.map((row) => key('TEAM', row.id)),
    ...rosterProposals.map((row) => key('ROSTER', row.id)),
  ], [players, teams, rosterProposals]);
  const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every((item) => selected.includes(item));

  const toggle = (rowKind: Kind, id: string) => setSelected((value) => value.includes(key(rowKind, id)) ? value.filter((item) => item !== key(rowKind, id)) : [...value, key(rowKind, id)]);
  const toggleAll = () => setSelected((value) => allVisibleSelected ? value.filter((item) => !visibleKeys.includes(item)) : [...new Set([...value, ...visibleKeys])]);

  const review = async (keys: string[], action: 'APPROVE' | 'REJECT') => {
    setMessage(null);
    setError(null);
    const byKind = new Map<Kind, string[]>();
    for (const item of keys) {
      const [rowKind, id] = item.split(':') as [Kind, string];
      byKind.set(rowKind, [...(byKind.get(rowKind) ?? []), id]);
    }
    const results = await Promise.all([...byKind].map(([rowKind, ids]) => fetch('/api/registration/review-queue', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: rowKind, ids, action }),
    })));
    const failed = results.find((response) => !response.ok);
    if (failed) setError((await failed.json().catch(() => ({}))).error ?? 'Some items could not be updated.');
    else setMessage(`${keys.length} item${keys.length === 1 ? '' : 's'} ${action === 'APPROVE' ? 'approved' : 'rejected'}.`);
    setSelected((value) => value.filter((item) => !keys.includes(item)));
    void load(queue.page);
  };

  const exportUrl = `/api/registration/review-queue-export?kind=${kind}&status=${status}&search=${encodeURIComponent(search)}`;

  return (
    <section className="min-h-full bg-[var(--bg)] px-4 py-5 font-['Archivo'] text-[var(--tx)] sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div><div className="mb-1 font-['Space_Mono'] text-[10px] uppercase tracking-[0.18em] text-[var(--brandsoft)]">Personnel · Review queue</div><h1 className="font-['Anton'] text-[30px] uppercase leading-none tracking-[0.01em] text-[var(--tx)] sm:text-[36px]">Registrations</h1><p className="mt-2 max-w-[620px] text-[13px] leading-5 text-[var(--txm)]">Review team, player, and coach roster requests before they enter competition.</p></div>
          <a href={exportUrl} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3.5 text-[12px] font-bold text-[var(--txd)] no-underline transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)]"><Download className="h-4 w-4" /> Export CSV</a>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{[
          { label: 'Showing', value: queue.total, icon: ClipboardCheck }, { label: 'Players', value: players.length, icon: UserRound }, { label: 'Teams', value: teams.length, icon: UsersRound }, { label: 'Roster requests', value: rosterProposals.length, icon: Shield },
        ].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl border border-[var(--bord)] bg-[var(--surf)] px-4 py-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"><div className="mb-2 flex items-center justify-between text-[var(--txm)]"><span className="font-['Space_Mono'] text-[9px] uppercase tracking-[0.12em]">{label}</span><Icon className="h-4 w-4 text-[var(--brand)]" /></div><div className="font-['Anton'] text-[26px] leading-none text-[var(--tx)]">{value}</div></div>)}</div>

        <div className="mb-4 rounded-xl border border-[var(--bord)] bg-[var(--surf)] p-3 shadow-[0_8px_24px_rgba(0,0,0,0.08)] sm:p-4"><div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--txm)]" /><input className="h-10 w-full rounded-lg border border-[var(--bord)] bg-[var(--surf2)] pl-9 pr-3 text-[13px] text-[var(--tx)] outline-none placeholder:text-[var(--faint)] focus:border-[var(--brand)]" placeholder="Search name, email, or team" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && void load(1)} /></label>
          <div className="grid grid-cols-2 gap-2 sm:flex"><select aria-label="Registration type" className="h-10 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3 text-[12px] font-semibold text-[var(--txd)] outline-none focus:border-[var(--brand)]" value={kind} onChange={(event) => setKind(event.target.value)}><option value="">All types</option><option value="PLAYER">Players</option><option value="TEAM">Teams</option><option value="ROSTER">Coach roster proposals</option></select><select aria-label="Registration status" className="h-10 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3 text-[12px] font-semibold text-[var(--txd)] outline-none focus:border-[var(--brand)]" value={status} onChange={(event) => setStatus(event.target.value)}><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option></select><button type="button" className="col-span-2 h-10 rounded-lg bg-[var(--brand)] px-4 text-[12px] font-extrabold uppercase tracking-[0.04em] text-[var(--brandfg)] transition-colors hover:bg-[var(--brandlt)] sm:col-span-1" onClick={() => void load(1)}>Apply filters</button></div>
        </div></div>

        {(message || error) && <div role="status" className={`mb-4 flex items-center gap-2 rounded-lg border px-3.5 py-3 text-[13px] ${error ? 'border-rose-500/25 bg-rose-500/10 text-rose-200' : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'}`}>{error ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}{error || message}</div>}
        {queue.duplicates.length > 0 && <div role="alert" className="mb-4 rounded-xl border-2 border-[var(--warn-border)] bg-[var(--warn-bg)] p-4 shadow-[0_8px_24px_rgba(245,158,11,0.12)]"><div className="mb-2 flex flex-wrap items-center gap-2 text-[var(--warn-text)]"><FileWarning className="h-5 w-5" /><span className="font-['Anton'] text-[18px] uppercase leading-none tracking-[0.02em]">Possible duplicates need attention</span><span className="rounded-full bg-[var(--warn-border)] px-2 py-0.5 font-['Space_Mono'] text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--warn-text)]">{queue.duplicates.length} matches</span></div><p className="mb-3 text-[12px] leading-5 text-[var(--warn-muted)]">Review these matching emails or names before approving new registrations.</p><div className="flex flex-wrap gap-2">{queue.duplicates.map((duplicate) => <span key={duplicate.key} className="rounded-md border border-[var(--warn-chip-border)] bg-[var(--warn-chip-bg)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--warn-chip-text)]">{duplicate.key} · {duplicate.ids.length} records</span>)}</div></div>}
        {selected.length > 0 && <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--brand)]/25 bg-[var(--brand)]/[0.08] px-4 py-3"><span className="mr-auto font-['Space_Mono'] text-[11px] uppercase tracking-[0.08em] text-[var(--brandsoft)]">{selected.length} selected</span><button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 px-3 text-[11px] font-bold text-white hover:bg-emerald-500" onClick={() => void review(selected, 'APPROVE')}><Check className="h-3.5 w-3.5" /> Approve</button><button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-md border border-rose-500/30 px-3 text-[11px] font-bold text-rose-300 hover:bg-rose-500/10" onClick={() => void review(selected, 'REJECT')}><X className="h-3.5 w-3.5" /> Reject</button></div>}

        <div className="overflow-hidden rounded-xl border border-[var(--bord)] bg-[var(--surf)] shadow-[0_8px_24px_rgba(0,0,0,0.08)]"><div className="flex items-center justify-between border-b border-[var(--bord2)] px-4 py-3 sm:px-5"><div><h2 className="font-['Anton'] text-[19px] uppercase leading-none text-[var(--tx)]">Review queue</h2><p className="mt-1 text-[11px] text-[var(--txm)]">{queue.total} result{queue.total === 1 ? '' : 's'} · page {queue.page} of {queue.totalPages}</p></div>{loading && <Loader2 className="h-4 w-4 animate-spin text-[var(--brand)]" />}</div>
          <div className="overflow-x-auto"><table className="w-full min-w-[900px] border-collapse"><thead><tr className="border-b border-[var(--bord2)] bg-[var(--surf2)] text-left"><th className="w-12 px-4 py-3"><button type="button" aria-label={allVisibleSelected ? 'Clear selection' : 'Select all'} onClick={toggleAll} className={`flex h-[18px] w-[18px] items-center justify-center rounded border ${allVisibleSelected ? 'border-[var(--brand)] bg-[var(--brand)] text-[var(--brandfg)]' : 'border-[var(--bord)] text-transparent hover:border-[var(--brand)]'}`}><Check className="h-3 w-3" strokeWidth={3} /></button></th>{['Type', 'Applicant', 'Contact', 'Status', 'Team / proposer', 'Request', 'Actions'].map((heading) => <th key={heading} className="px-3 py-3 font-['Space_Mono'] text-[9px] uppercase tracking-[0.1em] text-[var(--txm)]">{heading}</th>)}</tr></thead><tbody>
            {players.map((row) => <tr key={`p-${row.id}`} className="border-b border-[var(--bord2)] transition-colors hover:bg-[var(--hov)]"><td className="px-4 py-3"><input aria-label={`Select ${displayName(row, 'PLAYER')}`} type="checkbox" checked={selected.includes(key('PLAYER', row.id))} onChange={() => toggle('PLAYER', row.id)} className="h-4 w-4 accent-[var(--brand)]" /></td><td className="px-3 py-3"><span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--txd)]"><TypeIcon kind="PLAYER" /> Player</span></td><td className="px-3 py-3 text-[13px] font-bold text-[var(--tx)]">{displayName(row, 'PLAYER')}</td><td className="px-3 py-3 text-[12px] text-[var(--txm)]">{row.email || '—'}</td><td className="px-3 py-3"><StatusBadge status={row.approved ? 'APPROVED' : status} /></td><td className="px-3 py-3 text-[12px] text-[var(--txm)]">{row.team?.name || '—'}</td><td className="px-3 py-3 text-[12px] text-[var(--txm)]">New player</td><td className="px-3 py-3">{!row.approved && <RowActions onApprove={() => void review([key('PLAYER', row.id)], 'APPROVE')} onReject={() => void review([key('PLAYER', row.id)], 'REJECT')} />}</td></tr>)}
            {teams.map((row) => <tr key={`t-${row.id}`} className="border-b border-[var(--bord2)] transition-colors hover:bg-[var(--hov)]"><td className="px-4 py-3"><input aria-label={`Select ${displayName(row, 'TEAM')}`} type="checkbox" checked={selected.includes(key('TEAM', row.id))} onChange={() => toggle('TEAM', row.id)} className="h-4 w-4 accent-[var(--brand)]" /></td><td className="px-3 py-3"><span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--txd)]"><TypeIcon kind="TEAM" /> Team</span></td><td className="px-3 py-3 text-[13px] font-bold text-[var(--tx)]">{displayName(row, 'TEAM')}</td><td className="px-3 py-3 text-[12px] text-[var(--txm)]">{row.contactEmail || '—'}</td><td className="px-3 py-3"><StatusBadge status={row.approved ? 'APPROVED' : status} /></td><td className="px-3 py-3 text-[12px] text-[var(--txm)]">{row.name || '—'}</td><td className="px-3 py-3 text-[12px] text-[var(--txm)]">New team</td><td className="px-3 py-3">{!row.approved && <RowActions onApprove={() => void review([key('TEAM', row.id)], 'APPROVE')} onReject={() => void review([key('TEAM', row.id)], 'REJECT')} />}</td></tr>)}
            {rosterProposals.map((row) => <tr key={`r-${row.id}`} className="border-b border-[var(--bord2)] transition-colors hover:bg-[var(--hov)]"><td className="px-4 py-3"><input aria-label={`Select roster request for ${displayName(row.player, 'PLAYER')}`} type="checkbox" checked={selected.includes(key('ROSTER', row.id))} onChange={() => toggle('ROSTER', row.id)} className="h-4 w-4 accent-[var(--brand)]" /></td><td className="px-3 py-3"><span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--txd)]"><TypeIcon kind="ROSTER" /> Roster</span></td><td className="px-3 py-3 text-[13px] font-bold text-[var(--tx)]">{displayName(row.player, 'PLAYER')}</td><td className="px-3 py-3 text-[12px] text-[var(--txm)]">{row.player?.email || '—'}</td><td className="px-3 py-3"><StatusBadge status={row.status} /></td><td className="px-3 py-3 text-[12px] text-[var(--txm)]">{row.team?.name || '—'} · {row.proposedBy?.name || row.proposedBy?.email || 'Unknown coach'}</td><td className="max-w-[220px] px-3 py-3 text-[12px] text-[var(--txm)]"><strong className="text-[var(--txd)]">{REQUEST_LABEL[row.requestType] ?? 'Roster change'}</strong>{row.note && <div className="mt-0.5 truncate">{row.note}</div>}</td><td className="px-3 py-3"><RowActions onApprove={() => void review([key('ROSTER', row.id)], 'APPROVE')} onReject={() => void review([key('ROSTER', row.id)], 'REJECT')} /></td></tr>)}
          </tbody></table>{!loading && !players.length && !teams.length && !rosterProposals.length && <div className="flex flex-col items-center gap-2 px-6 py-16 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surf2)] text-[var(--txm)]"><ClipboardCheck className="h-5 w-5" /></span><div className="font-['Anton'] text-[20px] uppercase text-[var(--tx)]">No registrations found</div><p className="max-w-[320px] text-[13px] text-[var(--txm)]">Try a different status, type, or search term.</p></div>}{error && <div className="flex items-center justify-center gap-2 px-6 py-16 text-[13px] text-rose-300"><AlertCircle className="h-4 w-4" /> {error}</div>}</div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--bord2)] px-4 py-3 sm:px-5"><span className="font-['Space_Mono'] text-[10px] uppercase tracking-[0.08em] text-[var(--txm)]">Page {queue.page} of {queue.totalPages}</span><div className="flex gap-2"><button type="button" disabled={queue.page <= 1 || loading} onClick={() => void load(queue.page - 1)} className="inline-flex h-8 items-center gap-1 rounded-md border border-[var(--bord)] px-3 text-[11px] font-bold text-[var(--txd)] disabled:cursor-not-allowed disabled:opacity-40 hover:border-[var(--brand)]"><ChevronLeft className="h-3.5 w-3.5" /> Previous</button><button type="button" disabled={queue.page >= queue.totalPages || loading} onClick={() => void load(queue.page + 1)} className="inline-flex h-8 items-center gap-1 rounded-md border border-[var(--bord)] px-3 text-[11px] font-bold text-[var(--txd)] disabled:cursor-not-allowed disabled:opacity-40 hover:border-[var(--brand)]">Next <ChevronRight className="h-3.5 w-3.5" /></button></div></div>
        </div>

      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) { return <span className={`inline-flex rounded-full border px-2 py-1 font-['Space_Mono'] text-[9px] uppercase tracking-[0.06em] ${statusClass(status)}`}>{statusLabel[status] || status}</span>; }
function RowActions({ onApprove, onReject }: { onApprove: () => void; onReject: () => void }) { return <div className="flex items-center gap-1.5"><button type="button" aria-label="Approve registration" onClick={onApprove} className="inline-flex h-7 items-center gap-1 rounded-md bg-emerald-600/90 px-2 text-[10px] font-bold text-white hover:bg-emerald-500"><Check className="h-3 w-3" /> Approve</button><button type="button" aria-label="Reject registration" onClick={onReject} className="inline-flex h-7 items-center gap-1 rounded-md border border-rose-500/25 px-2 text-[10px] font-bold text-rose-300 hover:bg-rose-500/10"><X className="h-3 w-3" /> Reject</button></div>; }
