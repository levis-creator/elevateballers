import { useState } from 'react';

const EVENT_BY_LABEL: Record<string, string> = {
  'Registration received': 'registration',
  Approved: 'approved',
  Rejected: 'rejected',
  'Payment received': 'payment',
  'Match notification': 'match',
  'Account & security': 'verify',
};
const VARIABLES = ['name', 'firstName', 'email', 'team', 'league', 'season', 'status', 'applicationId', 'amount', 'matchDate', 'opponent', 'venue', 'link', 'expiry'];
const SAMPLE: Record<string, string> = { name: 'Levi N.', firstName: 'Levi', email: 'levi@example.com', team: 'CBA Jets', league: 'Premier League', season: '2026', status: 'approved', applicationId: 'EB-2026-0148', amount: 'KES 25,000', matchDate: 'Sat 14 Mar, 4:00pm', opponent: 'Nairobi Malaikas', venue: 'Pepo Lane Court', link: 'https://elevateballers.com/a/8f2c1d', expiry: '60 minutes' };
const fill = (value: string) => value.replace(/\{(\w+)\}/g, (token, key) => SAMPLE[key] ?? token);

export default function SettingsEmailPreview({ values, templateLabel = 'Registration received', canManage }: { values: Record<string, string>; templateLabel?: string; canManage: boolean }) {
  const [recipient, setRecipient] = useState('');
  const [sendState, setSendState] = useState('');
  const event = EVENT_BY_LABEL[templateLabel] ?? 'registration';
  const providerRows = (() => { try { const parsed = JSON.parse(values.email_providers || '[]'); return Array.isArray(parsed) ? parsed : []; } catch { return []; } })();
  const provider = providerRows.find((row) => !/disabled|inactive/i.test(String(row.status || ''))) ?? providerRows[0];
  const enabled = values[`emailTemplates_${event}Enabled`] !== 'false' && values.email_autoReplies !== 'false';
  const subject = fill(values[`emailTemplates_${event}Subject`] || '');
  const body = fill(values[`emailTemplates_${event}Body`] || '');

  async function sendTest() {
    if (!recipient.trim() || !canManage) return;
    setSendState('Sending…');
    try {
      const response = await fetch('/api/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: recipient.trim(), subject, body, template: event }),
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Unable to send test');
      setSendState('Test sent');
    } catch (error) {
      setSendState(error instanceof Error ? error.message : 'Unable to send test');
    }
  }

  return (
    <div className="eb-email-preview">
      <div className="eb-email-preview-head">
        <span>Email preview</span>
        <span>{values.email_format || 'HTML and plain text'} · {provider?.provider ? `via ${provider.provider}` : 'no provider configured'}</span>
      </div>
      {!enabled && <div className="eb-email-preview-disabled">This message is disabled and will not be queued.</div>}
      <div className="eb-email-preview-envelope">
        <div className="eb-email-preview-meta">
          <span>From</span><strong>{values.email_senderName} &lt;{values.email_senderEmail}&gt;</strong>
          <span>Subject</span><strong>{subject}</strong>
          <span>Reply-to</span><strong>{values.email_replyTo || 'none set'}</strong>
        </div>
        {values.email_brandHeader !== 'false' && (
          <div className="eb-email-preview-brand">
            {values.header_logo ? <img src={values.header_logo} alt="Elevate Ballers" /> : <span>ELEVATE BALLERS</span>}
          </div>
        )}
        <div className="eb-email-preview-message">
          <div className="eb-email-preview-body">{body}</div>
          {values.email_signature && <div className="eb-email-preview-signature">{values.email_signature}</div>}
          {values.email_footerNote && <footer>{values.email_footerNote}</footer>}
        </div>
      </div>
      <div className="eb-email-test-row">
        <input className="eb-in" type="email" value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="you@example.com" disabled={!canManage} />
        <button type="button" onClick={() => void sendTest()} disabled={!canManage || !recipient.trim() || sendState === 'Sending…'}>Send test</button>
        <span>{sendState || 'Uses the currently selected provider and unsaved template text.'}</span>
      </div>
      <div className="eb-email-variables">
        <span>Available variables</span>
        <div>{VARIABLES.map((variable) => (
          <button type="button" key={variable} title="Copy variable" onClick={() => void navigator.clipboard?.writeText(`{${variable}}`)}>{`{${variable}}`}</button>
        ))}</div>
      </div>
    </div>
  );
}
