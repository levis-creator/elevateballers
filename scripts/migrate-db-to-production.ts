import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// Load environment variables
config();

// Load production environment variables
const productionEnvPath = join(process.cwd(), '.env.production');
let productionEnv: Record<string, string> = {};
try {
  const envContent = readFileSync(productionEnvPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      productionEnv[key.trim()] = value.trim();
    }
  });
} catch (error) {
  console.error('Warning: Could not read .env.production file');
}

// Get database URLs
let deploymentDbUrl = process.env.DATABASE_URL;
let productionDbUrl = productionEnv.DATABASE_URL || process.env.PRODUCTION_DATABASE_URL;

if (!deploymentDbUrl) {
  throw new Error('DATABASE_URL environment variable is not set (deployment database)');
}

if (!productionDbUrl) {
  throw new Error('PRODUCTION_DATABASE_URL environment variable is not set. Please set it or ensure .env.production exists with DATABASE_URL');
}

// For Supabase pooler connections, we'll handle SSL in the Pool config, not in the URL
// Remove sslmode from URL if it exists and we'll set it properly in Pool config
if (productionDbUrl.includes('pooler.supabase')) {
  productionDbUrl = productionDbUrl.replace(/[?&]sslmode=[^&]*/g, '');
}

if (deploymentDbUrl.includes('supabase') && !deploymentDbUrl.includes('sslmode')) {
  const separator = deploymentDbUrl.includes('?') ? '&' : '?';
  deploymentDbUrl = `${deploymentDbUrl}${separator}sslmode=require`;
}

// Function to try pooler connection if direct connection fails
function getPoolerUrl(url: string): string {
  if (url.includes('supabase') && url.includes(':5432/')) {
    // Replace port 5432 with 6543 and add pgbouncer parameter
    const poolerUrl = url.replace(':5432/', ':6543/');
    const separator = poolerUrl.includes('?') ? '&' : '?';
    return `${poolerUrl}${separator}pgbouncer=true`;
  }
  return url;
}

console.log('🔗 Connecting to databases...');
console.log('📦 Deployment DB:', deploymentDbUrl.replace(/:[^:@]+@/, ':****@'));
console.log('🚀 Production DB:', productionDbUrl.replace(/:[^:@]+@/, ':****@'));

// Create connection pools
// Supabase requires SSL connections
const deploymentPool = new Pool({ 
  connectionString: deploymentDbUrl,
  ssl: deploymentDbUrl.includes('supabase') ? { rejectUnauthorized: false } : undefined
});

// Create Prisma adapters and clients
const deploymentAdapter = new PrismaPg(deploymentPool);
const deploymentDb = new PrismaClient({
  adapter: deploymentAdapter,
  log: ['error'],
});

// Production connection will be set up in main() to handle fallback to pooler
let productionPool: Pool;
let productionAdapter: PrismaPg;
let productionDb: PrismaClient;

// Migration statistics
const stats = {
  users: 0,
  leagues: 0,
  seasons: 0,
  teams: 0,
  staff: 0,
  players: 0,
  teamStaff: 0,
  newsArticles: 0,
  comments: 0,
  matches: 0,
  matchPlayers: 0,
  matchEvents: 0,
  media: 0,
  pageContents: 0,
  siteSettings: 0,
  registrationNotifications: 0,
  errors: 0,
};

// Helper function to migrate data with conflict handling
async function migrateTable<T extends { id: string }>(
  tableName: string,
  getData: () => Promise<T[]>,
  findExisting: (id: string) => Promise<T | null>,
  createRecord: (data: T) => Promise<T>,
  updateRecord?: (data: T) => Promise<T>,
  dependencies?: string[]
) {
  console.log(`\n📦 Migrating ${tableName}...`);
  
  try {
    const data = await getData();
    console.log(`   Found ${data.length} records`);
    
    if (data.length === 0) {
      console.log(`   ⏭️  Skipping ${tableName} (no data)`);
      return;
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const record of data) {
      try {
        // Try to find existing record
        const existing = await findExisting(record.id);

        if (existing) {
          if (updateRecord) {
            await updateRecord(record);
            updated++;
          } else {
            skipped++;
          }
        } else {
          await createRecord(record);
          created++;
        }
      } catch (error: any) {
        console.error(`   ❌ Error migrating ${tableName} record ${record.id}:`, error.message);
        stats.errors++;
        
        // If it's a foreign key constraint error, log dependencies
        if (error.message?.includes('Foreign key constraint') || error.message?.includes('violates foreign key')) {
          console.error(`   💡 This might be due to missing dependencies: ${dependencies?.join(', ') || 'unknown'}`);
        }
      }
    }

    console.log(`   ✅ ${tableName}: ${created} created, ${updated} updated, ${skipped} skipped`);
    (stats as any)[tableName] = created + updated;
  } catch (error: any) {
    console.error(`   ❌ Error migrating ${tableName}:`, error.message);
    stats.errors++;
  }
}

