#!/usr/bin/env node
/**
 * Test API endpoints script
 * Tests all API endpoints used by the homepage
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing API Endpoints\n');
console.log('='.repeat(50));

// Base URL - can be overridden with environment variable
const BASE_URL = process.env.TEST_URL || 'http://localhost:4321';

console.log(`Testing against: ${BASE_URL}\n`);

const endpoints = [
  {
    name: 'Featured News',
    url: '/api/news?featured=true',
    expected: 'array of featured articles',
  },
  {
    name: 'Latest News',
    url: '/api/news?limit=5',
    expected: 'array of latest articles',
  },
  {
    name: 'Upcoming Matches',
    url: '/api/matches?status=upcoming',
    expected: 'array of upcoming matches',
  },
  {
    name: 'Media Items',
    url: '/api/media',
    expected: 'array of media items',
  },
  {
    name: 'Teams',
    url: '/api/teams',
    expected: 'array of teams',
  },
  {
    name: 'Feature Flags',
    url: '/api/feature-flags',
    expected: 'object with feature flags',
  },
];

const results = [];

for (const endpoint of endpoints) {
  try {
    const fullUrl = `${BASE_URL}${endpoint.url}`;
    console.log(`Testing: ${endpoint.name}...`);
    
    const startTime = Date.now();
    const response = await fetch(fullUrl);
    const duration = Date.now() - startTime;
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = await response.text();
    }
    
    const isArray = Array.isArray(data);
    const count = isArray ? data.length : (typeof data === 'object' ? Object.keys(data).length : 'N/A');
    
    const result = {
      name: endpoint.name,
      status: response.status,
      ok: response.ok,
      duration: `${duration}ms`,
      count: count,
      type: isArray ? 'array' : typeof data,
    };
    
    results.push(result);
    
    if (response.ok) {
      console.log(`  ✅ ${response.status} - ${count} items - ${duration}ms`);
    } else {
      console.log(`  ❌ ${response.status} - Error`);
    }
  } catch (error) {
    results.push({
      name: endpoint.name,
      status: 'ERROR',
      ok: false,
      error: error.message,
    });
    console.log(`  ❌ Failed: ${error.message}`);
  }
}

console.log('\n' + '='.repeat(50));
console.log('\n📊 Test Results Summary:\n');
console.table(results);

// Summary
const passed = results.filter(r => r.ok).length;
const failed = results.filter(r => !r.ok).length;

console.log(`\n✅ Passed: ${passed}/${results.length}`);
if (failed > 0) {
  console.log(`❌ Failed: ${failed}/${results.length}`);
}

console.log(`\n💡 To test production, set TEST_URL environment variable:`);
console.log(`   TEST_URL=https://your-domain.vercel.app node scripts/test-apis.js\n`);

