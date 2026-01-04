import { useEffect, useRef } from 'react';

interface CarouselProps {
  children: React.ReactNode;
  className?: string;
  items?: number;
  autoplay?: boolean;
  loop?: boolean;
  uniqueId: string;
  onInit?: (owl: any) => void;
}

/**
 * Reusable Carousel component using jQuery Owl Carousel
 * Wraps existing jQuery carousel functionality
 */
export default function Carousel({
  children,
  className = '',
  items = 4,
  autoplay = false,
  loop = true,
  uniqueId,
  onInit,
}: CarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).jQuery) {
      return;
    }

    const $ = (window as any).jQuery;
    const owl = $(carouselRef.current);

    const initCarousel = () => {
      owl.owlCarousel({
        items,
        dots: false,
        autoplay,
        slideBy: items,
        loop,
        responsive: {
          0: {
            items: 1,
            slideBy: 1,
          },
          440: {
            items: 2,
            slideBy: 2,
          },
          768: {
            items: 3,
            slideBy: 3,
          },
          992: {
            items: items >= 3 ? 3 : items,
            slideBy: items >= 3 ? 3 : items,
          },
          1100: {
            items,
            slideBy: items,
          },
        },
      });

      if (onInit) {
        onInit(owl);
      }
    };

    if ($.fn.owlCarousel) {
      initCarousel();
    } else {
      // Wait for owl carousel to load
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
  }, [items, autoplay, loop, uniqueId, onInit]);

  return (
    <div ref={carouselRef} className={className}>
      {children}
    </div>
  );
}

