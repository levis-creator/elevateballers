/**
 * Guarded repair for legacy matches that have a league but no season.
 *
 * Default: dry-run. --apply writes only season_id and, when already available,
 * league_season_id. Existing non-null values are never overwritten.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { config } from "dotenv";
import { planLegacyMatchScopeRepair } from "./lib/legacy-match-scope-repair";

config();
const apply = process.argv.includes("--apply");

function createPrismaClient() {
	const value = process.env.DATABASE_URL;
	if (!value) throw new Error("DATABASE_URL is not set.");
	const url = new URL(value);
	return new PrismaClient({
		adapter: new PrismaMariaDb({
			host: url.hostname,
			port: Number.parseInt(url.port, 10) || 3306,
			user: decodeURIComponent(url.username),
			password: decodeURIComponent(url.password),
			database: url.pathname.slice(1),
			connectionLimit: 3,
			allowPublicKeyRetrieval:
				process.env.DB_ALLOW_PUBLIC_KEY_RETRIEVAL === "true" ||
				process.env.NODE_ENV !== "production",
		}),
		log: ["error", "warn"],
	});
}

async function main() {
	const prisma = createPrismaClient();
	try {
		const [matches, leagueSeasons, participations] = await Promise.all([
			prisma.match.findMany({
				where: { seasonId: null, leagueId: { not: null } },
				select: {
					id: true,
					date: true,
					seasonId: true,
					leagueId: true,
					leagueSeasonId: true,
					team1Id: true,
					team2Id: true,
				},
			}),
			prisma.leagueSeason.findMany({
				select: {
					id: true,
					seasonId: true,
					leagueId: true,
					startDate: true,
					endDate: true,
					season: { select: { startDate: true, endDate: true } },
				},
			}),
			prisma.seasonTeam.findMany({
				select: { teamId: true, seasonId: true, leagueId: true },
			}),
		]);

		const plan = planLegacyMatchScopeRepair(
			matches,
			leagueSeasons.map((row) => ({
				id: row.id,
				seasonId: row.seasonId,
				leagueId: row.leagueId,
				startDate: row.startDate ?? row.season.startDate,
				endDate: row.endDate ?? row.season.endDate,
			})),
			participations,
		);

		console.log(`Mode: ${apply ? "APPLY" : "DRY RUN"}`);
		console.log(`Eligible legacy matches: ${matches.length}`);
		console.log(`Safe proposals: ${plan.updates.length}`);
		console.log(`Blockers: ${plan.blockers.length}`);
		for (const blocker of plan.blockers) console.log(JSON.stringify(blocker));
		if (plan.blockers.length) {
			process.exitCode = 2;
			return;
		}
		if (!apply) {
			const bySeason = new Map<string, number>();
			for (const row of plan.updates) {
				bySeason.set(row.seasonId, (bySeason.get(row.seasonId) ?? 0) + 1);
			}
			console.log("Proposals by season:", Object.fromEntries(bySeason));
			console.log("No database writes performed.");
			return;
		}

		const backupDir = path.resolve("backups/legacy-match-scope");
		await mkdir(backupDir, { recursive: true });
		const backupPath = path.join(
			backupDir,
			`${new Date().toISOString().replace(/[:.]/g, "-")}-before.json`,
		);
		await writeFile(backupPath, JSON.stringify({ createdAt: new Date(), matches, plan }, null, 2));
		console.log(`Local pre-change snapshot: ${backupPath}`);

		await prisma.$transaction(
			async (tx) => {
				for (const row of plan.updates) {
					const result = await tx.match.updateMany({
						where: {
							id: row.matchId,
							seasonId: null,
							leagueId: row.expectedLeagueId,
							leagueSeasonId: null,
						},
						data: {
							seasonId: row.seasonId,
							...(row.leagueSeasonId
								? { leagueSeasonId: row.leagueSeasonId }
								: {}),
						},
					});
					if (result.count !== 1) {
						throw new Error(
							`Concurrent change detected for ${row.matchId}; transaction rolled back.`,
						);
					}
				}
			},
			{ timeout: 60_000 },
		);
		console.log(`Updated ${plan.updates.length} matches without overwriting existing scope.`);
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((error) => {
	console.error("Legacy match scope repair failed:", error);
	process.exitCode = 1;
});
