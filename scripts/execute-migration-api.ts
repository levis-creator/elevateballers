/**
 * Execute migration via Supabase REST API
 */

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
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

async function executeMigration() {
  console.log('🚀 Executing migration via Supabase API...\n');

  // Read migration SQL
  const migrationPath = path.join(__dirname, '../prisma/migrations/20250115000000_add_match_winner/migration.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  // Clean SQL - remove comments and split into statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 Executing ${statements.length} SQL statements...\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement) continue;

    console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 60)}...`);

    try {
      // Use Supabase REST API to execute SQL
      // Note: This requires the SQL to be executed via RPC or Management API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ sql: statement + ';' }),
      });

      if (!response.ok) {
        // Try alternative: direct SQL execution endpoint (if available)
        console.log('   ⚠️  RPC method not available, trying alternative...');
        
        // Alternative: Use pg_rest or direct connection
        // Since Supabase doesn't expose raw SQL execution via REST API,
        // we need to use the SQL Editor or psql
        
        throw new Error('SQL execution via API not available');
      }

      const result = await response.json();
      console.log(`   ✅ Success`);
    } catch (error: any) {
      if (error.message.includes('not available')) {
        console.log('\n❌ Cannot execute SQL via API');
        console.log('📋 Supabase requires SQL to be executed via SQL Editor or psql\n');
        console.log('📄 SQL to execute:');
        console.log('─'.repeat(60));
        console.log(statement + ';');
        console.log('─'.repeat(60));
        console.log('\n💡 Please run this in Supabase SQL Editor\n');
      } else {
        console.log(`   ⚠️  Error: ${error.message}`);
      }
    }
  }

  console.log('\n✅ Migration execution attempt complete');
  console.log('📋 If errors occurred, please run SQL manually in Supabase SQL Editor\n');
}

executeMigration();
