/**
 * Initialize default/predefined folders
 * Ensures common folders exist in the database AND on the filesystem
 */

import { prisma } from './prisma';
import { sanitizeFolderName, ensureDirectory, getUploadsBasePath, getStorageType } from './file-storage';
import { join } from 'path';
import { PREDEFINED_FOLDER_NAMES } from './folder-constants';

export interface DefaultFolder {
  name: string;
  description: string;
  isPrivate: boolean;
}

/**
 * Default folders that should always exist
 */
export const DEFAULT_FOLDERS: DefaultFolder[] = [
  {
    name: 'general',
    description: 'General media files',
    isPrivate: false,
  },
  {
    name: 'players',
    description: 'Player photos and images',
    isPrivate: false,
  },
  {
    name: 'teams',
    description: 'Team logos and images',
    isPrivate: false,
  },
  {
    name: 'news',
    description: 'News article images',
    isPrivate: false,
  },
  {
    name: 'staff',
    description: 'Staff member photos',
    isPrivate: false,
  },
  {
    name: 'leagues',
    description: 'League logos and images',
    isPrivate: false,
  },
  {
    name: 'matches',
    description: 'Match photos and media',
    isPrivate: false,
  },
];

/**
 * Initialize default folders if they don't exist
 * This function is idempotent - safe to call multiple times
 */
export async function initializeDefaultFolders(): Promise<void> {
  const storageType = getStorageType();

  try {
    // Only handle filesystem initialization if using local storage
    if (storageType === 'local') {
      await ensureDirectory(getUploadsBasePath());
      await ensureDirectory(join(getUploadsBasePath(), 'public'));
      await ensureDirectory(join(getUploadsBasePath(), 'private'));
    }

    for (const folderData of DEFAULT_FOLDERS) {
      const sanitizedName = sanitizeFolderName(folderData.name);
      const path = `${folderData.isPrivate ? 'private' : 'public'}/${sanitizedName}`;

      // Create physical directory on filesystem if local
      if (storageType === 'local') {
        const physicalFolderPath = join(
          getUploadsBasePath(),
          folderData.isPrivate ? 'private' : 'public',
          sanitizedName
        );
        await ensureDirectory(physicalFolderPath);
      }

      // Check if folder exists in database
      const existing = await prisma.folder.findUnique({
        where: { name: sanitizedName },
      });

      if (!existing) {
        // Create folder in database if it doesn't exist
        await prisma.folder.create({
          data: {
            name: sanitizedName,
            path,
            description: folderData.description,
            isPrivate: folderData.isPrivate,
            createdBy: null, // System-created folders
          },
        });
        console.log(`Created default folder in database: ${sanitizedName}`);
      }
    }
  } catch (error) {
    console.error('Error initializing default folders:', error);
    // Don't throw - allow the application to continue even if folder init fails
  }
}

/**
 * Check if a folder name is a predefined/system folder
 * This is a client-safe version that doesn't import Prisma
 */
export function isPredefinedFolder(name: string): boolean {
  return PREDEFINED_FOLDER_NAMES.includes(name as any);
}
