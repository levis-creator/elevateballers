import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { usePermissions } from '@/features/rbac/usePermissions';
import SettingsUnavailable from '@/features/settings/presentation/components/SettingsUnavailable';
import SessionHistoryPanel from '@/features/settings/presentation/components/SessionHistoryPanel';
import SecurityAuditPanel from '@/features/settings/presentation/components/SecurityAuditPanel';

const FIELDS = [
  { key: 'security_loginMaxAttempts', label: 'Maximum login attempts', description: 'Invalid passwords allowed before the account is locked.', min: 3, max: 10, defaultValue: '5' },
  { key: 'security_loginLockoutMinutes', label: 'Login lockout duration', description: 'Minutes an account stays locked after too many invalid passwords.', min: 5, max: 60, defaultValue: '15' },
  { key: 'security_loginRateLimitMax', label: 'Login requests per window', description: 'Login attempts allowed for one source IP before a temporary limit.', min: 3, max: 30, defaultValue: '10' },
  { key: 'security_loginRateLimitWindowMinutes', label: 'Login rate-limit window', description: 'Minutes in the login rate-limit window.', min: 5, max: 60, defaultValue: '15' },
  { key: 'security_otpExpiryMinutes', label: 'OTP expiry duration', description: 'Minutes before a sign-in verification code expires.', min: 5, max: 30, defaultValue: '10' },
  { key: 'security_otpMaxAttempts', label: 'Maximum OTP attempts', description: 'Invalid codes allowed before the current code is locked.', min: 3, max: 10, defaultValue: '5' },
  { key: 'security_otpLockoutMinutes', label: 'OTP lockout duration', description: 'Minutes a code stays locked after too many invalid codes.', min: 5, max: 60, defaultValue: '15' },
  { key: 'security_otpRateLimitMax', label: 'OTP requests per window', description: 'Verification requests allowed for one administrator before a temporary limit.', min: 3, max: 20, defaultValue: '5' },
  { key: 'security_otpRateLimitWindowMinutes', label: 'OTP rate-limit window', description: 'Minutes in the OTP verification rate-limit window.', min: 5, max: 60, defaultValue: '15' },
  { key: 'security_settingsMutationMax', label: 'Settings changes per window', description: 'Creates and updates allowed for one administrator before a temporary limit.', min: 10, max: 100, defaultValue: '30' },
  { key: 'security_settingsMutationWindowMinutes', label: 'Settings rate-limit window', description: 'Minutes in the Site Settings mutation rate-limit window.', min: 5, max: 60, defaultValue: '10' },
] as const;

const SESSION_FIELDS = [
  { key: 'security_sessionDurationDays', label: 'Admin session duration', description: 'Days before an authenticated admin session expires.', min: 1, max: 14, defaultValue: '7' },
  { key: 'security_maxConcurrentSessions', label: 'Maximum concurrent sessions', description: 'Active admin sessions retained per user; oldest sessions are revoked first.', min: 1, max: 10, defaultValue: '3' },
] as const;

const PASSWORD_FIELDS = [
  { key: 'security_passwordMinLength', label: 'Minimum password length', description: 'Applies to new and changed passwords; existing passwords are not changed automatically.', min: 8, max: 64, defaultValue: '8' },
  { key: 'security_passwordHistoryCount', label: 'Password history count', description: 'Recent password hashes retained and rejected for reuse.', min: 0, max: 10, defaultValue: '5' },
] as const;
const BREACH_FIELD = { key: 'security_passwordBreachCheck', label: 'Breached-password checks', description: 'Reject passwords found by the privacy-preserving breach range check.', defaultValue: 'true' } as const;

const ALL_FIELDS = [...FIELDS, ...SESSION_FIELDS, ...PASSWORD_FIELDS, BREACH_FIELD];

