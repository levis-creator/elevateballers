/**
 * Folder Access Control Utility
 * Handles folder privacy and access control
 */

import { prisma } from './prisma';
import type { User } from '../features/cms/types';

/**
 * Check if a folder is private
 * @param folderPath - Folder path (e.g., "public/general" or "private/admin-only")
 */
export async function isFolderPrivate(folderPath: string): Promise<boolean> {
  try {
    // Extract folder name from path (e.g., "public/general" -> "general")
    const folderName = folderPath.split('/').pop() || folderPath;
    
    const folder = await prisma.folder.findUnique({
      where: { name: folderName },
      select: { isPrivate: true },
    });
    
    return folder?.isPrivate ?? false;
  } catch (error) {
    console.error('Error checking folder privacy:', error);
    // Default to private if we can't determine (fail secure)
    return true;
  }
}

/**
 * Check if a folder is private by folder ID
 */
export async function isFolderPrivateById(folderId: string): Promise<boolean> {
  try {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      select: { isPrivate: true },
    });
    
    return folder?.isPrivate ?? false;
  } catch (error) {
    console.error('Error checking folder privacy by ID:', error);
    return true;
  }
}

/**
 * Check if user can access a folder
 * @param folderPath - Folder path
 * @param user - Current user (null for anonymous)
 */
export async function checkFolderAccess(
  folderPath: string,
  user: User | null
): Promise<boolean> {
  const isPrivate = await isFolderPrivate(folderPath);
  
  // Public folders are accessible to everyone
  if (!isPrivate) {
    return true;
  }
  
  // Private folders require authentication
  if (!user) {
    return false;
  }
  
  // Admin and Editor roles can access private folders
  return user.role === 'ADMIN' || user.role === 'EDITOR';
}

/**
 * Check if user can access a folder by folder ID
 */
export async function canUserAccessFolder(
  folderId: string,
  user: User | null
): Promise<boolean> {
  const isPrivate = await isFolderPrivateById(folderId);
  
  if (!isPrivate) {
    return true;
  }
  
  if (!user) {
    return false;
  }
  
  return user.role === 'ADMIN' || user.role === 'EDITOR';
}

/**
 * Get folder by name
 */
export async function getFolderByName(name: string) {
  try {
    return await prisma.folder.findUnique({
      where: { name },
    });
  } catch (error) {
    console.error('Error getting folder by name:', error);
    return null;
  }
}

/**
 * Get folder by path
 */
export async function getFolderByPath(path: string) {
  try {
    return await prisma.folder.findUnique({
      where: { path },
    });
  } catch (error) {
    console.error('Error getting folder by path:', error);
    return null;
  }
}
