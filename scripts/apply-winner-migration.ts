/**
 * Script to apply the winner migration to production database
 * Uses Supabase client to execute SQL directly
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://zjnlvnyjsidnelgciqmz.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🚀 Applying winner migration to production database...\n');

  // Read migration SQL file
  const migrationPath = path.join(__dirname, '../prisma/migrations/20250115000000_add_match_winner/migration.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log('📄 Migration SQL:');
  console.log(migrationSQL);
  console.log('\n');

  try {
    // Execute migration using Supabase RPC or direct SQL
    // Note: Supabase client doesn't directly support raw SQL, so we'll use the REST API
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // If RPC doesn't exist, try using the management API
      console.log('⚠️  RPC method not available, trying alternative approach...\n');
      
      // Split SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      console.log(`📝 Executing ${statements.length} SQL statements...\n`);

      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          // Note: Supabase JS client doesn't support raw SQL execution
          // You'll need to run this in Supabase SQL Editor or use psql
          console.log('⚠️  This requires manual execution in Supabase SQL Editor');
        }
      }

      console.log('\n✅ Migration SQL prepared. Please run it manually in Supabase SQL Editor:');
      console.log('   1. Go to https://supabase.com/dashboard');
      console.log('   2. Select your project');
      console.log('   3. Go to SQL Editor');
      console.log('   4. Paste the SQL from the migration file');
      console.log('   5. Click Run\n');
      
      return;
    }

    console.log('✅ Migration applied successfully!\n');
  } catch (err: any) {
    console.error('❌ Error applying migration:', err.message);
    console.log('\n📋 Please run the migration manually:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Copy the SQL from: prisma/migrations/20250115000000_add_match_winner/migration.sql');
    console.log('   3. Paste and execute\n');
    process.exit(1);
  }
}

applyMigration();
