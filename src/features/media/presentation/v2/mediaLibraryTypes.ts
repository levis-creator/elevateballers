import type { MediaLibraryRow, MediaStats } from '../../domain/entities';

export interface MediaFolderRow {
  id: string;
  name: string;
  path: string;
  isPrivate: boolean;
  description?: string | null;
  _count?: { media: number };
}

export interface MediaPageResponse {
  items: MediaLibraryRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type { MediaLibraryRow, MediaStats };
