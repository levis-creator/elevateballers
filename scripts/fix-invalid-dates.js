/**
 * Fix Invalid Dates in MySQL Database
 * 
 * MySQL allows invalid dates like '0000-00-00 00:00:00' which JavaScript Date objects can't handle.
 * This script finds and fixes all invalid dates in the database.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config } from 'dotenv';

config();

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set.');
  }

  // Parse MySQL connection string
  const url = new URL(connectionString);
  const poolConfig = {
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
  };

  const adapter = new PrismaMariaDb(poolConfig);
  
  return new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  });
}

const prisma = createPrismaClient();

async function fixInvalidDates() {
  console.log('🔍 Starting to fix invalid dates in database...\n');

  try {
    // Fix news_articles.published_at
    console.log('📰 Fixing news_articles.published_at...');
    const newsResult = await prisma.$executeRaw`
      UPDATE news_articles 
      SET published_at = NULL 
      WHERE published_at = '0000-00-00 00:00:00' 
         OR published_at < '1970-01-01 00:00:00'
         OR published_at IS NULL
    `;
    console.log(`   ✅ Fixed ${newsResult} news articles\n`);

    // Fix match_events.undone_at
    console.log('🎯 Fixing match_events.undone_at...');
    const eventsResult = await prisma.$executeRaw`
      UPDATE match_events 
      SET undone_at = NULL 
      WHERE undone_at = '0000-00-00 00:00:00' 
         OR undone_at < '1970-01-01 00:00:00'
    `;
    console.log(`   ✅ Fixed ${eventsResult} match events\n`);

    // Fix match_periods.end_time
    console.log('⏱️  Fixing match_periods.end_time...');
    const periodsResult = await prisma.$executeRaw`
      UPDATE match_periods 
      SET end_time = NULL 
      WHERE end_time = '0000-00-00 00:00:00' 
         OR end_time < '1970-01-01 00:00:00'
    `;
    console.log(`   ✅ Fixed ${periodsResult} match periods\n`);

    // Check for any other invalid dates in DateTime fields
    console.log('🔍 Checking for other invalid dates...');
    
    // Check all tables with DateTime fields
    const tables = [
      { table: 'users', fields: ['created_at', 'updated_at'] },
      { table: 'news_articles', fields: ['created_at', 'updated_at', 'published_at'] },
      { table: 'matches', fields: ['date', 'created_at', 'updated_at'] },
      { table: 'seasons', fields: ['start_date', 'end_date', 'created_at', 'updated_at'] },
      { table: 'match_events', fields: ['created_at', 'updated_at', 'undone_at'] },
      { table: 'match_periods', fields: ['start_time', 'end_time', 'created_at', 'updated_at'] },
    ];

    let totalFixed = 0;
    for (const { table, fields } of tables) {
      for (const field of fields) {
        try {
          const result = await prisma.$executeRawUnsafe(
            `UPDATE ${table} SET ${field} = NULL WHERE ${field} = '0000-00-00 00:00:00' OR ${field} < '1970-01-01 00:00:00'`
          );
          if (result > 0) {
            console.log(`   ✅ Fixed ${result} rows in ${table}.${field}`);
            totalFixed += result;
          }
        } catch (error) {
          // Field might not exist or might be NOT NULL, skip it
          if (process.env.NODE_ENV === 'development') {
            console.log(`   ⚠️  Skipped ${table}.${field}: ${error.message}`);
          }
        }
      }
    }

    if (totalFixed > 0) {
      console.log(`\n   ✅ Fixed ${totalFixed} additional invalid dates\n`);
    } else {
      console.log(`   ✅ No additional invalid dates found\n`);
    }

    console.log('✅ All invalid dates have been fixed!\n');
    console.log('💡 Tip: After fixing dates, restart your application to clear any cached data.');

  } catch (error) {
    console.error('❌ Error fixing invalid dates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixInvalidDates()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
