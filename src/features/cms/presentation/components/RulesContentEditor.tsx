import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/features/rbac/usePermissions';
import {
  RULES_CONTENT_KEY,
  RULES_DEFAULTS,
  mergeRulesContent,
  type RulesContent,
  type RuleSection,
  type RuleItem,
  type QuickRefItem,
} from '@/features/rules/lib/rules-content';

interface SiteSetting {
  id: string;
  key: string;
  value: string;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 p-5 space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">{title}</h3>
      {children}
    </div>
  );
}

export default function RulesContentEditor() {
  const { can } = usePermissions();
  const canManage = can('site_settings:manage');

  const [content, setContent] = useState<RulesContent>(RULES_DEFAULTS);
  const [settingId, setSettingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings?category=rules');
        if (res.ok) {
          const data: SiteSetting[] = await res.json();
          const row = data.find((s) => s.key === RULES_CONTENT_KEY);
          if (row) {
            setSettingId(row.id);
            try {
              setContent(mergeRulesContent(JSON.parse(row.value)));
            } catch {
              setContent(RULES_DEFAULTS);
            }
          }
        }
      } catch (err) {
        console.error('Error loading rules content:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // --- quick reference ---
  const addQuick = () => setContent((c) => ({ ...c, quickRef: [...c.quickRef, { value: '', label: '' }] }));
  const updateQuick = (i: number, patch: Partial<QuickRefItem>) =>
    setContent((c) => ({ ...c, quickRef: c.quickRef.map((q, idx) => (idx === i ? { ...q, ...patch } : q)) }));
  const removeQuick = (i: number) => setContent((c) => ({ ...c, quickRef: c.quickRef.filter((_, idx) => idx !== i) }));

  // --- sections ---
  const addSection = () =>
    setContent((c) => ({ ...c, sections: [...c.sections, { id: `section-${c.sections.length + 1}`, title: '', rules: [] }] }));
  const updateSection = (i: number, patch: Partial<RuleSection>) =>
    setContent((c) => ({ ...c, sections: c.sections.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) }));
  const removeSection = (i: number) => setContent((c) => ({ ...c, sections: c.sections.filter((_, idx) => idx !== i) }));

  // --- rules within a section ---
  const addRule = (si: number) =>
    setContent((c) => ({
      ...c,
      sections: c.sections.map((s, idx) => (idx === si ? { ...s, rules: [...s.rules, { tag: '', title: '', body: '' }] } : s)),
    }));
  const updateRule = (si: number, ri: number, patch: Partial<RuleItem>) =>
    setContent((c) => ({
      ...c,
      sections: c.sections.map((s, idx) =>
        idx === si ? { ...s, rules: s.rules.map((r, j) => (j === ri ? { ...r, ...patch } : r)) } : s,
      ),
    }));
  const removeRule = (si: number, ri: number) =>
    setContent((c) => ({
      ...c,
      sections: c.sections.map((s, idx) => (idx === si ? { ...s, rules: s.rules.filter((_, j) => j !== ri) } : s)),
    }));

  const handleSave = async () => {
    if (!canManage) {
      alert('You do not have permission to manage site settings.');
      return;
    }
    setSaving(true);
    try {
      const value = JSON.stringify(mergeRulesContent(content));
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
          body: JSON.stringify({ key: RULES_CONTENT_KEY, value, label: 'Rules Page Content', type: 'json', category: 'rules' }),
        });
        if (res.ok) {
          const created = await res.json();
          if (created?.id) setSettingId(created.id);
        }
      }
      alert('Rules content saved successfully!');
    } catch (err) {
      console.error('Error saving rules content:', err);
      alert('Error saving. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (confirm('Reset all rule sections, quick-reference tiles and the conduct callout to the built-in rulebook defaults? Unsaved edits will be lost.')) {
      setContent(RULES_DEFAULTS);
    }
  };

  const d = !canManage;
  if (loading) return <div className="p-6 text-sm text-gray-500">Loading…</div>;

  return (
    <div className="mt-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold font-heading text-gray-900">Rules Content</h2>
          <p className="text-sm text-gray-500 mt-0.5">Edit the quick-reference tiles, rule sections and the conduct callout shown on the public Rules page.</p>
        </div>
        <div className="flex items-center gap-2">
          {!d && (
            <Button type="button" variant="ghost" size="sm" onClick={resetToDefaults}>
              Reset to rulebook
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving || d}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {d && (
        <div className="mx-6 mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You have read-only access. Contact an admin to make changes.
        </div>
      )}

      <div className="p-6 space-y-6">
        <SectionCard title="Quick Reference Tiles">
          <div className="space-y-2">
            {content.quickRef.map((q, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input className="w-32" value={q.value} onChange={(e) => updateQuick(i, { value: e.target.value })} disabled={d} placeholder="e.g. 4×10" />
                <Input className="flex-1" value={q.label} onChange={(e) => updateQuick(i, { label: e.target.value })} disabled={d} placeholder="Label" />
                {!d && (
                  <button type="button" onClick={() => removeQuick(i)} className="text-gray-400 hover:text-red-600" aria-label="Remove tile">✕</button>
                )}
              </div>
            ))}
          </div>
          {!d && (
            <Button variant="outline" size="sm" onClick={addQuick}>+ Add tile</Button>
          )}
        </SectionCard>

        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">Rule Sections</h3>
          {content.sections.map((s, si) => (
            <div key={si} className="rounded-lg border border-gray-200 p-5 space-y-4">
              <div className="flex items-start gap-3">
                <span className="mt-2 w-6 shrink-0 text-center font-mono text-sm text-gray-400">{String(si + 1).padStart(2, '0')}</span>
                <div className="flex-1 grid grid-cols-[1fr_200px] gap-2 max-[600px]:grid-cols-1">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Section title</Label>
                    <Input
                      value={s.title}
                      onChange={(e) => updateSection(si, { title: e.target.value })}
                      onBlur={() => { if (!s.id && s.title) updateSection(si, { id: slugify(s.title) }); }}
                      disabled={d}
                      placeholder="e.g. Game Procedures"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Anchor id</Label>
                    <Input value={s.id} onChange={(e) => updateSection(si, { id: slugify(e.target.value) })} disabled={d} placeholder="game-procedures" />
                  </div>
                </div>
                {!d && (
                  <button type="button" onClick={() => removeSection(si)} className="mt-7 text-gray-400 hover:text-red-600" aria-label="Remove section">✕</button>
                )}
              </div>

              <div className="space-y-2 border-t border-gray-100 pt-3 pl-9 max-[600px]:pl-0">
                {s.rules.map((r, ri) => (
                  <div key={ri} className="flex items-start gap-2 rounded-md border border-gray-100 bg-gray-50 p-3">
                    <div className="w-16 shrink-0">
                      <Input value={r.tag} onChange={(e) => updateRule(si, ri, { tag: e.target.value })} disabled={d} placeholder="1.1" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input value={r.title} onChange={(e) => updateRule(si, ri, { title: e.target.value })} disabled={d} placeholder="Rule title" />
                      <Textarea value={r.body} onChange={(e) => updateRule(si, ri, { body: e.target.value })} disabled={d} placeholder="Rule text" rows={3} />
                    </div>
                    {!d && (
                      <button type="button" onClick={() => removeRule(si, ri)} className="mt-1 text-gray-400 hover:text-red-600" aria-label="Remove rule">✕</button>
                    )}
                  </div>
                ))}
                {!d && (
                  <Button variant="outline" size="sm" onClick={() => addRule(si)}>+ Add rule</Button>
                )}
              </div>
            </div>
          ))}
          {!d && (
            <Button variant="outline" size="sm" onClick={addSection}>+ Add section</Button>
          )}
        </div>

        <SectionCard title="Conduct Callout">
          <div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Eyebrow</Label>
              <Input value={content.conductEyebrow} onChange={(e) => setContent((c) => ({ ...c, conductEyebrow: e.target.value }))} disabled={d} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Heading</Label>
              <Input value={content.conductHeading} onChange={(e) => setContent((c) => ({ ...c, conductHeading: e.target.value }))} disabled={d} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Body</Label>
            <Textarea value={content.conductBody} onChange={(e) => setContent((c) => ({ ...c, conductBody: e.target.value }))} disabled={d} rows={4} />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
