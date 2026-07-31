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

