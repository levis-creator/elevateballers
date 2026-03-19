import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const DEFAULT_CONTENT = `<p>Elevate Ballers is a premier basketball league dedicated to promoting excellence, sportsmanship, and community engagement through competitive basketball. Founded with a vision to elevate the game and the community, we have been serving basketball enthusiasts of all ages and skill levels.</p>
<p>Our mission is to provide a platform for athletes to showcase their skills, develop their talents, and compete at the highest level while fostering a sense of community and sportsmanship. We believe that basketball is more than just a game—it's a vehicle for personal growth, teamwork, and community building.</p>
<p>We offer multiple leagues including Ballers League, Junior Ballers, Senior Ballers, Women's League, and Veterans divisions. Each league is designed to provide competitive opportunities while maintaining a focus on skill development and fair play.</p>
<p>Our state-of-the-art facilities at Pepo Lane, off Dagoretti Road, provide the perfect environment for training and competition. With multiple courts and professional coaching staff, we ensure that every player has the opportunity to reach their full potential.</p>
<p>At Elevate Ballers, we are committed to creating an inclusive environment where everyone can participate, learn, and grow. Whether you're a seasoned player or just starting out, we welcome you to join our basketball family.</p>`;

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
        quill.root.innerHTML = content;
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
      quillRef.current.root.innerHTML = content || '';
      isUpdatingRef.current = false;
    }
  }, [content]);

  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(!disabled);
    }
  }, [disabled]);

  return (
    <div className="quill-about-wrapper">
      <div ref={editorRef} style={{ minHeight: '300px' }} />
      <style>{`
        .quill-about-wrapper .ql-toolbar {
          border-radius: 6px 6px 0 0;
          border-color: #e2e8f0;
          background: #f8fafc;
        }
        .quill-about-wrapper .ql-container {
          border-radius: 0 0 6px 6px;
          border-color: #e2e8f0;
          font-size: 14px;
        }
        .quill-about-wrapper .ql-editor {
          min-height: 300px;
          line-height: 1.8;
        }
        .quill-about-wrapper .ql-editor p {
          margin-bottom: 12px;
        }
      `}</style>
    </div>
  );
}

export default function AboutPageEditor() {
  const { can } = usePermissions();
  const canManage = can('site_settings:manage');

  const [settings, setSettings] = useState<Record<string, SiteSetting>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('ABOUT');
  const [content, setContent] = useState(DEFAULT_CONTENT);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings?category=about');
      if (res.ok) {
        const data: SiteSetting[] = await res.json();
        const map: Record<string, SiteSetting> = {};
        data.forEach(s => {
          map[s.key] = s;
          if (s.key === 'about_page_title') setTitle(s.value);
          if (s.key === 'about_page_content') setContent(s.value);
        });
        setSettings(map);
      }
    } catch (error) {
      console.error('Error fetching about settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: string, label: string, type = 'text') => {
    const existing = settings[key];
    if (existing) {
      await fetch(`/api/settings/${existing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
    } else {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, label, type, category: 'about' }),
      });
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
        saveSetting('about_page_title', title, 'About Page Title'),
        saveSetting('about_page_content', content, 'About Page Content', 'textarea'),
      ]);
      alert('About page saved successfully!');
      fetchSettings();
    } catch (error) {
      console.error('Error saving about settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading...</div>;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold font-heading text-gray-900">About Page</h2>
          <p className="text-sm text-gray-500 mt-0.5">Edit the content shown on the public About page.</p>
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
        <div className="flex items-center gap-4">
          <Label htmlFor="about-title" className="w-24 shrink-0 text-sm font-medium text-gray-700">Page Title</Label>
          <Input
            id="about-title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            disabled={!canManage}
            placeholder="e.g. ABOUT"
            className="max-w-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">Page Content</Label>
          <RichTextEditor content={content} onChange={setContent} disabled={!canManage} />
        </div>
      </div>
    </div>
  );
}
