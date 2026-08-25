import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  CalendarClock,
  ChevronRight,
  Mail,
  MoreVertical,
  Pencil,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { staffApi } from '@/features/staff/data/datasources/staff-api';
import type {
  StaffAssignmentHistoryRecord,
  StaffTransferRecord,
} from '@/features/staff/data/datasources/staff-history-api';
import { staffHistoryApi } from '@/features/staff/data/datasources/staff-history-api';
import { STAFF_ROLES, staffRoleLabel } from '@/features/staff/domain/entities/staff-management';
import type { StaffRole } from '@prisma/client';

type Tab = 'overview' | 'history' | 'matches' | 'account' | 'activity';
type PortalUser = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  activatedAt?: string | null;
};
type StaffFixture = {
  id: string;
  date: string;
  status?: string | null;
  team1?: { name?: string | null } | null;
  team2?: { name?: string | null } | null;
  team1Name?: string | null;
  team2Name?: string | null;
  team1Score?: number | null;
  team2Score?: number | null;
  league?: { name?: string | null } | null;
};
type StaffSession = { id: string; createdAt: string; lastSeenAt?: string | null; expiresAt: string };
type StaffAuditEvent = { id: string; action: string; createdAt: string; performedBy: string; actor?: { name?: string | null; email?: string | null } | null; metadata?: unknown };
type StaffMatchSheet = { id: string; capacity: string; status: string; team: { id: string; name: string }; match: StaffFixture };
const formatDate = (value?: string | Date | null) =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(value))
    : 'Not recorded';
