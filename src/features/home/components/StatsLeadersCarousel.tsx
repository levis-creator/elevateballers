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
 * API Player response interface
 */
interface ApiPlayer {
  id: string;
  firstName: string | null;
  lastName: string | null;
  jerseyNumber: number | null;
  position: string | null;
  image: string | null;
  approved: boolean;
}

/**
 * StatsLeadersCarousel component
 * Replaces Owl Carousel with Embla Carousel for the Stats Leaders section
 * Fetches and displays only approved players from the API
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

  // Fetch players data - only approved players are returned by the API for public access
  useEffect(() => {
    async function fetchPlayers() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/players');
        if (!response.ok) {
          throw new Error('Failed to fetch players');
        }

        const apiPlayers: ApiPlayer[] = await response.json();

        // Transform API players to component format
        // The API already filters by approved: true for public access
        const transformedPlayers: Player[] = apiPlayers
          .filter((player) => player.approved === true) // Extra safety check
          .map((player) => {
            // Build full name
            const name = [player.firstName, player.lastName]
              .filter(Boolean)
              .join(' ') || 'Unknown Player';

            // Build jersey number string
            const number = player.jerseyNumber?.toString() || '';

            // Use player image or default placeholder
            const image = player.image || '/images/default-player.png';

            return {
              id: player.id,
              number,
              name,
              position: player.position || '',
              image,
              url: `/players/${player.id}`,
            };
          });

        setPlayers(transformedPlayers);
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
                        e.currentTarget.src = '/images/default-player.png';
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
