import { useEffect, useRef } from 'react';
import { sponsors } from '../data/homeData';

/**
 * Sponsors component - Sponsor carousel
 * Uses jQuery Owl Carousel
 */
export default function Sponsors() {
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).jQuery) {
      return;
    }

    const $ = (window as any).jQuery;
    const unique_class = 'stm-images-carousel-sponsors';
    const owl = $(carouselRef.current);

    const initCarousel = () => {
      if ($.fn.owlCarousel && owl.length) {
        const desktopItems = 5;
        owl.owlCarousel({
          items: 4,
          dots: false,
          autoplay: false,
          slideBy: 4,
          loop: true,
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
  }, []);

  return (
    <>
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
                <img
                  loading="lazy"
                  decoding="async"
                  src={sponsor.image}
                  width={sponsor.width}
                  height={sponsor.height}
                  alt={sponsor.alt}
                  title={sponsor.title}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

