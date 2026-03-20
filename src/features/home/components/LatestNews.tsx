import { useEffect, useState, useMemo } from 'react';
import { useNewsStore } from '../stores/useNewsStore';
import type { NewsItem, NewsFilter } from '../types';
import type { NewsArticleDTO } from '../../cms/types';
import { reverseCategoryMap } from '../../cms/types';

function normalizeImageUrl(imageUrl: any): string {
  if (!imageUrl) return '/images/placeholder-350x250.gif';
  let url = '';
  if (typeof imageUrl === 'string') url = imageUrl.trim();
  else if (typeof imageUrl === 'object') url = (imageUrl.url || imageUrl.src || '').toString().trim();
  if (!url) return '/images/placeholder-350x250.gif';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return url;
  if (url.startsWith('wp-content/') || url.startsWith('images/')) return `/${url}`;
  return `/${url}`;
}

/* ── Styles ─────────────────────────────────────────────────────────── */
const styles = `
  /* Tab buttons */
  .ln-tab {
    font-family: var(--font-heading);
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 0.45rem 1.25rem;
    border-radius: 9999px;
    border: none;
    background: var(--color-gray-100);
    color: var(--color-gray-600) !important;
    cursor: pointer;
    transition: background 180ms ease, color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
    outline: none;
    white-space: nowrap;
    display: inline-block;
    line-height: 1.4;
  }
  .ln-tab:hover {
    background: var(--color-gray-800) !important;
    color: #ffffff !important;
    box-shadow: 0 2px 10px rgba(0,0,0,0.18);
    transform: translateY(-1px);
  }
  .ln-tab[aria-selected="true"] {
    background: var(--color-primary) !important;
    color: #ffffff !important;
    box-shadow: 0 4px 14px rgba(221,51,51,0.35);
  }
  .ln-tab[aria-selected="true"]:hover {
    background: var(--color-primary-dark) !important;
    color: #ffffff !important;
  }

  /* Featured card */
  .ln-featured {
    display: block;
    border-radius: var(--radius-xl);
    overflow: hidden;
    position: relative;
    text-decoration: none;
    color: inherit;
  }
  .ln-featured-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease;
  }
  .ln-featured:hover .ln-featured-img {
    transform: scale(1.03);
  }

  /* Small cards */
  .ln-card {
    display: flex;
    flex-direction: column;
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: var(--color-white);
    border: 1px solid var(--color-gray-200);
    text-decoration: none;
    color: inherit;
    box-shadow: var(--shadow-sm);
    transition: box-shadow 220ms ease, transform 220ms ease;
  }
  .ln-card:hover {
    box-shadow: var(--shadow-lg) !important;
    transform: translateY(-4px);
  }
  .ln-card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 350ms ease;
  }
  .ln-card:hover .ln-card-img {
    transform: scale(1.06);
  }

  /* Secondary grid — responsive */
  .ln-secondary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
    gap: 1.25rem;
  }

  /* Featured card content — responsive padding & font */
  .ln-featured-content {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1.75rem 2rem;
  }
  .ln-featured-title {
    font-family: var(--font-heading);
    font-size: var(--font-size-2xl);
    color: #fff;
    margin: 0.5rem 0;
    line-height: var(--line-height-tight);
    text-transform: uppercase;
  }

  @media (max-width: 640px) {
    .ln-featured-content {
      padding: 1rem 1.25rem;
    }
    .ln-featured-title {
      font-size: var(--font-size-xl);
    }
  }

  /* Skeleton pulse */
  @keyframes ln-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.45; }
  }
  .ln-skeleton {
    animation: ln-pulse 1.5s ease-in-out infinite;
    background: var(--color-gray-100);
  }

  /* Card title — always 2 lines high */
  .ln-card-title {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: calc(var(--font-size-lg) * 1.375 * 2);
  }

  /* "View all" link */
  .ln-view-all {
    font-family: var(--font-heading);
    font-size: var(--font-size-sm);
    color: var(--color-primary) !important;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    transition: opacity var(--transition-base);
    text-decoration: none;
  }
  .ln-view-all:hover {
    opacity: 0.75;
  }
`;

