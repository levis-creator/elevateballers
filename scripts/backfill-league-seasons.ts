/**
 * Phase 3 LeagueSeason backfill.
 *
 * Default mode is read-only. Use --apply only after the dry-run has no blockers.
 * The operation is idempotent and executes all writes in one transaction.
 */
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { config } from "dotenv";
import {
	planLeagueSeasonBackfill,
	type LeagueSeasonBackfillSnapshot,
} from "./lib/league-season-backfill";

config();
const apply = process.argv.includes("--apply");

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
		connectionLimit: 5,
		allowPublicKeyRetrieval:
			process.env.DB_ALLOW_PUBLIC_KEY_RETRIEVAL === "true" ||
			process.env.NODE_ENV !== "production",
	});
	return new PrismaClient({ adapter, log: ["error", "warn"] });
}

async function loadSnapshot(prisma: PrismaClient): Promise<LeagueSeasonBackfillSnapshot> {
	const [leagueSeasons, conferences, seasonTeams, matches] = await Promise.all([
		prisma.leagueSeason.findMany({
			include: {
				season: {
					select: {
						startDate: true,
						endDate: true,
						registrationOpensAt: true,
						registrationClosesAt: true,
						bracketType: true,
						active: true,
					},
				},
			},
		}),
		prisma.conference.findMany({
			select: {
				id: true,
				name: true,
				seasonId: true,
				leagueSeasonId: true,
				seasonTeams: { select: { leagueId: true } },
			},
		}),
		prisma.seasonTeam.findMany({
			select: {
				id: true,
				seasonId: true,
				leagueId: true,
				leagueSeasonId: true,
			},
		}),
		prisma.match.findMany({
			select: {
				id: true,
				seasonId: true,
				leagueId: true,
				leagueSeasonId: true,
			},
		}),
	]);

	return {
		leagueSeasons,
		conferences: conferences.map(({ seasonTeams: members, ...conference }) => ({
			...conference,
			memberLeagueIds: members.map((member) => member.leagueId),
		})),
		seasonTeams,
		matches,
	};
}

function printPlan(plan: ReturnType<typeof planLeagueSeasonBackfill>) {
	console.log(`Mode: ${apply ? "APPLY" : "DRY RUN"}`);
	console.log(`League seasons to populate: ${plan.leagueSeasons.length}`);
	console.log(`Conference links: ${plan.conferences.length}`);
	console.log(`Participant links: ${plan.seasonTeams.length}`);
	console.log(`Match links: ${plan.matches.length}`);
	console.log(`Blockers: ${plan.blockers.length}`);
	for (const blocker of plan.blockers) {
		console.log(`\n[BLOCKER] ${blocker.code}`);
		console.log(blocker.message);
		console.log(`IDs: ${blocker.ids.join(", ")}`);
	}
}

async function verify(prisma: PrismaClient) {
	const [missingIds, missingDates, missingConferenceLinks, missingTeamLinks, missingMatchLinks] =
		await Promise.all([
			prisma.leagueSeason.count({ where: { id: null } }),
			prisma.leagueSeason.count({ where: { OR: [{ startDate: null }, { endDate: null }] } }),
			prisma.conference.count({ where: { leagueSeasonId: null } }),
			prisma.seasonTeam.count({ where: { leagueSeasonId: null } }),
			prisma.match.count({
				where: {
					seasonId: { not: null },
					leagueId: { not: null },
					leagueSeasonId: null,
				},
			}),
		]);
	const result = {
		missingIds,
		missingDates,
		missingConferenceLinks,
		missingTeamLinks,
		missingMatchLinks,
	};
	console.log("Verification:", JSON.stringify(result));
	if (Object.values(result).some((count) => count > 0)) {
		throw new Error("Phase 3 verification failed: unresolved LeagueSeason fields remain.");
	}
}

async function main() {
	const prisma = createPrismaClient();
	try {
		const plan = planLeagueSeasonBackfill(
			await loadSnapshot(prisma),
			() => randomUUID(),
		);
		printPlan(plan);
		if (plan.blockers.length) {
			process.exitCode = 2;
			return;
		}
		if (!apply) {
			console.log("\nDry run complete. Re-run with --apply to commit this plan.");
			return;
		}

		await prisma.$transaction(
			async (tx) => {
				for (const row of plan.leagueSeasons) {
					await tx.leagueSeason.update({
						where: {
							leagueId_seasonId: {
								leagueId: row.leagueId,
								seasonId: row.seasonId,
							},
						},
						data: {
							id: row.id,
							startDate: row.startDate,
							endDate: row.endDate,
							registrationOpensAt: row.registrationOpensAt,
							registrationClosesAt: row.registrationClosesAt,
							bracketType: row.bracketType,
							status: row.status,
							competitionStructure: row.competitionStructure,
						},
					});

					// Child ownership is defined by the same legacy
					// (seasonId, leagueId) pair. Bulk updates keep production
					// transactions short over remote database connections.
					const expectedTeams = plan.seasonTeams.filter(
						(item) => item.leagueSeasonId === row.id,
					).length;
					const expectedMatches = plan.matches.filter(
						(item) => item.leagueSeasonId === row.id,
					).length;
					const conferenceIds = plan.conferences
						.filter((item) => item.leagueSeasonId === row.id)
						.map((item) => item.id);

					const teams = await tx.seasonTeam.updateMany({
						where: {
							seasonId: row.seasonId,
							leagueId: row.leagueId,
							OR: [{ leagueSeasonId: null }, { leagueSeasonId: row.id }],
						},
						data: { leagueSeasonId: row.id },
					});
					const matches = await tx.match.updateMany({
						where: {
							seasonId: row.seasonId,
							leagueId: row.leagueId,
							OR: [{ leagueSeasonId: null }, { leagueSeasonId: row.id }],
						},
						data: { leagueSeasonId: row.id },
					});
					const conferences = conferenceIds.length
						? await tx.conference.updateMany({
								where: {
									id: { in: conferenceIds },
									OR: [{ leagueSeasonId: null }, { leagueSeasonId: row.id }],
								},
								data: { leagueSeasonId: row.id },
							})
						: { count: 0 };

					if (
						teams.count !== expectedTeams ||
						matches.count !== expectedMatches ||
						conferences.count !== conferenceIds.length
					) {
						throw new Error(
							`Concurrent change detected for ${row.seasonId}:${row.leagueId}; ` +
								`expected teams/matches/conferences ${expectedTeams}/${expectedMatches}/${conferenceIds.length}, ` +
								`updated ${teams.count}/${matches.count}/${conferences.count}. Transaction rolled back.`,
						);
					}
				}
			},
			{ timeout: 120_000 },
		);

		await verify(prisma);
		console.log("Phase 3 backfill completed successfully.");
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((error) => {
	console.error("LeagueSeason backfill failed:", error);
	process.exitCode = 1;
});