async function main() {
  console.log('\n🚀 Starting database migration from deployment to production...\n');

  try {
    // Test connections
    console.log('Testing deployment database connection...');
    try {
      await deploymentDb.$connect();
      await deploymentDb.$queryRaw`SELECT 1`;
      console.log('✅ Deployment database connected');
    } catch (error: any) {
      console.error('❌ Failed to connect to deployment database:', error.message);
      throw error;
    }

    console.log('Testing production database connection...');
    let productionConnected = false;
    
    // Try direct connection first
    // For Supabase (both direct and pooler), we need to accept self-signed certificates
    const isSupabase = productionDbUrl.includes('supabase') || productionDbUrl.includes('pooler.supabase');
    productionPool = new Pool({ 
      connectionString: productionDbUrl,
      ssl: isSupabase ? { 
        rejectUnauthorized: false,
        require: true
      } : undefined
    });
    productionAdapter = new PrismaPg(productionPool);
    productionDb = new PrismaClient({
      adapter: productionAdapter,
      log: ['error'],
    });
    
    try {
      await productionDb.$connect();
      await productionDb.$queryRaw`SELECT 1`;
      console.log('✅ Production database connected (direct connection)\n');
      productionConnected = true;
    } catch (error: any) {
      console.warn('⚠️  Direct connection failed, trying connection pooler...');
      
      // Clean up failed direct connection
      try {
        await productionDb.$disconnect();
        await productionPool.end();
      } catch {}
      
      // Try pooler connection if direct connection fails
      if (productionDbUrl.includes('supabase')) {
        const poolerUrl = getPoolerUrl(productionDbUrl);
        console.log(`   Trying pooler: ${poolerUrl.replace(/:[^:@]+@/, ':****@')}`);
        
        productionPool = new Pool({ 
          connectionString: poolerUrl,
          ssl: { rejectUnauthorized: false }
        });
        productionAdapter = new PrismaPg(productionPool);
        productionDb = new PrismaClient({
          adapter: productionAdapter,
          log: ['error'],
        });
        
        try {
          await productionDb.$connect();
          await productionDb.$queryRaw`SELECT 1`;
          console.log('✅ Production database connected (via pooler)\n');
          console.log('⚠️  Note: Using connection pooler. Some operations may be limited.');
          console.log('   For best results, whitelist your IP and use direct connection (port 5432)\n');
          productionConnected = true;
        } catch (poolerError: any) {
          await productionDb.$disconnect();
          await productionPool.end();
          throw new Error(`Both direct and pooler connections failed. Direct: ${error.message}, Pooler: ${poolerError.message}`);
        }
      } else {
        throw error;
      }
    }
    
    if (!productionConnected) {
      console.error('❌ Failed to connect to production database');
      console.error('\n💡 Troubleshooting tips:');
      console.error('   1. Verify the connection string in .env.production');
      console.error('   2. Check if your IP is whitelisted in Supabase (Settings > Database > Connection Pooling)');
      console.error('   3. Ensure the database is not paused');
      console.error('   4. Try using the connection pooler URL (port 6543) instead of direct connection (port 5432)');
      throw new Error('Could not connect to production database');
    }

    // Run Prisma migrations on production database first
    console.log('\n📋 Setting up production database schema...');
    try {
      // Check if tables exist
      const tablesResult = await productionDb.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      `;
      const existingTables = tablesResult.map(t => t.tablename);
      
      if (existingTables.length === 0) {
        console.log('   No tables found. Creating schema...');
        
        // Try db push first (works better with poolers than migrate deploy)
        try {
          execSync('npx prisma db push --accept-data-loss', {
            stdio: 'inherit',
            env: { ...process.env, DATABASE_URL: productionDbUrl }
          });
          console.log('✅ Production database schema created using db push\n');
        } catch (pushError: any) {
          // If db push fails, generate SQL from current schema and execute directly via Pool
          console.log('   db push failed, generating schema SQL from current Prisma schema...');
          try {
            // Generate SQL from current schema using prisma migrate diff
            const schemaSql = execSync('npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script', {
              encoding: 'utf-8',
              env: { ...process.env, DATABASE_URL: productionDbUrl }
            });
            
            if (schemaSql && schemaSql.trim()) {
              // Use Pool client directly to avoid prepared statement issues
              const client = await productionPool.connect();
              try {
                // Execute the entire SQL script
                await client.query(schemaSql);
                console.log('✅ Production database schema created via generated SQL\n');
              } finally {
                client.release();
              }
            } else {
              throw new Error('No SQL generated from schema');
            }
          } catch (sqlError: any) {
            console.error('❌ Failed to create schema via SQL generation.');
            console.error('💡 Please run migrations manually using one of these options:');
            console.error('   1. Use direct connection (port 5432) with IP whitelisting:');
            console.error('      Set DATABASE_URL to direct connection and run: npx prisma db push --accept-data-loss');
            console.error('   2. Or apply the schema from Supabase SQL editor:');
            console.error('      Run: npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script');
            console.error('      Copy the output SQL and run it in Supabase SQL editor');
            throw sqlError;
          }
        }
      } else {
        console.log(`   Found ${existingTables.length} existing tables. Schema appears to be set up.`);
        console.log('   If you need to update the schema, run: npx prisma db push --accept-data-loss\n');
      }
    } catch (error: any) {
      console.error('❌ Failed to set up production database schema:', error.message);
      throw error;
    }

    // 1. Users (no dependencies)
    await migrateTable(
      'user',
      () => deploymentDb.user.findMany(),
      (id) => productionDb.user.findUnique({ where: { id } }).then(r => r || null),
      (data) => productionDb.user.create({ data }),
      (data) => productionDb.user.update({ where: { id: data.id }, data })
    );

    // 2. Leagues (no dependencies)
    await migrateTable(
      'league',
      () => deploymentDb.league.findMany(),
      (id) => productionDb.league.findUnique({ where: { id } }).then(r => r || null),
      (data) => productionDb.league.create({ data }),
      (data) => productionDb.league.update({ where: { id: data.id }, data })
    );

    // 3. Seasons (depends on League)
    await migrateTable(
      'season',
      () => deploymentDb.season.findMany(),
      (id) => productionDb.season.findUnique({ where: { id } }).then(r => r || null),
      (data) => productionDb.season.create({ data }),
      (data) => productionDb.season.update({ where: { id: data.id }, data }),
      ['League']
    );

    // 4. Teams (no dependencies)
    await migrateTable(
      'team',
      () => deploymentDb.team.findMany(),
      (id) => productionDb.team.findUnique({ where: { id } }).then(r => r || null),
      (data) => productionDb.team.create({ data }),
      (data) => productionDb.team.update({ where: { id: data.id }, data })
    );

    // 5. Staff (no dependencies)
    await migrateTable(
      'staff',
      () => deploymentDb.staff.findMany(),
      (id) => productionDb.staff.findUnique({ where: { id } }).then(r => r || null),
      (data) => productionDb.staff.create({ data }),
      (data) => productionDb.staff.update({ where: { id: data.id }, data })
    );

    // 6. Players (depends on Team)
    await migrateTable(
      'player',
      () => deploymentDb.player.findMany(),
      (id) => productionDb.player.findUnique({ where: { id } }).then(r => r || null),
      (data) => productionDb.player.create({ data }),
      (data) => productionDb.player.update({ where: { id: data.id }, data }),
      ['Team']
    );

    // 7. TeamStaff (depends on Team and Staff)
    await migrateTable(
      'teamStaff',
      () => deploymentDb.teamStaff.findMany(),
      (id) => productionDb.teamStaff.findUnique({ where: { id } }).then(r => r || null),
      (data) => productionDb.teamStaff.create({ data }),
      (data) => productionDb.teamStaff.update({ where: { id: data.id }, data }),
      ['Team', 'Staff']
    );

    // 8. NewsArticles (depends on User)
    await migrateTable(
      'newsArticle',
      () => deploymentDb.newsArticle.findMany(),
      (id) => productionDb.newsArticle.findUnique({ where: { id } }).then(r => r || null),
      (data) => productionDb.newsArticle.create({ data }),
      (data) => productionDb.newsArticle.update({ where: { id: data.id }, data }),
      ['User']
    );

    // 9. Comments (depends on NewsArticle and User)
    await migrateTable(
      'comment',
      () => deploymentDb.comment.findMany(),
      (id) => productionDb.comment.findUnique({ where: { id } }).then(r => r || null),
      (data) => productionDb.comment.create({ data }),
      (data) => productionDb.comment.update({ where: { id: data.id }, data }),
      ['NewsArticle', 'User']
    );

    // 10. Matches (depends on League, Season, Team)
    await migrateTable(
      'match',
      () => deploymentDb.match.findMany(),
      (id) => productionDb.match.findUnique({ where: { id } }).then(r => r || null),
      (data) => productionDb.match.create({ data }),
      (data) => productionDb.match.update({ where: { id: data.id }, data }),
      ['League', 'Season', 'Team']
    );

    // 11. MatchPlayers (depends on Match, Player, Team)
    await migrateTable(
      'matchPlayer',
      () => deploymentDb.matchPlayer.findMany(),
      (id) => productionDb.matchPlayer.findUnique({ where: { id } }).then(r => r || null),
      (data) => productionDb.matchPlayer.create({ data }),
      (data) => productionDb.matchPlayer.update({ where: { id: data.id }, data }),
      ['Match', 'Player', 'Team']
    );

    // 12. MatchEvents (depends on Match, Player, Team)
    await migrateTable(
      'matchEvent',
      () => deploymentDb.matchEvent.findMany(),
      (id) => productionDb.matchEvent.findUnique({ where: { id } }).then(r => r || null),
      (data) => productionDb.matchEvent.create({ data }),
      (data) => productionDb.matchEvent.update({ where: { id: data.id }, data }),
      ['Match', 'Player', 'Team']
    );

    // 13. Media (no dependencies)
    await migrateTable(
      'media',
      () => deploymentDb.media.findMany(),
      (id) => productionDb.media.findUnique({ where: { id } }).then(r => r || null),
      (data) => productionDb.media.create({ data }),
      (data) => productionDb.media.update({ where: { id: data.id }, data })
    );

    // 14. PageContent (no dependencies)
    await migrateTable(
      'pageContent',
      () => deploymentDb.pageContent.findMany(),
      (id) => productionDb.pageContent.findUnique({ where: { id } }).then(r => r || null),
      (data) => productionDb.pageContent.create({ data }),
      (data) => productionDb.pageContent.update({ where: { id: data.id }, data })
    );

    // 15. SiteSetting (no dependencies)
    await migrateTable(
      'siteSetting',
      () => deploymentDb.siteSetting.findMany(),
      (id) => productionDb.siteSetting.findUnique({ where: { id } }).then(r => r || null),
      (data) => productionDb.siteSetting.create({ data }),
      (data) => productionDb.siteSetting.update({ where: { id: data.id }, data })
    );

    // 16. RegistrationNotifications (depends on Team, Player, Staff)
    await migrateTable(
      'registrationNotification',
      () => deploymentDb.registrationNotification.findMany(),
      (id) => productionDb.registrationNotification.findUnique({ where: { id } }).then(r => r || null),
      (data) => productionDb.registrationNotification.create({ data }),
      (data) => productionDb.registrationNotification.update({ where: { id: data.id }, data }),
      ['Team', 'Player', 'Staff']
    );

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log(`Users: ${stats.users}`);
    console.log(`Leagues: ${stats.leagues}`);
    console.log(`Seasons: ${stats.seasons}`);
    console.log(`Teams: ${stats.teams}`);
    console.log(`Staff: ${stats.staff}`);
    console.log(`Players: ${stats.players}`);
    console.log(`TeamStaff: ${stats.teamStaff}`);
    console.log(`NewsArticles: ${stats.newsArticles}`);
    console.log(`Comments: ${stats.comments}`);
    console.log(`Matches: ${stats.matches}`);
    console.log(`MatchPlayers: ${stats.matchPlayers}`);
    console.log(`MatchEvents: ${stats.matchEvents}`);
    console.log(`Media: ${stats.media}`);
    console.log(`PageContents: ${stats.pageContents}`);
    console.log(`SiteSettings: ${stats.siteSettings}`);
    console.log(`RegistrationNotifications: ${stats.registrationNotifications}`);
    console.log(`Errors: ${stats.errors}`);
    console.log('='.repeat(60));

    if (stats.errors > 0) {
      console.log('\n⚠️  Migration completed with errors. Please review the output above.');
    } else {
      console.log('\n✅ Migration completed successfully!');
    }

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    throw error;
  } finally {
    try {
      await deploymentDb.$disconnect();
    } catch {}
    try {
      await productionDb.$disconnect();
    } catch {}
    try {
      await deploymentPool.end();
    } catch {}
    try {
      await productionPool.end();
    } catch {}
    console.log('\n🔌 Disconnected from databases');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

