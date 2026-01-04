import { useState, useEffect, useRef } from 'react';
import type { NewsArticleWithAuthor } from '../types';
import { categoryMap, reverseCategoryMap } from '../types';
import { generateSlug } from '../lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, X, AlertCircle, CheckCircle, Info, Loader2, FileText } from 'lucide-react';

// Quill-based rich text editor component
function RichTextEditor({ 
  content, 
  onChange, 
  disabled 
}: { 
  content: string; 
  onChange: (html: string) => void; 
  disabled: boolean;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);
  const isUpdatingRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const [isLoading, setIsLoading] = useState(true);

  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (typeof window === 'undefined' || quillRef.current) return;

    // Dynamically import Quill only on client side
    const initQuill = async () => {
      // Wait for ref to be attached
      if (!editorRef.current) {
        // Retry on next frame
        requestAnimationFrame(initQuill);
        return;
      }

      if (quillRef.current) return;
      
      try {
        // Import Quill and CSS dynamically
        const Quill = (await import('quill')).default;
        await import('quill/dist/quill.snow.css');
        
        // CRITICAL: Import and register video blots BEFORE initializing Quill
        // The blots must be registered before Quill creates the toolbar
        // Import the modules - this will trigger blot registration
        await import('../lib/quill-embeds');
        await import('../lib/quill-horizontal-rule');
        
        // Explicitly register blots with this Quill instance to be sure
        const { YouTubeVideo, VimeoVideo } = await import('../lib/quill-embeds');
        const { HorizontalRule } = await import('../lib/quill-horizontal-rule');
        
        Quill.register(YouTubeVideo, true);
        Quill.register(VimeoVideo, true);
        Quill.register(HorizontalRule, true);
        
        // Verify blots are registered (development only)
        if (typeof window !== 'undefined' && import.meta.env.DEV && window.location.hostname === 'localhost') {
          const Parchment = Quill.import('parchment');
          const registry = Parchment?.registry;
          console.log('Blots registered:', {
            youtube: !!registry?.query('youtube'),
            vimeo: !!registry?.query('vimeo'),
            'horizontal-rule': !!registry?.query('horizontal-rule'),
            allBlots: registry ? Array.from(registry.keys?.() || []) : []
          });
        }
        
        // Setup custom toolbar icons BEFORE initializing Quill
        // This is critical - icons must be registered before toolbar creation
        const { setupCustomToolbarIcons } = await import('../lib/quill-toolbar-icons');
        await setupCustomToolbarIcons();
        
        // Import handlers (these will be initialized after Quill is created)
        const { VideoEmbedHandler } = await import('../lib/quill-embeds');
        const { TableModule } = await import('../lib/quill-table');
        const { HorizontalRuleHandler } = await import('../lib/quill-horizontal-rule');

        // Double-check ref is still available after async import
        if (!editorRef.current) {
          console.error('Editor ref lost during Quill import');
          setIsLoading(false);
          return;
        }

        // Initialize Quill with WordPress-like comprehensive toolbar
        const quill = new Quill(editorRef.current, {
          theme: 'snow',
          modules: {
            toolbar: {
              container: [
                // Row 1: Paragraph/Heading and basic formatting (WordPress-style)
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'align': [] }],
                ['blockquote', 'code-block'],
                ['link'],
                // Row 2: Media embeds
                ['image', 'youtube', 'vimeo'],
                // Row 3: Advanced formatting
                ['table', 'horizontal-rule'],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                [{ 'script': 'sub'}, { 'script': 'super' }],
                [{ 'size': ['small', false, 'large', 'huge'] }],
                // Row 4: Colors and utilities
                [{ 'color': [] }, { 'background': [] }],
                ['clean'],
                ['undo', 'redo']
              ],
              handlers: {
                // Handlers will be attached by VideoEmbedHandler, TableModule, and HorizontalRuleHandler
                youtube: function() {},
                vimeo: function() {},
                table: function() {},
                'horizontal-rule': function() {}
              }
            },
            // Enable keyboard shortcuts (undo/redo)
            keyboard: {
              bindings: {
                undo: {
                  key: 'z',
                  shortKey: true,
                  handler: function() {
                    this.quill.history.undo();
                  }
                },
                redo: {
                  key: 'z',
                  shortKey: true,
                  shiftKey: true,
                  handler: function() {
                    this.quill.history.redo();
                  }
                }
              }
            },
            // Enable history for undo/redo
            history: {
              delay: 1000,
              maxStack: 100,
              userOnly: true
            }
          },
          placeholder: 'Write your article content here...',
        });

        quillRef.current = quill;
        
        // Fallback: Set icons directly on toolbar buttons if they weren't registered
        // This ensures icons appear even if registration timing was off
        setTimeout(() => {
          const toolbar = quill.getModule('toolbar');
          if (toolbar && toolbar.container) {
            const buttons = toolbar.container.querySelectorAll('button');
            buttons.forEach((button: HTMLElement) => {
              const className = button.className;
              if (className.includes('ql-youtube') && !button.querySelector('svg')) {
                button.innerHTML = `
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
                    <path d="m10 15 5-3-5-3z"/>
                  </svg>
                `;
              } else if (className.includes('ql-vimeo') && !button.querySelector('svg')) {
                button.innerHTML = `
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                `;
              } else if (className.includes('ql-table') && !button.querySelector('svg')) {
                button.innerHTML = `
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 3v18"/>
                    <rect width="18" height="18" x="3" y="3" rx="2"/>
                    <path d="M3 9h18"/>
                    <path d="M3 15h18"/>
                  </svg>
                `;
              } else if (className.includes('ql-horizontal-rule') && !button.querySelector('svg')) {
                button.innerHTML = `
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 12h14"/>
                  </svg>
                `;
              }
            });
          }
        }, 100);
        
        // Initialize video embed handlers
        new VideoEmbedHandler(quill, {});
        
        // Initialize table module
        new TableModule(quill, {});
        
        // Initialize horizontal rule handler
        new HorizontalRuleHandler(quill);

        setIsLoading(false);

        // Set initial content
        if (content) {
          isUpdatingRef.current = true;
          quill.root.innerHTML = content;
          isUpdatingRef.current = false;
        }

        // Handle content changes
        quill.on('text-change', () => {
          if (!isUpdatingRef.current) {
            const html = quill.root.innerHTML;
            onChangeRef.current(html);
          }
        });
      } catch (error) {
        console.error('Failed to load Quill:', error);
        setIsLoading(false);
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(initQuill);

    return () => {
      if (quillRef.current) {
        quillRef.current.off('text-change');
      }
    };
  }, []);

  // Update content when it changes externally (e.g., loading an article)
  useEffect(() => {
    if (quillRef.current && content !== quillRef.current.root.innerHTML) {
      isUpdatingRef.current = true;
      quillRef.current.root.innerHTML = content || '';
      isUpdatingRef.current = false;
    }
  }, [content]);

  // Handle disabled state
  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(!disabled);
    }
  }, [disabled]);

  return (
    <div className="rich-text-editor-wrapper" style={{ position: 'relative' }}>
      {isLoading && (
        <div 
          className="rich-text-editor-loading"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            zIndex: 10
          }}
        >
          <Loader2 size={24} className="spinning" />
          <span style={{ marginLeft: '0.5rem' }}>Loading editor...</span>
        </div>
      )}
      <div ref={editorRef} className="quill-editor" />
    </div>
  );
}

