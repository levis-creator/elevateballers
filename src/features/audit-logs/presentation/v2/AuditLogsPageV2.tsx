import { useState } from 'react';
import { PermissionProvider, usePermissions } from '@/features/rbac/usePermissions';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RefreshCw, Download, Search, ChevronDown, SlidersHorizontal } from 'lucide-react';
import {
  actionLabel,
  actorDisplay,
  actorInitial,
  domainTone,
  formatFullTimestamp,
  formatTime,
  isAnonymousActor,
  isFailureAction,
  summarizeMetadata,
  categorizeAction,
  AUDIT_CATEGORIES,
  type AuditCategory,
  type AuditLogEntry,
} from '../../domain/usecases/audit-log-view';
import { useAuditLogsData, TIME_RANGE_LABEL, type OutcomeFilter, type TimeRangeFilter } from './hooks/useAuditLogsData';

/* -------------------------------------------------------------------------- */
/* Small shared primitives                                                    */
/* -------------------------------------------------------------------------- */

function StatCard({
  label,
  value,
  hint,
  accent = false,
  onClick,
}: {
  label: string;
  value: number;
  hint: string;
  accent?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="block w-full rounded-xl p-3.5 text-left cursor-pointer"
      style={{
        border: `1px solid ${accent ? 'rgba(228,0,43,0.35)' : 'var(--bord)'}`,
        background: accent ? 'rgba(228,0,43,0.07)' : 'var(--surf)',
      }}
    >
      <span className="block font-['Space_Mono'] text-[9px] uppercase tracking-[0.16em] text-[var(--faint)]">
        {label}
      </span>
      <span
        className="mt-1.5 block font-['Anton'] text-[26px] leading-none"
        style={{ color: accent ? '#e4002b' : 'var(--tx)' }}
      >
        {value}
      </span>
      <span className="mt-1 block font-['Archivo'] text-[11px] text-[var(--txm)]">{hint}</span>
    </button>
  );
}

function ActionBadge({ action }: { action: string }) {
  const [bg, fg] = domainTone(action);
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-[3px] font-['Space_Mono'] text-[10px] tracking-[0.04em]"
      style={{ background: bg, color: fg }}
    >
      {action}
    </span>
  );
}

function OutcomePill() {
  return (
    <span
      className="inline-flex items-center rounded-full px-[7px] py-[3px] font-['Space_Mono'] text-[9px] uppercase tracking-[0.08em]"
      style={{ background: 'rgba(228,0,43,0.14)', color: '#e4002b' }}
    >
      Failed
    </span>
  );
}

function Avatar({ entry }: { entry: AuditLogEntry }) {
  const anon = isAnonymousActor(entry);
  return (
    <span
      className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full font-['Anton'] text-[12px] text-white"
      style={{ background: anon ? 'var(--faint)' : '#e4002b' }}
    >
      {actorInitial(entry)}
    </span>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      onClick={onClear}
      className="flex cursor-pointer items-center gap-1.5 rounded-full py-1 pl-2.5 pr-2 font-['Archivo'] text-[11.5px] font-semibold"
      style={{ border: '1px solid rgba(228,0,43,0.4)', background: 'rgba(228,0,43,0.12)', color: '#e4002b' }}
    >
      {label}
      <span className="font-['Space_Mono'] text-[10px]">✕</span>
    </button>
  );
}

