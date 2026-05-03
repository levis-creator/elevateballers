import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

// Defaults match the values currently hardcoded on the homepage so the
// editor opens showing the live state.
const DEFAULT_TITLE = "Elevate Ballers - Kenya's Premier Basketball League";
const DEFAULT_DESCRIPTION =
  "Elevate Ballers is Kenya's premier basketball league. Follow live standings, rising stars, match results, and join our growing basketball community in Nairobi.";
const DEFAULT_IMAGE = "/images/Elevate_Icon-200x200.png";

// Recommended ranges per Seobility / Google guidelines.
const TITLE_MIN = 30;
const TITLE_MAX = 60;
const DESCRIPTION_MIN = 150;
const DESCRIPTION_MAX = 170;

function CharCounter({ value, min, max }: { value: string; min: number; max: number }) {
  const len = value.length;
  const inRange = len >= min && len <= max;
  const tone = len === 0
    ? 'text-gray-400'
    : inRange
      ? 'text-green-600'
      : len < min
        ? 'text-amber-600'
        : 'text-red-600';
  return (
    <span className={`text-xs ${tone}`}>
      {len} / recommended {min}–{max} chars
    </span>
  );
}

export default function SeoSettingsEditor() {
  const { can } = usePermissions();
  const canManage = can('site_settings:manage');

  const [settings, setSettings] = useState<Record<string, SiteSetting>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [imageUrl, setImageUrl] = useState(DEFAULT_IMAGE);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings?category=seo');
      if (res.ok) {
        const data: SiteSetting[] = await res.json();
        const map: Record<string, SiteSetting> = {};
        data.forEach((s) => {
          map[s.key] = s;
          if (s.key === 'seo_homepage_title' && s.value) setTitle(s.value);
          if (s.key === 'seo_homepage_description' && s.value) setDescription(s.value);
          if (s.key === 'seo_homepage_image') setImageUrl(s.value || DEFAULT_IMAGE);
        });
        setSettings(map);
      }
    } catch (error) {
      console.error('Error fetching SEO settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: string, label: string, type = 'text') => {
    const existing = settings[key];
    const res = existing
      ? await fetch(`/api/settings/${existing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value }),
        })
      : await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value, label, type, category: 'seo' }),
        });

    if (!res.ok) {
      const detail = await res.text().catch(() => res.statusText);
      throw new Error(`Save failed for "${key}" (HTTP ${res.status}): ${detail}`);
    }
  };

  const handleSave = async () => {
    if (!canManage) {
      alert('You do not have permission to manage site settings.');
      return;
    }
    setSaving(true);
    try {
      await Promise.all([
        saveSetting('seo_homepage_title', title, 'Homepage SEO Title'),
        saveSetting('seo_homepage_description', description, 'Homepage SEO Meta Description'),
        saveSetting('seo_homepage_image', imageUrl, 'Homepage SEO Share Image'),
      ]);
      alert('SEO settings saved successfully!');
      fetchSettings();
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error saving SEO settings:\n\n${msg}\n\nCheck the browser console for details.`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading...</div>;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold font-heading text-gray-900">SEO Settings</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Controls how the homepage appears in Google search results and on social media shares.
            Changes take up to ~60s to appear due to edge caching.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || !canManage}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {!canManage && (
        <div className="mx-6 mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You have read-only access. Contact an admin to make changes.
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Homepage Title */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="seo-homepage-title" className="text-sm font-medium text-gray-700">
              Homepage Title
            </Label>
            <CharCounter value={title} min={TITLE_MIN} max={TITLE_MAX} />
          </div>
          <Input
            id="seo-homepage-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!canManage}
            placeholder="e.g. Elevate Ballers - Kenya's Premier Basketball League"
            maxLength={120}
          />
          <p className="text-xs text-gray-500">
            Shows in browser tabs and as the blue link in Google search results.
          </p>
        </div>

        {/* Homepage Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="seo-homepage-description" className="text-sm font-medium text-gray-700">
              Homepage Meta Description
            </Label>
            <CharCounter value={description} min={DESCRIPTION_MIN} max={DESCRIPTION_MAX} />
          </div>
          <Textarea
            id="seo-homepage-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!canManage}
            placeholder="One or two sentences inviting visitors to the site."
            rows={3}
            maxLength={300}
          />
          <p className="text-xs text-gray-500">
            Shows as the grey snippet under the title in Google search results.
            Make it inviting — it's your sales pitch in the SERP.
          </p>
        </div>

        {/* Homepage Share Image */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">
            Homepage Share Image (Open Graph / Twitter Card)
          </Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { if (!canManage) return; setIsMediaPickerOpen(true); }}
              disabled={!canManage}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              {imageUrl ? 'Change Image' : 'Select Image'}
            </Button>
            {imageUrl && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setImageUrl('')}
                disabled={!canManage}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            )}
          </div>

          {imageUrl ? (
            <div className="space-y-2">
              <div className="aspect-[1200/630] w-full max-w-md rounded-lg border overflow-hidden bg-gray-100">
                <img src={imageUrl} alt="Share image preview" className="w-full h-full object-cover" />
              </div>
              <p className="text-xs font-mono bg-gray-50 border rounded px-2 py-1.5 break-all text-gray-600">
                {imageUrl}
              </p>
            </div>
          ) : (
            <div className="aspect-[1200/630] w-full max-w-md rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 text-gray-400">
              <ImageIcon className="h-10 w-10 opacity-25" />
              <p className="text-sm">No image selected — site icon will be used as fallback</p>
            </div>
          )}

          <p className="text-xs text-gray-500">
            Shown when the homepage is shared on Facebook, Twitter, WhatsApp, etc.
            Recommended: 1200 × 630 px, under 1 MB. Keep important content centred — some platforms crop the edges.
          </p>
        </div>
      </div>

      <MediaLibraryPicker
        open={isMediaPickerOpen}
        onOpenChange={setIsMediaPickerOpen}
        onSelect={(url) => setImageUrl(url)}
        title="Select Homepage Share Image"
      />
    </div>
  );
}
