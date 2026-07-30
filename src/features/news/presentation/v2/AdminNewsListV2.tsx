import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Grid2X2,
  Image as ImageIcon,
  List,
  MessageSquare,
  MoreHorizontal,
  Newspaper,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import type { NewsArticleDTO } from '../../../cms/types';
import { reverseCategoryMap } from '../../../cms/types';
import './admin-news.css';

type ViewMode = 'list' | 'grid';
type Status = 'published' | 'draft' | 'scheduled';

const pageSize = 8;

function getStatus(article: NewsArticleDTO): Status {
  if (article.published) return 'published';
  if (article.publishedAt && new Date(article.publishedAt).getTime() > Date.now()) return 'scheduled';
  return 'draft';
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return 'Not published';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function categoryName(article: NewsArticleDTO) {
  return reverseCategoryMap[article.category] || article.category.replaceAll('_', ' ');
}

export default function AdminNewsListV2() {
  const [articles, setArticles] = useState<NewsArticleDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | Status>('all');
  const [category, setCategory] = useState('all');
  const [author, setAuthor] = useState('all');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [view, setView] = useState<ViewMode>('list');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/news?admin=true');
      if (!response.ok) throw new Error('Unable to load news articles');
      setArticles(await response.json());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load news articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);
  useEffect(() => { setPage(1); }, [query, status, category, author, sort]);

  const categories = useMemo(() => [...new Set(articles.map(categoryName))].sort(), [articles]);
  const authors = useMemo(() => [...new Map(articles.map((article) => [article.author.id, article.author.name])).entries()], [articles]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return articles
      .filter((article) => !needle || [article.title, article.slug, article.author.name].some((value) => value.toLowerCase().includes(needle)))
      .filter((article) => status === 'all' || getStatus(article) === status)
      .filter((article) => category === 'all' || categoryName(article) === category)
      .filter((article) => author === 'all' || article.author.id === author)
      .sort((a, b) => sort === 'title'
        ? a.title.localeCompare(b.title)
        : (new Date(sort === 'newest' ? b.createdAt : a.createdAt).getTime() - new Date(sort === 'newest' ? a.createdAt : b.createdAt).getTime()));
  }, [articles, query, status, category, author, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const allVisibleSelected = visible.length > 0 && visible.every((article) => selected.has(article.id));
  const counts = useMemo(() => articles.reduce((result, article) => {
    result[getStatus(article)] += 1;
    return result;
  }, { published: 0, draft: 0, scheduled: 0 }), [articles]);
  const pendingComments = articles.reduce((sum, article) => sum + (article.commentsCount || 0), 0);

  const toggle = (id: string) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleVisible = () => setSelected((current) => {
    const next = new Set(current);
    if (allVisibleSelected) visible.forEach((article) => next.delete(article.id));
    else visible.forEach((article) => next.add(article.id));
    return next;
  });
  const reset = () => { setQuery(''); setStatus('all'); setCategory('all'); setAuthor('all'); setSort('newest'); setSelected(new Set()); };

  const deleteArticles = async (ids: string[]) => {
    if (!window.confirm(`Delete ${ids.length} article${ids.length === 1 ? '' : 's'}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const response = ids.length === 1
        ? await fetch(`/api/news/${ids[0]}`, { method: 'DELETE' })
        : await fetch('/api/news/bulk-delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
      if (!response.ok) throw new Error('Delete failed');
      setSelected(new Set());
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Delete failed');
    } finally { setBusy(false); }
  };

  if (loading) return <div className="eb-news-loading"><div /><div /><div /></div>;
  if (error) return <div className="eb-news-error"><Newspaper size={28} /><strong>Could not load articles</strong><span>{error}</span><button onClick={() => void load()}><RefreshCw size={14} /> Try again</button></div>;

  return <section className="eb-news-page">
    <header className="eb-news-heading">
      <div><div className="eb-news-eyebrow">Editorial</div><h1>News Articles</h1><p>Manage the stories, analysis, and announcements that shape your league’s voice.</p></div>
      <div className="eb-news-heading-actions"><a className="eb-news-quiet" href="/admin/media"><ImageIcon size={15} /> Media library</a><a className="eb-news-primary" href="/admin/news/new"><Plus size={15} /> New article</a></div>
    </header>

    <div className="eb-news-kpis">
      <button onClick={() => { setStatus('all'); }}><span className="red"><Newspaper size={17} /></span><strong>{articles.length}</strong><small>Total articles</small></button>
      <button onClick={() => setStatus('published')}><span className="green"><CheckCircle2 size={17} /></span><strong>{counts.published}</strong><small>Published</small></button>
      <button onClick={() => setStatus('draft')}><span className="amber"><FileText size={17} /></span><strong>{counts.draft}</strong><small>Drafts</small></button>
      <button onClick={() => setStatus('scheduled')}><span className="blue"><Clock3 size={17} /></span><strong>{counts.scheduled}</strong><small>Scheduled</small></button>
      <div><span className="purple"><MessageSquare size={17} /></span><strong>{pendingComments}</strong><small>Comments</small></div>
    </div>

    <div className="eb-news-card">
      <div className="eb-news-toolbar">
        <label className="eb-news-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title, slug or author…" aria-label="Search news articles" /></label>
        <div className="eb-news-status-pills">{(['all', 'published', 'draft', 'scheduled'] as const).map((value) => <button key={value} className={status === value ? 'active' : ''} onClick={() => setStatus(value)}>{value === 'all' ? 'All' : value}</button>)}</div>
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category"><option value="all">All categories</option>{categories.map((value) => <option key={value}>{value}</option>)}</select>
        <select value={author} onChange={(event) => setAuthor(event.target.value)} aria-label="Filter by author"><option value="all">All authors</option>{authors.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
        <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} aria-label="Sort articles"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="title">Title A–Z</option></select>
        <button className="eb-news-reset" onClick={reset}><X size={13} /> Reset</button>
        <div className="eb-news-view"><button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} aria-label="List view"><List size={15} /></button><button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')} aria-label="Grid view"><Grid2X2 size={15} /></button></div>
      </div>

      {selected.size > 0 && <div className="eb-news-bulk"><strong>{selected.size} selected</strong><button onClick={() => void deleteArticles([...selected])} disabled={busy}><Trash2 size={14} /> Delete</button><button onClick={() => setSelected(new Set())}><X size={14} /> Clear</button></div>}

      {visible.length === 0 ? <div className="eb-news-empty"><Archive size={32} /><strong>{articles.length ? 'No matching articles' : 'No articles yet'}</strong><span>{articles.length ? 'Try changing your filters.' : 'Create your first story to get started.'}</span>{articles.length === 0 && <a className="eb-news-primary" href="/admin/news/new"><Plus size={14} /> New article</a>}</div> : view === 'list' ? <div className="eb-news-table-scroll"><table className="eb-news-table"><thead><tr><th><button className="eb-news-check" onClick={toggleVisible} aria-label="Select visible articles">{allVisibleSelected && <Check size={12} />}</button></th><th>Article</th><th>Category</th><th>Author</th><th>Status</th><th>Date</th><th>Comments</th><th /></tr></thead><tbody>{visible.map((article) => <tr key={article.id} className={selected.has(article.id) ? 'selected' : ''}><td><button className={`eb-news-check ${selected.has(article.id) ? 'checked' : ''}`} onClick={() => toggle(article.id)} aria-label={`Select ${article.title}`}>{selected.has(article.id) && <Check size={12} />}</button></td><td><div className="eb-news-article-cell">{article.image ? <img src={article.image} alt="" /> : <span className="eb-news-thumb"><FileText size={16} /></span>}<div><strong>{article.title}</strong><small>/{article.slug}</small></div></div></td><td><span className="eb-news-chip">{categoryName(article)}</span></td><td><span className="eb-news-author"><UserRound size={13} /> {article.author.name}</span></td><td><span className={`eb-news-status ${getStatus(article)}`}><i />{getStatus(article)}</span></td><td><span className="eb-news-date"><CalendarDays size={13} /> {formatDate(article.publishedAt || article.createdAt)}</span></td><td><span className="eb-news-comments"><MessageSquare size={13} /> {article.commentsCount || 0}</span></td><td><div className="eb-news-actions"><a href={`/admin/news/view/${article.id}`} aria-label={`View ${article.title}`}><Eye size={14} /></a><a href={`/admin/news/${article.id}`} aria-label={`Edit ${article.title}`}><MoreHorizontal size={16} /></a><button onClick={() => void deleteArticles([article.id])} aria-label={`Delete ${article.title}`}><Trash2 size={14} /></button></div></td></tr>)}</tbody></table></div> : <div className="eb-news-grid">{visible.map((article) => <article className="eb-news-grid-card" key={article.id}>{article.image ? <img src={article.image} alt="" /> : <div className="eb-news-grid-placeholder"><FileText size={24} /></div>}<div className="eb-news-grid-body"><div className="eb-news-grid-meta"><span className="eb-news-chip">{categoryName(article)}</span><span className={`eb-news-status ${getStatus(article)}`}><i />{getStatus(article)}</span></div><h3>{article.title}</h3><p>{article.excerpt || article.content.replace(/<[^>]+>/g, '').slice(0, 130)}</p><footer><span>{article.author.name}</span><span>{article.commentsCount || 0} comments</span><div><a href={`/admin/news/${article.id}`}>Edit</a><button onClick={() => void deleteArticles([article.id])}><Trash2 size={14} /></button></div></footer></div></article>)}</div>}
      <footer className="eb-news-footer"><span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span><div><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ArrowLeft size={13} /> Previous</button><span>Page {page} of {pageCount}</span><button disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}>Next <ArrowRight size={13} /></button></div></footer>
    </div>
  </section>;
}
