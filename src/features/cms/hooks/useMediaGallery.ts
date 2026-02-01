import { useCallback, useMemo } from 'react';
import { useMediaGalleryStore } from '../stores/mediaGalleryStore';
import type { MediaWithFolderAndUploader } from '../types';

// Helper function to check if tags is a string array
const isStringArray = (value: any): value is string[] => {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
};

export function useMediaGallery() {
  const {
    mediaItems,
    filterType,
    filterFeatured,
    selectedFolderId,
    searchTerm,
    filterSizeMin,
    filterSizeMax,
    filterDateFrom,
    filterDateTo,
    filterUploader,
    sortField,
    sortDirection,
    quickFilter,
  } = useMediaGalleryStore();

  const fetchMedia = useCallback(async () => {
    const { setMediaItems, setLoading, setError } = useMediaGalleryStore.getState();
    try {
      setLoading(true);
      const params = new URLSearchParams();
      const type = filterType === 'all' ? undefined : filterType.toUpperCase();
      if (type) params.append('type', type);
      if (selectedFolderId) params.append('folderId', selectedFolderId);

      const response = await fetch(`/api/media${params.toString() ? `?${params.toString()}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch media');
      const data = await response.json();

      // Aggressive deduplication by ID, filePath, and URL
      const seenIds = new Set<string>();
      const seenFilePaths = new Set<string>();
      const seenUrls = new Set<string>();
      const uniqueMedia: MediaWithFolderAndUploader[] = [];

      for (const item of data) {
        if (seenIds.has(item.id)) {
          console.warn(`[FRONTEND DEDUP] Skipping duplicate ID: ${item.id} (${item.title})`);
          continue;
        }
        if (item.filePath && seenFilePaths.has(item.filePath.toLowerCase().trim())) {
          console.warn(`[FRONTEND DEDUP] Skipping duplicate filePath: ${item.id} (${item.title}) - ${item.filePath}`);
          continue;
        }
        if (item.url && seenUrls.has(item.url.toLowerCase().trim())) {
          console.warn(`[FRONTEND DEDUP] Skipping duplicate URL: ${item.id} (${item.title}) - ${item.url}`);
          continue;
        }

        seenIds.add(item.id);
        if (item.filePath) seenFilePaths.add(item.filePath.toLowerCase().trim());
        if (item.url) seenUrls.add(item.url.toLowerCase().trim());
        uniqueMedia.push(item);
      }

      console.log(`[FRONTEND] Received ${data.length} items, deduplicated to ${uniqueMedia.length} unique items`);
      setMediaItems(uniqueMedia);
    } catch (err: any) {
      setError(err.message || 'Failed to load media');
    } finally {
      setLoading(false);
    }
  }, [filterType, selectedFolderId]);

  const filteredMedia = useMemo(() => {
    let filtered = mediaItems.filter((item) => {
      // Search filter
      const titleMatch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
      const tags = item.tags && isStringArray(item.tags) ? item.tags : null;
      const tagsMatch = tags
        ? tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        : false;
      if (!titleMatch && !tagsMatch && searchTerm) return false;

      // Type filter
      if (filterType !== 'all') {
        const typeMap: Record<string, string> = { image: 'IMAGE', video: 'VIDEO', audio: 'AUDIO' };
        if (item.type !== typeMap[filterType]) return false;
      }

      // Folder filter
      if (selectedFolderId) {
        if (item.folder?.id !== selectedFolderId) return false;
      }

      // Size filter
      if (filterSizeMin || filterSizeMax) {
        const size = item.size || 0;
        const minBytes = filterSizeMin
          ? parseFloat(filterSizeMin) *
            (filterSizeMin.includes('MB') ? 1024 * 1024 : filterSizeMin.includes('KB') ? 1024 : 1)
          : 0;
        const maxBytes = filterSizeMax
          ? parseFloat(filterSizeMax) *
            (filterSizeMax.includes('MB') ? 1024 * 1024 : filterSizeMax.includes('KB') ? 1024 : 1)
          : Infinity;
        if (size < minBytes || size > maxBytes) return false;
      }

      // Date filter
      if (filterDateFrom || filterDateTo) {
        const uploadDate = new Date(item.createdAt);
        if (filterDateFrom && uploadDate < new Date(filterDateFrom)) return false;
        if (filterDateTo && uploadDate > new Date(filterDateTo + 'T23:59:59')) return false;
      }

      // Uploader filter
      if (filterUploader && item.uploader?.email) {
        if (!item.uploader.email.toLowerCase().includes(filterUploader.toLowerCase())) return false;
      }

      // Quick filter (date-based)
      if (quickFilter !== 'all') {
        const uploadDate = new Date(item.createdAt);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisWeek = new Date(today);
        thisWeek.setDate(today.getDate() - 7);
        const thisMonth = new Date(today);
        thisMonth.setMonth(today.getMonth() - 1);

        if (quickFilter === 'today' && uploadDate < today) return false;
        if (quickFilter === 'thisWeek' && uploadDate < thisWeek) return false;
        if (quickFilter === 'thisMonth' && uploadDate < thisMonth) return false;
      }

      // Featured filter
      if (filterFeatured !== 'all') {
        const isFeatured = item.featured ?? false;
        if (filterFeatured === 'featured' && !isFeatured) return false;
        if (filterFeatured === 'unfeatured' && isFeatured) return false;
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'size':
          aValue = a.size || 0;
          bValue = b.size || 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'featured':
          aValue = a.featured ? 1 : 0;
          bValue = b.featured ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    mediaItems,
    searchTerm,
    filterType,
    filterFeatured,
    selectedFolderId,
    filterSizeMin,
    filterSizeMax,
    filterDateFrom,
    filterDateTo,
    filterUploader,
    quickFilter,
    sortField,
    sortDirection,
  ]);

  return {
    fetchMedia,
    filteredMedia,
  };
}
