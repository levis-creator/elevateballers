import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, ListChecks, Lock } from 'lucide-react';

type MatchSummary = {
  id: string;
  href: string;
  when: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  isHome: boolean;
  opponent: { name: string; logo: string | null };
};
type RosterPlayer = {
  playerId: string;
  name: string;
  image: string | null;
  jerseyNumber: number | null;
  position: string | null;
};
type LineupRow = { playerId: string; started: boolean; jerseyNumber: number | null; name: string };
type LineupData = {
  season: { name: string } | null;
  registered: boolean;
  maxStarters?: number;
  maxBench?: number;
  matches: MatchSummary[];
  match: (MatchSummary & { locked: boolean }) | null;
  roster?: RosterPlayer[];
  lineup?: LineupRow[];
};
type Role = 'starter' | 'bench';

const lineupStyles = `.portal-lineup-card{background:var(--portal-surface,#111010);border-color:var(--portal-border,rgba(255,255,255,.08))}.portal-lineup-row{border-color:var(--portal-border-muted,rgba(255,255,255,.06))}.portal-lineup-number{border-color:var(--portal-border,rgba(255,255,255,.08));background:var(--portal-surface-muted,rgba(255,255,255,.03))}.portal-lineup-select{min-height:44px;border:1px solid var(--portal-border);border-radius:9px;background:var(--portal-surface-muted);padding:0 12px;font-family:Archivo,sans-serif;font-size:13px;color:var(--portal-text,#f3efe9);outline:none;max-width:100%}.portal-lineup-select:focus{border-color:#e4002b}.portal-lineup-seg{display:inline-flex;border:1px solid var(--portal-border);border-radius:9px;overflow:hidden}.portal-lineup-seg button{min-height:38px;min-width:64px;padding:0 10px;border:0;border-radius:0!important;background:var(--portal-surface-muted);color:var(--portal-muted,#8a817a);font-family:'Space Mono',monospace;font-size:9.5px;text-transform:uppercase;letter-spacing:.06em;cursor:pointer}.portal-lineup-seg button+button{border-left:1px solid var(--portal-border)}.portal-lineup-seg button:disabled{cursor:not-allowed;opacity:.45}.portal-lineup-seg button.seg-out{background:rgba(255,255,255,.08);color:var(--portal-text,#f3efe9)}.portal-lineup-seg button.seg-bench{background:rgba(217,154,43,.16);color:#d99a2b}.portal-lineup-seg button.seg-starter{background:rgba(228,0,43,.16);color:#ff5a72}.portal-lineup-save{min-height:44px;padding:0 18px;border:1px solid #e4002b;border-radius:9px;background:#e4002b;color:#fff;font-family:Archivo,sans-serif;font-size:12px;font-weight:700;cursor:pointer}.portal-lineup-save:disabled{cursor:not-allowed;opacity:.5}.portal-light .portal-lineup-card,.portal-light .portal-lineup-select{--portal-surface:#fff;--portal-border:#e6e1d8;--portal-border-muted:#ece7df;--portal-surface-muted:#f4f1ea;--portal-muted:#6f665c;--portal-text:#141009}.portal-light .portal-lineup-seg button.seg-out{background:#e6e1d8;color:#141009}.portal-light .portal-lineup-seg button.seg-starter{color:#e4002b}.portal-light .portal-lineup-card .text-cream{color:#141009!important}.portal-light .portal-lineup-card .text-\\[\\#8a817a\\]{color:#6f665c!important}.portal-light .portal-lineup-card .text-\\[\\#b8afa6\\]{color:#4a443d!important}`;

const toSelection = (rows: LineupRow[] = []) =>
  Object.fromEntries(rows.map((row) => [row.playerId, row.started ? 'starter' : 'bench'])) as Record<
    string,
    Role
  >;

