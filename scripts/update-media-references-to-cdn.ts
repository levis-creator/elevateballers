import 'dotenv/config';
import { promises as fs } from 'node:fs';
import { prisma } from '../src/lib/prisma';
import { headR2Object, R2_PUBLIC_URL, r2Configured, toR2Key } from '../src/lib/r2';

if (!r2Configured) throw new Error('R2 credentials are required.');
if (!R2_PUBLIC_URL) throw new Error('R2_PUBLIC_URL must be set, for example https://cdn.elevateballers.com.');

const client = prisma as any;
const replacements = new Map<string, string>();
let mediaUpdated = 0;
let referencesUpdated = 0;
const backup: Array<{ model: string; id: string; field: string; value: string | null }> = [];

function cdnUrl(filePath: string, isPrivate: boolean) {
  const key = toR2Key(filePath);
  return isPrivate ? `/api/uploads/${key}` : `${R2_PUBLIC_URL}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

function replaceUrls(value: string | null | undefined) {
  if (!value) return value;
  let next = value;
  for (const [oldUrl, newUrl] of replacements) next = next.split(oldUrl).join(newUrl);
  return next;
}

const media = await client.media.findMany({
  where: { filePath: { not: null } },
  select: { id: true, url: true, thumbnail: true, filePath: true, isPrivate: true, fileUsages: { select: { entityType: true, entityId: true, fieldName: true } } },
});

for (const item of media) {
  if (!item.filePath) continue;
  const nextUrl = cdnUrl(item.filePath, item.isPrivate);
  try {
    await headR2Object(toR2Key(item.filePath));
  } catch {
    console.warn(`Skipping ${item.id}: R2 object is missing at ${toR2Key(item.filePath)}`);
    continue;
  }
  if (item.url !== nextUrl) replacements.set(item.url, nextUrl);
  if (item.thumbnail && item.thumbnail !== nextUrl) replacements.set(item.thumbnail, nextUrl);
  backup.push({ model: 'media', id: item.id, field: 'url', value: item.url });
  backup.push({ model: 'media', id: item.id, field: 'thumbnail', value: item.thumbnail });
  await client.media.update({ where: { id: item.id }, data: { url: nextUrl, thumbnail: item.thumbnail ? nextUrl : null } });
  mediaUpdated += 1;
}

const fields: Array<[string, string]> = [
  ['newsArticle', 'image'], ['newsArticleRevision', 'image'], ['newsArticleMetadata', 'socialImage'],
  ['league', 'logo'], ['match', 'team1Logo'], ['match', 'team2Logo'], ['team', 'logo'],
  ['leagueStaff', 'photo'], ['teamStaffMember', 'photo'], ['player', 'image'], ['staff', 'image'],
  ['playerOfTheWeek', 'customImage'], ['sponsor', 'image'], ['reportGeneration', 'fileUrl'], ['siteSetting', 'value'],
];

for (const [model, field] of fields) {
  const rows = await client[model].findMany({ select: { id: true, [field]: true } });
  for (const row of rows) {
    const next = replaceUrls(row[field]);
    if (next && next !== row[field]) {
      backup.push({ model, id: row.id, field, value: row[field] });
      await client[model].update({ where: { id: row.id }, data: { [field]: next } });
      referencesUpdated += 1;
    }
  }
}

await fs.mkdir('backups', { recursive: true });
await fs.writeFile(
  `backups/media-cdn-reference-update-${new Date().toISOString().replaceAll(':', '-')}.json`,
  JSON.stringify(backup, null, 2),
  'utf8'
);

console.log(`Updated ${mediaUpdated} media records and ${referencesUpdated} image references to ${R2_PUBLIC_URL}.`);
