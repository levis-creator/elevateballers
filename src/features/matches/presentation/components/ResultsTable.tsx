import React from 'react';
import { formatMatchDate } from '../../lib/utils';

interface Result {
  id: string;
  date: Date | string;
  team1Name: string;
  team2Name: string;
  team1Score: number | string;
  team2Score: number | string;
  league: string;
  winnerName?: string;
  status: string;
}

interface ResultsTableProps {
  matches: Result[];
}

function abbr(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return name.slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ matches }) => {
  if (matches.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400">
        No results yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {matches.map((match) => {
        const score1  = match.team1Score ?? '-';
        const score2  = match.team2Score ?? '-';
        const team1Won = match.winnerName === match.team1Name;
        const team2Won = match.winnerName === match.team2Name;

        return (
          <a
            key={match.id}
            href={`/matches/${match.id}`}
            aria-label={`${match.team1Name} ${score1} - ${score2} ${match.team2Name}`}
            className="block rounded-[10px] border border-white/[0.08] bg-surface-dark px-4 pb-4 pt-3 no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-red/50 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] sm:px-5 sm:pb-5 sm:pt-4"
          >
            {/* Header */}
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="truncate text-[0.65rem] font-bold uppercase tracking-widest text-brand-teal">
                {match.league.toUpperCase()}
              </span>
              <span className="shrink-0 text-[0.7rem] text-gray-400">{formatMatchDate(match.date)}</span>
            </div>

            {/* Teams + scores row */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Team 1 */}
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-mid text-[0.6rem] font-bold text-gray-200 sm:h-9 sm:w-9 sm:text-[0.7rem]">
                  {abbr(match.team1Name)}
                </span>
                <span className={`truncate text-sm font-semibold sm:text-[0.9rem] ${team1Won ? 'font-bold text-white' : 'text-gray-400'}`}>
                  {match.team1Name}
                </span>
              </div>

              {/* Scores */}
              <div className="flex shrink-0 gap-1">
                <span className={`min-w-[2rem] rounded-md bg-surface-deeper px-1.5 py-1 text-center text-base font-black leading-none sm:min-w-[2.5rem] sm:px-2 sm:py-1.5 sm:text-[1.3rem] ${team1Won ? 'text-white' : 'text-gray-500'}`}>
                  {score1}
                </span>
                <span className={`min-w-[2rem] rounded-md bg-surface-deeper px-1.5 py-1 text-center text-base font-black leading-none sm:min-w-[2.5rem] sm:px-2 sm:py-1.5 sm:text-[1.3rem] ${team2Won ? 'text-white' : 'text-gray-500'}`}>
                  {score2}
                </span>
              </div>

              {/* Team 2 */}
              <div className="flex min-w-0 flex-1 flex-row-reverse items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-mid text-[0.6rem] font-bold text-gray-200 sm:h-9 sm:w-9 sm:text-[0.7rem]">
                  {abbr(match.team2Name)}
                </span>
                <span className={`truncate text-right text-sm font-semibold sm:text-[0.9rem] ${team2Won ? 'font-bold text-white' : 'text-gray-400'}`}>
                  {match.team2Name}
                </span>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
};
