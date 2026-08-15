import 'dotenv/config';
import { promises as fs } from 'node:fs';
import { extname, relative, resolve } from 'node:path';
import { putR2Object, isR2Configured, toR2Key } from '../src/lib/r2';

const sourceRoot = resolve(process.argv[2] || 'C:/Users/Levi/Downloads/public');

if (!(await isR2Configured())) {
  throw new Error(
    'R2 is not configured. Set R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.'
  );
}

const mimeTypes: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
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
console.log(`Uploading ${files.length} file(s) from ${sourceRoot}`);

let uploaded = 0;
let failed = 0;

for (const filePath of files) {
  const relativePath = relative(sourceRoot, filePath).replaceAll('\\', '/');
  const key = toR2Key(relativePath);
  try {
    const body = await fs.readFile(filePath);
    const contentType = mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream';
    await putR2Object(key, body, contentType);
    uploaded += 1;
    console.log(`Uploaded ${uploaded}/${files.length}: ${key}`);
  } catch (error) {
    failed += 1;
    console.error(`Failed: ${key}`, error);
  }
}

console.log(`Completed: ${uploaded} uploaded, ${failed} failed.`);
if (failed > 0) process.exitCode = 1;
