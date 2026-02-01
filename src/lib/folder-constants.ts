/**
 * Predefined folder names (client-safe)
 * This file contains only constants and can be safely imported in client components
 */

/**
 * List of predefined/system folder names that cannot be modified
 */
export const PREDEFINED_FOLDER_NAMES = [
  'general',
  'players',
  'teams',
  'news',
  'staff',
  'leagues',
  'matches',
] as const;

/**
 * Check if a folder name is a predefined/system folder
 */
export function isPredefinedFolderName(name: string): boolean {
  return PREDEFINED_FOLDER_NAMES.includes(name as any);
}
