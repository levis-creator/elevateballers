/**
 * Media feature types
 */

export type LegacyMediaType = 'image' | 'audio' | 'video';

export type MediaFilter = 'all_medias' | 'image_media' | 'audio_media' | 'video_media';

export interface MediaItem {
  id: number;
  type: LegacyMediaType;
  title: string;
  url: string;
  thumbnail: string;
  thumbnailAlt?: string;
  fancyboxGroup?: string;
}

export * from './media';
export * from './mediaFolders';
