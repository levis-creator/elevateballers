export * from './domain/entities/index';

import type { FileUsage, Folder, Media, User } from '@prisma/client';

export type { FileUsage, Folder, Media, User };

export type MediaWithFolderAndUploader = Media & {
  folder: Pick<Folder, 'id' | 'name' | 'isPrivate'> | null;
  uploader: Pick<User, 'id' | 'name' | 'email'> | null;
};

export type MediaWithFolder = Media & {
  folder: Pick<Folder, 'id' | 'name' | 'isPrivate'> | null;
};

export type MediaWithFolderAndUsage = MediaWithFolderAndUploader & {
  fileUsages: FileUsage[];
};
