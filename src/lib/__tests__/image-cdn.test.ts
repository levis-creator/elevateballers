import { afterEach, describe, expect, it, vi } from 'vitest';
import { optimizeImageUrl } from '../image-cdn';

const SUPABASE = 'https://zjnlvnyjsidnelgciqmz.supabase.co/storage/v1/object/public/ElevateBallers/public/players/a.jpg';
const CDN = 'https://cdn.elevateballers.com/public/teams/b.jpg';
const SANITY = 'https://cdn.sanity.io/images/x/y.png';

afterEach(() => vi.unstubAllEnvs());

describe('optimizeImageUrl', () => {
  it('returns originals when no image CDN is configured', () => {
    vi.stubEnv('DEPLOY_TARGET', 'cpanel');
    vi.stubEnv('PUBLIC_IMAGE_TRANSFORMS', '');
    expect(optimizeImageUrl(CDN, { width: 200 })).toBe(CDN);
    expect(optimizeImageUrl(null)).toBe('');
  });

  describe('with Cloudflare transformations', () => {
    const cloudflare = () => {
      vi.stubEnv('DEPLOY_TARGET', 'cpanel');
      vi.stubEnv('PUBLIC_IMAGE_TRANSFORMS', 'cloudflare');
    };

    it('resizes images from allowed hosts', () => {
      cloudflare();
      expect(optimizeImageUrl(CDN, { width: 200 })).toBe(
        `/cdn-cgi/image/width=200,quality=75,format=auto,onerror=redirect/${CDN}`
      );
      expect(optimizeImageUrl(SUPABASE, { width: 600, quality: 60 })).toBe(
        `/cdn-cgi/image/width=600,quality=60,format=auto,onerror=redirect/${SUPABASE}`
      );
    });

    it('resizes same-origin paths without doubling the slash', () => {
      cloudflare();
      expect(optimizeImageUrl('/images/logo.png')).toBe(
        '/cdn-cgi/image/quality=75,format=auto,onerror=redirect/images/logo.png'
      );
    });

    it('leaves hosts that are not allowed origins alone', () => {
      cloudflare();
      expect(optimizeImageUrl(SANITY, { width: 200 })).toBe(SANITY);
      expect(optimizeImageUrl('http://cdn.elevateballers.com/x.jpg')).toBe('http://cdn.elevateballers.com/x.jpg');
      expect(optimizeImageUrl('//evil.example/x.jpg')).toBe('//evil.example/x.jpg');
      expect(optimizeImageUrl('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA');
    });
  });

  it('keeps using Vercel Image Optimization on Vercel', () => {
    vi.stubEnv('DEPLOY_TARGET', 'vercel');
    expect(optimizeImageUrl(SUPABASE, { width: 300 })).toBe(
      `/_vercel/image?url=${encodeURIComponent(SUPABASE)}&w=300&q=75`
    );
    expect(optimizeImageUrl(CDN, { width: 300 })).toBe(CDN);
  });
});