const initials = (first: string, last: string) =>
  `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase() || '?';

export default function StaffDetailPage({ staffId }: { staffId: string }) {
  const [record, setRecord] = useState<Awaited<ReturnType<typeof staffApi.get>> | null>(null);
  const [assignments, setAssignments] = useState<StaffAssignmentHistoryRecord[]>([]);
  const [transfers, setTransfers] = useState<StaffTransferRecord[]>([]);
  const [portal, setPortal] = useState<PortalUser | null>(null);
  const [fixtures, setFixtures] = useState<StaffFixture[]>([]);
  const [sessions, setSessions] = useState<StaffSession[]>([]);
  const [activityEvents, setActivityEvents] = useState<StaffAuditEvent[]>([]);
  const [matchSheets, setMatchSheets] = useState<StaffMatchSheet[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'mens' | 'womens' | 'head'>('all');
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window === 'undefined') return 'overview';
    const requested = new URLSearchParams(window.location.search).get('tab');
    return requested === 'history' || requested === 'matches' || requested === 'account' || requested === 'activity'
      ? requested
      : 'overview';
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([
      staffApi.get(staffId),
      fetch(`/api/staff/${staffId}/assignments?all=1`, { credentials: 'same-origin' }).then((r) =>
        r.ok ? r.json() : []
      ),
      fetch(`/api/staff/${staffId}/transfers`, { credentials: 'same-origin' }).then((r) =>
        r.ok ? r.json() : []
      ),
      fetch(`/api/staff/${staffId}/portal`, { credentials: 'same-origin' }).then((r) =>
        r.ok ? r.json() : {}
      ),
      fetch(`/api/staff/${staffId}/sessions`, { credentials: 'same-origin' }).then((r) => r.ok ? r.json() : { sessions: [] }),
      fetch(`/api/staff/${staffId}/activity`, { credentials: 'same-origin' }).then((r) => r.ok ? r.json() : { events: [] }),
      fetch(`/api/staff/${staffId}/matches`, { credentials: 'same-origin' }).then((r) => r.ok ? r.json() : { matches: [] }),
    ])
      .then(([staff, history, events, account, sessionData, activityData, matchData]) => {
        setRecord(staff);
        setAssignments(history);
        setTransfers(events);
        setPortal((account as { user?: PortalUser | null }).user ?? null);
        setSessions(sessionData.sessions ?? []);
        setActivityEvents(activityData.events ?? []);
        setMatchSheets(matchData.matches ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Unable to load Staff profile'))
      .finally(() => setLoading(false));
  }, [staffId]);
  const active = useMemo(() => { const now = new Date(); return (record?.teams ?? []).filter((item) => item.effectiveFrom <= now && (!item.effectiveTo || item.effectiveTo > now)); }, [record]);
  useEffect(() => {
    const teamIds = active.map((item) => item.teamId).filter(Boolean);
    if (!teamIds.length) {
      setFixtures([]);
      return;
    }
    Promise.all(teamIds.map((teamId) => fetch(`/api/matches?teamId=${encodeURIComponent(teamId)}&limit=50&sort=date-desc`, { credentials: 'same-origin' }).then((response) => response.ok ? response.json() : [])))
      .then((groups: StaffFixture[][]) => setFixtures(Array.from(new Map(groups.flat().map((match) => [match.id, match])).values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())))
      .catch(() => setFixtures([]));
  }, [active]);
  // Keep closed assignments in the response so a transfer never erases the
  // outgoing club from the staff member's historical record.
  const historyRows = assignments;
  if (loading)
    return (
      <Shell>
        <div className="animate-pulse space-y-4">
          <div className="h-52 rounded-2xl bg-[var(--surf)]" />
          <div className="h-80 rounded-2xl bg-[var(--surf)]" />
        </div>
      </Shell>
    );
  if (!record || error)
    return (
      <Shell>
        <div className="rounded-xl border border-[var(--brand)]/40 bg-[var(--brand)]/10 p-4 text-sm text-[var(--brand)]">
          {error || 'Staff member not found'}
        </div>
      </Shell>
    );
  const name = `${record.firstName} ${record.lastName}`.trim();
  const licenceDays = record.licenseExpiresAt
    ? Math.ceil((new Date(record.licenseExpiresAt).getTime() - Date.now()) / 86400000)
    : null;
  const portalStatus = !portal ? 'None' : portal.activatedAt ? 'Active' : 'Invited';
  const tabs: Array<[Tab, string, number?]> = [
    ['overview', 'Overview'],
    ['history', 'Team history', assignments.length],
    ['matches', 'Matches'],
    ['account', 'Account'],
    ['activity', 'Activity'],
  ];
  const selectTab = (next: Tab) => {
    setTab(next);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', next);
      window.history.replaceState({}, '', url);
    }
  };
  return (
    <Shell>
      <div className="space-y-5">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--txm)]">
          <a href="/admin/staff" className="no-underline hover:text-[var(--brand)]">
            Staff
          </a>
          <ChevronRight className="h-3 w-3" />
          <span className="truncate text-[var(--txd)]">{name}</span>
        </div>
        <Hero
          record={record}
          name={name}
          activeCount={active.length}
          licenceDays={licenceDays}
          portal={portal}
          primaryTeam={active[0]?.team.name}
          primaryRole={active[0] ? staffRoleLabel(active[0].role) : undefined}
          menuOpen={menuOpen}
          onToggleMenu={() => setMenuOpen((value) => !value)}
          onCloseMenu={() => setMenuOpen(false)}
          onOpenTransfer={() => { setMenuOpen(false); setTransferOpen(true); }}
        />
        <div className="staff-detail-tabs mb-5 flex flex-wrap gap-1 overflow-x-auto border-b border-[var(--bord2)]">
          {tabs.map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => selectTab(id)}
              className={`shrink-0 border-b-2 px-3 py-3 text-[12px] font-semibold transition-colors ${tab === id ? 'border-[var(--brand)] text-[var(--tx)]' : 'border-transparent text-[var(--txm)] hover:border-[var(--bord)] hover:text-[var(--tx)]'}`}
            >
              {label}
              {count !== undefined && (
                <span className="ml-2 rounded-full bg-[var(--surf2)] px-1.5 py-0.5 font-mono text-[9px]">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
        {tab === 'overview' && (
          <Overview record={record} active={active} />
        )}
        {tab === 'history' && <History assignments={historyRows} transfers={transfers} filter={historyFilter} onFilterChange={setHistoryFilter} onOpenTransfer={() => setTransferOpen(true)} />}
        {tab === 'matches' && (
          <Matches fixtures={fixtures} matchSheets={matchSheets} />
        )}
        {tab === 'account' && <Account portal={portal} status={portalStatus} record={record} sessions={sessions} />}
        {tab === 'activity' && <Activity record={record} events={activityEvents} />}
      </div>
      {transferOpen && <TransferModal staffId={staffId} name={name} assignments={active} onClose={() => setTransferOpen(false)} onSaved={() => window.location.reload()} />}
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="staff-detail-page min-h-full bg-[var(--bg)] font-body text-[var(--tx)]">
      <div className="mx-auto w-full max-w-[1320px]">{children}</div>
    </div>
  );
}
function Hero({
  record,
  name,
  activeCount,
  licenceDays,
  portal,
  primaryTeam,
  primaryRole,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onOpenTransfer,
}: {
  record: Awaited<ReturnType<typeof staffApi.get>>;
  name: string;
  activeCount: number;
  licenceDays: number | null;
  portal: PortalUser | null;
  primaryTeam?: string;
  primaryRole?: string;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onOpenTransfer: () => void;
}) {
  const editHref = `/admin/staff/${record.id}?mode=edit`;
  const exportProfile = () => {
    const csv = [['Field', 'Value'], ['Name', name], ['Email', record.email || ''], ['Role', primaryRole || staffRoleLabel(record.role)], ['Teams', primaryTeam || ''], ['Status', record.active === false ? 'Inactive' : 'Active']].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${record.slug || record.id}-staff-profile.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onCloseMenu();
  };
  const runSecurityAction = async (action: 'force-2fa' | 'deactivate') => {
    if (action === 'deactivate' && !window.confirm(`Deactivate ${name}? Portal access will be revoked and history will be preserved.`)) return;
    onCloseMenu();
    const response = await fetch(`/api/staff/${record.id}/security`, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      window.alert(body.error || 'Unable to complete this action.');
      return;
    }
    window.location.reload();
  };
  const actionsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!actionsRef.current?.contains(event.target as Node)) onCloseMenu();
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [menuOpen, onCloseMenu]);
  return (
    <>
      <section className="mb-0 overflow-visible rounded-2xl border border-[var(--bord)] bg-[var(--surf)]">
        <div className="h-[3px] bg-gradient-to-r from-[var(--brand)] via-[var(--brandsoft)] to-transparent" />
        <div className="flex flex-wrap items-start gap-5 px-5 py-5">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--brand)]/10 font-display text-[28px] text-[var(--brand)]">
              {record.image ? (
                <img src={record.image} alt={name} className="h-full w-full object-cover" />
              ) : (
                initials(record.firstName, record.lastName)
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-[30px] uppercase leading-none">{name}</h1>
                <span className="rounded-md bg-[var(--brand)]/10 px-2.5 py-1 text-[11px] font-bold text-[var(--brandsoft)]">
                  {staffRoleLabel(record.role)}
                </span>
                <span className="rounded-full border border-[var(--bord)] bg-[var(--surf2)] px-2.5 py-1 font-mono text-[9px] uppercase text-[var(--txm)]">
                  {record.active === false ? 'Inactive' : 'Active'}
                </span>
              </div>
              <p className="mt-2 text-[13px] text-[var(--txm)]">
                {record.tagline || 'Staff profile and operational record'}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-[var(--txd)]">
                {primaryTeam ? (
                  <span className="inline-flex items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-2.5 py-1.5 font-bold">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-[var(--brand)]/15 font-mono text-[9px] text-[var(--brandsoft)]">
                      {primaryTeam
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join('')
                        .toUpperCase()}
                    </span>
                    {primaryTeam}
                    <span className="font-mono text-[9px] uppercase text-[var(--txm)]">
                      {primaryRole}
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-2.5 py-1.5 font-mono text-[9px] uppercase text-[var(--txm)]">
                    <Users className="h-3.5 w-3.5" />
                    No active assignment
                  </span>
                )}
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--txm)]">
                  {activeCount} active {activeCount === 1 ? 'assignment' : 'assignments'}
                </span>
              </div>
            </div>
          </div>
          <div ref={actionsRef} className="relative flex shrink-0 flex-col items-end gap-2.5">
            <div className="flex flex-wrap items-center justify-end gap-2">
            {portal ? (
              <a
                href={`/admin/users/${portal.id}`}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-2.5 text-[12px] font-bold text-[var(--txd)] no-underline"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Open user record
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-2.5 text-[12px] font-bold text-[var(--txm)]">
                <span className="h-2 w-2 rounded-full bg-[var(--txm)]" />
                No user record
              </span>
            )}
            <a
              href={`/admin/staff/${record.id}?mode=edit`}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2.5 text-[12px] font-black text-white no-underline"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </a>
            <button
              type="button"
              aria-label="More staff actions"
              aria-expanded={menuOpen}
              onClick={onToggleMenu}
              className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-[var(--bord)] bg-[var(--surf2)] text-[var(--txd)]"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                <button type="button" aria-label="Close actions" onClick={onCloseMenu} className="fixed inset-0 z-10 cursor-default" />
                <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-[230px] overflow-hidden rounded-xl border border-[var(--bord)] bg-[var(--surf)] py-1 shadow-[0_14px_40px_rgba(0,0,0,0.45)]">
                  <a href={`${editHref}#assignments`} onClick={onCloseMenu} className="block w-full border-0 bg-transparent px-3.5 py-2.5 text-left font-body text-[12.5px] font-semibold text-[var(--tx)] no-underline hover:bg-[var(--hov)]">Assign another team</a>
                  <button type="button" onClick={onOpenTransfer} className="block w-full border-0 bg-transparent px-3.5 py-2.5 text-left font-body text-[12.5px] font-semibold text-[var(--tx)] hover:bg-[var(--hov)]">Transfer to another club…</button>
                  {record.email ? <a href={`/admin/messages?compose=1&to=${encodeURIComponent(record.email)}&name=${encodeURIComponent(name)}`} onClick={onCloseMenu} className="block w-full border-0 bg-transparent px-3.5 py-2.5 text-left font-body text-[12.5px] font-semibold text-[var(--tx)] no-underline hover:bg-[var(--hov)]">Send a message</a> : <button type="button" disabled className="block w-full border-0 bg-transparent px-3.5 py-2.5 text-left font-body text-[12.5px] font-semibold text-[var(--faint)]">Send a message</button>}
                  <button type="button" onClick={() => void runSecurityAction('force-2fa')} className="block w-full border-0 bg-transparent px-3.5 py-2.5 text-left font-body text-[12.5px] font-semibold text-[var(--tx)] hover:bg-[var(--hov)]">Force 2FA re-enrolment</button>
                  <button type="button" onClick={exportProfile} className="block w-full border-0 bg-transparent px-3.5 py-2.5 text-left font-body text-[12.5px] font-semibold text-[var(--tx)] hover:bg-[var(--hov)]">Export profile (CSV)</button>
                  <button type="button" onClick={() => void runSecurityAction('deactivate')} className="block w-full border-0 bg-transparent px-3.5 py-2.5 text-left font-body text-[12.5px] font-bold text-[var(--brand)] hover:bg-[var(--hov)]">Deactivate staff member</button>
                </div>
              </>
            )}
            </div>
            <a
              href={record.slug ? `/staff/${record.slug}` : '/staff'}
              className="basis-full text-right font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--txd)] no-underline hover:text-[var(--brand)]"
            >
              View public profile →
            </a>
          </div>
        </div>
        <div className="grid grid-cols-5 border-t border-[var(--bord2)] max-[1080px]:grid-cols-3 max-[640px]:grid-cols-2">
          <Kpi value="—" label="Record as head coach" sub="Career record unavailable" />
          <Kpi value="—" label="Matches on a bench" sub="Across all capacities" />
          <Kpi value={String(activeCount || 0)} label="League seasons" sub="Current assignments" />
          <Kpi value={String(activeCount || 0)} label="Clubs served" sub="Active clubs" />
          <Kpi value={portal ? (portal.activatedAt ? 'Active' : 'Invited') : 'None'} label="Portal access" sub="Account status" />
        </div>
      </section>
      {licenceDays !== null && licenceDays <= 60 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-[12px] text-amber-300">
          <CalendarClock className="h-4 w-4" />
          Coaching licence status needs attention:{' '}
          {licenceDays < 0 ? 'expired' : `${licenceDays} days remaining`}.
        </div>
      )}
    </>
  );
}
function Overview({
  record,
  active,
}: {
  record: Awaited<ReturnType<typeof staffApi.get>>;
  active: Awaited<ReturnType<typeof staffApi.get>>['teams'];
}) {
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px] max-[1080px]:grid-cols-1">
      <div className="grid gap-4">
        <Card title="Biography" subtitle="">
          <p className="max-w-[640px] whitespace-pre-wrap text-[13.5px] leading-relaxed text-[var(--txd)]">
            {record.bio || 'No biography recorded.'}
          </p>
        </Card>
        <section className="overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)]">
          <div className="flex flex-wrap items-center gap-3 border-b border-[var(--bord2)] px-5 py-3.5">
            <h2 className="flex-1 font-display text-[16px] uppercase">This season</h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--faint)]">
              2026 Season · EBL
            </span>
          </div>
          <div className="grid gap-3 px-5 py-5">
            {active.length ? active.map((item) => (
              <div key={item.id} className="rounded-xl border border-[var(--bord)] bg-[var(--surf2)] px-4 py-3.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded font-mono text-[9px] font-bold text-[var(--brandsoft)] bg-[var(--brand)]/10">
                    {item.team.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
                  </span>
                  <span className="text-[13.5px] font-bold">{item.team.name}</span>
                  <span className="rounded-md bg-[var(--brand)]/10 px-2 py-1 font-mono text-[9px] uppercase text-[var(--brandsoft)]">
                    {staffRoleLabel(item.role)}
                  </span>
                  <span className="ml-auto font-mono text-[11px] text-[var(--txm)]">
                    Since {formatDate(item.effectiveFrom)}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-3 max-[720px]:grid-cols-2">
                  {[
                    ['Record', '—'],
                    ['Played', '—'],
                    ['Conference', '—'],
                    ['Position', '—'],
                  ].map(([label, value]) => (
                    <div key={label}><div className="font-display text-[19px] leading-none">{value}</div><div className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--txm)]">{label}</div></div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--bord2)] pt-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--faint)]">Next</span>
                  <span className="text-[12px] font-semibold text-[var(--txd)]">Upcoming fixtures will appear here</span>
                  <a href="/admin/matches" className="ml-auto font-mono text-[10px] uppercase tracking-[0.1em] no-underline">Fixtures →</a>
                </div>
              </div>
            )) : <Empty text="No active team assignments." />}
          </div>
        </section>
        <Card title="Internal note" subtitle="Never published. Visible to admins only.">
          <p className="text-[13px] leading-relaxed text-[var(--txd)]">{record.internalNote || 'No internal notes recorded.'}</p>
        </Card>
      </div>
      <aside className="grid gap-4">
        <section className="overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)]">
          <div className="flex items-center gap-2.5 border-b border-[var(--bord2)] px-4 py-3"><span className="flex-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-[var(--faint)]">Contact</span><span className="rounded-md border border-[var(--bord)] bg-[var(--surf2)] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--txm)]">Private</span></div>
          <div className="grid gap-3 px-4 py-4">
            {[
              ['Email', record.email || 'Not on file'], ['Phone', record.phone || 'Not on file'],
              ['Alternate phone', record.phoneSecondary || 'Not on file'], ['Emergency contact', record.nextOfKin || 'Not on file'],
            ].map(([label, value]) => <div key={label}><div className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--faint)]">{label}</div><div className="mt-1 truncate text-[12.5px] font-semibold">{value}</div></div>)}
          </div>
        </section>
        <section className="overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)]">
          <div className="border-b border-[var(--bord2)] px-4 py-3"><span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-[var(--faint)]">Credentials</span></div>
          <div className="grid gap-3 px-4 py-4">
            {[
              ['Coaching licence', record.licenseNumber || 'Not on file', record.licenseExpiresAt ? `Expires ${formatDate(record.licenseExpiresAt)}` : 'No expiry recorded'],
              ['Safeguarding check', record.safeguardingStatus || 'Not recorded', 'Review in the edit form'],
              ['National ID', record.idNumber ? 'On file · protected' : 'Not on file', 'Sensitive field'],
            ].map(([label, value, note]) => <div key={label} className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="text-[12.5px] font-semibold">{label}</div><div className="mt-0.5 font-mono text-[10.5px] text-[var(--txm)]">{note}</div></div><span className="shrink-0 rounded-full bg-[var(--brand)]/10 px-2 py-1 font-mono text-[9px] text-[var(--brandsoft)]">{value}</span></div>)}
          </div>
        </section>
        <section className="overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)]">
          <div className="border-b border-[var(--bord2)] px-4 py-3"><span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-[var(--faint)]">Record</span></div>
          <div className="grid gap-2 px-4 py-4">
            <Meta label="Staff ID" value={record.id} />
            <Meta label="Created" value={formatDate(record.createdAt)} />
            <Meta label="Last edited" value={formatDate(record.updatedAt)} />
            <Meta label="Public profile" value={record.slug ? `/staff/${record.slug}` : 'Not published'} />
          </div>
        </section>
      </aside>
    </div>
  );
}
function History({
  assignments,
  transfers,
  filter,
  onFilterChange,
  onOpenTransfer,
}: {
  assignments: StaffAssignmentHistoryRecord[];
  transfers: StaffTransferRecord[];
  filter: 'all' | 'mens' | 'womens' | 'head';
  onFilterChange: (filter: 'all' | 'mens' | 'womens' | 'head') => void;
  onOpenTransfer: () => void;
}) {
  const visibleAssignments = assignments.filter((item) => {
    const leagueName = item.leagueSeason?.league?.name ?? '';
    if (filter === 'mens') return !/women/i.test(leagueName);
    if (filter === 'womens') return /women/i.test(leagueName);
    if (filter === 'head') return item.role === 'COACH';
    return true;
  });
  const historyGroups = Array.from(new Map(visibleAssignments.map((item) => {
    const season = item.leagueSeason?.season?.name || (item.effectiveFrom ? `${new Date(item.effectiveFrom).getFullYear()} Season` : 'Season unavailable');
    return [season, visibleAssignments.filter((candidate) => (candidate.leagueSeason?.season?.name || (candidate.effectiveFrom ? `${new Date(candidate.effectiveFrom).getFullYear()} Season` : 'Season unavailable')) === season)];
  })).entries());
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--bord)] bg-[var(--surf)] px-5 py-3.5">
        <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--faint)]">Filter</span>
        {([['all', 'All'], ['mens', 'Men’s'], ['womens', 'Women’s'], ['head', 'Head coach only']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => onFilterChange(value)} className={`rounded-md px-2.5 py-1.5 font-body text-[11px] font-semibold ${filter === value ? 'border border-[var(--bord)] bg-[var(--surf2)] text-[var(--tx)]' : 'text-[var(--txm)] hover:bg-[var(--hov)]'}`}>{label}</button>)}
        <span className="ml-auto font-mono text-[10px] text-[var(--faint)]">{visibleAssignments.length} assignments across recorded seasons</span>
        <button type="button" onClick={onOpenTransfer} className="flex items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3 py-2 font-body text-[11.5px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]">Transfer to another club…</button>
      </div>
      {transfers.length || visibleAssignments.length ? (
        <div className="grid gap-4 p-5">
          {historyGroups.map(([season, rows]) => <section key={season} className="overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)]"><div className="flex flex-wrap items-center gap-3 border-b border-[var(--bord2)] bg-[var(--surf2)] px-5 py-3"><span className="font-display text-[15px] uppercase">{season}</span><span className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--txm)]"><span className="h-1.5 w-1.5 rounded-full bg-sky-400" />{rows[0]?.leagueSeason?.league?.name || 'League unavailable'}</span><span className="rounded-full bg-emerald-500/10 px-2 py-1 font-mono text-[9px] uppercase text-emerald-500">{rows.some((row) => !row.effectiveTo) ? 'In progress' : 'Completed'}</span><span className="ml-auto font-mono text-[10.5px] text-[var(--faint)]">{rows.map((row) => formatDate(row.effectiveFrom)).join(' · ')}</span></div><div className="grid gap-0">{rows.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-4 border-b border-[var(--bord2)] px-5 py-3.5 last:border-b-0"><span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md bg-[var(--brand)]/10 font-mono text-[10px] font-bold text-[var(--brandsoft)]">{item.team.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span><div className="min-w-[180px] flex-1"><a href={`/admin/teams/view/${item.team.id}`} className="font-body text-[13.5px] font-bold text-[var(--tx)] no-underline hover:text-[var(--brand)]">{item.team.name}</a><div className="mt-[3px] flex flex-wrap items-center gap-2 font-mono text-[10.5px] text-[var(--txm)]"><span>{staffRoleLabel(item.role)}</span><span className="text-[var(--faint)]">·</span><span>{formatDate(item.effectiveFrom)} – {item.effectiveTo ? formatDate(item.effectiveTo) : 'present'}</span></div></div><div className="flex items-center gap-5"><div className="text-right"><div className="font-display text-[18px] text-[var(--faint)]">—</div><div className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--txm)]">Record</div></div><div className="text-right"><div className="font-display text-[18px]">—</div><div className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--txm)]">Matches</div></div><div className="text-right max-[720px]:hidden"><div className="font-display text-[18px]">—</div><div className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--txm)]">Finish</div></div></div><span className="rounded-full border border-[var(--bord)] bg-[var(--surf2)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--txm)]">{item.effectiveTo ? 'Past' : 'Current'}</span></div>)}</div></section>)}
        </div>
      ) : (
        <div className="p-5"><Empty text="No durable assignment history recorded yet." /></div>
      )}
      <div className="rounded-2xl border border-[var(--bord)] bg-[var(--surf)] px-5 py-4">
        <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-[var(--faint)]">Career totals</div>
        <div className="mt-3 grid grid-cols-5 gap-4 max-[900px]:grid-cols-3 max-[560px]:grid-cols-2">
        {['Record as head coach', 'Win rate', 'Matches', 'Clubs', 'Seasons'].map((label) => <div key={label} className="border-r border-[var(--bord2)] px-5 py-4 last:border-r-0"><div className="font-display text-[22px]">—</div><div className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--txm)]">{label}</div></div>)}
        </div>
      </div>
    </div>
  );
}

