import { useState, useMemo, useEffect } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { useMediaStore } from '../stores/useMediaStore';
import type { MediaItem, MediaFilter } from '../types';
import { allMediaItems, filterMediaByType } from '../data/mediaData';
import MasonryGrid from '../../../shared/components/ui/MasonryGrid';
import styles from './MediaGallery.module.css';

interface FeaturedMediaItem {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  type: string;
  featured: boolean;
}

/**
 * MediaGallery component - Media gallery with type tabs and modern lightbox
 * Displays featured images in Unsplash-style masonry layout
 */
export default function MediaGallery() {
  const { activeMediaTab, setActiveMediaTab } = useMediaStore();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [featuredMedia, setFeaturedMedia] = useState<FeaturedMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch featured media from API
  useEffect(() => {
    const fetchFeaturedMedia = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/media?featured=true');
        if (!response.ok) {
          throw new Error('Failed to fetch featured media');
        }
        const data = await response.json();
        // Filter to only show images
        const images = data.filter((item: FeaturedMediaItem) => item.type === 'IMAGE');
        setFeaturedMedia(images);
      } catch (err: any) {
        console.error('Error fetching featured media:', err);
        setError(err.message || 'Failed to load featured images');
        // Fallback to static data if API fails
        setFeaturedMedia([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedMedia();
  }, []);

  // Convert featured media to MediaItem format for compatibility
  const convertedMedia: MediaItem[] = useMemo(() => {
    return featuredMedia.map((item, index) => ({
      id: parseInt(item.id.replace(/\D/g, '')) || index,
      type: 'image' as const,
      title: item.title,
      url: item.url,
      thumbnail: item.thumbnail || item.url,
      thumbnailAlt: item.title,
      fancyboxGroup: 'featured_images',
    }));
  }, [featuredMedia]);

  // Filter media items by active tab (for backward compatibility with static data)
  const filteredMedia: MediaItem[] = useMemo(() => {
    // If we have featured media, use that; otherwise fall back to static data
    const mediaToUse = convertedMedia.length > 0 ? convertedMedia : allMediaItems;
    return filterMediaByType(mediaToUse, activeMediaTab);
  }, [convertedMedia, activeMediaTab]);

  // Prepare slides for lightbox
  const lightboxSlides = useMemo(() => {
    const images = filteredMedia.filter((item) => item.type === 'image');
    return images.map((item) => ({
      src: item.url,
      alt: item.title,
      title: item.title,
    }));
  }, [filteredMedia]);

  const tabs: { id: MediaFilter; label: string }[] = [
    { id: 'all_medias', label: 'All' },
    { id: 'image_media', label: 'Images' },
    { id: 'audio_media', label: 'Audio' },
  ];

  const handleTabClick = (tab: MediaFilter, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveMediaTab(tab);
  };

  const handleImageClick = (item: MediaItem, e: React.MouseEvent) => {
    e.preventDefault();
    
    if (item.type === 'image') {
      // Find the index of this item
      const images = filteredMedia.filter((i) => i.type === 'image');
      const index = images.findIndex((i) => i.id === item.id);
      setLightboxIndex(index >= 0 ? index : 0);
      setLightboxOpen(true);
    } else if (item.type === 'audio') {
      // For audio, open in new window or handle differently
      window.open(item.url, '_blank');
    }
  };

  // Show featured images in Unsplash-style layout
  if (loading) {
    return (
      <div className={styles.unsplashGalleryContainer}>
        <div className={styles.unsplashGalleryHeader}>
          <h2 className="stm-main-title-unit">Featured Gallery</h2>
        </div>
        <div className={styles.unsplashGalleryLoading}>
          <div className={styles.loadingSpinner} />
          <p>Loading featured images...</p>
        </div>
      </div>
    );
  }

  if (error && convertedMedia.length === 0) {
    return (
      <div className={styles.unsplashGalleryContainer}>
        <div className={styles.unsplashGalleryHeader}>
          <h2 className="stm-main-title-unit">Featured Gallery</h2>
        </div>
        <div className="alert alert-warning">{error}</div>
      </div>
    );
  }

  if (convertedMedia.length === 0 && filteredMedia.length === 0) {
    return (
      <div className={styles.unsplashGalleryContainer}>
        <div className={styles.unsplashGalleryHeader}>
          <h2 className="stm-main-title-unit">Featured Gallery</h2>
        </div>
        <div className="alert alert-info">No featured images available.</div>
      </div>
    );
  }

  // If we have featured media, show Unsplash-style layout; otherwise show tabs
  const showFeaturedOnly = convertedMedia.length > 0;

  return (
    <>
      {showFeaturedOnly ? (
        <div className={styles.unsplashGalleryContainer}>
          <div className={styles.unsplashGalleryHeader}>
            <h2 className="stm-main-title-unit">Featured Gallery</h2>
            <p className={styles.unsplashGallerySubtitle}>Discover our best moments</p>
          </div>
          <div className={styles.unsplashGallery}>
            <MasonryGrid 
              className={styles.unsplashMasonry}
              breakpointCols={{
                default: 5,
                1400: 4,
                1100: 3,
                700: 2,
                500: 1
              }}
            >
              {convertedMedia.map((item) => (
                <UnsplashImageCard
                  key={item.id}
                  item={item}
                  onClick={handleImageClick}
                />
              ))}
            </MasonryGrid>
          </div>
        </div>
      ) : (
        <div className="stm-media-tabs _gallery style_3_3">
          <div className="clearfix">
            <div className="stm-title-left">
              <h2 className="stm-main-title-unit">Media Gallery</h2>
            </div>
            <div className="stm-media-tabs-nav">
              <ul className="stm-list-duty heading-font" role="tablist">
                {tabs.map((tab) => (
                  <li key={tab.id} className={activeMediaTab === tab.id ? 'active' : ''}>
                    <a
                      href={`#${tab.id}`}
                      aria-controls={tab.id}
                      role="tab"
                      data-toggle="tab"
                      onClick={(e) => handleTabClick(tab.id, e)}
                    >
                      <span>{tab.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="tab-content">
            <div
              role="tabpanel"
              className={`tab-pane fade ${activeMediaTab === 'all_medias' ? 'in active' : ''}`}
              id="all_medias"
            >
              <div className="stm-medias-unit-wider">
                <MasonryGrid 
                  className="stm-medias-unit clearfix"
                  breakpointCols={{
                    default: 3,
                    1100: 3,
                    700: 2,
                    500: 1
                  }}
                >
                  {filteredMedia.map((item) => (
                    <MediaCard
                      key={item.id}
                      item={item}
                      onClick={handleImageClick}
                    />
                  ))}
                </MasonryGrid>
              </div>
            </div>
            <div
              role="tabpanel"
              className={`tab-pane fade ${activeMediaTab === 'image_media' ? 'in active' : ''}`}
              id="image_media"
            >
              <div className="stm-medias-unit-wider">
                <MasonryGrid 
                  className="stm-medias-unit clearfix"
                  breakpointCols={{
                    default: 3,
                    1100: 3,
                    700: 2,
                    500: 1
                  }}
                >
                  {filteredMedia
                    .filter((item) => item.type === 'image')
                    .map((item) => (
                      <MediaCard
                        key={item.id}
                        item={item}
                        onClick={handleImageClick}
                      />
                    ))}
                </MasonryGrid>
              </div>
            </div>
            <div
              role="tabpanel"
              className={`tab-pane fade ${activeMediaTab === 'audio_media' ? 'in active' : ''}`}
              id="audio_media"
            >
              <div className="stm-medias-unit-wider">
                <MasonryGrid 
                  className="stm-medias-unit clearfix"
                  breakpointCols={{
                    default: 3,
                    1100: 3,
                    700: 2,
                    500: 1
                  }}
                >
                  {filteredMedia
                    .filter((item) => item.type === 'audio')
                    .map((item) => (
                      <MediaCard
                        key={item.id}
                        item={item}
                        onClick={handleImageClick}
                      />
                    ))}
                </MasonryGrid>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Lightbox - replaces Fancybox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={lightboxSlides}
        index={lightboxIndex}
        on={{
          view: ({ index }) => setLightboxIndex(index),
        }}
        styles={{
          container: { backgroundColor: 'rgba(0, 0, 0, 0.9)' },
        }}
        carousel={{
          finite: false,
        }}
        render={{
          buttonPrev: lightboxSlides.length <= 1 ? () => null : undefined,
          buttonNext: lightboxSlides.length <= 1 ? () => null : undefined,
        }}
      />
    </>
  );
}

/**
 * UnsplashImageCard component - Unsplash-style image card with hover effects
 */
function UnsplashImageCard({
  item,
  onClick,
}: {
  item: MediaItem;
  onClick: (item: MediaItem, e: React.MouseEvent) => void;
}) {
  return (
    <div className={styles.unsplashImageCard}>
      <a
        href={item.url}
        onClick={(e) => onClick(item, e)}
        className={styles.unsplashImageLink}
        title={item.title}
      >
        <div className={styles.unsplashImageWrapper}>
          <img 
            decoding="async" 
            src={item.thumbnail || item.url} 
            alt={item.thumbnailAlt || item.title}
            className={styles.unsplashImage}
            loading="lazy"
          />
          <div className={styles.unsplashImageOverlay}>
            <div className={styles.unsplashImageTitle}>{item.title}</div>
          </div>
        </div>
      </a>
    </div>
  );
}

/**
 * MediaCard component - Individual media item card (legacy)
 */
function MediaCard({
  item,
  onClick,
}: {
  item: MediaItem;
  onClick: (item: MediaItem, e: React.MouseEvent) => void;
}) {
  const isAudio = item.type === 'audio';

  return (
    <div className={`stm-media-single-unit stm-media-single-unit-${item.type}`} style={{ width: '100%', float: 'none', padding: '0 0 30px 0' }}>
      <div className="stm-media-preview">
        <a
          href={item.url}
          onClick={(e) => onClick(item, e)}
          className={isAudio ? 'stm-iframe' : 'stm-fancybox'}
          title={item.title}
          data-fancybox-group={item.fancyboxGroup}
        >
          <img decoding="async" src={item.thumbnail} alt={item.thumbnailAlt || item.title} />
          <div className="icon" />
          <div className="title">{item.title}</div>
        </a>
      </div>
    </div>
  );
}
