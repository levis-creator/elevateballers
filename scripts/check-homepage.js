#!/usr/bin/env node
/**
 * Homepage diagnostic script
 * Checks feature flags and configuration that affect homepage
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🏠 Homepage Diagnostic Check\n');
console.log('='.repeat(50));

// Check feature flags configuration
console.log('\n1. Checking Feature Flags Configuration...');
const featureFlagsFile = join(rootDir, 'src', 'lib', 'feature-flags.ts');
if (existsSync(featureFlagsFile)) {
  const content = readFileSync(featureFlagsFile, 'utf-8');
  
  // Extract homepage feature flags
  const homepageFlags = [
    'home.postSlider',
    'home.newsTicker',
    'home.marqueeMatchup',
    'home.nextMatchCarousel',
    'home.latestNews',
    'home.playerOfTheWeek',
    'home.statsLeaders',
    'home.statsSection',
    'home.mediaGallery',
    'home.sponsors',
    'home.registrationCta',
  ];
  
  console.log('\nHomepage Feature Flags:');
  homepageFlags.forEach(flag => {
    const defaultEnabled = content.includes(`'${flag}':`) && 
                           content.includes('defaultEnabled: true');
    console.log(`  ${defaultEnabled ? '✅' : '❌'} ${flag} (default: ${defaultEnabled ? 'enabled' : 'disabled'})`);
  });
  
  console.log('\nLayout Feature Flags:');
  const layoutFlags = [
    'layout.topbar',
    'layout.header',
    'layout.mobileMenu',
    'layout.footer',
  ];
  
  layoutFlags.forEach(flag => {
    const defaultEnabled = content.includes(`'${flag}':`) && 
                           content.includes('defaultEnabled: true');
    console.log(`  ${defaultEnabled ? '✅' : '❌'} ${flag} (default: ${defaultEnabled ? 'enabled' : 'disabled'})`);
  });
} else {
  console.log('❌ Feature flags file not found!');
}

// Check homepage file
console.log('\n2. Checking Homepage Implementation...');
const homepageFile = join(rootDir, 'src', 'pages', 'index.astro');
if (existsSync(homepageFile)) {
  const content = readFileSync(homepageFile, 'utf-8');
  
  const components = [
    'PostSlider',
    'NewsTicker',
    'MarqueeMatchup',
    'NextMatchCarousel',
    'LatestNews',
    'PlayerOfTheWeek',
    'StatsSection',
    'MediaGallery',
    'Sponsors',
  ];
  
  console.log('\nHomepage Components:');
  components.forEach(comp => {
    const found = content.includes(comp);
    console.log(`  ${found ? '✅' : '❌'} ${comp}`);
  });
  
  const usesFeatureFlags = content.includes('FeatureGate') || content.includes('isFeatureEnabled');
  console.log(`\n  ${usesFeatureFlags ? '✅' : '❌'} Uses feature flags: ${usesFeatureFlags}`);
} else {
  console.log('❌ Homepage file not found!');
}

// Check environment files
console.log('\n3. Checking Environment Configuration...');
const envProd = join(rootDir, '.env.production');
if (existsSync(envProd)) {
  const content = readFileSync(envProd, 'utf-8');
  const hasFeatureFlags = content.includes('FEATURE_FLAG_');
  console.log(`  ${hasFeatureFlags ? '⚠️' : '✅'} .env.production ${hasFeatureFlags ? 'has feature flags set' : 'has no feature flags (using defaults)'}`);
  
  if (hasFeatureFlags) {
    const flags = content.match(/FEATURE_FLAG_\w+/g) || [];
    console.log(`  Found ${flags.length} feature flag(s) in .env.production`);
    flags.forEach(flag => {
      const line = content.split('\n').find(l => l.includes(flag));
      const isDisabled = line && (line.includes('=false') || line.includes('=0'));
      console.log(`    ${isDisabled ? '❌' : '✅'} ${flag}`);
    });
  }
} else {
  console.log('  ℹ️  .env.production not found');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📋 Summary:');
console.log('   If homepage looks different in production:');
console.log('   1. Check FEATURE_FLAG_* variables in Vercel dashboard');
console.log('   2. Verify DATABASE_URL points to production database');
console.log('   3. Check if production database has the same data');
console.log('   4. Compare API responses in dev vs production');
console.log('\n💡 Next steps:');
console.log('   1. Check Vercel environment variables');
console.log('   2. Verify database connection in production');
console.log('   3. Check browser console for errors');
console.log('   4. Compare network requests');
console.log('\n');

