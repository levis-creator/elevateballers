/**
 * Script to check if bracket_type column exists and apply migration if needed
 */

import { prisma } from '../src/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkAndApplyMigration() {
  try {
    console.log('🔍 Checking if bracket_type column exists...\n');

    // Check if column exists
    const result = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'seasons' 
      AND column_name = 'bracket_type'
    `;

    if (result.length > 0) {
      console.log('✅ Column bracket_type already exists in seasons table\n');
      console.log('✅ Migration already applied - no action needed\n');
      return;
    }

    console.log('📝 Column does not exist - applying migration...\n');

    // Read migration SQL
    const migrationPath = path.join(__dirname, '../prisma/migrations/20260118000000_add_bracket_type_to_seasons/migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Split into statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      console.log(`[${i + 1}/${statements.length}] ${statement.substring(0, 60)}...`);

      try {
        await prisma.$executeRawUnsafe(statement);
        console.log(`   ✅ Success\n`);
      } catch (error: any) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`   ⚠️  Already exists (skipping)\n`);
        } else {
          throw error;
        }
      }
    }

    // Verify
    console.log('🔍 Verifying migration...\n');
    const verifyResult = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'seasons' 
      AND column_name = 'bracket_type'
    `;

    if (verifyResult.length > 0) {
      console.log('✅ Migration applied successfully!\n');
      console.log('✅ Column bracket_type now exists in seasons table\n');
    } else {
      console.log('⚠️  Warning: Column not found after migration\n');
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Alternative: Run the SQL manually in your database:\n');
    console.log('   1. Connect to your database');
    console.log('   2. Run the SQL from: prisma/migrations/20260118000000_add_bracket_type_to_seasons/migration.sql\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndApplyMigration();
