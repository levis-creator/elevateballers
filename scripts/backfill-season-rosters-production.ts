import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';

config();
config({ path: '.env.production', override: false });
const databaseUrl = process.env.DATABASE_URL || process.env.PRODUCTION_DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL or PRODUCTION_DATABASE_URL is required');
const db = await createConnection(databaseUrl);

try {
  await db.beginTransaction();
  const [result] = await db.query(`
    INSERT INTO season_team_players
      (id, league_season_id, season_team_id, team_id, player_id, jersey_number, position, status, joined_at, created_at, updated_at)
    SELECT
      UUID(), st.league_season_id, st.id, p.team_id, p.id, p.jersey_number, p.position, 'APPROVED', NOW(3), NOW(3), NOW(3)
    FROM players p
    INNER JOIN season_teams st ON st.team_id = p.team_id
    INNER JOIN league_seasons ls ON ls.id = st.league_season_id
    INNER JOIN seasons s ON s.id = ls.season_id
    WHERE p.team_id IS NOT NULL
      AND p.approved = 1
      AND s.active = 1
      AND NOT EXISTS (
        SELECT 1 FROM season_team_players existing
        WHERE existing.league_season_id = st.league_season_id
          AND existing.team_id = p.team_id
          AND existing.player_id = p.id
      )
  `);
  const [historyResult] = await db.query(`
    INSERT INTO season_roster_history
      (id, league_season_id, player_id, season_team_id, roster_id, action, created_at)
    SELECT
      UUID(), r.league_season_id, r.player_id, r.season_team_id, r.id, 'BACKFILL_APPROVED', NOW(3)
    FROM season_team_players r
    WHERE r.status = 'APPROVED'
      AND NOT EXISTS (
        SELECT 1 FROM season_roster_history h WHERE h.roster_id = r.id
      )
  `);
  await db.commit();
  console.log(JSON.stringify({ status: 'completed', inserted: (result as { affectedRows?: number }).affectedRows ?? 0, historyInserted: (historyResult as { affectedRows?: number }).affectedRows ?? 0 }, null, 2));
} catch (error) {
  await db.rollback();
  throw error;
} finally {
  await db.end();
}
