import 'dotenv/config';
import { promises as fs } from 'node:fs';
import { basename, extname, relative, resolve } from 'node:path';
import { prisma } from '../src/lib/prisma';
import { R2_PUBLIC_URL, r2Configured, toR2Key } from '../src/lib/r2';

const sourceRoot = resolve(process.argv[2] || 'C:/Users/Levi/Downloads/public');
if (!r2Configured) throw new Error('R2 credentials are required.');
if (!R2_PUBLIC_URL) throw new Error('R2_PUBLIC_URL must be set to https://cdn.elevateballers.com.');

const mimeTypes: Record<string, string> = {
  '.gif': 'image/gif', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.pdf': 'application/pdf',
  '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.webm': 'video/webm',
};

async function listFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(fullPath)));
    else if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

const files = await listFiles(sourceRoot);
const client = prisma as any;
let created = 0;
let updated = 0;

for (const filePath of files) {
  const key = toR2Key(relative(sourceRoot, filePath).replaceAll('\\', '/'));
  const segments = key.split('/');
  const folderName = segments[0] === 'public' ? segments[1] || 'general' : 'general';
  const dbFilePath = `uploads/${key}`;
  const url = `${R2_PUBLIC_URL}/${key.split('/').map(encodeURIComponent).join('/')}`;
  const stat = await fs.stat(filePath);
  const mimeType = mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream';

  let folder = await client.folder.findUnique({ where: { name: folderName } });
  if (!folder) {
    folder = await client.folder.create({
      data: { name: folderName, path: `public/${folderName}`, isPrivate: false },
    });
  }

  const existing = await client.media.findFirst({ where: { filePath: dbFilePath }, select: { id: true } });
  const data = {
    title: basename(filePath), url, thumbnail: mimeType.startsWith('image/') ? url : null,
    filePath: dbFilePath, folderId: folder.id, type: mimeType.startsWith('image/') ? 'IMAGE' : 'DOCUMENT',
    size: stat.size, originalSize: stat.size, compressionRatio: 0, mimeType, isPrivate: false,
  };

  if (existing) {
    await client.media.update({ where: { id: existing.id }, data });
    updated += 1;
  } else {
    await client.media.create({ data });
    created += 1;
  }
}

console.log(`Synced ${files.length} files to media DB: ${created} created, ${updated} updated.`);
