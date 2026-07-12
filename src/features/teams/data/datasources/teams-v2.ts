/**
 * v2 Teams data source — reads teams + leagues + coach/league links and maps to
 * TeamCard entities. Best-effort: coach and league are enriched where available
 * (v1 cards showed neither). Returns null on failure so the use-case can fall back.
 */
import { prisma } from "@/lib/prisma";
import { getTeams, getLeagues } from "@/features/cms/lib/queries";
import { getDisplayImageUrl } from "@/lib/asset-url";
import type { TeamCard, LeagueTab, TeamsData } from "@/features/teams/domain/entities/teams-v2";

// Stable colour palette assigned per league (by sorted order).
const PALETTE = ["#e4002b", "#1f6feb", "#2f9e44", "#f08c00", "#7048e8", "#0c8599", "#d6336c"];

function initialsOf(name: string): string {
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

export async function fetchTeamsData(): Promise<TeamsData | null> {
	try {
		const [teams, leagues, seasonTeams, coaches] = await Promise.all([
			getTeams(),
			// Active only — an archived league must not surface on the public site.
			getLeagues(true),
			// Drives each team's league badge. Scoped to active leagues too, or an
			// archived league would still be named on the team cards; a team whose
			// only league is archived falls back to "Unaffiliated".
			prisma.seasonTeam.findMany({
				where: { league: { active: true } },
				select: { teamId: true, league: { select: { name: true } } },
				orderBy: { createdAt: "desc" },
			}),
			prisma.teamStaff.findMany({
				where: { role: "COACH" },
				select: { teamId: true, staff: { select: { firstName: true, lastName: true } } },
			}),
		]);
		if (!teams.length) return null;

		// team → most recent league name
		const teamLeague = new Map<string, string>();
		for (const st of seasonTeams as any[]) {
			if (!teamLeague.has(st.teamId) && st.league?.name) teamLeague.set(st.teamId, st.league.name);
		}
		// team → first coach name
		const teamCoach = new Map<string, string>();
		for (const c of coaches as any[]) {
			if (teamCoach.has(c.teamId)) continue;
			const n = `${c.staff?.firstName ?? ""} ${c.staff?.lastName ?? ""}`.trim();
			if (n) teamCoach.set(c.teamId, n);
		}
		// league name → colour
		const leagueColor = new Map<string, string>();
		leagues.forEach((l: any, i: number) => leagueColor.set(l.name, PALETTE[i % PALETTE.length]));

		const cards: TeamCard[] = teams.map((t: any) => {
			const league = teamLeague.get(t.id) ?? "Unaffiliated";
			return {
				id: t.id,
				slug: t.slug,
				name: t.name,
				initials: initialsOf(t.name),
				logo: getDisplayImageUrl(t.logo),
				league,
				leagueColor: leagueColor.get(league) ?? "#8a817a",
				coach: teamCoach.get(t.id) ?? "—",
				players: t._count?.players ?? 0,
				href: `/teams/${t.slug}`,
			};
		});

		const present = new Set(cards.map((c) => c.league));
		const leagueTabs: LeagueTab[] = [
			{ label: "All Clubs", value: "all" },
			...leagues.filter((l: any) => present.has(l.name)).map((l: any) => ({ label: l.name, value: l.name })),
		];

		return { teams: cards, leagues: leagueTabs, totalCount: cards.length, leagueCount: leagues.length };
	} catch {
		return null;
	}
}