const GROUPS = [
  { id: 'overview', label: 'Overview' },
  { id: 'otp', label: 'OTP & Login Protection' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'history', label: 'Session history' },
  { id: 'passwords', label: 'Passwords' },
  { id: 'alerts', label: 'Alerts & Audit' },
  { id: 'uploads', label: 'Uploads & Integrations', unavailable: true },
] as const;

type RecordValue = { id: string; value: string };

export default function SecuritySettingsEditor() {
  const { can } = usePermissions();
  const canManage = can('site_settings:manage');
  const [records, setRecords] = useState<Record<string, RecordValue>>({});
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(ALL_FIELDS.map((field) => [field.key, field.defaultValue])),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeGroup, setActiveGroup] = useState<(typeof GROUPS)[number]['id']>('overview');

  useEffect(() => {
    void fetch('/api/settings?category=security', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load Security settings');
        return response.json() as Promise<Array<{ id: string; key: string; value: string }>>;
      })
      .then((incoming) => {
        const nextRecords = Object.fromEntries(incoming.map((record) => [record.key, { id: record.id, value: record.value }]));
        const nextValues = Object.fromEntries(ALL_FIELDS.map((field) => [field.key, nextRecords[field.key]?.value ?? field.defaultValue]));
        setRecords(nextRecords);
        setValues(nextValues);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load Security settings'))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    if (!canManage) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await Promise.all(ALL_FIELDS.map(async (field) => {
        const response = await fetch(records[field.key] ? `/api/settings/${records[field.key].id}` : '/api/settings', {
          method: records[field.key] ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(records[field.key]
            ? { value: values[field.key] }
            : { key: field.key, value: values[field.key], label: field.label, type: 'number', category: 'security' }),
        });
        if (!response.ok) {
          const result = await response.json().catch(() => ({})) as { error?: string };
          throw new Error(result.error ?? `Unable to save ${field.label}`);
        }
      }));
      setMessage('Security settings saved');
      const response = await fetch('/api/settings?category=security', { cache: 'no-store' });
      if (response.ok) {
        const incoming = await response.json() as Array<{ id: string; key: string; value: string }>;
        setRecords(Object.fromEntries(incoming.map((record) => [record.key, { id: record.id, value: record.value }])));
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save Security settings');
    } finally {
      setSaving(false);
    }
  }

  async function signOutAllUsers() {
    if (!window.confirm('Sign out every user, including yourself? Everyone will need to sign in again.')) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/settings/sign-out-all', { method: 'POST' });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Unable to sign out all users');
      window.location.href = '/admin/login';
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : 'Unable to sign out all users');
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-start gap-3">
          <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Security</h2>
            <p className="mt-1 text-sm text-muted-foreground">Admin-only controls for sign-in verification and sensitive Site Settings changes. Secure defaults apply when a value is missing or invalid.</p>
          </div>
        </div>
        <div className="mb-6 flex flex-wrap gap-2 border-b pb-4" role="tablist" aria-label="Security settings sections">
          {GROUPS.map((group) => (
            <button
              key={group.id}
              type="button"
              role="tab"
              aria-selected={activeGroup === group.id}
              className={`rounded-md border px-3 py-2 text-xs font-medium ${activeGroup === group.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
              onClick={() => setActiveGroup(group.id)}
            >
              {group.label}
              {group.unavailable && <span className="ml-1.5 text-[10px]">Soon</span>}
            </button>
          ))}
        </div>
        {error && <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        {message && <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">{message}</p>}
        {activeGroup === 'overview' && (
          <div className="grid gap-4 md:grid-cols-3">
            <div><p className="text-sm font-medium">Admin sign-in</p><p className="text-xs text-muted-foreground">OTP expiry, attempts, lockout, and verification limits.</p></div>
            <div><p className="text-sm font-medium">Server enforced</p><p className="text-xs text-muted-foreground">Values are range-checked and secure defaults apply if invalid.</p></div>
            <div><p className="text-sm font-medium">Protection areas</p><p className="text-xs text-muted-foreground">Sessions, password policy, and security audit events are available; uploads remain separate.</p></div>
          </div>
        )}
        {activeGroup === 'otp' && (
          <div className="grid gap-5 md:grid-cols-2">
            {FIELDS.map((field) => (
              <label key={field.key} className="space-y-1.5">
                <span className="block text-sm font-medium">{field.label}</span>
                <span className="block text-xs text-muted-foreground">{field.description} Allowed range: {field.min}–{field.max}.</span>
                <input
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  type="number"
                  min={field.min}
                  max={field.max}
                  step="1"
                  value={values[field.key]}
                  onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
                  disabled={!canManage || loading || saving}
                />
              </label>
            ))}
          </div>
        )}
        {activeGroup === 'sessions' && (
          <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              {SESSION_FIELDS.map((field) => (
                <label key={field.key} className="space-y-1.5">
                  <span className="block text-sm font-medium">{field.label}</span>
                  <span className="block text-xs text-muted-foreground">{field.description} Allowed range: {field.min}–{field.max}.</span>
                  <input
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    type="number"
                    min={field.min}
                    max={field.max}
                    step="1"
                    value={values[field.key]}
                    onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
                    disabled={!canManage || loading || saving}
                  />
                </label>
              ))}
            </div>
            {canManage && (
              <button type="button" className="rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive disabled:opacity-50" onClick={() => void signOutAllUsers()} disabled={loading || saving}>
                Sign out all users
              </button>
            )}
          </div>
        )}
        {activeGroup === 'history' && <SessionHistoryPanel canManage={canManage} />}
        {activeGroup === 'passwords' && (
          <div className="grid gap-5 md:grid-cols-2">
            {PASSWORD_FIELDS.map((field) => (
              <label key={field.key} className="space-y-1.5">
                <span className="block text-sm font-medium">{field.label}</span>
                <span className="block text-xs text-muted-foreground">{field.description} Allowed range: {field.min}–{field.max}.</span>
                <input className="w-full rounded-md border bg-background px-3 py-2 text-sm" type="number" min={field.min} max={field.max} step="1" value={values[field.key]} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} disabled={!canManage || loading || saving} />
              </label>
            ))}
            <div className="space-y-1.5"><span className="block text-sm font-medium">{BREACH_FIELD.label}</span><span className="block text-xs text-muted-foreground">{BREACH_FIELD.description}</span><button type="button" role="switch" aria-checked={values[BREACH_FIELD.key] !== 'false'} className="rounded-md border px-3 py-2 text-sm" onClick={() => setValues((current) => ({ ...current, [BREACH_FIELD.key]: current[BREACH_FIELD.key] === 'false' ? 'true' : 'false' }))} disabled={!canManage || loading || saving}>{values[BREACH_FIELD.key] !== 'false' ? 'Enabled' : 'Disabled'}</button></div>
          </div>
        )}
        {activeGroup === 'alerts' && <SecurityAuditPanel canManage={canManage} />}
        {activeGroup !== 'overview' && activeGroup !== 'otp' && activeGroup !== 'sessions' && activeGroup !== 'history' && activeGroup !== 'passwords' && activeGroup !== 'alerts' && (
          <SettingsUnavailable
            title={GROUPS.find((group) => group.id === activeGroup)?.label ?? 'Settings area'}
            description="This settings area is not configurable here yet."
            context="It is intentionally shown as unavailable until its server-side behavior is implemented."
          />
        )}
        {(activeGroup === 'otp' || activeGroup === 'sessions' || activeGroup === 'passwords') && canManage ? (
          <button type="button" className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50" onClick={() => void save()} disabled={loading || saving}>
            {saving ? 'Saving…' : 'Save Security settings'}
          </button>
        ) : !canManage ? (
          <p className="mt-6 text-sm text-muted-foreground">You have read-only access to Security settings.</p>
        ) : null}
      </div>
    </div>
  );
}
