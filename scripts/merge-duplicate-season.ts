import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { config } from "dotenv";

config();

const TARGET_SEASON_ID = "cmr2mklko000004l7rhhhz26m";
const DUPLICATE_SEASON_ID = "cmr2oco0w000c04jlb3h2uj0l";
const LEAGUE_ID = "cml1v6gj90001lw6rce7ix3qd";

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
	});
}

function json(value: unknown) {
	return JSON.stringify(
		value,
		(_key, item) => (typeof item === "bigint" ? item.toString() : item),
		2,
	);
}

async function main() {
	const prisma = createPrismaClient();
	try {
		const [targetSeason, duplicateSeason, league, duplicateLinks, targetLink, staffCount] =
			await Promise.all([
				prisma.season.findUnique({ where: { id: TARGET_SEASON_ID } }),
				prisma.season.findUnique({ where: { id: DUPLICATE_SEASON_ID } }),
				prisma.league.findUnique({ where: { id: LEAGUE_ID } }),
				prisma.leagueSeason.findMany({
					where: { seasonId: DUPLICATE_SEASON_ID },
					include: {
						conferences: true,
						seasonTeams: true,
						matches: true,
					},
				}),
				prisma.leagueSeason.findUnique({
					where: {
						leagueId_seasonId: {
							leagueId: LEAGUE_ID,
							seasonId: TARGET_SEASON_ID,
						},
					},
				}),
				prisma.teamStaffMember.count({ where: { seasonId: DUPLICATE_SEASON_ID } }),
			]);

		if (!targetSeason) throw new Error(`Target season ${TARGET_SEASON_ID} does not exist.`);
		if (!league) throw new Error(`League ${LEAGUE_ID} does not exist.`);

		if (!duplicateSeason) {
			if (!targetLink) {
				throw new Error(
					"Duplicate season is already absent, but the target LeagueSeason link does not exist.",
				);
			}
			console.log(
				json({
					result: "ALREADY_MERGED",
					targetSeasonId: TARGET_SEASON_ID,
					leagueId: LEAGUE_ID,
					leagueSeasonId: targetLink.id,
				}),
			);
			return;
		}

		if (duplicateLinks.length !== 1 || duplicateLinks[0].leagueId !== LEAGUE_ID) {
			throw new Error(
				`Expected duplicate season to have exactly one LeagueSeason for ${LEAGUE_ID}; found: ` +
					duplicateLinks.map((row) => `${row.id}:${row.leagueId}`).join(", "),
			);
		}
		if (staffCount !== 0) {
			throw new Error(
				`Duplicate season has ${staffCount} TeamStaffMember row(s); refusing to delete unplanned data.`,
			);
		}

		const sourceLink = duplicateLinks[0];
		const unscopedMatches = await prisma.match.count({
			where: {
				seasonId: DUPLICATE_SEASON_ID,
				NOT: { leagueSeasonId: sourceLink.id },
			},
		});
		if (unscopedMatches !== 0) {
			throw new Error(
				`Duplicate season has ${unscopedMatches} match(es) outside the expected LeagueSeason.`,
			);
		}

		const snapshot = {
			createdAt: new Date().toISOString(),
			operation: "merge-duplicate-season",
			ids: {
				targetSeasonId: TARGET_SEASON_ID,
				duplicateSeasonId: DUPLICATE_SEASON_ID,
				leagueId: LEAGUE_ID,
			},
			league,
			targetSeason,
			duplicateSeason,
			targetLeagueSeasonBefore: targetLink,
			sourceLeagueSeason: sourceLink,
			teamStaffMembers: await prisma.teamStaffMember.findMany({
				where: { seasonId: DUPLICATE_SEASON_ID },
			}),
		};
		const backupDirectory = resolve("backups", "season-merges");
		await mkdir(backupDirectory, { recursive: true });
		const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
		const backupPath = resolve(
			backupDirectory,
			`${DUPLICATE_SEASON_ID}-into-${TARGET_SEASON_ID}-${stamp}.json`,
		);
		await writeFile(backupPath, json(snapshot), { encoding: "utf8", flag: "wx" });
		console.log(`Backup written: ${backupPath}`);

		const result = await prisma.$transaction(
			async (tx) => {
				const source = await tx.leagueSeason.findUnique({
					where: { id: sourceLink.id },
				});
				if (!source) throw new Error("Source LeagueSeason disappeared before the transaction.");

				const destination = await tx.leagueSeason.upsert({
					where: {
						leagueId_seasonId: {
							leagueId: LEAGUE_ID,
							seasonId: TARGET_SEASON_ID,
						},
					},
					update: {},
					create: {
						leagueId: LEAGUE_ID,
						seasonId: TARGET_SEASON_ID,
						startDate: source.startDate,
						endDate: source.endDate,
						registrationOpensAt: source.registrationOpensAt,
						registrationClosesAt: source.registrationClosesAt,
						status: source.status,
						competitionStructure: source.competitionStructure,
						bracketType: source.bracketType,
					},
				});

				const sourceConferences = await tx.conference.findMany({
					where: { leagueSeasonId: source.id },
					orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
				});
				let movedConferences = 0;
				let mergedConferences = 0;
				for (const conference of sourceConferences) {
					const existing = await tx.conference.findUnique({
						where: {
							leagueSeasonId_name: {
								leagueSeasonId: destination.id,
								name: conference.name,
							},
						},
					});
					if (existing) {
						await tx.seasonTeam.updateMany({
							where: { conferenceId: conference.id },
							data: { conferenceId: existing.id },
						});
						await tx.conference.delete({ where: { id: conference.id } });
						mergedConferences++;
					} else {
						await tx.conference.update({
							where: { id: conference.id },
							data: {
								seasonId: TARGET_SEASON_ID,
								leagueSeasonId: destination.id,
							},
						});
						movedConferences++;
					}
				}

				const sourceTeams = await tx.seasonTeam.findMany({
					where: { leagueSeasonId: source.id },
					orderBy: { id: "asc" },
				});
				let movedTeams = 0;
				let skippedTeams = 0;
				for (const membership of sourceTeams) {
					const existing = await tx.seasonTeam.findUnique({
						where: {
							leagueSeasonId_teamId: {
								leagueSeasonId: destination.id,
								teamId: membership.teamId,
							},
						},
					});
					if (existing) {
						await tx.seasonTeam.delete({ where: { id: membership.id } });
						skippedTeams++;
					} else {
						await tx.seasonTeam.update({
							where: { id: membership.id },
							data: {
								seasonId: TARGET_SEASON_ID,
								leagueId: LEAGUE_ID,
								leagueSeasonId: destination.id,
							},
						});
						movedTeams++;
					}
				}

				const movedMatches = await tx.match.updateMany({
					where: { leagueSeasonId: source.id },
					data: {
						seasonId: TARGET_SEASON_ID,
						leagueId: LEAGUE_ID,
						leagueSeasonId: destination.id,
					},
				});

				const leftovers = {
					conferences: await tx.conference.count({ where: { leagueSeasonId: source.id } }),
					seasonTeams: await tx.seasonTeam.count({ where: { leagueSeasonId: source.id } }),
					matches: await tx.match.count({ where: { leagueSeasonId: source.id } }),
				};
				if (Object.values(leftovers).some((count) => count !== 0)) {
					throw new Error(`Source LeagueSeason is not empty: ${json(leftovers)}`);
				}

				await tx.leagueSeason.delete({ where: { id: source.id } });
				await tx.season.delete({ where: { id: DUPLICATE_SEASON_ID } });

				const postconditions = {
					duplicateSeasonCount: await tx.season.count({
						where: { id: DUPLICATE_SEASON_ID },
					}),
					targetLeagueSeasonCount: await tx.leagueSeason.count({
						where: { leagueId: LEAGUE_ID, seasonId: TARGET_SEASON_ID },
					}),
					scopeMismatchCount: Number(
						(
							await tx.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
								SELECT COUNT(*) AS count
								FROM (
									SELECT c.id
									FROM conferences c
									JOIN league_seasons ls ON ls.id = c.league_season_id
									WHERE c.season_id <> ls.season_id
									UNION ALL
									SELECT st.id
									FROM season_teams st
									JOIN league_seasons ls ON ls.id = st.league_season_id
									WHERE st.season_id <> ls.season_id OR st.league_id <> ls.league_id
									UNION ALL
									SELECT m.id
									FROM matches m
									JOIN league_seasons ls ON ls.id = m.league_season_id
									WHERE (m.season_id IS NOT NULL AND m.season_id <> ls.season_id)
									   OR (m.league_id IS NOT NULL AND m.league_id <> ls.league_id)
								) mismatches
							`)
						)[0]?.count ?? 0n,
					),
				};
				if (
					postconditions.duplicateSeasonCount !== 0 ||
					postconditions.targetLeagueSeasonCount !== 1 ||
					postconditions.scopeMismatchCount !== 0
				) {
					throw new Error(`Postcondition failure: ${json(postconditions)}`);
				}

				return {
					targetLeagueSeasonId: destination.id,
					movedConferences,
					mergedConferences,
					movedTeams,
					skippedTeams,
					movedMatches: movedMatches.count,
					postconditions,
				};
			},
			{ maxWait: 10_000, timeout: 120_000 },
		);

		console.log(json({ result: "MERGED", backupPath, ...result }));
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((error) => {
	console.error("Season merge failed; transaction rolled back:", error);
	process.exitCode = 1;
});
