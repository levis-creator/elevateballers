import { useEffect, useState } from 'react';
import { AlertCircle, CalendarDays } from 'lucide-react';

type Fixture = {
  id: string;
  href: string;
  when: string;
  dateLabel: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  league: string;
  isHome: boolean;
  opponent: { name: string; nickname: string | null; logo: string | null };
  teamScore: number | null;
  oppScore: number | null;
  result: 'win' | 'loss' | 'draw' | null;
  lineup: { players: number; starters: number } | null;
};
type FixturesData = {
  season: { name: string } | null;
  leagueName: string | null;
  registered: boolean;
  live: Fixture[];
  upcoming: Fixture[];
  results: Fixture[];
};

const fixturesStyles = `.portal-fixtures-card{background:var(--portal-surface,#111010);border-color:var(--portal-border,rgba(255,255,255,.08))}.portal-fixtures-row{border-color:var(--portal-border-muted,rgba(255,255,255,.06))}.portal-fixtures-row:hover{background:var(--portal-surface-muted,rgba(255,255,255,.03))}.portal-fixtures-crest{border-color:var(--portal-border,rgba(255,255,255,.08));background:var(--portal-surface-muted,rgba(255,255,255,.03))}.portal-fixtures-tab{flex-shrink:0;min-height:40px;padding:9px 14px;border:1px solid var(--portal-border);border-radius:999px!important;background:var(--portal-surface-muted);color:var(--portal-muted,#8a817a);font-family:'Space Mono',monospace;font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap;cursor:pointer}.portal-fixtures-tab.fixtures-tab-active{border-color:#e4002b;background:rgba(228,0,43,.14);color:#ff5a72}.portal-fixtures-lineup{min-height:40px;padding:9px 14px;border:1px solid var(--portal-border);border-radius:9px;background:var(--portal-surface-muted);color:var(--portal-text-muted,#b8afa6);font-family:Archivo,sans-serif;font-size:12px;font-weight:700;white-space:nowrap;text-decoration:none}.portal-fixtures-lineup:hover{border-color:#e4002b;color:#e4002b}.portal-light .portal-fixtures-card,.portal-light .portal-fixtures-tab{--portal-surface:#fff;--portal-border:#e6e1d8;--portal-border-muted:#ece7df;--portal-surface-muted:#f4f1ea;--portal-muted:#6f665c;--portal-text:#141009;--portal-text-muted:#4a443d}.portal-light .portal-fixtures-card .text-cream{color:#141009!important}.portal-light .portal-fixtures-card .text-\\[\\#8a817a\\]{color:#6f665c!important}.portal-light .portal-fixtures-card .text-\\[\\#5f574e\\]{color:#9a9084!important}`;

const resultBadge = {
  win: ['W', 'border-[#4ea36a]/30 bg-[#4ea36a]/[0.12] text-[#4ea36a]'],
  loss: ['L', 'border-brand/30 bg-brand/[0.1] text-brandsoft'],
  draw: ['D', 'border-white/[0.12] bg-white/[0.06] text-[#b8afa6]'],
} as const;

