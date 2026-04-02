/**
 * Half-court shot chart.
 *
 * Shows a simplified SVG half-court diagram.  Two modes:
 *  1. If any shot events include `metadata.x` / `metadata.y` (normalised
 *     0-1 values relative to the half-court), individual dots are plotted.
 *  2. Without coordinates, zone summary labels are overlaid on the diagram
 *     showing made/attempted for paint, three-point, and free-throw zones
 *     derived purely from event types.
 */

export interface ShotEvent {
  eventType: 'TWO_POINT_MADE' | 'TWO_POINT_MISSED' | 'THREE_POINT_MADE' | 'THREE_POINT_MISSED';
  made: boolean;
  /** Normalised 0-1 relative to full half-court width (left→right). */
  x?: number | null;
  /** Normalised 0-1 relative to full half-court depth (baseline→halfcourt line). */
  y?: number | null;
}

interface Props {
  shots: ShotEvent[];
  /** Display width of the SVG. Height is calculated automatically. */
  width?: number;
}

// Court dimensions (proportional to an NBA half-court @ 47×50 ft).
// We use a 280×264 viewBox.
const VW = 280;
const VH = 264;

// Key positions (all in viewBox units)
const BASKET_X = VW / 2;
const BASKET_Y = 30;
const KEY_W = 96;
const KEY_H = 110;
const KEY_X = (VW - KEY_W) / 2;
const KEY_Y = BASKET_Y;
const THREE_ARC_R = 185;
const FT_CIRCLE_R = 36;
const RESTRICTED_R = 16;
const CORNER_3_Y = 88; // Y at which the three-point line meets the side

function renderCourtLines() {
  return (
    <>
      {/* Half-court boundary */}
      <rect x={0} y={0} width={VW} height={VH} fill="#f5c878" stroke="#8b5e1e" strokeWidth="2" />

      {/* Half-court line */}
      <line x1={0} y1={VH} x2={VW} y2={VH} stroke="#8b5e1e" strokeWidth="1.5" />

      {/* Baseline */}
      <line x1={0} y1={0} x2={VW} y2={0} stroke="#8b5e1e" strokeWidth="2" />

      {/* Side lines */}
      <line x1={0} y1={0} x2={0} y2={VH} stroke="#8b5e1e" strokeWidth="2" />
      <line x1={VW} y1={0} x2={VW} y2={VH} stroke="#8b5e1e" strokeWidth="2" />

      {/* Key / lane */}
      <rect
        x={KEY_X} y={KEY_Y}
        width={KEY_W} height={KEY_H}
        fill="rgba(200,160,100,0.3)"
        stroke="#8b5e1e" strokeWidth="1.5"
      />

      {/* Free throw circle (top half only) */}
      <path
        d={`M ${BASKET_X - FT_CIRCLE_R} ${KEY_Y + KEY_H}
            A ${FT_CIRCLE_R} ${FT_CIRCLE_R} 0 0 0 ${BASKET_X + FT_CIRCLE_R} ${KEY_Y + KEY_H}`}
        fill="none" stroke="#8b5e1e" strokeWidth="1.5"
      />
      <path
        d={`M ${BASKET_X - FT_CIRCLE_R} ${KEY_Y + KEY_H}
            A ${FT_CIRCLE_R} ${FT_CIRCLE_R} 0 0 1 ${BASKET_X + FT_CIRCLE_R} ${KEY_Y + KEY_H}`}
        fill="none" stroke="#8b5e1e" strokeWidth="1.5" strokeDasharray="5,4"
      />

      {/* Three-point arc and corner lines */}
      <path
        d={`M 0 ${CORNER_3_Y}
            A ${THREE_ARC_R} ${THREE_ARC_R} 0 0 1 ${VW} ${CORNER_3_Y}`}
        fill="none" stroke="#8b5e1e" strokeWidth="1.5" clipPath="url(#courtClip)"
      />
      <line x1={0} y1={0} x2={0} y2={CORNER_3_Y} stroke="#8b5e1e" strokeWidth="1.5" />
      <line x1={VW} y1={0} x2={VW} y2={CORNER_3_Y} stroke="#8b5e1e" strokeWidth="1.5" />

      {/* Basket and restricted area */}
      <circle cx={BASKET_X} cy={BASKET_Y} r={8} fill="none" stroke="#8b5e1e" strokeWidth="2" />
      <circle cx={BASKET_X} cy={BASKET_Y} r={RESTRICTED_R} fill="none" stroke="#8b5e1e" strokeWidth="1.2" strokeDasharray="3,3" />

      {/* Backboard */}
      <line x1={BASKET_X - 20} y1={BASKET_Y - 12} x2={BASKET_X + 20} y2={BASKET_Y - 12} stroke="#8b5e1e" strokeWidth="3" />
    </>
  );
}

