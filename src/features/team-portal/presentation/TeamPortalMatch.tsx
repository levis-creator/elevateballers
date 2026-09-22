import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, ExternalLink } from 'lucide-react';

type BoxRow = {
  playerId: string;
  name: string;
  jerseyNumber: number | null;
  started: boolean;
  minutes: number | null;
  pts?: number;
  reb?: number;
  ast?: number;
  stl?: number;
  blk?: number;
  pf?: number;
  fg?: string;
  tp?: string;
  ft?: string;
};
type MatchData = {
  match: {
    id: string;
    href: string;
    when: string;
    dateLabel: string;
    status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
    league: string;
    isHome: boolean;
    opponent: { name: string; logo: string | null };
    teamScore: number | null;
    oppScore: number | null;
    result: 'win' | 'loss' | 'draw' | null;
    lineup: { players: number; starters: number } | null;
  };
  resultPending: boolean;
  showStats: boolean;
  lineupEditable: boolean;
  quarters: Array<{ label: string; team: number; opp: number }>;
  hasPlayByPlay: boolean;
  players: BoxRow[];
  totals: { pts: number; reb: number; ast: number; stl: number; blk: number; pf: number } | null;
};

const statColumns = [
  ['pts', 'PTS'],
  ['reb', 'REB'],
  ['ast', 'AST'],
  ['stl', 'STL'],
  ['blk', 'BLK'],
  ['pf', 'PF'],
  ['fg', 'FG'],
  ['tp', '3PT'],
  ['ft', 'FT'],
] as const;

const resultBadge = {
  win: ['Win', 'border-[#4ea36a]/30 bg-[#4ea36a]/[0.12] text-[#4ea36a]'],
  loss: ['Loss', 'border-brand/30 bg-brand/[0.1] text-brandsoft'],
  draw: ['Draw', 'border-white/[0.12] bg-white/[0.06] text-[#b8afa6]'],
} as const;

const matchStyles = `.portal-match-card{background:var(--portal-surface,#111010);border-color:var(--portal-border,rgba(255,255,255,.08))}.portal-match-row{border-color:var(--portal-border-muted,rgba(255,255,255,.06))}.portal-match-crest{border-color:var(--portal-border,rgba(255,255,255,.08));background:var(--portal-surface-muted,rgba(255,255,255,.03))}.portal-match-link{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 14px;border:1px solid var(--portal-border,rgba(255,255,255,.08));border-radius:9px;background:var(--portal-surface-muted,rgba(255,255,255,.03));color:var(--portal-text-muted,#b8afa6);font-family:Archivo,sans-serif;font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap}.portal-match-link:hover{border-color:#e4002b;color:#e4002b}.portal-match-link.match-link-primary{border-color:#e4002b;background:#e4002b;color:#fff}.portal-light .portal-match-card,.portal-light .portal-match-link{--portal-surface:#fff;--portal-border:#e6e1d8;--portal-border-muted:#ece7df;--portal-surface-muted:#f4f1ea;--portal-text-muted:#4a443d}.portal-light .portal-match-link.match-link-primary{background:#e4002b;color:#fff}.portal-light .portal-match-card .text-cream{color:#141009!important}.portal-light .portal-match-card .text-\\[\\#8a817a\\]{color:#6f665c!important}.portal-light .portal-match-card .text-\\[\\#b8afa6\\]{color:#4a443d!important}`;

