/**
 * Read-only Phase 6 preflight. It mirrors the contract migration guard and
 * never mutates the database.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { config } from "dotenv";

config();

type CountRow = { count: bigint };
type SchemaRow = Record<string, string | bigint | null>;

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

async function count(prisma: PrismaClient, sql: string) {
	// Every statement is a fixed source-code constant; no user input is interpolated.
	const rows = await prisma.$queryRawUnsafe<CountRow[]>(sql);
	return Number(rows[0]?.count ?? 0);
}

async function main() {
	const prisma = createPrismaClient();
	try {
		const checks = {
			leagueSeasonsMissingIdentityOrDates: await count(
				prisma,
				`SELECT COUNT(*) AS count FROM league_seasons
				 WHERE id IS NULL OR start_date IS NULL OR end_date IS NULL`,
			),
			conferencesMissingScope: await count(
				prisma,
				`SELECT COUNT(*) AS count FROM conferences WHERE league_season_id IS NULL`,
			),
			participantsMissingScope: await count(
				prisma,
				`SELECT COUNT(*) AS count FROM season_teams WHERE league_season_id IS NULL`,
			),
			scopedMatchesMissingScope: await count(
				prisma,
				`SELECT COUNT(*) AS count FROM matches
				 WHERE season_id IS NOT NULL AND league_season_id IS NULL`,
			),
			conferencePairMismatches: await count(
				prisma,
				`SELECT COUNT(*) AS count
				   FROM conferences c
				   JOIN league_seasons ls ON ls.id = c.league_season_id
				  WHERE c.season_id <> ls.season_id`,
			),
			participantPairMismatches: await count(
				prisma,
				`SELECT COUNT(*) AS count
				   FROM season_teams st
				   JOIN league_seasons ls ON ls.id = st.league_season_id
				  WHERE st.season_id <> ls.season_id OR st.league_id <> ls.league_id`,
			),
			matchPairMismatches: await count(
				prisma,
				`SELECT COUNT(*) AS count
				   FROM matches m
				   JOIN league_seasons ls ON ls.id = m.league_season_id
				  WHERE (m.season_id IS NOT NULL AND m.season_id <> ls.season_id)
				     OR (m.league_id IS NOT NULL AND m.league_id <> ls.league_id)`,
			),
		};
		const violations = Object.values(checks).reduce((sum, value) => sum + value, 0);
		const columns = await prisma.$queryRawUnsafe<SchemaRow[]>(`
			SELECT TABLE_NAME, COLUMN_NAME, IS_NULLABLE, COLUMN_KEY
			FROM information_schema.COLUMNS
			WHERE TABLE_SCHEMA = DATABASE()
			  AND (
			    (TABLE_NAME = 'league_seasons' AND COLUMN_NAME IN ('id', 'start_date', 'end_date'))
			    OR (TABLE_NAME IN ('conferences', 'season_teams') AND COLUMN_NAME = 'league_season_id')
			  )
			ORDER BY TABLE_NAME, ORDINAL_POSITION
		`);
		const indexes = await prisma.$queryRawUnsafe<SchemaRow[]>(`
			SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE,
			       GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS COLUMNS_IN_INDEX
			FROM information_schema.STATISTICS
			WHERE TABLE_SCHEMA = DATABASE()
			  AND TABLE_NAME IN ('league_seasons', 'season_teams')
			GROUP BY TABLE_NAME, INDEX_NAME, NON_UNIQUE
			ORDER BY TABLE_NAME, INDEX_NAME
		`);
		const foreignKeys = await prisma.$queryRawUnsafe<SchemaRow[]>(`
			SELECT CONSTRAINT_NAME, TABLE_NAME, DELETE_RULE, UPDATE_RULE
			FROM information_schema.REFERENTIAL_CONSTRAINTS
			WHERE CONSTRAINT_SCHEMA = DATABASE()
			  AND CONSTRAINT_NAME IN (
			    'conferences_league_season_id_fkey',
			    'season_teams_league_season_id_fkey',
			    'matches_league_season_id_fkey'
			  )
			ORDER BY CONSTRAINT_NAME
		`);
		const normalize = (rows: SchemaRow[]) =>
			rows.map((row) =>
				Object.fromEntries(
					Object.entries(row).map(([key, value]) => [
						key,
						typeof value === "bigint" ? Number(value) : value,
					]),
				),
			);
		console.log(
			JSON.stringify(
				{
					mode: "READ_ONLY",
					checks,
					violations,
					contractSchema: {
						columns: normalize(columns),
						indexes: normalize(indexes),
						foreignKeys: normalize(foreignKeys),
					},
				},
				null,
				2,
			),
		);
		if (violations) process.exitCode = 2;
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((error) => {
	console.error("Phase 6 contract audit failed:", error);
	process.exitCode = 1;
});
