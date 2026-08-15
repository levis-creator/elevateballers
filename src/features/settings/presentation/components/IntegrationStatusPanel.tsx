import { useCallback, useEffect, useState } from 'react';
import { SECURITY_SECRET_SETTING_DEFINITIONS, type SecuritySecretSettingKey } from '../../application/securitySettings';
import '../styles/settings-v2.css';

type Source = 'database' | 'environment' | 'unset';

const STATUS_KEY_BY_SETTING: Record<SecuritySecretSettingKey, string> = {
  security_turnstileSecretKey: 'turnstileSecretKey',
  security_resendWebhookSecret: 'resendWebhookSecret',
  security_mailgunWebhookSigningKey: 'mailgunWebhookSigningKey',
  security_upstashRedisUrl: 'upstashRedisUrl',
  security_upstashRedisToken: 'upstashRedisToken',
  security_r2AccountId: 'r2AccountId',
  security_r2BucketName: 'r2BucketName',
  security_r2AccessKeyId: 'r2AccessKeyId',
  security_r2SecretAccessKey: 'r2SecretAccessKey',
  security_r2PublicUrl: 'r2PublicUrl',
  security_supabaseUrl: 'supabaseUrl',
  security_supabaseServiceRoleKey: 'supabaseServiceRoleKey',
};

const SOURCE_LABEL: Record<Source, string> = {
  database: 'Configured here — leave blank to keep, or paste a new value to replace it',
  environment: 'Using the environment variable — paste a value here to override it',
  unset: 'Not configured',
};

type RecordValue = { id: string; value: string };
type Status = Record<string, Source>;

export default function IntegrationStatusPanel({ canManage }: { canManage: boolean }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [records, setRecords] = useState<Record<string, RecordValue>>({});
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(Object.keys(SECURITY_SECRET_SETTING_DEFINITIONS).map((key) => [key, ''])),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [statusResponse, settingsResponse] = await Promise.all([
        fetch('/api/settings/integration-status', { cache: 'no-store' }),
        fetch('/api/settings?category=security', { cache: 'no-store' }),
      ]);
      if (!statusResponse.ok) throw new Error('Unable to load integration status');
      setStatus(await statusResponse.json());
      if (!settingsResponse.ok) throw new Error('Unable to load integration credentials');
      const incoming = await settingsResponse.json() as Array<{ id: string; key: string; value: string }>;
      const nextRecords: Record<string, RecordValue> = {};
      const nextValues: Record<string, string> = {};
      for (const key of Object.keys(SECURITY_SECRET_SETTING_DEFINITIONS)) {
        const record = incoming.find((item) => item.key === key);
        nextValues[key] = record?.value ?? '';
        if (record) nextRecords[key] = { id: record.id, value: record.value };
      }
      setRecords(nextRecords);
      setValues(nextValues);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load integration credentials');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function saveSecrets() {
    if (!canManage) return;
    setSaving(true); setError(''); setMessage('');
    try {
      await Promise.all(Object.entries(SECURITY_SECRET_SETTING_DEFINITIONS).map(async ([key, definition]) => {
        const record = records[key];
        const response = await fetch(record ? `/api/settings/${record.id}` : '/api/settings', {
          method: record ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record
            ? { value: values[key] }
            : { key, value: values[key], label: definition.label, description: definition.description, type: 'text', category: 'security' }),
        });
        if (!response.ok) throw new Error(`Unable to save ${definition.label}`);
      }));
      setMessage('Integration credentials saved — new values take effect on the next request (up to 30s to propagate).');
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save integration credentials');
    } finally {
      setSaving(false);
    }
  }

  const groups: { title: string; keys: SecuritySecretSettingKey[] }[] = [
    { title: 'Bot protection & webhooks', keys: ['security_turnstileSecretKey', 'security_resendWebhookSecret', 'security_mailgunWebhookSigningKey'] },
    { title: 'Upstash Redis (rate limiting & caching)', keys: ['security_upstashRedisUrl', 'security_upstashRedisToken'] },
    { title: 'Cloudflare R2 (upload storage)', keys: ['security_r2AccountId', 'security_r2BucketName', 'security_r2AccessKeyId', 'security_r2SecretAccessKey', 'security_r2PublicUrl'] },
    { title: 'Supabase (upload storage)', keys: ['security_supabaseUrl', 'security_supabaseServiceRoleKey'] },
  ];

  return (
    <section aria-labelledby="integration-status-title" className="eb-security-audit-integration-status">
      <div className="eb-settings-group-title" id="integration-status-title">Integration credentials</div>
      <p className="eb-session-history-muted">
        Stored encrypted here and overrides the matching environment variable when set — no redeploy required, and a client can point the app at their own accounts.
        Leave a field blank to fall back to the environment variable. R2 and Supabase are alternate storage backends; which one is active is still chosen by the STORAGE_TYPE environment variable.
      </p>
      {error && <p className="eb-session-history-error">{error}</p>}
      {message && <p className="eb-session-history-muted">{message}</p>}
      {loading ? (
        <p className="eb-session-history-muted">Loading integration credentials…</p>
      ) : (
        <>
          {groups.map((group) => (
            <div key={group.title} className="eb-security-audit-integration-group">
              <div className="eb-settings-group-title">{group.title}</div>
              <div className="eb-settings-fields">
                {group.keys.map((key) => {
                  const definition = SECURITY_SECRET_SETTING_DEFINITIONS[key];
                  const source = status ? status[STATUS_KEY_BY_SETTING[key]] ?? 'unset' : 'unset';
                  return (
                    <div className="eb-settings-field" key={key}>
                      <div className="eb-settings-field-copy">
                        <div className="eb-settings-field-top">
                          <label htmlFor={`secret-${key}`}>{definition.label}</label>
                          <span className={source === 'unset' ? 'eb-security-audit-status-missing' : 'eb-security-audit-status-ok'}>
                            {source === 'database' ? 'Set here' : source === 'environment' ? 'Set via environment' : 'Not configured'}
                          </span>
                        </div>
                        <p>{definition.description}</p>
                      </div>
                      <div className="eb-settings-field-control">
                        <input
                          id={`secret-${key}`}
                          className="eb-in"
                          type="password"
                          autoComplete="off"
                          spellCheck={false}
                          placeholder={SOURCE_LABEL[source]}
                          value={values[key] ?? ''}
                          onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
                          disabled={!canManage || saving}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {canManage && (
            <button type="button" className="eb-security-audit-save" onClick={() => void saveSecrets()} disabled={saving}>
              {saving ? 'Saving…' : 'Save integration credentials'}
            </button>
          )}

          <div className="eb-security-audit-integration-infra">
            <div className="eb-settings-group-title">Brevo (bulk &amp; newsletter email)</div>
            <p className="eb-session-history-muted">
              Managed under Notifications → Email providers, not here — this just shows whether a credential is set.
              {' '}<span className={status?.brevo === 'unset' ? 'eb-security-audit-status-missing' : 'eb-security-audit-status-ok'}>
                {status?.brevo === 'database' ? 'Set under Notifications' : status?.brevo === 'environment' ? 'Set via environment' : 'Not configured'}
              </span>
            </p>
          </div>
        </>
      )}
    </section>
  );
}
