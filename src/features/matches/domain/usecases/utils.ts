/**
 * Match utility functions
 * Helper functions for formatting and processing match data
 */

import type { Match, MatchStatus } from '@prisma/client';
import type { MatchDisplay } from '../../types';

export const MATCH_TIMEZONE = import.meta.env.PUBLIC_MATCH_TIMEZONE || 'Africa/Nairobi';

// Africa/Nairobi has been fixed at UTC+3 since 1928 with no DST. Computing the
// offset arithmetically lets us format dates correctly even on hosts whose Node
// build ships without full ICU — there, `toLocaleTimeString({ timeZone })`
// silently falls back to UTC and produces times 3 hours off from the browser.
const FIXED_TIMEZONE_OFFSETS_MIN: Record<string, number> = {
  'Africa/Nairobi': 180,
};

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface ZonedDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function getZonedDateParts(date: Date | string): ZonedDateParts {
  const d = typeof date === 'string' ? new Date(date) : date;
  const fixedOffset = FIXED_TIMEZONE_OFFSETS_MIN[MATCH_TIMEZONE];

  if (fixedOffset !== undefined) {
    const shifted = new Date(d.getTime() + fixedOffset * 60_000);
    return {
      year: shifted.getUTCFullYear(),
      month: shifted.getUTCMonth() + 1,
      day: shifted.getUTCDate(),
      hour: shifted.getUTCHours(),
      minute: shifted.getUTCMinutes(),
    };
  }

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: MATCH_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');
  const hour = get('hour');
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: hour === 24 ? 0 : hour,
    minute: get('minute'),
  };
}

function formatTimeFromParts(parts: ZonedDateParts): string {
  const ampm = parts.hour >= 12 ? 'PM' : 'AM';
  const h12 = parts.hour % 12 === 0 ? 12 : parts.hour % 12;
  return `${String(h12).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')} ${ampm}`;
}

/**
 * Format date for display
 */
export function formatMatchDate(date: Date | string): string {
  const { year, month, day } = getZonedDateParts(date);
  return `${MONTH_SHORT[month - 1]} ${day}, ${year}`;
}

/**
 * Format time for display
 */
export function formatMatchTime(date: Date | string): string {
  return formatTimeFromParts(getZonedDateParts(date));
}

/**
 * Format date and time together
 */
export function formatMatchDateTime(date: Date | string): string {
  const parts = getZonedDateParts(date);
  return `${MONTH_SHORT[parts.month - 1]} ${parts.day}, ${parts.year}, ${formatTimeFromParts(parts)}`;
}

/**
 * Check if match is upcoming
 */
export function isMatchUpcoming(match: Match): boolean {
  const now = new Date();
  const matchDate = new Date(match.date);
  return match.status === 'UPCOMING' && matchDate >= now;
}

/**
 * Check if match is live
 */
export function isMatchLive(match: Match): boolean {
  return match.status === 'LIVE';
}

/**
 * Check if match is completed
 */
export function isMatchCompleted(match: Match): boolean {
  return match.status === 'COMPLETED';
}

/**
 * Get match status color
 */
export function getMatchStatusColor(status: MatchStatus): string {
  const colors: Record<MatchStatus, string> = {
    UPCOMING: '#64748b', // slate-500
    LIVE: '#ef4444', // red-500
    COMPLETED: '#10b981', // green-500
  };
  return colors[status] || '#64748b';
}

/**
 * Get match status label
 */
export function getMatchStatusLabel(status: MatchStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

/**
 * Enhance match with display properties
 */
export function enhanceMatchForDisplay(match: Match): MatchDisplay {
  return {
    ...match,
    formattedDate: formatMatchDate(match.date),
    formattedTime: formatMatchTime(match.date),
    isUpcoming: isMatchUpcoming(match),
    isLive: isMatchLive(match),
    isCompleted: isMatchCompleted(match),
  };
}

/**
 * Get relative time description (e.g., "in 2 days", "yesterday")
 */
export function getRelativeTimeDescription(date: Date | string): string {
  const toDateInTz = (value: Date) => {
    const { year, month, day } = getZonedDateParts(value);
    return new Date(year, month - 1, day);
  };

  const dTz = toDateInTz(typeof date === 'string' ? new Date(date) : date);
  const nowTz = toDateInTz(new Date());
  const diffDays = Math.round((dTz.getTime() - nowTz.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays === -1) {
    return 'Yesterday';
  } else if (diffDays > 1) {
    return `in ${diffDays} days`;
  } else {
    return `${Math.abs(diffDays)} days ago`;
  }
}
