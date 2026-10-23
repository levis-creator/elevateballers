import { useState } from 'react';
import type { Field } from '../settingsSections';

type Props = { field: Field; value: string; canManage: boolean; onChange: (key: string, value: string) => void };
type MailboxConfig = { host: string; port: string; username: string; password: string; mailbox: string; secure: string };
const defaults: MailboxConfig = { host: '', port: '993', username: '', password: '', mailbox: 'INBOX', secure: 'true' };

function parse(value: string): MailboxConfig {
  try { return { ...defaults, ...(JSON.parse(value) as Partial<MailboxConfig>) }; } catch { return defaults; }
}

export default function SettingsMailboxControl({ field, value, canManage, onChange }: Props) {
  const [status, setStatus] = useState('');
  const config = parse(value);
  const update = (key: keyof MailboxConfig, next: string) => onChange(field.key, JSON.stringify({ ...config, [key]: next }));
  const testConnection = async () => {
    setStatus('Testing connection…');
    try {
      const response = await fetch('/api/contact-messages/imap-test', { method: 'POST' });
      const body = await response.json().catch(() => ({}));
      setStatus(response.ok ? `Connected to ${body.mailbox ?? config.mailbox}.` : body.error ?? 'Connection failed.');
    } catch { setStatus('Connection failed.'); }
  };
  const syncMailbox = async () => {
    setStatus('Syncing inbox…');
    try {
      const response = await fetch('/api/contact-messages/sync', { method: 'POST' });
      const body = await response.json().catch(() => ({}));
      setStatus(response.ok ? `${body.imported ?? 0} new message${body.imported === 1 ? '' : 's'} synchronized.` : body.error ?? 'Sync failed.');
    } catch { setStatus('Sync failed.'); }
  };
  return <div className="grid gap-3 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] p-3">
    <div className="grid gap-3 sm:grid-cols-2">
      {([['host', 'IMAP host', 'mail.elevateballers.com'], ['port', 'Port', '993'], ['username', 'Username', 'info@elevateballers.com'], ['mailbox', 'Folder', 'INBOX']] as const).map(([key, label, placeholder]) => <label key={key} className="grid gap-1 text-[11px] font-bold text-[var(--tx)]"><span>{label}</span><input className="eb-in" value={config[key]} placeholder={placeholder} disabled={!canManage} onChange={(event) => update(key, event.target.value)} /></label>)}
      <label className="grid gap-1 text-[11px] font-bold text-[var(--tx)] sm:col-span-2"><span>Mailbox password</span><input className="eb-in" type="password" value={config.password} placeholder="Enter mailbox password" disabled={!canManage} onChange={(event) => update('password', event.target.value)} /></label>
    </div>
    <div className="flex flex-wrap items-center gap-2"><button type="button" className="eb-quiet-button" disabled={!canManage} onClick={() => void testConnection()}>Test connection</button><button type="button" className="eb-quiet-button" disabled={!canManage} onClick={() => void syncMailbox()}>Sync inbox</button>{status && <span className="text-[11px] text-[var(--txm)]" role="status">{status}</span>}</div>
  </div>;
}
