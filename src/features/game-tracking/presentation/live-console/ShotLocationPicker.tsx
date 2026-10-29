/**
 * Half-court the scorer taps to say where a shot was taken. The zone numbers
 * drawn on it match keys 1–9. Drawn in decimetres (150 × 140) to FIBA lines,
 * basket at the top.
 */
import type { MouseEvent } from 'react';
import {
  BASKET,
  CORNER_DEPTH,
  CORNER_INSET,
  COURT_D,
  COURT_W,
  KEY_D,
  KEY_W,
  SHOT_ZONES,
  THREE_R,
  locationAt,
  type ShotLocation,
} from '../../domain/live-console/shotZones';

const S = 10; // metres → viewBox units
const VW = COURT_W * S;
const VH = COURT_D * S;

interface Props {
  /** The shot being placed is a three: its zones are emphasised. */
  three: boolean;
  onPick: (loc: ShotLocation) => void;
}

export default function ShotLocationPicker({ three, onPick }: Props) {
  const tap = (e: MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    onPick(locationAt((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height));
  };

  const bx = BASKET.x * S;
  const by = BASKET.y * S;
  const line = 'var(--txm)';
  const cornerY = CORNER_DEPTH * S;

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      onClick={tap}
      role="img"
      aria-label="Half court — tap where the shot was taken"
      className="mx-auto block w-full max-w-[280px] cursor-crosshair touch-manipulation select-none rounded-lg border border-[var(--bord)] bg-[var(--surf2)]"
      style={{ aspectRatio: `${VW} / ${VH}` }}
    >
      <g fill="none" stroke={line} strokeWidth={0.8}>
        <rect x={bx - (KEY_W * S) / 2} y={0} width={KEY_W * S} height={KEY_D * S} fill="var(--chip)" />
        <circle cx={bx} cy={KEY_D * S} r={18} />
        <path d={`M ${CORNER_INSET * S} 0 V ${cornerY} A ${THREE_R * S} ${THREE_R * S} 0 0 0 ${VW - CORNER_INSET * S} ${cornerY} V 0`} />
        <path d={`M ${bx - 12.5} ${by} A 12.5 12.5 0 0 0 ${bx + 12.5} ${by}`} />
        <line x1={bx - 9} y1={12} x2={bx + 9} y2={12} strokeWidth={1.6} />
        <circle cx={bx} cy={by} r={2.3} />
      </g>
      {SHOT_ZONES.map((z, i) => {
        const strong = z.three === three;
        return (
          <g key={z.zone} pointerEvents="none" opacity={strong ? 1 : 0.45}>
            <circle cx={z.x * VW} cy={z.y * VH} r={6.5} fill={strong ? 'var(--tx)' : 'var(--chip)'} />
            <text
              x={z.x * VW}
              y={z.y * VH + 2.6}
              textAnchor="middle"
              fontSize={7.5}
              fontWeight={700}
              fontFamily="ui-monospace, monospace"
              fill={strong ? 'var(--bg)' : 'var(--txd)'}
            >
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
