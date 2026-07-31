export type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';

export interface MediaFolderSummary {
  id: string;
  name: string;
  isPrivate: boolean;
}

export interface MediaUploaderSummary {
  id: string;
  name: string;
  email: string;
}

export interface MediaEntity {
  id: string;
  title: string;
  url: string;
  type: MediaType;
  thumbnail: string | null;
  tags: string[];
  size: number | null;
  filePath: string | null;
  folderId: string | null;
  uploaderId: string | null;
  createdAt: Date;
  updatedAt: Date;
  featured: boolean;
  isPrivate: boolean;
  folder: MediaFolderSummary | null;
  uploader: MediaUploaderSummary | null;
}

export type CreateMediaInput = {
  title: string;
  url: string;
  type: MediaType;
  thumbnail?: string;
  tags?: string[];
  folderId?: string;
  featured?: boolean;
};

export type UpdateMediaInput = Partial<CreateMediaInput>;

export type MediaStorage = 'r2' | 'supabase';

export interface MediaLibraryRow extends MediaEntity {
  fileName: string;
  thumbUrl: string | null;
  mime: string | null;
  originalSize: number | null;
  folderName: string | null;
  folderPrivate: boolean;
  uploaderName: string | null;
  storage: MediaStorage;
  dimensions?: string;
}

export interface MediaLibraryQuery {
  type?: MediaType;
  folderId?: string;
  storage?: MediaStorage;
  q?: string;
  sort?: 'createdAt' | 'name' | 'size' | 'type';
  dir?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface MediaLibraryResult {
  items: MediaLibraryRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MediaStats {
  count: number;
  bytes: number;
  legacyCount: number;
  untagged: number;
}
