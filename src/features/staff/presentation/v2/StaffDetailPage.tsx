import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
import { staffRoleLabel } from '@/features/staff/domain/entities/staff-management';

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
  const [historyFilter, setHistoryFilter] = useState<'all' | 'current' | 'past'>('all');
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window === 'undefined') return 'overview';
    const requested = new URLSearchParams(window.location.search).get('tab');
    return requested === 'history' || requested === 'matches' || requested === 'account' || requested === 'activity'
      ? requested
      : 'overview';
  });
  const [menuOpen, setMenuOpen] = useState(false);
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
  const active = useMemo(() => (record?.teams ?? []).filter((item) => !item.effectiveTo), [record]);
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
  const historyRows = assignments.filter(
    (item) =>
      !transfers.some((event) => event.fromTeamId === item.teamId && event.staffId === item.staffId)
  );
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
        {tab === 'history' && <History assignments={historyRows} transfers={transfers} filter={historyFilter} onFilterChange={setHistoryFilter} />}
        {tab === 'matches' && (
          <Matches fixtures={fixtures} matchSheets={matchSheets} />
        )}
        {tab === 'account' && <Account portal={portal} status={portalStatus} record={record} sessions={sessions} />}
        {tab === 'activity' && <Activity record={record} events={activityEvents} />}
      </div>
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
}) {
  return (
    <>
      <section className="mb-0 overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)]">
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
          <div className="relative flex shrink-0 flex-col items-end gap-2.5">
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
                <div className="absolute z-20 mt-[92px] w-56 overflow-hidden rounded-xl border border-[var(--bord)] bg-[var(--surf)] py-1 shadow-xl">
                  <a href={`/admin/staff/${record.id}?mode=edit`} className="block px-3.5 py-2.5 text-left text-[12px] font-semibold text-[var(--txd)] no-underline hover:bg-[var(--hov)]">Edit staff record</a>
                  <a href="/admin/audit-logs" className="block px-3.5 py-2.5 text-left text-[12px] font-semibold text-[var(--txd)] no-underline hover:bg-[var(--hov)]">View audit history</a>
                  <a href={record.slug ? `/staff/${record.slug}` : '/staff'} className="block px-3.5 py-2.5 text-left text-[12px] font-semibold text-[var(--txd)] no-underline hover:bg-[var(--hov)]">Open public profile</a>
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
}: {
  assignments: StaffAssignmentHistoryRecord[];
  transfers: StaffTransferRecord[];
  filter: 'all' | 'current' | 'past';
  onFilterChange: (filter: 'all' | 'current' | 'past') => void;
}) {
  const visibleAssignments = assignments.filter((item) => filter === 'all' || (filter === 'current' ? !item.effectiveTo : Boolean(item.effectiveTo)));
  const historyGroups = Array.from(new Map(visibleAssignments.map((item) => {
    const season = item.effectiveFrom ? `${new Date(item.effectiveFrom).getFullYear()} Season` : 'Season unavailable';
    return [season, visibleAssignments.filter((candidate) => (candidate.effectiveFrom ? `${new Date(candidate.effectiveFrom).getFullYear()} Season` : 'Season unavailable') === season)];
  })).entries());
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--bord2)] px-5 py-4">
        <div className="flex-1">
          <h2 className="font-display text-[17px] uppercase">Team history</h2>
          <p className="mt-1 text-[11.5px] text-[var(--txm)]">Every assignment and transfer retained across league seasons.</p>
        </div>
        <button type="button" className="rounded-lg border border-[var(--brand)]/40 bg-[var(--brand)]/10 px-3 py-2 font-body text-[11px] font-bold text-[var(--brand)]">Transfer to another club…</button>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--bord2)] px-5 py-3">
        <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--faint)]">Filter</span>
        {(['all', 'current', 'past'] as const).map((value) => <button key={value} type="button" onClick={() => onFilterChange(value)} className={`rounded-md px-2.5 py-1.5 font-body text-[11px] font-semibold ${filter === value ? 'border border-[var(--bord)] bg-[var(--surf2)] text-[var(--tx)]' : 'text-[var(--txm)] hover:bg-[var(--hov)]'}`}>{value[0].toUpperCase() + value.slice(1)}</button>)}
        <span className="ml-auto font-mono text-[10px] text-[var(--faint)]">{visibleAssignments.length} assignments across recorded seasons</span>
      </div>
      {transfers.length || visibleAssignments.length ? (
        <div className="grid gap-4 p-5">
          {transfers.map((event) => (
            <div
              key={event.id}
              className="rounded-xl border border-[var(--bord)] bg-[var(--surf2)] p-4"
            >
              <div className="flex items-center gap-2 text-[13px] font-bold">
                <span>{event.fromTeam.name}</span>
                <ChevronRight className="h-4 w-4 text-[var(--brand)]" />
                <span>{event.toTeam.name}</span>
              </div>
              <div className="mt-1 text-[11px] text-[var(--txm)]">
                Effective {formatDate(event.effectiveFrom)} · Recorded {formatDate(event.createdAt)}
              </div>
              {event.reason && (
                <div className="mt-2 text-[12px] text-[var(--txd)]">{event.reason}</div>
              )}
            </div>
          ))}
          {historyGroups.map(([season, rows]) => <section key={season} className="overflow-hidden rounded-xl border border-[var(--bord)] bg-[var(--surf)]"><div className="flex flex-wrap items-center gap-2 border-b border-[var(--bord2)] bg-[var(--surf2)] px-4 py-3"><span className="font-display text-[16px] uppercase">{season}</span><span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--txm)]">League season</span><span className="ml-auto rounded-full bg-emerald-500/10 px-2 py-1 font-mono text-[9px] uppercase text-emerald-500">{rows.some((row) => !row.effectiveTo) ? 'In progress' : 'Completed'}</span></div><div className="grid gap-2 p-3">{rows.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--bord2)] bg-[var(--surf2)] px-3 py-3"><span className="flex h-7 w-7 items-center justify-center rounded bg-[var(--brand)]/10 font-mono text-[9px] font-bold text-[var(--brandsoft)]">{item.team.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span><div className="min-w-[180px] flex-1"><div className="text-[13px] font-bold">{item.team.name}</div><div className="mt-0.5 font-mono text-[10px] text-[var(--txm)]">{formatDate(item.effectiveFrom)} to {item.effectiveTo ? formatDate(item.effectiveTo) : 'present'}</div></div><span className="rounded-md bg-[var(--brand)]/10 px-2 py-1 font-mono text-[9px] uppercase text-[var(--brandsoft)]">{staffRoleLabel(item.role)}</span><span className="rounded-full border border-[var(--bord)] bg-[var(--surf)] px-2 py-1 font-mono text-[9px] uppercase text-[var(--txm)]">{item.effectiveTo ? 'Past' : 'Current'}</span></div>)}</div></section>)}
        </div>
      ) : (
        <div className="p-5"><Empty text="No durable assignment history recorded yet." /></div>
      )}
      <div className="grid grid-cols-5 border-t border-[var(--bord2)] max-[720px]:grid-cols-2">
        {['Record as head coach', 'Win rate', 'Matches', 'Clubs', 'Seasons'].map((label) => <div key={label} className="border-r border-[var(--bord2)] px-5 py-4 last:border-r-0"><div className="font-display text-[22px]">—</div><div className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--txm)]">{label}</div></div>)}
      </div>
    </section>
  );
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
