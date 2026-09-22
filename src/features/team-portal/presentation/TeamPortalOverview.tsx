import { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, CircleAlert, CircleCheck, Clock } from 'lucide-react';
import type { NeedsYouItem, NeedsYouTarget } from '../domain/entities/needs-you';

type NextFixture = {
  id: string;
  href: string;
  when: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  league: string;
  isHome: boolean;
  opponent: { name: string; logo: string | null };
  lineup: { players: number; starters: number } | null;
};
type OverviewData = {
  season: { name: string } | null;
  leagueName: string | null;
  registered: boolean;
  nextFixture: NextFixture | null;
  record: { played: number; wins: number; losses: number; draws: number; winPct: number };
  tablePosition: number | null;
  tableSize: number | null;
  form: Array<'W' | 'L' | 'D'>;
  needsYou: NeedsYouItem[];
};

const formBadge = {
  W: 'border-[#4ea36a]/30 bg-[#4ea36a]/[0.12] text-[#4ea36a]',
  L: 'border-brand/30 bg-brand/[0.1] text-brandsoft',
  D: 'border-white/[0.12] bg-white/[0.06] text-[#b8afa6]',
} as const;

const overviewStyles = `.portal-needs-row{border-color:rgba(255,255,255,.06);text-decoration:none}.portal-needs-row:hover{background:rgba(255,255,255,.04)}.portal-overview-link{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 14px;border:1px solid rgba(255,255,255,.08);border-radius:9px;background:rgba(255,255,255,.03);color:#b8afa6;font-family:Archivo,sans-serif;font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap}.portal-overview-link:hover{border-color:#e4002b;color:#e4002b}.portal-overview-link.overview-link-primary{border-color:#e4002b;background:#e4002b;color:#fff}.portal-light .portal-needs-row{border-color:#ece7df}.portal-light .portal-needs-row:hover{background:#f4f1ea}.portal-light .portal-overview-link{border-color:#e6e1d8;background:#f4f1ea;color:#4a443d}.portal-light .portal-overview-link.overview-link-primary{border-color:#e4002b;background:#e4002b;color:#fff}`;

