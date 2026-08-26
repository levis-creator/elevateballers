import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Eye, Loader2, Save, X } from 'lucide-react';
import { navigate } from 'astro:transitions/client';
import type { NewsArticleWithAuthor } from '../../../cms/types';
import { categoryMap, reverseCategoryMap } from '../../../cms/types';
import { generateSlug } from '../../../cms/lib/utils';
import ImageUpload from '@/components/ImageUpload';
import './news-form-v2.css';
import './news-form-body.css';

type Metadata = { seoTitle: string; seoDescription: string; socialTitle: string; socialDescription: string; imageAlt: string };
type ArticleStatus = 'published' | 'scheduled' | 'draft';
type BodyMode = 'rich' | 'source';
const categories = ['Interviews', 'Championships', 'Match report', 'Analysis'];
type SeasonOption = { id: string; name: string; leagueSeasons?: Array<{ id: string; league?: { name: string } }> };
const emptyMetadata: Metadata = { seoTitle: '', seoDescription: '', socialTitle: '', socialDescription: '', imageAlt: '' };
const loadNewsEditor = () => import('../../../cms/presentation/components/NewsEditor');
const RichTextEditor = lazy(() => loadNewsEditor().then((module) => ({ default: module.RichTextEditor })));

function toDateTimeLocal(value: string | Date | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function NewsFormV2({ articleId }: { articleId?: string }) {
  const [loading, setLoading] = useState(Boolean(articleId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [metadata, setMetadata] = useState<Metadata>(emptyMetadata);
  const [slugLocked, setSlugLocked] = useState(Boolean(articleId));
  const [tags, setTags] = useState<string[]>([]);
  const [seasons, setSeasons] = useState<SeasonOption[]>([]);
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [bodyMode, setBodyMode] = useState<BodyMode>('rich');
  const [editorReady, setEditorReady] = useState(false);
  const [status, setStatus] = useState<ArticleStatus>('draft');
  const [form, setForm] = useState({ title: '', slug: '', content: '', excerpt: '', category: 'Interviews' as string, image: '', leagueSeasonId: '', published: false, feature: false, notifySubscribers: false, publishedAt: '' });

  useEffect(() => {
    fetch('/api/seasons').then((response) => response.ok ? response.json() : []).then((data: SeasonOption[]) => setSeasons(Array.isArray(data) ? data : [])).catch(() => setSeasons([]));
  }, []);

  useEffect(() => {
    let active = true;
    const load = () => { void loadNewsEditor().then(() => { if (active) setEditorReady(true); }).catch(() => {}); };
    const idleId = window.setTimeout(load, 600);
    return () => {
      active = false;
      window.clearTimeout(idleId);
    };
  }, []);

  useEffect(() => {
    if (!articleId) return;
    Promise.all([fetch(`/api/news/${articleId}`), fetch(`/api/news/${articleId}/metadata`)]).then(async ([articleResponse, metadataResponse]) => {
      if (!articleResponse.ok) throw new Error('Failed to load article');
      const article: NewsArticleWithAuthor = await articleResponse.json();
      const saved = metadataResponse.ok ? await metadataResponse.json() : {};
      const articleDate = article.publishedAt ? new Date(article.publishedAt) : null;
      setStatus(article.published ? 'published' : articleDate && articleDate.getTime() > Date.now() ? 'scheduled' : 'draft');
      setTags(Array.isArray(article.tags) ? article.tags : []);
      setForm({ title: article.title, slug: article.slug, content: article.content, excerpt: article.excerpt || '', category: reverseCategoryMap[article.category] || article.category, image: article.image || '', leagueSeasonId: article.leagueSeasonId || '', published: article.published, feature: article.feature, notifySubscribers: false, publishedAt: toDateTimeLocal(article.publishedAt) });
      setMetadata({ ...emptyMetadata, ...saved });
    }).catch((caught) => setError(caught instanceof Error ? caught.message : 'Failed to load article')).finally(() => setLoading(false));
  }, [articleId]);

  const update = <K extends keyof typeof form>(key: K, value: typeof form[K]) => setForm((current) => ({ ...current, [key]: value }));
  const wordCount = useMemo(() => form.content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length, [form.content]);
  const titleLength = form.title.length;
  const excerptLength = form.excerpt.length;
  const save = async (targetStatus?: ArticleStatus) => {
    setSaving(true); setError(''); setNotice('');
    try {
      if (!form.title.trim() || !form.content.replace(/<[^>]+>/g, '').trim()) throw new Error('Title and content are required');
      const nextStatus = targetStatus ?? status;
      const published = nextStatus === 'published';
      if (nextStatus === 'scheduled' && (!form.publishedAt || new Date(form.publishedAt).getTime() <= Date.now())) throw new Error('Choose a future publish date to schedule this article');
      const { notifySubscribers, ...articleForm } = form;
      const payload = { ...articleForm, tags, leagueSeasonId: form.leagueSeasonId || undefined, published, publishedAt: nextStatus === 'draft' ? undefined : (form.publishedAt || new Date().toISOString()), slug: form.slug || generateSlug(form.title) };
      const response = await fetch(articleId ? `/api/news/${articleId}` : '/api/news', { method: articleId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || 'Failed to save article'); }
      const saved = await response.json();
      const savedArticleId = articleId || saved.id;
      const metadataResponse = await fetch(`/api/news/${savedArticleId}/metadata`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(metadata) });
      if (!metadataResponse.ok) throw new Error('Article saved, but metadata could not be saved');
      if (published && notifySubscribers) {
        const notifyResponse = await fetch('/api/subscribers/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ articleId: savedArticleId }) });
        if (!notifyResponse.ok) {
          const data = await notifyResponse.json().catch(() => ({}));
          throw new Error(data.error || 'Article saved, but subscriber notification failed');
        }
      }
      setNotice(nextStatus === 'scheduled' ? 'Article scheduled successfully' : published ? 'Article published successfully' : 'Draft saved successfully');
      setStatus(nextStatus);
      setForm((current) => ({ ...current, published, notifySubscribers: false }));
      if (!articleId) setTimeout(() => navigate('/admin/news'), 900);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Failed to save article'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="eb-news-form-loading"><div /><div /><div /></div>;

  const seoTitle = metadata.seoTitle || form.title || 'Your article headline';
  const seoDescription = metadata.seoDescription || form.excerpt || 'Your article description will appear here.';
  const selectedSeason = seasons.find((season) => season.leagueSeasons?.some((entry) => entry.id === form.leagueSeasonId));
  const leagueSeasonOptions = selectedSeason?.leagueSeasons || [];

  return <section className="eb-news-form">
    <div className="eb-news-form-savebar"><a href="/admin/news"><ArrowLeft size={14} /> All articles</a><span>/</span><strong>{form.title || 'Untitled article'}</strong><span className={`eb-news-form-status ${status}`}><i />{status === 'published' ? 'Published' : status === 'scheduled' ? 'Scheduled' : 'Draft'}</span><span className="eb-news-form-save-state">{notice || (saving ? 'Saving…' : 'Saved')}</span><div className="eb-news-form-actions"><a href={articleId ? `/admin/news/${articleId}` : '/admin/news'}><Eye size={14} /> Preview</a><button onClick={() => void save('draft')} disabled={saving}>Save draft</button><button className="primary" onClick={() => void save(status === 'scheduled' ? 'scheduled' : 'published')} disabled={saving}>{saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />} {status === 'scheduled' ? 'Schedule' : status === 'published' ? 'Update article' : 'Publish'}</button></div></div>
    {error && <div className="eb-news-form-alert"><X size={15} /> {error}</div>}
    <div className="eb-news-form-layout"><main className="eb-news-form-main">
      <div className="eb-news-form-card eb-news-headline-card"><div className="eb-news-form-label-row"><label htmlFor="eb-title">Headline <em>*</em></label><span>{titleLength}/70</span></div><input id="eb-title" className="eb-news-display-input" value={form.title} maxLength={70} onChange={(event) => { update('title', event.target.value); if (!slugLocked) update('slug', generateSlug(event.target.value)); }} placeholder="Write the headline…" /><div className="eb-news-slug-row"><span>Slug</span><code>elevateballers.co.ke/news</code><input value={form.slug} onChange={(event) => { setSlugLocked(true); update('slug', event.target.value); }} placeholder="article-url-slug" /><button type="button" className={slugLocked ? 'locked' : ''} onClick={() => setSlugLocked((current) => !current)}>{slugLocked ? 'Locked' : 'Auto'}</button></div><small className="eb-news-slug-hint">{slugLocked ? 'Changing the slug may create a redirect.' : 'Slug follows the headline until you edit it.'}</small></div>
      <div className="eb-news-form-card eb-news-excerpt-card"><div className="eb-news-form-label-row"><label htmlFor="eb-excerpt">Excerpt</label><span>{excerptLength}/200</span></div><textarea id="eb-excerpt" value={form.excerpt} maxLength={200} onChange={(event) => update('excerpt', event.target.value)} placeholder="One or two lines that sell the story in listings and shares…" rows={3} /><small>Shown in article listings, the newsroom hero, and share previews.</small></div>
      <div className="eb-news-form-card eb-news-body-card"><div className="eb-news-body-heading"><span>Article body <em>*</em></span><div className="eb-news-body-modes"><button type="button" className={bodyMode === 'rich' ? 'active' : ''} onClick={() => setBodyMode('rich')}>Rich text</button><button type="button" className={bodyMode === 'source' ? 'active' : ''} onClick={() => setBodyMode('source')}>Source</button></div></div>{bodyMode === 'rich' ? <div className="eb-news-editor"><div className="eb-news-toolbar-stats"><span>{wordCount} words</span><span>·</span><span>{Math.max(1, Math.ceil(wordCount / 200))} min read</span></div>{editorReady ? <Suspense fallback={<div className="eb-news-editor-loading">Loading editor…</div>}><RichTextEditor content={form.content} onChange={(content) => update('content', content)} disabled={saving} /></Suspense> : <div className="eb-news-editor-loading">Preparing editor…</div>}</div> : <textarea className="eb-news-source-editor" value={form.content} onChange={(event) => update('content', event.target.value)} disabled={saving} aria-label="Article HTML source" />}{bodyMode === 'rich' && <div className="eb-news-editor-meta"><span>{wordCount} words</span><span>·</span><span>{Math.max(1, Math.ceil(wordCount / 200))} min read</span></div>}<div className="eb-news-editor-footer"><span>⌘Z undo · ⌘⇧Z redo</span><span>Images upload to the media library — never inline as base64</span><span className="saved-line">{notice || 'Ready to save'}</span></div></div>
    </main><aside className="eb-news-form-rail">
      <div className="eb-news-form-side eb-news-image-card"><header>Featured image</header><ImageUpload variant="article" value={form.image} onChange={(image) => update('image', image)} disabled={saving} folder="news" /><label className="eb-news-form-field"><span>Alt text <em>*</em><b>{metadata.imageAlt.length}/125</b></span><input value={metadata.imageAlt} onChange={(event) => setMetadata({ ...metadata, imageAlt: event.target.value })} placeholder="Describe the image for screen readers…" /></label><button type="button" className="eb-news-outline-button">Replace from media library</button></div>
      <div className="eb-news-form-side"><header>Classification</header><div className="eb-news-category-field"><span className="eb-news-category-label">Category <em>*</em><button type="button" onClick={() => setNewCategoryOpen((current) => !current)}>{newCategoryOpen ? 'Cancel' : '+ New category'}</button></span><div className="eb-news-category-grid" role="radiogroup" aria-label="Category">{[...new Set([...categories, ...(form.category && !categories.includes(form.category) ? [form.category] : [])])].map((category) => <button type="button" role="radio" aria-checked={form.category === category} key={category} className={form.category === category ? 'selected' : ''} onClick={() => update('category', category)}><i />{category}</button>)}</div>{newCategoryOpen && <div className="eb-news-add-category"><input autoFocus placeholder="New category name…" onKeyDown={(event) => { if (event.key === 'Escape') setNewCategoryOpen(false); if (event.key === 'Enter') { const value = event.currentTarget.value.trim(); if (value) { update('category', value); event.currentTarget.value = ''; setNewCategoryOpen(false); } } }} /><small>Press Enter to create · Esc to cancel</small></div>}</div><div className="eb-news-form-field"><span>Related competition</span><div className="eb-news-competition-grid"><select value={selectedSeason?.id || ''} onChange={(event) => { const season = seasons.find((item) => item.id === event.target.value); update('leagueSeasonId', season?.leagueSeasons?.[0]?.id || ''); }}><option value="">Not linked</option>{seasons.map((season) => <option key={season.id} value={season.id}>{season.name}</option>)}</select><select value={form.leagueSeasonId} disabled={!selectedSeason} onChange={(event) => update('leagueSeasonId', event.target.value)}><option value="">— Select league —</option>{leagueSeasonOptions.map((entry) => <option key={entry.id} value={entry.id}>{entry.league?.name || 'League'}</option>)}</select></div></div><div className="eb-news-tags"><span>Tags</span><div>{tags.map((tag) => <button type="button" key={tag} className="selected" aria-label={`Remove ${tag}`} onClick={() => setTags((current) => current.filter((item) => item !== tag))}>{tag} ×</button>)}<input placeholder="Add tag…" onKeyDown={(event) => { if (event.key === 'Backspace' && !event.currentTarget.value) setTags((current) => current.slice(0, -1)); if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); const value = event.currentTarget.value.replace(',', '').trim(); if (value && !tags.includes(value) && tags.length < 8) setTags((current) => [...current, value]); event.currentTarget.value = ''; } }} /></div><small className={tags.length > 8 ? 'over-limit' : ''}>{tags.length}/8 · Press Enter or comma to add</small></div></div>
      <div className="eb-news-form-side eb-news-publishing-card"><header>Publishing</header><div className="eb-news-status-field"><span>Status</span><div className="eb-news-status-choices"><button type="button" className={status === 'published' ? 'selected published' : ''} onClick={() => setStatus('published')}>Published</button><button type="button" className={status === 'scheduled' ? 'selected scheduled' : ''} onClick={() => setStatus('scheduled')}>Scheduled</button><button type="button" className={status === 'draft' ? 'selected draft' : ''} onClick={() => setStatus('draft')}>Draft</button></div></div><label className="eb-news-form-field"><span>{status === 'scheduled' ? 'Goes live' : 'Published date'}</span><input type="datetime-local" value={form.publishedAt} onChange={(event) => update('publishedAt', event.target.value)} /></label><div className="eb-news-form-toggle-row"><div><strong>Featured story</strong><small>Highlight in featured content</small></div><button type="button" aria-label="Featured story" aria-pressed={form.feature} className={`eb-news-toggle ${form.feature ? 'active' : ''}`} onClick={() => update('feature', !form.feature)}><i /></button></div><div className="eb-news-form-toggle-row"><div><strong>Notify subscribers</strong><small>{form.notifySubscribers ? 'Emails subscribers after publish' : 'Send once when published'}</small></div><button type="button" aria-label="Notify subscribers" aria-pressed={form.notifySubscribers} className={`eb-news-toggle ${form.notifySubscribers ? 'active' : ''}`} onClick={() => update('notifySubscribers', !form.notifySubscribers)}><i /></button></div><div className="eb-news-publishing-actions"><button type="button" onClick={() => void save('draft')} disabled={saving}>Save draft</button><button type="button" onClick={() => void save(status === 'draft' ? 'published' : status)} disabled={saving} className="primary">{saving ? 'Saving…' : status === 'scheduled' ? 'Schedule' : status === 'published' ? 'Update article' : 'Publish'}</button></div></div>
      <div className="eb-news-form-side eb-news-seo-card"><header>Search &amp; social</header><div className="eb-news-seo-preview"><code>elevateballers.co.ke/news/{form.slug || 'article-slug'}</code><strong>{seoTitle}</strong><p>{seoDescription}</p></div><small className="eb-news-help">Falls back to the headline and excerpt when left empty.</small><label className="eb-news-form-field"><span>SEO title <b>{metadata.seoTitle.length}/60</b></span><input value={metadata.seoTitle} maxLength={60} onChange={(event) => setMetadata({ ...metadata, seoTitle: event.target.value })} placeholder={form.title || 'Article title'} /></label><label className="eb-news-form-field"><span>SEO description <b>{metadata.seoDescription.length}/160</b></span><input value={metadata.seoDescription} maxLength={160} onChange={(event) => setMetadata({ ...metadata, seoDescription: event.target.value })} placeholder={form.excerpt || 'Search description'} /></label><label className="eb-news-form-field"><span>Social title <b>{metadata.socialTitle.length}/95</b></span><input value={metadata.socialTitle} maxLength={95} onChange={(event) => setMetadata({ ...metadata, socialTitle: event.target.value })} placeholder={form.title || 'Social title'} /></label><label className="eb-news-form-field"><span>Social description <b>{metadata.socialDescription.length}/200</b></span><input value={metadata.socialDescription} maxLength={200} onChange={(event) => setMetadata({ ...metadata, socialDescription: event.target.value })} placeholder={form.excerpt || 'Social description'} /></label></div>
      {articleId && <button type="button" className="eb-news-trash-button">Move to trash</button>}
    </aside></div><div className="eb-news-form-footer">Elevate Ballers CMS · Nairobi, Kenya</div>
  </section>;
}
