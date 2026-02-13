import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';
import path from 'path';

console.log('\n🔧 Fixing RBAC imports in API routes...\n');

// Find all API route files
const apiFiles = globSync('src/pages/api/**/*.ts', {
  cwd: process.cwd(),
  absolute: true,
});

let fixed = 0;
let skipped = 0;
let errors = 0;

for (const file of apiFiles) {
  try {
    const content = readFileSync(file, 'utf8');

    // Check if file uses requirePermission
    if (!content.includes('requirePermission')) {
      skipped++;
      continue;
    }

    // Check if already has the import
    if (content.includes("from '../../../features/rbac/middleware'") ||
        content.includes("from '../../../../features/rbac/middleware'") ||
        content.includes("from '../../../../../features/rbac/middleware'")) {
      skipped++;
      continue;
    }

    // Determine the correct import path based on file depth
    const relativePath = path.relative(process.cwd(), file);
    const depth = relativePath.split(path.sep).length - 3; // -3 for src/pages/api
    const importPath = '../'.repeat(depth) + 'features/rbac/middleware';

    // Find the last import statement
    const lines = content.split('\n');
    let lastImportIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      } else if (lines[i].trim() && !lines[i].trim().startsWith('//')) {
        // Stop at first non-import, non-comment line
        break;
      }
    }

    // Insert the import after the last import
    if (lastImportIndex >= 0) {
      const importLine = `import { requirePermission } from '${importPath}';`;
      lines.splice(lastImportIndex + 1, 0, importLine);

      const newContent = lines.join('\n');
      writeFileSync(file, newContent, 'utf8');

      const shortPath = path.relative(process.cwd(), file);
      console.log(`   ✓ ${shortPath}`);
      fixed++;
    } else {
      console.log(`   ⚠️  Could not find imports in ${path.relative(process.cwd(), file)}`);
      errors++;
    }
  } catch (error) {
    console.error(`   ❌ Error processing ${path.relative(process.cwd(), file)}:`, error.message);
    errors++;
  }
}

console.log(`\n✅ Fixed ${fixed} files`);
console.log(`⏭️  Skipped ${skipped} files (already have import or don't use requirePermission)`);
if (errors > 0) {
  console.log(`❌ ${errors} errors`);
}
console.log('');
