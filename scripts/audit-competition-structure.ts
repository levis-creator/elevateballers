/**
 * Read-only Phase 1 audit for the LeagueSeason normalization.
 *
 * Usage:
 *   npm run audit:competition
 *   npm run audit:competition -- --json
 *
 * Exit codes: 0 = no blockers, 1 = audit could not run, 2 = blockers found.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { config } from "dotenv";
import {
	auditCompetitionStructure,
	type CompetitionAuditSnapshot,
} from "./lib/competition-structure-audit";

config();

function createPrismaClient() {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) throw new Error("DATABASE_URL environment variable is not set.");
	const url = new URL(connectionString);
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

async function loadSnapshot(prisma: PrismaClient): Promise<CompetitionAuditSnapshot> {
	const [leagues, seasons, conferences, participations, matches] = await Promise.all([
		prisma.league.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
		prisma.season.findMany({
			select: {
				id: true,
				name: true,
				leagueSeasons: { select: { leagueId: true } },
			},
			orderBy: { startDate: "asc" },
		}),
		prisma.conference.findMany({
			select: { id: true, name: true, seasonId: true },
			orderBy: [{ seasonId: "asc" }, { sortOrder: "asc" }],
		}),
		prisma.seasonTeam.findMany({
			select: {
				id: true,
				seasonId: true,
				leagueId: true,
				teamId: true,
				conferenceId: true,
				team: { select: { name: true } },
			},
		}),
		prisma.match.findMany({
			select: {
				id: true,
				slug: true,
				seasonId: true,
				leagueId: true,
				team1Id: true,
				team2Id: true,
			},
		}),
	]);

	return {
		leagues,
		seasons: seasons.map(({ leagueSeasons, ...season }) => ({
			...season,
			leagueIds: leagueSeasons.map((row) => row.leagueId),
		})),
		conferences,
		participations: participations.map(({ team, ...row }) => ({
			...row,
			teamName: team.name,
		})),
		matches,
	};
}

function printHumanReport(report: ReturnType<typeof auditCompetitionStructure>) {
	console.log("Competition structure audit (read-only)");
	console.log(`Generated: ${report.generatedAt}`);
	console.log(
		`Records: ${report.counts.leagues} leagues, ${report.counts.seasons} seasons, ` +
			`${report.counts.conferences} conferences, ${report.counts.participations} participations, ` +
			`${report.counts.matches} matches`,
	);
	console.log(
		`Season league links: ${report.seasonLeagueDistribution.zero} with 0, ` +
			`${report.seasonLeagueDistribution.one} with 1, ` +
			`${report.seasonLeagueDistribution.two} with 2, ` +
			`${report.seasonLeagueDistribution.moreThanTwo} with more than 2`,
	);
	console.log(
		`League inventory: ${report.leagueInventory.map((league) => `${league.name} (${league.id})`).join(", ")}`,
	);
	console.log(
		`Official leagues: Men=${report.officialLeagues.men?.name ?? "UNRESOLVED"}, ` +
			`Women=${report.officialLeagues.women?.name ?? "UNRESOLVED"}`,
	);
	console.log(`Result: ${report.counts.blockers} blocker(s), ${report.counts.warnings} warning(s)`);

	for (const item of report.findings) {
		console.log(`\n[${item.severity}] ${item.code}`);
		console.log(item.message);
		console.log(`IDs: ${item.ids.join(", ")}`);
	}
	if (!report.findings.length) console.log("\nNo migration blockers or warnings found.");
}

async function main() {
	const prisma = createPrismaClient();
	try {
		const report = auditCompetitionStructure(await loadSnapshot(prisma));
		if (process.argv.includes("--json")) {
			console.log(JSON.stringify(report, null, 2));
		} else {
			printHumanReport(report);
		}
		if (report.counts.blockers > 0) process.exitCode = 2;
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((error) => {
	console.error("Competition structure audit failed:", error);
	process.exitCode = 1;
});
