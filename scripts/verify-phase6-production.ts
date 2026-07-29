import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';

config();
config({ path: '.env.production', override: false });
const databaseUrl = process.env.DATABASE_URL || process.env.PRODUCTION_DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL or PRODUCTION_DATABASE_URL is required');
const db = await createConnection(databaseUrl);

try {
  const [migrations] = await db.query(`SELECT migration_name, finished_at FROM _prisma_migrations WHERE migration_name IN ('20260729020000_add_season_registration_and_rosters','20260729030000_add_season_roster_status_and_transfers','20260729040000_add_phase6_roster_integrity_indexes') ORDER BY migration_name`);
  const [indexes] = await db.query(`SELECT DISTINCT index_name FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name IN ('season_team_players','season_player_transfers','season_roster_history') AND index_name IN ('season_team_players_season_team_id_status_left_at_idx','season_team_players_player_id_status_left_at_idx','season_player_transfers_status_created_at_idx','season_roster_history_player_id_created_at_idx') ORDER BY index_name`);
  const [counts] = await db.query(`SELECT (SELECT COUNT(*) FROM season_team_players) AS roster_rows, (SELECT COUNT(*) FROM season_roster_history) AS history_rows, (SELECT COUNT(*) FROM season_player_transfers) AS transfer_rows`);
  console.log(JSON.stringify({ migrations, indexes, counts }, null, 2));
} finally {
  await db.end();
}
