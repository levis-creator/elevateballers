import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MediaLibraryPicker } from './MediaLibraryPicker';
import { usePermissions } from '@/features/rbac/usePermissions';
import {
  CONTACT_CONTENT_KEY,
  CONTACT_DEFAULTS,
  mergeContactContent,
  type ContactContent,
  type ContactDepartmentItem,
} from '@/features/contact/lib/contact-content';

interface SiteSetting {
  id: string;
  key: string;
  value: string;
}

function Field({
  label,
  value,
  onChange,
  disabled,
  textarea,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  textarea?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      {textarea ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} rows={3} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
      )}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
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

export default function ContactContentEditor() {
  const { can } = usePermissions();
  const canManage = can('site_settings:manage');

  const [content, setContent] = useState<ContactContent>(CONTACT_DEFAULTS);
  const [settingId, setSettingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings?category=contact');
        if (res.ok) {
          const data: SiteSetting[] = await res.json();
          const row = data.find((s) => s.key === CONTACT_CONTENT_KEY);
          if (row) {
            setSettingId(row.id);
            try {
              setContent(mergeContactContent(JSON.parse(row.value)));
            } catch {
              setContent(CONTACT_DEFAULTS);
            }
          }
        }
      } catch (err) {
        console.error('Error loading contact content:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = <K extends keyof ContactContent>(key: K, value: ContactContent[K]) =>
    setContent((c) => ({ ...c, [key]: value }));

  // topics
  const addTopic = () => setContent((c) => ({ ...c, topics: [...c.topics, ''] }));
  const updateTopic = (i: number, value: string) => setContent((c) => ({ ...c, topics: c.topics.map((t, idx) => (idx === i ? value : t)) }));
  const removeTopic = (i: number) => setContent((c) => ({ ...c, topics: c.topics.filter((_, idx) => idx !== i) }));

  // departments
  const addDept = () => setContent((c) => ({ ...c, departments: [...c.departments, { name: '', desc: '', email: '' }] }));
  const updateDept = (i: number, patch: Partial<ContactDepartmentItem>) =>
    setContent((c) => ({ ...c, departments: c.departments.map((d, idx) => (idx === i ? { ...d, ...patch } : d)) }));
  const removeDept = (i: number) => setContent((c) => ({ ...c, departments: c.departments.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!canManage) {
      alert('You do not have permission to manage site settings.');
      return;
    }
    setSaving(true);
    try {
      const value = JSON.stringify(mergeContactContent(content));
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
          body: JSON.stringify({ key: CONTACT_CONTENT_KEY, value, label: 'Contact Page Content', type: 'json', category: 'contact' }),
        });
        if (res.ok) {
          const created = await res.json();
          if (created?.id) setSettingId(created.id);
        }
      }
      alert('Contact content saved successfully!');
    } catch (err) {
      console.error('Error saving contact content:', err);
      alert('Error saving. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const d = !canManage;
  if (loading) return <div className="p-6 text-sm text-gray-500">Loading…</div>;

  return (
    <div className="mt-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold font-heading text-gray-900">Contact Page Content</h2>
          <p className="text-sm text-gray-500 mt-0.5">Edit the hero copy, message-form text, topic list and departments. Phone, email, address and socials are managed above under Contact &amp; Social.</p>
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
          <div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
            <Field label="Eyebrow" value={content.heroEyebrow} onChange={(v) => set('heroEyebrow', v)} disabled={d} />
            <Field label="Title" value={content.heroTitle} onChange={(v) => set('heroTitle', v)} disabled={d} />
          </div>
          <Field label="Blurb" value={content.heroBlurb} onChange={(v) => set('heroBlurb', v)} disabled={d} textarea />
        </SectionCard>

        <SectionCard title="Message Form">
          <Field label="Heading" value={content.formHeading} onChange={(v) => set('formHeading', v)} disabled={d} />
          <Field label="Intro" value={content.formIntro} onChange={(v) => set('formIntro', v)} disabled={d} textarea />
        </SectionCard>

        <SectionCard title="Map / Venue Image">
          <p className="text-xs text-gray-400">Shown in the sidebar under Visit Us. Leave empty to show the placeholder tile.</p>
          <div className="flex items-center gap-3">
            <div className="h-16 w-28 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
              {content.mapImage ? (
                <img src={content.mapImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">No image</div>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={d} onClick={() => setPickerOpen(true)}>
                {content.mapImage ? 'Change' : 'Select'} image
              </Button>
              {content.mapImage && !d && (
                <Button type="button" variant="ghost" size="sm" onClick={() => set('mapImage', '')}>
                  Remove
                </Button>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Topic Options">
          <div className="space-y-2">
            {content.topics.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={t} onChange={(e) => updateTopic(i, e.target.value)} disabled={d} placeholder="e.g. Team registration" />
                {!d && (
                  <button type="button" onClick={() => removeTopic(i)} className="text-gray-400 hover:text-red-600" aria-label="Remove topic">✕</button>
                )}
              </div>
            ))}
          </div>
          {!d && (
            <Button variant="outline" size="sm" onClick={addTopic}>+ Add topic</Button>
          )}
        </SectionCard>

        <SectionCard title="Departments">
          <div className="space-y-3">
            {content.departments.map((dept, i) => (
              <div key={i} className="flex items-start gap-3 rounded-md border border-gray-100 bg-gray-50 p-3">
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-2 gap-2 max-[600px]:grid-cols-1">
                    <Input value={dept.name} onChange={(e) => updateDept(i, { name: e.target.value })} disabled={d} placeholder="Department name" />
                    <Input value={dept.email} onChange={(e) => updateDept(i, { email: e.target.value })} disabled={d} placeholder="email@elevateballers.com" />
                  </div>
                  <Textarea value={dept.desc} onChange={(e) => updateDept(i, { desc: e.target.value })} disabled={d} placeholder="What this desk handles" rows={2} />
                </div>
                {!d && (
                  <button type="button" onClick={() => removeDept(i)} className="mt-1 text-gray-400 hover:text-red-600" aria-label="Remove department">✕</button>
                )}
              </div>
            ))}
          </div>
          {!d && (
            <Button variant="outline" size="sm" onClick={addDept}>+ Add department</Button>
          )}
        </SectionCard>
      </div>

      <MediaLibraryPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(url) => set('mapImage', url)}
        title="Select map / venue image"
      />
    </div>
  );
}
