import { useEffect, useState, type ComponentType } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

const EMAIL_PREF_OPTIONS = [
  { key: 'contact_message', label: 'Contact Messages', description: 'When someone submits the contact form.' },
  { key: 'team_registered', label: 'Team Registrations', description: 'When a team registers.' },
  { key: 'player_registered', label: 'Player Registrations', description: 'When a player registers.' },
];

export default function NotificationSettingsCard() {
  const [icons, setIcons] = useState<{
    Bell?: ComponentType<any>;
    Loader2?: ComponentType<any>;
  }>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailPreferences, setEmailPreferences] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        Bell: mod.Bell,
        Loader2: mod.Loader2,
      });
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/notifications/settings');
        if (response.ok) {
          const data = await response.json();
          setEnabled(Boolean(data.enabled));
          setEmailEnabled(Boolean(data.emailEnabled));
          const defaults = EMAIL_PREF_OPTIONS.reduce<Record<string, boolean>>((acc, option) => {
            acc[option.key] = true;
            return acc;
          }, {});
          const incoming = data.emailPreferences && typeof data.emailPreferences === 'object'
            ? data.emailPreferences
            : {};
          const normalized = { ...defaults, ...incoming };
          setEmailPreferences(normalized);
        } else {
          setError('Failed to load notification settings');
        }
      } catch (err) {
        console.error('Notification settings load error:', err);
        setError('Failed to load notification settings');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleToggle = async (value: boolean) => {
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: value }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to update notification settings');
        return;
      }

      const data = await response.json();
      setEnabled(Boolean(data.enabled));
    } catch (err) {
      console.error('Notification settings update error:', err);
      setError('Failed to update notification settings');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailToggle = async (value: boolean) => {
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, emailEnabled: value, emailPreferences }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to update email notifications');
        return;
      }

      const data = await response.json();
      setEnabled(Boolean(data.enabled));
      setEmailEnabled(Boolean(data.emailEnabled));
      if (data.emailPreferences && typeof data.emailPreferences === 'object') {
        setEmailPreferences(data.emailPreferences);
      }
    } catch (err) {
      console.error('Email notification update error:', err);
      setError('Failed to update email notifications');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailPrefToggle = async (key: string, value: boolean) => {
    const next = { ...emailPreferences, [key]: value };
    setEmailPreferences(next);
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, emailEnabled, emailPreferences: next }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to update email preferences');
        return;
      }

      const data = await response.json();
      setEnabled(Boolean(data.enabled));
      setEmailEnabled(Boolean(data.emailEnabled));
      if (data.emailPreferences && typeof data.emailPreferences === 'object') {
        setEmailPreferences(data.emailPreferences);
      }
    } catch (err) {
      console.error('Email preference update error:', err);
      setError('Failed to update email preferences');
    } finally {
      setSaving(false);
    }
  };

  const BellIcon = icons.Bell;
  const Loader2Icon = icons.Loader2;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {BellIcon ? <BellIcon size={18} /> : null}
          Notification Settings
        </CardTitle>
        <CardDescription>Choose which admin notifications you want to receive.</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
            {error}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Admin Notifications</p>
            <p className="text-xs text-muted-foreground">
              {enabled ? 'Enabled' : 'Disabled'} for your account
            </p>
          </div>
          <div className="flex items-center gap-2">
            {saving && Loader2Icon ? (
              <Loader2Icon size={16} className="animate-spin text-muted-foreground" />
            ) : null}
            <Switch
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={loading || saving}
              aria-label="Toggle admin notifications"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Email Notifications</p>
            <p className="text-xs text-muted-foreground">
              {emailEnabled ? 'Enabled' : 'Disabled'} for your account
            </p>
          </div>
          <div className="flex items-center gap-2">
            {saving && Loader2Icon ? (
              <Loader2Icon size={16} className="animate-spin text-muted-foreground" />
            ) : null}
            <Switch
              checked={emailEnabled}
              onCheckedChange={handleEmailToggle}
              disabled={loading || saving}
              aria-label="Toggle email notifications"
            />
          </div>
        </div>

        <div className="mt-4 space-y-3 border-t pt-4">
          {EMAIL_PREF_OPTIONS.map((option) => (
            <div key={option.key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">{option.label}</p>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {saving && Loader2Icon ? (
                  <Loader2Icon size={16} className="animate-spin text-muted-foreground" />
                ) : null}
                <Switch
                  checked={Boolean(emailPreferences[option.key])}
                  onCheckedChange={(value) => handleEmailPrefToggle(option.key, value)}
                  disabled={loading || saving || !emailEnabled}
                  aria-label={`Toggle ${option.label}`}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
