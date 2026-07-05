/**
 * v2 single-team data source. Reuses the SAME queries/computations the v1 team
 * page uses (getTeamBySlug, getTeamPlayerStats, getStaffByTeam,
 * getFilteredMatches, calculateTeamStatistics) and maps them to entities.
 * Returns null when the team doesn't exist (→ 404).
 */
import { prisma } from "@/lib/prisma";
import { getTeamBySlug, getStaffByTeam } from "@/features/cms/lib/queries";
import { getTeamPlayerStats } from "@/features/player/lib/queries";
import { getFilteredMatches } from "@/features/matches/lib/queries";
import { calculateTeamStatistics } from "@/features/team/lib/teamStats";
import { getTeamCoachingStaff } from "@/features/staff/data/datasources/team-coaching-staff-v2";
import { getDisplayImageUrl } from "@/lib/asset-url";
import type {
	TeamDetail,
	ResultMatch,
	UpcomingMatch,
	SquadPlayer,
	StaffMember,
	FormBadge,
	HeroStat,
} from "@/features/teams/domain/entities/team-detail";

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtTime = (d: Date) => {
	let h = d.getHours();
	const m = d.getMinutes();
	const ap = h >= 12 ? "PM" : "AM";
	h = h % 12 || 12;
	return `${h}:${String(m).padStart(2, "0")} ${ap}`;
};
const fmtDate = (v: any) => {
	const d = new Date(v);
	return `${MON[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};
const fmtWhen = (v: any) => {
	const d = new Date(v);
	return `${MON[d.getMonth()]} ${d.getDate()} · ${fmtTime(d)}`;
};
const initialsOf = (name: string) =>
	name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
const abbrOf = (name: string) =>
	name.split(/\s+/).filter(Boolean).slice(0, 4).map((w) => w[0]).join("").toUpperCase() || "—";
const formatRole = (role: string) =>
	role.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");

const homeName = (m: any) => m.team1?.name || m.team1Name || "TBD";
const awayName = (m: any) => m.team2?.name || m.team2Name || "TBD";
const homeNickname = (m: any) => m.team1?.nickname ?? null;
const awayNickname = (m: any) => m.team2?.nickname ?? null;
const leagueOf = (m: any) => m.league?.name || m.leagueName || "";

export async function fetchTeamDetail(slug: string): Promise<TeamDetail | null> {
	const team = await getTeamBySlug(slug);
	if (!team) return null;

	const [statsMap, coachingRows, staffRows, completed, upcomingMs, leagueRow] = await Promise.all([
		getTeamPlayerStats(team.id).catch(() => ({} as Record<string, Record<string, number>>)),
		// New split-out coaching staff (empty until the migration copies coaches).
		getTeamCoachingStaff(team.id).catch(() => []),
		// Legacy team_staff — used as a fallback so coaches keep rendering pre-migration.
		getStaffByTeam(team.id, true).catch(() => [] as any[]),
		getFilteredMatches({ teamId: team.id, status: "COMPLETED" }, "date-desc").catch(() => [] as any[]),
		getFilteredMatches({ teamId: team.id, status: "UPCOMING" }, "date-asc", 5).catch(() => [] as any[]),
		prisma.seasonTeam
			.findFirst({ where: { teamId: team.id }, orderBy: { createdAt: "desc" }, select: { league: { select: { name: true } } } })
			.catch(() => null),
	]);

	const league = leagueRow?.league?.name || "Unaffiliated";

	// --- recent results (each from this team's perspective) ---
	const teamIdOf = (m: any) => (m.team1?.id ?? m.team1Id) === team.id;
	const recent: ResultMatch[] = (completed as any[]).map((m) => {
		const hs = m.team1Score ?? 0;
		const as = m.team2Score ?? 0;
		const isTeam1 = teamIdOf(m);
		const teamScore = isTeam1 ? hs : as;
		const oppScore = isTeam1 ? as : hs;
		const result = teamScore > oppScore ? "win" : teamScore < oppScore ? "loss" : "draw";
		return {
			id: m.id,
			href: `/matches/${m.slug || m.id}`,
			tag: result === "win" ? "Win" : result === "loss" ? "Loss" : "Draw",
			result,
			date: fmtDate(m.date),
			season: m.season?.name || "—",
			home: homeName(m),
			homeNickname: homeNickname(m),
			homeLogo: getDisplayImageUrl(m.team1?.logo || m.team1Logo),
			away: awayName(m),
			awayNickname: awayNickname(m),
			awayLogo: getDisplayImageUrl(m.team2?.logo || m.team2Logo),
			hs,
			as,
			homeColor: hs > as ? "#141009" : "#a49a8d",
			awayColor: as > hs ? "#141009" : "#a49a8d",
		};
	});

	const upcoming: UpcomingMatch[] = (upcomingMs as any[]).map((m) => ({
		id: m.id,
		href: `/matches/${m.slug || m.id}`,
		when: fmtWhen(m.date),
		league: leagueOf(m),
		home: homeName(m),
		homeNickname: homeNickname(m),
		homeLogo: getDisplayImageUrl(m.team1?.logo || m.team1Logo),
		away: awayName(m),
		awayNickname: awayNickname(m),
		awayLogo: getDisplayImageUrl(m.team2?.logo || m.team2Logo),
	}));

	// distinct seasons present in results (date-desc → [0] is the current season)
	const seasons = [...new Set(recent.map((r) => r.season).filter((s) => s && s !== "—"))];
	const currentSeason = seasons[0] ?? "";

	// Hero record + form are scoped to the current season; fall back to all-time
	// when no matches are season-tagged.
	const statMatches = currentSeason
		? (completed as any[]).filter((m) => m.season?.name === currentSeason)
		: (completed as any[]);
	const teamStats = calculateTeamStatistics(statMatches, team.id);

	// --- form: last 6 of the current season (date-desc → most recent first) ---
	const formSource = currentSeason ? recent.filter((r) => r.season === currentSeason) : recent;
	const form: FormBadge[] = formSource.slice(0, 6).map((r) => ({
		label: r.result === "win" ? "W" : r.result === "loss" ? "L" : "D",
		result: r.result,
	}));

	// --- hero stats ---
	const heroStats: HeroStat[] = [
		{ value: String(teamStats.totalMatches), label: "Games", color: "#f6f2ec" },
		{ value: String(teamStats.wins), label: "Wins", color: "#3fbf6f" },
		{ value: String(teamStats.losses), label: "Losses", color: "#ff5a72" },
		{ value: `${Math.round(teamStats.winPercentage)}%`, label: "Win Rate", color: "#f6f2ec" },
		{ value: teamStats.averagePointsScored.toFixed(1), label: "PPG", color: "#e4002b" },
	];

	// --- squad ---
	const stat = (id: string, key: string): number | null => {
		const v = (statsMap as any)?.[id]?.[key];
		return typeof v === "number" ? v : null;
	};
	const maxPpg = Math.max(0, ...team.players.map((p: any) => stat(p.id, "ppg") ?? 0));
	const players: SquadPlayer[] = team.players
		.map((p: any) => {
			const name = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "Unknown";
			const ppg = stat(p.id, "ppg");
			const pct = (k: string) => {
				const v = stat(p.id, k);
				return v != null ? `${Math.round(v)}%` : "—";
			};
			const num = (k: string) => {
				const v = stat(p.id, k);
				return v != null ? v.toFixed(1) : "0.0";
			};
			return {
				id: p.id,
				jersey: p.jerseyNumber != null ? String(p.jerseyNumber) : "—",
				initials: initialsOf(name),
				image: getDisplayImageUrl(p.image),
				name,
				pos: p.position || "—",
				height: p.height || "—",
				weight: p.weight || "—",
				href: `/players/${p.slug || p.id}`,
				ppg: num("ppg"),
				rpg: num("rpg"),
				apg: num("apg"),
				fg: pct("fgPercent"),
				ft: pct("ftPercent"),
				tp: pct("threePointPercent"),
				ppgColor: ppg != null && ppg === maxPpg && maxPpg > 0 ? "#e4002b" : "#141009",
			};
		})
		.sort((a, b) => (parseInt(a.jersey) || 999) - (parseInt(b.jersey) || 999));

	// --- staff ---
	// Prefer the split-out coaching staff (already ordered coach → manager →
	// support); fall back to the legacy team_staff join until the migration copies
	// coaches, so existing coaches keep rendering with zero downtime.
	const legacyStaff: StaffMember[] = (staffRows as any[]).map((ts) => {
		const name = `${ts.staff?.firstName ?? ""} ${ts.staff?.lastName ?? ""}`.trim() || "Staff";
		return { initials: initialsOf(name), image: getDisplayImageUrl(ts.staff?.image), name, role: formatRole(ts.role) };
	});
	const newStaff: StaffMember[] = coachingRows.map((c) => ({
		initials: c.initials,
		image: c.image ?? null,
		name: c.name,
		role: c.role,
	}));
	const staff: StaffMember[] = newStaff.length > 0 ? newStaff : legacyStaff;
	const headCoach =
		staff.find((s) => /head coach|^coach$/i.test(s.role))?.name ||
		staff.find((s) => s.role.toLowerCase().includes("coach"))?.name ||
		"—";

	return {
		name: team.name,
		nickname: team.nickname,
		slug: team.slug,
		initials: initialsOf(team.name),
		logo: getDisplayImageUrl(team.logo),
		league,
		leagueAbbr: abbrOf(league),
		headCoach,
		currentSeason,
		form,
		heroStats,
		recent,
		upcoming,
		seasons,
		players,
		playerCount: players.length,
		staff,
	};
}
