import { useState, useEffect } from 'react';
import type { PageContent } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, AlertCircle, CheckCircle, Loader2, Save, X } from 'lucide-react';

interface PageContentEditorProps {
  pageId?: string;
}

export default function PageContentEditor({ pageId }: PageContentEditorProps) {
  const [loading, setLoading] = useState(!!pageId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    published: true,
  });

  useEffect(() => {
    if (pageId) {
      fetchPage();
    }
  }, [pageId]);

  const fetchPage = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pages/${pageId}`);
      if (!response.ok) throw new Error('Failed to fetch page');
      const page: PageContent = await response.json();

      setFormData({
        slug: page.slug,
        title: page.title,
        content: page.content,
        metaTitle: page.metaTitle || '',
        metaDescription: page.metaDescription || '',
        published: page.published,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load page');
    } finally {
      setLoading(false);
    }
  };

  const handleSlugChange = (slug: string) => {
    // Auto-generate slug from title if empty
    const newSlug = slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setFormData((prev) => ({ ...prev, slug: newSlug }));
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({ ...prev, title }));
    // Auto-generate slug if it's empty
    if (!prev.slug) {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const url = pageId ? `/api/pages/${pageId}` : '/api/pages';
      const method = pageId ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        metaTitle: formData.metaTitle || undefined,
        metaDescription: formData.metaDescription || undefined,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save page');
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/admin/pages';
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b">
        <div>
          <h1 className="text-3xl font-heading font-semibold mb-2 text-foreground">
            {pageId ? 'Edit Page' : 'Create New Page'}
          </h1>
          <p className="text-muted-foreground">
            {pageId ? 'Update page content and settings' : 'Create a new static page'}
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href="/admin/pages" data-astro-prefetch>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </a>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50 text-green-900">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>Page saved successfully! Redirecting...</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Page title, slug, and content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                disabled={saving}
                placeholder="Page Title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">
                Slug (URL) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="slug"
                type="text"
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                required
                disabled={saving || !!pageId}
                placeholder="page-url-slug"
              />
              <p className="text-sm text-muted-foreground">
                URL-friendly identifier. Auto-generated from title if left empty. Cannot be changed after creation.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">
                Content <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="content"
                rows={15}
                value={formData.content}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                required
                disabled={saving}
                placeholder="Page content (HTML supported)"
                className="font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground">
                Full page content. HTML is supported.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* SEO & Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>SEO & Metadata</CardTitle>
            <CardDescription>Search engine optimization settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                id="metaTitle"
                type="text"
                value={formData.metaTitle}
                onChange={(e) => setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))}
                disabled={saving}
                placeholder="SEO title (optional)"
              />
              <p className="text-sm text-muted-foreground">
                Used for search engines. If empty, page title will be used.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                rows={3}
                value={formData.metaDescription}
                onChange={(e) => setFormData((prev) => ({ ...prev, metaDescription: e.target.value }))}
                disabled={saving}
                placeholder="SEO description (optional)"
              />
              <p className="text-sm text-muted-foreground">
                Brief description for search engines (150-160 characters recommended).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Publishing */}
        <Card>
          <CardHeader>
            <CardTitle>Publishing</CardTitle>
            <CardDescription>Control page visibility</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, published: checked as boolean }))
                }
                disabled={saving}
              />
              <Label
                htmlFor="published"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="font-semibold">Publish this page</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Make it visible on the website
                  </span>
                </div>
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {pageId ? 'Update Page' : 'Create Page'}
              </>
            )}
          </Button>
          <Button type="button" variant="outline" asChild>
            <a href="/admin/pages" data-astro-prefetch>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </a>
          </Button>
        </div>
      </form>
    </div>
  );
}
