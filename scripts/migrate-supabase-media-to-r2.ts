import { prisma } from '../src/lib/prisma';
import { supabase, STORAGE_BUCKET } from '../src/lib/supabase';
import { getFileUrl } from '../src/lib/file-storage';
import { putR2Object, r2Configured, toR2Key } from '../src/lib/r2';

const apply = process.argv.includes('--apply');
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? Number.parseInt(limitArg.split('=')[1], 10) : undefined;

if (!supabase) throw new Error('Supabase credentials are required to read the source media.');
if (!r2Configured || process.env.STORAGE_TYPE !== 'r2') {
  throw new Error('Configure R2 credentials and set STORAGE_TYPE=r2 before running this migration.');
}

const media = await prisma.media.findMany({
  where: {
    filePath: { not: null },
    url: { contains: 'supabase' },
  },
  orderBy: { createdAt: 'asc' },
  ...(limit && limit > 0 ? { take: limit } : {}),
  select: {
    id: true,
    title: true,
    url: true,
    thumbnail: true,
    filePath: true,
    mimeType: true,
    isPrivate: true,
  },
});

console.log(`${apply ? 'Migrating' : 'Dry run:'} ${media.length} Supabase media object(s).`);

let migrated = 0;
let failed = 0;

for (const item of media) {
  if (!item.filePath) continue;
  const key = toR2Key(item.filePath);

  try {
    if (apply) {
      const sourcePath = item.filePath.replace(/^uploads\//, '');
      const downloaded = await supabase.storage.from(STORAGE_BUCKET).download(sourcePath);
      if (downloaded.error || !downloaded.data) {
        throw new Error(downloaded.error?.message || 'Supabase returned no file data');
      }

      const buffer = Buffer.from(await downloaded.data.arrayBuffer());
      await putR2Object(key, buffer, item.mimeType || 'application/octet-stream');

      const publicUrl = getFileUrl(item.filePath, item.isPrivate);
      await prisma.media.update({
        where: { id: item.id },
        data: {
          url: publicUrl,
          ...(item.thumbnail?.includes('supabase') ? { thumbnail: publicUrl } : {}),
        },
      });
    }

    migrated += 1;
    console.log(`${apply ? 'Migrated' : 'Would migrate'}: ${item.id} ${item.title}`);
  } catch (error) {
    failed += 1;
    console.error(`Failed: ${item.id} ${item.title}`, error);
  }
}

console.log(`Completed: ${migrated} succeeded, ${failed} failed.`);
if (!apply) console.log('No files or database rows were changed. Re-run with --apply to migrate.');
