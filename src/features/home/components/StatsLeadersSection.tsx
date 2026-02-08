import { useState } from 'react';
import StatsLeadersCarousel from './StatsLeadersCarousel';

const categories = [
  { id: 'points', label: 'Points', shortLabel: 'PTS' },
  { id: 'rebounds', label: 'Rebounds', shortLabel: 'REB' },
  { id: 'assists', label: 'Assists', shortLabel: 'AST' },
];

/**
 * StatsLeadersSection Component
 * Redesigned section for display stats leaders with category switching
 */
export default function StatsLeadersSection() {
  const [activeCategory, setActiveCategory] = useState('points');
  const [isChanging, setIsChanging] = useState(false);
  const [emblaApi, setEmblaApi] = useState<any>(null);

  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === activeCategory) return;
    setIsChanging(true);
    // Brief delay to allow for transition effect
    setTimeout(() => {
      setActiveCategory(categoryId);
      setIsChanging(false);
    }, 300);
  };

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();

  return (
    <div className="stats-leaders-section-wrapper">
      <div className="stats-leaders-redesigned-header">
        <div className="header-main-info">
          <h2 className="stats-section-title">
            <span className="title-accent">LEAGUE</span> LEADERS
          </h2>
          <div className="category-switcher">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => handleCategoryChange(cat.id)}
                aria-pressed={activeCategory === cat.id}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="header-actions">
          <div className="carousel-nav-buttons">
            <button className="nav-btn prev" onClick={scrollPrev} aria-label="Previous">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button className="nav-btn next" onClick={scrollNext} aria-label="Next">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
          <div className="actions-divider"></div>
          <a
            href="/stats/leaders"
            className="view-all-link"
            title="View all statistics"
          >
            VIEW ALL STATS
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </a>
        </div>
      </div>

      <div className={`stats-content-area ${isChanging ? 'fade-out' : 'fade-in'}`}>
        <StatsLeadersCarousel category={activeCategory} setApi={setEmblaApi} />
      </div>

      <style>{`
        .stats-leaders-section-wrapper {
          width: 100%;
          margin-bottom: var(--spacing-12);
        }

        .stats-leaders-redesigned-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: var(--spacing-8);
          border-bottom: 2px solid var(--color-gray-100);
          padding-bottom: var(--spacing-4);
          flex-wrap: wrap;
          gap: var(--spacing-6);
        }

        .header-main-info {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-4);
        }

        .stats-section-title {
          font-family: var(--font-heading);
          font-size: var(--font-size-4xl);
          margin: 0;
          line-height: 1;
          color: #000000 !important;
          letter-spacing: -0.02em;
        }

        .title-accent {
          color: #dd3333 !important;
        }

        .category-switcher {
          display: flex;
          gap: var(--spacing-2);
          background: #f3f4f6 !important; /* Solid gray-100 */
          padding: 6px;
          border-radius: var(--radius-md);
          width: fit-content;
          border: 1px solid #e5e7eb;
        }

        .category-btn {
          background: transparent !important;
          border: none !important;
          padding: 10px 20px !important;
          font-family: var(--font-heading) !important;
          font-weight: 700 !important;
          font-size: 1.1rem !important;
          color: #4b5563 !important; /* gray-600 */
          cursor: pointer;
          border-radius: var(--radius-sm) !important;
          transition: all 0.3s ease !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          line-height: 1 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .category-btn:hover {
          color: #dd3333 !important;
          background: rgba(221, 51, 51, 0.05) !important;
        }

        .category-btn.active {
          background: #dd3333 !important;
          color: #ffffff !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: var(--spacing-6);
          flex-wrap: wrap;
        }

        .carousel-nav-buttons {
          display: flex;
          gap: var(--spacing-2);
        }

        .nav-btn {
          background: #ffffff !important;
          border: 1px solid #e5e7eb !important;
          width: 40px !important;
          height: 40px !important;
          border-radius: 9999px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
          color: #1f2937 !important;
          padding: 0 !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
        }

        .nav-btn:hover {
          background: #dd3333 !important;
          border-color: #dd3333 !important;
          color: #ffffff !important;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
        }

        .actions-divider {
          width: 1px;
          height: 30px;
          background: #e5e7eb;
        }

        .view-all-link {
          display: flex !important;
          align-items: center !important;
          gap: var(--spacing-2) !important;
          font-family: var(--font-heading) !important;
          font-weight: 700 !important;
          font-size: 1.2rem !important;
          color: #000000 !important;
          text-decoration: none !important;
          transition: all 0.3s ease !important;
          padding-bottom: 0 !important;
        }

        .view-all-link svg {
          stroke: currentColor !important;
          transition: transform 0.3s ease !important;
        }

        .view-all-link:hover {
          color: #dd3333 !important;
        }

        .view-all-link:hover svg {
          transform: translateX(4px);
        }

        .stats-content-area {
          transition: opacity 0.3s ease;
        }

        .fade-out {
          opacity: 0;
        }

        .fade-in {
          opacity: 1;
        }

        @media (max-width: 768px) {
          .stats-leaders-redesigned-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .header-actions {
            width: 100%;
            justify-content: space-between;
          }

          .category-switcher {
            width: 100%;
            overflow-x: auto;
          }

          .category-btn {
            flex: 1;
            white-space: nowrap;
          }
          
          .actions-divider {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