/* ── Main component ─────────────────────────────────────────────────── */
export default function LatestNews() {
  const { activeTab, setActiveTab } = useNewsStore();
  const [articles, setArticles] = useState<NewsArticleDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLatestArticles() {
      try {
        setLoading(true);
        setError(null);
        const categoryParam = activeTab === 'All' ? '' : `&category=${encodeURIComponent(activeTab)}`;
        const response = await fetch(`/api/news?limit=5${categoryParam}`);
        if (!response.ok) throw new Error(`Failed to fetch articles: ${response.status}`);
        const data: NewsArticleDTO[] = await response.json();
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

  const newsItems: NewsItem[] = useMemo(() => {
    return articles.map((article) => {
      const rawDate = article.publishedAt ?? article.createdAt;
      const dateObj = new Date(rawDate);
      return {
        id: article.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 10000,
        title: article.title,
        date: dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        isoDate: dateObj.toISOString(),
        category: reverseCategoryMap[article.category] || article.category,
        image: normalizeImageUrl(article.image),
        excerpt: article.excerpt || '',
        url: `/news/${article.slug}`,
        commentsCount: article.commentsCount,
        format: (article.content.includes('youtube') || article.content.includes('vimeo')) ? 'video' : 'standard',
        feature: (article as any).feature || false,
      };
    });
  }, [articles]);

  const tabs: NewsFilter[] = ['All', 'Interviews', 'Championships', 'Match report', 'Analysis'];
  const [featured, ...secondary] = newsItems;

  return (
    <div>
      <style>{styles}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--font-size-3xl)', color: 'var(--color-gray-900)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          Latest <span style={{ color: 'var(--color-primary)' }}>News</span>
        </h2>
        <a href="/news" className="ln-view-all" aria-label="View all news articles">
          View all &rarr;
        </a>
      </div>

      {/* Category filter */}
      <div
        role="tablist"
        aria-label="Filter news by category"
        style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className="ln-tab"
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && <SkeletonGrid />}

      {/* Error */}
      {!loading && error && (
        <p role="alert" style={{ color: 'var(--color-primary)', textAlign: 'center', padding: '2rem 0' }}>
          Failed to load articles. Please try again later.
        </p>
      )}

      {/* Empty */}
      {!loading && !error && newsItems.length === 0 && (
        <p style={{ color: 'var(--color-gray-500)', textAlign: 'center', padding: '2rem 0' }}>
          No articles found in this category.
        </p>
      )}

      {/* Content */}
      {!loading && !error && newsItems.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          {featured && <FeaturedCard item={featured} />}
          {secondary.length > 0 && (
            <div className="ln-secondary-grid">
              {secondary.map((item, i) => (
                <SmallCard key={`${item.id}-${i}`} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Featured card ──────────────────────────────────────────────────── */
function FeaturedCard({ item }: { item: NewsItem }) {
  const [imgSrc, setImgSrc] = useState(item.image);
  useEffect(() => { setImgSrc(item.image); }, [item.image]);

  return (
    <article>
      <a href={item.url} className="ln-featured" aria-label={`Read article: ${item.title}`}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/7', overflow: 'hidden', background: 'var(--color-gray-200)' }}>
          <img
            className="ln-featured-img"
            src={imgSrc}
            alt={item.title}
            loading="eager"
            fetchPriority="high"
            onError={() => setImgSrc('/images/placeholder-350x250.gif')}
          />
          {/* Gradient overlay */}
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 55%, transparent 100%)' }} />

          <div className="ln-featured-content">
            <CategoryBadge label={item.category} />
            <h3 className="ln-featured-title">{item.title}</h3>
            {item.excerpt && (
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'var(--font-size-sm)', margin: '0 0 0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {item.excerpt}
              </p>
            )}
            <Meta date={item.date} isoDate={item.isoDate} comments={item.commentsCount} light />
          </div>
        </div>
      </a>
    </article>
  );
}

/* ── Small card ─────────────────────────────────────────────────────── */
function SmallCard({ item }: { item: NewsItem }) {
  const [imgSrc, setImgSrc] = useState(item.image);
  useEffect(() => { setImgSrc(item.image); }, [item.image]);

  return (
    <article>
      <a href={item.url} className="ln-card" aria-label={`Read article: ${item.title}`}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', background: 'var(--color-gray-100)' }}>
          <img
            className="ln-card-img"
            src={imgSrc}
            alt={item.title}
            loading="lazy"
            onError={() => setImgSrc('/images/placeholder-350x250.gif')}
          />
          <div style={{ position: 'absolute', top: '0.6rem', left: '0.6rem' }}>
            <CategoryBadge label={item.category} />
          </div>
        </div>
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <h3 className="ln-card-title" style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--font-size-lg)', color: 'var(--color-gray-900)', margin: 0, textTransform: 'uppercase', lineHeight: 'var(--line-height-snug)' }}>
            {item.title}
          </h3>
          <div style={{ marginTop: 'auto' }}>
            <Meta date={item.date} isoDate={item.isoDate} comments={item.commentsCount} />
          </div>
        </div>
      </a>
    </article>
  );
}

/* ── Shared sub-components ──────────────────────────────────────────── */
function CategoryBadge({ label }: { label: string }) {
  return (
    <span style={{
      display: 'inline-block',
      fontFamily: 'var(--font-heading)',
      fontSize: '0.7rem',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      background: 'var(--color-primary)',
      color: '#fff',
      padding: '0.2rem 0.65rem',
      borderRadius: 'var(--radius-full)',
    }}>
      {label}
    </span>
  );
}

function Meta({ date, isoDate, comments, light = false }: { date: string; isoDate?: string; comments: number; light?: boolean }) {
  const color = light ? 'rgba(255,255,255,0.7)' : 'var(--color-gray-400)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: 'var(--font-size-xs)', color, fontFamily: 'var(--font-body)' }}>
      <time dateTime={isoDate}>{date}</time>
      {comments > 0 && (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span aria-label={`${comments} comments`}>{comments}</span>
        </span>
      )}
    </div>
  );
}

/* ── Skeleton loader ────────────────────────────────────────────────── */
function SkeletonGrid() {
  return (
    <div aria-busy="true" aria-label="Loading articles" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
      <div className="ln-skeleton" style={{ borderRadius: 'var(--radius-xl)', aspectRatio: '16/7' }} />
      <div className="ln-secondary-grid">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-gray-200)' }}>
            <div className="ln-skeleton" style={{ aspectRatio: '16/9' }} />
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="ln-skeleton" style={{ height: '1rem', borderRadius: 'var(--radius-sm)' }} />
              <div className="ln-skeleton" style={{ height: '1rem', borderRadius: 'var(--radius-sm)', width: '75%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