export default function TeamPortalLineup({
  teamId,
  teamName,
  matchId,
  lineupHref,
}: {
  teamId: string;
  teamName: string;
  matchId?: string | null;
  lineupHref: (matchId: string) => string;
}) {
  const [data, setData] = useState<LineupData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<Record<string, Role>>({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ teamId });
    if (matchId) params.set('matchId', matchId);
    return fetch(`/api/team-portal/lineup?${params}`, { cache: 'no-store' })
      .then(async (response) => {
        const value = await response.json();
        if (!response.ok) throw new Error(value.error || 'Unable to load lineup.');
        return value as LineupData;
      })
      .then((value) => {
        setData(value);
        setSelection(toSelection(value.lineup));
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load lineup.'))
      .finally(() => setLoading(false));
  }, [teamId, matchId]);
  useEffect(() => {
    void load();
  }, [load]);

  const maxStarters = data?.maxStarters ?? 5;
  const maxBench = data?.maxBench ?? 7;
  const roster = data?.roster ?? [];
  const match = data?.match ?? null;
  const locked = match?.locked ?? false;
  const starters = Object.values(selection).filter((role) => role === 'starter').length;
  const bench = Object.values(selection).filter((role) => role === 'bench').length;
  const listed = Object.keys(selection).length;
  const initial = useMemo(() => toSelection(data?.lineup), [data]);
  const dirty =
    Object.keys(initial).length !== listed ||
    Object.entries(selection).some(([id, role]) => initial[id] !== role);
  const rosterIds = new Set(roster.map((p) => p.playerId));
  const offRoster = (data?.lineup ?? []).filter((row) => !rosterIds.has(row.playerId));

  const setRole = (playerId: string, role: Role | null) => {
    setSaveMessage(null);
    setSelection((current) => {
      const next = { ...current };
      if (role) next[playerId] = role;
      else delete next[playerId];
      return next;
    });
  };

  const save = async () => {
    if (!match) return;
    setSaving(true);
    setError(null);
    setSaveMessage(null);
    try {
      const response = await fetch('/api/team-portal/lineup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          matchId: match.id,
          players: Object.entries(selection)
            // Keep only players still on the roster; the API rejects anyone else.
            .filter(([playerId]) => rosterIds.has(playerId))
            .map(([playerId, role]) => ({ playerId, started: role === 'starter' })),
        }),
      });
      const value = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(value.error || 'Unable to save lineup.');
      await load();
      setSaveMessage(value.message || 'Lineup saved.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save lineup.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1180px]">
      <style>{lineupStyles}</style>
      <div className="mb-5">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-brandsoft">
          {data?.season?.name ? `${data.season.name} · Match-day squad` : 'Match-day squad'}
        </p>
        <h1 className="font-display text-[36px] uppercase leading-none text-cream min-[900px]:text-[44px]">
          Lineup
        </h1>
      </div>
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-center gap-2 rounded-xl border border-brand/30 bg-brand/[0.08] px-4 py-3 text-[13px] text-brandsoft"
        >
          <AlertCircle size={17} />
          {error}
        </div>
      )}
      {loading && !data ? (
        <section className="portal-lineup-card rounded-2xl border px-5 py-8 text-[13px] text-[#8a817a]">
          Loading lineup…
        </section>
      ) : !data ? null : !data.registered ? (
        <EmptyState
          title="Not registered this season"
          body={`${teamName} needs an approved season entry before lineups can be submitted.`}
        />
      ) : !match ? (
        <EmptyState
          title="No upcoming matches"
          body="Lineups open here once the league office schedules your next fixture."
        />
      ) : (
        <div className="grid gap-4">
          <section className="portal-lineup-card flex flex-wrap items-center gap-4 rounded-2xl border px-5 py-4">
            <label className="min-w-[240px] flex-1">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.1em] text-[#8a817a]">
                Match
              </span>
              <select
                className="portal-lineup-select w-full"
                value={match.id}
                onChange={(event) => window.location.assign(lineupHref(event.target.value))}
              >
                {!data.matches.some((m) => m.id === match.id) && (
                  <option value={match.id}>
                    {match.isHome ? 'vs' : '@'} {match.opponent.name} · {match.when}
                  </option>
                )}
                {data.matches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.isHome ? 'vs' : '@'} {m.opponent.name} · {m.when}
                    {m.status === 'LIVE' ? ' · LIVE' : ''}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-5">
              <Counter label="Starters" value={`${starters}/${maxStarters}`} warn={!locked && starters < maxStarters} />
              <Counter label="Bench" value={`${bench}/${maxBench}`} />
              <Counter label="Listed" value={`${listed}/${maxStarters + maxBench}`} />
            </div>
          </section>

          {locked ? (
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-[12.5px] text-[#b8afa6]">
              <Lock size={15} />
              {match.status === 'COMPLETED'
                ? 'This match is over, so its lineup is locked.'
                : 'This match has started, so the lineup is locked. The Court Console now manages who is on the floor.'}
            </div>
          ) : (
            <p className="text-[12.5px] text-[#8a817a]">
              Pick up to {maxStarters} starters and {maxBench} on the bench ({maxStarters + maxBench} players
              in total). The league office sees this lineup in the Court Console at tip-off. Changes are
              allowed until the match goes live.
            </p>
          )}
          {offRoster.length > 0 && !locked && (
            <p className="text-[12.5px] text-[#d99a2b]">
              {offRoster.map((row) => row.name).join(', ')}{' '}
              {offRoster.length === 1 ? 'is' : 'are'} no longer on your approved roster and will be
              removed from this lineup when you save.
            </p>
          )}

          <section
            aria-label={`${teamName} lineup`}
            className="portal-lineup-card overflow-hidden rounded-2xl border"
          >
            {roster.length ? (
              roster.map((player) => {
                const role = selection[player.playerId] ?? null;
                const starterFull = starters >= maxStarters && role !== 'starter';
                const benchFull = bench >= maxBench && role !== 'bench';
                return (
                  <div
                    key={player.playerId}
                    className="portal-lineup-row flex flex-wrap items-center gap-4 border-b px-5 py-3.5 last:border-b-0"
                  >
                    <div className="portal-lineup-number flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-lg border font-display text-[15px] leading-none text-[#b8afa6]">
                      {player.jerseyNumber ?? '—'}
                    </div>
                    <div className="min-w-[150px] flex-1">
                      <div className="truncate text-[13.5px] font-bold text-cream">{player.name}</div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#8a817a]">
                        {player.position || 'Position not set'}
                      </div>
                    </div>
                    <div
                      className="portal-lineup-seg"
                      role="radiogroup"
                      aria-label={`${player.name} match-day role`}
                    >
                      {(
                        [
                          [null, 'Out', 'seg-out'],
                          ['bench', 'Bench', 'seg-bench'],
                          ['starter', 'Starter', 'seg-starter'],
                        ] as const
                      ).map(([value, label, activeClass]) => (
                        <button
                          key={label}
                          type="button"
                          role="radio"
                          aria-checked={role === value}
                          disabled={
                            locked ||
                            (value === 'starter' && starterFull) ||
                            (value === 'bench' && benchFull)
                          }
                          title={
                            locked
                              ? undefined
                              : value === 'starter' && starterFull
                                ? `Only ${maxStarters} starters allowed`
                                : value === 'bench' && benchFull
                                  ? `Only ${maxBench} bench players allowed`
                                  : undefined
                          }
                          onClick={() => setRole(player.playerId, value)}
                          className={role === value ? activeClass : ''}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
                <ListChecks className="h-8 w-8 text-[#5f574e]" />
                <h3 className="font-display text-[19px] uppercase text-cream">No approved players</h3>
                <p className="max-w-[380px] text-[12.5px] text-[#8a817a]">
                  Only approved roster players can be named in a lineup.
                </p>
              </div>
            )}
          </section>

          {!locked && roster.length > 0 && (
            <div className="flex flex-wrap items-center justify-end gap-3">
              {saveMessage && !dirty && (
                <span role="status" className="flex items-center gap-1.5 text-[12.5px] text-[#4ea36a]">
                  <Check size={15} />
                  {saveMessage}
                </span>
              )}
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving || !dirty}
                className="portal-lineup-save"
              >
                {saving ? 'Saving…' : 'Save lineup'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Counter({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="text-right">
      <div className={`font-display text-[22px] leading-none ${warn ? 'text-[#d99a2b]' : 'text-cream'}`}>
        {value}
      </div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[#8a817a]">{label}</div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <section className="portal-lineup-card flex flex-col items-center gap-3 rounded-2xl border px-5 py-12 text-center">
      <ListChecks className="h-8 w-8 text-[#5f574e]" />
      <h3 className="font-display text-[19px] uppercase text-cream">{title}</h3>
      <p className="max-w-[380px] text-[12.5px] text-[#8a817a]">{body}</p>
    </section>
  );
}
