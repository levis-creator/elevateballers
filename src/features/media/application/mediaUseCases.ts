import { createMedia, getMediaById, listFeaturedMedia, listMedia, listMediaPage, getMediaStats, updateMedia } from '../data/datasources/mediaRepository';
import type { CreateMediaInput, MediaEntity, MediaLibraryQuery, MediaLibraryResult, MediaStats, MediaType, UpdateMediaInput } from '../domain/entities';

export function getPublicFeaturedMedia(limit?: number): Promise<MediaEntity[]> {
  return listFeaturedMedia(limit);
}

export function getMediaLibrary(options: { type?: MediaType; folderId?: string } = {}): Promise<MediaEntity[]> {
  return listMedia(options);
}

export function getMediaLibraryPage(options: MediaLibraryQuery = {}): Promise<MediaLibraryResult> {
  return listMediaPage(options);
}

export function getMediaLibraryStats(options: Pick<MediaLibraryQuery, 'folderId' | 'type' | 'storage' | 'q'> = {}): Promise<MediaStats> {
  return getMediaStats(options);
}

export function getMediaItem(id: string): Promise<MediaEntity | null> {
  return getMediaById(id);
}

export function createMediaItem(input: CreateMediaInput): Promise<MediaEntity> {
  return createMedia(input);
}

export function updateMediaItem(id: string, input: UpdateMediaInput): Promise<MediaEntity | null> {
  return updateMedia(id, input);
}
