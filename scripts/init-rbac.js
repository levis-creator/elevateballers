import { execSync } from 'child_process';
import { config } from 'dotenv';

config();

console.log('\n🚀 Initializing RBAC System\n');
console.log('='.repeat(60));
console.log('\nThis script will:');
console.log('  1. Seed permissions and roles');
console.log('  2. Assign all permissions to Admin role');
console.log('  3. Create an admin user');
console.log('\n' + '='.repeat(60) + '\n');

function runScript(scriptName, description) {
  console.log(`\n▶️  ${description}...`);
  console.log('-'.repeat(60));

  try {
    execSync(`node ${scriptName}`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`✅ ${description} complete\n`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

async function main() {
  try {
    // Step 1: Enhance RBAC (seed permissions and roles)
    runScript('scripts/enhance-rbac.js', 'Seeding permissions and roles');

    // Step 2: Update Admin permissions
    runScript('scripts/update-admin-permissions.js', 'Assigning permissions to Admin role');

    // Step 3: Create admin user
    runScript('scripts/create-admin.js', 'Creating admin user');

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 RBAC INITIALIZATION COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n✅ Your system is ready with:');
    console.log('   • 108 permissions across 17 categories');
    console.log('   • 6 system roles (Admin, Editor, Content Manager, etc.)');
    console.log('   • 1 admin user with full access');
    console.log('\n📋 Next steps:');
    console.log('   1. Login at /admin/login');
    console.log('   2. Change the default admin password');
    console.log('   3. Create additional users and assign roles');
    console.log('   4. Create custom roles as needed');
    console.log('\n💡 Useful commands:');
    console.log('   • Verify RBAC: node scripts/verify-rbac.js');
    console.log('   • Test RBAC: node scripts/test-rbac-permissions.js');
    console.log('   • Create user: node scripts/create-admin.js');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Initialization failed:', error);
    process.exit(1);
  }
}

main();
