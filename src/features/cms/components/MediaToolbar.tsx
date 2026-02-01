import { useState, useEffect, useMemo, type ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useMediaGalleryStore } from '../stores/mediaGalleryStore';

interface MediaToolbarProps {
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function MediaToolbar({ searchInputRef }: MediaToolbarProps) {
  const [icons, setIcons] = useState<{
    Search?: ComponentType<any>;
    List?: ComponentType<any>;
    Grid?: ComponentType<any>;
    Image?: ComponentType<any>;
    Video?: ComponentType<any>;
    Music?: ComponentType<any>;
    Filter?: ComponentType<any>;
    Star?: ComponentType<any>;
  }>({});

  const {
    searchTerm,
    filterType,
    filterFeatured,
    viewMode,
    quickFilter,
    advancedFiltersOpen,
    mediaItems,
    setSearchTerm,
    setFilterType,
    setFilterFeatured,
    setViewMode,
    setQuickFilter,
    setAdvancedFiltersOpen,
  } = useMediaGalleryStore();

  // Calculate featured count
  const featuredCount = useMemo(() => {
    return mediaItems.filter((item) => item.featured === true).length;
  }, [mediaItems]);

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        Search: mod.Search,
        List: mod.List,
        Grid: mod.Grid,
        Image: mod.Image,
        Video: mod.Video,
        Music: mod.Music,
        Filter: mod.Filter,
        Star: mod.Star,
      });
    });
  }, []);

  const SearchIcon = icons.Search;
  const ListIcon = icons.List;
  const GridIcon = icons.Grid;
  const ImageIcon = icons.Image;
  const VideoIcon = icons.Video;
  const MusicIcon = icons.Music;
  const FilterIcon = icons.Filter;
  const StarIcon = icons.Star;

  return (
    <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center" role="toolbar" aria-label="Media filters and view controls">
      <div className="relative flex-1">
        <label htmlFor="media-search" className="sr-only">Search media</label>
        {SearchIcon && (
          <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          ref={searchInputRef}
          id="media-search"
          type="text"
          placeholder="Search media... (Ctrl+F)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={SearchIcon ? "pl-10" : ""}
          aria-label="Search media by title or tags"
        />
      </div>
      <div className="flex gap-2 items-center">
        <div className="flex gap-2 bg-background p-1 rounded-lg border">
          <Button
            variant={filterType === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('all')}
            aria-label="Show all media"
            aria-pressed={filterType === 'all'}
          >
            All
          </Button>
          <Button
            variant={filterType === 'image' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('image')}
            aria-label="Filter images"
            aria-pressed={filterType === 'image'}
          >
            {ImageIcon ? <ImageIcon size={16} className="mr-2" /> : null}
            Images
          </Button>
          <Button
            variant={filterType === 'video' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('video')}
            aria-label="Filter videos"
            aria-pressed={filterType === 'video'}
          >
            {VideoIcon ? <VideoIcon size={16} className="mr-2" /> : null}
            Videos
          </Button>
          <Button
            variant={filterType === 'audio' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('audio')}
            aria-label="Filter audio"
            aria-pressed={filterType === 'audio'}
          >
            {MusicIcon ? <MusicIcon size={16} className="mr-2" /> : null}
            Audio
          </Button>
        </div>
        <div className="flex gap-1 bg-background p-1 rounded-lg border">
          <Button
            variant={filterFeatured === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterFeatured('all')}
            title="All media"
            aria-label="Show all media"
            aria-pressed={filterFeatured === 'all'}
          >
            All
          </Button>
          <Button
            variant={filterFeatured === 'featured' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterFeatured('featured')}
            title="Featured only"
            aria-label="Show featured media"
            aria-pressed={filterFeatured === 'featured'}
          >
            {StarIcon ? <StarIcon size={16} className="mr-2" /> : null}
            Featured
            {featuredCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 text-xs">
                {featuredCount}
              </Badge>
            )}
          </Button>
        </div>
        <Button
          variant={advancedFiltersOpen ? 'default' : 'outline'}
          size="sm"
          onClick={() => setAdvancedFiltersOpen(!advancedFiltersOpen)}
          title="Advanced Filters"
        >
          {FilterIcon && <FilterIcon size={16} className="mr-2" />}
          Filters
        </Button>
        <div className="flex gap-1 bg-background p-1 rounded-lg border">
          <Button
            variant={quickFilter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setQuickFilter('all')}
            title="All time"
          >
            All
          </Button>
          <Button
            variant={quickFilter === 'today' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setQuickFilter('today')}
            title="Today"
          >
            Today
          </Button>
          <Button
            variant={quickFilter === 'thisWeek' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setQuickFilter('thisWeek')}
            title="This Week"
          >
            Week
          </Button>
          <Button
            variant={quickFilter === 'thisMonth' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setQuickFilter('thisMonth')}
            title="This Month"
          >
            Month
          </Button>
        </div>
        <div className="flex gap-2 bg-background p-1 rounded-lg border">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
            title="Grid View"
            aria-label="Switch to grid view"
            aria-pressed={viewMode === 'grid'}
          >
            {GridIcon && <GridIcon size={16} />}
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
            title="List View"
            aria-label="Switch to list view"
            aria-pressed={viewMode === 'list'}
          >
            {ListIcon && <ListIcon size={16} />}
          </Button>
        </div>
      </div>
    </div>
  );
}
