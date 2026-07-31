/** Canonical storage folders used by feature-specific uploads. */
export const MEDIA_FOLDERS = {
  players: 'players',
  teams: 'teams',
  news: 'news',
  staff: 'staff',
  leagues: 'leagues',
  matches: 'matches',
  documents: 'documents',
  general: 'general',
} as const;

export type MediaFolderKey = keyof typeof MEDIA_FOLDERS;
