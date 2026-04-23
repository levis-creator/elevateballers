import * as React from 'react';
import { cn } from '@/lib/utils';

type ArenaChipTone = 'gold' | 'live' | 'muted' | 'success' | 'danger';

interface ArenaChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: ArenaChipTone;
  pulse?: boolean;
}

const TONE_CLASSES: Record<ArenaChipTone, string> = {
  gold: 'bg-brand-gold text-[#261f45]',
  live: 'bg-brand-red text-white',
  muted: 'bg-white/10 text-white',
  success: 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/40',
  danger: 'bg-red-500/20 text-red-200 ring-1 ring-red-400/40',
};

const ArenaChip = React.forwardRef<HTMLSpanElement, ArenaChipProps>(
  ({ className, tone = 'gold', pulse = false, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.72rem] font-extrabold uppercase tracking-[0.18em] leading-none',
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-80" />
          <span className="relative inline-flex size-1.5 rounded-full bg-white" />
        </span>
      )}
      {children}
    </span>
  ),
);
ArenaChip.displayName = 'ArenaChip';

export { ArenaChip };
export type { ArenaChipTone };
