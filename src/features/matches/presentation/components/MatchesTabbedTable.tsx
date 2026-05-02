import React, { useState } from 'react';
import { formatMatchDate, formatMatchTime, getRelativeTimeDescription } from '../../lib/utils';

type FixtureRow = {
  id: string;
  // Public URL slug. Prefer this over `id` when constructing /matches/... links.
  slug?: string | null;
  date: Date | string;
  team1Name: string;
  team1Logo?: string | null;
  team2Name: string;
  team2Logo?: string | null;
  league: string;
  venue?: string;
  status: string;
};

type ResultRow = {
  id: string;
  // Public URL slug. Prefer this over `id` when constructing /matches/... links.
  slug?: string | null;
  date: Date | string;
  team1Name: string;
  team1Logo?: string | null;
  team2Name: string;
  team2Logo?: string | null;
  team1Score: number | string;
  team2Score: number | string;
  league: string;
  winnerName?: string;
  status: string;
};

function matchPath(row: { slug?: string | null; id: string }): string {
  return row.slug || row.id;
}

type TabKey = 'fixtures' | 'results';

interface MatchesTabbedTableProps {
  fixtures: FixtureRow[];
  results: ResultRow[];
  initialTab?: TabKey;
}

const PAGE_SIZE = 8;

const STATUS_STYLES: Record<string, string> = {
  UPCOMING: 'bg-blue-500/15 text-blue-200 ring-blue-400/30',
  LIVE: 'bg-red-500/15 text-red-200 ring-red-400/30',
  COMPLETED: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/30',
  POSTPONED: 'bg-amber-500/15 text-amber-200 ring-amber-400/30',
  CANCELLED: 'bg-slate-500/15 text-slate-200 ring-slate-400/30',
};

function statusClass(status: string) {
  return STATUS_STYLES[status] ?? 'bg-slate-500/15 text-slate-200 ring-slate-400/30';
}

function teamAbbr(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'TM';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

function openMatch(matchPathId: string) {
  window.location.href = `/matches/${matchPathId}/`;
}

function handleRowKeyDown(event: React.KeyboardEvent<HTMLElement>, matchId: string) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    openMatch(matchId);
  }
}

