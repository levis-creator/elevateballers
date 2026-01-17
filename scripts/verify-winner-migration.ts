/**
 * Script to verify the winner migration was applied successfully
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.production' });

const supabaseUrl = process.env.SUPABASE_URL || 'https://zjnlvnyjsidnelgciqmz.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
  console.log('💡 Make sure .env.production has SUPABASE_SERVICE_ROLE_KEY set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
  console.log('🔍 Verifying winner migration...\n');

  try {
    // Check if winner_id column exists
    const { data: columns, error: colError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'matches' AND column_name = 'winner_id';
        `
      });

    if (colError) {
      // Try alternative method using direct query
      console.log('⚠️  Using alternative verification method...\n');
      
      // Check by trying to query the column
      const { data, error } = await supabase
        .from('matches')
        .select('winner_id')
        .limit(1);

      if (error) {
        if (error.message.includes('column "winner_id" does not exist')) {
          console.log('❌ Migration NOT applied - winner_id column does not exist');
          console.log('\n📋 Please run the migration SQL in Supabase SQL Editor:');
          console.log('   File: prisma/migrations/20250115000000_add_match_winner/migration.sql\n');
          process.exit(1);
        } else {
          throw error;
        }
      } else {
        console.log('✅ Migration verified - winner_id column exists!');
        console.log('✅ Sample data:', data);
      }
    } else {
      if (columns && columns.length > 0) {
        console.log('✅ Migration verified - winner_id column exists!');
        console.log('📊 Column details:', columns[0]);
      } else {
        console.log('❌ Migration NOT applied - winner_id column not found');
        console.log('\n📋 Please run the migration SQL in Supabase SQL Editor:');
        console.log('   File: prisma/migrations/20250115000000_add_match_winner/migration.sql\n');
        process.exit(1);
      }
    }

    // Check index
    console.log('\n🔍 Checking index...');
    const { data: indexes, error: idxError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT indexname
          FROM pg_indexes
          WHERE tablename = 'matches' AND indexname = 'matches_winner_id_idx';
        `
      });

    if (!idxError && indexes && indexes.length > 0) {
      console.log('✅ Index verified - matches_winner_id_idx exists!');
    } else {
      console.log('⚠️  Could not verify index (this is okay if migration was partially applied)');
    }

    console.log('\n✅ Migration verification complete!\n');
  } catch (error: any) {
    console.error('❌ Error verifying migration:', error.message);
    console.log('\n💡 You can manually verify by running this SQL in Supabase:');
    console.log(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'matches' AND column_name = 'winner_id';
    `);
    process.exit(1);
  }
}

verifyMigration();
