import { PUBLIC_ADMIN_UI_VERSION } from 'astro:env/client';

/**
 * Single source of truth for the ADMIN console redesign toggle.
 *
 * Set PUBLIC_ADMIN_UI_VERSION=v2 (env var) to serve the redesigned admin
 * login/OTP; anything else (including unset) keeps the legacy CMS forms.
 *
 * Deliberately separate from `usePublicV2` (src/lib/ui-version.ts) so the admin
 * console and the public site roll out / roll back independently. Same
 * mechanics as the public flag: PUBLIC_* vars are inlined at build time, so
 * flipping this is a rebuild/redeploy — a zero-code, one-click revert.
 */
export const PUBLIC_ADMIN_UI_VERSION_RESOLVED = PUBLIC_ADMIN_UI_VERSION ?? 'v1';

export const usePublicAdminV2 = PUBLIC_ADMIN_UI_VERSION_RESOLVED === 'v2';
