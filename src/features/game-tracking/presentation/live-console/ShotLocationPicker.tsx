/**
 * Half-court the scorer taps to say where a shot was taken. The zone numbers
 * drawn on it match keys 1–9. Same court lines as the shot charts.
 */
import type { MouseEvent } from 'react';
import { SHOT_ZONES, locationAt, type ShotLocation } from '../../domain/live-console/shotZones';
import { CHART_H, CHART_W, courtPaths } from '../../domain/live-console/shotChart';

const PATHS = courtPaths();

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

  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      onClick={tap}
      role="img"
      aria-label="Half court — tap where the shot was taken"
      className="mx-auto block w-full max-w-[280px] cursor-crosshair touch-manipulation select-none rounded-lg border border-[var(--bord)] bg-[var(--surf2)]"
      style={{ aspectRatio: `${CHART_W} / ${CHART_H}` }}
    >
      <path d={`${PATHS.key} Z`} fill="var(--chip)" />
      <g fill="none" stroke="var(--txm)" strokeWidth={0.8}>
        <path d={PATHS.key} />
        <path d={PATHS.ftCircle} />
        <path d={PATHS.three} />
        <path d={PATHS.restricted} />
        <path d={PATHS.rim} />
        <path d={PATHS.backboard} strokeWidth={1.6} />
      </g>
      {SHOT_ZONES.map((z, i) => {
        const strong = z.three === three;
        return (
          <g key={z.zone} pointerEvents="none" opacity={strong ? 1 : 0.45}>
            <circle cx={z.x * CHART_W} cy={z.y * CHART_H} r={6.5} fill={strong ? 'var(--tx)' : 'var(--chip)'} />
            <text
              x={z.x * CHART_W}
              y={z.y * CHART_H + 2.6}
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