interface NewsEditorProps {
  articleId?: string;
}

export default function NewsEditor({ articleId }: NewsEditorProps) {
  const [loading, setLoading] = useState(!!articleId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    category: 'Interviews' as keyof typeof categoryMap,
    image: '',
    published: false,
    feature: false,
    publishedAt: '',
  });



  useEffect(() => {
    if (articleId) {
      fetchArticle();
    }
  }, [articleId]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/news/${articleId}`);
      if (!response.ok) throw new Error('Failed to fetch article');
      const article: NewsArticleWithAuthor = await response.json();

      setFormData({
        title: article.title,
        slug: article.slug,
        content: article.content,
        excerpt: article.excerpt || '',
        category: reverseCategoryMap[article.category] as keyof typeof categoryMap,
        image: article.image || '',
        published: article.published,
        feature: article.feature || false,
        publishedAt: article.publishedAt
          ? new Date(article.publishedAt).toISOString().split('T')[0]
          : '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load article');
    } finally {
      setLoading(false);
    }
  };


  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      // Validate content is not empty
      if (!formData.content.trim() || formData.content === '<p></p>') {
        setError('Content is required');
        setSaving(false);
        return;
      }

      const url = articleId ? `/api/news/${articleId}` : '/api/news';
      const method = articleId ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        publishedAt: formData.publishedAt || undefined,
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
        throw new Error(errorData.error || 'Failed to save article');
      }

      const result = await response.json();

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/admin/news';
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save article');
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

  const categories: (keyof typeof categoryMap)[] = ['Interviews', 'Championships', 'Match report', 'Analysis'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b">
        <div>
          <h1 className="text-3xl font-heading font-semibold mb-2 text-foreground flex items-center gap-2">
            <FileText className="h-8 w-8" />
            {articleId ? 'Edit Article' : 'Create New Article'}
          </h1>
          <p className="text-muted-foreground">
            {articleId ? 'Update article details and content' : 'Add a new news article to your site'}
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href="/admin/news" data-astro-prefetch>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </a>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50 text-green-900">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Success!</strong> Article saved successfully! Redirecting...
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Article title, slug, category, and featured image</CardDescription>
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
                placeholder="Enter article title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                disabled={saving}
                placeholder="article-url-slug"
              />
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Info className="h-4 w-4" />
                Auto-generated from title if left empty
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: value as keyof typeof categoryMap,
                    }))
                  }
                  required
                  disabled={saving}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Featured Image URL</Label>
                <Input
                  id="image"
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
                  disabled={saving}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            {formData.image && (
              <div className="mt-2 border rounded-lg overflow-hidden">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-full max-h-[300px] object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
            <CardDescription>Article excerpt and main content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                rows={3}
                value={formData.excerpt}
                onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                disabled={saving}
                placeholder="Brief summary of the article (optional)"
              />
              <p className="text-sm text-muted-foreground">
                This will be displayed in article listings and previews
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">
                Content <span className="text-destructive">*</span>
              </Label>
              <div className="rich-text-editor-wrapper">
                <RichTextEditor
                  content={formData.content}
                  onChange={(html) => setFormData((prev) => ({ ...prev, content: html }))}
                  disabled={saving}
                />
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Info className="h-4 w-4" />
                WordPress-like editor: Format text, embed YouTube/Vimeo videos, insert tables, add horizontal lines, and more. Use keyboard shortcuts (Ctrl+Z for undo, Ctrl+Shift+Z for redo).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Publishing */}
        <Card>
          <CardHeader>
            <CardTitle>Publishing</CardTitle>
            <CardDescription>Control article visibility and featured status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
              <Checkbox
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, published: checked === true }))
                }
                disabled={saving}
              />
              <div className="space-y-1 leading-none">
                <Label
                  htmlFor="published"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Publish this article
                </Label>
                <p className="text-sm text-muted-foreground">
                  Make it visible on the website
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
              <Checkbox
                id="feature"
                checked={formData.feature}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, feature: checked === true }))
                }
                disabled={saving}
              />
              <div className="space-y-1 leading-none">
                <Label
                  htmlFor="feature"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Feature this article
                </Label>
                <p className="text-sm text-muted-foreground">
                  Highlight this article as featured content
                </p>
              </div>
            </div>

            {formData.published && (
              <div className="space-y-2">
                <Label htmlFor="publishedAt">Published Date</Label>
                <Input
                  id="publishedAt"
                  type="date"
                  value={formData.publishedAt}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, publishedAt: e.target.value }))
                  }
                  disabled={saving}
                />
              </div>
            )}
          </CardContent>
        </Card>

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
                {articleId ? 'Update Article' : 'Create Article'}
              </>
            )}
          </Button>
          <Button type="button" variant="outline" asChild>
            <a href="/admin/news" data-astro-prefetch>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </a>
          </Button>
        </div>
      </form>

      <style>{`
        /* Quill editor wrapper styles */
        .rich-text-editor-wrapper {
          border: 1px solid hsl(var(--input));
          border-radius: calc(var(--radius) - 2px);
          overflow: hidden;
          background: hsl(var(--background));
        }

        .rich-text-editor-wrapper:focus-within {
          border-color: hsl(var(--ring));
          box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
        }

        .quill-editor {
          min-height: 400px;
        }

        /* Quill editor styles */
        .quill-editor .ql-container {
          font-family: inherit;
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .quill-editor .ql-editor {
          min-height: 400px;
        }

        .quill-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
        }

        /* Video embeds in editor */
        .quill-editor .ql-editor .ql-video-embed {
          margin: 1.5rem 0;
        }

        .quill-editor .ql-editor .video-embed-wrapper {
          position: relative;
          padding-bottom: 56.25%;
          height: 0;
          overflow: hidden;
          max-width: 100%;
          border-radius: 8px;
          background: #000;
        }

        .quill-editor .ql-editor .video-embed-wrapper iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        /* Table styles in editor */
        .quill-editor .ql-editor table.ql-table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          border: 1px solid hsl(var(--border));
        }

        .quill-editor .ql-editor table.ql-table td,
        .quill-editor .ql-editor table.ql-table th {
          border: 1px solid hsl(var(--border));
          padding: 0.75rem;
          min-width: 100px;
        }

        .quill-editor .ql-editor table.ql-table th {
          background: hsl(var(--muted));
          font-weight: 600;
        }

        /* Horizontal rule styles in editor */
        .quill-editor .ql-editor hr.ql-horizontal-rule,
        .quill-editor .ql-editor .ql-horizontal-rule {
          margin: 2rem 0;
          border: none;
          border-top: 2px solid hsl(var(--border));
          background: none;
        }

        .quill-editor .ql-toolbar {
          border-top: none;
          border-left: none;
          border-right: none;
          border-bottom: 1px solid hsl(var(--border));
          background: hsl(var(--muted) / 0.5);
          padding: 0.75rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        /* Toolbar button groups */
        .quill-editor .ql-toolbar .ql-formats {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          margin-right: 0.5rem;
          padding-right: 0.5rem;
          border-right: 1px solid hsl(var(--border));
        }

        .quill-editor .ql-toolbar .ql-formats:last-child {
          border-right: none;
          margin-right: 0;
          padding-right: 0;
        }

        /* Better button styling */
        .quill-editor .ql-toolbar button {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .quill-editor .ql-toolbar button:hover {
          background: hsl(var(--accent));
        }

        .quill-editor .ql-toolbar button.ql-active {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }

        .quill-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: hsl(var(--primary-foreground));
        }

        .quill-editor .ql-toolbar button.ql-active .ql-fill {
          fill: hsl(var(--primary-foreground));
        }

        .quill-editor .ql-toolbar .ql-stroke {
          stroke: hsl(var(--muted-foreground));
        }

        .quill-editor .ql-toolbar .ql-fill {
          fill: hsl(var(--muted-foreground));
        }

        .quill-editor .ql-toolbar button:hover .ql-stroke,
        .quill-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: hsl(var(--primary));
        }

        .quill-editor .ql-toolbar button:hover .ql-fill,
        .quill-editor .ql-toolbar button.ql-active .ql-fill {
          fill: hsl(var(--primary));
        }

        .quill-editor .ql-container {
          border: none;
        }

        .quill-editor .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
          font-style: normal;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @media (max-width: 768px) {
          .quill-editor .ql-toolbar {
            flex-wrap: wrap;
            padding: 0.5rem;
            gap: 0.125rem;
          }

          .quill-editor .ql-toolbar .ql-formats {
            margin-right: 0.25rem;
            padding-right: 0.25rem;
            border-right: 1px solid hsl(var(--border));
          }

          .quill-editor .ql-toolbar button {
            width: 28px;
            height: 28px;
          }

          .rich-text-editor-wrapper {
            border-radius: 6px;
          }
        }

        @media (max-width: 480px) {
          .quill-editor .ql-editor {
            min-height: 300px;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}
