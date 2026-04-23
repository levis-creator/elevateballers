import { cn } from '@/lib/utils';

interface CourtTileProps {
  jersey: number | string | null | undefined;
  name: string;
  side: 'home' | 'away';
  armed: boolean;
  disabled?: boolean;
  onTap: () => void;
}

export default function CourtTile({
  jersey,
  name,
  side,
  armed,
  disabled = false,
  onTap,
}: CourtTileProps) {
  const jerseyLabel =
    jersey !== null && jersey !== undefined && jersey !== '' ? `${jersey}` : '—';
  return (
    <button
      type="button"
      onClick={onTap}
      disabled={disabled}
      aria-pressed={armed}
      className={cn(
        'group relative flex w-full flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition-all duration-150 will-change-transform',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-deeper',
        'disabled:pointer-events-none disabled:opacity-40',
        // Press-down on tap so every arm feels physical.
        'active:translate-y-0 active:scale-[0.98]',
        side === 'home'
          ? 'border-sky-400/25 bg-sky-500/5 hover:-translate-y-0.5 hover:border-sky-300/60 hover:bg-sky-500/15 hover:shadow-[0_10px_22px_-10px_rgba(56,189,248,0.45)]'
          : 'border-rose-400/25 bg-rose-500/5 hover:-translate-y-0.5 hover:border-rose-300/60 hover:bg-rose-500/15 hover:shadow-[0_10px_22px_-10px_rgba(251,113,133,0.45)]',
        // Armed state wins: stronger gold shadow + keeps its scale-up. The
        // `hover:` lift is suppressed here so the armed tile doesn't twitch.
        armed &&
          'scale-[1.04] border-brand-gold bg-brand-gold/20 shadow-[0_0_0_3px_rgba(255,186,0,0.25),0_10px_28px_-8px_rgba(255,186,0,0.55)] ring-2 ring-brand-gold hover:-translate-y-0 hover:shadow-[0_0_0_3px_rgba(255,186,0,0.3),0_14px_32px_-8px_rgba(255,186,0,0.65)]',
      )}
    >
      <span
        className={cn(
          'font-heading text-3xl leading-none tabular-nums',
          armed ? 'text-brand-gold' : side === 'home' ? 'text-sky-100' : 'text-rose-100',
        )}
      >
        {jerseyLabel}
      </span>
      <span
        className={cn(
          'line-clamp-1 w-full text-[0.7rem] font-medium uppercase tracking-[0.08em]',
          armed ? 'text-brand-gold/90' : 'text-white/75',
        )}
        title={name}
      >
        {name}
      </span>
    </button>
  );
}
