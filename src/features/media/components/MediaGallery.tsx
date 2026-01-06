import { useState, useMemo } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { useMediaStore } from '../stores/useMediaStore';
import type { MediaItem, MediaFilter } from '../types';
import { allMediaItems, filterMediaByType } from '../data/mediaData';
import MasonryGrid from '../../../shared/components/ui/MasonryGrid';

/**
 * MediaGallery component - Media gallery with type tabs and modern lightbox
 * Migrated from Fancybox to yet-another-react-lightbox
 */
export default function MediaGallery() {
  const { activeMediaTab, setActiveMediaTab } = useMediaStore();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxGroup, setLightboxGroup] = useState<string>('all');

  // Filter media items by active tab
  const filteredMedia: MediaItem[] = useMemo(() => {
    return filterMediaByType(allMediaItems, activeMediaTab);
  }, [activeMediaTab]);

  // Prepare slides for lightbox based on current group
  const lightboxSlides = useMemo(() => {
    const groupItems = filteredMedia.filter(
      (item) => item.fancyboxGroup === lightboxGroup && item.type === 'image'
    );
    return groupItems.map((item) => ({
      src: item.url,
      alt: item.title,
      title: item.title,
    }));
  }, [filteredMedia, lightboxGroup]);

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
    
    if (item.type === 'image' && item.fancyboxGroup) {
      // Find the index of this item within its group
      const groupItems = filteredMedia.filter(
        (i) => i.fancyboxGroup === item.fancyboxGroup && i.type === 'image'
      );
      const index = groupItems.findIndex((i) => i.id === item.id);
      
      setLightboxGroup(item.fancyboxGroup);
      setLightboxIndex(index >= 0 ? index : 0);
      setLightboxOpen(true);
    } else if (item.type === 'audio') {
      // For audio, open in new window or handle differently
      window.open(item.url, '_blank');
    }
  };


  if (filteredMedia.length === 0) {
    return (
      <div className="stm-media-tabs _gallery style_3_3">
        <div className="alert alert-info">No media items available.</div>
      </div>
    );
  }

  return (
    <>
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
 * MediaCard component - Individual media item card
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
