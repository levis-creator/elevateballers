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
export const LOGO_URL = `${SITE_URL}/images/Elevate_Icon.png`;

export type AdminNotificationType =
  | 'contact_message'
  | 'team_registered'
  | 'player_registered'
  | 'player_auto_linked';

// Brand colors
export const C = {
  primary: '#dd3333',
  primaryDark: '#bb2222',
  secondary: '#ffba00',
  accent: '#552085',
  dark: '#222222',
  white: '#ffffff',
  gray: '#6b7280',
  lightGray: '#f2f4f7',
  border: '#e5e7eb',
  text: '#1f2937',
};
