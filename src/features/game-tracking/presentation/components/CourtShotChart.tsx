/**
 * Half-court shot chart: made shots filled, misses as rings. Colours come in
 * as props so the same chart sits on the public site and in the match centre.
 */
import { CHART_H, CHART_W, chartPoint, courtPaths, type ChartShot } from '../../domain/live-console/shotChart';

interface Props {
  shots: ChartShot[];
  /** Fill for made shots and outline for misses. */
  color: string;
  /** Court line colour. */
  line: string;
  /** Court background and paint tint. */
  floor: string;
  paint: string;
  className?: string;
  label?: string;
}

const PATHS = courtPaths();

export default function CourtShotChart({ shots, color, line, floor, paint, className, label }: Props) {
  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      role="img"
      aria-label={label ?? `Shot chart, ${shots.length} shots`}
      className={className}
      style={{ aspectRatio: `${CHART_W} / ${CHART_H}` }}
    >
      <path d={PATHS.outline} fill={floor} />
      <path d={`${PATHS.key} Z`} fill={paint} />
      <g fill="none" stroke={line} strokeWidth={0.8}>
        <path d={PATHS.key} />
        <path d={PATHS.ftCircle} />
        <path d={PATHS.three} />
        <path d={PATHS.restricted} />
        <path d={PATHS.rim} />
        <path d={PATHS.backboard} strokeWidth={1.6} />
      </g>
      {shots.map((s, i) => {
        const { cx, cy } = chartPoint(s);
        return s.made ? (
          <circle key={i} cx={cx} cy={cy} r={2.6} fill={color} stroke={floor} strokeWidth={0.5} />
        ) : (
          <circle key={i} cx={cx} cy={cy} r={2.2} fill="none" stroke={color} strokeWidth={1} opacity={0.8} />
        );
      })}
    </svg>
  );
}
