/**
 * Classify existing matches as MANUAL or PLAY_BY_PLAY (matches.score_source).
 *
 * Dry run by default: prints what would change and the rows to review, and
 * writes nothing. Pass --apply to update. Only rows still at NONE are touched,
 * so it is safe to re-run.
 *
 *   npx tsx scripts/backfill-match-score-source.ts
 *   npx tsx scripts/backfill-match-score-source.ts --apply
 *
 * The dry run works before migration 20261029000000_add_match_score_source;
 * --apply requires it.
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';
import { classifyScoreSource } from '../src/features/game-tracking/domain/usecases/score-calculation';

const apply = process.argv.includes('--apply');

if (process.env.DB_SSL !== 'true' && process.env.DB_ALLOW_INSECURE_CONNECTION !== 'true') {
  throw new Error('This database does not support TLS. Set DB_ALLOW_INSECURE_CONNECTION=true only when running from a trusted server/network, or enable DB_SSL=true.');
}
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required.');
const database = new URL(databaseUrl);
const connection = await mysql.createConnection({
  host: database.hostname,
  port: Number(database.port || 3306),
  user: decodeURIComponent(database.username),
  password: decodeURIComponent(database.password),
  database: database.pathname.slice(1),
  connectTimeout: 30000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

const [columns] = await connection.execute<any[]>(
  "SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'matches' AND column_name = 'score_source'",
);
// Before the migration every match would start at NONE, so a dry run can
// still preview the classification; only --apply needs the column.
const migrated = columns.length > 0;
if (!migrated && apply) {
  await connection.end();
  throw new Error('matches.score_source does not exist yet. Apply prisma/migrations/20261029000000_add_match_score_source first.');
}
if (!migrated) console.log('score_source column not found — previewing as if every match were NONE.\n');

const SCORING = "'TWO_POINT_MADE', 'THREE_POINT_MADE', 'FREE_THROW_MADE'";
const POINTS = "CASE e.event_type WHEN 'TWO_POINT_MADE' THEN 2 WHEN 'THREE_POINT_MADE' THEN 3 WHEN 'FREE_THROW_MADE' THEN 1 ELSE 0 END";
const [rows] = await connection.execute<any[]>(`
  SELECT
    m.id, m.date, m.status, m.team1_score, m.team2_score,
    COALESCE(t1.name, m.team1_name, 'Team 1') AS team1,
    COALESCE(t2.name, m.team2_name, 'Team 2') AS team2,
    COALESCE(SUM(e.is_undone = 0 AND e.event_type IN (${SCORING})), 0) AS scoring_events,
    COALESCE(SUM(e.is_undone = 0 AND e.event_type NOT IN (${SCORING})), 0) AS other_events,
    COALESCE(SUM(CASE WHEN e.is_undone = 0 AND e.team_id = m.team1_id THEN ${POINTS} ELSE 0 END), 0) AS event_team1,
    COALESCE(SUM(CASE WHEN e.is_undone = 0 AND e.team_id = m.team2_id THEN ${POINTS} ELSE 0 END), 0) AS event_team2
  FROM matches m
  LEFT JOIN teams t1 ON t1.id = m.team1_id
  LEFT JOIN teams t2 ON t2.id = m.team2_id
  LEFT JOIN match_events e ON e.match_id = m.id
  ${migrated ? "WHERE m.score_source = 'NONE'" : ''}
  GROUP BY m.id, m.date, m.status, m.team1_score, m.team2_score, t1.name, t2.name, m.team1_name, m.team2_name
  ORDER BY m.date
`);

const toSet = { MANUAL: [] as string[], PLAY_BY_PLAY: [] as string[] };
const review: Array<{ id: string; date: string; match: string; label: string; why: string }> = [];

for (const row of rows) {
  const { source, review: why } = classifyScoreSource({
    status: row.status,
    team1Score: row.team1_score,
    team2Score: row.team2_score,
    scoringEvents: Number(row.scoring_events),
    otherEvents: Number(row.other_events),
    eventTeam1Score: Number(row.event_team1),
    eventTeam2Score: Number(row.event_team2),
  });
  if (source !== 'NONE') toSet[source].push(row.id);
  if (why) {
    review.push({
      id: row.id,
      date: new Date(row.date).toISOString().slice(0, 10),
      match: `${row.team1} vs ${row.team2}`,
      label: source,
      why,
    });
  }
}

console.log(`${apply ? 'APPLY' : 'DRY RUN'} — ${rows.length} matches still at NONE`);
console.log(`  → PLAY_BY_PLAY: ${toSet.PLAY_BY_PLAY.length}`);
console.log(`  → MANUAL:       ${toSet.MANUAL.length}`);
console.log(`  → stay NONE:    ${rows.length - toSet.PLAY_BY_PLAY.length - toSet.MANUAL.length}`);
if (review.length) {
  console.log(`\n${review.length} to review:`);
  console.table(review);
}

if (!apply) {
  console.log('\nNothing written. Re-run with --apply to update.');
} else {
  await connection.beginTransaction();
  try {
    for (const [source, ids] of Object.entries(toSet)) {
      for (let i = 0; i < ids.length; i += 500) {
        const chunk = ids.slice(i, i + 500);
        await connection.query(
          "UPDATE matches SET score_source = ? WHERE score_source = 'NONE' AND id IN (?)",
          [source, chunk],
        );
      }
    }
    await connection.commit();
    console.log(`\nUpdated ${toSet.PLAY_BY_PLAY.length + toSet.MANUAL.length} matches.`);
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

await connection.end();
