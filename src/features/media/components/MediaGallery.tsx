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
        const images = data.filter((item: FeaturedMediaItem) => item.type === 'IMAGE');
        setFeaturedMedia(images);
      } catch (err: any) {
        console.error('Error fetching featured media:', err);
        setError(err.message || 'Failed to load featured images');
        setFeaturedMedia([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedMedia();
  }, []);

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

  const filteredMedia: MediaItem[] = useMemo(() => {
    const mediaToUse = convertedMedia.length > 0 ? convertedMedia : allMediaItems;
    return filterMediaByType(mediaToUse, activeMediaTab);
  }, [convertedMedia, activeMediaTab]);

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
      const images = filteredMedia.filter((i) => i.type === 'image');
      const index = images.findIndex((i) => i.id === item.id);
      setLightboxIndex(index >= 0 ? index : 0);
      setLightboxOpen(true);
    } else if (item.type === 'audio') {
      window.open(item.url, '_blank');
    }
  };

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
        <div className={styles.mediaTabsContainer}>
          <div className={styles.tabsHeader}>
            <h2 className={`${styles.tabsTitle} stm-main-title-unit`}>Media Gallery</h2>
            <nav className={styles.tabsNavContainer}>
              <ul className={styles.tabsNav}>
                {tabs.map((tab) => (
                  <li 
                    key={tab.id} 
                    className={`${styles.tabItem} ${activeMediaTab === tab.id ? styles.tabItemActive : ''}`}
                  >
                    <a
                      href={`#${tab.id}`}
                      className={styles.tabLink}
                      onClick={(e) => handleTabClick(tab.id, e)}
                    >
                      <span>{tab.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className={styles.galleryContent}>
            <MasonryGrid 
              breakpointCols={{
                default: 3,
                1100: 3,
                700: 2,
                500: 1
              }}
            >
              {filteredMedia
                .filter((item) => {
                  if (activeMediaTab === 'all_medias') return true;
                  if (activeMediaTab === 'image_media') return item.type === 'image';
                  if (activeMediaTab === 'audio_media') return item.type === 'audio';
                  return true;
                })
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
      )}

      {/* Modern Lightbox */}
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
 * UnsplashImageCard component
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
 * MediaCard component
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
    <div className={`stm-media-single-unit stm-media-single-unit-${item.type}`} style={{ width: '100%', float: 'none' }}>
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
