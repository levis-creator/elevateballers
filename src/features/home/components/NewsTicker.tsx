import { useEffect, useRef, useState } from 'react';
import type { NewsArticleDTO } from '../../cms/types';

/**
 * NewsTicker component - Scrolling news ticker
 * Displays 5 latest articles from the database
 * Uses existing jQuery ticker functionality
 */
export default function NewsTicker() {
  const tickerRef = useRef<HTMLUListElement>(null);
  const tickerInitializedRef = useRef(false);
  const isInitializingRef = useRef(false);
  const [tickerItems, setTickerItems] = useState<Array<{ id: string; title: string; date: string; url: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Fetch latest articles for ticker (only once on mount)
  useEffect(() => {
    let isMounted = true;

    async function fetchTickerArticles() {
      try {
        setLoading(true);
        const response = await fetch('/api/news?limit=5');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch articles: ${response.status}`);
        }
        
        const articles: NewsArticleDTO[] = await response.json();
        
        // Only update state if component is still mounted
        if (!isMounted) return;
        
        // Map articles to ticker items format
        const items = articles.slice(0, 5).map((article) => {
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

          return {
            id: article.id,
            title: article.title,
            date,
            url: `/news/${article.slug}`,
          };
        });
        
        setTickerItems(items);
      } catch (err) {
        console.error('Error fetching ticker articles:', err);
        if (isMounted) {
          setTickerItems([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchTickerArticles();

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize jQuery ticker when items are loaded (only once)
  useEffect(() => {
    // Prevent re-initialization - check all conditions first
    if (
      typeof window === 'undefined' || 
      !(window as any).jQuery || 
      tickerItems.length === 0 || 
      loading ||
      tickerInitializedRef.current ||
      isInitializingRef.current
    ) {
      return;
    }

    // Mark as initializing to prevent concurrent calls
    isInitializingRef.current = true;

    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      // Double-check flags after timeout
      if (tickerInitializedRef.current || !tickerRef.current) {
        isInitializingRef.current = false;
        return;
      }
      
      const $ = (window as any).jQuery;
      const ticker = $(tickerRef.current);

      // Initialize ticker if the script is available and not already initialized
      if (ticker.length && typeof ticker.stmTickerPosts === 'function') {
        try {
          // Mark as initialized BEFORE calling to prevent re-entry
          tickerInitializedRef.current = true;
          isInitializingRef.current = false;
          
          ticker.stmTickerPosts({
            direction: 'up',
            auto_play_speed: 10000,
            animate_speed: 700,
            count_posts: 5,
          });
        } catch (error) {
          console.error('Error initializing ticker:', error);
          // Reset flags on error so we can retry
          tickerInitializedRef.current = false;
          isInitializingRef.current = false;
        }
      } else {
        isInitializingRef.current = false;
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      isInitializingRef.current = false;
    };
  }, [tickerItems.length, loading]); // Only depend on length and loading state

  return (
    <div className="stmTickerWrapper default" style={{ background: '#ffba00' }}>
      <div className="container">
        <div className="stmTickerContent">
          <div className="stmTickerTitle heading-font right" style={{ order: 2, color: '#0e1d1f' }}>
            <span style={{ color: '#ffffff' }}>ELEVATE</span> NEWS
          </div>
          <div className="stmTickerPostsWrapper">
            {loading ? (
              <ul
                ref={tickerRef}
                className="stmTickerPostsList stmTickerPostsListTop"
              >
                <li className="tickerItem">
                  <div className="stm-ticker-post">
                    <span className="normal_font">Loading latest news...</span>
                  </div>
                </li>
              </ul>
            ) : tickerItems.length === 0 ? (
              <ul
                ref={tickerRef}
                className="stmTickerPostsList stmTickerPostsListTop"
              >
                <li className="tickerItem">
                  <div className="stm-ticker-post">
                    <span className="normal_font">No news available</span>
                  </div>
                </li>
              </ul>
            ) : (
              <ul
                ref={tickerRef}
                className="stmTickerPostsList stmTickerPostsListTop"
                data-direction="up"
                data-auto_play_speed="10000"
                data-animate_speed="700"
                data-count-posts="5"
                suppressHydrationWarning
              >
                {tickerItems.map((item) => (
                  <li key={item.id} className="tickerItem" data-id={item.id} suppressHydrationWarning>
                    <div className="stm-ticker-post">
                      <i className="icon-soccer_ico_ticker_post" />
                      <a href={item.url}>
                        <span className="normal_font">{item.title}</span>
                      </a>
                      <span className="ticker-post-divider normal_font">/</span>
                      <span>{item.date}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

