import { useMemo } from 'react';
import { useMediaStore } from '../stores/useMediaStore';
import type { MediaItem, MediaFilter } from '../types';
import { allMediaItems, filterMediaByType } from '../data/mediaData';

/**
 * MediaGallery component - Media gallery with type tabs
 */
export default function MediaGallery() {
  const { activeMediaTab, setActiveMediaTab } = useMediaStore();

  // Filter media items by active tab
  const filteredMedia: MediaItem[] = useMemo(() => {
    return filterMediaByType(allMediaItems, activeMediaTab);
  }, [activeMediaTab]);

  const tabs: { id: MediaFilter; label: string }[] = [
    { id: 'all_medias', label: 'All' },
    { id: 'image_media', label: 'Images' },
    { id: 'audio_media', label: 'Audio' },
  ];

  const handleTabClick = (tab: MediaFilter, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveMediaTab(tab);
  };

  const getMediaSizeClass = (index: number, total: number): string => {
    // Mimic the original layout pattern
    if (index === 0) return 'stm-360-495';
    if (index === 1) return 'stm-735-240';
    if (index === 2) return 'stm-360-240';
    if (index === 3) return 'stm-360-495';
    if (index === 4) return 'stm-360-240';
    return 'stm-360-240';
  };

  if (filteredMedia.length === 0) {
    return (
      <div className="stm-media-tabs _gallery style_3_3">
        <div className="alert alert-info">No media items available.</div>
      </div>
    );
  }

  return (
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
            <div className="stm-medias-unit clearfix">
              {filteredMedia.map((item, index) => (
                <MediaCard key={item.id} item={item} sizeClass={getMediaSizeClass(index, filteredMedia.length)} />
              ))}
            </div>
          </div>
        </div>
        <div
          role="tabpanel"
          className={`tab-pane fade ${activeMediaTab === 'image_media' ? 'in active' : ''}`}
          id="image_media"
        >
          <div className="stm-medias-unit-wider">
            <div className="stm-medias-unit clearfix">
              {filteredMedia
                .filter((item) => item.type === 'image')
                .map((item, index) => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    sizeClass={getMediaSizeClass(index, filteredMedia.length)}
                  />
                ))}
            </div>
          </div>
        </div>
        <div
          role="tabpanel"
          className={`tab-pane fade ${activeMediaTab === 'audio_media' ? 'in active' : ''}`}
          id="audio_media"
        >
          <div className="stm-medias-unit-wider">
            <div className="stm-medias-unit clearfix">
              {filteredMedia
                .filter((item) => item.type === 'audio')
                .map((item, index) => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    sizeClass={getMediaSizeClass(index, filteredMedia.length)}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * MediaCard component - Individual media item card
 */
function MediaCard({ item, sizeClass }: { item: MediaItem; sizeClass: string }) {
  const isAudio = item.type === 'audio';
  const linkProps = isAudio
    ? {
        href: '#',
        'data-url': item.url,
        className: 'stm-iframe',
        'data-fancybox-group': item.fancyboxGroup,
      }
    : {
        href: item.url,
        className: 'stm-fancybox',
        title: item.title,
        'data-fancybox-group': item.fancyboxGroup,
      };

  return (
    <div className={`${sizeClass} stm-media-single-unit stm-media-single-unit-${item.type}`}>
      <div className="stm-media-preview">
        <a {...linkProps}>
          <img decoding="async" src={item.thumbnail} alt={item.thumbnailAlt || item.title} />
          <div className="icon" />
          <div className="title">{item.title}</div>
        </a>
      </div>
    </div>
  );
}

