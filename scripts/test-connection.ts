import { Pool } from 'pg';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

config();

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

const productionDbUrl = productionEnv.DATABASE_URL || process.env.PRODUCTION_DATABASE_URL;

if (!productionDbUrl) {
  throw new Error('PRODUCTION_DATABASE_URL not found');
}

console.log('Testing connection to:', productionDbUrl.replace(/:[^:@]+@/, ':****@'));

// Add SSL if Supabase
let connectionString = productionDbUrl;
if (productionDbUrl.includes('supabase') && !productionDbUrl.includes('sslmode')) {
  const separator = productionDbUrl.includes('?') ? '&' : '?';
  connectionString = `${productionDbUrl}${separator}sslmode=require`;
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('supabase') ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 10000,
});

async function test() {
  try {
    console.log('Attempting to connect...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!');
    
    const result = await client.query('SELECT version()');
    console.log('Database version:', result.rows[0].version);
    
    client.release();
    await pool.end();
    console.log('✅ Connection test passed!');
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', error);
    await pool.end();
    process.exit(1);
  }
}

test();

