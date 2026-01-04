import type { MediaItem } from '../types';

/**
 * Media items data for MediaGallery component
 */
export const allMediaItems: MediaItem[] = [
  {
    id: 1038,
    type: 'image',
    title: 'cheerleader',
    url: 'https://elevateballers.com/wp-content/uploads/2016/04/IMG_2739-scaled.jpg',
    thumbnail: 'images/IMG_2739-360x495.jpg',
    thumbnailAlt: 'cheerleader',
    fancyboxGroup: 'stm_photos',
  },
  {
    id: 1037,
    type: 'image',
    title: 'Tasur or Ghost, who ya got to win it all?',
    url: 'https://elevateballers.com/wp-content/uploads/2024/01/IMG_6493-2-scaled.jpg',
    thumbnail: 'images/IMG_6493-2-735x240.jpg',
    thumbnailAlt: 'Tasur or Ghost, who ya got to win it all?',
    fancyboxGroup: 'stm_photos',
  },
  {
    id: 1036,
    type: 'image',
    title: 'Jordo and gang',
    url: 'https://elevateballers.com/wp-content/uploads/2024/01/IMG_6596-scaled.jpg',
    thumbnail: 'images/IMG_6596-360x240.jpg',
    thumbnailAlt: 'Jordo and gang',
    fancyboxGroup: 'stm_photos',
  },
  {
    id: 360,
    type: 'image',
    title: 'Fan Corner',
    url: 'https://elevateballers.com/wp-content/uploads/2016/06/IMG_2927-scaled.jpg',
    thumbnail: 'images/IMG_2927-360x495.jpg',
    thumbnailAlt: 'Fan Corner',
    fancyboxGroup: 'stm_photos',
  },
  {
    id: 1034,
    type: 'image',
    title: 'Father TJ awards Stingers',
    url: 'https://elevateballers.com/wp-content/uploads/2016/06/IMG_3681-scaled.jpg',
    thumbnail: 'images/IMG_3681-360x240.jpg',
    thumbnailAlt: 'Father TJ awards Stingers',
    fancyboxGroup: 'stm_photos',
  },
  {
    id: 353,
    type: 'audio',
    title: 'Stingers champion',
    url: 'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/242120896&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=true',
    thumbnail: 'images/IMG_3730-360x240.jpg',
    thumbnailAlt: 'Stingers champion',
    fancyboxGroup: 'stm_audio',
  },
  {
    id: 352,
    type: 'image',
    title: 'DB Nets media day',
    url: 'https://elevateballers.com/wp-content/uploads/2016/04/519A0025-scaled.jpg',
    thumbnail: 'images/519A0025-360x240.jpg',
    thumbnailAlt: 'DB Nets media day',
    fancyboxGroup: 'stm_photos',
  },
];

/**
 * Filter media items by type
 */
export function filterMediaByType(items: MediaItem[], type: string): MediaItem[] {
  if (type === 'all_medias') {
    return items;
  }
  const typeMap: Record<string, MediaItem['type']> = {
    image_media: 'image',
    audio_media: 'audio',
    video_media: 'video',
  };
  const mediaType = typeMap[type] || 'image';
  return items.filter((item) => item.type === mediaType);
}

