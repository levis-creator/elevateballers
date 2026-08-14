import crypto from 'node:crypto';
import type { SiteSetting } from '../domain/siteSetting';

const PREFIX = 'enc:v1:';
const MASK = '••••••••••••';
const secret = () => process.env.SETTINGS_ENCRYPTION_KEY || process.env.AUTH_SECRET || process.env.JWT_SECRET || '';
const key = () => {
  const value = secret();
  if (!value) throw new Error('SETTINGS_ENCRYPTION_KEY (or AUTH_SECRET) is required to store email provider credentials');
  return crypto.createHash('sha256').update(value).digest();
};
const encrypt = (value: string) => {
  if (!value || value.includes('•') || value.includes('*')) return value;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${PREFIX}${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${encrypted.toString('base64')}`;
};
const decrypt = (value: string) => {
  if (!value.startsWith(PREFIX)) return value;
  const [iv, tag, encrypted] = value.slice(PREFIX.length).split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64')), decipher.final()]).toString('utf8');
};
const parse = (value: string): Array<Record<string, string>> => {
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
};

export function protectSensitiveSettingValue(keyName: string, value: string, previousValue?: string): string {
  if (keyName !== 'email_providers') return value;
  const previous = parse(previousValue ?? '[]');
  return JSON.stringify(parse(value).map((provider, index) => {
    const credential = String(provider.credential ?? '');
    const old = previous.find((item) => item.provider === provider.provider) ?? previous[index];
    const preserved = (credential.includes('•') || credential.includes('*')) && old?.credential ? old.credential : credential;
    const isSmtp = String(provider.provider ?? '').toLowerCase() === 'smtp';
    return { ...provider, credential: isSmtp ? preserved : encrypt(preserved) };
  }));
}

export function revealSensitiveSetting(setting: SiteSetting): SiteSetting {
  if (setting.key !== 'email_providers') return setting;
  return { ...setting, value: JSON.stringify(parse(setting.value).map((provider) => ({ ...provider, credential: decrypt(String(provider.credential ?? '')) }))) };
}

export function maskSensitiveSetting(setting: SiteSetting): SiteSetting {
  if (setting.key !== 'email_providers') return setting;
  return { ...setting, value: JSON.stringify(parse(setting.value).map((provider) => {
    let credential = String(provider.credential ?? '');
    try { credential = decrypt(credential); } catch { credential = ''; }
    const isSmtp = String(provider.provider ?? '').toLowerCase() === 'smtp';
    const suffix = credential && !credential.includes('•') && !credential.includes('*') ? credential.slice(-4) : '';
    return { ...provider, credential: isSmtp ? credential : credential ? `${MASK}${suffix}` : '' };
  })) };
}
