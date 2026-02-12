import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

console.log('🔧 Fixing middleware import paths...\n');

// Find all TypeScript files in the API directory
const files = globSync('src/pages/api/**/*.ts');

let fixedCount = 0;

for (const file of files) {
  try {
    let content = readFileSync(file, 'utf-8');

    // Check if file has the incorrect import
    if (content.includes('features/cms/lib/rbac/middleware')) {
      // Fix the import path
      content = content.replace(
        /from ['"](.+?)\/features\/cms\/lib\/rbac\/middleware['"]/g,
        "from '$1/features/rbac/middleware'"
      );

      writeFileSync(file, content, 'utf-8');
      console.log(`✅ Fixed: ${file}`);
      fixedCount++;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${file}:`, error.message);
  }
}

console.log(`\n📊 Summary:`);
console.log(`   Fixed: ${fixedCount} files`);
console.log(`\n✅ Import path fixes complete!\n`);
