import { useCallback, useEffect, useState } from 'react';
import { SECURITY_ALERT_SETTING_DEFINITIONS } from '../../application/securitySettings';
import '../styles/settings-v2.css';

type Event = { id: string; userId: string; action: string; performedBy: string; metadata: Record<string, unknown>; createdAt: string };

export default function SecurityAuditPanel({ canManage }: { canManage: boolean }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alertRecords, setAlertRecords] = useState<Record<string, { id: string }>>({});
  const [alertValues, setAlertValues] = useState<Record<string, boolean>>(
    Object.fromEntries(Object.entries(SECURITY_ALERT_SETTING_DEFINITIONS).map(([key, value]) => [key, value.defaultValue])),
  );
  const [savingAlerts, setSavingAlerts] = useState(false);

  const load = useCallback(async (nextPage: number) => {
    setLoading(true); setError('');
    try {
      const response = await fetch(`/api/settings/audit-events?page=${nextPage}`, { cache: 'no-store' });
      const result = await response.json().catch(() => ({})) as { events?: Event[]; totalPages?: number; error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Unable to load security audit events');
      setEvents(result.events ?? []); setTotalPages(Math.max(1, result.totalPages ?? 1)); setPage(nextPage);
      const settingsResponse = await fetch('/api/settings?category=security', { cache: 'no-store' });
      if (settingsResponse.ok) {
        const records = await settingsResponse.json() as Array<{ id: string; key: string; value: string }>;
        setAlertRecords(Object.fromEntries(records.filter((record) => record.key in SECURITY_ALERT_SETTING_DEFINITIONS).map((record) => [record.key, { id: record.id }])));
        setAlertValues((current) => Object.fromEntries(Object.keys(SECURITY_ALERT_SETTING_DEFINITIONS).map((key) => {
          const record = records.find((item) => item.key === key);
          return [key, record ? record.value !== 'false' : current[key]];
        })));
      }
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Unable to load security audit events'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(1); }, [load]);

  async function saveAlerts() {
    if (!canManage) return;
    setSavingAlerts(true); setError('');
    try {
      await Promise.all(Object.entries(SECURITY_ALERT_SETTING_DEFINITIONS).map(async ([key, definition]) => {
        const record = alertRecords[key];
        const response = await fetch(record ? `/api/settings/${record.id}` : '/api/settings', {
          method: record ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record ? { value: String(alertValues[key]) } : { key, value: String(alertValues[key]), label: definition.label, description: definition.description, type: 'toggle', category: 'security' }),
        });
        if (!response.ok) throw new Error(`Unable to save ${definition.label}`);
      }));
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to save alert preferences'); }
    finally { setSavingAlerts(false); }
  }

  return (
    <div className="eb-security-audit">
      <section aria-labelledby="security-alert-preferences-title">
        <div className="eb-settings-group-title" id="security-alert-preferences-title">Email alert preferences</div>
        <p className="eb-session-history-muted">Recipients are administrators with email notifications enabled and the notifications-email permission.</p>
        <div className="eb-settings-fields">
          {Object.entries(SECURITY_ALERT_SETTING_DEFINITIONS).map(([key, definition]) => (
            <div className="eb-settings-field" key={key}>
              <div className="eb-settings-field-copy">
                <div className="eb-settings-field-top">
                  <label>{definition.label}</label>
                </div>
                <p>{definition.description}</p>
              </div>
              <div className="eb-settings-field-control">
                <button
                  type="button"
                  className="eb-settings-toggle"
                  role="switch"
                  aria-checked={alertValues[key]}
                  onClick={() => setAlertValues((current) => ({ ...current, [key]: !current[key] }))}
                  disabled={!canManage || savingAlerts}
                >
                  <span className={`eb-settings-toggle-track ${alertValues[key] ? 'is-on' : ''}`}>
                    <span className="eb-settings-toggle-knob" />
                  </span>
                  <span className="eb-settings-toggle-label">{alertValues[key] ? 'Enabled' : 'Disabled'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
        {canManage && (
          <button type="button" className="eb-security-audit-save" onClick={() => void saveAlerts()} disabled={savingAlerts}>
            {savingAlerts ? 'Saving…' : 'Save alert preferences'}
          </button>
        )}
      </section>

      <section aria-labelledby="security-audit-events-title">
        <div className="eb-settings-group-title" id="security-audit-events-title">Audit events</div>
        <p className="eb-session-history-muted">Security events are shown without passwords, tokens, hashes, or verification codes.</p>
        {error && <p className="eb-session-history-error">{error}</p>}
        {loading ? (
          <p className="eb-session-history-muted">Loading audit events…</p>
        ) : events.length === 0 ? (
          <p className="eb-session-history-muted">No security events found.</p>
        ) : (
          <div className="eb-security-audit-list">
            {events.map((event) => (
              <article key={event.id} className="eb-security-audit-item">
                <div>
                  <strong>{event.action}</strong>
                  <span>{new Date(event.createdAt).toLocaleString()}</span>
                </div>
                <p>Target: {event.userId} · Actor: {event.performedBy}</p>
                {Object.keys(event.metadata).length > 0 && <code>{JSON.stringify(event.metadata)}</code>}
              </article>
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className="eb-session-history-pagination">
            <button type="button" disabled={page <= 1 || loading} onClick={() => void load(page - 1)}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button type="button" disabled={page >= totalPages || loading} onClick={() => void load(page + 1)}>Next</button>
          </div>
        )}
      </section>
    </div>
  );
}