function ZoneLabel({
  x, y, label, made, attempted,
}: { x: number; y: number; label: string; made: number; attempted: number }) {
  if (attempted === 0) return null;
  const pct = ((made / attempted) * 100).toFixed(0);
  const isHot = made / attempted >= 0.45;
  const isCold = made / attempted < 0.25;
  const bg = isHot ? '#10b981' : isCold ? '#ef4444' : '#f59e0b';
  return (
    <g>
      <rect x={x - 26} y={y - 14} width={52} height={28} rx={5} fill={bg} fillOpacity={0.85} />
      <text x={x} y={y - 2} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">
        {made}/{attempted}
      </text>
      <text x={x} y={y + 10} textAnchor="middle" fill="white" fontSize={8}>
        {pct}%
      </text>
    </g>
  );
}

export default function ShotChart({ shots, width = 280 }: Props) {
  const scale = width / VW;
  const height = Math.round(VH * scale);

  // Tally zone stats
  const paintShots   = shots.filter((s) => s.eventType === 'TWO_POINT_MADE' || s.eventType === 'TWO_POINT_MISSED');
  const threeShots   = shots.filter((s) => s.eventType === 'THREE_POINT_MADE' || s.eventType === 'THREE_POINT_MISSED');
  const paintMade    = paintShots.filter((s) => s.made).length;
  const threeMade    = threeShots.filter((s) => s.made).length;

  // Check if any shots have coordinate data
  const hasDots = shots.some((s) => s.x != null && s.y != null);
  const showZones = !hasDots;

  if (shots.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 0', color: '#9ca3af', fontSize: '0.85rem' }}>
        <svg viewBox={`0 0 ${VW} ${VH}`} width={width} height={height} style={{ display: 'block', margin: '0 auto', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <defs>
            <clipPath id="courtClip"><rect x={0} y={0} width={VW} height={VH} /></clipPath>
          </defs>
          {renderCourtLines()}
          <text x={VW / 2} y={VH / 2} textAnchor="middle" fill="#9ca3af" fontSize={14}>No shot data</text>
        </svg>
      </div>
    );
  }

  return (
    <div>
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        width={width}
        height={height}
        style={{ display: 'block', borderRadius: '8px', border: '1px solid #d1d5db', overflow: 'hidden' }}
        aria-label="Shot chart"
      >
        <defs>
          <clipPath id="courtClip">
            <rect x={0} y={0} width={VW} height={VH} />
          </clipPath>
        </defs>

        {renderCourtLines()}

        {/* Zone labels when no coordinates available */}
        {showZones && (
          <>
            <ZoneLabel x={BASKET_X} y={KEY_Y + 60} label="Paint" made={paintMade} attempted={paintShots.length} />
            {threeShots.length > 0 && (
              <ZoneLabel x={BASKET_X} y={VH - 36} label="3PT" made={threeMade} attempted={threeShots.length} />
            )}
          </>
        )}

        {/* Dot plot when coordinates are available */}
        {hasDots && shots.map((shot, i) => {
          if (shot.x == null || shot.y == null) return null;
          const dotX = shot.x * VW;
          const dotY = shot.y * VH;
          return (
            <circle
              key={i}
              cx={dotX}
              cy={dotY}
              r={5}
              fill={shot.made ? '#10b981' : '#ef4444'}
              fillOpacity={0.75}
              stroke="white"
              strokeWidth={1}
            />
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '8px', fontSize: '0.75rem', color: '#6b7280' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          Made
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
          Missed
        </span>
        {!hasDots && (
          <span style={{ color: '#f59e0b' }}>Zone % = FG%</span>
        )}
      </div>
    </div>
  );
}
