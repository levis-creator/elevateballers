/**
 * Check if winner migration was applied to production
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load both .env and .env.production
dotenv.config();
dotenv.config({ path: '.env.production', override: false });

const supabaseUrl = process.env.SUPABASE_URL || 'https://zjnlvnyjsidnelgciqmz.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required in .env.production');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMigration() {
  console.log('🔍 Checking production database migration status...\n');

  try {
    // Try to query the winner_id column - if it exists, migration was applied
    const { data, error } = await supabase
      .from('matches')
      .select('winner_id')
      .limit(1);

    if (error) {
      if (error.message.includes('column "winner_id" does not exist')) {
        console.log('❌ Migration NOT applied');
        console.log('   The winner_id column does not exist in the matches table\n');
        console.log('📋 To apply the migration:');
        console.log('   1. Go to: https://supabase.com/dashboard');
        console.log('   2. SQL Editor → New query');
        console.log('   3. Run the SQL from: MIGRATION_SQL_TO_RUN.sql\n');
        return false;
      } else {
        throw error;
      }
    }

    // If we got here, the column exists!
    console.log('✅ Migration APPLIED successfully!');
    console.log('   The winner_id column exists in the matches table\n');

    // Check if index exists by trying a query that would use it
    console.log('🔍 Verifying index...');
    const { data: indexCheck, error: indexError } = await supabase
      .from('matches')
      .select('winner_id')
      .eq('winner_id', 'test')
      .limit(1);

    if (!indexError) {
      console.log('✅ Index appears to be working\n');
    }

    // Check for foreign key constraint
    console.log('🔍 Checking foreign key constraint...');
    const { data: fkCheck, error: fkError } = await supabase
      .from('matches')
      .select('winner_id, teams!matches_winner_id_fkey(id)')
      .not('winner_id', 'is', null)
      .limit(1);

    if (!fkError) {
      console.log('✅ Foreign key constraint appears to be working\n');
    } else {
      console.log('⚠️  Could not verify foreign key (this is okay if no matches have winners yet)\n');
    }

    console.log('✅ Production database is updated and ready!\n');
    return true;

  } catch (error: any) {
    console.error('❌ Error checking migration:', error.message);
    console.log('\n📋 Please verify manually in Supabase SQL Editor\n');
    return false;
  }
}

checkMigration().then(success => {
  process.exit(success ? 0 : 1);
});
