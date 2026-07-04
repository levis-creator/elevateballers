/**
 * v2 Fixtures data source. Pulls upcoming (incl. live) and completed matches and
 * maps each to a display-ready `FixtureMatch`. All date/time formatting is done
 * here in the league timezone (reusing the match utils) so the client island is
 * pure filtering + grouping.
 */
import { getUpcomingMatches, getCompletedMatches } from "@/features/matches/lib/queries";
import { getZonedDateParts, formatMatchTime } from "@/features/matches/domain/usecases/utils";
import { getDisplayImageUrl } from "@/lib/asset-url";
import type { FixtureMatch, FixtureStatus, FixturesData } from "@/features/fixtures/domain/entities/fixtures-v2";

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Two-letter crest from a team name, ignoring parenthetical suffixes. */
const abbrOf = (name: string): string => {
	const clean = name.replace(/\(.*?\)/g, "").trim();
	const w = clean.split(/\s+/).filter(Boolean);
	return ((w[0]?.[0] || "") + (w[1]?.[0] || "")).toUpperCase() || "?";
};

const statusOf = (s: string): FixtureStatus =>
	s === "COMPLETED" ? "done" : s === "LIVE" ? "live" : "upcoming";

/** Match link — canonical slug when present, else the cuid (both resolve). */
const hrefOf = (m: any): string => `/matches/${(m.slug as string) || m.id}`;

function toFixture(m: any): FixtureMatch {
	const p = getZonedDateParts(m.date);
	const isoDate = `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
	// Weekday from the already-zoned Y/M/D — UTC read avoids a second TZ shift.
	const weekday = WD[new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay()];

	const status = statusOf(m.status);
	const home = m.team1Name || m.team1?.name || "TBD";
	const away = m.team2Name || m.team2?.name || "TBD";

	const hs = m.team1Score;
	const as = m.team2Score;
	const hasScore = (status === "done" || status === "live") && hs != null && as != null;

	return {
		id: m.id,
		href: hrefOf(m),
		league: m.league?.name || m.leagueName || "Elevate Ballers",
		season: (m.season?.name && String(m.season.name).trim()) || String(p.year),
		ts: new Date(m.date).getTime(),
		isoDate,
		day: String(p.day).padStart(2, "0"),
		mon: MON[p.month - 1],
		weekday,
		year: p.year,
		time: formatMatchTime(m.date),
		status,
		home,
		away,
		homeAbbr: abbrOf(home),
		awayAbbr: abbrOf(away),
		homeLogo: getDisplayImageUrl(m.team1?.logo || m.team1Logo),
		awayLogo: getDisplayImageUrl(m.team2?.logo || m.team2Logo),
		score: hasScore ? `${hs} – ${as}` : "",
		homeScore: hasScore ? hs : null,
		awayScore: hasScore ? as : null,
		homeWin: hasScore && hs > as,
		awayWin: hasScore && as > hs,
	};
}

export async function fetchFixturesData(): Promise<FixturesData | null> {
	try {
		const [upcoming, completed] = await Promise.all([getUpcomingMatches(), getCompletedMatches()]);
		const raw = [...upcoming, ...completed];
		const matches = raw.map(toFixture);
		if (!matches.length) return null;

		// Per season key: newest match time + whether it came from a real Season
		// record (vs the year fallback used for season-less matches).
		const meta = new Map<string, { ts: number; real: boolean }>();
		raw.forEach((m: any, i) => {
			const key = matches[i].season;
			const real = Boolean(m.season?.name && String(m.season.name).trim());
			const cur = meta.get(key);
			if (!cur) meta.set(key, { ts: matches[i].ts, real });
			else {
				if (matches[i].ts > cur.ts) cur.ts = matches[i].ts;
				if (real) cur.real = true;
			}
		});

		// Newest season first. Prefer real (named) seasons for the selector so a
		// single season-less match (bucketed under its year) doesn't add a
		// confusing duplicate option — fall back to year buckets only when no
		// match has a real season.
		const byRecency = [...meta.entries()].sort((a, b) => b[1].ts - a[1].ts);
		const realByRecency = byRecency.filter(([, v]) => v.real);
		const seasons = (realByRecency.length ? realByRecency : byRecency).map(([s]) => s);
		const defaultSeason = seasons[0] ?? "";

		return { matches, seasons, defaultSeason };
	} catch {
		return null;
	}
}
