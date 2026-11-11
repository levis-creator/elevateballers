/**
 * Links from other public pages (Standings) to the playoff bracket, built only
 * for competitions that actually have bracket-stage games.
 *
 * URLs follow the /playoffs/[season] page's own rules: a season whose playoffs
 * span several leagues filters in place with ?league=<league slug>; a season
 * with one playoff league is just /playoffs/<season slug>/.
 */

export type PlayoffEdition = { seasonId: string; leagueId: string | null };
export type BracketSeason = { id: string; slug: string; leagues: { id: string; slug: string }[] };

export type BracketLinks = {
  /** Keyed by `${seasonId}:${leagueId}`. */
  byEdition: Record<string, string>;
  /** The whole season's bracket, keyed by season id. */
  bySeason: Record<string, string>;
};

export const editionKey = (seasonId: string, leagueId: string) => `${seasonId}:${leagueId}`;

export function buildBracketLinks(editions: PlayoffEdition[], seasons: BracketSeason[]): BracketLinks {
  const links: BracketLinks = { byEdition: {}, bySeason: {} };
  const leaguesBySeason = new Map<string, Set<string>>();
  for (const { seasonId, leagueId } of editions) {
    if (!leaguesBySeason.has(seasonId)) leaguesBySeason.set(seasonId, new Set());
    if (leagueId) leaguesBySeason.get(seasonId)!.add(leagueId);
  }
  for (const season of seasons) {
    const playoffLeagueIds = leaguesBySeason.get(season.id);
    if (!playoffLeagueIds || !season.slug) continue;
    const seasonHref = `/playoffs/${encodeURIComponent(season.slug)}/`;
    links.bySeason[season.id] = seasonHref;
    const multiLeague = playoffLeagueIds.size > 1;
    for (const league of season.leagues) {
      if (!playoffLeagueIds.has(league.id)) continue;
      links.byEdition[editionKey(season.id, league.id)] = multiLeague
        ? `${seasonHref}?league=${encodeURIComponent(league.slug)}`
        : seasonHref;
    }
  }
  return links;
}
