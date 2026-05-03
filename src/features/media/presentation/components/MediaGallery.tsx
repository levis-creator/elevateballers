import { useState, useEffect, useMemo } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import MasonryGrid from '../../../../shared/components/ui/MasonryGrid';
import { useMediaStore } from '../../stores/useMediaStore';
import styles from './MediaGallery.module.css';
import { Play, Music, Image as ImageIcon } from 'lucide-react';

interface FeaturedMediaItem {
  id: string;
  title: string;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO';
  thumbnail?: string;
  tags?: string[];
  createdAt: string;
}

const TABS = [
  { id: 'all_medias', label: 'All' },
  { id: 'image_media', label: 'Images' },
  { id: 'audio_media', label: 'Audio' },
] as const;

/**
 * MediaGallery component - Modern public media gallery
 * Features grid/list views, premium animations, and lightbox integration
 */
export default function MediaGallery() {
  const { activeMediaTab, setActiveMediaTab } = useMediaStore();
  const [featuredMedia, setFeaturedMedia] = useState<FeaturedMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

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
        setFeaturedMedia(data);
      } catch (err: any) {
        console.error('Error fetching featured media:', err);
        setError(err.message || 'Failed to load featured images');
        setFeaturedMedia([]);
      } finally {
        setTimeout(() => setLoading(false), 600);
      }
    };

    fetchFeaturedMedia();
  }, []);

  const filteredItems = useMemo(() => {
    if (activeMediaTab === 'all_medias') return featuredMedia;
    if (activeMediaTab === 'image_media') return featuredMedia.filter(item => item.type === 'IMAGE');
    if (activeMediaTab === 'audio_media') return featuredMedia.filter(item => item.type === 'AUDIO');
    return featuredMedia;
  }, [featuredMedia, activeMediaTab]);

  const slides = useMemo(() => 
    filteredItems
      .filter(item => item.type === 'IMAGE')
      .map(item => ({ src: item.url, title: item.title })),
    [filteredItems]
  );

  const handleItemClick = (item: FeaturedMediaItem, e: React.MouseEvent) => {
    if (item.type === 'IMAGE') {
      e.preventDefault();
      const index = slides.findIndex(s => s.src === item.url);
      if (index !== -1) {
        setPhotoIndex(index);
        setLightboxOpen(true);
      }
    } else if (item.type === 'AUDIO') {
      // For audio, we could open a player or just the file
      // e.preventDefault();
    }
  };

  if (error) {
    return (
      <div className="p-12 text-center bg-red-50 text-red-600 rounded-2xl border border-red-100 max-w-2xl mx-auto my-12">
        <h3 className="text-xl font-bold mb-2">Oops! Something went wrong</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition-all shadow-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.unsplashGalleryContainer}>
      {/* Premium Header */}
      <div className={styles.unsplashGalleryHeader}>
        <div className={styles.titleGroup}>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Featured Media</h2>
          <span className={styles.unsplashGallerySubtitle}>Visual highlights from across the league</span>
        </div>
      </div>

      <div className={styles.mediaTabsContainer}>
        <div className={styles.tabsHeader}>
          <ul className={styles.tabsNav}>
            {TABS.map((tab) => (
              <li 
                key={tab.id}
                className={`${styles.tabItem} ${activeMediaTab === tab.id ? styles.tabItemActive : ''}`}
              >
                <a
                  href={`#${tab.id}`}
                  className={styles.tabLink}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveMediaTab(tab.id as any);
                  }}
                >
                  {tab.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {loading ? (
          <SkeletonLoader />
        ) : filteredItems.length > 0 ? (
          <div className={styles.unsplashGallery}>
            <MasonryGrid
              breakpointCols={{
                default: 3,
                1100: 3,
                768: 2,
                500: 1
              }}
              className={styles.unsplashMasonry}
            >
              {filteredItems.map((item) => (
                <div key={item.id} className={styles.unsplashImageCard}>
                  <div className={styles.itemTypeBadge}>
                    {item.type === 'IMAGE' && <ImageIcon size={12} className="mr-1 inline" />}
                    {item.type === 'AUDIO' && <Music size={12} className="mr-1 inline" />}
                    {item.type === 'VIDEO' && <Play size={12} className="mr-1 inline" />}
                    {item.type}
                  </div>
                  <a
                    href={item.url}
                    onClick={(e) => handleItemClick(item, e)}
                    className={styles.unsplashImageLink}
                    target={item.type !== 'IMAGE' ? '_blank' : undefined}
                    rel={item.type !== 'IMAGE' ? 'noopener noreferrer' : undefined}
                  >
                    <div className={styles.unsplashImageWrapper}>
                      <img
                        src={item.thumbnail || item.url}
                        alt={item.title || 'Media gallery item'}
                        className={styles.unsplashImage}
                        loading="lazy"
                      />
                      <div className={styles.unsplashImageOverlay}>
                        <h4 className={styles.unsplashImageTitle}>{item.title}</h4>
                      </div>
                    </div>
                  </a>
                </div>
              ))}
            </MasonryGrid>
          </div>
        ) : (
          <div className="py-24 text-center text-gray-400 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-xl font-medium">No media items found in this category.</p>
            <p className="text-sm mt-2">Try selecting another tab or check back later.</p>
          </div>
        )}
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={photoIndex}
        slides={slides}
      />
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className={styles.skeletonGrid}>
      {[1, 2, 3].map((col) => (
        <div key={col} className={styles.skeletonColumn}>
          {[1, 2].map((row) => (
            <div 
              key={row} 
              className={styles.skeletonItem}
              style={{ height: row === 1 ? '320px' : '220px' }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
