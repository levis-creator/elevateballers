import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';

config();
config({ path: '.env.production', override: false });

const databaseUrl = process.env.DATABASE_URL || process.env.PRODUCTION_DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL or PRODUCTION_DATABASE_URL is required');

const tables = [
  'players', 'teams', 'seasons', 'league_seasons', 'season_teams',
  'season_registration_applications', 'team_ownership_claims', 'team_ownerships',
  'season_registration_roster_changes', 'season_team_players', 'season_player_transfers', 'season_roster_history',
];

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputDir = join(process.cwd(), 'backups');
const outputPath = join(outputDir, `season-registration-production-${stamp}.json`);
const connection = await createConnection(databaseUrl);

try {
  const snapshot: Record<string, unknown> = {
    generatedAt: new Date().toISOString(),
    database: new URL(databaseUrl).hostname,
    tables: {},
  };
  for (const table of tables) {
    const [rows] = await connection.query(`SELECT * FROM \`${table}\``);
    const [definition] = await connection.query(`SHOW CREATE TABLE \`${table}\``);
    (snapshot.tables as Record<string, unknown>)[table] = { rows, definition };
  }
  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, JSON.stringify(snapshot, null, 2), { encoding: 'utf8', flag: 'wx' });
  console.log(JSON.stringify({ outputPath, tables, status: 'created' }, null, 2));
} finally {
  await connection.end();
}
