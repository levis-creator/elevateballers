/**
 * File Storage Utility
 * Handles file operations for local storage system
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get project root directory (go up from src/lib)
const projectRoot = join(__dirname, '../..');
const uploadsBasePath = join(projectRoot, 'public', 'uploads');

/**
 * Ensure a directory exists, creating it if necessary
 */
export async function ensureDirectory(folderPath: string): Promise<void> {
  try {
    await fs.mkdir(folderPath, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw new Error(`Failed to create directory: ${error.message}`);
    }
  }
}

/**
 * Get the full path for a folder (public or private)
 */
function getFolderPath(folder: string, isPrivate: boolean): string {
  const baseFolder = isPrivate ? 'private' : 'public';
  return join(uploadsBasePath, baseFolder, folder);
}

/**
 * Sanitize folder name to prevent path traversal attacks
 */
export function sanitizeFolderName(folder: string): string {
  // Remove any path traversal attempts
  return folder
    .replace(/\.\./g, '') // Remove ..
    .replace(/[^a-zA-Z0-9\-_/]/g, '') // Only allow alphanumeric, hyphens, underscores, and forward slashes
    .replace(/\/+/g, '/') // Replace multiple slashes with single
    .replace(/^\/|\/$/g, ''); // Remove leading/trailing slashes
}

/**
 * Generate a unique filename with timestamp and random string
 */
export function generateUniqueFileName(originalName: string): string {
  const fileExt = originalName.split('.').pop() || 'bin';
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomStr}.${fileExt}`;
}

/**
 * Save a file to local storage
 * @param folder - Folder name (e.g., "general", "players")
 * @param file - File object or Buffer
 * @param isPrivate - Whether the folder is private
 * @param fileName - Optional custom filename (defaults to generated unique name)
 * @returns Object with filePath and publicUrl
 */
export async function saveFile(
  folder: string,
  file: File | Buffer,
  isPrivate: boolean,
  fileName?: string
): Promise<{ filePath: string; publicUrl: string; fullPath: string }> {
  // Sanitize folder name
  const sanitizedFolder = sanitizeFolderName(folder || 'general');
  
  // Get folder path
  const folderPath = getFolderPath(sanitizedFolder, isPrivate);
  
  // Ensure directory exists
  await ensureDirectory(folderPath);
  
  // Generate filename if not provided
  const finalFileName = fileName || generateUniqueFileName(
    file instanceof File ? file.name : 'upload.bin'
  );
  
  // Full path to save file
  const fullPath = join(folderPath, finalFileName);
  
  // Convert File to Buffer if needed
  let buffer: Buffer;
  if (file instanceof File) {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else {
    buffer = file;
  }
  
  // Write file to disk
  await fs.writeFile(fullPath, buffer);
  
  // Generate relative file path (for database storage)
  const relativePath = `uploads/${isPrivate ? 'private' : 'public'}/${sanitizedFolder}/${finalFileName}`;
  
  // Generate public URL
  const publicUrl = getFileUrl(relativePath, isPrivate);
  
  return {
    filePath: relativePath,
    publicUrl,
    fullPath,
  };
}

/**
 * Delete a file from disk
 * @param filePath - Relative file path (e.g., "uploads/public/general/image.jpg")
 * The filePath format from database is "uploads/public/..." or "uploads/private/..."
 * But actual files are stored at "public/uploads/public/..." or "public/uploads/private/..."
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    // The filePath from database is "uploads/public/..." or "uploads/private/..."
    // But files are stored at "public/uploads/public/..." or "public/uploads/private/..."
    // So we need to prepend "public/" to the path
    const normalizedPath = filePath.startsWith('public/') 
      ? filePath 
      : `public/${filePath}`;
    
    // Construct full path
    const fullPath = join(projectRoot, normalizedPath);
    
    // Check if file exists
    await fs.access(fullPath);
    
    // Delete file
    await fs.unlink(fullPath);
    
    return true;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, consider it already deleted
      return true;
    }
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Get public URL for a file
 * @param filePath - Relative file path
 * @param isPrivate - Whether the file is in a private folder
 */
export function getFileUrl(filePath: string, isPrivate: boolean): string {
  if (isPrivate) {
    // Private files are served via API
    // Remove 'uploads/' prefix and convert to API path
    const apiPath = filePath.replace(/^uploads\//, '');
    return `/api/uploads/${apiPath}`;
  } else {
    // Public files are served directly
    // Ensure leading slash
    return filePath.startsWith('/') ? filePath : `/${filePath}`;
  }
}

/**
 * Check if a file exists
 * @param filePath - Relative file path (e.g., "uploads/public/general/image.jpg")
 * The filePath format from database is "uploads/public/..." or "uploads/private/..."
 * But actual files are stored at "public/uploads/public/..." or "public/uploads/private/..."
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    // The filePath from database is "uploads/public/..." or "uploads/private/..."
    // But files are stored at "public/uploads/public/..." or "public/uploads/private/..."
    // So we need to prepend "public/" to the path
    const normalizedPath = filePath.startsWith('public/') 
      ? filePath 
      : `public/${filePath}`;
    
    // Construct full path
    const fullPath = join(projectRoot, normalizedPath);
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file statistics (size, mime type)
 */
export async function getFileStats(filePath: string): Promise<{
  size: number;
  mimeType: string | null;
  exists: boolean;
}> {
  try {
    const fullPath = join(projectRoot, filePath);
    const stats = await fs.stat(fullPath);
    
    // Try to determine mime type from extension
    const ext = filePath.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      mp4: 'video/mp4',
      mp3: 'audio/mpeg',
      pdf: 'application/pdf',
    };
    
    return {
      size: stats.size,
      mimeType: ext ? mimeTypes[ext] || null : null,
      exists: true,
    };
  } catch {
    return {
      size: 0,
      mimeType: null,
      exists: false,
    };
  }
}

/**
 * Get the base uploads directory path
 */
export function getUploadsBasePath(): string {
  return uploadsBasePath;
}
