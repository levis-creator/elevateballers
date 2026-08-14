import { useState } from 'react';

const EVENTS = [
  ['registration', 'Registration received'], ['approved', 'Approved'], ['rejected', 'Rejected'],
  ['payment', 'Payment received'], ['match', 'Match notification'], ['verify', 'Account & security'],
] as const;
const SAMPLE: Record<string, string> = { name: 'Levi N.', firstName: 'Levi', email: 'levi@example.com', team: 'CBA Jets', league: 'Premier League', season: '2026', status: 'approved', applicationId: 'EB-2026-0148', amount: 'KES 25,000', matchDate: 'Sat 14 Mar, 4:00pm', opponent: 'Nairobi Malaikas', venue: 'Pepo Lane Court', link: 'https://elevateballers.com/a/8f2c1d', expiry: '60 minutes' };
const fill = (value: string) => value.replace(/\{(\w+)\}/g, (token, key) => SAMPLE[key] ?? token);

export default function SettingsEmailPreview({ values }: { values: Record<string, string> }) {
  const [event, setEvent] = useState<(typeof EVENTS)[number][0]>('registration');
  const providerRows = (() => { try { const parsed = JSON.parse(values.email_providers || '[]'); return Array.isArray(parsed) ? parsed : []; } catch { return []; } })();
  const enabled = values[`emailTemplates_${event}Enabled`] !== 'false' && values.email_autoReplies !== 'false';
  const subject = fill(values[`emailTemplates_${event}Subject`] || '');
  const body = fill(values[`emailTemplates_${event}Body`] || '');
  return (
    <div className="eb-email-preview">
      <div className="eb-settings-preview-label">Email preview</div>
      <div className="eb-email-preview-tabs">{EVENTS.map(([key, label]) => <button type="button" className={event === key ? 'is-active' : ''} onClick={() => setEvent(key)} key={key}>{label}</button>)}</div>
      {!enabled && <div className="eb-email-preview-disabled">This message is disabled and will not be queued.</div>}
      <div className="eb-email-preview-envelope">
        <div className="eb-email-preview-meta"><span>From</span><strong>{values.email_senderName} &lt;{values.email_senderEmail}&gt;</strong><span>Reply-to</span><strong>{values.email_replyTo || 'none set'}</strong></div>
        {values.email_brandHeader !== 'false' && <div className="eb-email-preview-brand">ELEVATE BALLERS</div>}
        <div className="eb-email-preview-message"><small>Subject</small><h3>{subject}</h3>{body.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}{values.email_signature && <pre>{values.email_signature}</pre>}{values.email_footerNote && <footer>{values.email_footerNote}</footer>}</div>
        <div className="eb-email-preview-route">{values.email_format} · {providerRows[0]?.provider ? `via ${providerRows[0].provider}` : 'no provider configured'}</div>
      </div>
    </div>
  );
}