export default function TeamPortalOverview({
  teamId,
  teamName,
  roleLabel,
  hrefFor,
}: {
  teamId: string;
  teamName: string;
  roleLabel: string;
  hrefFor: (
    target: NeedsYouTarget | { view: 'fixtures' | 'stats' } | { view: 'match'; matchId: string }
  ) => string;
}) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/team-portal/overview?teamId=${encodeURIComponent(teamId)}`, { cache: 'no-store' })
      .then(async (response) => {
        const value = await response.json();
        if (!response.ok) throw new Error(value.error || 'Unable to load your team overview.');
        return value;
      })
      .then(setData)
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : 'Unable to load your team overview.')
      )
      .finally(() => setLoading(false));
  }, [teamId]);

  const next = data?.nextFixture ?? null;
  const record = data?.record;
  const needsYou = data?.needsYou ?? [];
  const actionCount = needsYou.filter((item) => item.kind === 'action').length;

  return (
    <div className="mx-auto max-w-[1180px]">
      <style>{overviewStyles}</style>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-brandsoft">
            {[data?.season?.name, data?.leagueName].filter(Boolean).join(' · ') || 'Team Portal'}
          </p>
          <h1 className="font-display text-[36px] uppercase leading-none text-cream min-[900px]:text-[44px]">
            Welcome back
          </h1>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-[#8a817a]">
            Everything here is scoped to {teamName}.
          </p>
        </div>
        <div className="portal-team-role rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8a817a]">
          {teamName} · {roleLabel}
        </div>
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
      <section className="portal-panel overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111010]">
        <div className="flex flex-wrap items-stretch">
          <div className="min-w-[290px] flex-1 px-5 py-5">
            <div className="mb-3 flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-brandsoft">
                {next?.status === 'LIVE' ? 'Live now' : 'Next fixture'}
              </span>
              {next?.league && (
                <span className="rounded border border-white/[0.08] px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-[#8a817a]">
                  {next.league}
                </span>
              )}
            </div>
            {loading ? (
              <p className="text-[13px] text-[#8a817a]">Loading…</p>
            ) : next ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] font-display text-[14px] text-[#b8afa6]">
                    {next.opponent.logo ? (
                      <img src={next.opponent.logo} alt="" className="h-full w-full object-contain p-1" />
                    ) : (
                      next.opponent.name.slice(0, 2).toUpperCase()
                    )}
                  </span>
                  <span className="font-display text-[26px] uppercase leading-none text-cream">
                    {next.isHome ? 'vs' : '@'} {next.opponent.name}
                  </span>
                </div>
                <p className="mt-3 text-[13px] text-[#b8afa6]">
                  {next.when}
                  {next.lineup
                    ? next.lineup.players
                      ? ` · ${next.lineup.players} listed, ${next.lineup.starters} starters`
                      : ' · No lineup submitted yet'
                    : ''}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {next.status === 'UPCOMING' && (
                    <a
                      href={hrefFor({ view: 'lineup', matchId: next.id })}
                      className={`portal-overview-link ${next.lineup?.players ? '' : 'overview-link-primary'}`}
                    >
                      {next.lineup?.players ? 'Edit lineup' : 'Set lineup'}
                    </a>
                  )}
                  <a href={hrefFor({ view: 'match', matchId: next.id })} className="portal-overview-link">
                    Match details
                  </a>
                  <a href={hrefFor({ view: 'fixtures' })} className="portal-overview-link">
                    All fixtures
                  </a>
                </div>
              </>
            ) : (
              <>
                <div className="font-display text-[26px] uppercase leading-none text-cream">
                  No fixture scheduled
                </div>
                <p className="mt-3 text-[13px] text-[#b8afa6]">
                  Your next match appears here once the league office publishes the schedule.
                </p>
              </>
            )}
          </div>
          <div className="flex min-w-[290px] flex-1 flex-col justify-center gap-3 border-l border-white/[0.06] px-5 py-5 max-[860px]:border-l-0 max-[860px]:border-t">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-brandsoft">
              {data?.registered ? 'This season' : 'All published results'}
            </span>
            <div className="flex flex-wrap items-end gap-6">
              <Figure
                label="Record"
                value={
                  record
                    ? record.draws
                      ? `${record.wins}–${record.losses}–${record.draws}`
                      : `${record.wins}–${record.losses}`
                    : '—'
                }
              />
              <Figure
                label="Win rate"
                value={record?.played ? `${Math.round(record.winPct)}%` : '—'}
              />
              <Figure
                label="Table"
                value={data?.tablePosition ? `#${data.tablePosition}${data.tableSize ? ` / ${data.tableSize}` : ''}` : '—'}
              />
            </div>
            {data?.form.length ? (
              <div className="flex gap-1.5" aria-label={`Recent form: ${data.form.join(' ')}`}>
                {data.form.map((result, index) => (
                  <span
                    key={index}
                    className={`flex h-6 w-6 items-center justify-center rounded-md border font-mono text-[10px] font-bold ${formBadge[result]}`}
                  >
                    {result}
                  </span>
                ))}
              </div>
            ) : null}
            <a href={hrefFor({ view: 'stats' })} className="portal-overview-link w-fit">
              Team stats
            </a>
          </div>
        </div>
      </section>
      <section className="portal-panel mt-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111010]">
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="min-w-[200px] flex-1">
            <h2 className="font-display text-[17px] uppercase leading-none text-cream">Needs you</h2>
            <p className="mt-1 text-[12px] text-[#8a817a]">
              Things to do for your team, and anything waiting on the league office.
            </p>
          </div>
          <span className="needs-clear rounded-xl border border-white/[0.1] bg-white/[0.04] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[#8a817a]">
            {loading ? '…' : actionCount ? `${actionCount} to do` : 'Clear'}
          </span>
        </div>
        {!loading && needsYou.length ? (
          needsYou.map((item) => (
            <a
              key={item.key}
              href={hrefFor(item.target)}
              className="portal-needs-row flex items-center gap-3 border-b px-5 py-4 last:border-b-0"
            >
              <span
                className={`flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-xl ${item.kind === 'action' ? 'bg-brand/[0.14] text-brandsoft' : 'bg-[#d99a2b]/[0.16] text-[#d99a2b]'}`}
              >
                {item.kind === 'action' ? (
                  <CircleAlert size={15} strokeWidth={1.8} />
                ) : (
                  <Clock size={15} strokeWidth={1.8} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-bold text-cream">{item.title}</span>
                <span className="block text-[12px] text-[#8a817a]">{item.detail}</span>
              </span>
              <ArrowRight size={15} className="flex-shrink-0 text-[#8a817a]" />
            </a>
          ))
        ) : (
          <div className="flex flex-col items-center gap-2 px-5 py-9 text-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4ea36a]/[0.14] text-[#4ea36a]">
              <CircleCheck size={16} strokeWidth={1.8} />
            </span>
            <div className="text-[13.5px] font-bold text-cream">
              {loading ? 'Checking your team…' : 'Nothing waiting on you'}
            </div>
            {!loading && (
              <div className="max-w-[380px] text-[12px] text-[#8a817a]">
                Lineup reminders, season entry updates and roster reviews will show up here.
              </div>
            )}
          </div>
        )}
      </section>
      <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-[#5f574e]">
        Team-scoped access · managed by System Admins
      </p>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-[26px] leading-none text-cream">{value}</div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#8a817a]">{label}</div>
    </div>
  );
}
