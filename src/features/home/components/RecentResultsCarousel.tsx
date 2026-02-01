import { useEffect, useRef, useState } from 'react';
import type { Match } from '@prisma/client';
import { formatMatchDate } from '../../matches/lib/utils';
import { getLeagueName } from '../../matches/lib/league-helpers';

/**
 * RecentResultsCarousel component - Completed matches carousel
 * Uses jQuery Owl Carousel
 */
export default function RecentResultsCarousel() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch completed matches
    fetch('/api/matches?status=completed')
      .then((res) => res.json())
      .then((data) => {
        setMatches(data.slice(0, 5)); // Limit to 5 matches
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching results:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).jQuery || matches.length === 0) {
      return;
    }

    const $ = (window as any).jQuery;
    const owl = $(carouselRef.current);

    const initCarousel = () => {
      if ($.fn.owlCarousel && owl.length) {
        owl.owlCarousel({
          items: 1,
          dots: true,
          nav: false,
          autoplay: false,
          loop: matches.length > 1,
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
  }, [matches]);

  if (loading) {
    return (
      <div className="stm-next-match-carousel-wrap style_3 results-style">
        <h2 className="stm-carousel-title">RECENT RESULTS</h2>
        <div className="loading-matches">Loading results...</div>
      </div>
    );
  }

  if (matches.length === 0) {
    return null; // Don't show if no results
  }

  return (
    <div className="stm-next-match-carousel-wrap style_3 results-style">
      <h2 className="stm-carousel-title" style={{ backgroundColor: '#10b981' }}>RECENT RESULTS</h2>
      <div className="stm-next-match-carousel2">
        <div ref={carouselRef} className="stm-next-match-carousel__item">
          {matches.map((match) => (
            <div key={match.id} className="stm-next-match-carousel__item">
              <div className="event-results results-score">
                 <div className="team-logo-wrap">
                    {match.team1Logo && (
                      <img
                        decoding="async"
                        src={match.team1Logo}
                        alt={match.team1Name ?? ''}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                 </div>
                 <div className="final-score heading-font">
                    {match.team1Score} - {match.team2Score}
                 </div>
                 <div className="team-logo-wrap">
                    {match.team2Logo && (
                      <img
                        decoding="async"
                        src={match.team2Logo}
                        alt={match.team2Name ?? ''}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                 </div>
              </div>
              <div className="event-data">
                <div className="teams-titles">
                  <a href={`/matches/${match.id}`}>
                    {match.team1Name} vs {match.team2Name}
                  </a>
                </div>
                <div className="event-league">{getLeagueName(match) || match.leagueName || ''}</div>
              </div>
              <div className="event-date">{formatMatchDate(match.date)}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .results-style .stm-carousel-title {
          background-color: #10b981 !important;
        }
        .results-score {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
        }
        .final-score {
          font-size: 28px;
          font-weight: 900;
          color: #fff;
          background: rgba(0,0,0,0.3);
          padding: 5px 15px;
          border-radius: 4px;
        }
        .team-logo-wrap img {
          max-width: 60px;
          height: auto;
        }
      `}</style>
    </div>
  );
}
