import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

const DEFAULT_RULES_SETTINGS = {
  title: 'League Rules & Regulations',
  intro:
    'Read the official Elevate Ballers rules and regulations. You can view the document online or download the latest PDF.',
  pdfUrl: '/documents/elevate-ballers-league-rules-2026.pdf',
  downloadLabel: 'Download Rules PDF',
  pdfPath: '',
};

export default function RulesSettingsEditor() {
  const { can } = usePermissions();
  const canManage = can('site_settings:manage');

  const [settings, setSettings] = useState<Record<string, SiteSetting>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState(DEFAULT_RULES_SETTINGS.title);
  const [intro, setIntro] = useState(DEFAULT_RULES_SETTINGS.intro);
  const [pdfUrl, setPdfUrl] = useState(DEFAULT_RULES_SETTINGS.pdfUrl);
  const [downloadLabel, setDownloadLabel] = useState(DEFAULT_RULES_SETTINGS.downloadLabel);
  const [pdfPath, setPdfPath] = useState(DEFAULT_RULES_SETTINGS.pdfPath);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings?category=rules');
      if (!res.ok) {
        throw new Error('Failed to fetch rules settings');
      }

      const data: SiteSetting[] = await res.json();
      const map: Record<string, SiteSetting> = {};

      data.forEach((setting) => {
        map[setting.key] = setting;
      });

      setSettings(map);

      const getValue = (key: string, fallback: string) =>
        Object.prototype.hasOwnProperty.call(map, key) ? map[key].value : fallback;

      setTitle(getValue('rules_page_title', DEFAULT_RULES_SETTINGS.title));
      setIntro(getValue('rules_page_intro', DEFAULT_RULES_SETTINGS.intro));
      setPdfUrl(getValue('rules_pdf_url', DEFAULT_RULES_SETTINGS.pdfUrl));
      setDownloadLabel(getValue('rules_download_label', DEFAULT_RULES_SETTINGS.downloadLabel));
      setPdfPath(getValue('rules_pdf_path', DEFAULT_RULES_SETTINGS.pdfPath));
    } catch (error) {
      console.error('Error fetching rules settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (
    key: string,
    value: string,
    label: string,
    type: string = 'text',
    description?: string
  ) => {
    const existing = settings[key];

    if (existing) {
      await fetch(`/api/settings/${existing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      return;
    }

    if (!value) {
      return;
    }

    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key,
        value,
        label,
        type,
        description,
        category: 'rules',
      }),
    });
  };

  const handleSave = async () => {
    if (!canManage) {
      alert('You do not have permission to manage site settings.');
      return;
    }

    setSaving(true);

    try {
      const previousPdfPath = settings.rules_pdf_path?.value || '';
      const nextPdfPath = pdfPath;

      await Promise.all([
        saveSetting('rules_page_title', title, 'Rules Page Title'),
        saveSetting('rules_page_intro', intro, 'Rules Page Intro', 'textarea'),
        saveSetting(
          'rules_pdf_url',
          pdfUrl,
          'Rules PDF URL',
          'url',
          'Public URL for the PDF displayed on the Rules page.'
        ),
        saveSetting('rules_download_label', downloadLabel, 'Rules Download Button Label'),
        saveSetting('rules_pdf_path', nextPdfPath, 'Rules PDF File Path'),
      ]);

      if (previousPdfPath && previousPdfPath !== nextPdfPath) {
        await fetch('/api/settings/rules-delete-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: previousPdfPath }),
        });
      }

      alert('Rules settings saved successfully!');
      fetchSettings();
    } catch (error) {
      console.error('Error saving rules settings:', error);
      alert('Error saving rules settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      event.target.value = '';
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/settings/rules-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload PDF');
      }

      if (data.url) {
        setPdfUrl(data.url);
      }

      if (data.filePath) {
        setPdfPath(data.filePath);
      }
    } catch (error: any) {
      console.error('Error uploading rules PDF:', error);
      alert(error.message || 'Failed to upload PDF.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading rules settings...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold font-heading text-gray-900">Rules Page</h2>
          <p className="text-sm text-gray-500 mt-0.5">Control the public Rules page content and embedded PDF.</p>
        </div>
        <Button onClick={handleSave} disabled={saving || !canManage}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {!canManage && (
        <div className="mx-6 mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You have read-only access to site settings. Contact an admin to make changes.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
        {/* Left: Form fields */}
        <div className="p-6 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Page Content</h3>

          <div className="space-y-1.5">
            <Label htmlFor="rules-title">Page Title</Label>
            <Input id="rules-title" value={title} onChange={(event) => setTitle(event.target.value)} disabled={!canManage} placeholder="League Rules & Regulations" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rules-intro">Intro Text</Label>
            <Textarea id="rules-intro" value={intro} onChange={(event) => setIntro(event.target.value)} disabled={!canManage} rows={3} placeholder="Short description shown above the embedded PDF." />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rules-download-label">Download Button Label</Label>
            <Input id="rules-download-label" value={downloadLabel} onChange={(event) => setDownloadLabel(event.target.value)} disabled={!canManage} placeholder="Download Rules PDF" />
          </div>

          <div className="pt-4 border-t border-gray-100 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">PDF Source</h3>

            <div className="space-y-1.5">
              <Label htmlFor="rules-pdf-url">PDF URL</Label>
              <Input id="rules-pdf-url" type="url" value={pdfUrl} onChange={(event) => setPdfUrl(event.target.value)} disabled={!canManage} placeholder="/documents/rules.pdf" />
              <p className="text-xs text-gray-400">
                Files in <code className="bg-gray-100 px-1 rounded">public/documents/</code> can be referenced as <code className="bg-gray-100 px-1 rounded">/documents/your-file.pdf</code>
              </p>
              {pdfPath && <p className="text-xs text-gray-400">Managed path: <span className="font-mono">{pdfPath}</span></p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rules-pdf-upload">Upload New PDF</Label>
              <Input id="rules-pdf-upload" type="file" accept="application/pdf" onChange={handleFileUpload} disabled={!canManage || uploading} />
              {uploading && <p className="text-sm text-gray-500">Uploading PDF...</p>}
              <p className="text-xs text-gray-400">Uploading will automatically update the URL field above.</p>
            </div>
          </div>
        </div>

        {/* Right: Live preview */}
        <div className="p-6 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Live Preview</h3>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
            <div className="border-b border-gray-200 bg-white px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-red-600 mb-1">Official Documents</p>
              <h4 className="font-heading text-2xl font-bold text-gray-900">{title || DEFAULT_RULES_SETTINGS.title}</h4>
              <p className="mt-2 text-sm leading-6 text-gray-600">{intro || DEFAULT_RULES_SETTINGS.intro}</p>
              <div className="mt-3">
                <span className="inline-flex min-h-10 items-center justify-center rounded-full bg-red-600 px-4 text-sm font-semibold text-white">
                  {downloadLabel || DEFAULT_RULES_SETTINGS.downloadLabel}
                </span>
              </div>
            </div>

            <div className="p-3">
              {pdfUrl ? (
                <>
                  <iframe
                    src={`${pdfUrl}${pdfUrl.includes('#') ? '&' : '#'}toolbar=1&navpanes=0`}
                    title="Rules PDF preview"
                    className="h-[400px] w-full rounded-lg border border-gray-200 bg-gray-100"
                  />
                  <p className="mt-2 break-all text-xs text-gray-400">Source: {pdfUrl}</p>
                </>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-900">
                  Add or upload a PDF to preview it here.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