export default function TeamPortalFixtures({
  teamId,
  teamName,
  lineupHref,
  matchHref,
}: {
  teamId: string;
  teamName: string;
  lineupHref: (matchId: string) => string;
  matchHref: (matchId: string) => string;
}) {
  const [data, setData] = useState<FixturesData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'results'>('upcoming');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/team-portal/fixtures?teamId=${encodeURIComponent(teamId)}`, { cache: 'no-store' })
      .then(async (response) => {
        const value = await response.json();
        if (!response.ok) throw new Error(value.error || 'Unable to load fixtures.');
        return value;
      })
      .then(setData)
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : 'Unable to load fixtures.')
      )
      .finally(() => setLoading(false));
  }, [teamId]);

  const upcoming = [...(data?.live ?? []), ...(data?.upcoming ?? [])];
  const results = data?.results ?? [];
  const rows = tab === 'upcoming' ? upcoming : results;

  return (
    <div className="mx-auto max-w-[1180px]">
      <style>{fixturesStyles}</style>
      <div className="mb-5">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-brandsoft">
          {[data?.season?.name, data?.leagueName].filter(Boolean).join(' · ') || 'Fixtures'}
        </p>
        <h1 className="font-display text-[36px] uppercase leading-none text-cream min-[900px]:text-[44px]">
          Fixtures
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
      {loading ? (
        <section className="portal-fixtures-card rounded-2xl border px-5 py-8 text-[13px] text-[#8a817a]">
          Loading fixtures…
        </section>
      ) : (
        <div className="grid gap-4">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Fixture lists">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'upcoming'}
              onClick={() => setTab('upcoming')}
              className={`portal-fixtures-tab ${tab === 'upcoming' ? 'fixtures-tab-active' : ''}`}
            >
              Upcoming {upcoming.length}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'results'}
              onClick={() => setTab('results')}
              className={`portal-fixtures-tab ${tab === 'results' ? 'fixtures-tab-active' : ''}`}
            >
              Results {results.length}
            </button>
          </div>
          {data && !data.registered && (
            <p className="text-[12.5px] text-[#8a817a]">
              {teamName} is not registered for the active season, so all past matches are shown.
            </p>
          )}
          <section
            aria-label={`${teamName} ${tab}`}
            className="portal-fixtures-card overflow-hidden rounded-2xl border"
          >
            {rows.length ? (
              rows.map((fixture) => (
                <FixtureRow
                  key={fixture.id}
                  fixture={fixture}
                  lineupHref={lineupHref}
                  matchHref={matchHref}
                />
              ))
            ) : (
              <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
                <CalendarDays className="h-8 w-8 text-[#5f574e]" />
                <h3 className="font-display text-[19px] uppercase text-cream">
                  {tab === 'upcoming' ? 'No fixtures scheduled' : 'No results yet'}
                </h3>
                <p className="max-w-[380px] text-[12.5px] text-[#8a817a]">
                  {tab === 'upcoming'
                    ? 'Matches will appear here once the league office publishes the schedule.'
                    : 'Final scores appear here after the league office publishes them.'}
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function FixtureRow({
  fixture,
  lineupHref,
  matchHref,
}: {
  fixture: Fixture;
  lineupHref: (matchId: string) => string;
  matchHref: (matchId: string) => string;
}) {
  const badge = fixture.result ? resultBadge[fixture.result] : null;
  const lineup = fixture.lineup;
  return (
    <div className="portal-fixtures-row flex flex-wrap items-center gap-4 border-b px-5 py-4 last:border-b-0">
      <div className="portal-fixtures-crest flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border">
        {fixture.opponent.logo ? (
          <img src={fixture.opponent.logo} alt="" className="h-full w-full object-contain p-1" />
        ) : (
          <span className="font-display text-[13px] text-[#b8afa6]">
            {fixture.opponent.name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <a href={matchHref(fixture.id)} className="min-w-[180px] flex-1 no-underline">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#8a817a]">
            {fixture.isHome ? 'vs' : '@'}
          </span>
          <span className="truncate text-[13.5px] font-bold text-cream">
            {fixture.opponent.name}
          </span>
          {fixture.status === 'LIVE' && (
            <span className="rounded-md border border-brand/40 bg-brand/[0.14] px-2 py-1 font-mono text-[8.5px] font-bold uppercase tracking-[0.08em] text-brandsoft">
              Live
            </span>
          )}
        </div>
        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#8a817a]">
          {fixture.status === 'COMPLETED' ? fixture.dateLabel : fixture.when}
          {fixture.league ? ` · ${fixture.league}` : ''}
        </div>
      </a>
      {fixture.teamScore != null && fixture.oppScore != null && (
        <div className="flex items-center gap-2.5">
          <span className="font-display text-[20px] leading-none text-cream">
            {fixture.teamScore}–{fixture.oppScore}
          </span>
          {badge && (
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-md border font-mono text-[10px] font-bold ${badge[1]}`}
            >
              {badge[0]}
            </span>
          )}
        </div>
      )}
      {fixture.status === 'UPCOMING' && lineup && (
        <div className="flex items-center gap-3">
          <span
            className={`font-mono text-[9.5px] uppercase tracking-[0.08em] ${lineup.players ? 'text-[#4ea36a]' : 'text-[#d99a2b]'}`}
          >
            {lineup.players
              ? `${lineup.players} listed · ${lineup.starters} starters`
              : 'No lineup yet'}
          </span>
          <a href={lineupHref(fixture.id)} className="portal-fixtures-lineup">
            {lineup.players ? 'Edit lineup' : 'Set lineup'}
          </a>
        </div>
      )}
    </div>
  );
}
