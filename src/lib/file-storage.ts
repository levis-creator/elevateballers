import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getEnv } from './env';
import { supabase, STORAGE_BUCKET } from './supabase';
import { deleteR2Object, getR2Object, headR2Object, putR2Object, r2Configured, R2_PUBLIC_URL, toR2Key } from './r2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get project root directory
// During development, this is the project root.
// In production (bundled), we might need to be careful.
const projectRoot = join(__dirname, '../..');
const downloadsPath = getEnv('UPLOADS_PATH_OVERRIDE');
const uploadsBasePath = downloadsPath || join(projectRoot, 'public', 'uploads');

/**
 * Get the storage type to use
 */
export type StorageType = 'local' | 'supabase' | 'r2';

export function getStorageType(): StorageType {
  const type = getEnv('STORAGE_TYPE') as StorageType;
  if (type === 'local' || type === 'supabase') return type;
  if (type === 'r2') {
    if (!r2Configured) throw new Error('STORAGE_TYPE is set to r2, but R2 credentials are incomplete.');
    return 'r2';
  }

  // Auto-detect based on environment
  // If VERCEL is defined or if we are in a serverless environment, default to supabase
  const isServerless = getEnv('VERCEL') || getEnv('VERCEL_ENV') || getEnv('AWS_LAMBDA_FUNCTION_NAME');

  if (isServerless && supabase) {
    return 'supabase';
  }

  return 'local';
}

/** Identify legacy objects from their persisted Supabase URL. */
export function getStorageTypeForUrl(url?: string | null): StorageType {
  if (url?.includes('.supabase.co/')) return 'supabase';
  return getStorageType();
}

/**
 * Ensure a directory exists, creating it if necessary
 */
export async function ensureDirectory(folderPath: string): Promise<void> {
  // Skip if not using local storage
  if (getStorageType() !== 'local') return;

  try {
    await fs.mkdir(folderPath, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      console.error(`Failed to create directory ${folderPath}:`, error);
      // Don't throw if we're in a deployment where we shouldn't be writing anyway
      // But if it's local development, we want to know
      if (getEnv('NODE_ENV') === 'development') {
        throw new Error(`Failed to create directory: ${error.message}`, { cause: error });
      }
    }
  }
}

/**
 * Get the full path for a folder (public or private) for local storage
 */
function getFolderPath(folder: string, isPrivate: boolean): string {
  const baseFolder = isPrivate ? 'private' : 'public';
  return join(uploadsBasePath, baseFolder, folder);
}

/**
 * Sanitize folder name to prevent path traversal attacks
 */
export function sanitizeFolderName(folder: string): string {
  return folder
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9\-_/]/g, '')
    .replace(/\/+/g, '/')
    .replace(/^\/|\/$/g, '');
}

/**
 * Generate a unique filename
 */
