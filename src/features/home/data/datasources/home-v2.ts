/**
 * v2 home data source — reads the same real queries v1 uses and maps the raw
 * Prisma DTOs into domain entities. Each fetch is defensive: it returns null/[]
 * on failure or empty so the use-case can fall back to demo content.
 */
import { prisma } from "@/lib/prisma";
import { getUpcomingMatches, getCompletedMatches } from "@/features/matches/lib/queries";
import { getNewsArticles } from "@/features/cms/lib/queries/news";
import { getFeaturedMedia } from "@/features/cms/lib/queries/media";
import { getActivePlayerOfTheWeek } from "@/features/cms/lib/editorial-queries";
import { getAllSiteSettings } from "@/features/cms/lib/queries";
import { calculatePlayerStatistics } from "@/features/player/lib/playerStats";
import { resolveAssetUrl } from "@/lib/asset-url";
import { optimizeImageUrl } from "@/lib/image-cdn";
import type {
	Match,
	Result,
	NextMatch,
	NewsItem,
	LeaderData,
	CountTargets,
	MediaItem,
	Potw,
} from "@/features/home/domain/entities/home-v2";

// --- formatting helpers ---
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtTime(d: Date): string {
	let h = d.getHours();
	const m = d.getMinutes();
	const ap = h >= 12 ? "PM" : "AM";
	h = h % 12 || 12;
	return `${h}:${String(m).padStart(2, "0")} ${ap}`;
}
function fmtWhen(d: Date): string {
	return `${MON[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${fmtTime(d)}`;
}
function fmtDate(d: Date | string | null | undefined): string {
	if (!d) return "";
	const x = new Date(d);
	return `${MON[x.getMonth()]} ${x.getDate()}, ${x.getFullYear()}`;
}
function abbr(name: string): string {
	return (
		name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((w) => w[0])
			.join("")
			.toUpperCase() || "?"
	);
}
const CAT_DISPLAY: Record<string, string> = {
	INTERVIEWS: "Interviews",
	CHAMPIONSHIPS: "Championships",
	MATCH_REPORT: "Match report",
	ANALYSIS: "Analysis",
};
function catDisplay(cat: string): string {
	return CAT_DISPLAY[cat] ?? "News";
}
function excerptOf(a: { excerpt?: string | null; content?: string | null }): string {
	if (a.excerpt) return a.excerpt;
	const text = String(a.content ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
	return text.length > 120 ? text.slice(0, 117) + "…" : text;
}

// --- match mappers (raw DTO typed loosely; outputs typed) ---
function homeName(m: any): string {
	return m.team1?.name || m.team1Name || "TBD";
}
function awayName(m: any): string {
	return m.team2?.name || m.team2Name || "TBD";
}
function venueOf(m: any): string {
	return m.leagueName || m.league?.name || "";
}
/** Detail-page link for a match — canonical slug when present, else the cuid. */
function matchHref(m: any): string {
	return `/matches/${m.slug || m.id}`;
}
function toFixture(m: any): Match {
	const d = new Date(m.date);
	return {
		day: String(d.getDate()).padStart(2, "0"),
		mon: MON[d.getMonth()],
		home: homeName(m),
		away: awayName(m),
		venue: venueOf(m),
		time: fmtTime(d),
		startDate: d.toISOString(),
		href: matchHref(m),
	};
}
function toNextMatch(m: any): NextMatch {
	const d = new Date(m.date);
	return {
		homeAbbr: abbr(homeName(m)),
		home: homeName(m),
		awayAbbr: abbr(awayName(m)),
		away: awayName(m),
		venue: venueOf(m),
		when: fmtWhen(d),
	};
}
function toResult(m: any): Result {
	const hs = m.team1Score ?? 0;
	const as = m.team2Score ?? 0;
	return {
		home: homeName(m),
		hs,
		away: awayName(m),
		as,
		homeColor: hs > as ? "#141009" : "#a49a8d",
		awayColor: as > hs ? "#141009" : "#a49a8d",
		href: matchHref(m),
	};
}

// --- fetchers ---
export async function fetchFixtures(): Promise<{ nextMatch: NextMatch; upcoming: Match[] } | null> {
	try {
		const ms = await getUpcomingMatches(6);
		if (!ms.length) return null;
		return { nextMatch: toNextMatch(ms[0]), upcoming: ms.slice(0, 3).map(toFixture) };
	} catch {
		return null;
	}
}

export async function fetchResults(): Promise<Result[] | null> {
	try {
		const ms = await getCompletedMatches(3);
		if (!ms.length) return null;
		return ms.map(toResult);
	} catch {
		return null;
	}
}

export async function fetchNews(): Promise<{ news: NewsItem[]; categories: string[]; ticker: string[] } | null> {
	try {
		const articles = await getNewsArticles();
		if (!articles.length) return null;
		const news: NewsItem[] = articles.slice(0, 9).map((a: any) => {
			const rawImg = typeof a.image === "string" ? a.image : a.image?.url || a.image?.src;
			const resolved = resolveAssetUrl(rawImg);
			const published = a.publishedAt ?? a.createdAt;
			return {
				cat: catDisplay(a.category),
				title: a.title,
				excerpt: excerptOf(a),
				date: fmtDate(published),
				url: `/news/${a.slug}`,
				image: resolved ? optimizeImageUrl(resolved, { width: 600 }) : null,
				datePublished: published ? new Date(published).toISOString() : null,
			};
		});
		const present = new Set(articles.map((a: any) => catDisplay(a.category)));
		const categories = ["All", ...["Interviews", "Championships", "Match report", "Analysis"].filter((c) => present.has(c))];
		const ticker = articles.slice(0, 5).map((a: any) => a.title as string);
		return { news, categories, ticker };
	} catch {
		return null;
	}
}

export async function fetchMedia(): Promise<MediaItem[] | null> {
	try {
		const items = await getFeaturedMedia(6);
		if (!items.length) return null;
		return items.slice(0, 6).map((m: any, i: number) => {
			const isAudio = m.type === "AUDIO";
			const raw = isAudio ? null : resolveAssetUrl(m.thumbnail || m.url);
			return {
				type: isAudio ? "Audio" : "Images",
				label: m.title || (isAudio ? "audio clip" : "media"),
				span: i === 0 || i === 5,
				image: raw ? optimizeImageUrl(raw, { width: 600 }) : null,
			} as MediaItem;
		});
	} catch {
		return null;
	}
}

export async function fetchRegistrationOpen(): Promise<boolean | null> {
	try {
		const settings = await getAllSiteSettings();
		const s = settings.find(
			(x: any) => x.key === "registration_open" || x.key === "registrationOpen" || x.key === "league_registration_open",
		);
		if (!s) return null;
		const v = String((s as any).value).toLowerCase();
		return v === "true" || v === "1" || v === "open" || v === "yes";
	} catch {
		return null;
	}
}

export interface StatsResult {
	leaderData: LeaderData;
	counts: CountTargets;
	statsByPlayer: Record<string, { pointsPerGame: number; reboundsPerGame: number; assistsPerGame: number }>;
}

export async function fetchStats(): Promise<StatsResult | null> {
	try {
		const [players, matches] = await Promise.all([
			prisma.player.findMany({
				where: { approved: true },
				select: { id: true, firstName: true, lastName: true, team: { select: { name: true } } },
			}),
			prisma.match.findMany({
				where: { status: "COMPLETED" },
				select: {
					id: true,
					status: true,
					events: {
						where: { isUndone: false },
						select: { eventType: true, playerId: true, assistPlayerId: true, isUndone: true },
					},
				},
			}),
		]);
		if (!players.length) return null;

		const statsByPlayer: StatsResult["statsByPlayer"] = {};
		for (const p of players) {
			const s = calculatePlayerStatistics(matches as any, p.id);
			if (s.totalMatches > 0) {
				statsByPlayer[p.id] = {
					pointsPerGame: s.pointsPerGame,
					reboundsPerGame: s.reboundsPerGame,
					assistsPerGame: s.assistsPerGame,
				};
			}
		}
		const active = players.filter((p) => statsByPlayer[p.id]);
		const build = (field: keyof StatsResult["statsByPlayer"][string]) =>
			active
				.map((p) => ({
					name: `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "Unknown",
					team: p.team?.name ?? "—",
					val: Math.round(statsByPlayer[p.id][field] * 10) / 10,
				}))
				.sort((a, b) => b.val - a.val)
				.slice(0, 5);
		const leaderData: LeaderData = {
			Points: build("pointsPerGame"),
			Rebounds: build("reboundsPerGame"),
			Assists: build("assistsPerGame"),
		};

		const [completed, teamCount, awardCount] = await Promise.all([
			prisma.match.count({ where: { status: "COMPLETED" } }),
			prisma.team.count({ where: { approved: true } }),
			prisma.playerOfTheWeek.count(),
		]);
		const counts: CountTargets = {
			matches: completed,
			players: players.length,
			teams: teamCount,
			awards: awardCount,
		};

		return { leaderData, counts, statsByPlayer };
	} catch {
		return null;
	}
}

export async function fetchPotw(
	statsByPlayer?: StatsResult["statsByPlayer"],
): Promise<Potw | null> {
	try {
		const potw = await getActivePlayerOfTheWeek();
		if (!potw) return null;
		const p: any = potw.player;
		const name = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "Player of the Week";
		const jersey = p.jerseyNumber != null ? `#${p.jerseyNumber}` : "";
		const teamLabel = [p.team?.name, jersey].filter(Boolean).join(" · ");
		const raw = (potw as any).customImage || p.image;
		const resolved = resolveAssetUrl(raw);
		const image = resolved ? optimizeImageUrl(resolved, { width: 600 }) : null;
		const s = statsByPlayer?.[p.id];
		const stats = s
			? [
					{ value: String(Math.round(s.pointsPerGame * 10) / 10), label: "Points" },
					{ value: String(Math.round(s.reboundsPerGame * 10) / 10), label: "Rebounds" },
					{ value: String(Math.round(s.assistsPerGame * 10) / 10), label: "Assists" },
				]
			: [];
		return { name, teamLabel, image, description: potw.description ?? "", stats };
	} catch {
		return null;
	}
}
