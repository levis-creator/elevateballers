import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { basename, extname, relative, resolve } from 'node:path';
import mysql from 'mysql2/promise';
import { R2_PUBLIC_URL, r2Configured, toR2Key } from '../src/lib/r2';

const sourceRoot = resolve(process.argv[2] || 'C:/Users/Levi/Downloads/public');
if (!r2Configured) throw new Error('R2 credentials are required.');
if (!R2_PUBLIC_URL) throw new Error('R2_PUBLIC_URL must be set to https://cdn.elevateballers.com.');
if (process.env.DB_SSL !== 'true' && process.env.DB_ALLOW_INSECURE_CONNECTION !== 'true') {
  throw new Error('This database does not support TLS. Set DB_ALLOW_INSECURE_CONNECTION=true only when running from a trusted server/network, or enable DB_SSL=true.');
}

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
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required.');
const database = new URL(databaseUrl);
const connection = await mysql.createConnection({
  host: database.hostname,
  port: Number(database.port || 3306),
  user: decodeURIComponent(database.username),
  password: decodeURIComponent(database.password),
  database: database.pathname.slice(1),
  connectTimeout: 30000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});
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

  const [folderRows] = await connection.execute<any[]>('SELECT id FROM folders WHERE name = ? LIMIT 1', [folderName]);
  let folder = folderRows[0];
  if (!folder) {
    const [result] = await connection.execute<any>(
      'INSERT INTO folders (id, name, path, is_private, created_at, updated_at) VALUES (?, ?, ?, 0, NOW(), NOW())',
      [randomUUID(), folderName, `public/${folderName}`],
    );
    folder = { id: result.insertId || (await connection.execute<any[]>('SELECT id FROM folders WHERE name = ? LIMIT 1', [folderName]))[0][0].id };
  }

  const [mediaRows] = await connection.execute<any[]>('SELECT id FROM media WHERE file_path = ? LIMIT 1', [dbFilePath]);
  const existing = mediaRows[0];
  const data = {
    title: basename(filePath), url, thumbnail: mimeType.startsWith('image/') ? url : null,
    filePath: dbFilePath, folderId: folder.id, type: mimeType.startsWith('image/') ? 'IMAGE' : 'DOCUMENT',
    size: stat.size, originalSize: stat.size, compressionRatio: 0, mimeType, isPrivate: false,
  };

  if (existing) {
    await connection.execute(
      'UPDATE media SET title = ?, url = ?, thumbnail = ?, file_path = ?, folder_id = ?, type = ?, size = ?, original_size = ?, compression_ratio = ?, mime_type = ?, is_private = ?, updated_at = NOW() WHERE id = ?',
      [data.title, data.url, data.thumbnail, data.filePath, folder.id, data.type, data.size, data.originalSize, data.compressionRatio, data.mimeType, 0, existing.id],
    );
    updated += 1;
  } else {
    await connection.execute(
      'INSERT INTO media (id, title, url, thumbnail, file_path, folder_id, type, size, original_size, compression_ratio, mime_type, is_private, featured, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NOW(), NOW())',
      [randomUUID(), data.title, data.url, data.thumbnail, data.filePath, folder.id, data.type, data.size, data.originalSize, data.compressionRatio, data.mimeType],
    );
    created += 1;
  }
}

await connection.end();
console.log(`Synced ${files.length} files to media DB: ${created} created, ${updated} updated.`);
