import { useEffect, useRef, useState } from 'react';

interface Sponsor {
  id: string;
  name: string;
  image: string;
  link?: string;
}

/**
 * Sponsors component - Sponsor carousel
 * Uses jQuery Owl Carousel
 */
export default function Sponsors() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        const response = await fetch('/api/highlights/sponsors?active=true');
        if (response.ok) {
          const data = await response.json();
          setSponsors(Array.isArray(data) ? data : []);
        } else {
          setSponsors([]);
        }
      } catch (error) {
        console.error('Error fetching sponsors:', error);
        setSponsors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSponsors();
  }, []);

  useEffect(() => {
    if (loading || typeof window === 'undefined' || !(window as any).jQuery || sponsors.length === 0) {
      return;
    }

    const $ = (window as any).jQuery;
    const owl = $(carouselRef.current);

    const initCarousel = () => {
      if ($.fn.owlCarousel && owl.length) {
        const desktopItems = 5;
        owl.owlCarousel({
          items: 4,
          dots: false,
          autoplay: false,
          slideBy: 4,
          loop: sponsors.length > 4, // Only loop if we have enough items
          responsive: {
            0: {
              items: 1,
              slideBy: 1,
            },
            420: {
              items: 3,
              slideBy: 3,
            },
            768: {
              items: 3,
              slideBy: 3,
            },
            992: {
              items: 4,
              slideBy: 4,
            },
            1100: {
              items: desktopItems,
              slideBy: desktopItems,
            },
          },
        });
      }
    };

    if ($.fn.owlCarousel) {
      initCarousel();
    } else {
      const checkInterval = setInterval(() => {
        if ($.fn.owlCarousel) {
          clearInterval(checkInterval);
          initCarousel();
        }
      }, 100);

      return () => clearInterval(checkInterval);
    }

    return () => {
      if (owl && owl.data('owl.carousel')) {
        owl.trigger('destroy.owl.carousel');
      }
    };
  }, [loading, sponsors]);

  // Hide the entire section when there's nothing to show — including during the
  // initial fetch — so the page never reserves empty grey space for sponsors.
  if (loading || sponsors.length === 0) return null;

  return (
    <section className="sponsors-section section" aria-label="Our sponsors">
      <div className="container">
        <h2 style={{ fontSize: '50px', textAlign: 'center' }} className="vc_custom_heading">
          Our Sponsors
        </h2>
        <div className="stm-image-carousel stm-images-carousel-sponsors">
          <div className="clearfix">
            <div className="stm-carousel-controls-right stm-image-controls" style={{ display: 'none' }}>
              <div className="stm-carousel-control-prev">
                <i className="fa fa-angle-left" />
              </div>
              <div className="stm-carousel-control-next">
                <i className="fa fa-angle-right" />
              </div>
            </div>
          </div>

          <div className="stm-image-carousel-init-unit">
            <div ref={carouselRef} className="stm-image-carousel-init">
              {sponsors.map((sponsor) => (
                <div key={sponsor.id} className="stm-single-image-carousel">
                  {sponsor.link ? (
                    <a href={sponsor.link} target="_blank" rel="noopener noreferrer">
                      <img
                        decoding="async"
                        src={sponsor.image}
                        alt={sponsor.name || 'Sponsor logo'}
                        title={sponsor.name}
                      />
                    </a>
                  ) : (
                    <img
                      decoding="async"
                      src={sponsor.image}
                      alt={sponsor.name || 'Sponsor logo'}
                      title={sponsor.name}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