export function generateUniqueFileName(originalName: string): string {
  const fileExt = originalName.split('.').pop() || 'bin';
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomStr}.${fileExt}`;
}

/**
 * Save a file to storage (Local or Supabase)
 */
export async function saveFile(
  folder: string,
  file: File | Buffer,
  isPrivate: boolean,
  fileName?: string
): Promise<{ filePath: string; publicUrl: string; fullPath: string }> {
  const sanitizedFolder = sanitizeFolderName(folder || 'general');
  const finalFileName = fileName || generateUniqueFileName(
    file instanceof File ? file.name : 'upload.bin'
  );

  const storageType = getStorageType();
  const subFolder = isPrivate ? 'private' : 'public';
  const relativePath = `${subFolder}/${sanitizedFolder}/${finalFileName}`;
  const dbFilePath = `uploads/${relativePath}`;

  let buffer: Buffer;
  if (file instanceof File) {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else {
    buffer = file;
  }

  if (storageType === 'r2' && r2Configured) {
    await putR2Object(toR2Key(dbFilePath), buffer, file instanceof File ? file.type : 'application/octet-stream');
    return { filePath: dbFilePath, publicUrl: getFileUrl(dbFilePath, isPrivate), fullPath: toR2Key(dbFilePath) };
  }

  if (storageType === 'supabase' && supabase) {
    // Save to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(relativePath, buffer, {
        contentType: file instanceof File ? file.type : 'application/octet-stream',
        upsert: true
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(relativePath);

    return {
      filePath: dbFilePath,
      publicUrl: publicUrl,
      fullPath: data.path, // This is the path in Supabase
    };
  } else {
    // Save to Local Filesystem
    const folderPath = getFolderPath(sanitizedFolder, isPrivate);
    await ensureDirectory(folderPath);

    const fullPath = join(folderPath, finalFileName);
    await fs.writeFile(fullPath, buffer);

    const publicUrl = getFileUrl(dbFilePath, isPrivate);

    return {
      filePath: dbFilePath,
      publicUrl,
      fullPath,
    };
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(filePath: string, storageType: StorageType = getStorageType()): Promise<boolean> {

  try {
    if (storageType === 'r2' && r2Configured) {
      await deleteR2Object(toR2Key(filePath));
      return true;
    }

    if (storageType === 'supabase' && supabase) {
      // Remove 'uploads/' prefix to get the path in bucket
      const bucketPath = filePath.replace(/^uploads\//, '');
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([bucketPath]);

      if (error) throw error;
      return true;
    } else {
      // Local delete
      const normalizedPath = filePath.startsWith('public/')
        ? filePath
        : `public/${filePath}`;

      const fullPath = join(projectRoot, normalizedPath);
      await fs.access(fullPath);
      await fs.unlink(fullPath);
      return true;
    }
  } catch (error: any) {
    if (error.code === 'ENOENT' || error.message?.includes('not found')) {
      return true;
    }
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Get public URL for a file
 */
export function getFileUrl(filePath: string, isPrivate: boolean): string {
  const storageType = getStorageType();

  if (storageType === 'r2' && r2Configured) {
    const key = toR2Key(filePath);
    if (isPrivate || !R2_PUBLIC_URL) return `/api/uploads/${key}`;
    return `${R2_PUBLIC_URL}/${key.split('/').map(encodeURIComponent).join('/')}`;
  }

  if (storageType === 'supabase' && supabase) {
    const bucketPath = filePath.replace(/^uploads\//, '');
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(bucketPath);
    return publicUrl;
  }

  // Local storage logic
  if (isPrivate) {
    const apiPath = filePath.replace(/^uploads\//, '');
    return `/api/uploads/${apiPath}`;
  } else {
    return filePath.startsWith('/') ? filePath : `/${filePath}`;
  }
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string, storageType: StorageType = getStorageType()): Promise<boolean> {

  if (storageType === 'r2' && r2Configured) {
    try {
      await headR2Object(toR2Key(filePath));
      return true;
    } catch {
      return false;
    }
  }

  if (storageType === 'supabase' && supabase) {
    // This is expensive in Supabase, let's just assume it doesn't exist if we can't find it
    // Or just return true if we have a path
    return !!filePath;
  }

  try {
    const normalizedPath = filePath.startsWith('public/')
      ? filePath
      : `public/${filePath}`;

    const fullPath = join(projectRoot, normalizedPath);
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file statistics
 */
export async function getFileStats(filePath: string, storageType: StorageType = getStorageType()): Promise<{
  size: number;
  mimeType: string | null;
  exists: boolean;
}> {
  if (storageType === 'r2' && r2Configured) {
    try {
      const metadata = await headR2Object(toR2Key(filePath));
      return { size: metadata.ContentLength || 0, mimeType: metadata.ContentType || null, exists: true };
    } catch {
      return { size: 0, mimeType: null, exists: false };
    }
  }

  if (storageType === 'supabase' && supabase) {
    // For Supabase, we might not have easy access to stats without another API call
    return { size: 0, mimeType: null, exists: true };
  }

  try {
    const normalizedPath = filePath.startsWith('public/')
      ? filePath
      : `public/${filePath}`;
    const fullPath = join(projectRoot, normalizedPath);
    const stats = await fs.stat(fullPath);

    const ext = filePath.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
      webp: 'image/webp', mp4: 'video/mp4', mp3: 'audio/mpeg', pdf: 'application/pdf',
    };

    return {
      size: stats.size,
      mimeType: ext ? mimeTypes[ext] || null : null,
      exists: true,
    };
  } catch {
    return { size: 0, mimeType: null, exists: false };
  }
}

/**
 * Get the base uploads directory path
 */
export function getUploadsBasePath(): string {
  return uploadsBasePath;
}

/**
 * Read a file's content as a Buffer
 * @param relativePath - Path relative to uploads directory (e.g., "public/general/image.jpg")
 */
export async function readFile(relativePath: string, storageType: StorageType = getStorageType()): Promise<Buffer> {

  if (storageType === 'r2' && r2Configured) {
    try {
      return await getR2Object(toR2Key(relativePath));
    } catch (error) {
      // During the phased migration, private legacy objects may still be served
      // through this route while new objects are already stored in R2.
      if (!supabase) throw error;
      const { data, error: supabaseError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(relativePath);
      if (supabaseError) throw error;
      return Buffer.from(await data.arrayBuffer());
    }
  }

  if (storageType === 'supabase' && supabase) {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(relativePath);

    if (error) {
      throw new Error(`Supabase download failed: ${error.message}`);
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } else {
    const fullPath = join(uploadsBasePath, relativePath);
    return await fs.readFile(fullPath);
  }
}
