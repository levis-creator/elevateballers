import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Check, CheckCircle2, Eye, FileText, Image as ImageIcon,
  MessageSquare, MoreHorizontal, Pencil, RefreshCw, Send, Star, Tag, Trash2, X,
} from 'lucide-react';
import type { NewsArticleWithAuthor } from '../../../cms/types';
import { reverseCategoryMap } from '../../../cms/types';
import './admin-news-detail.css';
import './admin-news-detail-cards.css';

type Comment = { id: string; content: string; authorName?: string | null; authorEmail?: string | null; createdAt: string; approved: boolean; };
type Metadata = { seoTitle?: string; seoDescription?: string; socialTitle?: string; socialDescription?: string; socialImage?: string; imageAlt?: string; };
type Revision = { id: string; version: number; title: string; createdAt: string; changedBy?: { name: string } | null; };

function status(article: NewsArticleWithAuthor) {
  if (article.published) return 'Published';
  if (article.publishedAt) return new Date(article.publishedAt).getTime() > Date.now() ? 'Scheduled' : 'Published';
  return 'Draft';
}

function date(value: string | Date | null | undefined) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminNewsDetailV2({ articleId, initialArticle, initialBodyHtml }: { articleId: string; initialArticle: NewsArticleWithAuthor | null; initialBodyHtml: string }) {
  const [article, setArticle] = useState<NewsArticleWithAuthor | null>(initialArticle);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [commentTab, setCommentTab] = useState<'all' | 'pending' | 'approved'>('all');
  const [metadata, setMetadata] = useState<Metadata>({});
  const [engagement, setEngagement] = useState<Record<string, number>>({});
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [metadataSaving, setMetadataSaving] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [articleResponse, commentsResponse, metadataResponse, engagementResponse, revisionsResponse] = await Promise.all([
        fetch(`/api/news/${articleId}`),
        fetch(`/api/comments?articleId=${articleId}&admin=true`),
        fetch(`/api/news/${articleId}/metadata`),
        fetch(`/api/news/${articleId}/engagement`),
        fetch(`/api/news/${articleId}/revisions`),
      ]);
      if (!articleResponse.ok) throw new Error('Article not found');
      setArticle(await articleResponse.json());
      if (commentsResponse.ok) setComments(await commentsResponse.json());
      if (metadataResponse.ok) setMetadata(await metadataResponse.json());
      if (engagementResponse.ok) setEngagement(await engagementResponse.json());
      if (revisionsResponse.ok) setRevisions(await revisionsResponse.json());
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to load article'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [articleId]);

  const filteredComments = useMemo(() => comments.filter((comment) => commentTab === 'all' || (commentTab === 'approved' ? comment.approved : !comment.approved)), [comments, commentTab]);

  const updateArticle = async (data: Record<string, unknown>, message: string) => {
    if (!article) return;
    setSaving(true); setNotice('');
    try {
      const response = await fetch(`/api/news/${article.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!response.ok) throw new Error('Could not update article');
      setArticle(await response.json()); setNotice(message);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not update article'); }
    finally { setSaving(false); }
  };

  const updateComment = async (comment: Comment, action: 'approve' | 'reject') => {
    const response = await fetch(`/api/comments/${comment.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
    if (response.ok) setComments((current) => current.map((item) => item.id === comment.id ? { ...item, approved: action === 'approve' } : item));
  };
  const deleteComment = async (comment: Comment) => {
    if (!window.confirm('Delete this comment?')) return;
    const response = await fetch(`/api/comments/${comment.id}`, { method: 'DELETE' });
    if (response.ok) setComments((current) => current.filter((item) => item.id !== comment.id));
  };
  const saveMetadata = async () => {
    setMetadataSaving(true);
    const response = await fetch(`/api/news/${articleId}/metadata`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(metadata) });
    if (response.ok) { setMetadata(await response.json()); setNotice('SEO and social metadata saved'); }
    setMetadataSaving(false);
  };
  const restoreRevision = async (revisionId: string) => {
    if (!window.confirm('Restore this revision? The current article will be preserved as a new revision.')) return;
    const response = await fetch(`/api/news/${articleId}/revisions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revisionId }) });
    if (response.ok) { await load(); setNotice('Revision restored'); }
  };

  if (loading) return <div className="eb-news-detail-loading"><div /><div /><div /></div>;
  if (error || !article) return <div className="eb-news-detail-error"><FileText size={28} /><strong>{error || 'Article not found'}</strong><button onClick={() => void load()}><RefreshCw size={14} /> Try again</button></div>;

  const articleStatus = status(article);
  const category = reverseCategoryMap[article.category] || article.category;
  const publishedDate = article.publishedAt || article.createdAt;

  return <section className="eb-news-detail">
    <div className="eb-news-detail-actions"><a href="/admin/news"><ArrowLeft size={14} /> All articles</a><span>/</span><strong>{article.title}</strong><span className={`eb-news-detail-badge ${articleStatus.toLowerCase()}`}><i />{articleStatus}</span><span className="eb-news-detail-spacer" /><a href={`/news/${article.slug}`} target="_blank" rel="noreferrer"><Eye size={14} /> View public</a><a className="primary" href={`/admin/news/${article.id}/edit`}><Pencil size={14} /> Edit article</a><button aria-label="More options"><MoreHorizontal size={17} /></button></div>
    {notice && <div className="eb-news-detail-notice"><CheckCircle2 size={15} /> {notice}</div>}
    <div className="eb-news-detail-layout">
      <main>
        <div className="eb-news-preview-card"><div className="eb-news-preview-label"><span>Live preview · public rendering</span><span>{article.feature ? 'Featured' : 'Article'}</span></div><div className="eb-news-reader">
          <div className="eb-news-reader-category"><span className="eb-news-category"><i />{category}</span>{article.feature && <span className="eb-news-featured"><Star size={11} /> Featured</span>}</div>
          <h1>{article.title}</h1>{article.excerpt && <p className="eb-news-deck">{article.excerpt}</p>}
          <div className="eb-news-byline"><span className="eb-news-avatar">{article.author.name.slice(0, 1).toUpperCase()}</span><span><strong>{article.author.name}</strong><small>Author</small></span><time>{date(publishedDate)}</time><span>{Math.max(1, Math.ceil(article.content.replace(/<[^>]+>/g, '').split(/\s+/).length / 220))} min read</span></div>
          {article.image && <img className="eb-news-hero" src={article.image} alt={article.title} />}
          <div className="eb-news-body" dangerouslySetInnerHTML={{ __html: initialBodyHtml }} />
          <div className="eb-news-tags"><span><Tag size={13} /> {category}</span><span className="eb-news-share-label">Share article</span><button aria-label="Copy article link" onClick={() => navigator.clipboard?.writeText(window.location.href)}><Send size={13} /></button></div>
        </div></div>

        <div className="eb-news-comments-card"><header><span className="eb-news-comment-icon"><MessageSquare size={16} /></span><div><h2>Comments</h2><small>{comments.length} total · {comments.filter((comment) => !comment.approved).length} pending moderation</small></div><div className="eb-news-comment-tabs">{(['all', 'pending', 'approved'] as const).map((tab) => <button className={commentTab === tab ? 'active' : ''} onClick={() => setCommentTab(tab)} key={tab}>{tab}<b>{tab === 'all' ? comments.length : comments.filter((comment) => tab === 'approved' ? comment.approved : !comment.approved).length}</b></button>)}</div></header>
          {filteredComments.length === 0 ? <div className="eb-news-no-comments">No comments in this queue.</div> : filteredComments.map((comment) => <div className="eb-news-comment" key={comment.id}><span className="eb-news-comment-avatar">{(comment.authorName || 'A').slice(0, 1).toUpperCase()}</span><div><div className="eb-news-comment-meta"><strong>{comment.authorName || 'Anonymous'}</strong><small>{comment.authorEmail || 'No email'} · {date(comment.createdAt)}</small><em className={comment.approved ? 'approved' : 'pending'}>{comment.approved ? 'Approved' : 'Pending'}</em></div><p>{comment.content}</p><div className="eb-news-comment-actions">{!comment.approved && <button onClick={() => void updateComment(comment, 'approve')}><Check size={13} /> Approve</button>}{comment.approved && <button onClick={() => void updateComment(comment, 'reject')}><X size={13} /> Unapprove</button>}<button onClick={() => void deleteComment(comment)} className="danger"><Trash2 size={13} /> Delete</button></div></div></div>)}
        </div>
      </main>
      <aside className="eb-news-detail-rail">
        <div className="eb-news-side-card"><header>Publishing</header><div className="eb-news-side-status"><span className={article.published ? 'on' : ''}><i /></span><div><strong>{articleStatus}</strong><small>{article.published ? 'Visible on the public site' : 'Not visible publicly'}</small></div><button disabled={saving} onClick={() => void updateArticle({ published: !article.published }, article.published ? 'Article moved to draft' : 'Article published')}>{article.published ? 'Unpublish' : 'Publish'}</button></div><dl><dt>Published</dt><dd>{date(article.publishedAt)}</dd><dt>Created</dt><dd>{date(article.createdAt)}</dd><dt>Updated</dt><dd>{date(article.updatedAt)}</dd></dl></div>
        <div className="eb-news-side-card"><header>Cover image</header>{article.image ? <img className="eb-news-cover-preview" src={article.image} alt={metadata.imageAlt || article.title} /> : <div className="eb-news-cover-empty"><ImageIcon size={20} /><span>No cover image selected</span></div>}<label>Alt text<input value={metadata.imageAlt || ''} onChange={(event) => setMetadata({ ...metadata, imageAlt: event.target.value })} placeholder="Describe the cover image" /></label><small className="eb-news-help">The cover image itself is managed from Edit article.</small></div>
        <div className="eb-news-side-card"><header>Article details</header><label>Category<select value={category} onChange={(event) => void updateArticle({ category: event.target.value }, 'Category updated')}><option>Interviews</option><option>Championships</option><option>Match report</option><option>Analysis</option></select></label><div className="eb-news-side-row"><span>Featured</span><button className={`eb-news-toggle ${article.feature ? 'active' : ''}`} onClick={() => void updateArticle({ feature: !article.feature }, article.feature ? 'Removed from featured' : 'Added to featured')}><i /></button></div><div className="eb-news-slug"><small>URL slug</small><code>/{article.slug}</code></div></div>
        <div className="eb-news-side-card"><header>SEO & social</header><label>SEO title<input value={metadata.seoTitle || ''} onChange={(event) => setMetadata({ ...metadata, seoTitle: event.target.value })} placeholder={article.title} maxLength={60} /></label><label className="eb-news-label-gap">SEO description<textarea value={metadata.seoDescription || ''} onChange={(event) => setMetadata({ ...metadata, seoDescription: event.target.value })} placeholder={article.excerpt || 'Search description'} maxLength={160} /></label><label className="eb-news-label-gap">Social title<input value={metadata.socialTitle || ''} onChange={(event) => setMetadata({ ...metadata, socialTitle: event.target.value })} placeholder={article.title} maxLength={95} /></label><label className="eb-news-label-gap">Social description<textarea value={metadata.socialDescription || ''} onChange={(event) => setMetadata({ ...metadata, socialDescription: event.target.value })} placeholder={article.excerpt || 'Social description'} maxLength={200} /></label><div className="eb-news-social-preview">{metadata.socialImage || article.image ? <img src={metadata.socialImage || article.image || ''} alt="" /> : <span><ImageIcon size={18} /></span>}<strong>{metadata.socialTitle || article.title}</strong><small>elevateballers.com/news/{article.slug}</small><p>{metadata.socialDescription || metadata.seoDescription || article.excerpt || 'Add a social description.'}</p></div><button className="eb-news-save-button" disabled={metadataSaving} onClick={() => void saveMetadata()}>{metadataSaving ? 'Saving…' : 'Save SEO metadata'}</button></div>
        <div className="eb-news-side-card"><header>Engagement</header><div className="eb-news-metric-grid"><div><strong>{engagement.view || 0}</strong><small>Views</small></div><div><strong>{engagement.share || 0}</strong><small>Shares</small></div><div><strong>{engagement.copy_link || 0}</strong><small>Copies</small></div><div><strong>{comments.length}</strong><small>Comments</small></div></div></div>
        <div className="eb-news-side-card"><header>Revision history</header>{revisions.length === 0 ? <p className="eb-news-help">No revisions yet. Future saves will appear here.</p> : <div className="eb-news-revisions">{revisions.slice(0, 6).map((revision) => <div key={revision.id}><span><b>v{revision.version}</b><small>{date(revision.createdAt)} · {revision.changedBy?.name || 'Admin'}</small></span><button onClick={() => void restoreRevision(revision.id)}>Restore</button></div>)}</div>}</div>
      </aside>
    </div>
  </section>;
}
