import * as React from 'react';
import { cn } from '@/lib/utils';

const ArenaPanel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] text-slate-100 shadow-[0_18px_48px_rgba(0,0,0,0.28)]',
      className,
    )}
    {...props}
  />
));
ArenaPanel.displayName = 'ArenaPanel';

const ArenaPanelHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col gap-1.5 border-b border-white/5 p-4 sm:p-5',
      className,
    )}
    {...props}
  />
));
ArenaPanelHeader.displayName = 'ArenaPanelHeader';

const ArenaPanelTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'font-heading text-2xl uppercase tracking-[0.08em] text-white',
      className,
    )}
    {...props}
  />
));
ArenaPanelTitle.displayName = 'ArenaPanelTitle';

const ArenaPanelContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-4 sm:p-5', className)} {...props} />
));
ArenaPanelContent.displayName = 'ArenaPanelContent';

const ArenaPanelFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center gap-2 border-t border-white/5 p-4 sm:p-5',
      className,
    )}
    {...props}
  />
));
ArenaPanelFooter.displayName = 'ArenaPanelFooter';

export {
  ArenaPanel,
  ArenaPanelHeader,
  ArenaPanelTitle,
  ArenaPanelContent,
  ArenaPanelFooter,
};
