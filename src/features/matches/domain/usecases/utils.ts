/**
 * Match utility functions
 * Helper functions for formatting and processing match data
 */

import type { Match, MatchStatus } from '@prisma/client';
import type { MatchDisplay } from '../../types';

export const MATCH_TIMEZONE = import.meta.env.PUBLIC_MATCH_TIMEZONE || 'Africa/Nairobi';

/**
 * Format date for display
 */
export function formatMatchDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    timeZone: MATCH_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format time for display
 */
export function formatMatchTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    timeZone: MATCH_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format date and time together
 */
export function formatMatchDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    timeZone: MATCH_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
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
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  const toDateInTz = (value: Date) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: MATCH_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(value);
    const year = Number(parts.find((p) => p.type === 'year')?.value ?? '0');
    const month = Number(parts.find((p) => p.type === 'month')?.value ?? '1');
    const day = Number(parts.find((p) => p.type === 'day')?.value ?? '1');
    return new Date(year, month - 1, day);
  };

  const dTz = toDateInTz(d);
  const nowTz = toDateInTz(now);
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
