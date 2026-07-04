/**
 * v2 About data source. Fills the quantitative parts of the page from real data:
 *  - stat strip: approved club + player counts, league count, founding year
 *  - league cards: each league's team + player counts (via SeasonTeam)
 *  - venue contacts: site settings (reused via getFooterData)
 * Returns null on failure so the use case can fall back to static content.
 */
import { prisma } from "@/lib/prisma";
import { getLeagues } from "@/features/cms/lib/queries";
import { getFooterData } from "@/features/layout/domain/usecases/get-footer-data";
import type { AboutStat, AboutLeague, AboutContact } from "@/features/about/domain/entities/about-v2";

export interface AboutDynamic {
	stats: AboutStat[];
	leagues: AboutLeague[];
	contacts: AboutContact[];
}

/** Initials from a league name, e.g. "Elevate Women's Basketball League" → "EWBL". */
const abbrOf = (name: string): string =>
	name
		.split(/\s+/)
		.filter(Boolean)
		.map((w) => w[0])
		.join("")
		.toUpperCase()
		.slice(0, 5) || "—";

export async function fetchAboutDynamic(): Promise<AboutDynamic | null> {
	try {
		const [teamCount, playerCount, leagueRows, firstSeason, footer] = await Promise.all([
			prisma.team.count({ where: { approved: true } }),
			prisma.player.count({ where: { approved: true } }),
			getLeagues(),
			prisma.season.findFirst({ orderBy: { startDate: "asc" }, select: { startDate: true } }),
			getFooterData(),
		]);

		const foundedYear = firstSeason?.startDate ? new Date(firstSeason.startDate).getFullYear() : null;

		const stats: AboutStat[] = [
			{ value: String(teamCount), label: "Clubs", accent: true },
			{ value: String(playerCount), label: "Players", accent: false },
			{ value: String(leagueRows.length), label: "Leagues", accent: false },
			{ value: foundedYear ? String(foundedYear) : "—", label: "Founded", accent: true },
		];

		// Per-league team + player counts. Teams belong to a league via SeasonTeam;
		// dedupe teamIds across seasons, then count approved players on those teams.
		const leagues: AboutLeague[] = await Promise.all(
			leagueRows.map(async (lg: any, i: number) => {
				const seasonTeams = await prisma.seasonTeam.findMany({
					where: { leagueId: lg.id },
					select: { teamId: true },
					distinct: ["teamId"],
				});
				const teamIds = seasonTeams.map((s) => s.teamId);
				const players = teamIds.length
					? await prisma.player.count({ where: { approved: true, teamId: { in: teamIds } } })
					: 0;
				return {
					abbr: abbrOf(lg.name),
					title: lg.name,
					teams: String(teamIds.length),
					players: String(players),
					body:
						(lg.description && String(lg.description).trim()) ||
						`${lg.name} brings clubs together in weekly competitive play across the season.`,
					// Alternate dark/light so any number of league cards reads as a set.
					dark: i % 2 === 0,
				};
			}),
		);

		const c = footer.contact;
		const contacts: AboutContact[] = [
			{ k: "Where", v: c.address },
			{ k: "When", v: c.hours },
			{ k: "Reach", v: [c.phone, c.email].filter(Boolean).join(" · ") },
		];

		return { stats, leagues, contacts };
	} catch {
		return null;
	}
}
