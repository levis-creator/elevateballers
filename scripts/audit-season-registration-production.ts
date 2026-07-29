import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';

config();
config({ path: '.env.production', override: false });
const databaseUrl = process.env.DATABASE_URL || process.env.PRODUCTION_DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL or PRODUCTION_DATABASE_URL is required');
const db = await createConnection(databaseUrl);

try {
  const queries: Record<string, string> = {
    teamPlayers: 'SELECT COUNT(*) AS count FROM players WHERE team_id IS NOT NULL',
    seasonTeams: 'SELECT COUNT(*) AS count FROM season_teams',
    seasonRosters: 'SELECT COUNT(*) AS count FROM season_team_players',
    duplicateRoster: 'SELECT COUNT(*) AS count FROM (SELECT league_season_id, team_id, player_id FROM season_team_players GROUP BY league_season_id, team_id, player_id HAVING COUNT(*) > 1) duplicates',
    orphanRosterTeams: 'SELECT COUNT(*) AS count FROM season_team_players r LEFT JOIN season_teams st ON st.id = r.season_team_id WHERE st.id IS NULL',
    orphanRosterPlayers: 'SELECT COUNT(*) AS count FROM season_team_players r LEFT JOIN players p ON p.id = r.player_id WHERE p.id IS NULL',
    mismatchedRosterScope: 'SELECT COUNT(*) AS count FROM season_team_players r JOIN season_teams st ON st.id = r.season_team_id WHERE r.league_season_id <> st.league_season_id OR r.team_id <> st.team_id',
    duplicateTransfers: 'SELECT COUNT(*) AS count FROM (SELECT league_season_id, player_id, from_season_team_id, to_season_team_id FROM season_player_transfers GROUP BY league_season_id, player_id, from_season_team_id, to_season_team_id HAVING COUNT(*) > 1) duplicates',
  };
  const report: Record<string, unknown> = { generatedAt: new Date().toISOString(), checks: {} };
  for (const [name, sql] of Object.entries(queries)) {
    const [rows] = await db.query(sql);
    (report.checks as Record<string, unknown>)[name] = (rows as Array<Record<string, unknown>>)[0]?.count ?? 0;
  }
  console.log(JSON.stringify(report, null, 2));
} finally {
  await db.end();
}
