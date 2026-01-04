import { useEffect, useState, useMemo } from 'react';
import { useNewsStore } from '../stores/useNewsStore';
import type { NewsItem, NewsFilter } from '../types';
import type { NewsArticleDTO } from '../../cms/types';
import { reverseCategoryMap } from '../../cms/types';

/**
 * Normalize image URL to ensure it's a valid, accessible path
 * Handles absolute URLs, relative paths, and WordPress-style paths
 */
function normalizeImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl || imageUrl.trim() === '') {
    return '/images/placeholder-350x250.gif';
  }

  const trimmedUrl = imageUrl.trim();

  // If it's already an absolute URL (http/https), return as-is
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }

  // If it starts with '/', it's already a root-relative path
  if (trimmedUrl.startsWith('/')) {
    return trimmedUrl;
  }

  // Handle WordPress-style paths (wp-content/uploads/...)
  // These should be accessible from the root
  if (trimmedUrl.startsWith('wp-content/') || trimmedUrl.startsWith('images/')) {
    return `/${trimmedUrl}`;
  }

  // Otherwise, prepend '/' to make it root-relative
  return `/${trimmedUrl}`;
}

/**
 * LatestNews component - News grid with category tabs
 * Displays 5 latest articles from the database
 */
export default function LatestNews() {
  const { activeTab, setActiveTab } = useNewsStore();
  const [articles, setArticles] = useState<NewsArticleDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch latest articles from API
  useEffect(() => {
    async function fetchLatestArticles() {
      try {
        setLoading(true);
        setError(null);
        
        // Build API URL with category filter if not "All"
        const categoryParam = activeTab === 'All' ? '' : `&category=${encodeURIComponent(activeTab)}`;
        const response = await fetch(`/api/news?limit=5${categoryParam}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch articles: ${response.status}`);
        }
        
        const data: NewsArticleDTO[] = await response.json();
        // Limit to 5 articles (client-side backup)
        setArticles(data.slice(0, 5));
      } catch (err) {
        console.error('Error fetching latest articles:', err);
        setError(err instanceof Error ? err.message : 'Failed to load articles');
        setArticles([]);
      } finally {
        setLoading(false);
      }
    }

    fetchLatestArticles();
  }, [activeTab]);

  // Map NewsArticleDTO to NewsItem format
  const filteredNews: NewsItem[] = useMemo(() => {
    return articles.map((article, index) => {
      // Format date
      const date = article.publishedAt
        ? new Date(article.publishedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : new Date(article.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

      // Map category
      const category = reverseCategoryMap[article.category] || article.category;

      // Determine if article has video content
      const hasVideo = article.content.includes('youtube') || article.content.includes('vimeo');

      // Generate a numeric ID from the article ID (for compatibility with existing NewsItem type)
      // Use a hash of the string ID to get a consistent number
      const numericId = article.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 10000;

      // Normalize image URL
      const normalizedImage = normalizeImageUrl(article.image);
      
      // Log image URL for debugging (only in development)
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log('Article image URL:', {
          original: article.image,
          normalized: normalizedImage,
          title: article.title,
        });
      }

      return {
        id: numericId,
        title: article.title,
        date,
        category,
        image: normalizedImage,
        excerpt: article.excerpt || '',
        url: `/news/${article.slug}`,
        commentsCount: article.commentsCount,
        format: hasVideo ? ('video' as const) : ('standard' as const),
        feature: (article as any).feature || false,
      };
    });
  }, [articles]);

  const tabs: NewsFilter[] = ['All', 'Interviews', 'Championships', 'Match report', 'Analysis'];

  const handleTabClick = (tab: NewsFilter, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveTab(tab);
  };

  return (
    <div className="stm-news-grid style_2 stm-media-tabs stm-news-tabs-wrapper">
      <div className="clearfix">
        <div className="stm-title-left">
          <h2 className="stm-main-title-unit">Latest news</h2>
        </div>
        <div id="media_tabs_nav" className="stm-media-tabs-nav">
          <ul className="stm-list-duty heading-font" role="tablist">
            {tabs.map((tab) => (
              <li key={tab} className={activeTab === tab ? 'active' : ''}>
                <a
                  href={`#${tab}`}
                  aria-controls={tab}
                  role="tab"
                  data-toggle="tab"
                  onClick={(e) => handleTabClick(tab, e)}
                  className={activeTab === tab ? 'active' : ''}
                  id={`tab-${tab.toLowerCase().replace(' ', '-')}`}
                >
                  <span>{tab}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="tab-content">
        {tabs.map((tab) => (
          <div
            key={tab}
            role="tabpanel"
            className={`tab-pane fade ${activeTab === tab ? 'in active' : ''}`}
            id={tab}
            aria-labelledby={`tab-${tab.toLowerCase().replace(' ', '-')}`}
          >
            {activeTab === tab && (
              <>
                {loading && (
                  <div className="stm-latest-news-wrapp" style={{ textAlign: 'center', padding: '2rem' }}>
                    <p>Loading latest articles...</p>
                  </div>
                )}
                
                {error && (
                  <div className="stm-latest-news-wrapp" style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
                    <p>Error: {error}</p>
                  </div>
                )}
                
                {!loading && !error && filteredNews.length === 0 && (
                  <div className="stm-latest-news-wrapp" style={{ textAlign: 'center', padding: '2rem' }}>
                    <p>No articles found in this category.</p>
                  </div>
                )}
                
                {!loading && !error && filteredNews.length > 0 && (
                  <div className="stm-latest-news-wrapp">
                    {filteredNews.map((item, index) => (
                      <NewsCard key={`article-${articles[index]?.id || index}`} item={item} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * NewsCard component - Individual news card
 */
function NewsCard({ item }: { item: NewsItem }) {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(item.image);
  const [imageLoading, setImageLoading] = useState(true);

  // Reset image state when item changes
  useEffect(() => {
    setImageError(false);
    setImageLoading(true);
    setImageSrc(item.image);
    
    // Preload image to check if it exists
    if (item.image) {
      const img = new Image();
      img.onload = () => {
        setImageLoading(false);
        setImageError(false);
      };
      img.onerror = () => {
        console.warn('Image failed to load:', item.image);
        setImageError(true);
        setImageLoading(false);
        setImageSrc('/images/placeholder-350x250.gif');
      };
      img.src = item.image;
    } else {
      setImageLoading(false);
      setImageError(true);
      setImageSrc('/images/placeholder-350x250.gif');
    }
  }, [item.image]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!imageError) {
      console.warn('Image error event triggered for:', imageSrc);
      setImageError(true);
      setImageLoading(false);
      setImageSrc('/images/placeholder-350x250.gif');
      // Prevent infinite loop by stopping event propagation
      e.currentTarget.src = '/images/placeholder-350x250.gif';
    }
  };

  return (
    <div className="stm-latest-news-single">
      <div
        className={`stm-single-post-loop post-${item.id} post type-post status-publish format-${item.format || 'standard'} has-post-thumbnail hentry category-${item.category.toLowerCase()}`}
      >
        <a href={item.url} title={item.title}>
          <div className={`image ${item.format === 'video' ? 'video' : ''}`}>
            {imageLoading && !imageError && (
              <div style={{ 
                width: '350px', 
                height: '250px', 
                backgroundColor: '#f0f0f0', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <span style={{ color: '#999', fontSize: '14px' }}>Loading...</span>
              </div>
            )}
            <img
              decoding="async"
              width="350"
              height="250"
              src={imageSrc}
              className="img-responsive wp-post-image"
              alt={item.title}
              style={{ display: imageLoading && !imageError ? 'none' : 'block' }}
              onError={handleImageError}
              onLoad={() => setImageLoading(false)}
            />
          </div>
        </a>

        <div className="stm-news-data-wrapp">
          <div className="date heading-font clear">{item.date}</div>
          <div className="title heading-font clear">
            <a href={item.url}>{item.title}</a>
          </div>
          <div className="post-meta normal_font clear">
            <div className="news-category">
              <i className="fa fa-folder-o" aria-hidden="true" />
              {item.category}
            </div>
            <div className="comments-number">
              <a href={`${item.url}#comments`}>
                <i className="fa fa-comment-o" aria-hidden="true" />
                <span>{item.commentsCount}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

