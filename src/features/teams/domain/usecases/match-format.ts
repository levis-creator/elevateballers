import { getZonedDateParts, formatMatchTime } from '@/features/matches/domain/usecases/utils';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Render match dates/times in the league timezone (Africa/Nairobi, UTC+3), not
// the server's — otherwise fixtures show ~3h early in UTC.
export const fmtDate = (v: any) => {
  const p = getZonedDateParts(v);
  return `${MON[p.month - 1]} ${p.day}, ${p.year}`;
};
export const fmtWhen = (v: any) => {
  const p = getZonedDateParts(v);
  return `${MON[p.month - 1]} ${p.day} · ${formatMatchTime(v)}`;
};

export const homeName = (m: any) => m.team1?.name || m.team1Name || 'TBD';
export const awayName = (m: any) => m.team2?.name || m.team2Name || 'TBD';
export const homeNickname = (m: any) => m.team1?.nickname ?? null;
export const awayNickname = (m: any) => m.team2?.nickname ?? null;
export const leagueOf = (m: any) => m.league?.name || m.leagueName || '';