function AuditRow({ entry, wide, dense, onOpen }: { entry: AuditLogEntry; wide: boolean; dense: boolean; onOpen: () => void }) {
  const failed = isFailureAction(entry.action);
  const detail = summarizeMetadata(entry.metadata);
  const actor = actorDisplay(entry);
  const actorInline = wide ? '' : `${actor.name}${actor.meta && actor.meta !== actor.name ? ' · ' + actor.meta : ''}`;

  return (
    <div
      className="group eb-row cursor-pointer border-b border-[var(--bord2)] hover:bg-[var(--hov)]"
      style={{ borderLeft: `3px solid ${failed ? '#e4002b' : 'transparent'}` }}
      onClick={onOpen}
    >
      <div
        className="grid items-center gap-3.5"
        style={{
          gridTemplateColumns: `52px minmax(0,auto) minmax(0,1fr)${wide ? ' minmax(0,170px) 72px' : ''}`,
          padding: dense ? '9px 18px' : '13px 18px',
        }}
      >
        <span className="font-['Space_Mono'] text-[11px] text-[var(--txm)]">{formatTime(entry.createdAt)}</span>
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          <ActionBadge action={entry.action} />
          {failed && <OutcomePill />}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-['Archivo'] text-[13px] text-[var(--tx)]">{actionLabel(entry.action)}</span>
          {detail && (
            <span className="mt-0.5 block truncate font-['Space_Mono'] text-[10px] text-[var(--faint)]">{detail}</span>
          )}
          {!wide && (
            <span className="mt-1 block truncate font-['Space_Mono'] text-[10px] text-[var(--txm)]">{actorInline}</span>
          )}
        </span>
        {wide && (
          <span className="flex min-w-0 items-center gap-2">
            <Avatar entry={entry} />
            <span className="min-w-0">
              <span className="block truncate font-['Archivo'] text-[12px] font-semibold text-[var(--txd)]">{actor.name}</span>
              <span className="block truncate font-['Space_Mono'] text-[9.5px] text-[var(--faint)]">{actor.meta}</span>
            </span>
          </span>
        )}
        {wide && (
          <span className="eb-open flex items-center justify-end font-['Space_Mono'] text-[10px] uppercase tracking-[0.1em] text-[var(--brand)] opacity-0 transition-opacity group-hover:opacity-100">
            Open →
          </span>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Detail drawer                                                              */
/* -------------------------------------------------------------------------- */

function DetailDrawer({
  entry,
  related,
  onClose,
  onFilterActor,
  onFilterAction,
}: {
  entry: AuditLogEntry;
  related: AuditLogEntry[];
  onClose: () => void;
  onFilterActor: () => void;
  onFilterAction: () => void;
}) {
  const failed = isFailureAction(entry.action);
  const actor = actorDisplay(entry);
  const metadata = (entry.metadata ?? {}) as Record<string, unknown>;
  const ip = typeof metadata.ip === 'string' ? metadata.ip : typeof metadata.ip_address === 'string' ? (metadata.ip_address as string) : '—';
  const client = typeof metadata.userAgent === 'string' ? metadata.userAgent : typeof metadata.agent === 'string' ? (metadata.agent as string) : '—';
  const target = entry.user ? `${entry.user.name} · ${entry.user.email}` : entry.userId || '—';

  const facts = [
    { label: 'Performed by', value: `${actor.name}${actor.meta ? ' · ' + actor.meta : ''}` },
    { label: 'Target', value: target },
    { label: 'Outcome', value: failed ? 'Failed' : 'Succeeded' },
    { label: 'Domain', value: categorizeAction(entry.action) },
    { label: 'IP address', value: ip },
    { label: 'Client', value: client },
  ];

  const copyPayload = () => {
    try {
      navigator.clipboard?.writeText(JSON.stringify(entry.metadata ?? {}, null, 2));
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/55" />
      <div className="eb-scroll relative flex h-full w-[520px] max-w-full flex-col overflow-y-auto border-l border-[var(--bord)] bg-[var(--surf)] shadow-[0_0_60px_rgba(0,0,0,0.5)]">
        <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-[var(--bord2)] bg-[var(--surf)] px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <ActionBadge action={entry.action} />
              {failed && <OutcomePill />}
            </div>
            <div className="mt-2 font-['Archivo'] text-[15px] font-bold leading-snug text-[var(--tx)]">
              {actionLabel(entry.action)}
            </div>
            <div className="mt-1 font-['Space_Mono'] text-[10px] uppercase tracking-[0.1em] text-[var(--txm)]">
              {formatFullTimestamp(entry.createdAt)}
            </div>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[var(--bord)] bg-[var(--surf2)] font-['Space_Mono'] text-[12px] text-[var(--txm)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            {facts.map((fact) => (
              <div key={fact.label} className="rounded-lg border border-[var(--bord2)] bg-[var(--surf2)] px-3 py-2.5">
                <div className="font-['Space_Mono'] text-[9px] uppercase tracking-[0.14em] text-[var(--faint)]">{fact.label}</div>
                <div className="mt-1 break-words font-['Archivo'] text-[12.5px] font-semibold text-[var(--tx)]">{fact.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="font-['Space_Mono'] text-[9.5px] uppercase tracking-[0.18em] text-[var(--faint)]">Payload</span>
              <button
                onClick={copyPayload}
                className="cursor-pointer rounded-md border border-[var(--bord)] bg-[var(--surf2)] px-2.5 py-1 font-['Space_Mono'] text-[9.5px] uppercase tracking-[0.1em] text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
              >
                Copy JSON
              </button>
            </div>
            <pre className="eb-scroll overflow-x-auto whitespace-pre-wrap break-all rounded-lg border border-[var(--bord2)] bg-[var(--surf2)] p-3.5 font-['Space_Mono'] text-[11px] leading-relaxed text-[var(--txd)]">
              {entry.metadata ? JSON.stringify(entry.metadata, null, 2) : 'No metadata recorded.'}
            </pre>
          </div>

          {related.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 font-['Space_Mono'] text-[9.5px] uppercase tracking-[0.18em] text-[var(--faint)]">
                Around this event
              </div>
              <div className="overflow-hidden rounded-lg border border-[var(--bord2)]">
                {related.map((r) => (
                  <button
                    key={r.id}
                    className="flex w-full cursor-pointer items-center gap-3 border-b border-[var(--bord2)] bg-transparent px-3.5 py-2.5 text-left last:border-b-0 hover:bg-[var(--hov)]"
                    onClick={() => onClose()}
                  >
                    <span className="font-['Space_Mono'] text-[10px] text-[var(--faint)]">{formatTime(r.createdAt)}</span>
                    <span className="min-w-0 flex-1 truncate font-['Archivo'] text-[12px] text-[var(--txd)]">
                      {actionLabel(r.action)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={onFilterActor}
              className="cursor-pointer rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-2 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
            >
              All by this person
            </button>
            <button
              onClick={onFilterAction}
              className="cursor-pointer rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-2 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
            >
              All {entry.action}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

function AuditLogsContent() {
  const { can } = usePermissions();
  const canManage = can('audit_logs:manage');
  const d = useAuditLogsData();
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div className="font-['Archivo'] text-[var(--tx)]">
      {/* header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-[300px] flex-1">
          <div className="mb-1.5 font-['Space_Mono'] text-[10.5px] uppercase tracking-[0.18em] text-[var(--brandsoft)]">
            System
          </div>
          <h1 className="font-['Anton'] text-[34px] uppercase leading-none text-[var(--tx)]">Audit Logs</h1>
          <p className="mt-2 max-w-[640px] font-['Archivo'] text-[13.5px] text-[var(--txm)]">
            An immutable record of every user and system action, kept for compliance and security review.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={d.refresh}
            disabled={d.loading}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf)] px-3.5 py-2.5 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${d.loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {canManage && (
            <div className="relative">
              <button
                onClick={() => setExportOpen((v) => !v)}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf)] px-3.5 py-2.5 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
              >
                <Download className="h-3.5 w-3.5" />
                Export
                <ChevronDown className="h-3 w-3 text-[var(--txm)]" />
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[200px] rounded-lg border border-[var(--bord)] bg-[var(--surf)] p-1 shadow-lg">
                  <div className="px-3 py-1.5 font-['Space_Mono'] text-[9.5px] uppercase tracking-[0.1em] text-[var(--faint)]">
                    {d.visible.length} rows with current filters
                  </div>
                  <button
                    onClick={() => {
                      setExportOpen(false);
                      d.exportLogs('csv');
                    }}
                    className="block w-full cursor-pointer rounded-md px-3 py-2 text-left font-['Archivo'] text-[12px] text-[var(--txd)] hover:bg-[var(--hov)]"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => {
                      setExportOpen(false);
                      d.exportLogs('json');
                    }}
                    className="block w-full cursor-pointer rounded-md px-3 py-2 text-left font-['Archivo'] text-[12px] text-[var(--txd)] hover:bg-[var(--hov)]"
                  >
                    Export JSON
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* stat cards */}
      <div className="mb-4 grid grid-cols-4 gap-3 max-[820px]:grid-cols-2">
        <StatCard
          label="Last 24 hours"
          value={d.stats.entriesLast24h}
          hint="entries recorded"
          onClick={() => {
            d.setTimeRange('24h');
            d.setOutcome('all');
          }}
        />
        <StatCard
          label="Failures"
          value={d.stats.failuresLast24h}
          hint="sign-ins and sends"
          accent
          onClick={() => {
            d.setOutcome('failures');
            d.setTimeRange('all');
          }}
        />
        <StatCard
          label="Settings changed"
          value={d.stats.settingsChangedLast24h}
          hint={`across ${d.stats.settingsSectionsLast24h} action${d.stats.settingsSectionsLast24h === 1 ? '' : 's'}`}
          onClick={() => d.setCategory('Settings')}
        />
        <StatCard
          label="Active people"
          value={d.stats.activePeopleLast24h}
          hint="admins and editors"
          onClick={() => d.setCategory('Users & roles')}
        />
      </div>

      {/* filter bar */}
      <div className="mb-3 rounded-xl border border-[var(--bord)] bg-[var(--surf)] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex min-w-[240px] flex-1 items-center gap-2.5 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3 py-2">
            <Search className="h-3.5 w-3.5 flex-shrink-0 text-[var(--txm)]" />
            <input
              type="text"
              placeholder="Search action, person, or payload…"
              value={d.search}
              onChange={(e) => d.setSearch(e.target.value)}
              className="w-full border-none bg-transparent font-['Archivo'] text-[12.5px] text-[var(--tx)] outline-none placeholder:text-[var(--faint)]"
            />
          </div>
          <select
            value={d.category}
            onChange={(e) => d.setCategory(e.target.value as AuditCategory | 'all')}
            className="eb-in w-[168px] py-2 text-[12.5px]"
          >
            <option value="all">All actions</option>
            {AUDIT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            value={d.outcome}
            onChange={(e) => d.setOutcome(e.target.value as OutcomeFilter)}
            className="eb-in w-[150px] py-2 text-[12.5px]"
          >
            <option value="all">All outcomes</option>
            <option value="failures">Failures only</option>
            <option value="success">Successful only</option>
          </select>
          <select
            value={d.timeRange}
            onChange={(e) => d.setTimeRange(e.target.value as TimeRangeFilter)}
            className="eb-in w-[150px] py-2 text-[12.5px]"
          >
            {(Object.keys(TIME_RANGE_LABEL) as TimeRangeFilter[]).map((range) => (
              <option key={range} value={range}>
                {TIME_RANGE_LABEL[range]}
              </option>
            ))}
          </select>
          <button
            onClick={() => d.setAdvancedOpen((v) => !v)}
            className="cursor-pointer rounded-[9px] px-3.5 py-2 font-['Archivo'] text-[12.5px]"
            style={{
              fontWeight: d.advancedOpen ? 700 : 600,
              border: `1px solid ${d.advancedOpen ? '#e4002b' : 'var(--bord)'}`,
              background: d.advancedOpen ? 'rgba(228,0,43,0.10)' : 'var(--surf2)',
              color: d.advancedOpen ? '#e4002b' : 'var(--txd)',
            }}
          >
            <SlidersHorizontal className="mr-1.5 -mt-0.5 inline h-3.5 w-3.5" />
            Advanced
          </button>
        </div>

        {d.advancedOpen && (
          <div className="mt-2.5 grid grid-cols-4 gap-2.5 border-t border-[var(--bord2)] pt-2.5 max-[900px]:grid-cols-2">
            <label className="block">
              <span className="mb-1 block font-['Space_Mono'] text-[9px] uppercase tracking-[0.14em] text-[var(--faint)]">From</span>
              <input type="date" className="eb-in" />
            </label>
            <label className="block">
              <span className="mb-1 block font-['Space_Mono'] text-[9px] uppercase tracking-[0.14em] text-[var(--faint)]">To</span>
              <input type="date" className="eb-in" />
            </label>
            <label className="block">
              <span className="mb-1 block font-['Space_Mono'] text-[9px] uppercase tracking-[0.14em] text-[var(--faint)]">Performed by</span>
              <input
                type="text"
                placeholder="name or email"
                value={d.actor}
                onChange={(e) => d.setActor(e.target.value)}
                className="eb-in"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-['Space_Mono'] text-[9px] uppercase tracking-[0.14em] text-[var(--faint)]">Payload contains</span>
              <input
                type="text"
                placeholder="e.g. login_otp"
                value={d.payload}
                onChange={(e) => d.setPayload(e.target.value)}
                className="eb-in"
              />
            </label>
          </div>
        )}

        {d.hasActiveFilters && (
          <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-[var(--bord2)] pt-2.5">
            <span className="font-['Space_Mono'] text-[9px] uppercase tracking-[0.14em] text-[var(--faint)]">Filtering</span>
            {d.activeFilterChips.map((chip) => (
              <FilterChip key={chip.key} label={chip.label} onClear={chip.clear} />
            ))}
            <button
              onClick={d.clearAll}
              className="cursor-pointer border-none bg-transparent p-0 font-['Space_Mono'] text-[9.5px] uppercase tracking-[0.1em] text-[var(--faint)] hover:text-[var(--brand)]"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {d.error && (
        <div className="mb-3 rounded-lg border border-[#e4002b]/30 bg-[#e4002b]/10 px-4 py-3 font-['Archivo'] text-[13px] text-[#e4002b]">
          {d.error}
        </div>
      )}

      {/* summary row */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3 px-1">
        <span className="font-['Space_Mono'] text-[10px] uppercase tracking-[0.1em] text-[var(--txm)]">
          {d.total === 0 ? 'No entries' : `Showing 1–${Math.min(d.visible.length, d.total)} of ${d.total.toLocaleString()} entries`}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => d.setDense((v) => !v)}
            className="cursor-pointer rounded-lg border border-[var(--bord)] bg-[var(--surf)] px-3 py-1.5 font-['Space_Mono'] text-[9.5px] uppercase tracking-[0.1em] text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            {d.dense ? 'Comfortable' : 'Compact'}
          </button>
          <select
            value={String(d.limit)}
            onChange={(e) => d.setLimit(parseInt(e.target.value, 10))}
            className="eb-in w-[112px] py-1.5 text-[12px]"
          >
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </select>
        </div>
      </div>

      {/* timeline */}
      <div className="overflow-hidden rounded-xl border border-[var(--bord)] bg-[var(--surf)]">
        {d.loading ? (
          <div className="animate-pulse space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-[var(--surf2)]" />
            ))}
          </div>
        ) : d.groups.length === 0 ? (
          <div className="px-5 py-14 text-center font-['Archivo'] text-[13px] text-[var(--txm)]">
            No audit logs found for the current filters.
          </div>
        ) : (
          d.groups.map((group) => (
            <div key={group.key}>
              <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-y border-[var(--bord2)] bg-[var(--surf2)] px-5 py-2 max-[600px]:px-3.5">
                <span className="font-['Space_Mono'] text-[10px] uppercase tracking-[0.14em] text-[var(--txd)]">
                  {group.label}
                </span>
                <span className="font-['Space_Mono'] text-[9.5px] uppercase tracking-[0.1em] text-[var(--faint)]">
                  {group.entries.length} {group.entries.length === 1 ? 'entry' : 'entries'}
                  {group.failureCount > 0 ? ` · ${group.failureCount} failed` : ''}
                </span>
              </div>
              {group.entries.map((entry) => (
                <AuditRow key={entry.id} entry={entry} wide={d.wide} dense={d.dense} onOpen={() => d.setOpenId(entry.id)} />
              ))}
            </div>
          ))
        )}
      </div>

      <p className="mt-3 px-1 font-['Archivo'] text-[11.5px] text-[var(--faint)]">
        Entries are immutable and retained for 24 months. Exports carry the filters applied above.
      </p>

      {d.hasMore && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={d.loadMore}
            disabled={d.isLoadingMore}
            className="cursor-pointer rounded-lg border border-[var(--bord)] bg-[var(--surf)] px-3.5 py-2 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)] disabled:opacity-50"
          >
            {d.isLoadingMore ? 'Loading…' : `${d.total - d.visible.length} older entries`}
          </button>
        </div>
      )}

      {d.openEntry && (
        <DetailDrawer
          entry={d.openEntry}
          related={d.relatedEntries}
          onClose={() => d.setOpenId(null)}
          onFilterActor={d.filterByActor}
          onFilterAction={d.filterByAction}
        />
      )}
    </div>
  );
}

/** Establishes its own PermissionProvider (matches the v2 Dashboard/Matches pattern). */
export default function AuditLogsPageV2() {
  return (
    <ErrorBoundary>
      <PermissionProvider>
        <AuditLogsContent />
      </PermissionProvider>
    </ErrorBoundary>
  );
}
