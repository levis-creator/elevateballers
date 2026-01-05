#!/usr/bin/env node
/**
 * Build diagnostic script
 * Checks for common issues that prevent changes from appearing in builds
 */

import { existsSync, readFileSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🔍 Build Diagnostic Check\n');
console.log('='.repeat(50));

// Check 1: Git status
console.log('\n1. Checking Git status...');
try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf-8', cwd: rootDir });
  if (gitStatus.trim()) {
    console.log('⚠️  WARNING: You have uncommitted changes!');
    console.log('   Files:', gitStatus.split('\n').filter(Boolean).join(', '));
    console.log('   → Commit these changes: git add . && git commit -m "message"');
  } else {
    console.log('✅ All changes are committed');
  }
} catch (error) {
  console.log('⚠️  Could not check git status (not a git repo?)');
}

// Check 2: Prisma schema
console.log('\n2. Checking Prisma setup...');
const prismaSchema = join(rootDir, 'prisma', 'schema.prisma');
if (existsSync(prismaSchema)) {
  console.log('✅ Prisma schema exists');
  const schemaContent = readFileSync(prismaSchema, 'utf-8');
  if (schemaContent.includes('model')) {
    console.log('✅ Prisma schema contains models');
  }
} else {
  console.log('❌ Prisma schema not found!');
}

// Check 3: Build output
console.log('\n3. Checking build output...');
const distDir = join(rootDir, 'dist');
if (existsSync(distDir)) {
  const distStat = statSync(distDir);
  console.log(`✅ dist/ directory exists (last modified: ${distStat.mtime.toLocaleString()})`);
} else {
  console.log('⚠️  dist/ directory does not exist (run: npm run build)');
}

// Check 4: Astro config
console.log('\n4. Checking Astro configuration...');
const astroConfig = join(rootDir, 'astro.config.mjs');
if (existsSync(astroConfig)) {
  console.log('✅ astro.config.mjs exists');
} else {
  console.log('❌ astro.config.mjs not found!');
}

// Check 5: Package.json build script
console.log('\n5. Checking build scripts...');
const packageJson = join(rootDir, 'package.json');
if (existsSync(packageJson)) {
  const pkg = JSON.parse(readFileSync(packageJson, 'utf-8'));
  if (pkg.scripts?.build) {
    console.log(`✅ Build script: ${pkg.scripts.build}`);
    if (pkg.scripts.build.includes('prisma generate')) {
      console.log('✅ Build script includes Prisma generation');
    } else {
      console.log('⚠️  Build script does not include "prisma generate"');
    }
  } else {
    console.log('❌ No build script found in package.json!');
  }
}

// Check 6: Source files
console.log('\n6. Checking source files...');
const srcDir = join(rootDir, 'src');
if (existsSync(srcDir)) {
  console.log('✅ src/ directory exists');
  try {
    const srcFiles = execSync('find src -name "*.astro" -o -name "*.tsx" -o -name "*.ts" | head -10', {
      encoding: 'utf-8',
      cwd: rootDir,
      shell: true
    });
    if (srcFiles.trim()) {
      console.log(`✅ Found source files (showing first 10)`);
    }
  } catch {
    // Windows doesn't have find, try dir instead
    try {
      execSync('dir /s /b src\\*.astro src\\*.tsx src\\*.ts 2>nul | findstr /n "." | findstr "^[1-9]:"', {
        encoding: 'utf-8',
        cwd: rootDir,
        shell: true
      });
      console.log('✅ Found source files');
    } catch {
      console.log('⚠️  Could not enumerate source files');
    }
  }
} else {
  console.log('❌ src/ directory not found!');
}

// Check 7: .gitignore
console.log('\n7. Checking .gitignore...');
const gitignore = join(rootDir, '.gitignore');
if (existsSync(gitignore)) {
  const gitignoreContent = readFileSync(gitignore, 'utf-8');
  if (gitignoreContent.includes('dist/')) {
    console.log('✅ dist/ is in .gitignore (correct)');
  }
  if (gitignoreContent.includes('src/')) {
    console.log('❌ ERROR: src/ is in .gitignore! This will prevent source files from being deployed!');
  } else {
    console.log('✅ src/ is NOT in .gitignore (correct)');
  }
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📋 Summary:');
console.log('   If you see warnings above, address them before deploying.');
console.log('   Most common issues:');
console.log('   1. Uncommitted changes → git add . && git commit');
console.log('   2. Build cache → Clear Vercel build cache');
console.log('   3. Prisma not generated → npm run db:generate');
console.log('\n💡 Next steps:');
console.log('   1. Commit all changes: git add . && git commit -m "message"');
console.log('   2. Push to repository: git push');
console.log('   3. Clear Vercel build cache and redeploy');
console.log('\n');

