/**
 * v2 Fixtures entities. One match becomes a display-ready `FixtureMatch` with
 * all date/time formatting resolved server-side (in the league timezone) so the
 * React island only filters and groups — it never re-parses dates.
 */

export type FixtureStatus = "upcoming" | "live" | "done";

export interface FixtureMatch {
	id: string;
	/** Link to the match detail page. */
	href: string;
	/** Full league name — shown on the card badge and used by the filter. */
	league: string;
	/** Configured short competition tag shown on match cards (for example EBL). */
	leagueCode?: string;
	/** Season key (e.g. "2026 Season" or "2026") — the season selector filters on this. */
	season: string;
	seasonId: string | null;
	leagueSeasonId: string | null;
	conferenceIds: string[];
	homeTeamId: string | null;
	awayTeamId: string | null;
	venue: string | null;
	round: string;
	performer?: { name: string; team: string; image: string | null; pts: number; reb: number; ast: number } | null;

	/** Epoch ms — precise sort key (upcoming ascending, results descending). */
	ts: number;
	/** YYYY-MM-DD in the league timezone — the grouping key for a match-day. */
	isoDate: string;
	/** Zero-padded day of month, e.g. "05". */
	day: string;
	/** Short month, e.g. "Jul". */
	mon: string;
	/** Full weekday, e.g. "Sunday". */
	weekday: string;
	/** Four-digit year. */
	year: number;
	/** Tip-off time, e.g. "04:00 PM". */
	time: string;

	status: FixtureStatus;
	home: string;
	away: string;
	homeNickname?: string | null;
	awayNickname?: string | null;
	/** Two-letter crest fallback when a team has no logo. */
	homeAbbr: string;
	awayAbbr: string;
	/** Resolved logo URL, or null → render the initials crest. */
	homeLogo: string | null;
	awayLogo: string | null;

	/** "81 – 69" for a played (or live, scored) game; "" → render "VS". */
	score: string;
	/** Numeric scores for two-tone rendering; null when the game isn't scored. */
	homeScore: number | null;
	awayScore: number | null;
	homeWin: boolean;
	awayWin: boolean;
}

export interface FixturesData {
	matches: FixtureMatch[];
	competitions: import("@/features/seasons/domain/entities/public-competition").PublicCompetitionOption[];
	/** Distinct season keys, newest first. */
	seasons: string[];
	/** Season the board opens on — the newest with matches, or "". */
	defaultSeason: string;
	defaultLeagueSeasonId: string;
}
