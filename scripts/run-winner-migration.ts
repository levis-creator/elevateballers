/**
 * Script to run the winner migration using Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || 'https://zjnlvnyjsidnelgciqmz.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required in .env or .env.production');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Running winner migration...\n');

  // Read migration SQL
  const migrationPath = path.join(__dirname, '../prisma/migrations/20250115000000_add_match_winner/migration.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log('📄 Migration SQL to execute:');
  console.log('─'.repeat(50));
  console.log(migrationSQL);
  console.log('─'.repeat(50));
  console.log('\n');

  // Split into individual statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 Executing ${statements.length} SQL statements...\n`);

  try {
    // Supabase JS client doesn't support raw SQL execution directly
    // We need to use the REST API or guide user to SQL Editor
    console.log('⚠️  Supabase JS client cannot execute raw SQL directly.');
    console.log('📋 Please run this migration in Supabase SQL Editor:\n');
    console.log('   1. Go to: https://supabase.com/dashboard');
    console.log('   2. Select your project');
    console.log('   3. Go to SQL Editor → New query');
    console.log('   4. Paste the SQL above');
    console.log('   5. Click Run\n');
    
    // Try to verify if migration already exists
    console.log('🔍 Checking if migration was already applied...\n');
    
    const { data, error } = await supabase
      .from('matches')
      .select('winner_id')
      .limit(1);

    if (error) {
      if (error.message.includes('column "winner_id" does not exist')) {
        console.log('❌ Migration NOT applied yet');
        console.log('📋 Please follow the steps above to run the migration\n');
      } else {
        console.log('⚠️  Could not verify:', error.message);
        console.log('📋 Please run the migration manually in Supabase SQL Editor\n');
      }
    } else {
      console.log('✅ Migration appears to be applied! (winner_id column exists)');
      console.log('✅ Sample query successful\n');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Please run the migration manually in Supabase SQL Editor\n');
  }
}

runMigration();
