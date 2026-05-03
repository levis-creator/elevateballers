import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePermissions } from '@/features/rbac/usePermissions';
import { sanitizeHtml } from '@/lib/sanitize';

interface SiteSetting {
  id: string;
  key: string;
  value: string;
  type: string;
  label: string;
  description: string | null;
  category: string | null;
}

const DEFAULT_HEADING = 'Welcome to Elevate Ballers';
const DEFAULT_SUBHEADING =
  "Your home for live matches, standings, and player news from Kenya's premier basketball league.";
const DEFAULT_BODY = `<p>This is the official site for Elevate Ballers, Kenya's premier basketball league. Use it to follow every game, every team, and every player.</p>
<p>The match carousel shows the next fixture on the schedule. Standings update after every match. The Player of the Week highlights one standout performance from the past week. News and announcements flow through the news ticker and the latest news section.</p>
<p>Want to be part of the action? Use the registration link below to sign up your team or yourself. Tryouts run throughout the year for late entries.</p>`;

function RichTextEditor({
  content,
  onChange,
  disabled,
}: {
  content: string;
  onChange: (html: string) => void;
  disabled: boolean;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);
  const isUpdatingRef = useRef(false);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || quillRef.current) return;

    const init = async () => {
      if (!editorRef.current) {
        requestAnimationFrame(init);
        return;
      }
      if (quillRef.current) return;

      const Quill = (await import('quill')).default;
      await import('quill/dist/quill.snow.css');

      if (!editorRef.current) return;

      const quill = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ header: [2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link'],
            ['clean'],
          ],
        },
      });

      quillRef.current = quill;

      if (content) {
        quill.root.innerHTML = sanitizeHtml(content);
      }

      quill.on('text-change', () => {
        if (!isUpdatingRef.current) {
          const html = quill.root.innerHTML;
          onChangeRef.current(html === '<p><br></p>' ? '' : html);
        }
      });

      quill.enable(!disabled);
    };

    init();

    return () => {
      if (quillRef.current) {
        quillRef.current.off('text-change');
      }
    };
  }, []);

  useEffect(() => {
    if (quillRef.current && content !== quillRef.current.root.innerHTML) {
      isUpdatingRef.current = true;
      quillRef.current.root.innerHTML = sanitizeHtml(content || '');
      isUpdatingRef.current = false;
    }
  }, [content]);

  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(!disabled);
    }
  }, [disabled]);

  return (
    <div className="quill-homepage-wrapper">
      <div ref={editorRef} style={{ minHeight: '320px' }} />
      <style>{`
        .quill-homepage-wrapper .ql-toolbar {
          border-radius: 6px 6px 0 0;
          border-color: #e2e8f0;
          background: #f8fafc;
        }
        .quill-homepage-wrapper .ql-container {
          border-radius: 0 0 6px 6px;
          border-color: #e2e8f0;
          font-size: 14px;
        }
        .quill-homepage-wrapper .ql-editor {
          min-height: 320px;
          line-height: 1.8;
        }
        .quill-homepage-wrapper .ql-editor p {
          margin-bottom: 12px;
        }
      `}</style>
    </div>
  );
}

export default function HomepageIntroEditor() {
  const { can } = usePermissions();
  const canManage = can('site_settings:manage');

  const [settings, setSettings] = useState<Record<string, SiteSetting>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heading, setHeading] = useState(DEFAULT_HEADING);
  const [subheading, setSubheading] = useState(DEFAULT_SUBHEADING);
  const [body, setBody] = useState(DEFAULT_BODY);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings?category=homepage');
      if (res.ok) {
        const data: SiteSetting[] = await res.json();
        const map: Record<string, SiteSetting> = {};
        data.forEach((s) => {
          map[s.key] = s;
          if (s.key === 'homepage_intro_heading') setHeading(s.value);
          if (s.key === 'homepage_intro_subheading') setSubheading(s.value);
          if (s.key === 'homepage_intro_body') setBody(s.value);
        });
        setSettings(map);
      }
    } catch (error) {
      console.error('Error fetching homepage settings:', error);
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
          body: JSON.stringify({ key, value, label, type, category: 'homepage' }),
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
        saveSetting('homepage_intro_heading', heading, 'Homepage Intro Heading'),
        saveSetting('homepage_intro_subheading', subheading, 'Homepage Intro Subheading'),
        saveSetting('homepage_intro_body', body, 'Homepage Intro Body', 'textarea'),
      ]);
      alert('Homepage intro saved successfully!');
      fetchSettings();
    } catch (error) {
      console.error('Error saving homepage settings:', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error saving settings:\n\n${msg}\n\nCheck the browser console for details.`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading...</div>;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold font-heading text-gray-900">Homepage Intro</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Orientation section that appears above the registration call-to-action on the homepage.
            Tells visitors what they can do on the site (different from the About page, which tells the league&apos;s story).
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

      <div className="p-6 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="homepage-intro-heading" className="text-sm font-medium text-gray-700">
            Heading
          </Label>
          <Input
            id="homepage-intro-heading"
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            disabled={!canManage}
            placeholder="e.g. Welcome to Elevate Ballers"
            maxLength={80}
          />
          <p className="text-xs text-gray-500">Renders as the section H2. Keep it short.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="homepage-intro-subheading" className="text-sm font-medium text-gray-700">
            Subheading
          </Label>
          <Input
            id="homepage-intro-subheading"
            value={subheading}
            onChange={(e) => setSubheading(e.target.value)}
            disabled={!canManage}
            placeholder="One-sentence tagline"
            maxLength={180}
          />
          <p className="text-xs text-gray-500">Single sentence shown directly under the heading.</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">Body</Label>
          <RichTextEditor content={body} onChange={setBody} disabled={!canManage} />
          <p className="text-xs text-gray-500">
            Aim for 400+ words written in short sentences. Avoid duplicating the About page —
            focus on what visitors can do here (live scores, standings, players, registration).
          </p>
        </div>
      </div>
    </div>
  );
}
