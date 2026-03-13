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
      await saveSetting('header_banner_image_url', headerImageUrl, 'Header Background Image URL', 'text');
      alert('Settings saved successfully!');
      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 font-heading text-gray-900 border-b pb-4">Header Settings</h2>

      {!canManageSettings && (
        <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You have read-only access to site settings. Contact an admin to make changes.
        </div>
      )}

      <div className="space-y-6 max-w-2xl">
        <div className="space-y-2">
          <Label>Header Background Image</Label>
          <div className="flex flex-col gap-4">
            {headerImageUrl ? (
              <div className="relative w-full max-w-sm aspect-video rounded-lg border overflow-hidden group">
                <img src={headerImageUrl} alt="Header Background" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => { if (!canManageSettings) return; setIsMediaPickerOpen(true); }}
                    disabled={!canManageSettings}
                  >
                    Change
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setHeaderImageUrl('')}
                    disabled={!canManageSettings}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-sm">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-24 border-dashed"
                  onClick={() => { if (!canManageSettings) return; setIsMediaPickerOpen(true); }}
                  disabled={!canManageSettings}
                >
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <ImageIcon className="h-6 w-6" />
                    <span>Select Image</span>
                  </div>
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  If no image is selected, the header will use <code>/images/Elevate_Patreon_Banner.png</code> as a fallback.
                </p>
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || !canManageSettings}
          className="w-full mt-6"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
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
