import type { ReactNode } from 'react';
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m, type Transition } from 'motion/react';

export { m };

/**
 * Lets a dialog, drawer or popover animate out as well as in. Wrap the
 * conditional that mounts it — `<Presence>{open && <Dialog />}</Presence>` —
 * and build the overlay from `m.*` elements using the presets below. Loads only
 * Motion's DOM animation features, and turns motion off for people who ask
 * their system for reduced motion.
 */
export function Presence({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <AnimatePresence>{children}</AnimatePresence>
      </MotionConfig>
    </LazyMotion>
  );
}

const fade: Transition = { duration: 0.18, ease: 'easeOut' };

/** The dimmed layer behind a dialog or drawer. */
export const backdropMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: fade },
  exit: { opacity: 0, transition: { ...fade, delay: 0.04 } },
} as const;

/** A centred dialog: rises and settles in, drops slightly as it leaves. */
export const dialogMotion = {
  initial: { opacity: 0, y: 14, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 460, damping: 34 } },
  exit: { opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.14, ease: 'easeIn' } },
} as const;

/** A panel that slides in from the right edge. */
export const drawerMotion = {
  initial: { x: '100%' },
  animate: { x: 0, transition: { type: 'tween', duration: 0.3, ease: [0.32, 0.72, 0, 1] } },
  exit: { x: '100%', transition: { type: 'tween', duration: 0.22, ease: [0.4, 0, 1, 1] } },
} as const;

/** A dropdown under its trigger, e.g. search results. */
export const popoverMotion = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.16, ease: 'easeOut' } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.12, ease: 'easeIn' } },
} as const;
