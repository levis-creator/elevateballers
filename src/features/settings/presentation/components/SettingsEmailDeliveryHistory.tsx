import { useEffect, useState } from 'react';

type DeliveryRow = {
  id: string;
  createdAt: string;
  template: string;
  provider: string;
  recipient: string;
  status: string;
};

const formatTemplate = (value: string) => value
  .replace(/^emailTemplates_/, '')
  .replace(/[_-]+/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const today = new Date();
  const prefix = date.toDateString() === today.toDateString() ? 'Today' : date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
  return `${prefix} ${date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
};

export default function SettingsEmailDeliveryHistory({ values }: { values: Record<string, string> }) {
  const [rows, setRows] = useState<DeliveryRow[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    void fetch('/api/settings/email-history?limit=6', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : { rows: [], total: 0 })
      .then((result: { rows?: DeliveryRow[]; total?: number }) => {
        setRows(result.rows ?? []);
        setTotal(result.total ?? 0);
      })
      .catch(() => undefined);
  }, []);

  const failures = rows.filter((row) => ['Failed', 'Bounced'].includes(row.status)).length;
  const retention = values.emailDelivery_retention || '90';

  return (
    <div className="eb-email-history">
      <div className="eb-email-history-head">
        <span>Recent sends</span>
        <span>{total} recorded · {failures} {failures === 1 ? 'failure' : 'failures'} shown</span>
      </div>
      <div className="eb-email-history-list">
        {rows.length ? rows.map((row) => (
          <div className="eb-email-history-row" key={row.id}>
            <time>{formatTime(row.createdAt)}</time>
            <div>
              <strong>{formatTemplate(row.template || 'Transactional email')}</strong>
              <small>{row.provider ? `via ${row.provider}` : 'Provider not recorded'}</small>
            </div>
            <span className="eb-email-history-recipient">{row.recipient || 'Recipient protected'}</span>
            <span className={`eb-email-status is-${row.status.toLowerCase()}`}>{row.status}</span>
          </div>
        )) : (
          <div className="eb-email-history-empty">No notification delivery events have been recorded yet.</div>
        )}
      </div>
      <div className="eb-email-history-foot">
        <a href="/admin/audit-logs?action=EMAIL_">Open full history →</a>
        <span>History retained for {retention} days</span>
      </div>
    </div>
  );
}
