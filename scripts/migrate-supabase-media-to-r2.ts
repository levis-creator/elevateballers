import { prisma } from '../src/lib/prisma';
import { getSupabaseClient, STORAGE_BUCKET } from '../src/lib/supabase';
import { getFileUrl } from '../src/lib/file-storage';
import { putR2Object, isR2Configured, toR2Key } from '../src/lib/r2';

const apply = process.argv.includes('--apply');
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? Number.parseInt(limitArg.split('=')[1], 10) : undefined;

const supabase = await getSupabaseClient();
if (!supabase) throw new Error('Supabase credentials are required to read the source media.');
if (!(await isR2Configured()) || process.env.STORAGE_TYPE !== 'r2') {
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
    fileUsages: {
      select: {
        entityType: true,
        entityId: true,
        fieldName: true,
      },
    },
  },
});

console.log(`${apply ? 'Migrating' : 'Dry run:'} ${media.length} Supabase media object(s).`);

let migrated = 0;
let failed = 0;
let referencesUpdated = 0;

const urlReplacements = new Map<string, string>();

function addReplacement(oldUrl: string | null | undefined, newUrl: string) {
  if (oldUrl && oldUrl !== newUrl && oldUrl.includes('supabase')) {
    urlReplacements.set(oldUrl, newUrl);
  }
}

function replaceUrl(value: string | null | undefined): string | null | undefined {
  if (!value) return value;
  let result = value;
  for (const [oldUrl, newUrl] of urlReplacements) {
    result = result.split(oldUrl).join(newUrl);
  }
  return result;
}

async function updateReference(entityType: string, entityId: string, fieldName: string, oldUrl: string, newUrl: string) {
  const client = prisma as any;
  const entityMap: Record<string, Record<string, string>> = {
    PLAYER: { image: 'player' },
    TEAM: { logo: 'team' },
    NEWS_ARTICLE: { image: 'newsArticle' },
    STAFF: { image: 'staff' },
    LEAGUE: { logo: 'league' },
  };
  const model = entityMap[entityType]?.[fieldName];
  if (!model) return;

  const row = await client[model].findUnique({ where: { id: entityId }, select: { [fieldName]: true } });
  if (!row || row[fieldName] !== oldUrl) return;
  await client[model].update({ where: { id: entityId }, data: { [fieldName]: newUrl } });
  referencesUpdated += 1;
}

async function updateKnownUrlFields() {
  const fields: Array<[string, string, string]> = [
    ['newsArticle', 'image', 'image'],
    ['newsArticleRevision', 'image', 'image'],
    ['newsArticleMetadata', 'socialImage', 'socialImage'],
    ['league', 'logo', 'logo'],
    ['match', 'team1Logo', 'team1Logo'],
    ['match', 'team2Logo', 'team2Logo'],
    ['team', 'logo', 'logo'],
    ['leagueStaff', 'photo', 'photo'],
    ['teamStaffMember', 'photo', 'photo'],
    ['player', 'image', 'image'],
    ['staff', 'image', 'image'],
    ['playerOfTheWeek', 'customImage', 'customImage'],
    ['sponsor', 'image', 'image'],
    ['reportGeneration', 'fileUrl', 'fileUrl'],
    ['siteSetting', 'value', 'value'],
  ];

  const client = prisma as any;
  for (const [model, field, fieldName] of fields) {
    const rows = await client[model].findMany({
      where: { [field]: { contains: 'supabase' } },
      select: { id: true, [field]: true },
    });
    for (const row of rows) {
      const nextValue = replaceUrl(row[field]);
      if (nextValue && nextValue !== row[field]) {
        await client[model].update({ where: { id: row.id }, data: { [fieldName]: nextValue } });
        referencesUpdated += 1;
      }
    }
  }
}

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

      const publicUrl = await getFileUrl(item.filePath, item.isPrivate);
      addReplacement(item.url, publicUrl);
      addReplacement(item.thumbnail, publicUrl);
      await prisma.media.update({
        where: { id: item.id },
        data: {
          url: publicUrl,
          ...(item.thumbnail?.includes('supabase') ? { thumbnail: publicUrl } : {}),
        },
      });

      for (const usage of item.fileUsages) {
        await updateReference(usage.entityType, usage.entityId, usage.fieldName, item.url, publicUrl);
      }
    }

    migrated += 1;
    console.log(`${apply ? 'Migrated' : 'Would migrate'}: ${item.id} ${item.title}`);
  } catch (error) {
    failed += 1;
    console.error(`Failed: ${item.id} ${item.title}`, error);
  }
}

if (apply) await updateKnownUrlFields();

console.log(`Completed: ${migrated} succeeded, ${failed} failed, ${referencesUpdated} references updated.`);
if (!apply) console.log('No files or database rows were changed. Re-run with --apply to migrate.');
