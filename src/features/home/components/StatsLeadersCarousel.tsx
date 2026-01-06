import { useEffect, useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';

/**
 * Player interface for Stats Leaders
 */
interface Player {
  id: string;
  number: string;
  name: string;
  position: string;
  image: string;
  url: string;
}

/**
 * StatsLeadersCarousel component
 * Replaces Owl Carousel with Embla Carousel for the Stats Leaders section
 * Maintains the exact same visual design and responsive behavior
 */
export default function StatsLeadersCarousel() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Embla Carousel with responsive settings
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 1100px)': { slidesToScroll: 4 },
      '(min-width: 992px) and (max-width: 1099px)': { slidesToScroll: 3 },
      '(min-width: 768px) and (max-width: 991px)': { slidesToScroll: 3 },
      '(min-width: 440px) and (max-width: 767px)': { slidesToScroll: 2 },
    },
  });

  // Navigation handlers
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Fetch players data
  useEffect(() => {
    async function fetchPlayers() {
      try {
        setLoading(true);
        setError(null);

        // TODO: Replace with actual API endpoint when available
        // For now, using mock data that matches the expected structure
        const mockPlayers: Player[] = [
          {
            id: '1',
            number: '23',
            name: 'John Doe',
            position: 'Point Guard',
            image: '/images/players/player-1.jpg',
            url: '/players/john-doe',
          },
          {
            id: '2',
            number: '7',
            name: 'Jane Smith',
            position: 'Shooting Guard',
            image: '/images/players/player-2.jpg',
            url: '/players/jane-smith',
          },
          {
            id: '3',
            number: '15',
            name: 'Mike Johnson',
            position: 'Small Forward',
            image: '/images/players/player-3.jpg',
            url: '/players/mike-johnson',
          },
          {
            id: '4',
            number: '32',
            name: 'Sarah Williams',
            position: 'Power Forward',
            image: '/images/players/player-4.jpg',
            url: '/players/sarah-williams',
          },
          {
            id: '5',
            number: '11',
            name: 'David Brown',
            position: 'Center',
            image: '/images/players/player-5.jpg',
            url: '/players/david-brown',
          },
          {
            id: '6',
            number: '3',
            name: 'Emily Davis',
            position: 'Point Guard',
            image: '/images/players/player-6.jpg',
            url: '/players/emily-davis',
          },
          {
            id: '7',
            number: '21',
            name: 'Chris Wilson',
            position: 'Shooting Guard',
            image: '/images/players/player-7.jpg',
            url: '/players/chris-wilson',
          },
          {
            id: '8',
            number: '9',
            name: 'Lisa Anderson',
            position: 'Small Forward',
            image: '/images/players/player-8.jpg',
            url: '/players/lisa-anderson',
          },
        ];

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        setPlayers(mockPlayers);
      } catch (err) {
        console.error('Error fetching players:', err);
        setError(err instanceof Error ? err.message : 'Failed to load players');
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPlayers();
  }, []);

  if (loading) {
    return (
      <div className="stats-players-wrapper">
        <div className="stm-player-ids style_2 stm-players-5715 carousel_yes">
          <div className="stm-player-list-wrapper">
            <div className="stm-players clearfix">
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                Loading players...
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('StatsLeadersCarousel error:', error);
    return null; // Silently fail
  }

  if (players.length === 0) {
    return null; // No players to display
  }

  return (
    <div className="stats-players-wrapper">
      <div className="stm-player-ids style_2 stm-players-5715 carousel_yes">
        <div className="clearfix">
          <div className="stm-carousel-controls-center">
            <button
              className="stm-carousel-control-prev"
              onClick={scrollPrev}
              aria-label="Previous players"
              type="button"
            >
              <i className="fa fa-angle-left" aria-hidden="true"></i>
            </button>
            <button
              className="stm-carousel-control-next"
              onClick={scrollNext}
              aria-label="Next players"
              type="button"
            >
              <i className="fa fa-angle-right" aria-hidden="true"></i>
            </button>
          </div>
        </div>
        <div className="stm-player-list-wrapper">
          <div className="embla" ref={emblaRef}>
            <div className="embla__container stm-players clearfix">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="embla__slide stm-list-single-player"
                  style={{
                    flex: '0 0 100%',
                    minWidth: 0,
                  }}
                >
                  <a href={player.url} title={player.name}>
                    <img
                      src={player.image}
                      alt={player.name}
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        e.currentTarget.src = '/images/default-player.jpg';
                      }}
                    />
                    <div className="stm-list-single-player-info">
                      <div className="inner">
                        <div className="player-number">{player.number}</div>
                        <div className="player-title">{player.name}</div>
                        <div className="player-position">{player.position}</div>
                      </div>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* Embla Carousel specific styles */
        .embla {
          overflow: hidden;
        }
        
        .embla__container {
          display: flex;
          gap: 0;
        }
        
        .embla__slide {
          flex: 0 0 100%;
          min-width: 0;
        }
        
        /* Responsive breakpoints matching Owl Carousel config */
        @media (min-width: 440px) {
          .embla__slide {
            flex: 0 0 50%;
          }
        }
        
        @media (min-width: 768px) {
          .embla__slide {
            flex: 0 0 33.333%;
          }
        }
        
        @media (min-width: 992px) {
          .embla__slide {
            flex: 0 0 33.333%;
          }
        }
        
        @media (min-width: 1100px) {
          .embla__slide {
            flex: 0 0 25%;
          }
        }
      `}</style>
    </div>
  );
}
