#!/usr/bin/env node
/**
 * Cross-platform build cleanup script
 * Removes .astro and dist directories before building
 */

import { existsSync, rmSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const dirsToRemove = ['.astro', 'dist'];

console.log('🧹 Cleaning build directories...\n');

dirsToRemove.forEach(dir => {
  const dirPath = join(rootDir, dir);
  if (existsSync(dirPath)) {
    try {
      rmSync(dirPath, { recursive: true, force: true });
      console.log(`✅ Removed ${dir}/`);
    } catch (error) {
      console.error(`❌ Failed to remove ${dir}/:`, error.message);
      process.exit(1);
    }
  } else {
    console.log(`ℹ️  ${dir}/ does not exist (skipping)`);
  }
});

console.log('\n✨ Cleanup complete!\n');

