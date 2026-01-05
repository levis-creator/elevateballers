#!/usr/bin/env node
/**
 * Homepage diagnostic script for production
 * Run this in production browser console to diagnose homepage issues
 */

const diagnosticScript = `
// Complete Homepage Diagnostic
// Copy and paste this entire script into your production browser console

(async function diagnoseHomepage() {
  console.log('%c=== HOMEPAGE DIAGNOSTIC ===', 'font-size: 16px; font-weight: bold; color: #2563eb;');
  console.log('Running comprehensive homepage check...\\n');
  
  const results = {
    featureFlags: {},
    apiResponses: {},
    components: {},
    errors: [],
    warnings: []
  };
  
  // 1. Check Feature Flags
  console.log('1. Checking Feature Flags...');
  try {
    const flags = await fetch('/api/feature-flags').then(r => r.json());
    const homepageFlags = {
      'home.postSlider': flags['home.postSlider'],
      'home.newsTicker': flags['home.newsTicker'],
      'home.marqueeMatchup': flags['home.marqueeMatchup'],
      'home.nextMatchCarousel': flags['home.nextMatchCarousel'],
      'home.latestNews': flags['home.latestNews'],
      'home.playerOfTheWeek': flags['home.playerOfTheWeek'],
      'home.statsLeaders': flags['home.statsLeaders'],
      'home.statsSection': flags['home.statsSection'],
      'home.mediaGallery': flags['home.mediaGallery'],
      'home.sponsors': flags['home.sponsors'],
      'home.registrationCta': flags['home.registrationCta'],
    };
    
    const layoutFlags = {
      'layout.topbar': flags['layout.topbar'],
      'layout.header': flags['layout.header'],
      'layout.mobileMenu': flags['layout.mobileMenu'],
      'layout.footer': flags['layout.footer'],
    };
    
    results.featureFlags = { ...homepageFlags, ...layoutFlags };
    
    // Check for disabled flags
    Object.entries(homepageFlags).forEach(([key, value]) => {
      if (!value) {
        results.warnings.push(\`Feature flag disabled: \${key}\`);
      }
    });
    
    console.log('%c✅ Feature Flags:', 'color: green; font-weight: bold;');
    console.table(homepageFlags);
    console.table(layoutFlags);
  } catch (e) {
    results.errors.push('Feature flags API failed: ' + e.message);
    console.error('%c❌ Feature Flags API Error:', 'color: red; font-weight: bold;', e);
  }
  
  // 2. Check API Responses
  console.log('\\n2. Checking API Endpoints...');
  const apis = [
    { name: 'Featured News', url: '/api/news?featured=true' },
    { name: 'Latest News', url: '/api/news?limit=5' },
    { name: 'Upcoming Matches', url: '/api/matches?status=upcoming' },
    { name: 'Media', url: '/api/media' },
  ];
  
  for (const api of apis) {
    try {
      const response = await fetch(api.url);
      const data = await response.json();
      results.apiResponses[api.name] = {
        status: response.status,
        ok: response.ok,
        count: Array.isArray(data) ? data.length : 'N/A',
        hasData: Array.isArray(data) ? data.length > 0 : !!data
      };
      
      if (!response.ok) {
        results.errors.push(\`\${api.name} returned status \${response.status}\`);
      } else if (Array.isArray(data) && data.length === 0) {
        results.warnings.push(\`\${api.name} returned empty array\`);
      }
    } catch (e) {
      results.apiResponses[api.name] = { error: e.message };
      results.errors.push(\`\${api.name} API failed: \${e.message}\`);
    }
  }
  
  console.log('%c✅ API Responses:', 'color: green; font-weight: bold;');
  console.table(results.apiResponses);
  
  // 3. Check Component Rendering
  console.log('\\n3. Checking Component Rendering...');
  results.components = {
    'Post Slider': document.querySelectorAll('[class*="post-slider"], [class*="PostSlider"], [id*="post-slider"]').length,
    'News Ticker': document.querySelectorAll('[class*="news-ticker"], [class*="NewsTicker"], [id*="news-ticker"]').length,
    'Latest News': document.querySelectorAll('[class*="latest-news"], [class*="LatestNews"], [id*="latest-news"]').length,
    'Next Match': document.querySelectorAll('[class*="next-match"], [class*="NextMatch"], [id*="next-match"]').length,
    'Media Gallery': document.querySelectorAll('[class*="media-gallery"], [class*="MediaGallery"], [id*="media-gallery"]').length,
    'TopBar': document.querySelectorAll('[class*="top-bar"], [class*="TopBar"]').length,
    'Header': document.querySelectorAll('[class*="stm-header"], [class*="Header"]').length,
    'Footer': document.querySelectorAll('[class*="footer"], [class*="Footer"]').length,
  };
  
  console.log('%c✅ Components Found:', 'color: green; font-weight: bold;');
  console.table(results.components);
  
  // 4. Check for JavaScript Errors
  console.log('\\n4. Checking for Errors...');
  const consoleErrors = [];
  const originalError = console.error;
  console.error = function(...args) {
    consoleErrors.push(args.join(' '));
    originalError.apply(console, args);
  };
  
  // 5. Summary
  console.log('\\n%c=== DIAGNOSTIC SUMMARY ===', 'font-size: 16px; font-weight: bold; color: #2563eb;');
  
  if (results.errors.length === 0 && results.warnings.length === 0) {
    console.log('%c✅ No issues found! Homepage should be working correctly.', 'color: green; font-weight: bold; font-size: 14px;');
  } else {
    if (results.errors.length > 0) {
      console.log('%c❌ ERRORS:', 'color: red; font-weight: bold; font-size: 14px;');
      results.errors.forEach(err => console.error('  -', err));
    }
    if (results.warnings.length > 0) {
      console.log('%c⚠️  WARNINGS:', 'color: orange; font-weight: bold; font-size: 14px;');
      results.warnings.forEach(warn => console.warn('  -', warn));
    }
  }
  
  // Recommendations
  console.log('\\n%c=== RECOMMENDATIONS ===', 'font-size: 14px; font-weight: bold;');
  
  const disabledFlags = Object.entries(results.featureFlags)
    .filter(([key, value]) => key.startsWith('home.') && !value)
    .map(([key]) => key);
  
  if (disabledFlags.length > 0) {
    console.log('%c1. Enable these feature flags in Vercel:', 'font-weight: bold;');
    disabledFlags.forEach(flag => {
      const envVar = \`FEATURE_FLAG_\${flag.toUpperCase().replace(/\\./g, '_')}\`;
      console.log(\`   Set \${envVar}=true in Vercel Dashboard\`);
    });
  }
  
  const emptyApis = Object.entries(results.apiResponses)
    .filter(([name, data]) => data.hasData === false)
    .map(([name]) => name);
  
  if (emptyApis.length > 0) {
    console.log('%c2. These APIs returned no data:', 'font-weight: bold;');
    emptyApis.forEach(api => console.log(\`   - \${api}\`));
    console.log('   Check if production database has data for these endpoints.');
  }
  
  const missingComponents = Object.entries(results.components)
    .filter(([name, count]) => count === 0 && name !== 'TopBar' && name !== 'Header' && name !== 'Footer')
    .map(([name]) => name);
  
  if (missingComponents.length > 0) {
    console.log('%c3. These components are not rendering:', 'font-weight: bold;');
    missingComponents.forEach(comp => console.log(\`   - \${comp}\`));
    console.log('   Check feature flags and API responses above.');
  }
  
  console.log('\\n%c=== END DIAGNOSTIC ===', 'font-size: 16px; font-weight: bold; color: #2563eb;');
  
  return results;
})();
`;

console.log(`
╔══════════════════════════════════════════════════════════════╗
║         HOMEPAGE DIAGNOSTIC SCRIPT FOR BROWSER              ║
╚══════════════════════════════════════════════════════════════╝

Copy and paste the following script into your PRODUCTION browser console:

${diagnosticScript}

Or visit: https://your-production-domain.com
Then open DevTools (F12) → Console tab → Paste the script above

This will check:
✅ Feature flags status
✅ API endpoint responses  
✅ Component rendering
✅ Errors and warnings
✅ Provide recommendations

`);

