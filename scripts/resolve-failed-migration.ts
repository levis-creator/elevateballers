/**
 * Script to resolve failed migration by marking it as applied
 * Run: tsx scripts/resolve-failed-migration.ts
 */

import { prisma } from '../src/lib/prisma';

async function resolveFailedMigration() {
  try {
    console.log('🔍 Checking migration status...\n');

    // Check if nickname column exists
    const columnCheck = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'teams' 
      AND COLUMN_NAME = 'nickname'
    `;

    const columnExists = columnCheck.length > 0;
    console.log(`Column 'nickname' exists: ${columnExists ? '✅ Yes' : '❌ No'}\n`);

    if (!columnExists) {
      console.log('⚠️  Column does not exist. Please run the migration first.');
      console.log('   The migration file has been fixed to handle existing columns.\n');
      return;
    }

    // Check migration status
    const migrations = await prisma.$queryRaw<Array<{
      migration_name: string;
      finished_at: Date | null;
      rolled_back_at: Date | null;
    }>>`
      SELECT migration_name, finished_at, rolled_back_at
      FROM _prisma_migrations
      WHERE migration_name = '20260129000000_add_team_nickname'
    `;

    if (migrations.length === 0) {
      console.log('✅ Migration record not found. It may have been cleaned up.\n');
      console.log('✅ You can now run: npx prisma migrate deploy\n');
      return;
    }

    const migration = migrations[0];

    if (migration.finished_at) {
      console.log('✅ Migration is already marked as applied.\n');
      console.log('✅ You can now run: npx prisma migrate deploy\n');
      return;
    }

    if (migration.rolled_back_at) {
      console.log('⚠️  Migration is marked as rolled back.\n');
      console.log('📝 Marking as applied since column exists...\n');
    } else {
      console.log('⚠️  Migration is in failed state.\n');
      console.log('📝 Resolving failed migration...\n');
    }

    // Mark migration as applied
    await prisma.$executeRaw`
      UPDATE _prisma_migrations
      SET 
        finished_at = NOW(),
        rolled_back_at = NULL,
        applied_steps_count = 1
      WHERE migration_name = '20260129000000_add_team_nickname'
    `;

    console.log('✅ Migration marked as applied successfully!\n');
    console.log('✅ You can now run: npx prisma migrate deploy\n');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Alternative: Run this SQL directly in your database:\n');
    console.log('   DELETE FROM `_prisma_migrations` WHERE migration_name = \'20260129000000_add_team_nickname\';\n');
    console.log('   Then run: npx prisma migrate deploy\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resolveFailedMigration();
