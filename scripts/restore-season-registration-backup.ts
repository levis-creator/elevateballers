import { readFile } from 'node:fs/promises';
import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';

config();
config({ path: '.env.production', override: false });
const backupPath = process.env.SEASON_REGISTRATION_BACKUP;
if (!backupPath) throw new Error('SEASON_REGISTRATION_BACKUP must point to a JSON backup file');
const backup = JSON.parse(await readFile(backupPath, 'utf8')) as { generatedAt: string; tables: Record<string, { rows: unknown[] }> };
const tableOrder = ['players', 'teams', 'seasons', 'league_seasons', 'season_teams', 'season_registration_applications', 'team_ownership_claims', 'team_ownerships', 'season_registration_roster_changes', 'season_team_players', 'season_player_transfers', 'season_roster_history'];
const summary = tableOrder.map((table) => ({ table, rows: backup.tables[table]?.rows?.length ?? 0 }));

if (process.argv.includes('--dry-run') || !process.argv.includes('--confirm')) {
  console.log(JSON.stringify({ mode: 'dry-run', backupGeneratedAt: backup.generatedAt, restoreOrder: summary, message: 'No production changes were made. Pass --confirm only during an approved recovery.' }, null, 2));
  process.exit(0);
}

const databaseUrl = process.env.DATABASE_URL || process.env.PRODUCTION_DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL or PRODUCTION_DATABASE_URL is required');
const db = await createConnection(databaseUrl);
try {
  await db.beginTransaction();
  for (const { table } of summary) {
    const rows = backup.tables[table]?.rows ?? [];
    for (const row of rows as Array<Record<string, unknown>>) {
      const columns = Object.keys(row);
      const values = columns.map((column) => row[column]);
      const updates = columns.filter((column) => column !== 'id').map((column) => `\`${column}\` = VALUES(\`${column}\`)`).join(', ');
      await db.query(`INSERT INTO \`${table}\` (${columns.map((column) => `\`${column}\``).join(', ')}) VALUES (${columns.map(() => '?').join(', ')}) ON DUPLICATE KEY UPDATE ${updates}`, values);
    }
  }
  await db.commit();
  console.log(JSON.stringify({ mode: 'restore', status: 'completed', backupGeneratedAt: backup.generatedAt, tables: summary }, null, 2));
} catch (error) {
  await db.rollback();
  throw error;
} finally {
  await db.end();
}
