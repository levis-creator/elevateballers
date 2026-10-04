import type { MatchPlayerWithDetails } from '../../../cms/types';
import type { Team } from '@prisma/client';

export interface RosterPlayer {
  /** Player id — what match events reference. */
  id: string;
  /** MatchPlayer row id, for roster edits. */
  mpId: string;
  teamId: string;
  no: number | null;
  name: string;
  short: string;
  initials: string;
  pos: string;
  photo: string | null;
  started: boolean;
  isActive: boolean;
}

export function toRosterPlayer(mp: MatchPlayerWithDetails): RosterPlayer {
  const first = mp.player?.firstName?.trim() ?? '';
  const last = mp.player?.lastName?.trim() ?? '';
  const name = [first, last].filter(Boolean).join(' ') || 'Unknown player';
  const parts = name.split(/\s+/);
  const short = parts.length > 1 ? `${parts[0][0]}. ${parts[parts.length - 1]}` : name;
  const initials = (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  return {
    id: mp.playerId,
    mpId: mp.id,
    teamId: mp.teamId,
    no: mp.jerseyNumber ?? mp.player?.jerseyNumber ?? null,
    name,
    short,
    initials,
    pos: mp.position ?? mp.player?.position ?? '—',
    photo: mp.player?.image ?? null,
    started: mp.started,
    isActive: mp.isActive,
  };
}

/** On-floor players: those marked active, or the starters before any sub. */
export function baseFloor(players: RosterPlayer[]): string[] {
  const active = players.filter((p) => p.isActive);
  return (active.length ? active : players.filter((p) => p.started)).map((p) => p.id);
}

export const jersey = (p: RosterPlayer | undefined) => (p?.no ?? '—').toString();

export const tag = (p: RosterPlayer | undefined) => (p ? `#${jersey(p)} ${p.short}` : '—');

/** Short code for a team: abbreviation, short name, or initials. */
export function teamShort(team: Pick<Team, 'abbreviation' | 'shortName' | 'name'> | null | undefined, fallbackName: string): string {
  if (team?.abbreviation) return team.abbreviation.toUpperCase();
  if (team?.shortName && team.shortName.length <= 6) return team.shortName.toUpperCase();
  const name = team?.name ?? fallbackName;
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length > 1) return words.map((w) => w[0]).join('').slice(0, 5).toUpperCase();
  return name.slice(0, 3).toUpperCase();
}

/** Two-letter monogram for the scoreboard badge. */
export function teamMonogram(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
