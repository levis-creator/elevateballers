import { useGameTrackingStore } from '../../stores/useGameTrackingStore';
import { formatClockTime } from '../../lib/utils';

interface LiveClockTextProps {
  /** Shown while the store's localClockSeconds is null. */
  fallbackSeconds?: number | null;
}

/**
 * Isolated subscriber to `localClockSeconds`. The clock ticks once per second
 * while running; putting the subscription here keeps the per-second re-render
 * scoped to a ~10-char text node rather than propagating to the whole panel
 * header (which would then repaint dozens of tiles around it).
 */
export default function LiveClockText({ fallbackSeconds = null }: LiveClockTextProps) {
  const seconds = useGameTrackingStore((s) => s.localClockSeconds);
  const resolved = seconds ?? fallbackSeconds;
  if (resolved === null || resolved === undefined) return null;
  return <>{formatClockTime(resolved)}</>;
}