export default function TeamPortalMatch({
  teamId,
  teamName,
  matchId,
  fixturesHref,
  lineupHref,
  onOpenPlayer,
}: {
  teamId: string;
  teamName: string;
  matchId: string;
  fixturesHref: string;
  lineupHref: (matchId: string) => string;
  onOpenPlayer: (playerId: string) => string;
}) {
  const [data, setData] = useState<MatchData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ teamId, matchId });
    fetch(`/api/team-portal/match?${params}`, { cache: 'no-store' })
      .then(async (response) => {
        const value = await response.json();
        if (!response.ok) throw new Error(value.error || 'Unable to load this match.');
        return value;
      })
      .then(setData)
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : 'Unable to load this match.')
      )
      .finally(() => setLoading(false));
  }, [teamId, matchId]);

  const match = data?.match;
  const badge = match?.result ? resultBadge[match.result] : null;

  return (
    <div className="mx-auto max-w-[1180px]">
      <style>{matchStyles}</style>
      <a
        href={fixturesHref}
        className="mb-4 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8a817a] no-underline hover:text-brand"
      >
        <ArrowLeft size={13} />
        Back to fixtures
      </a>
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
        <section className="portal-match-card rounded-2xl border px-5 py-8 text-[13px] text-[#8a817a]">
          Loading match…
        </section>
      ) : data && match ? (
        <div className="grid gap-4">
          <section className="portal-match-card rounded-2xl border px-5 py-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-brandsoft">
                {match.status === 'LIVE'
                  ? 'Live now'
                  : match.status === 'UPCOMING'
                    ? 'Upcoming'
                    : data.resultPending
                      ? 'Result awaiting publication'
                      : 'Final'}
              </span>
              {match.league && (
                <span className="rounded border border-white/[0.08] px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-[#8a817a]">
                  {match.league}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span className="portal-match-crest flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border">
                {match.opponent.logo ? (
                  <img
                    src={match.opponent.logo}
                    alt=""
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <span className="font-display text-[15px] text-[#b8afa6]">
                    {match.opponent.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </span>
              <div className="min-w-[200px] flex-1">
                <h1 className="font-display text-[28px] uppercase leading-none text-cream min-[900px]:text-[34px]">
                  {match.isHome ? 'vs' : '@'} {match.opponent.name}
                </h1>
                <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-[#8a817a]">
                  {match.status === 'COMPLETED' ? match.dateLabel : match.when} ·{' '}
                  {match.isHome ? 'Home' : 'Away'}
                </p>
              </div>
              {match.teamScore != null && match.oppScore != null && (
                <div className="flex items-center gap-3">
                  <span className="font-display text-[40px] leading-none text-cream">
                    {match.teamScore}–{match.oppScore}
                  </span>
                  {badge && (
                    <span
                      className={`rounded-md border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] ${badge[1]}`}
                    >
                      {badge[0]}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.lineupEditable && (
                <a
                  href={lineupHref(match.id)}
                  className={`portal-match-link ${match.lineup?.players ? '' : 'match-link-primary'}`}
                >
                  {match.lineup?.players ? 'Edit lineup' : 'Set lineup'}
                </a>
              )}
              <a href={match.href} target="_blank" rel="noopener" className="portal-match-link">
                Public match page
                <ExternalLink size={13} />
              </a>
            </div>
          </section>

          {data.quarters.length > 0 && (
            <section
              aria-label="Score by period"
              className="portal-match-card overflow-x-auto rounded-2xl border"
            >
              <table className="w-full min-w-[360px] border-collapse text-left">
                <thead>
                  <tr className="portal-match-row border-b">
                    <th className="px-5 py-2.5 font-mono text-[9.5px] font-normal uppercase tracking-[0.08em] text-[#8a817a]">
                      Team
                    </th>
                    {data.quarters.map((q) => (
                      <th
                        key={q.label}
                        className="px-3 py-2.5 text-right font-mono text-[9.5px] font-normal uppercase tracking-[0.08em] text-[#8a817a]"
                      >
                        {q.label}
                      </th>
                    ))}
                    <th className="px-5 py-2.5 text-right font-mono text-[9.5px] font-normal uppercase tracking-[0.08em] text-[#8a817a]">
                      T
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      [teamName, 'team', match.teamScore],
                      [match.opponent.name, 'opp', match.oppScore],
                    ] as const
                  ).map(([name, side, total]) => (
                    <tr key={side} className="portal-match-row border-b last:border-b-0">
                      <td className="px-5 py-3 text-[13px] font-bold text-cream">{name}</td>
                      {data.quarters.map((q) => (
                        <td
                          key={q.label}
                          className="px-3 py-3 text-right font-display text-[15px] text-[#b8afa6]"
                        >
                          {q[side]}
                        </td>
                      ))}
                      <td className="px-5 py-3 text-right font-display text-[16px] text-cream">
                        {total ?? data.quarters.reduce((sum, q) => sum + q[side], 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <section
            aria-label={data.showStats ? `${teamName} box score` : `${teamName} match-day squad`}
            className="portal-match-card overflow-x-auto rounded-2xl border"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pb-2 pt-4">
              <h2 className="font-display text-[17px] uppercase leading-none text-cream">
                {data.showStats ? 'Box score' : 'Match-day squad'}
              </h2>
              <span className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-[#8a817a]">
                {data.players.length} listed · {data.players.filter((p) => p.started).length}{' '}
                starters
              </span>
            </div>
            {data.showStats && !data.hasPlayByPlay && data.players.length > 0 && (
              <p className="px-5 pb-2 text-[12.5px] text-[#8a817a]">
                Only the final score was recorded for this match, so there are no player stats.
              </p>
            )}
            {data.players.length ? (
              <table className="w-full min-w-[620px] border-collapse text-left">
                <thead>
                  <tr className="portal-match-row border-b">
                    <th className="px-5 py-2.5 font-mono text-[9.5px] font-normal uppercase tracking-[0.08em] text-[#8a817a]">
                      Player
                    </th>
                    <th className="px-2 py-2.5 text-right font-mono text-[9.5px] font-normal uppercase tracking-[0.08em] text-[#8a817a]">
                      MIN
                    </th>
                    {data.showStats &&
                      statColumns.map(([key, label]) => (
                        <th
                          key={key}
                          className="px-2 py-2.5 text-right font-mono text-[9.5px] font-normal uppercase tracking-[0.08em] text-[#8a817a]"
                        >
                          {label}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {data.players.map((row) => (
                    <tr
                      key={row.playerId}
                      className="portal-match-row cursor-pointer border-b hover:bg-white/[0.03]"
                      role="link"
                      tabIndex={0}
                      onClick={() => window.location.assign(onOpenPlayer(row.playerId))}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') window.location.assign(onOpenPlayer(row.playerId));
                      }}
                    >
                      <td className="px-5 py-3">
                        <span className="text-[13px] font-bold text-cream">{row.name}</span>
                        <span className="ml-2 font-mono text-[9.5px] uppercase tracking-[0.08em] text-[#8a817a]">
                          {row.jerseyNumber != null ? `#${row.jerseyNumber}` : ''}
                          {row.started ? ' · Starter' : ''}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-right font-display text-[14px] text-[#8a817a]">
                        {row.minutes ?? '—'}
                      </td>
                      {data.showStats &&
                        statColumns.map(([key]) => (
                          <td
                            key={key}
                            className={`px-2 py-3 text-right font-display text-[14px] ${key === 'pts' ? 'text-cream' : 'text-[#b8afa6]'}`}
                          >
                            {row[key] ?? '—'}
                          </td>
                        ))}
                    </tr>
                  ))}
                  {data.totals && (
                    <tr>
                      <td className="px-5 py-3 font-mono text-[9.5px] uppercase tracking-[0.1em] text-[#8a817a]">
                        Totals
                      </td>
                      <td />
                      {statColumns.map(([key]) => (
                        <td
                          key={key}
                          className="px-2 py-3 text-right font-display text-[14px] text-cream"
                        >
                          {(data.totals as Record<string, number>)[key] ?? ''}
                        </td>
                      ))}
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <p className="px-5 pb-5 pt-1 text-[12.5px] text-[#8a817a]">
                {match.status === 'UPCOMING'
                  ? 'No lineup submitted yet.'
                  : 'Only the final score was recorded for this match, so there is no box score.'}
              </p>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