function FixtureTable({ matches }: { matches: FixtureRow[] }) {
  if (matches.length === 0) {
    return <EmptyState title="No upcoming fixtures" copy="New games will appear here once the schedule is published." />;
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-[#151321] shadow-[0_18px_48px_rgba(0,0,0,0.28)] md:block">
        <table className="match-center-table w-full border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-left text-[0.72rem] uppercase tracking-[0.24em] text-gray-400">
              <th className="px-5 py-4 font-semibold">Date</th>
              <th className="px-5 py-4 font-semibold">Time</th>
              <th className="px-5 py-4 font-semibold">Match</th>
              <th className="px-5 py-4 font-semibold">League</th>
              <th className="px-5 py-4 font-semibold">Venue</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold text-right">Details</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => (
              <tr
                key={match.id}
                tabIndex={0}
                role="link"
                aria-label={`Open match: ${match.team1Name} vs ${match.team2Name}`}
                onClick={() => openMatch(matchPath(match))}
                onKeyDown={(event) => handleRowKeyDown(event, matchPath(match))}
                className="cursor-pointer border-b border-white/8 text-sm text-gray-100 transition-colors hover:bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-[#ffba00]/70 focus:ring-inset"
              >
                <td className="px-5 py-4 align-middle">
                  <div className="font-semibold text-white">{formatMatchDate(match.date)}</div>
                  <div className="text-xs text-gray-400">{getRelativeTimeDescription(match.date)}</div>
                </td>
                <td className="px-5 py-4 align-middle text-gray-300">{formatMatchTime(match.date)}</td>
                <td className="px-5 py-4 align-middle">
                  <MatchupCell
                    homeTeam={match.team1Name}
                    awayTeam={match.team2Name}
                    homeLogo={match.team1Logo}
                    awayLogo={match.team2Logo}
                  />
                </td>
                <td className="px-5 py-4 align-middle text-gray-300">{match.league}</td>
                <td className="px-5 py-4 align-middle text-gray-300">{match.venue || 'TBA'}</td>
                <td className="px-5 py-4 align-middle">
                  <StatusBadge status={match.status} />
                </td>
                <td className="px-5 py-4 align-middle text-right">
                  <a
                    href={`/matches/${matchPath(match)}/`}
                    onClick={(event) => event.stopPropagation()}
                    className="text-sm font-semibold text-[#ffba00] no-underline transition-colors hover:text-white"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 md:hidden">
        {matches.map((match) => (
          <a
            key={match.id}
            href={`/matches/${matchPath(match)}/`}
            className="block rounded-2xl border border-white/10 bg-[#151321] p-4 no-underline shadow-[0_12px_30px_rgba(0,0,0,0.22)]"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">{formatMatchDate(match.date)}</div>
                <div className="text-xs text-gray-400">{formatMatchTime(match.date)} • {getRelativeTimeDescription(match.date)}</div>
              </div>
              <StatusBadge status={match.status} />
            </div>
            <MatchupCard
              homeTeam={match.team1Name}
              awayTeam={match.team2Name}
              homeLogo={match.team1Logo}
              awayLogo={match.team2Logo}
            />
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs text-gray-400">
              <span className="truncate">{match.league}</span>
              <span className="truncate">{match.venue || 'TBA'}</span>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}

function ResultsTableView({ matches }: { matches: ResultRow[] }) {
  if (matches.length === 0) {
    return <EmptyState title="No recent results" copy="Completed games will show up here after the final whistle." />;
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-[#151321] shadow-[0_18px_48px_rgba(0,0,0,0.28)] md:block">
        <table className="match-center-table w-full border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-left text-[0.72rem] uppercase tracking-[0.24em] text-gray-400">
              <th className="px-5 py-4 font-semibold">Date</th>
              <th className="px-5 py-4 font-semibold">Match</th>
              <th className="px-5 py-4 font-semibold text-center">Score</th>
              <th className="px-5 py-4 font-semibold">League</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold text-right">Details</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => {
              const team1Won = match.winnerName === match.team1Name;
              const team2Won = match.winnerName === match.team2Name;

              return (
                <tr
                  key={match.id}
                  tabIndex={0}
                  role="link"
                  aria-label={`Open result: ${match.team1Name} vs ${match.team2Name}`}
                  onClick={() => openMatch(matchPath(match))}
                  onKeyDown={(event) => handleRowKeyDown(event, matchPath(match))}
                  className="cursor-pointer border-b border-white/8 text-sm text-gray-100 transition-colors hover:bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-[#10b981]/70 focus:ring-inset"
                >
                  <td className="px-5 py-4 align-middle">
                    <div className="font-semibold text-white">{formatMatchDate(match.date)}</div>
                    <div className="text-xs text-gray-400">{getRelativeTimeDescription(match.date)}</div>
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <MatchupCell
                      homeTeam={match.team1Name}
                      awayTeam={match.team2Name}
                      homeLogo={match.team1Logo}
                      awayLogo={match.team2Logo}
                      homeHighlight={team1Won}
                      awayHighlight={team2Won}
                    />
                  </td>
                  <td className="px-5 py-4 align-middle text-center">
                    <ScoreCell
                      homeScore={match.team1Score}
                      awayScore={match.team2Score}
                      homeHighlight={team1Won}
                      awayHighlight={team2Won}
                    />
                  </td>
                  <td className="px-5 py-4 align-middle text-gray-300">{match.league}</td>
                  <td className="px-5 py-4 align-middle">
                    <StatusBadge status={match.status} />
                  </td>
                  <td className="px-5 py-4 align-middle text-right">
                    <a
                      href={`/matches/${matchPath(match)}/`}
                      onClick={(event) => event.stopPropagation()}
                      className="text-sm font-semibold text-[#10b981] no-underline transition-colors hover:text-white"
                    >
                      Recap
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 md:hidden">
        {matches.map((match) => {
          const team1Won = match.winnerName === match.team1Name;
          const team2Won = match.winnerName === match.team2Name;

          return (
            <a
              key={match.id}
              href={`/matches/${matchPath(match)}/`}
              className="block rounded-2xl border border-white/10 bg-[#151321] p-4 no-underline shadow-[0_12px_30px_rgba(0,0,0,0.22)]"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{formatMatchDate(match.date)}</div>
                  <div className="text-xs text-gray-400">{getRelativeTimeDescription(match.date)}</div>
                </div>
                <StatusBadge status={match.status} />
              </div>
              <MatchupCard
                homeTeam={match.team1Name}
                awayTeam={match.team2Name}
                homeLogo={match.team1Logo}
                awayLogo={match.team2Logo}
                homeHighlight={team1Won}
                awayHighlight={team2Won}
                score={<ScoreCell homeScore={match.team1Score} awayScore={match.team2Score} homeHighlight={team1Won} awayHighlight={team2Won} />}
              />
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs text-gray-400">
                <span className="truncate">{match.league}</span>
                <span className="font-semibold text-[#10b981]">Recap</span>
              </div>
            </a>
          );
        })}
      </div>
    </>
  );
}

function MatchupCell({
  homeTeam,
  awayTeam,
  homeLogo,
  awayLogo,
  homeHighlight = false,
  awayHighlight = false,
}: {
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string | null;
  awayLogo?: string | null;
  homeHighlight?: boolean;
  awayHighlight?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <TeamLine name={homeTeam} logo={homeLogo} highlight={homeHighlight} />
      <TeamLine name={awayTeam} logo={awayLogo} highlight={awayHighlight} />
    </div>
  );
}

function MatchupCard({
  homeTeam,
  awayTeam,
  homeLogo,
  awayLogo,
  homeHighlight = false,
  awayHighlight = false,
  score,
}: {
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string | null;
  awayLogo?: string | null;
  homeHighlight?: boolean;
  awayHighlight?: boolean;
  score?: React.ReactNode;
}) {
  return (
    <div className="grid gap-3">
      <TeamLine name={homeTeam} logo={homeLogo} highlight={homeHighlight} mobile />
      <div className="flex items-center justify-center gap-3 text-xs uppercase tracking-[0.24em] text-gray-500">
        <span>vs</span>
        {score}
      </div>
      <TeamLine name={awayTeam} logo={awayLogo} highlight={awayHighlight} mobile />
    </div>
  );
}

function TeamLine({
  name,
  logo,
  highlight = false,
  mobile = false,
}: {
  name: string;
  logo?: string | null;
  highlight?: boolean;
  mobile?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {logo ? (
        <img
          src={logo}
          alt={name}
          loading="lazy"
          className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-white/10"
        />
      ) : null}
      {!logo ? (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-[0.72rem] font-black uppercase tracking-wide text-gray-200 ring-1 ring-white/10">
          {teamAbbr(name)}
        </span>
      ) : null}
      <span
        className={`min-w-0 truncate font-semibold ${mobile ? 'text-base' : 'text-sm'} ${
          highlight ? 'text-white' : 'text-gray-200'
        }`}
      >
        {name}
      </span>
    </div>
  );
}

function ScoreCell({
  homeScore,
  awayScore,
  homeHighlight = false,
  awayHighlight = false,
}: {
  homeScore: number | string;
  awayScore: number | string;
  homeHighlight?: boolean;
  awayHighlight?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-black/25 p-1">
      <span className={`min-w-[2.5rem] rounded-lg px-2 py-1 text-center text-lg font-black leading-none ${homeHighlight ? 'bg-white/12 text-white' : 'text-gray-400'}`}>
        {homeScore ?? '-'}
      </span>
      <span className="text-gray-500">-</span>
      <span className={`min-w-[2.5rem] rounded-lg px-2 py-1 text-center text-lg font-black leading-none ${awayHighlight ? 'bg-white/12 text-white' : 'text-gray-400'}`}>
        {awayScore ?? '-'}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] ring-1 ${statusClass(status)}`}>
      {status}
    </span>
  );
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-14 text-center">
      <h3 className="m-0 text-lg font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-gray-400">{copy}</p>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const startPage = Math.max(1, Math.min(currentPage - 1, totalPages - 2));
  const endPage = Math.min(totalPages, Math.max(3, currentPage + 1));
  const pages = [];

  for (let page = Math.max(1, startPage); page <= endPage; page += 1) {
    pages.push(page);
  }

  return (
    <div className="flex flex-col gap-3 border-t border-white/8 pt-5 md:flex-row md:items-center md:justify-between">
      <p className="m-0 text-sm text-gray-400">
        Page <span className="font-semibold text-white">{currentPage}</span> of{' '}
        <span className="font-semibold text-white">{totalPages}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-gray-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? 'page' : undefined}
            className={`min-w-[42px] rounded-xl px-3 py-2 text-sm font-semibold transition ${
              page === currentPage
                ? 'bg-white text-[#151321]'
                : 'border border-white/10 text-gray-200 hover:bg-white/5'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-gray-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function MatchesTabbedTable({
  fixtures,
  results,
  initialTab = 'fixtures',
}: MatchesTabbedTableProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [fixturePage, setFixturePage] = useState(1);
  const [resultsPage, setResultsPage] = useState(1);
  const fixtureTotalPages = Math.max(1, Math.ceil(fixtures.length / PAGE_SIZE));
  const resultsTotalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const pagedFixtures = fixtures.slice((fixturePage - 1) * PAGE_SIZE, fixturePage * PAGE_SIZE);
  const pagedResults = results.slice((resultsPage - 1) * PAGE_SIZE, resultsPage * PAGE_SIZE);
  const showFixtures = activeTab === 'fixtures';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.28em] text-[#ffba00]">Match Center</p>
          <h2 className="m-0 mt-2 text-3xl font-bold uppercase tracking-[0.04em] text-white md:text-4xl">
            Fixtures and Results
          </h2>
          <p className="m-0 mt-2 max-w-2xl text-sm leading-6 text-gray-400">
            Scan the next scheduled tip-offs or switch to recent finals without leaving the page.
          </p>
        </div>

        <div className="inline-flex w-full gap-1 rounded-2xl border border-white/10 bg-[#100f19] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:w-auto">
          <button
            type="button"
            data-match-tab="fixtures"
            data-state={activeTab === 'fixtures' ? 'active' : 'inactive'}
            onClick={() => {
              setActiveTab('fixtures');
              setFixturePage(1);
            }}
            className={`match-center-tab flex-1 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] transition-all md:min-w-[180px] ${
              activeTab === 'fixtures'
                ? 'text-white shadow-[0_8px_20px_rgba(221,51,51,0.28)]'
                : 'text-gray-300 shadow-none hover:text-white'
            }`}
            style={{
              backgroundColor: activeTab === 'fixtures' ? '#dd3333' : '#161321',
              boxShadow: activeTab === 'fixtures' ? '0 8px 20px rgba(221, 51, 51, 0.28)' : 'none',
              border: activeTab === 'fixtures' ? '1px solid #dd3333' : '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            Fixtures
            <span className="ml-2 text-xs opacity-80">{fixtures.length}</span>
          </button>
          <button
            type="button"
            data-match-tab="results"
            data-state={activeTab === 'results' ? 'active' : 'inactive'}
            onClick={() => {
              setActiveTab('results');
              setResultsPage(1);
            }}
            className={`match-center-tab flex-1 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] transition-all md:min-w-[180px] ${
              activeTab === 'results'
                ? 'text-white shadow-[0_8px_20px_rgba(16,185,129,0.24)]'
                : 'text-gray-300 shadow-none hover:text-white'
            }`}
            style={{
              backgroundColor: activeTab === 'results' ? '#10b981' : '#161321',
              boxShadow: activeTab === 'results' ? '0 8px 20px rgba(16, 185, 129, 0.24)' : 'none',
              border: activeTab === 'results' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            Results
            <span className="ml-2 text-xs opacity-80">{results.length}</span>
          </button>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 md:p-6">
        {showFixtures ? <FixtureTable matches={pagedFixtures} /> : <ResultsTableView matches={pagedResults} />}
      </div>

      <div className="rounded-[24px] border border-white/8 bg-white/[0.02] px-4 py-4 md:px-6">
        {showFixtures ? (
          <Pagination
            currentPage={fixturePage}
            totalPages={fixtureTotalPages}
            onPageChange={(page) => setFixturePage(Math.min(Math.max(1, page), fixtureTotalPages))}
          />
        ) : (
          <Pagination
            currentPage={resultsPage}
            totalPages={resultsTotalPages}
            onPageChange={(page) => setResultsPage(Math.min(Math.max(1, page), resultsTotalPages))}
          />
        )}
      </div>

      <style>{`
        .match-center-tab {
          color: #d1d5db !important;
          position: relative;
          overflow: hidden;
        }

        .match-center-tab:hover {
          color: #ffffff !important;
        }

        .match-center-tab::before,
        .match-center-tab::after {
          content: none !important;
          display: none !important;
          background: transparent !important;
        }

        .match-center-table {
          background: #151321;
        }

        .match-center-table thead tr {
          background: #ffba00 !important;
        }

        .match-center-table thead th {
          color: #261f45 !important;
          background: transparent !important;
        }

        .match-center-table tbody tr {
          background: #151321 !important;
        }

        .match-center-table tbody tr:nth-child(even) {
          background: #1a1728 !important;
        }

        .match-center-table tbody tr:hover {
          background: #211d32 !important;
        }

        .match-center-table tbody td {
          background: transparent !important;
          color: inherit !important;
        }
      `}</style>
    </div>
  );
}
