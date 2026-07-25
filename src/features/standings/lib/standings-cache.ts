export function standingsCacheKey(
  leagueSeasonId: string,
  conferenceId?: string,
): string {
  return conferenceId
    ? `standings:${leagueSeasonId}:conference:${conferenceId}`
    : `standings:${leagueSeasonId}:overall`;
}

export function standingsCachePattern(leagueSeasonId: string): string {
  return `standings:${leagueSeasonId}:*`;
}