type TransferTeam = { id: string; name: string; logo?: string | null };
type TransferSeason = { id: string; name: string; startDate?: string; endDate?: string; leagueSeasons?: Array<{ id: string; status?: string; league?: { name?: string | null } | null }> };
const transferControlClass = 'mt-0 h-8 w-full rounded-md border border-[var(--bord)] bg-[var(--surf2)] px-2 text-[12px] font-body font-bold text-[var(--tx)] outline-none transition-colors [color-scheme:dark] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]';

function TransferModal({
  staffId,
  name,
  assignments,
  onClose,
  onSaved,
}: {
  staffId: string;
  name: string;
  assignments: Array<Awaited<ReturnType<typeof staffApi.get>>['teams'][number]>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const current = assignments[0];
  const [fromTeamStaffId, setFromTeamStaffId] = useState(current?.id ?? '');
  const [toTeamId, setToTeamId] = useState('');
  const [joiningSearch, setJoiningSearch] = useState('');
  const [joiningOpen, setJoiningOpen] = useState(false);
  const [role, setRole] = useState<StaffRole>(current?.role ?? 'COACH');
  const [effectiveFrom, setEffectiveFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [leagueSeasonId, setLeagueSeasonId] = useState(current?.leagueSeasonId ?? '');
  const [reason, setReason] = useState('');
  const [teams, setTeams] = useState<TransferTeam[]>([]);
  const [seasons, setSeasons] = useState<TransferSeason[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const selectedAssignment = assignments.find((item) => item.id === fromTeamStaffId) ?? current;
  const currentTeamIds = new Set(assignments.map((item) => item.teamId));
  const availableTeams = teams.filter((team) => !currentTeamIds.has(team.id));
  const filteredTeams = availableTeams.filter((team) => team.name.toLowerCase().includes(joiningSearch.trim().toLowerCase()));
  const activeLeagueSeasons = seasons.flatMap((season) => (season.leagueSeasons ?? []).filter((edition) => ['REGISTRATION', 'SCHEDULED', 'ACTIVE', 'PLAYOFFS'].includes(String(edition.status).toUpperCase())).map((edition) => ({ ...edition, seasonName: season.name })));
  const targetTeam = teams.find((team) => team.id === toTeamId);

  useEffect(() => {
    Promise.all([
      fetch('/api/teams?approved=true', { credentials: 'same-origin' }).then((response) => response.ok ? response.json() : []),
      fetch('/api/seasons?activeOnly=true', { credentials: 'same-origin' }).then((response) => response.ok ? response.json() : []),
    ]).then(([teamRows, seasonRows]) => {
      setTeams(Array.isArray(teamRows) ? teamRows : []);
      setSeasons(Array.isArray(seasonRows) ? seasonRows : []);
    }).catch(() => setError('Unable to load transfer options.'));
  }, []);

  const submit = async () => {
    if (!fromTeamStaffId || !toTeamId || !effectiveFrom) {
      setError('Choose the outgoing assignment, destination club, and effective date.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await staffHistoryApi.transfer(staffId, {
        fromTeamStaffId,
        toTeamId,
        role,
        effectiveFrom,
        leagueSeasonId: leagueSeasonId || undefined,
        transferReason: reason.trim() || undefined,
      });
      onSaved();
    } catch (transferError) {
      setError(transferError instanceof Error ? transferError.message : 'Unable to complete the transfer.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="eb-scroll relative max-h-full w-full max-w-[600px] overflow-y-auto rounded-2xl border border-[var(--bord)] bg-[var(--surf)] shadow-[0_28px_80px_rgba(0,0,0,0.55)]" role="dialog" aria-modal="true" aria-labelledby="staff-transfer-title">
        <div className="flex items-start gap-3 border-b border-[var(--bord2)] px-5 py-4">
          <div className="flex-1"><div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-[var(--brandsoft)]">Team transfer</div><h2 id="staff-transfer-title" className="mt-0.5 font-display text-[20px] uppercase leading-none">Move {name}</h2></div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[var(--bord)] bg-[var(--surf2)] font-mono text-[12px] text-[var(--txm)] hover:border-[var(--brand)] hover:text-[var(--brand)]" aria-label="Close transfer modal">✕</button>
        </div>
        <div className="grid gap-4 px-5 py-5">
          <TransferField label="Leaving" hint={selectedAssignment ? `Record for this spell: — over — matches — kept in the history once closed.` : 'Select the assignment being closed.'}><select className={transferControlClass} value={fromTeamStaffId} onChange={(event) => { const next = assignments.find((item) => item.id === event.target.value); setFromTeamStaffId(event.target.value); if (next) { setRole(next.role); setLeagueSeasonId(next.leagueSeasonId ?? ''); } }}><option value="">Select assignment</option>{assignments.map((assignment) => <option key={assignment.id} value={assignment.id}>{assignment.team.name} · {staffRoleLabel(assignment.role)}</option>)}</select></TransferField>
          <div className="flex items-center gap-3"><span className="h-px flex-1 bg-[var(--bord2)]" /><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">transfers to</span><span className="h-px flex-1 bg-[var(--bord2)]" /></div>
          <div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
            <TransferField label="Joining"><div className="relative"><input className={transferControlClass} role="combobox" aria-expanded={joiningOpen} aria-controls="staff-transfer-team-options" aria-autocomplete="list" value={joiningSearch || targetTeam?.name || ''} onFocus={() => setJoiningOpen(true)} onBlur={() => window.setTimeout(() => setJoiningOpen(false), 100)} onChange={(event) => { setJoiningSearch(event.target.value); setToTeamId(''); setJoiningOpen(true); }} onKeyDown={(event) => { if (event.key === 'Escape') setJoiningOpen(false); if (event.key === 'Enter' && filteredTeams[0]) { event.preventDefault(); setToTeamId(filteredTeams[0].id); setJoiningSearch(filteredTeams[0].name); setJoiningOpen(false); } }} placeholder="Pick a club…" disabled={!availableTeams.length} />{joiningOpen && availableTeams.length > 0 && <div id="staff-transfer-team-options" role="listbox" className="absolute left-0 right-0 top-full z-10 mt-1 max-h-44 overflow-y-auto rounded-md border border-[var(--bord)] bg-[var(--surf2)] p-1 shadow-[0_12px_28px_rgba(0,0,0,0.35)]">{filteredTeams.length ? filteredTeams.map((team) => <button type="button" role="option" aria-selected={toTeamId === team.id} key={team.id} onMouseDown={(event) => event.preventDefault()} onClick={() => { setToTeamId(team.id); setJoiningSearch(team.name); setJoiningOpen(false); }} className={`block w-full rounded px-2.5 py-2 text-left text-[11.5px] font-semibold ${toTeamId === team.id ? 'bg-[var(--brand)]/15 text-[var(--brand)]' : 'text-[var(--tx)] hover:bg-[var(--hov)]'}`}>{team.name}</button>) : <div className="px-2.5 py-2 text-[11px] text-[var(--txm)]">No clubs match your search.</div>}</div>}</div></TransferField>
            <TransferField label="Capacity"><select className={transferControlClass} value={role} onChange={(event) => setRole(event.target.value as StaffRole)}>{STAFF_ROLES.map((value) => <option key={value} value={value}>{staffRoleLabel(value)}</option>)}</select></TransferField>
            <TransferField label="Effective from"><input className={transferControlClass} type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} placeholder="2026-09-01" /></TransferField>
            <TransferField label="League season"><select className={transferControlClass} value={leagueSeasonId} onChange={(event) => setLeagueSeasonId(event.target.value)}><option value="">Keep current season scope</option>{activeLeagueSeasons.map((edition) => <option key={edition.id} value={edition.id}>{edition.seasonName} · {edition.league?.name ?? 'League'}</option>)}</select></TransferField>
          </div>
          <TransferField label="Reason (kept on the record)"><input className={transferControlClass} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} placeholder="Left by mutual consent · promoted · club folded" /></TransferField>
          <div className="rounded-xl border border-[var(--bord)] bg-[var(--surf2)] px-4 py-3.5">
            <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-[var(--faint)]">What this changes</div>
            <div className="mt-2.5 grid gap-2 text-[11.5px] text-[var(--txd)]">
              {[
                ['#39b56a', `The ${selectedAssignment?.team.name ?? 'current'} spell closes on ${effectiveFrom || 'the effective date'}, keeping its — record in the history.`],
                ['#39b56a', `${targetTeam?.name ?? 'The new club'} gains ${name} as ${role === 'COACH' ? 'Head Coach' : staffRoleLabel(role)} from ${effectiveFrom || 'the effective date'}.`],
                ['#4a9fe0', `Match sheets before ${effectiveFrom || 'the effective date'} stay credited to ${selectedAssignment?.team.name ?? 'the old club'}; sheets after it go to ${targetTeam?.name ?? 'the new club'}.`],
                ['#4a9fe0', 'Both club pages and the public staff page update on save.'],
                ['#f0a020', 'Portal access follows the new assignment — they lose the old squad, gain the new one.'],
              ].map(([color, text]) => <div className="flex items-start gap-2.5" key={text}><span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} /><span>{text}</span></div>)}
            </div>
          </div>
          {error && <div className="rounded-lg border border-[var(--brand)]/40 bg-[var(--brand)]/10 px-3 py-2 text-[12px] text-[var(--brand)]" role="alert">{error}</div>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--bord2)] px-5 py-4"><span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--faint)]">The completed spell stays in the history</span><div className="flex items-center gap-2"><button type="button" onClick={onClose} className="cursor-pointer rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-2.5 font-body text-[12px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]">Cancel</button><button type="button" onClick={() => void submit()} disabled={saving || !availableTeams.length || !effectiveFrom || !toTeamId} className="cursor-pointer rounded-lg border border-[var(--brand)] bg-[var(--brand)] px-4 py-2.5 font-body text-[12px] font-extrabold uppercase tracking-[0.04em] text-white disabled:cursor-default disabled:opacity-45">{saving ? 'Confirming…' : 'Confirm transfer'}</button></div></div>
      </div>
    </div>
  );
}

