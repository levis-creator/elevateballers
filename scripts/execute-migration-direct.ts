/**
 * Execute migration using direct PostgreSQL connection
 */

import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use production connection string - try pooler port 6543 for connection pooling
const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres.zjnlvnyjsidnelgciqmz:Elevatedb1234!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

async function executeMigration() {
  console.log('🚀 Connecting to production database...\n');

  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read migration SQL
    const migrationPath = path.join(__dirname, '../prisma/migrations/20250115000000_add_match_winner/migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Split into statements - handle comments and empty lines
    const statements = migrationSQL
      .split(';')
      .map(s => {
        // Remove comments (lines starting with --)
        const lines = s.split('\n').filter(line => !line.trim().startsWith('--'));
        return lines.join('\n').trim();
      })
      .filter(s => s.length > 0 && !s.match(/^\s*$/));

    console.log(`📝 Executing ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      console.log(`[${i + 1}/${statements.length}] ${statement.substring(0, 60)}...`);

      try {
        await client.query(statement);
        console.log(`   ✅ Success\n`);
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  Already exists (skipping)\n`);
        } else {
          throw error;
        }
      }
    }

    // Verify migration
    console.log('🔍 Verifying migration...\n');
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'matches' AND column_name = 'winner_id';
    `);

    if (result.rows.length > 0) {
      console.log('✅ Migration verified successfully!');
      console.log(`   Column: ${result.rows[0].column_name}`);
      console.log(`   Type: ${result.rows[0].data_type}\n`);
      console.log('🎉 Production database updated!\n');
    } else {
      console.log('❌ Migration verification failed\n');
      process.exit(1);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 If connection failed, please run migration manually in Supabase SQL Editor\n');
    process.exit(1);
  } finally {
    await client.end();
  }
}

executeMigration();
