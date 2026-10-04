import type { PublicCompetitionOption } from '@/features/seasons/domain/entities/public-competition';

/**
 * A Player of the Week award slot. Each league edition gets one slot per
 * conference when it is split into conferences, or a single league-wide slot
 * when it is a single table — so slots follow the competition structure set up
 * in the admin instead of being hard-coded.
 */
export interface PotwSlot {
  key: string;
  leagueSeasonId: string;
  conferenceId: string | null;
  seasonId: string;
  seasonLabel: string;
  leagueId: string;
  leagueLabel: string;
  /** Short public label: the conference name, or the league's short code. */
  label: string;
}

export const potwSlotKey = (leagueSeasonId: string, conferenceId: string | null | undefined) =>
  `${leagueSeasonId}:${conferenceId ?? 'league'}`;

/** "Elevate Ballers League (EBL)" → "EBL"; "Elevate Women's Basketball League" → "EWBL". */
export function leagueShortName(name: string): string {
  const bracketed = name.match(/\(([^)]+)\)\s*$/);
  if (bracketed) return bracketed[1].trim();
  return name.split(/\s+/).filter(Boolean).map((word) => word[0]).join('').toUpperCase().slice(0, 5) || name;
}

export function buildPotwSlots(competitions: PublicCompetitionOption[]): PotwSlot[] {
  return competitions.flatMap((competition): PotwSlot[] => {
    const base = {
      leagueSeasonId: competition.id,
      seasonId: competition.seasonId,
      seasonLabel: competition.seasonLabel,
      leagueId: competition.leagueId,
      leagueLabel: competition.leagueLabel,
    };
    if (competition.structure === 'CONFERENCES' && competition.conferences.length) {
      return competition.conferences.map((conference) => ({
        ...base,
        key: potwSlotKey(competition.id, conference.id),
        conferenceId: conference.id,
        label: conference.name,
      }));
    }
    return [{
      ...base,
      key: potwSlotKey(competition.id, null),
      conferenceId: null,
      label: leagueShortName(competition.leagueLabel),
    }];
  });
}

/** Slots for the latest edition of each league — what the home page shows. */
export function currentPotwSlots(competitions: PublicCompetitionOption[]): PotwSlot[] {
  const latest = new Map<string, PublicCompetitionOption>();
  const newestFirst = [...competitions].sort((a, b) => b.startDate.localeCompare(a.startDate));
  for (const competition of newestFirst) {
    if (!latest.has(competition.leagueId)) latest.set(competition.leagueId, competition);
  }
  return buildPotwSlots([...latest.values()]);
}
