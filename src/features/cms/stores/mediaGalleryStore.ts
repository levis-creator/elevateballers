import { create } from 'zustand';
import type { Media, MediaType, MediaWithFolderAndUploader } from '../types';

export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  result?: Media;
}

interface MediaGalleryState {
  // Media data
  mediaItems: MediaWithFolderAndUploader[];
  loading: boolean;
  error: string;
  successMessage: string;

  // Filters & search
  filterType: string;
  filterFeatured: 'all' | 'featured' | 'unfeatured';
  selectedFolderId: string | null;
  searchTerm: string;
  filterSizeMin: string;
  filterSizeMax: string;
  filterDateFrom: string;
  filterDateTo: string;
  filterUploader: string;
  quickFilter: 'all' | 'today' | 'thisWeek' | 'thisMonth';

  // View & selection
  viewMode: 'grid' | 'list';
  selectedItems: Set<string>;
  lastSelectedIndex: number | null;
  previewMedia: MediaWithFolderAndUploader | null;

  // Upload queue
  uploadQueue: UploadFile[];
  uploadQueuePaused: Set<string>;

  // Dialogs
  moveDialogOpen: boolean;
  renameDialogOpen: boolean;
  renameMediaId: string | null;
  renameMediaTitle: string;
  advancedFiltersOpen: boolean;
  bulkRenameDialogOpen: boolean;
  bulkTagDialogOpen: boolean;

  // Clipboard
  clipboardItems: Set<string>;
  clipboardMode: 'copy' | 'cut' | null;

  // Sorting
  sortField: 'title' | 'type' | 'size' | 'createdAt';
  sortDirection: 'asc' | 'desc';

  // Drag & drop
  isDragging: boolean;
  draggedItemId: string | null;
  dragOverFolderId: string | null;

