import { useState, useEffect, type ComponentType } from 'react';
import type { NewsArticleWithAuthor } from '../types';
import { reverseCategoryMap } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

export default function NewsList() {
  const [articles, setArticles] = useState<NewsArticleWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  const [icons, setIcons] = useState<{
    Plus?: ComponentType<any>;
    Search?: ComponentType<any>;
    List?: ComponentType<any>;
    Grid?: ComponentType<any>;
    Edit?: ComponentType<any>;
    Trash2?: ComponentType<any>;
    CheckCircle?: ComponentType<any>;
    Clock?: ComponentType<any>;
    AlertCircle?: ComponentType<any>;
    Newspaper?: ComponentType<any>;
    User?: ComponentType<any>;
    Calendar?: ComponentType<any>;
    Eye?: ComponentType<any>;
    Tag?: ComponentType<any>;
    FileText?: ComponentType<any>;
    Image?: ComponentType<any>;
    Globe?: ComponentType<any>;
    RefreshCw?: ComponentType<any>;
    MoreVertical?: ComponentType<any>;
    MessageSquare?: ComponentType<any>;
  }>({});

  useEffect(() => {
    // Load icons only on client side
    import('lucide-react').then((mod) => {
      setIcons({
        Plus: mod.Plus,
        Search: mod.Search,
        List: mod.List,
        Grid: mod.Grid,
        Edit: mod.Edit,
        Trash2: mod.Trash2,
        CheckCircle: mod.CheckCircle,
        Clock: mod.Clock,
        AlertCircle: mod.AlertCircle,
        Newspaper: mod.Newspaper,
        User: mod.User,
        Calendar: mod.Calendar,
        Eye: mod.Eye,
        Tag: mod.Tag,
        FileText: mod.FileText,
        Image: mod.Image,
        Globe: mod.Globe,
        RefreshCw: mod.RefreshCw,
        MoreVertical: mod.MoreVertical,
        MessageSquare: mod.MessageSquare,
      });
    });
  }, []);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/news?admin=true');
      if (!response.ok) throw new Error('Failed to fetch articles');
      const data = await response.json();
      setArticles(data);
      
      // Fetch comment counts for all articles (including nested replies)
      const counts: Record<string, number> = {};
      await Promise.all(
        data.map(async (article: NewsArticleWithAuthor) => {
          try {
            const commentsResponse = await fetch(`/api/comments?articleId=${article.id}&admin=true`);
            if (commentsResponse.ok) {
              const comments = await commentsResponse.json();
              // Count all comments including nested replies
              const countAllComments = (commentsArray: any[]): number => {
                if (!Array.isArray(commentsArray)) return 0;
                return commentsArray.reduce((total, comment) => {
                  const replyCount = comment.replies ? countAllComments(comment.replies) : 0;
                  return total + 1 + replyCount;
                }, 0);
              };
              counts[article.id] = countAllComments(comments);
            } else {
              counts[article.id] = 0;
            }
          } catch {
            counts[article.id] = 0;
          }
        })
      );
      setCommentCounts(counts);
    } catch (err: any) {
      setError(err.message || 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this article?\n\nThis action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/news/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete article');
      
      setError('');
      fetchArticles();
    } catch (err: any) {
      setError('Error deleting article: ' + err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return 'Not published';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredArticles = articles.filter((article) =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredArticles.map(article => article.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const handleBulkDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedItems.size} article(s)?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    setIsBulkActionLoading(true);
    try {
      const response = await fetch('/api/news/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedItems) }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete articles');
      }

      clearSelection();
      fetchArticles();
    } catch (err: any) {
      setError('Error deleting articles: ' + err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const allSelected = filteredArticles.length > 0 && selectedItems.size === filteredArticles.length;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Interviews': '#667eea',
      'Championships': '#f5576c',
      'Match report': '#4facfe',
      'Analysis': '#43e97b',
    };
    return colors[category] || '#64748b';
  };

  const PlusIcon = icons.Plus;
  const SearchIcon = icons.Search;
  const ListIcon = icons.List;
  const GridIcon = icons.Grid;
  const EditIcon = icons.Edit;
  const Trash2Icon = icons.Trash2;
  const CheckCircleIcon = icons.CheckCircle;
  const ClockIcon = icons.Clock;
  const AlertCircleIcon = icons.AlertCircle;
  const NewspaperIcon = icons.Newspaper;
  const UserIcon = icons.User;
  const CalendarIcon = icons.Calendar;
  const EyeIcon = icons.Eye;
  const TagIcon = icons.Tag;
  const FileTextIcon = icons.FileText;
  const ImageIcon = icons.Image;
  const GlobeIcon = icons.Globe;
  const RefreshCwIcon = icons.RefreshCw;
  const MoreVerticalIcon = icons.MoreVertical;
  const MessageSquareIcon = icons.MessageSquare;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center gap-4">
            {AlertCircleIcon ? <AlertCircleIcon size={24} className="text-destructive" /> : null}
            <div>
              <p className="font-semibold mb-2">Error Loading Articles</p>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button onClick={fetchArticles} variant="default">
              {RefreshCwIcon ? <RefreshCwIcon size={18} className="mr-2" /> : null}
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b">
        <div>
          <h1 className="text-3xl font-heading font-semibold mb-2 text-foreground flex items-center gap-2">
            {NewspaperIcon ? <NewspaperIcon size={28} /> : null}
            News Articles
          </h1>
          <p className="text-muted-foreground">Manage your news articles and blog posts</p>
        </div>
        <Button asChild>
          <a href="/admin/news/new" data-astro-prefetch>
            {PlusIcon ? <PlusIcon size={18} className="mr-2" /> : null}
            Create Article
          </a>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          <div className="relative flex-1">
            <label htmlFor="article-search" className="sr-only">Search articles</label>
            {SearchIcon ? (
              <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            ) : null}
            <Input
              id="article-search"
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              aria-label="Search articles by title or slug"
            />
          </div>
          <div className="flex gap-2 bg-background p-1 rounded-lg border">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('table')}
              title="Table View"
              aria-label="Switch to table view"
              aria-pressed={viewMode === 'table'}
            >
              {ListIcon ? <ListIcon size={16} /> : null}
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              title="Grid View"
              aria-label="Switch to grid view"
              aria-pressed={viewMode === 'grid'}
            >
              {GridIcon ? <GridIcon size={16} /> : null}
            </Button>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedItems.size > 0 && viewMode === 'table' && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="text-sm font-medium text-foreground">
                  {selectedItems.size} article(s) selected
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={isBulkActionLoading}
                  >
                    {Trash2Icon ? <Trash2Icon size={16} className="mr-2" /> : null}
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    disabled={isBulkActionLoading}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Empty State */}
      {filteredArticles.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="text-muted-foreground">
                {searchTerm ? (
                  SearchIcon ? <SearchIcon size={64} /> : null
                ) : (
                  NewspaperIcon ? <NewspaperIcon size={64} /> : null
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {searchTerm ? 'No articles found' : 'No articles yet'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try a different search term' : 'Create your first news article to get started'}
                </p>
              </div>
              {!searchTerm && (
                <Button asChild>
                  <a href="/admin/news/new" data-astro-prefetch>
                    {PlusIcon ? <PlusIcon size={18} className="mr-2" /> : null}
                    Create Article
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        /* Table View */
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all articles"
                  />
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    {FileTextIcon ? <FileTextIcon size={16} /> : null}
                    Article
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    {TagIcon ? <TagIcon size={16} /> : null}
                    Category
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    {UserIcon ? <UserIcon size={16} /> : null}
                    Author
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    {CheckCircleIcon ? <CheckCircleIcon size={16} /> : null}
                    Status
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    {CalendarIcon ? <CalendarIcon size={16} /> : null}
                    Published
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    {MessageSquareIcon ? <MessageSquareIcon size={16} /> : null}
                    Comments
                  </div>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArticles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.has(article.id)}
                      onCheckedChange={(checked) => handleSelectItem(article.id, checked as boolean)}
                      aria-label={`Select ${article.title}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        {article.image && ImageIcon ? (
                          <ImageIcon size={14} className="text-muted-foreground flex-shrink-0" />
                        ) : null}
                        <strong className="font-semibold text-foreground">{article.title}</strong>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                        {GlobeIcon ? <GlobeIcon size={12} /> : null}
                        /{article.slug}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      style={{
                        backgroundColor: getCategoryColor(reverseCategoryMap[article.category]),
                        color: 'white',
                      }}
                      className="text-xs uppercase"
                    >
                      {TagIcon ? <TagIcon size={12} className="mr-1" /> : null}
                      {reverseCategoryMap[article.category]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {UserIcon ? <UserIcon size={16} /> : null}
                      <span>{article.author.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {article.published ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {CheckCircleIcon ? <CheckCircleIcon size={14} className="mr-1" /> : null}
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        {ClockIcon ? <ClockIcon size={14} className="mr-1" /> : null}
                        Draft
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {CalendarIcon ? <CalendarIcon size={14} /> : null}
                      <span>{formatDate(article.publishedAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {MessageSquareIcon ? <MessageSquareIcon size={14} /> : null}
                      <span>{commentCounts[article.id] ?? 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          {MoreVerticalIcon ? <MoreVerticalIcon size={18} /> : null}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a href={`/admin/news/view/${article.id}`} data-astro-prefetch>
                            {EyeIcon ? <EyeIcon size={16} className="mr-2" /> : null}
                            View
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={`/admin/news/${article.id}`} data-astro-prefetch>
                            {EditIcon ? <EditIcon size={16} className="mr-2" /> : null}
                            Edit
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(article.id!)}
                          className="text-destructive focus:text-destructive"
                        >
                          {Trash2Icon ? <Trash2Icon size={16} className="mr-2" /> : null}
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {article.image && (
                <div className="w-full h-48 overflow-hidden bg-muted">
                  <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
                </div>
              )}
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <Badge
                    style={{
                      backgroundColor: getCategoryColor(reverseCategoryMap[article.category]),
                      color: 'white',
                    }}
                    className="text-xs uppercase"
                  >
                    {TagIcon ? <TagIcon size={12} className="mr-1" /> : null}
                    {reverseCategoryMap[article.category]}
                  </Badge>
                  {article.published ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {CheckCircleIcon ? <CheckCircleIcon size={14} className="mr-1" /> : null}
                      Published
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      {ClockIcon ? <ClockIcon size={14} className="mr-1" /> : null}
                      Draft
                    </Badge>
                  )}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground flex items-center gap-2">
                  {article.image && ImageIcon ? (
                    <ImageIcon size={16} className="text-muted-foreground" />
                  ) : null}
                  {article.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {article.excerpt || article.content.substring(0, 100) + '...'}
                </p>
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {UserIcon ? <UserIcon size={14} /> : null}
                      {article.author.name}
                    </span>
                    <span className="flex items-center gap-1">
                      {CalendarIcon ? <CalendarIcon size={14} /> : null}
                      {formatDate(article.publishedAt)}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        {MoreVerticalIcon ? <MoreVerticalIcon size={16} /> : null}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <a href={`/admin/news/view/${article.id}`} data-astro-prefetch>
                          {EyeIcon ? <EyeIcon size={16} className="mr-2" /> : null}
                          View
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={`/admin/news/${article.id}`} data-astro-prefetch>
                          {EditIcon ? <EditIcon size={16} className="mr-2" /> : null}
                          Edit
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(article.id!)}
                        className="text-destructive focus:text-destructive"
                      >
                        {Trash2Icon ? <Trash2Icon size={16} className="mr-2" /> : null}
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
