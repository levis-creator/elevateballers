
#!/usr/bin/env node
/**
 * Build script for cPanel deployment
 * Works on Windows, Linux, and Mac without cross-env
 */
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Set environment variable for the current process
process.env.DEPLOY_TARGET = 'cpanel';

console.log('🔨 Building for cPanel deployment...');
console.log(`📦 DEPLOY_TARGET=${process.env.DEPLOY_TARGET}`);

try {
  // Generate Prisma Client
  console.log('\n📊 Generating Prisma Client...');
  execSync('npx prisma generate', {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env, DEPLOY_TARGET: 'cpanel' }
  });

  // Build Astro
  console.log('\n🚀 Building Astro application...');
  execSync('npx astro build', {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env, DEPLOY_TARGET: 'cpanel' }
  });

  console.log('\n✅ Build completed successfully!');
  console.log('📁 Output directory: dist/');
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
