import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MediaLibraryPicker } from './MediaLibraryPicker';
import { usePermissions } from '@/features/rbac/usePermissions';
import {
  ABOUT_CONTENT_KEY,
  ABOUT_DEFAULTS,
  mergeAboutContent,
  type AboutContent,
  type AboutValueItem,
  type AboutTimelineItem,
  type AboutPersonItem,
} from '@/features/about/lib/about-content';

interface SiteSetting {
  id: string;
  key: string;
  value: string;
}

/** Small labelled field. */
function Field({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  textarea,
  rows,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  placeholder?: string;
  textarea?: boolean;
  rows?: number;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      {textarea ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={placeholder} rows={rows ?? 4} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={placeholder} />
      )}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

/** Image control: thumbnail preview + select/change/remove, backed by the media library. */
function ImageField({
  label,
  value,
  disabled,
  onPick,
  onClear,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onPick: () => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      <div className="flex items-center gap-3">
        <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">No image</div>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={onPick}>
            {value ? 'Change' : 'Select'} image
          </Button>
          {value && !disabled && (
            <Button type="button" variant="ghost" size="sm" onClick={onClear}>
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 p-5 space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">{title}</h3>
      {children}
    </div>
  );
}

export default function AboutPageEditor() {
  const { can } = usePermissions();
  const canManage = can('site_settings:manage');

  const [content, setContent] = useState<AboutContent>({ ...ABOUT_DEFAULTS });
  const [settingId, setSettingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Which image the media picker targets: 'story' | 'venue' | 'person:<index>' | null.
  const [pickerTarget, setPickerTarget] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings?category=about');
        if (res.ok) {
          const data: SiteSetting[] = await res.json();
          const row = data.find((s) => s.key === ABOUT_CONTENT_KEY);
          if (row) {
            setSettingId(row.id);
            try {
              setContent(mergeAboutContent(JSON.parse(row.value)));
            } catch {
              setContent({ ...ABOUT_DEFAULTS });
            }
          }
        }
      } catch (err) {
        console.error('Error loading about content:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Scalar field setter.
  const set = <K extends keyof AboutContent>(key: K, value: AboutContent[K]) =>
    setContent((c) => ({ ...c, [key]: value }));

  // List helpers (values / timeline / people).
  const addItem = (key: 'values' | 'timeline' | 'people', empty: Record<string, string>) =>
    setContent((c) => ({ ...c, [key]: [...(c[key] as any[]), empty] }) as AboutContent);
  const updateItem = (key: 'values' | 'timeline' | 'people', i: number, patch: Record<string, string>) =>
    setContent((c) => ({ ...c, [key]: (c[key] as any[]).map((it, idx) => (idx === i ? { ...it, ...patch } : it)) }) as AboutContent);
  const removeItem = (key: 'values' | 'timeline' | 'people', i: number) =>
    setContent((c) => ({ ...c, [key]: (c[key] as any[]).filter((_, idx) => idx !== i) }) as AboutContent);

  // Apply a picked media URL to whatever target opened the picker.
  const applyPicked = (url: string) => {
    const t = pickerTarget;
    if (t === 'story') set('storyImage', url);
    else if (t === 'venue') set('venueImage', url);
    else if (t?.startsWith('person:')) updateItem('people', Number(t.slice('person:'.length)), { image: url });
    setPickerTarget(null);
  };

  const handleSave = async () => {
    if (!canManage) {
      alert('You do not have permission to manage site settings.');
      return;
    }
    setSaving(true);
    try {
      const value = JSON.stringify(mergeAboutContent(content));
      if (settingId) {
        await fetch(`/api/settings/${settingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value }),
        });
      } else {
        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: ABOUT_CONTENT_KEY, value, label: 'About Page Content', type: 'json', category: 'about' }),
        });
        if (res.ok) {
          const created = await res.json();
          if (created?.id) setSettingId(created.id);
        }
      }
      alert('About page saved successfully!');
    } catch (err) {
      console.error('Error saving about content:', err);
      alert('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const d = !canManage;
  if (loading) return <div className="p-6 text-sm text-gray-500">Loading…</div>;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold font-heading text-gray-900">About Page</h2>
          <p className="text-sm text-gray-500 mt-0.5">Edit the copy shown on the public About page. Stats, league counts and contacts are pulled live and aren’t edited here.</p>
        </div>
        <Button onClick={handleSave} disabled={saving || d}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      {d && (
        <div className="mx-6 mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You have read-only access. Contact an admin to make changes.
        </div>
      )}

      <div className="p-6 space-y-6">
        <SectionCard title="Hero">
          <Field label="Eyebrow" value={content.heroEyebrow} onChange={(v) => set('heroEyebrow', v)} disabled={d} />
          <div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
            <Field label="Title (lead)" value={content.heroTitleLead} onChange={(v) => set('heroTitleLead', v)} disabled={d} hint="First part of the headline" />
            <Field label="Title (accent word)" value={content.heroTitleAccent} onChange={(v) => set('heroTitleAccent', v)} disabled={d} hint="Shown in red" />
          </div>
          <Field label="Blurb" value={content.heroBlurb} onChange={(v) => set('heroBlurb', v)} disabled={d} textarea />
        </SectionCard>

        <SectionCard title="Story">
          <div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
            <Field label="Eyebrow" value={content.storyEyebrow} onChange={(v) => set('storyEyebrow', v)} disabled={d} />
            <Field label="Heading" value={content.storyHeading} onChange={(v) => set('storyHeading', v)} disabled={d} />
          </div>
          <Field label="Body" value={content.storyBody} onChange={(v) => set('storyBody', v)} disabled={d} textarea rows={8} hint="Separate paragraphs with a blank line." />
          <ImageField label="Story image" value={content.storyImage} disabled={d} onPick={() => setPickerTarget('story')} onClear={() => set('storyImage', '')} />
        </SectionCard>

        <SectionCard title="Section Headings">
          <div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
            <Field label="Leagues — eyebrow" value={content.leaguesEyebrow} onChange={(v) => set('leaguesEyebrow', v)} disabled={d} />
            <Field label="Leagues — heading" value={content.leaguesHeading} onChange={(v) => set('leaguesHeading', v)} disabled={d} />
            <Field label="Values — eyebrow" value={content.valuesEyebrow} onChange={(v) => set('valuesEyebrow', v)} disabled={d} />
            <Field label="Values — heading" value={content.valuesHeading} onChange={(v) => set('valuesHeading', v)} disabled={d} />
            <Field label="Timeline — eyebrow" value={content.timelineEyebrow} onChange={(v) => set('timelineEyebrow', v)} disabled={d} />
            <Field label="Timeline — heading" value={content.timelineHeading} onChange={(v) => set('timelineHeading', v)} disabled={d} />
            <Field label="Leadership — eyebrow" value={content.peopleEyebrow} onChange={(v) => set('peopleEyebrow', v)} disabled={d} />
            <Field label="Leadership — heading" value={content.peopleHeading} onChange={(v) => set('peopleHeading', v)} disabled={d} />
          </div>
        </SectionCard>

        <SectionCard title="Values">
          <div className="space-y-3">
            {content.values.map((v: AboutValueItem, i) => (
              <div key={i} className="flex items-start gap-3 rounded-md border border-gray-100 bg-gray-50 p-3">
                <span className="mt-2 w-6 shrink-0 text-center font-mono text-sm text-gray-400">{String(i + 1).padStart(2, '0')}</span>
                <div className="flex-1 space-y-2">
                  <Input value={v.title} onChange={(e) => updateItem('values', i, { title: e.target.value })} disabled={d} placeholder="Title" />
                  <Textarea value={v.body} onChange={(e) => updateItem('values', i, { body: e.target.value })} disabled={d} placeholder="Description" rows={2} />
                </div>
                {!d && (
                  <button type="button" onClick={() => removeItem('values', i)} className="mt-1 text-gray-400 hover:text-red-600" aria-label="Remove value">✕</button>
                )}
              </div>
            ))}
          </div>
          {!d && (
            <Button variant="outline" size="sm" onClick={() => addItem('values', { title: '', body: '' })}>+ Add value</Button>
          )}
        </SectionCard>

        <SectionCard title="Timeline">
          <div className="space-y-3">
            {content.timeline.map((t: AboutTimelineItem, i) => (
              <div key={i} className="flex items-start gap-3 rounded-md border border-gray-100 bg-gray-50 p-3">
                <div className="w-20 shrink-0">
                  <Input value={t.year} onChange={(e) => updateItem('timeline', i, { year: e.target.value })} disabled={d} placeholder="Year" />
                </div>
                <div className="flex-1 space-y-2">
                  <Input value={t.title} onChange={(e) => updateItem('timeline', i, { title: e.target.value })} disabled={d} placeholder="Milestone title" />
                  <Textarea value={t.body} onChange={(e) => updateItem('timeline', i, { body: e.target.value })} disabled={d} placeholder="Description" rows={2} />
                </div>
                {!d && (
                  <button type="button" onClick={() => removeItem('timeline', i)} className="mt-1 text-gray-400 hover:text-red-600" aria-label="Remove milestone">✕</button>
                )}
              </div>
            ))}
          </div>
          {!d && (
            <Button variant="outline" size="sm" onClick={() => addItem('timeline', { year: '', title: '', body: '' })}>+ Add milestone</Button>
          )}
        </SectionCard>

        <SectionCard title="Leadership">
          <div className="space-y-3">
            {content.people.map((p: AboutPersonItem, i) => (
              <div key={i} className="flex items-start gap-3 rounded-md border border-gray-100 bg-gray-50 p-3">
                <div className="flex-1 grid grid-cols-3 gap-2 max-[600px]:grid-cols-1">
                  <Input value={p.name} onChange={(e) => updateItem('people', i, { name: e.target.value })} disabled={d} placeholder="Name" />
                  <Input value={p.role} onChange={(e) => updateItem('people', i, { role: e.target.value })} disabled={d} placeholder="Role" />
                  <div className="flex items-center gap-2">
                    {p.image && <img src={p.image} alt="" className="h-9 w-9 shrink-0 rounded object-cover border border-gray-200" />}
                    <Button type="button" variant="outline" size="sm" disabled={d} onClick={() => setPickerTarget(`person:${i}`)}>
                      {p.image ? 'Change' : 'Photo'}
                    </Button>
                    {p.image && !d && (
                      <button type="button" onClick={() => updateItem('people', i, { image: '' })} className="text-xs text-gray-400 hover:text-red-600">clear</button>
                    )}
                  </div>
                </div>
                {!d && (
                  <button type="button" onClick={() => removeItem('people', i)} className="mt-1 text-gray-400 hover:text-red-600" aria-label="Remove person">✕</button>
                )}
              </div>
            ))}
          </div>
          {!d && (
            <Button variant="outline" size="sm" onClick={() => addItem('people', { name: '', role: '', image: '' })}>+ Add person</Button>
          )}
        </SectionCard>

        <SectionCard title="Venue">
          <div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
            <Field label="Eyebrow" value={content.venueEyebrow} onChange={(v) => set('venueEyebrow', v)} disabled={d} />
            <Field label="Heading" value={content.venueHeading} onChange={(v) => set('venueHeading', v)} disabled={d} />
          </div>
          <Field label="Body" value={content.venueBody} onChange={(v) => set('venueBody', v)} disabled={d} textarea />
          <ImageField label="Venue image" value={content.venueImage} disabled={d} onPick={() => setPickerTarget('venue')} onClear={() => set('venueImage', '')} />
        </SectionCard>

        <SectionCard title="Call to Action">
          <Field label="Heading" value={content.ctaHeading} onChange={(v) => set('ctaHeading', v)} disabled={d} />
          <Field label="Body" value={content.ctaBody} onChange={(v) => set('ctaBody', v)} disabled={d} textarea />
        </SectionCard>
      </div>

      <MediaLibraryPicker
        open={pickerTarget !== null}
        onOpenChange={(o) => { if (!o) setPickerTarget(null); }}
        onSelect={applyPicked}
        title="Select an image"
      />
    </div>
  );
}
