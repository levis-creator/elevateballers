/**
 * Read-only audit for matches created before season/league scoping existed.
 *
 * This script never writes to the database. It prints evidence and suggested
 * season/league pairs so an operator can review every legacy assignment.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { config } from "dotenv";

config();

type Candidate = {
	seasonId: string;
	seasonName: string;
	leagueId: string;
	leagueName: string;
	leagueSeasonId: string | null;
	dateCompatible: boolean;
	reasons: string[];
};

function createPrismaClient() {
	const value = process.env.DATABASE_URL;
	if (!value) throw new Error("DATABASE_URL is not set.");
	const url = new URL(value);
	const adapter = new PrismaMariaDb({
		host: url.hostname,
		port: Number.parseInt(url.port, 10) || 3306,
		user: decodeURIComponent(url.username),
		password: decodeURIComponent(url.password),
		database: url.pathname.slice(1),
		connectionLimit: 3,
		allowPublicKeyRetrieval:
			process.env.DB_ALLOW_PUBLIC_KEY_RETRIEVAL === "true" ||
			process.env.NODE_ENV !== "production",
	});
	return new PrismaClient({ adapter, log: ["error", "warn"] });
}

const normalize = (value: string | null | undefined) =>
	(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

async function main() {
	const prisma = createPrismaClient();
	try {
		const [leagues, leagueSeasons, matches] = await Promise.all([
			prisma.league.findMany({
				select: { id: true, name: true, slug: true },
				orderBy: { name: "asc" },
			}),
			prisma.leagueSeason.findMany({
				select: {
					id: true,
					leagueId: true,
					seasonId: true,
					startDate: true,
					endDate: true,
					league: { select: { name: true } },
					season: {
						select: { name: true, startDate: true, endDate: true },
					},
				},
			}),
			prisma.match.findMany({
				where: { OR: [{ seasonId: null }, { leagueId: null }] },
				select: {
					id: true,
					slug: true,
					date: true,
					status: true,
					leagueId: true,
					leagueName: true,
					seasonId: true,
					team1Id: true,
					team1Name: true,
					team2Id: true,
					team2Name: true,
				},
				orderBy: [{ date: "asc" }, { id: "asc" }],
			}),
		]);

		const teamIds = [
			...new Set(matches.flatMap((match) => [match.team1Id, match.team2Id]).filter(Boolean)),
		] as string[];
		const participations = await prisma.seasonTeam.findMany({
			where: { teamId: { in: teamIds } },
			select: { teamId: true, seasonId: true, leagueId: true },
		});
		const pairsByTeam = new Map<string, Set<string>>();
		for (const row of participations) {
			const set = pairsByTeam.get(row.teamId) ?? new Set<string>();
			set.add(`${row.seasonId}:${row.leagueId}`);
			pairsByTeam.set(row.teamId, set);
		}

		const records = matches.map((match) => {
			const legacyLeagueName = normalize(match.leagueName);
			const namedLeagueIds = new Set(
				leagues
					.filter((league) => {
						const names = [normalize(league.name), normalize(league.slug)];
						return Boolean(
							legacyLeagueName &&
								names.some(
									(name) =>
										name === legacyLeagueName ||
										(name.length >= 4 && legacyLeagueName.includes(name)),
								),
						);
					})
					.map((league) => league.id),
			);

			const team1Pairs = match.team1Id
				? pairsByTeam.get(match.team1Id) ?? new Set<string>()
				: new Set<string>();
			const team2Pairs = match.team2Id
				? pairsByTeam.get(match.team2Id) ?? new Set<string>()
				: new Set<string>();
			const sharedTeamPairs = new Set(
				[...team1Pairs].filter((pair) => team2Pairs.has(pair)),
			);

			const candidates: Candidate[] = leagueSeasons
				.filter((row) => {
					if (match.seasonId && row.seasonId !== match.seasonId) return false;
					if (match.leagueId && row.leagueId !== match.leagueId) return false;
					return true;
				})
				.map((row) => {
					const start = row.startDate ?? row.season.startDate;
					const end = row.endDate ?? row.season.endDate;
					const dateCompatible = match.date >= start && match.date <= end;
					const pair = `${row.seasonId}:${row.leagueId}`;
					const reasons: string[] = [];
					if (match.seasonId === row.seasonId) reasons.push("existing seasonId");
					if (match.leagueId === row.leagueId) reasons.push("existing leagueId");
					if (namedLeagueIds.has(row.leagueId)) reasons.push("legacy leagueName");
					if (sharedTeamPairs.has(pair)) reasons.push("both teams share participation");
					if (dateCompatible) reasons.push("match date within season");
					return {
						seasonId: row.seasonId,
						seasonName: row.season.name,
						leagueId: row.leagueId,
						leagueName: row.league.name,
						leagueSeasonId: row.id,
						dateCompatible,
						reasons,
					};
				})
				.filter((candidate) => {
					if (match.seasonId || match.leagueId) return true;
					return candidate.reasons.some((reason) =>
						["legacy leagueName", "both teams share participation", "match date within season"].includes(
							reason,
						),
					);
				});

			const strong = candidates.filter((candidate) => {
				if (match.seasonId || match.leagueId) {
					return candidate.dateCompatible;
				}
				return (
					candidate.dateCompatible &&
					(candidate.reasons.includes("legacy leagueName") ||
						candidate.reasons.includes("both teams share participation"))
				);
			});

			const classification =
				strong.length === 1
					? "PROPOSED"
					: strong.length > 1
						? "AMBIGUOUS"
						: "UNRESOLVED";

			return {
				id: match.id,
				slug: match.slug,
				date: match.date.toISOString(),
				status: match.status,
				teams: [
					{ id: match.team1Id, name: match.team1Name },
					{ id: match.team2Id, name: match.team2Name },
				],
				legacy: {
					seasonId: match.seasonId,
					leagueId: match.leagueId,
					leagueName: match.leagueName,
				},
				classification,
				proposed: strong.length === 1 ? strong[0] : null,
				candidates,
			};
		});

		const summary = {
			total: records.length,
			proposed: records.filter((record) => record.classification === "PROPOSED").length,
			ambiguous: records.filter((record) => record.classification === "AMBIGUOUS").length,
			unresolved: records.filter((record) => record.classification === "UNRESOLVED").length,
		};
		console.log(JSON.stringify({ generatedAt: new Date().toISOString(), summary, records }, null, 2));
		if (summary.ambiguous || summary.unresolved) process.exitCode = 2;
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((error) => {
	console.error("Legacy match scope audit failed:", error);
	process.exitCode = 1;
});