  // Actions
  setMediaItems: (items: MediaWithFolderAndUploader[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setSuccessMessage: (message: string) => void;
  setFilterType: (type: string) => void;
  setFilterFeatured: (filter: 'all' | 'featured' | 'unfeatured') => void;
  setSelectedFolderId: (id: string | null) => void;
  setSearchTerm: (term: string) => void;
  setFilterSizeMin: (min: string) => void;
  setFilterSizeMax: (max: string) => void;
  setFilterDateFrom: (from: string) => void;
  setFilterDateTo: (to: string) => void;
  setFilterUploader: (uploader: string) => void;
  setQuickFilter: (filter: 'all' | 'today' | 'thisWeek' | 'thisMonth') => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSelectedItems: (items: Set<string>) => void;
  addSelectedItem: (id: string) => void;
  removeSelectedItem: (id: string) => void;
  clearSelectedItems: () => void;
  setLastSelectedIndex: (index: number | null) => void;
  setPreviewMedia: (media: MediaWithFolderAndUploader | null) => void;
  addUploadQueueItem: (item: UploadFile) => void;
  updateUploadQueueItem: (id: string, updates: Partial<UploadFile>) => void;
  removeUploadQueueItem: (id: string) => void;
  clearUploadQueue: () => void;
  pauseUpload: (id: string) => void;
  resumeUpload: (id: string) => void;
  setMoveDialogOpen: (open: boolean) => void;
  setRenameDialogOpen: (open: boolean) => void;
  setRenameMediaId: (id: string | null) => void;
  setRenameMediaTitle: (title: string) => void;
  setAdvancedFiltersOpen: (open: boolean) => void;
  setBulkRenameDialogOpen: (open: boolean) => void;
  setBulkTagDialogOpen: (open: boolean) => void;
  setClipboardItems: (items: Set<string>) => void;
  setClipboardMode: (mode: 'copy' | 'cut' | null) => void;
  setSortField: (field: 'title' | 'type' | 'size' | 'createdAt' | 'featured') => void;
  setSortDirection: (direction: 'asc' | 'desc') => void;
  setIsDragging: (dragging: boolean) => void;
  setDraggedItemId: (id: string | null) => void;
  setDragOverFolderId: (id: string | null) => void;
  clearFilters: () => void;
}

export const useMediaGalleryStore = create<MediaGalleryState>((set) => ({
  // Initial state
  mediaItems: [],
  loading: true,
  error: '',
  successMessage: '',
  filterType: 'all',
  filterFeatured: 'all',
  selectedFolderId: null,
  searchTerm: '',
  filterSizeMin: '',
  filterSizeMax: '',
  filterDateFrom: '',
  filterDateTo: '',
  filterUploader: '',
  quickFilter: 'all',
  viewMode: 'grid',
  selectedItems: new Set(),
  lastSelectedIndex: null,
  previewMedia: null,
  uploadQueue: [],
  uploadQueuePaused: new Set(),
  moveDialogOpen: false,
  renameDialogOpen: false,
  renameMediaId: null,
  renameMediaTitle: '',
  advancedFiltersOpen: false,
  bulkRenameDialogOpen: false,
  bulkTagDialogOpen: false,
  clipboardItems: new Set(),
  clipboardMode: null,
  sortField: 'createdAt',
  sortDirection: 'desc',
  isDragging: false,
  draggedItemId: null,
  dragOverFolderId: null,

  // Actions
  setMediaItems: (items) => set({ mediaItems: items }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSuccessMessage: (message) => set({ successMessage: message }),
  setFilterType: (type) => set({ filterType: type }),
  setFilterFeatured: (filter) => set({ filterFeatured: filter }),
  setSelectedFolderId: (id) => set({ selectedFolderId: id }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setFilterSizeMin: (min) => set({ filterSizeMin: min }),
  setFilterSizeMax: (max) => set({ filterSizeMax: max }),
  setFilterDateFrom: (from) => set({ filterDateFrom: from }),
  setFilterDateTo: (to) => set({ filterDateTo: to }),
  setFilterUploader: (uploader) => set({ filterUploader: uploader }),
  setQuickFilter: (filter) => set({ quickFilter: filter }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedItems: (items) => set({ selectedItems: items }),
  addSelectedItem: (id) =>
    set((state) => {
      const newSet = new Set(state.selectedItems);
      newSet.add(id);
      return { selectedItems: newSet };
    }),
  removeSelectedItem: (id) =>
    set((state) => {
      const newSet = new Set(state.selectedItems);
      newSet.delete(id);
      return { selectedItems: newSet };
    }),
  clearSelectedItems: () => set({ selectedItems: new Set() }),
  setLastSelectedIndex: (index) => set({ lastSelectedIndex: index }),
  setPreviewMedia: (media) => set({ previewMedia: media }),
  addUploadQueueItem: (item) =>
    set((state) => ({
      uploadQueue: [...state.uploadQueue, item],
    })),
  updateUploadQueueItem: (id, updates) =>
    set((state) => ({
      uploadQueue: state.uploadQueue.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),
  removeUploadQueueItem: (id) =>
    set((state) => ({
      uploadQueue: state.uploadQueue.filter((item) => item.id !== id),
      uploadQueuePaused: new Set(
        Array.from(state.uploadQueuePaused).filter((pausedId) => pausedId !== id)
      ),
    })),
  clearUploadQueue: () =>
    set({ uploadQueue: [], uploadQueuePaused: new Set() }),
  pauseUpload: (id) =>
    set((state) => {
      const newSet = new Set(state.uploadQueuePaused);
      newSet.add(id);
      return { uploadQueuePaused: newSet };
    }),
  resumeUpload: (id) =>
    set((state) => {
      const newSet = new Set(state.uploadQueuePaused);
      newSet.delete(id);
      return { uploadQueuePaused: newSet };
    }),
  setMoveDialogOpen: (open) => set({ moveDialogOpen: open }),
  setRenameDialogOpen: (open) => set({ renameDialogOpen: open }),
  setRenameMediaId: (id) => set({ renameMediaId: id }),
  setRenameMediaTitle: (title) => set({ renameMediaTitle: title }),
  setAdvancedFiltersOpen: (open) => set({ advancedFiltersOpen: open }),
  setBulkRenameDialogOpen: (open) => set({ bulkRenameDialogOpen: open }),
  setBulkTagDialogOpen: (open) => set({ bulkTagDialogOpen: open }),
  setClipboardItems: (items) => set({ clipboardItems: items }),
  setClipboardMode: (mode) => set({ clipboardMode: mode }),
  setSortField: (field) => set({ sortField: field }),
  setSortDirection: (direction) => set({ sortDirection: direction }),
  setIsDragging: (dragging) => set({ isDragging: dragging }),
  setDraggedItemId: (id) => set({ draggedItemId: id }),
  setDragOverFolderId: (id) => set({ dragOverFolderId: id }),
  clearFilters: () =>
    set({
      filterSizeMin: '',
      filterSizeMax: '',
      filterDateFrom: '',
      filterDateTo: '',
      filterUploader: '',
    }),
}));
