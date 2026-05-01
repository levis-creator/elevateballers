import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { usePermissions } from '@/features/rbac/usePermissions';

interface SiteSetting {
  id: string;
  key: string;
  value: string;
  type: string;
  label: string;
  description: string | null;
  category: string | null;
}

const ALLOW_EDIT_KEY = 'match_allow_edit_after_completion';

export default function MatchSettingsEditor() {
  const { can } = usePermissions();
  const canManage = can('site_settings:manage');

  const [setting, setSetting] = useState<SiteSetting | null>(null);
  const [allowEdit, setAllowEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  // `cache: 'no-store'` bypasses the browser HTTP cache. Without it, after a
  // save, a soft reload can hand back the prior value from the disk cache and
  // make it look like the toggle didn't persist.
  const fetchSetting = async (): Promise<SiteSetting | null> => {
    const res = await fetch('/api/settings?category=matches', { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch match settings (${res.status})`);
    const data: SiteSetting[] = await res.json();
    return data.find((s) => s.key === ALLOW_EDIT_KEY) ?? null;
  };

  useEffect(() => {
    let cancelled = false;
    fetchSetting()
      .then((found) => {
        if (cancelled) return;
        setSetting(found);
        setAllowEdit(found?.value === 'true');
      })
      .catch((error) => console.error('Error fetching match settings:', error))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    if (!canManage) {
      alert('You do not have permission to manage site settings.');
      return;
    }

    setSaving(true);
    try {
      const value = allowEdit ? 'true' : 'false';

      if (setting) {
        const res = await fetch(`/api/settings/${setting.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ value }),
        });
        if (!res.ok) throw new Error(`Failed to update setting (${res.status})`);
      } else {
        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            key: ALLOW_EDIT_KEY,
            value,
            type: 'text',
            label: 'Allow editing matches after completion',
            // Kept short — SiteSetting.description is VARCHAR(191) in MariaDB.
            description: 'Allow admins to edit COMPLETED matches on the edit page.',
            category: 'matches',
          }),
        });
        if (!res.ok) throw new Error(`Failed to create setting (${res.status})`);
      }

      // Re-read from the server (cache-bypass) to confirm what actually
      // persisted, instead of trusting the write response. If something
      // server-side coerced or blocked the write, the toggle reflects truth.
      const persisted = await fetchSetting();
      setSetting(persisted);
      setAllowEdit(persisted?.value === 'true');

      if ((persisted?.value ?? 'false') !== value) {
        throw new Error('Server did not persist the new value');
      }

      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch (error) {
      console.error('Error saving match settings:', error);
      alert(
        `Failed to save match settings: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
          `Check the browser network tab and server logs.`,
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading match settings…</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold font-heading text-gray-900">Matches</h2>
          <p className="text-sm text-gray-500 mt-0.5">Control how matches behave after they end.</p>
        </div>
        <Button onClick={handleSave} disabled={saving || !canManage}>
          {saving ? 'Saving…' : savedFlash ? 'Saved' : 'Save'}
        </Button>
      </div>

      {!canManage && (
        <div className="mx-6 mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You have read-only access to site settings. Contact an admin to make changes.
        </div>
      )}

      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-6 rounded-lg border border-gray-200 p-4">
          <div className="space-y-1">
            <Label htmlFor="allow-edit-after-completion" className="text-base font-semibold text-gray-900">
              Allow editing matches after completion
            </Label>
            <p className="text-sm text-gray-500">
              When on, admins can edit a match on the edit page (date, scores, status, etc.) after it has
              been marked <span className="font-mono">COMPLETED</span>. Off by default to keep finals immutable.
            </p>
            <p className="text-xs text-amber-700">
              Heads up: standings and leader caches are not auto-recalculated for post-completion edits.
              Re-run the recalc job if you change scores.
            </p>
          </div>
          <Switch
            id="allow-edit-after-completion"
            checked={allowEdit}
            onCheckedChange={setAllowEdit}
            disabled={!canManage}
          />
        </div>
      </div>
    </div>
  );
}
