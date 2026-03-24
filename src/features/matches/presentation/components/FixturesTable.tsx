import React from 'react';
import { formatMatchDate } from '../../lib/utils';

interface Fixture {
  id: string;
  date: Date | string;
  team1Name: string;
  team2Name: string;
  league: string;
  venue?: string;
  status: string;
}

interface FixturesTableProps {
  matches: Fixture[];
}

function abbr(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return name.slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const STATUS_CLASSES: Record<string, string> = {
  LIVE:      'bg-red-500',
  UPCOMING:  'bg-blue-500',
  POSTPONED: 'bg-amber-500',
};

export const FixturesTable: React.FC<FixturesTableProps> = ({ matches }) => {
  if (matches.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400">
        No upcoming fixtures scheduled.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {matches.map((match) => {
        const statusClass = STATUS_CLASSES[match.status] ?? 'bg-gray-500';
        return (
          <a
            key={match.id}
            href={`/matches/${match.id}`}
            aria-label={`${match.team1Name} vs ${match.team2Name}`}
            className="block rounded-[10px] border border-white/[0.08] bg-surface-dark px-4 pb-4 pt-3 no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-red/50 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] sm:px-5 sm:pb-5 sm:pt-4"
          >
            {/* Header */}
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="truncate text-[0.65rem] font-bold uppercase tracking-widest text-brand-teal">
                {match.league.toUpperCase()}
              </span>
              <span className="shrink-0 text-[0.7rem] text-gray-400">{formatMatchDate(match.date)}</span>
            </div>

            {/* Teams row */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Team 1 */}
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-mid text-[0.6rem] font-bold text-gray-200 sm:h-9 sm:w-9 sm:text-[0.7rem]">
                  {abbr(match.team1Name)}
                </span>
                <span className="truncate text-sm font-semibold text-gray-100 sm:text-[0.9rem]">
                  {match.team1Name}
                </span>
              </div>

              {/* VS + status */}
              <div className="flex shrink-0 flex-col items-center gap-1">
                <span className="text-[0.8rem] font-extrabold tracking-wide text-brand-gold sm:text-[0.85rem]">
                  VS
                </span>
                <span className={`rounded-full px-1.5 py-px text-[0.5rem] font-bold uppercase tracking-wide text-white ${statusClass}`}>
                  {match.status}
                </span>
              </div>

              {/* Team 2 */}
              <div className="flex min-w-0 flex-1 flex-row-reverse items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-mid text-[0.6rem] font-bold text-gray-200 sm:h-9 sm:w-9 sm:text-[0.7rem]">
                  {abbr(match.team2Name)}
                </span>
                <span className="truncate text-right text-sm font-semibold text-gray-100 sm:text-[0.9rem]">
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
