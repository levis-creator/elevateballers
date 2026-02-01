/**
 * Script to resolve the failed nickname migration
 * Checks if the column exists and marks the migration as applied if it does
 */

import { prisma } from '../src/lib/prisma';

async function resolveMigration() {
  try {
    console.log('🔍 Checking if nickname column exists in teams table...\n');

    // Check if column exists
    const result = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = DATABASE()
      AND table_name = 'teams' 
      AND column_name = 'nickname'
    `;

    if (result.length > 0) {
      console.log('✅ Column nickname already exists in teams table\n');
      console.log('📝 Marking migration as applied...\n');
      
      // Mark migration as applied in Prisma's migration history
      // We need to insert/update the _prisma_migrations table
      const migrationName = '20260129000000_add_team_nickname';
      
      // Check if migration record exists
      const migrationRecord = await prisma.$queryRaw<Array<{ migration_name: string }>>`
        SELECT migration_name 
        FROM _prisma_migrations 
        WHERE migration_name = ${migrationName}
      `;

      if (migrationRecord.length === 0) {
        // Insert migration record as applied
        await prisma.$executeRawUnsafe(`
          INSERT INTO _prisma_migrations (migration_name, started_at, finished_at, applied_steps_count)
          VALUES ('${migrationName}', NOW(), NOW(), 1)
        `);
        console.log('✅ Migration marked as applied\n');
      } else {
        console.log('⚠️  Migration record already exists\n');
      }

      console.log('✅ Migration resolved successfully!\n');
      console.log('📋 You can now run: npx prisma migrate dev\n');
    } else {
      console.log('❌ Column nickname does NOT exist in teams table\n');
      console.log('📝 Applying migration...\n');
      
      // Apply the migration manually
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE \`teams\` ADD COLUMN \`nickname\` VARCHAR(191) NULL
        `);
        console.log('✅ Column added successfully\n');
        
        // Mark migration as applied
        const migrationName = '20260129000000_add_team_nickname';
        await prisma.$executeRawUnsafe(`
          INSERT INTO _prisma_migrations (migration_name, started_at, finished_at, applied_steps_count)
          VALUES ('${migrationName}', NOW(), NOW(), 1)
        `);
        console.log('✅ Migration marked as applied\n');
      } catch (error: any) {
        if (error.message.includes('Duplicate column name')) {
          console.log('⚠️  Column already exists (duplicate error)\n');
          console.log('📝 Marking migration as applied anyway...\n');
          
          const migrationName = '20260129000000_add_team_nickname';
          await prisma.$executeRawUnsafe(`
            INSERT INTO _prisma_migrations (migration_name, started_at, finished_at, applied_steps_count)
            VALUES ('${migrationName}', NOW(), NOW(), 1)
          `);
          console.log('✅ Migration marked as applied\n');
        } else {
          throw error;
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Alternative: Run this SQL manually in your database:\n');
    console.log('   -- Check if column exists');
    console.log('   SELECT column_name FROM information_schema.columns');
    console.log('   WHERE table_schema = DATABASE()');
    console.log('   AND table_name = \'teams\' AND column_name = \'nickname\';\n');
    console.log('   -- If column exists, mark migration as applied:');
    console.log('   INSERT INTO _prisma_migrations (migration_name, started_at, finished_at, applied_steps_count)');
    console.log('   VALUES (\'20260129000000_add_team_nickname\', NOW(), NOW(), 1);\n');
    console.log('   -- If column does not exist, add it:');
    console.log('   ALTER TABLE `teams` ADD COLUMN `nickname` VARCHAR(191) NULL;\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resolveMigration();
