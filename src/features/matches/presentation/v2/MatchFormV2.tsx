import { useEffect, useRef, useState } from 'react';
import { PermissionProvider } from '@/features/rbac/usePermissions';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChevronLeft, Search, X, Users, CalendarClock, Trophy, Check, Save, Plus, AlertCircle } from 'lucide-react';
import type { MatchStatus } from '@prisma/client';
import { getTeamInitials } from '../../domain/usecases/team-helpers';
import { MATCH_STAGES, stageLabel, scoresUnlocked } from '../../domain/usecases/match-form';
import { useMatchForm, type TeamOption } from './hooks/useMatchForm';
import MatchRoster from './MatchRoster';

const HOME = '#e4002b';
const AWAY = '#2a6fdb';
const STATUSES: MatchStatus[] = ['UPCOMING', 'LIVE', 'COMPLETED'];

/* -------------------------------------------------------------------------- */

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-[var(--bord)] bg-[var(--surf)] ${className}`}>{children}</div>
);

function SectionHead({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--brand)]/[0.12] text-[var(--brand)]">
        {icon}
      </span>
      <div>
        <h2 className="font-['Anton'] text-[18px] uppercase leading-none text-[var(--tx)]">{title}</h2>
        <p className="mt-1 font-['Space_Mono'] text-[11px] text-[var(--txm)]">{sub}</p>
      </div>
    </div>
  );
}

const labelCls = "mb-1.5 block font-['Space_Mono'] text-[11px] uppercase tracking-[0.1em] text-[var(--txm)]";

/* --- Team combobox -------------------------------------------------------- */

function TeamPicker({
  label,
  accent,
  value,
  teams,
  onPick,
  onType,
  onClear,
}: {
  label: string;
  accent: string;
  value: { id: string; name: string };
  teams: TeamOption[];
  onPick: (t: TeamOption) => void;
  onType: (name: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value.name);
  const ref = useRef<HTMLDivElement>(null);

  // Sync when the field is reset/loaded externally (edit load, save & add another).
  useEffect(() => setQuery(value.name), [value.name]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = (q ? teams.filter((t) => t.name.toLowerCase().includes(q)) : teams).slice(0, 8);

  return (
    <div className="relative" ref={ref}>
      <label className={labelCls} style={{ color: accent }}>
        {label} <span className="text-[var(--brand)]">*</span>
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[var(--faint)]" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onType(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={`Search ${label.toLowerCase()}...`}
          className="eb-in !pl-9 !pr-8"
          aria-label={label}
        />
        {value.name && (
          <button
            type="button"
            aria-label={`Clear ${label}`}
            onClick={() => {
              onClear();
              setQuery('');
              setOpen(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--faint)] hover:text-[var(--tx)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-[var(--bord)] bg-[var(--surf)] py-1 shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
          {filtered.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                onPick(t);
                setQuery(t.name);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-[var(--hov)]"
            >
              <span
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-['Anton'] text-[10px]"
                style={{ background: `${accent}22`, color: accent }}
              >
                {getTeamInitials(t.name)}
              </span>
              <span className="font-['Archivo'] text-[13px] text-[var(--tx)]">{t.name}</span>
              {value.id === t.id && <Check className="ml-auto h-4 w-4 text-[var(--brand)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* --- Live preview --------------------------------------------------------- */

function PreviewCrest({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="flex h-14 w-14 items-center justify-center rounded-full font-['Anton'] text-[15px] uppercase"
      style={{ border: `2px solid ${name ? color : 'var(--bord)'}`, background: name ? `${color}1f` : 'transparent', color: name ? color : 'var(--faint)' }}
    >
      {name ? getTeamInitials(name) : '–'}
    </span>
  );
}

function statusMeta(s: MatchStatus) {
  if (s === 'LIVE') return { label: 'Live', color: '#e4002b' };
  if (s === 'COMPLETED') return { label: 'Completed', color: '#1f9d55' };
  return { label: 'Upcoming', color: '#d98324' };
}

function whenText(date: string): string {
  if (!date) return 'Not set';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return 'Not set';
  return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/* -------------------------------------------------------------------------- */

function MatchFormContent({ matchId, seasonId }: { matchId?: string; seasonId?: string }) {
  const f = useMatchForm({ matchId, seasonId });
  const { form } = f;
  const leagueName = f.leagues.find((l) => l.id === form.leagueId)?.name ?? '—';
  const status = statusMeta(form.status);
  const unlocked = scoresUnlocked(form.status);

  if (f.loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-16 rounded-2xl bg-[var(--surf)]" />
        <div className="grid grid-cols-[1.6fr_1fr] gap-5 max-[960px]:grid-cols-1">
          <div className="space-y-4">
            <div className="h-40 rounded-2xl bg-[var(--surf)]" />
            <div className="h-52 rounded-2xl bg-[var(--surf)]" />
          </div>
          <div className="h-64 rounded-2xl bg-[var(--surf)]" />
        </div>
      </div>
    );
  }

  const checks = [
    { label: 'Both teams selected', ok: f.checklist.teams },
    { label: 'Date & time set', ok: f.checklist.date },
    { label: 'League chosen', ok: f.checklist.league },
    { label: 'Season chosen', ok: f.checklist.season },
  ];

  return (
    <div className="font-['Archivo'] text-[var(--tx)]">
      {/* header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 font-['Space_Mono'] text-[11px] uppercase tracking-[0.16em] text-[var(--brandsoft)]">Competition</div>
          <h1 className="font-['Anton'] text-[34px] uppercase leading-none text-[var(--tx)]">{f.editing ? 'Edit Match' : 'Create Match'}</h1>
          <p className="mt-1.5 font-['Archivo'] text-[14px] text-[var(--txd)]">Schedule a fixture and, optionally, record its result.</p>
        </div>
        <a
          href="/admin/matches"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--bord)] px-3.5 py-2.5 font-['Archivo'] text-[12px] font-extrabold uppercase tracking-[0.05em] text-[var(--txd)] no-underline hover:text-[var(--tx)]"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Matches
        </a>
      </div>

      {f.error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--brand)]/40 bg-[var(--brand)]/[0.08] px-4 py-3 font-['Archivo'] text-[13px] text-[var(--brandsoft)]">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {f.error}
        </div>
      )}
      {f.savedCount > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#1f9d55]/40 bg-[#1f9d55]/[0.08] px-4 py-3 font-['Archivo'] text-[13px] text-[#3fce85]">
          <Check className="h-4 w-4 flex-shrink-0" /> Added {f.savedCount} match{f.savedCount === 1 ? '' : 'es'}. Enter the next one below.
        </div>
      )}

      <div className="grid grid-cols-[1.6fr_1fr] gap-5 max-[960px]:grid-cols-1">
        {/* left: form */}
        <div className="space-y-4">
          <Card className="p-6 max-[600px]:p-4">
            <SectionHead icon={<Users className="h-[18px] w-[18px]" />} title="Matchup" sub={`Pick both teams · ${f.teams.length} available`} />
            <div className="flex items-end gap-3 max-[520px]:flex-col max-[520px]:items-stretch">
              <div className="flex-1">
                <TeamPicker
                  label="Home Team"
                  accent={HOME}
                  value={{ id: form.team1Id, name: form.team1Name }}
                  teams={f.teams.filter((t) => t.id !== form.team2Id)}
                  onPick={(t) => f.pickTeam(1, t)}
                  onType={(n) => f.typeTeam(1, n)}
                  onClear={() => f.clearTeam(1)}
                />
              </div>
              <span className="pb-2.5 font-['Anton'] text-[15px] text-[var(--faint)] max-[520px]:self-center max-[520px]:pb-0">VS</span>
              <div className="flex-1">
                <TeamPicker
                  label="Away Team"
                  accent={AWAY}
                  value={{ id: form.team2Id, name: form.team2Name }}
                  teams={f.teams.filter((t) => t.id !== form.team1Id)}
                  onPick={(t) => f.pickTeam(2, t)}
                  onType={(n) => f.typeTeam(2, n)}
                  onClear={() => f.clearTeam(2)}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 max-[600px]:p-4">
            <SectionHead icon={<CalendarClock className="h-[18px] w-[18px]" />} title="Match Details" sub="Date, league, season and stage" />
            <div className="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
              <div>
                <label className={labelCls}>Date &amp; Time <span className="text-[var(--brand)]">*</span></label>
                <input type="datetime-local" value={form.date} onChange={(e) => f.setField('date', e.target.value)} className="eb-in [color-scheme:dark]" />
              </div>
              <div>
                <label className={labelCls}>League <span className="text-[var(--brand)]">*</span></label>
                <select value={form.leagueId} onChange={(e) => f.setField('leagueId', e.target.value)} className="eb-in cursor-pointer">
                  <option value="">Select a league…</option>
                  {f.leagues.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Season <span className="text-[var(--brand)]">*</span></label>
                <select value={form.seasonId} onChange={(e) => f.setField('seasonId', e.target.value)} disabled={!form.leagueId} className="eb-in cursor-pointer">
                  <option value="">{form.leagueId ? 'Select a season…' : 'Select a league first'}</option>
                  {f.seasons.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Match Stage <span className="text-[var(--brand)]">*</span></label>
                <select value={form.stage} onChange={(e) => f.setField('stage', e.target.value as typeof form.stage)} className="eb-in cursor-pointer">
                  {MATCH_STAGES.map((s) => (
                    <option key={s} value={s}>{stageLabel(s)}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="mt-3 font-['Archivo'] text-[12px] text-[var(--txm)]">
              Pick a league first to load its seasons. Use <span className="text-[var(--txd)]">Regular Season</span> for ordinary league games.
            </p>
          </Card>

          <Card className="p-6 max-[600px]:p-4">
            <SectionHead icon={<Trophy className="h-[18px] w-[18px]" />} title="Result" sub="Only needed once the game is played" />
            <label className={labelCls}>Status</label>
            <div className="mb-4 inline-flex gap-1 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] p-1">
              {STATUSES.map((s) => {
                const on = form.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => f.setField('status', s)}
                    className={`rounded-md px-4 py-1.5 font-['Archivo'] text-[11px] font-extrabold uppercase tracking-[0.05em] transition-colors ${
                      on ? 'bg-[var(--brand)] text-white' : 'text-[var(--txm)] hover:text-[var(--tx)]'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-4 max-[520px]:grid-cols-1">
              <div>
                <label className={labelCls} style={{ color: HOME }}>Home Score</label>
                <input type="number" min={0} max={999} value={form.team1Score} onChange={(e) => f.setField('team1Score', e.target.value)} disabled={!unlocked} placeholder="0" className="eb-in" />
              </div>
              <div>
                <label className={labelCls} style={{ color: AWAY }}>Away Score</label>
                <input type="number" min={0} max={999} value={form.team2Score} onChange={(e) => f.setField('team2Score', e.target.value)} disabled={!unlocked} placeholder="0" className="eb-in" />
              </div>
              <div>
                <label className={labelCls}>Duration (min)</label>
                <input type="number" min={0} value={form.duration} onChange={(e) => f.setField('duration', e.target.value)} placeholder="e.g. 40" className="eb-in" />
              </div>
            </div>
            <p className="mt-3 font-['Archivo'] text-[12px] text-[var(--txm)]">
              Scores unlock when status is <span className="text-[var(--txd)]">Completed</span> or <span className="text-[var(--txd)]">Live</span>.
            </p>
          </Card>

          {/* actions */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => f.submit('save')}
              disabled={!f.canSubmit}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] px-5 py-2.5 font-['Archivo'] text-[12px] font-extrabold uppercase tracking-[0.05em] text-white shadow-[0_6px_18px_rgba(228,0,43,0.3)] hover:bg-[var(--brandlt)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              <Save className="h-4 w-4" /> {f.saving ? 'Saving…' : f.editing ? 'Save Changes' : 'Create Match'}
            </button>
            {!f.editing && (
              <button
                type="button"
                onClick={() => f.submit('again')}
                disabled={!f.canSubmit}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--bord)] px-4 py-2.5 font-['Archivo'] text-[12px] font-extrabold uppercase tracking-[0.05em] text-[var(--txd)] hover:text-[var(--tx)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> Save &amp; add another
              </button>
            )}
            <a href="/admin/matches" className="rounded-lg px-4 py-2.5 font-['Archivo'] text-[12px] font-extrabold uppercase tracking-[0.05em] text-[var(--txm)] no-underline hover:text-[var(--tx)]">
              Cancel
            </a>
          </div>
        </div>

        {/* right: preview + checklist */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="border-b border-[var(--bord2)] px-5 py-3 font-['Space_Mono'] text-[10px] uppercase tracking-[0.14em] text-[var(--txm)]">Live Preview</div>
            <div className="relative overflow-hidden p-5">
              <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(90% 120% at 50% -10%, rgba(228,0,43,0.12), transparent 60%)' }} />
              <div className="relative">
                <div className="mb-4 flex justify-center">
                  <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-['Space_Mono'] text-[10px] font-bold uppercase tracking-[0.1em]" style={{ background: `${status.color}1f`, color: status.color }}>
                    <span className="h-[6px] w-[6px] rounded-full" style={{ background: status.color }} /> {status.label}
                  </span>
                </div>
                <div className="flex items-center justify-around gap-2">
                  <div className="flex flex-1 flex-col items-center gap-2 text-center">
                    <PreviewCrest name={form.team1Name} color={HOME} />
                    <span className="font-['Anton'] text-[12px] uppercase text-[var(--tx)]">{form.team1Name || 'Home Team'}</span>
                  </div>
                  <span className="font-['Anton'] text-[16px] text-[var(--faint)]">VS</span>
                  <div className="flex flex-1 flex-col items-center gap-2 text-center">
                    <PreviewCrest name={form.team2Name} color={AWAY} />
                    <span className="font-['Anton'] text-[12px] uppercase text-[var(--tx)]">{form.team2Name || 'Away Team'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-[var(--bord2)] px-5 py-4 font-['Space_Mono'] text-[11px]">
              {[
                { k: 'When', v: whenText(form.date) },
                { k: 'League', v: leagueName },
                { k: 'Stage', v: form.stage ? stageLabel(form.stage) : '—' },
              ].map((row) => (
                <div key={row.k} className="flex items-center justify-between">
                  <span className="text-[var(--txm)]">{row.k}</span>
                  <span className="text-[var(--txd)]">{row.v}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 font-['Space_Mono'] text-[10px] uppercase tracking-[0.14em] text-[var(--txm)]">Before You Save</div>
            <div className="flex flex-col gap-2.5">
              {checks.map((c) => (
                <div key={c.label} className="flex items-center gap-2.5">
                  <span
                    className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full"
                    style={c.ok ? { background: '#1f9d55', color: '#fff' } : { border: '1.5px solid var(--bord)' }}
                  >
                    {c.ok && <Check className="h-[11px] w-[11px]" />}
                  </span>
                  <span className={`font-['Archivo'] text-[13px] ${c.ok ? 'text-[var(--tx)]' : 'text-[var(--txm)]'}`}>{c.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Roster management only makes sense once the match exists (edit mode). */}
      {f.editing && (
        <MatchRoster
          matchId={matchId}
          team1Id={form.team1Id}
          team1Name={form.team1Name}
          team2Id={form.team2Id}
          team2Name={form.team2Name}
        />
      )}

      <div className="py-6 text-center font-['Space_Mono'] text-[11px] tracking-[0.04em] text-[var(--faint)]">Elevate Ballers CMS · v2 · Nairobi, Kenya</div>
    </div>
  );
}

export default function MatchFormV2({ matchId, seasonId }: { matchId?: string; seasonId?: string }) {
  return (
    <ErrorBoundary>
      <PermissionProvider>
        <MatchFormContent matchId={matchId} seasonId={seasonId} />
      </PermissionProvider>
    </ErrorBoundary>
  );
}
