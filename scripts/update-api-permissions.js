import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Mapping of API endpoints to their required permissions
const endpointPermissionMap = {
  // Teams
  'teams/index.ts': { GET: null, POST: 'teams:create', DELETE: 'teams:delete' },
  'teams/[id].ts': { GET: null, PUT: 'teams:update', DELETE: 'teams:delete' },
  'teams/[id]/approve.ts': { PATCH: 'teams:approve' },
  'teams/[id]/staff.ts': { GET: null, POST: 'teams:manage_staff', DELETE: 'teams:manage_staff' },
  'teams/bulk-approve.ts': { POST: 'teams:bulk_approve' },
  'teams/bulk-delete.ts': { POST: 'teams:bulk_delete' },

  // Players
  'players/index.ts': { GET: null, POST: 'players:create', DELETE: 'players:delete' },
  'players/[id].ts': { GET: null, PUT: 'players:update', DELETE: 'players:delete' },
  'players/[id]/approve.ts': { PATCH: 'players:approve' },
  'players/bulk-approve.ts': { POST: 'players:bulk_approve' },
  'players/bulk-delete.ts': { POST: 'players:bulk_delete' },

  // Matches
  'matches/index.ts': { GET: null, POST: 'matches:create', DELETE: 'matches:delete' },
  'matches/[id].ts': { GET: null, PUT: 'matches:update', DELETE: 'matches:delete' },
  'matches/bulk-delete.ts': { POST: 'matches:bulk_delete' },

  // Media
  'media/index.ts': { GET: null, POST: 'media:create', DELETE: 'media:delete' },
  'media/[id].ts': { GET: null, PUT: 'media:update', DELETE: 'media:delete' },
  'media/batch-upload.ts': { POST: 'media:batch_upload' },
  'media/batch-move.ts': { POST: 'media:batch_move' },
  'media/batch-featured.ts': { POST: 'media:update' },
  'media/cleanup.ts': { POST: 'media:cleanup' },
  'media/duplicate.ts': { POST: 'media:create' },
  'media/export-zip.ts': { POST: 'media:export' },

  // News
  'news/index.ts': { GET: null, POST: 'news_articles:create', DELETE: 'news_articles:delete' },
  'news/[id].ts': { GET: null, PUT: 'news_articles:update', DELETE: 'news_articles:delete' },
  'news/bulk-delete.ts': { POST: 'news_articles:bulk_delete' },

  // Users
  'users/index.ts': { GET: 'users:read', POST: 'users:create', DELETE: 'users:delete' },
  'users/[id].ts': { GET: 'users:read', PUT: 'users:update', DELETE: 'users:delete' },

  // Leagues
  'leagues/index.ts': { GET: null, POST: 'leagues:create', DELETE: 'leagues:delete' },
  'leagues/[id].ts': { GET: null, PUT: 'leagues:update', DELETE: 'leagues:delete' },
  'leagues/bulk-delete.ts': { POST: 'leagues:delete' },

  // Seasons
  'seasons/index.ts': { GET: null, POST: 'seasons:create', DELETE: 'seasons:delete' },
  'seasons/[id].ts': { GET: null, PUT: 'seasons:update', DELETE: 'seasons:delete' },
  'seasons/bulk-delete.ts': { POST: 'seasons:delete' },

  // Settings
  'settings/index.ts': { GET: 'site_settings:read', POST: 'site_settings:create' },
  'settings/[id].ts': { GET: 'site_settings:read', PUT: 'site_settings:update', DELETE: 'site_settings:delete' },

  // Staff
  'staff/index.ts': { GET: null, POST: 'staff:create', DELETE: 'staff:delete' },
  'staff/[id].ts': { GET: null, PUT: 'staff:update', DELETE: 'staff:delete' },
  'staff/bulk-delete.ts': { POST: 'staff:bulk_delete' },

  // Pages
  'pages/index.ts': { GET: null, POST: 'page_contents:create', DELETE: 'page_contents:delete' },
  'pages/[id].ts': { GET: null, PUT: 'page_contents:update', DELETE: 'page_contents:delete' },
  'pages/bulk-delete.ts': { POST: 'page_contents:delete' },

  // Comments
  'comments/index.ts': { GET: null, POST: 'comments:create', DELETE: 'comments:delete' },
  'comments/[id].ts': { GET: null, PUT: 'comments:update', DELETE: 'comments:delete' },

  // Folders
  'folders/index.ts': { GET: null, POST: 'folders:create' },
  'folders/[id].ts': { GET: null, PUT: 'folders:update', DELETE: 'folders:delete' },

  // Highlights
  'highlights/potw.ts': { GET: null, POST: 'potw:create', PUT: 'potw:update', DELETE: 'potw:delete' },
  'highlights/sponsors/index.ts': { GET: null, POST: 'sponsors:create' },
  'highlights/sponsors/[id].ts': { GET: null, PUT: 'sponsors:update', DELETE: 'sponsors:delete' },

  // File usage
  'file-usage/index.ts': { GET: 'media:read', POST: 'media:update' },

  // Notifications
  'notifications/index.ts': { GET: 'registration_notifications:read', PATCH: 'registration_notifications:update' },

  // Upload
  'upload/image.ts': { POST: 'media:create' },

  // Tournaments
  'tournaments/generate-bracket.ts': { POST: 'matches:create' },
  'tournaments/preview-bracket.ts': { POST: 'matches:read' },
};

console.log('🔄 Updating API endpoints to use permission-based authorization...\n');

let updatedCount = 0;
let skippedCount = 0;

for (const [endpoint, methods] of Object.entries(endpointPermissionMap)) {
  const filePath = join(rootDir, 'src', 'pages', 'api', endpoint);

  try {
    let content = readFileSync(filePath, 'utf-8');

    // Check if file uses requireAdmin
    if (!content.includes('requireAdmin')) {
      console.log(`⏭️  Skipped: ${endpoint} (no requireAdmin found)`);
      skippedCount++;
      continue;
    }

    // Update import statement
    content = content.replace(
      /import { requireAdmin } from ['"](.+?)\/auth['"];/g,
      "import { requirePermission } from '$1/rbac/middleware';"
    );

    // Find all HTTP methods in the file and replace requireAdmin calls
    for (const [method, permission] of Object.entries(methods)) {
      if (!permission) continue; // Skip if no permission required (public endpoints)

      const methodRegex = new RegExp(
        `export const ${method}: APIRoute = async`,
        'g'
      );

      if (methodRegex.test(content)) {
        // Replace requireAdmin(request) with requirePermission(request, 'permission')
        content = content.replace(
          new RegExp(`await requireAdmin\\(request\\)`, 'g'),
          `await requirePermission(request, '${permission}')`
        );
      }
    }

    writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Updated: ${endpoint}`);
    updatedCount++;
  } catch (error) {
    console.error(`❌ Error updating ${endpoint}:`, error.message);
  }
}

console.log(`\n📊 Summary:`);
console.log(`   Updated: ${updatedCount} files`);
console.log(`   Skipped: ${skippedCount} files`);
console.log(`\n✅ API endpoint updates complete!\n`);
