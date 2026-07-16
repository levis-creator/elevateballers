import { useEffect, useRef, useState } from 'react';
import { PermissionProvider } from '@/features/rbac/usePermissions';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Trophy,
  Plus,
  Search,
  List as ListIcon,
  LayoutGrid,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  CalendarClock,
  CheckCircle2,
  Radio,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  getTeam1Name,
  getTeam2Name,
  getTeam1Id,
  getTeam2Id,
  getWinnerId,
  getTeamInitials,
} from '../../domain/usecases/team-helpers';
import { getLeagueName } from '../../domain/usecases/league-helpers';
import { getSeasonName } from '../../domain/usecases/season-helpers';
import {
  statusMeta,
  toStatusKey,
  formatMatchTime,
  avatarTint,
  type ListMatch,
} from '../../domain/usecases/match-list-view';
import { useMatchListData } from './hooks/useMatchListData';

/* -------------------------------------------------------------------------- */
/* Small shared primitives                                                    */
/* -------------------------------------------------------------------------- */

const STAT_ICONS = { total: Trophy, completed: CheckCircle2, live: Radio, scheduled: CalendarClock };

function TeamAvatar({ name, size = 34 }: { name: string; size?: number }) {
  const tint = avatarTint(name);
  return (
    <span
      className="flex flex-shrink-0 items-center justify-center rounded-full font-['Anton'] leading-none"
      style={{
        width: size,
        height: size,
        background: `${tint}22`,
        color: tint,
        fontSize: size * 0.36,
      }}
    >
      {getTeamInitials(name)}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const meta = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-['Space_Mono'] text-[10px] font-bold uppercase tracking-[0.1em]"
      style={{ background: `${meta.color}1f`, color: meta.color }}
    >
      <span className="h-[6px] w-[6px] rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

/** Compact accent checkbox that inherits the v2 brand colour. */
function Check({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      aria-label={label}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 flex-shrink-0 cursor-pointer rounded border-[var(--bord)] bg-[var(--surf2)] accent-[var(--brand)]"
    />
  );
}

/** Row kebab menu (View / Edit / Delete) with click-outside dismissal. */
function RowMenu({
  matchId,
  canEdit,
  canDelete,
  onDelete,
}: {
  matchId: string;
  canEdit: boolean;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const itemCls =
    "flex w-full items-center gap-2.5 px-3.5 py-2 text-left font-['Archivo'] text-[12.5px] font-semibold no-underline";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Match actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--txm)] hover:bg-[var(--hov)] hover:text-[var(--tx)]"
      >
        <MoreVertical className="h-[18px] w-[18px]" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-lg border border-[var(--bord)] bg-[var(--surf)] py-1 shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
        >
          <a href={`/admin/matches/view/${matchId}`} data-astro-prefetch className={`${itemCls} text-[var(--txd)] hover:bg-[var(--hov)] hover:text-[var(--tx)]`}>
            <Eye className="h-4 w-4" /> View Details
          </a>
          {canEdit && (
            <a href={`/admin/matches/${matchId}`} data-astro-prefetch className={`${itemCls} text-[var(--txd)] hover:bg-[var(--hov)] hover:text-[var(--tx)]`}>
              <Pencil className="h-4 w-4" /> Edit
            </a>
          )}
          {canDelete && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className={`${itemCls} text-[var(--brandsoft)] hover:bg-[var(--brand)]/10`}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Team-emphasis: which side shows the trophy + bright score                  */
/* -------------------------------------------------------------------------- */

interface Emphasis {
  leader: 1 | 2 | null;
  hasScore: boolean;
}

function emphasisOf(match: ListMatch): Emphasis {
  const s1 = match.team1Score;
  const s2 = match.team2Score;
  const hasScore = s1 != null && s2 != null;
  const key = toStatusKey(match.status);

  if (key === 'COMPLETED') {
    const winnerId = getWinnerId(match);
    if (winnerId) {
      if (winnerId === getTeam1Id(match)) return { leader: 1, hasScore };
      if (winnerId === getTeam2Id(match)) return { leader: 2, hasScore };
    }
  }
  // LIVE (or completed w/o explicit winner) → lead by score, no trophy on a tie.
  if (hasScore && s1 !== s2) return { leader: s1! > s2! ? 1 : 2, hasScore };
  return { leader: null, hasScore };
}

/* -------------------------------------------------------------------------- */
/* Team row (used by both list + grid cards)                                  */
/* -------------------------------------------------------------------------- */

function TeamRow({
  name,
  score,
  isLeader,
  hasScore,
  avatarSize,
  scoreSize,
}: {
  name: string;
  score: number | null;
  isLeader: boolean;
  hasScore: boolean;
  avatarSize: number;
  scoreSize: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <TeamAvatar name={name} size={avatarSize} />
      <span
        className={`flex-1 truncate font-['Archivo'] text-[14px] ${
          isLeader ? 'font-bold text-[var(--tx)]' : 'font-semibold text-[var(--txd)]'
        }`}
      >
        {name}
      </span>
      {isLeader && <Trophy className="h-4 w-4 flex-shrink-0 text-[var(--brand)]" aria-label="Winner" />}
      <span
        className={`font-['Anton'] tabular-nums ${isLeader ? 'text-[var(--tx)]' : 'text-[var(--txm)]'}`}
        style={{ fontSize: scoreSize }}
      >
        {hasScore ? score : '–'}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* List-view match card                                                       */
/* -------------------------------------------------------------------------- */

function MatchListCard({
  match,
  selected,
  onSelect,
  canEdit,
  canDelete,
  onDelete,
}: {
  match: ListMatch;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  canEdit: boolean;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const meta = statusMeta(match.status);
  const isLive = toStatusKey(match.status) === 'LIVE';
  const emp = emphasisOf(match);
  const team1 = getTeam1Name(match);
  const team2 = getTeam2Name(match);
  const league = getLeagueName(match);
  const season = getSeasonName(match);
  const leaderName = emp.leader === 1 ? team1 : emp.leader === 2 ? team2 : null;

  return (
    <div
      className="relative overflow-hidden rounded-xl border bg-[var(--surf)] transition-colors"
      style={
        isLive
          ? { borderColor: 'rgba(228,0,43,0.45)', boxShadow: '0 0 0 1px rgba(228,0,43,0.12)' }
          : { borderColor: 'var(--bord)' }
      }
    >
      {isLive && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(120% 140% at 100% -20%, rgba(228,0,43,0.12), transparent 55%)' }}
        />
      )}
      {/* header row */}
      <div className="relative flex items-center gap-3 border-b border-[var(--bord2)] px-4 py-2.5">
        <Check checked={selected} onChange={onSelect} label={`Select ${team1} vs ${team2}`} />
        <StatusPill status={match.status} />
        {league && (
          <span className="flex items-center gap-1.5 font-['Space_Mono'] text-[11px] text-[var(--txm)]">
            <span className="h-[5px] w-[5px] rounded-full" style={{ background: avatarTint(league) }} />
            {league}
          </span>
        )}
        <span className="ml-auto font-['Space_Mono'] text-[11px] uppercase tracking-[0.06em] text-[var(--txm)]">
          {formatMatchTime(match.date)}
        </span>
        <RowMenu matchId={match.id} canEdit={canEdit} canDelete={canDelete} onDelete={onDelete} />
      </div>

      {/* teams */}
      <div className="relative px-4 py-3.5">
        <TeamRow name={team1} score={match.team1Score} isLeader={emp.leader === 1} hasScore={emp.hasScore} avatarSize={34} scoreSize="28px" />
        <div className="my-1 pl-[10px] font-['Space_Mono'] text-[10px] uppercase tracking-[0.14em] text-[var(--faint)]">vs</div>
        <TeamRow name={team2} score={match.team2Score} isLeader={emp.leader === 2} hasScore={emp.hasScore} avatarSize={34} scoreSize="28px" />
      </div>

      {/* footer */}
      <div className="relative flex items-center justify-between gap-3 border-t border-[var(--bord2)] px-4 py-2.5">
        <span className="font-['Space_Mono'] text-[11px] text-[var(--txm)]">{season || 'No season'}</span>
        <div className="flex items-center gap-3">
          {leaderName && (
            <span className="flex items-center gap-1.5 font-['Space_Mono'] text-[11px] text-[var(--txd)]">
              <Trophy className="h-[13px] w-[13px] text-[var(--brand)]" />
              {leaderName}
            </span>
          )}
          {meta.consoleLabel && canEdit && (
            <a
              href={`/admin/matches/console/${match.id}`}
              data-astro-prefetch
              className="rounded-md px-3 py-1.5 font-['Archivo'] text-[11px] font-extrabold uppercase tracking-[0.05em] text-white no-underline transition-opacity hover:opacity-90"
              style={{ background: meta.consoleColor }}
            >
              {meta.consoleLabel}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Grid-view match card                                                       */
/* -------------------------------------------------------------------------- */

function MatchGridCard({
  match,
  canEdit,
  canDelete,
  onDelete,
}: {
  match: ListMatch;
  canEdit: boolean;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const isLive = toStatusKey(match.status) === 'LIVE';
  const emp = emphasisOf(match);
  const team1 = getTeam1Name(match);
  const team2 = getTeam2Name(match);
  const league = getLeagueName(match);
  const season = getSeasonName(match);

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-xl border bg-[var(--surf)]"
      style={isLive ? { borderColor: 'rgba(228,0,43,0.45)' } : { borderColor: 'var(--bord)' }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-[var(--bord2)] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <StatusPill status={match.status} />
          {league && <span className="truncate font-['Space_Mono'] text-[11px] text-[var(--txm)]">{league}</span>}
        </div>
        <RowMenu matchId={match.id} canEdit={canEdit} canDelete={canDelete} onDelete={onDelete} />
      </div>
      <div className="flex flex-1 flex-col gap-2.5 px-4 py-4">
        <TeamRow name={team1} score={match.team1Score} isLeader={emp.leader === 1} hasScore={emp.hasScore} avatarSize={30} scoreSize="22px" />
        <TeamRow name={team2} score={match.team2Score} isLeader={emp.leader === 2} hasScore={emp.hasScore} avatarSize={30} scoreSize="22px" />
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-[var(--bord2)] px-4 py-2.5">
        <span className="flex items-center gap-1.5 font-['Space_Mono'] text-[10.5px] text-[var(--txm)]">
          <CalendarClock className="h-[13px] w-[13px]" />
          {formatMatchTime(match.date)} · {season || 'No season'}
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Toolbar select                                                             */
/* -------------------------------------------------------------------------- */

function FilterSelect({
  value,
  onChange,
  label,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      aria-label={label}
      onChange={(e) => onChange(e.target.value)}
      className="eb-in max-w-[190px] cursor-pointer !text-[13px]"
    >
      {children}
    </select>
  );
}

/* -------------------------------------------------------------------------- */
/* Pagination                                                                 */
/* -------------------------------------------------------------------------- */

/** Page tokens with ellipses: always show first/last + a window around current. */
function pageWindow(page: number, pageCount: number): (number | 'gap')[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const tokens = new Set<number>([1, pageCount, page, page - 1, page + 1]);
  const pages = [...tokens].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];
  let prev = 0;
  for (const p of pages) {
    if (p - prev > 1) out.push('gap');
    out.push(p);
    prev = p;
  }
  return out;
}

function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (p: number) => void;
}) {
  const go = (p: number) => onChange(Math.min(pageCount, Math.max(1, p)));
  const arrowCls =
    'flex h-8 w-8 items-center justify-center rounded-md border border-[var(--bord)] text-[var(--txd)] hover:border-[var(--brand)]/50 hover:text-[var(--tx)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[var(--bord)]';

  return (
    <nav aria-label="Matches pagination" className="mt-6 flex items-center justify-center gap-1.5">
      <button type="button" aria-label="Previous page" onClick={() => go(page - 1)} disabled={page <= 1} className={arrowCls}>
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pageWindow(page, pageCount).map((tok, i) =>
        tok === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 font-['Space_Mono'] text-[12px] text-[var(--faint)]">
            …
          </span>
        ) : (
          <button
            key={tok}
            type="button"
            aria-label={`Page ${tok}`}
            aria-current={tok === page ? 'page' : undefined}
            onClick={() => go(tok)}
            className={`flex h-8 min-w-8 items-center justify-center rounded-md px-2 font-['Space_Mono'] text-[12px] font-bold ${
              tok === page
                ? 'bg-[var(--brand)] text-white'
                : 'border border-[var(--bord)] text-[var(--txd)] hover:border-[var(--brand)]/50 hover:text-[var(--tx)]'
            }`}
          >
            {tok}
          </button>
        ),
      )}
      <button type="button" aria-label="Next page" onClick={() => go(page + 1)} disabled={page >= pageCount} className={arrowCls}>
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/* Main content                                                               */
/* -------------------------------------------------------------------------- */

function MatchListContent() {
  const d = useMatchListData();
  const canCreate = d.can('matches:create');
  const canEdit = d.can('matches:update');
  const canDelete = d.can('matches:delete');

  const statCards = [
    { key: 'total' as const, label: 'Total Matches', value: d.stats.total, color: '#e4002b' },
    { key: 'completed' as const, label: 'Completed', value: d.stats.completed, color: '#1f9d55' },
    { key: 'live' as const, label: 'Live Now', value: d.stats.live, color: '#e4002b' },
    { key: 'scheduled' as const, label: 'Scheduled', value: d.stats.scheduled, color: '#d98324' },
  ];

  return (
    <div className="font-['Archivo'] text-[var(--tx)]">
      {/* header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 font-['Space_Mono'] text-[11px] uppercase tracking-[0.16em] text-[var(--brandsoft)]">
            Competition
          </div>
          <h1 className="font-['Anton'] text-[34px] uppercase leading-none text-[var(--tx)]">Matches</h1>
          <p className="mt-1.5 font-['Archivo'] text-[14px] text-[var(--txd)]">Manage match fixtures and results.</p>
        </div>
        {canCreate && (
          <a
            href="/admin/matches/new"
            data-astro-prefetch
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2.5 font-['Archivo'] text-[12px] font-extrabold uppercase tracking-[0.05em] text-white no-underline shadow-[0_6px_18px_rgba(228,0,43,0.3)] transition-colors hover:bg-[var(--brandlt)]"
          >
            <Plus className="h-4 w-4" /> Create Match
          </a>
        )}
      </div>

      {/* stat cards */}
      <div className="mb-5 grid grid-cols-4 gap-2.5 max-[820px]:grid-cols-2">
        {statCards.map((s) => {
          const Icon = STAT_ICONS[s.key];
          return (
            <div key={s.key} className="flex items-center gap-3 rounded-xl border border-[var(--bord)] bg-[var(--surf)] px-4 py-3.5">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: `${s.color}1f`, color: s.color }}>
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block font-['Anton'] text-[24px] leading-none text-[var(--tx)]">{s.value}</span>
                <span className="block font-['Space_Mono'] text-[9.5px] uppercase tracking-[0.08em] text-[var(--txm)]">{s.label}</span>
              </span>
            </div>
          );
        })}
      </div>

      {/* toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--faint)]" />
          <input
            type="text"
            value={d.search}
            onChange={(e) => d.setSearch(e.target.value)}
            placeholder="Search matches..."
            aria-label="Search matches by teams, league, or season"
            className="eb-in !pl-10"
          />
        </div>
        <FilterSelect value={d.status} onChange={(v) => d.setStatus(v as typeof d.status)} label="Filter by status">
          <option value="all">All Status</option>
          <option value="upcoming">Scheduled</option>
          <option value="live">Live</option>
          <option value="completed">Completed</option>
        </FilterSelect>
        <FilterSelect value={d.seasonId} onChange={d.setSeasonId} label="Filter by season">
          <option value="all">All Seasons</option>
          {d.seasons.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </FilterSelect>
        <FilterSelect value={d.leagueId} onChange={d.setLeagueId} label="Filter by league">
          <option value="all">All Leagues</option>
          {d.leagues.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </FilterSelect>
        <div className="flex gap-1 rounded-lg border border-[var(--bord)] bg-[var(--surf)] p-1">
          {(['list', 'grid'] as const).map((mode) => {
            const on = d.viewMode === mode;
            const Icon = mode === 'list' ? ListIcon : LayoutGrid;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => d.setViewMode(mode)}
                aria-label={`${mode} view`}
                aria-pressed={on}
                className={`flex h-8 w-8 items-center justify-center rounded-md ${on ? 'bg-[var(--brand)] text-white' : 'text-[var(--txm)] hover:bg-[var(--hov)]'}`}
              >
                <Icon className="h-[16px] w-[16px]" />
              </button>
            );
          })}
        </div>
      </div>

      {/* bulk bar */}
      {d.selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--brand)]/40 bg-[var(--brand)]/[0.08] px-4 py-3">
          <span className="font-['Archivo'] text-[13px] font-bold text-[var(--tx)]">{d.selected.size} match(es) selected</span>
          <div className="flex items-center gap-2">
            {canDelete && (
              <button
                type="button"
                onClick={d.deleteSelected}
                disabled={d.bulkBusy}
                className="inline-flex items-center gap-1.5 rounded-md bg-[var(--brand)] px-3 py-2 font-['Archivo'] text-[11px] font-extrabold uppercase tracking-[0.04em] text-white hover:bg-[var(--brandlt)] disabled:opacity-50"
              >
                <Trash2 className="h-[14px] w-[14px]" /> {d.bulkBusy ? 'Deleting…' : 'Delete'}
              </button>
            )}
            <button
              type="button"
              onClick={d.clearSelection}
              disabled={d.bulkBusy}
              className="rounded-md border border-[var(--bord)] px-3 py-2 font-['Archivo'] text-[11px] font-extrabold uppercase tracking-[0.04em] text-[var(--txm)] hover:text-[var(--tx)] disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* transient error (non-fatal, e.g. a failed delete) */}
      {d.error && !d.loading && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--brand)]/40 bg-[var(--brand)]/[0.08] px-4 py-3 font-['Archivo'] text-[13px] text-[var(--brandsoft)]">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {d.error}
        </div>
      )}

      {/* body */}
      {d.loading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-[var(--surf)]" />
          ))}
        </div>
      ) : d.filtered.length === 0 ? (
        <EmptyState hasFilters={d.hasActiveFilters} canCreate={canCreate} onReset={() => d.refetch()} error={d.error} />
      ) : d.viewMode === 'list' ? (
        <div className="space-y-7">
          {/* Select-all lives with the first group header for the list view. */}
          <div className="flex items-center gap-2.5">
            <Check checked={d.allSelected} onChange={d.toggleAll} label="Select all matches on this page" />
            <span className="font-['Space_Mono'] text-[11px] uppercase tracking-[0.1em] text-[var(--txm)]">
              Select page ({d.pageItems.length})
            </span>
          </div>
          {d.groups.map((group) => (
            <section key={group.key}>
              <div className="mb-2.5 flex items-center justify-between border-b border-[var(--bord2)] pb-2">
                <h2 className="font-['Space_Mono'] text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--txd)]">{group.label}</h2>
                <span className="font-['Space_Mono'] text-[10px] uppercase tracking-[0.1em] text-[var(--faint)]">
                  {group.matches.length} {group.matches.length === 1 ? 'match' : 'matches'}
                </span>
              </div>
              <div className="space-y-3">
                {group.matches.map((m) => (
                  <MatchListCard
                    key={m.id}
                    match={m}
                    selected={d.selected.has(m.id)}
                    onSelect={(checked) => d.toggleOne(m.id, checked)}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onDelete={() => d.deleteOne(m.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 max-[1100px]:grid-cols-2 max-[720px]:grid-cols-1">
          {d.pageItems.map((m) => (
            <MatchGridCard
              key={m.id}
              match={m}
              canEdit={canEdit}
              canDelete={canDelete}
              onDelete={() => d.deleteOne(m.id)}
            />
          ))}
        </div>
      )}

      {/* pagination */}
      {!d.loading && d.filtered.length > 0 && d.pageCount > 1 && (
        <Pagination page={d.page} pageCount={d.pageCount} onChange={d.setPage} />
      )}

      <div className="py-6 text-center font-['Space_Mono'] text-[11px] tracking-[0.04em] text-[var(--faint)]">
        {d.filtered.length > 0
          ? `Page ${d.page} of ${d.pageCount} · ${d.filtered.length} matches total · Elevate Ballers CMS`
          : 'Elevate Ballers CMS'}
      </div>
    </div>
  );
}

function EmptyState({
  hasFilters,
  canCreate,
  onReset,
  error,
}: {
  hasFilters: boolean;
  canCreate: boolean;
  onReset: () => void;
  error: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[var(--bord)] bg-[var(--surf)] px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surf2)] text-[var(--txm)]">
        {error ? <AlertCircle className="h-6 w-6" /> : hasFilters ? <Search className="h-6 w-6" /> : <Trophy className="h-6 w-6" />}
      </span>
      <div>
        <h3 className="font-['Anton'] text-[22px] uppercase text-[var(--tx)]">
          {error ? 'Could not load matches' : hasFilters ? 'No matches found' : 'No matches yet'}
        </h3>
        <p className="mt-1 max-w-[340px] font-['Archivo'] text-[13.5px] text-[var(--txm)]">
          {error || (hasFilters ? 'Try adjusting your search or filters.' : 'Create your first match to get started.')}
        </p>
      </div>
      {error ? (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--bord)] px-4 py-2.5 font-['Archivo'] text-[12px] font-extrabold uppercase tracking-[0.05em] text-[var(--txd)] hover:text-[var(--tx)]"
        >
          <RefreshCw className="h-4 w-4" /> Try Again
        </button>
      ) : (
        !hasFilters && canCreate && (
          <a
            href="/admin/matches/new"
            data-astro-prefetch
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2.5 font-['Archivo'] text-[12px] font-extrabold uppercase tracking-[0.05em] text-white no-underline hover:bg-[var(--brandlt)]"
          >
            <Plus className="h-4 w-4" /> Create Match
          </a>
        )
      )}
    </div>
  );
}

/** Establishes its own PermissionProvider (matches the v2 Dashboard pattern). */
export default function MatchListV2() {
  return (
    <ErrorBoundary>
      <PermissionProvider>
        <MatchListContent />
      </PermissionProvider>
    </ErrorBoundary>
  );
}
