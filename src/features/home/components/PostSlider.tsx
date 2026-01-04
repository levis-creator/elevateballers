import { useEffect, useState } from 'react';
import { useCarouselStore } from '../stores/useCarouselStore';
import type { PostSlide } from '../types';
import { reverseCategoryMap } from '../../cms/types';
import type { NewsArticleDTO } from '../../cms/types';

/**
 * PostSlider component - Hero post slider carousel
 * Displays featured news articles from the database
 */
export default function PostSlider() {
  const { currentSlide, goToSlide, setTotalSlides } = useCarouselStore();
  const [slides, setSlides] = useState<PostSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /**
     * Fetch featured news articles from the API
     */
    async function fetchFeaturedArticles() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/news?featured=true');
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          throw new Error(`Failed to fetch featured articles: ${response.status} ${response.statusText}`);
        }
        
        const articles: NewsArticleDTO[] = await response.json();
        
        console.log('Fetched featured articles:', articles.length);
        
        if (articles.length === 0) {
          console.warn('No featured articles found. Make sure you have articles with feature=true and published=true in the database.');
        }
        
        // Limit to 5 featured articles (client-side backup in case API returns more)
        const limitedArticles = articles.slice(0, 5);
        
        // Map NewsArticle to PostSlide format
        const mappedSlides: PostSlide[] = limitedArticles.map((article) => {
          // Process excerpt: strip HTML tags and truncate to one line
          let processedExcerpt = article.excerpt || '';
          
          // Strip HTML tags using regex (works in React/browser environment)
          if (typeof window !== 'undefined') {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = processedExcerpt;
            processedExcerpt = tempDiv.textContent || tempDiv.innerText || '';
          } else {
            // Fallback: simple regex to strip HTML tags (for SSR safety)
            processedExcerpt = processedExcerpt.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
          }
          
          // Truncate to approximately 150-180 characters (roughly 2-3 lines)
          // This allows for a more natural paragraph-like appearance
          if (processedExcerpt.length > 180) {
            processedExcerpt = processedExcerpt.substring(0, 180).trim() + '...';
          }
          
          return {
            id: article.id,
            image: article.image || '/images/default-slide.jpg',
            category: reverseCategoryMap[article.category] || article.category,
            title: article.title,
            excerpt: processedExcerpt,
            url: `/news/${article.slug}`,
            shareUrl: `/news/${article.slug}`,
          };
        });
        
        setSlides(mappedSlides);
      } catch (err) {
        console.error('Error fetching featured articles:', err);
        setError(err instanceof Error ? err.message : 'Failed to load featured articles');
        setSlides([]);
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedArticles();
  }, []);

  useEffect(() => {
    if (slides.length > 0) {
      setTotalSlides(slides.length);
    }
  }, [slides.length, setTotalSlides]);

  useEffect(() => {
    // Update active slide in DOM
    if (slides.length === 0) return;
    
    const slideElements = document.querySelectorAll('.stm-slide');
    slideElements.forEach((el, index) => {
      if (index === currentSlide) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Update navigation
    const navElements = document.querySelectorAll('.stm-post__slider__nav li');
    navElements.forEach((el, index) => {
      if (index === currentSlide) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }, [currentSlide, slides.length]);

  if (loading) {
    return (
      <div className="stm-post__slider container">
        <div className="stm-post__slides">
          <div className="stm-slide active">
            <div className="stm-post__slider__data container">
              <div className="row">
                <div className="col-md-7 col-sm-6">
                  <div className="stm-slide__title heading-font">Loading featured articles...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('PostSlider error:', error);
    return null; // Don't render if there's an error
  }

  if (slides.length === 0) {
    // Silently return null if no featured articles (this is expected if none are marked as featured)
    return null;
  }

  return (
    <>
      <div className="stm-post__slider container">
        <div className="stm-post__slides">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`stm-slide ${index === currentSlide ? 'active' : ''}`}
              id={slide.id}
            >
              <div
                className="stm-post__slider__image"
                style={{ backgroundImage: `url(${slide.image})` }}
              />
              <div className="stm-post__slider__data container">
                <div className="row">
                  <div className="col-md-7 col-sm-6">
                    <span className="stm-slide__category">{slide.category}</span>
                    <div className="stm-slide__title heading-font">{slide.title}</div>
                    <div
                      className="stm-slide__excerpt"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: '1.5',
                        maxHeight: '4.5em', // Approximately 3 lines
                      }}
                    >
                      {slide.excerpt}
                    </div>
                    <a href={slide.url} className="stm-slide__link heading-font">
                      Read more <i className="icon-mg-icon-arrow-italic" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <ul className="stm-post__slider__nav">
          {slides.map((slide, index) => (
            <li
              key={slide.id}
              className={index === currentSlide ? 'active' : ''}
            >
              <a
                href={`#${slide.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  goToSlide(index);
                }}
              >
                {slide.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

