import { useEffect, useLayoutEffect, useState } from 'react';

// useLayoutEffect on the client, useEffect on the server (avoids the SSR warning).
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * The current pathname, for admin islands living in the persisted <ClientRouter />
 * shell. Astro has no React location hook, so this wraps the idiomatic primitives:
 *
 * - SSR-safe: returns '' on the server and the first hydration render, so there's
 *   no hydration mismatch.
 * - Resolved before paint (layout effect), so path-dependent UI doesn't flash.
 * - Reactive to client-side navigations via the `astro:page-load` event — the
 *   shell never remounts, so a plain mount-only read would go stale.
 */
export function usePathname(): string {
  const [pathname, setPathname] = useState('');

  useIsomorphicLayoutEffect(() => {
    const sync = () => setPathname(window.location.pathname);
    sync();
    document.addEventListener('astro:page-load', sync);
    return () => document.removeEventListener('astro:page-load', sync);
  }, []);

  return pathname;
}
