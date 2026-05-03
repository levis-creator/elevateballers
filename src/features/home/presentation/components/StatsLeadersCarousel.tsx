import { useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { resolveAssetUrl } from '../../../../lib/asset-url';

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
  statValue?: string;
  statLabel?: string;
}

interface StatsLeadersCarouselProps {
  category?: string;
  setApi?: (api: any) => void;
}

const PLAYER_IMAGE_FALLBACK = '/images/default-player.png';

function getPlayerImageSrc(image: string | null | undefined) {
  return resolveAssetUrl(image) || PLAYER_IMAGE_FALLBACK;
}

/**
 * StatsLeadersCarousel component
 * Displays a carousel of top players in a specific category
 */
export default function StatsLeadersCarousel({ category = 'points', setApi }: StatsLeadersCarouselProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Embla Carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 1024px)': { slidesToScroll: 1 },
      '(min-width: 768px)': { slidesToScroll: 1 },
      '(min-width: 440px)': { slidesToScroll: 1 },
    },
  });

  // Pass Embla API up to parent whenever it's available
  useEffect(() => {
    if (emblaApi && setApi) {
      setApi(emblaApi);
    }
  }, [emblaApi, setApi]);

  // Fetch players data whenever category changes
  useEffect(() => {
    async function fetchPlayers() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/players/leaders?category=${category}&limit=10`);
        if (!response.ok) {
          throw new Error('Failed to fetch stats leaders');
        }

        const apiPlayers: any[] = await response.json();

        const transformedPlayers: Player[] = apiPlayers.map((player) => {
          const name = `${player.firstName} ${player.lastName}`.trim() || 'Unknown Player';
          const number = player.jerseyNumber?.toString() || '00';
          const image = getPlayerImageSrc(player.image);
          
          const stats = player.stats || {};
          const statValue = stats[category] || '0';
          const labels: Record<string, string> = {
            points: 'PTS',
            assists: 'AST',
            rebounds: 'REB'
          };

          return {
            id: player.id,
            number,
            name,
            position: player.position || 'Forward',
            image,
            url: `/players/${player.slug || player.id}`,
            statValue: statValue.toString(),
            statLabel: labels[category] || category.toUpperCase()
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
  }, [category]);

  if (loading && players.length === 0) {
    return (
      <div className="stats-players-loading">
        <div className="loader-dots">
          <span></span><span></span><span></span>
        </div>
        <p>Fetching the leaders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-error">
        <p>No leaders found for this category.</p>
      </div>
    );
  }

  return (
    <div className="stats-leaders-carousel-inner">
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          {players.map((player, index) => (
            <div key={`${player.id}-${index}`} className="embla__slide">
              <div className="player-card-premium">
                <div className="player-image-box">
                  <img 
                    src={getPlayerImageSrc(player.image)}
                    alt={player.name || 'Player photo'}
                    className="player-photo"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = PLAYER_IMAGE_FALLBACK;
                    }}
                  />
                  <div className="player-rank">#{index + 1}</div>
                  <div className="player-overlay"></div>
                </div>
                
                <div className="player-info-premium">
                  <div className="player-meta">
                    <span className="player-num">#{player.number}</span>
                    <span className="player-pos">{player.position}</span>
                  </div>
                  <h3 className="player-name-link">
                    <a href={player.url}>{player.name}</a>
                  </h3>
                  <div className="player-stat-box">
                    <span className="stat-val">{player.statValue}</span>
                    <span className="stat-lbl">{player.statLabel}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .stats-leaders-carousel-inner {
          position: relative;
          width: 100%;
        }

        .embla {
          overflow: hidden;
          cursor: grab;
          margin: 0 calc(var(--spacing-4) * -1);
          padding: 0 var(--spacing-4);
        }

        .embla:active {
          cursor: grabbing;
        }

        .embla__container {
          display: flex;
          gap: var(--spacing-6);
        }

        .embla__slide {
          flex: 0 0 100%;
          min-width: 0;
          padding: var(--spacing-4) 0;
        }

        @media (min-width: 480px) {
          .embla__slide { flex: 0 0 calc(50% - 12px); }
        }

        @media (min-width: 768px) {
          .embla__slide { flex: 0 0 calc(33.333% - 16px); }
        }

        @media (min-width: 1024px) {
          .embla__slide { flex: 0 0 calc(25% - 18px); }
        }

        /* Player Card Premium Styles */
        .player-card-premium {
          background: #ffffff !important;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
          height: 100%;
          display: flex;
          flex-direction: column;
          border: 1px solid #f3f4f6;
        }

        .player-card-premium:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.1);
          border-color: #dd3333;
        }

        .player-image-box {
          position: relative;
          aspect-ratio: 4/5;
          overflow: hidden;
          background: #f3f4f6;
        }

        .player-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .player-card-premium:hover .player-photo {
          transform: scale(1.1);
        }

        .player-rank {
          position: absolute;
          top: 12px;
          left: 12px;
          background: #dd3333 !important;
          color: #ffffff !important;
          padding: 4px 10px;
          font-family: inherit;
          font-weight: 700;
          font-size: 1.2rem;
          border-radius: 4px;
          z-index: 2;
        }

        .player-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 40%;
          background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%);
          z-index: 1;
        }

        .player-info-premium {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex-grow: 1;
        }

        .player-meta {
          display: flex;
          justify-content: space-between;
          font-weight: 600;
          color: #6b7280;
          font-size: 0.9rem;
          text-transform: uppercase;
        }

        .player-name-link {
          margin: 0;
          font-size: 1.5rem;
          line-height: 1.2;
        }

        .player-name-link a {
          color: #111827 !important;
          text-decoration: none !important;
        }

        .player-name-link a:hover {
          color: #dd3333 !important;
        }

        .player-stat-box {
          margin-top: auto;
          display: flex;
          align-items: baseline;
          gap: 6px;
          padding-top: 0.5rem;
        }

        .stat-val {
          font-size: 2.5rem;
          font-weight: 700;
          color: #dd3333 !important;
          line-height: 1;
        }

        .stat-lbl {
          font-size: 1rem;
          font-weight: 600;
          color: #4b5563;
          text-transform: uppercase;
        }

        /* Loading & Error */
        .stats-players-loading {
          padding: 4rem 0;
          text-align: center;
          color: #6b7280;
        }

        .loader-dots {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 1rem;
        }

        .loader-dots span {
          width: 10px;
          height: 10px;
          background: #dd3333;
          border-radius: 50%;
          animation: bounce 0.6s infinite alternate;
        }

        .loader-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loader-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes bounce {
          to { opacity: 0.3; transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
