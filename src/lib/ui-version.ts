import { PUBLIC_UI_VERSION } from 'astro:env/client';

/**
 * Single source of truth for the public-site redesign toggle.
 *
 * Set PUBLIC_UI_VERSION=v2 (env var) to serve the new UI; anything else
 * (including unset) keeps the current site. Centralized here so the rollback
 * lives in one place and the eventual v1 cleanup is a single find-and-replace.
 *
 * All redesign code lives in `v2/` folders — see docs/REDESIGN_V2.md for the
 * conventions and per-page migration status.
 *
 * Scope: PUBLIC site only. The admin panel will get its own complete redesign
 * later, gated by a *separate* flag (e.g. `usePublicAdminV2` /
 * PUBLIC_ADMIN_UI_VERSION) so public and admin roll out/back independently.
 * Don't reuse this flag for admin.
 */
export const PUBLIC_UI_VERSION_RESOLVED = PUBLIC_UI_VERSION ?? 'v1';

export const usePublicV2 = PUBLIC_UI_VERSION_RESOLVED === 'v2';