function TransferField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--txm)]">{label}</span>{children}{hint && <span className="mt-1.5 block font-body text-[11px] text-[var(--faint)]">{hint}</span>}</label>;
}

function Matches({ fixtures, matchSheets }: { fixtures: StaffFixture[]; matchSheets: StaffMatchSheet[] }) {
  const [filter, setFilter] = useState<'all' | 'completed' | 'upcoming'>('all');
  const visibleSheets = matchSheets.filter((sheet) => filter === 'all' || (filter === 'completed' ? sheet.match.status === 'COMPLETED' : sheet.match.status !== 'COMPLETED'));
  const visible = (matchSheets.length ? visibleSheets.map((sheet) => ({ ...sheet.match, capacity: sheet.capacity })) : fixtures.filter((fixture) => filter === 'all' || (filter === 'completed' ? fixture.status === 'COMPLETED' : fixture.status !== 'COMPLETED')).map((fixture) => ({ ...fixture, capacity: 'Team fixture' })));
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--bord2)] px-5 py-4">
        <div className="flex-1">
          <h2 className="font-display text-[17px] uppercase">Match sheets</h2>
          <p className="mt-1 text-[11.5px] text-[var(--txm)]">Sheets signed as head coach or assistant.</p>
        </div>
        <div className="flex gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em]">
          {(['all', 'completed', 'upcoming'] as const).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-md px-2.5 py-1.5 ${filter === value ? 'border border-[var(--bord)] bg-[var(--surf2)] text-[var(--tx)]' : 'text-[var(--txm)] hover:bg-[var(--hov)]'}`}>{value}</button>)}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead className="bg-[var(--surf2)] font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--faint)]">
            <tr><th className="px-5 py-3 font-normal">Date</th><th className="px-5 py-3 font-normal">Fixture</th><th className="px-5 py-3 font-normal">Capacity</th><th className="px-5 py-3 font-normal">Score</th><th className="px-5 py-3 font-normal">Result</th></tr>
          </thead>
          <tbody>{visible.length ? visible.map((fixture) => {
            const home = fixture.team1?.name || fixture.team1Name || 'Team unavailable';
            const away = fixture.team2?.name || fixture.team2Name || 'Team unavailable';
            const score = fixture.team1Score !== null && fixture.team1Score !== undefined && fixture.team2Score !== null && fixture.team2Score !== undefined ? `${fixture.team1Score}–${fixture.team2Score}` : '—';
            const result = fixture.team1Score === undefined || fixture.team1Score === null || fixture.team2Score === undefined || fixture.team2Score === null ? '—' : fixture.team1Score === fixture.team2Score ? 'D' : '—';
            return <tr key={fixture.id} className="border-t border-[var(--bord2)] hover:bg-[var(--hov)]"><td className="px-5 py-3 font-mono text-[10.5px] text-[var(--txm)]">{formatDate(fixture.date)}</td><td className="px-5 py-3"><a href={`/admin/matches/${fixture.id}`} className="font-body text-[12.5px] font-semibold text-[var(--tx)] no-underline hover:text-[var(--brand)]">{home} vs {away}</a><div className="mt-0.5 font-mono text-[10px] text-[var(--txm)]">{fixture.league?.name || 'League fixture'}</div></td><td className="px-5 py-3 font-mono text-[10px] uppercase text-[var(--txm)]">{fixture.capacity}</td><td className="px-5 py-3 font-display text-[18px]">{score}</td><td className="px-5 py-3 font-mono text-[11px] text-[var(--txm)]">{result}</td></tr>;
          }) : <tr><td colSpan={5} className="px-5 py-12 text-center text-[12px] text-[var(--txm)]">No fixtures are available for the current team assignments.</td></tr>}</tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-[var(--bord2)] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--faint)]"><span>Showing {visible.length} matches</span><a href="/admin/matches" className="text-[var(--brand)] no-underline">Open fixtures →</a></div>
    </section>
  );
}
function Account({
  portal,
  status,
  record,
  sessions,
}: {
  portal: PortalUser | null;
  status: string;
  record: Awaited<ReturnType<typeof staffApi.get>>;
  sessions: StaffSession[];
}) {
  const [sessionRows, setSessionRows] = useState(sessions);
  const revoke = async (sessionId: string) => {
    const response = await fetch(`/api/staff/${record.id}/sessions?sessionId=${encodeURIComponent(sessionId)}`, { method: 'DELETE', credentials: 'same-origin' });
    if (response.ok) setSessionRows((current) => current.filter((session) => session.id !== sessionId));
  };
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px] max-[1080px]:grid-cols-1">
      <div className="grid gap-4">
        <section className="overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)]">
          <div className="border-b border-[var(--bord2)] px-5 py-3.5">
            <h2 className="font-display text-[16px] uppercase">Portal account</h2>
            <p className="mt-0.5 text-[11.5px] text-[var(--txm)]">A User row linked to this staff record. Deactivating the staff member revokes sign-in and keeps the history.</p>
          </div>
          <div className="grid gap-3 px-5 py-5">
            <AccountRow label="Account status" detail={portal?.activatedAt ? `Active · Last activation ${formatDate(portal.activatedAt)}` : portal ? 'Invitation pending' : 'No portal account has been created'} value={status} action={portal ? 'Open user record' : 'Invite to portal'} href={portal ? `/admin/users/${portal.id}` : `/admin/staff/${record.id}?mode=edit`} />
            <AccountRow label="Role" detail={`${staffRoleLabel(record.role)} · scoped to assigned teams`} value={staffRoleLabel(record.role)} action="Change role" href="/admin/users" />
            <AccountRow label="Two-factor authentication" detail="Mandatory league-wide · managed by account security policy" value="Review" action="Force re-enrolment" href={`/admin/staff/${record.id}?mode=edit`} />
            <AccountRow label="Password" detail="Password changes are handled through the linked user account" value="Set" action="Send reset link" href={`/admin/staff/${record.id}?mode=edit`} />
            <AccountRow label="Email verified" detail={portal?.email || record.email || 'Not on file'} value={portal?.email || record.email ? 'Verified' : 'Missing'} />
          </div>
        </section>
        <section className="overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)]">
          <div className="border-b border-[var(--bord2)] px-5 py-3.5"><h2 className="font-display text-[16px] uppercase">Active sessions</h2></div>
          <div className="grid gap-0">{sessionRows.length ? sessionRows.map((session) => <div key={session.id} className="flex flex-wrap items-center gap-3 border-b border-[var(--bord2)] px-5 py-3"><div className="min-w-[200px] flex-1"><div className="text-[12.5px] font-semibold text-[var(--tx)]">Portal session</div><div className="mt-0.5 font-mono text-[10.5px] text-[var(--txm)]">Last seen {formatDate(session.lastSeenAt || session.createdAt)}</div></div><span className="font-mono text-[10.5px] text-[var(--faint)]">Expires {formatDate(session.expiresAt)}</span><button type="button" onClick={() => void revoke(session.id)} className="rounded-md border border-[var(--brand)]/40 bg-[var(--brand)]/10 px-2.5 py-1.5 text-[11px] font-bold text-[var(--brand)]">End</button></div>) : <div className="px-5 py-5"><Empty text="No active sessions." /></div>}</div>
        </section>
      </div>
      <section className="overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)]">
        <div className="border-b border-[var(--bord2)] px-4 py-3"><span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-[var(--faint)]">Permissions in the portal</span></div>
        <div className="grid gap-2.5 px-4 py-4">
          <Permission ok label="See and edit assigned team rosters" />
          <Permission ok label="Submit team sheets before a fixture" />
          <Permission ok label="Read assigned fixtures, results and box scores" />
          <Permission label="Edit results or standings — league staff only" />
          <Permission label="See other clubs’ private data" />
          <a href="/admin/users" className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] no-underline">Edit the Coach role →</a>
        </div>
      </section>
    </div>
  );
}
function AccountRow({ label, detail, value, action, href }: { label: string; detail: string; value: string; action?: string; href?: string }) {
  return <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--bord)] bg-[var(--surf2)] px-4 py-3"><div className="min-w-[200px] flex-1"><div className="text-[12.5px] font-bold">{label}</div><div className="mt-0.5 text-[11.5px] text-[var(--txm)]">{detail}</div></div><span className="rounded-full bg-[var(--chip)] px-2.5 py-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.06em] text-[var(--txm)]">{value}</span>{action && (href ? <a href={href} className="rounded-md border border-[var(--bord)] bg-[var(--surf)] px-2.5 py-1.5 text-[11px] font-bold text-[var(--txd)] no-underline hover:border-[var(--brand)] hover:text-[var(--brand)]">{action}</a> : <button type="button" className="rounded-md border border-[var(--bord)] bg-[var(--surf)] px-2.5 py-1.5 text-[11px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]">{action}</button>)}</div>;
}
function Permission({ ok = false, label }: { ok?: boolean; label: string }) {
  return <div className="flex items-center gap-2"><span className={`flex h-4 w-4 items-center justify-center rounded ${ok ? 'bg-emerald-500/15 text-emerald-500' : 'bg-[var(--brand)]/10 text-[var(--brand)]'} font-mono text-[9px]`}>{ok ? '✓' : '×'}</span>{label}</div>;
}
function Activity({ record, events }: { record: Awaited<ReturnType<typeof staffApi.get>>; events: StaffAuditEvent[] }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)]">
      <div className="flex items-center gap-2.5 border-b border-[var(--bord2)] px-4 py-3"><span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-[var(--faint)]">Activity</span><a href="/admin/audit-logs" className="ml-auto font-mono text-[10px] uppercase tracking-[0.1em] no-underline">Full audit log →</a></div>
      <div className="grid gap-0">
        {events.length ? events.map((event) => <ActivityRow key={event.id} icon={event.action.includes('STAFF') ? <Users /> : <Pencil />} text={event.action.replaceAll('_', ' ')} detail={`${event.actor?.name || event.actor?.email || 'System'} · ${formatDate(event.createdAt)}`} />) : <><ActivityRow icon={<Users />} text="Staff record created" detail={`System · ${formatDate(record.createdAt)}`} /><ActivityRow icon={<Pencil />} text="Staff record last updated" detail={`Admin · ${formatDate(record.updatedAt)}`} /><div className="border-b border-[var(--bord2)] px-5 py-3.5 text-[12px] text-[var(--txm)]">No additional audit events recorded.</div></>}
      </div>
    </section>
  );
}
function ActivityRow({ icon, text, detail }: { icon: ReactNode; text: string; detail?: string }) {
  return <div className="flex flex-wrap items-start gap-3.5 border-b border-[var(--bord2)] px-5 py-3.5"><span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md bg-[var(--brand)]/10 text-[var(--brand)]">{icon}</span><div className="min-w-[220px] flex-1"><div className="text-[12.5px] text-[var(--tx)]">{text}</div>{detail && <div className="mt-0.5 font-mono text-[10.5px] text-[var(--txm)]">{detail}</div>}</div></div>;
}
function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)]">
      <div className="border-b border-[var(--bord2)] px-5 py-3.5">
        <h2 className="font-display text-[17px] uppercase">{title}</h2>
        {subtitle && <p className="mt-1 text-[11.5px] text-[var(--txm)]">{subtitle}</p>}
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}
function Kpi({
  value,
  label,
  sub,
  urgent,
}: {
  value: string;
  label: string;
  sub?: string;
  urgent?: boolean;
}) {
  return (
    <div className="border-r border-[var(--bord2)] px-5 py-4 last:border-r-0">
      <div
        className={`font-display text-[24px] leading-none ${urgent ? 'text-[var(--brand)]' : 'text-[var(--tx)]'}`}
      >
        {value}
      </div>
      <div className="mt-1.5 truncate font-mono text-[9.5px] uppercase tracking-[0.1em] text-[var(--txm)]">
        {label}
      </div>
      {sub && <div className="mt-0.5 truncate text-[10.5px] text-[var(--faint)]">{sub}</div>}
    </div>
  );
}
function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--bord2)] bg-[var(--surf2)] p-3">
      <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--txm)]">
        {icon}
        {label}
      </div>
      <div className="mt-2 break-words text-[12px] font-semibold">{value}</div>
    </div>
  );
}
function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="font-mono uppercase tracking-[0.1em] text-[var(--faint)]">{label}</dt>
      <dd className="truncate text-right font-semibold text-[var(--txd)]">{value}</dd>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--bord)] px-4 py-8 text-center text-[12px] text-[var(--txm)]">
      {text}
    </div>
  );
}
