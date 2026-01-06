import { useRef } from 'react';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import pkg from 'react-lazy-load-image-component';
const { LazyLoadImage } = pkg;
import 'react-lazy-load-image-component/src/effects/blur.css';
import { stats } from '../data/homeData';

/**
 * StatsSection component - Animated statistics section
 * Migrated from jQuery CounterUp and Waypoints to React CountUp and Intersection Observer
 */
export default function StatsSection() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  return (
    <div ref={ref} className="stm-statistics-wrapper">
      <div className="vc_row wpb_row vc_inner vc_row-fluid">
        {stats.map((stat, index) => (
          <div key={stat.id} className="wpb_column vc_column_container vc_col-sm-6 vc_col-lg-3 vc_col-md-3">
            <div className="vc_column-inner">
              <div className="wpb_wrapper">
                <div className="stm-stats-wrapp default">
                  {/* Lazy load icons with blur effect */}
                  <LazyLoadImage
                    src={stat.icon}
                    alt={stat.iconAlt || stat.label}
                    effect="blur"
                    wrapperClassName="stm-stat-icon-wrapper"
                  />
                  <div className="stm-stat-info-wrapp">
                    <span className="stm-stat-points heading-font">
                      {inView ? (
                        <CountUp
                          start={0}
                          end={stat.value}
                          duration={2.5}
                          separator=","
                        />
                      ) : (
                        '0'
                      )}
                    </span>
                    <span className="stm-stat-title normal_font">{stat.label}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Conditional spacing based on index for responsiveness */}
            <div className={`stm-spacing-stat-${index + 1} vc_empty_space ${index === 0 ? 'visible-xs' : index === 1 ? 'visible-sm visible-xs' : index === 2 ? 'visible-sm visible-xs' : ''}`} style={{ height: '30px' }}>
              <span className="vc_empty_space_inner"></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
