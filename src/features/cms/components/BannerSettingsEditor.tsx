import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MediaLibraryPicker } from './MediaLibraryPicker';
import { ImageIcon, X } from 'lucide-react';
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

/** Appends/replaces a ?v=<timestamp> query param to bust the browser cache. */
function withCacheBuster(url: string): string {
  if (!url) return url;
  try {
    const isAbsolute = /^https?:\/\//.test(url);
    const u = new URL(url, isAbsolute ? undefined : 'http://x');
    u.searchParams.set('v', String(Date.now()));
    return isAbsolute ? u.toString() : u.pathname + u.search;
  } catch {
    return url;
  }
}

/** Strips the ?v= cache-buster for display purposes. */
function stripCacheBuster(url: string): string {
  if (!url) return url;
  try {
    const isAbsolute = /^https?:\/\//.test(url);
    const u = new URL(url, isAbsolute ? undefined : 'http://x');
    u.searchParams.delete('v');
    const search = u.search; // empty string if no params remain
    return isAbsolute ? u.toString() : u.pathname + search;
  } catch {
    return url;
  }
}

export default function BannerSettingsEditor() {
  const { can } = usePermissions();
  const canManageSettings = can('site_settings:manage');

  const [settings, setSettings] = useState<Record<string, SiteSetting>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [headerImageUrl, setHeaderImageUrl] = useState('');
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data: SiteSetting[] = await res.json();
        const settingsMap: Record<string, SiteSetting> = {};
        data.forEach(s => {
          settingsMap[s.key] = s;
          if (s.key === 'header_banner_image_url') setHeaderImageUrl(s.value);
        });
        setSettings(settingsMap);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: string, label: string, type: string = 'text') => {
    const existing = settings[key];
    if (existing) {
      await fetch(`/api/settings/${existing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      });
    } else {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, label, type, category: 'appearance' })
      });
    }
  };

  const handleSave = async () => {
    if (!canManageSettings) {
      alert('You do not have permission to manage site settings.');
      return;
    }
    setSaving(true);
    try {
      await saveSetting('header_banner_image_url', withCacheBuster(headerImageUrl), 'Header Background Image URL', 'text');
      alert('Settings saved successfully!');
      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading settings...</div>;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold font-heading text-gray-900">Header Settings</h2>
          <p className="text-sm text-gray-500 mt-0.5">Configure the banner image shown on public pages.</p>
        </div>
        <Button onClick={handleSave} disabled={saving || !canManageSettings}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {!canManageSettings && (
        <div className="mx-6 mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You have read-only access to site settings. Contact an admin to make changes.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
        {/* Left: Controls */}
        <div className="p-6 space-y-5">
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Background Image</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { if (!canManageSettings) return; setIsMediaPickerOpen(true); }}
                disabled={!canManageSettings}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                {headerImageUrl ? 'Change Image' : 'Select Image'}
              </Button>
              {headerImageUrl && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setHeaderImageUrl('')}
                  disabled={!canManageSettings}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
            {headerImageUrl ? (
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Current path</span>
                <p className="text-xs font-mono bg-gray-50 border rounded px-2 py-1.5 break-all text-gray-600">{stripCacheBuster(headerImageUrl)}</p>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No image selected — the default banner will be used as a fallback.</p>
            )}
          </div>
        </div>

        {/* Right: Preview */}
        <div className="p-6 space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Preview</Label>
          {headerImageUrl ? (
            <div className="aspect-video w-full rounded-lg border overflow-hidden bg-gray-100">
              <img src={stripCacheBuster(headerImageUrl)} alt="Header Background" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="aspect-video w-full rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 text-gray-400">
              <ImageIcon className="h-10 w-10 opacity-25" />
              <p className="text-sm">No image selected</p>
            </div>
          )}
        </div>
      </div>

      <MediaLibraryPicker
        open={isMediaPickerOpen}
        onOpenChange={setIsMediaPickerOpen}
        onSelect={(url) => setHeaderImageUrl(url)}
        title="Select Header Background Image"
      />
    </div>
  );
}
