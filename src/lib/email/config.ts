export const FROM = process.env.RESEND_FROM || 'ElevateBallers <info@elevateballers.com>';
export const SMTP_FROM = process.env.SMTP_FROM || FROM;
export const SMTP_HOST = process.env.SMTP_HOST;
export const SMTP_PORT = process.env.SMTP_PORT ? Number.parseInt(process.env.SMTP_PORT, 10) : undefined;
export const SMTP_USER = process.env.SMTP_USER;
export const SMTP_PASS = process.env.SMTP_PASS;
export const ADMIN_TO = process.env.ADMIN_EMAIL || 'info@elevateballers.com';
export const BREVO_FROM = process.env.BREVO_FROM || process.env.RESEND_FROM || 'ElevateBallers <info@elevateballers.com>';
export const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'ElevateBallers';
export const SITE_URL = process.env.SITE_URL || 'https://elevateballers.com';
// Full wordmark logo (black "ELEVATE" + red mark) — shown on a light chip in the
// email header so it stays legible on the dark header band.
export const LOGO_URL = `${SITE_URL}/logo/Elevate_Logo.png`;

export type AdminNotificationType =
  | 'contact_message'
  | 'team_registered'
  | 'player_registered'
  | 'player_auto_linked';

// v2 brand palette (matches the site redesign). Kept on the same keys so every
// template rebrands centrally.
export const C = {
  primary: '#e4002b', // brand red
  primaryDark: '#c0001f', // deep red (button hover)
  secondary: '#ff5a72', // brandsoft — soft red accent / links
  accent: '#111010', // night2 — dark footer / header blocks
  dark: '#0c0b0a', // night — darkest surface
  white: '#ffffff',
  gray: '#6f665c', // muted text
  lightGray: '#f4f1ea', // cream block background
  border: '#e6e1d8', // cream border
  text: '#141009', // ink text
  cream: '#f3efe9', // light text on dark
  creamdim: '#b8afa6', // dimmed light text on dark
};

// v2 typography — Anton (display), Archivo (body), Space Mono. Email-safe
// fallbacks so clients that block webfonts still render sensibly.
export const FONT_DISPLAY = "'Anton', 'Arial Black', Arial, sans-serif";
export const FONT_BODY = "'Archivo', Arial, Helvetica, sans-serif";
export const FONT_MONO = "'Space Mono', 'Courier New', monospace";
