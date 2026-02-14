import { useState, useEffect, type ComponentType } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { PermissionProvider, usePermissions } from '@/features/rbac/usePermissions';
import { ToastProvider, useToast } from '@/components/ui/toast';

interface DashboardStats {
  newsCount: number;
  matchesCount: number;
  playersCount: number;
  mediaCount: number;
  pagesCount: number;
}

interface RegistrationNotification {
  id: string;
  type: 'TEAM_REGISTERED' | 'PLAYER_REGISTERED' | 'PLAYER_AUTO_LINKED';
  message: string;
  read: boolean;
  createdAt: string;
  team?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  player?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  staff?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
  metadata?: any;
}

export default function Dashboard() {
  return (
    <PermissionProvider>
      <ToastProvider>
        <DashboardContent />
      </ToastProvider>
    </PermissionProvider>
  );
}

function DashboardContent() {
  const { can, canAny, user, roles, loading: permissionsLoading } = usePermissions();
  const { addToast } = useToast();

  const [stats, setStats] = useState<DashboardStats>({
    newsCount: 0,
    matchesCount: 0,
    playersCount: 0,
    mediaCount: 0,
    pagesCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState<RegistrationNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [icons, setIcons] = useState<{
    Newspaper?: ComponentType<any>;
    Calendar?: ComponentType<any>;
    Users?: ComponentType<any>;
    Images?: ComponentType<any>;
    FileText?: ComponentType<any>;
    Plus?: ComponentType<any>;
    FolderOpen?: ComponentType<any>;
    Bolt?: ComponentType<any>;
    ChevronRight?: ComponentType<any>;
    AlertCircle?: ComponentType<any>;
    Bell?: ComponentType<any>;
    UserPlus?: ComponentType<any>;
    Link?: ComponentType<any>;
  }>({});

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        Newspaper: mod.Newspaper,
        Calendar: mod.Calendar,
        Users: mod.Users,
        Images: mod.Images,
        FileText: mod.FileText,
        Plus: mod.Plus,
        FolderOpen: mod.FolderOpen,
        Bolt: mod.Bolt,
        ChevronRight: mod.ChevronRight,
        AlertCircle: mod.AlertCircle,
        Bell: mod.Bell,
        UserPlus: mod.UserPlus,
        Link: mod.Link,
      });
    });
  }, []);

  const canAccess = (permission?: string) => {
    if (!permission) return true;
    return can(permission);
  };

  const canAccessAny = (permissionList?: string[]) => {
    if (!permissionList || permissionList.length === 0) return true;
    return canAny(permissionList);
  };

  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const response = await fetch('/api/notifications?unread=true&limit=10');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notificationId, read: true }),
      });
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const withProcessing = async (notificationId: string, fn: () => Promise<void>) => {
    setProcessingIds((prev) => new Set(prev).add(notificationId));
    try {
      await fn();
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  };

  const approveTeam = async (teamId: string, notificationId: string) => {
    await withProcessing(notificationId, async () => {
      try {
        const response = await fetch(`/api/teams/${teamId}/approve`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approved: true }),
        });
        if (response.ok) {
          addToast({ variant: 'success', title: 'Team Approved', description: 'The team registration has been approved.' });
          await markAsRead(notificationId);
          fetchNotifications();
        } else {
          const data = await response.json();
          addToast({ variant: 'error', title: 'Approval Failed', description: data.error || 'Unknown error' });
        }
      } catch (err: any) {
        addToast({ variant: 'error', title: 'Approval Failed', description: err.message });
      }
    });
  };

  const rejectTeam = async (teamId: string, notificationId: string) => {
    await withProcessing(notificationId, async () => {
      try {
        const response = await fetch(`/api/teams/${teamId}/approve`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approved: false }),
        });
        if (response.ok) {
          addToast({ variant: 'warning', title: 'Team Rejected', description: 'The team registration has been rejected.' });
          await markAsRead(notificationId);
          fetchNotifications();
        } else {
          const data = await response.json();
          addToast({ variant: 'error', title: 'Rejection Failed', description: data.error || 'Unknown error' });
        }
      } catch (err: any) {
        addToast({ variant: 'error', title: 'Rejection Failed', description: err.message });
      }
    });
  };

  const approvePlayer = async (playerId: string, notificationId: string) => {
    await withProcessing(notificationId, async () => {
      try {
        const response = await fetch(`/api/players/${playerId}/approve`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approved: true }),
        });
        if (response.ok) {
          addToast({ variant: 'success', title: 'Player Approved', description: 'The player registration has been approved.' });
          await markAsRead(notificationId);
          fetchNotifications();
        } else {
          const data = await response.json();
          addToast({ variant: 'error', title: 'Approval Failed', description: data.error || 'Unknown error' });
        }
      } catch (err: any) {
        addToast({ variant: 'error', title: 'Approval Failed', description: err.message });
      }
    });
  };

  const rejectPlayer = async (playerId: string, notificationId: string) => {
    await withProcessing(notificationId, async () => {
      try {
        const response = await fetch(`/api/players/${playerId}/approve`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approved: false }),
        });
        if (response.ok) {
          addToast({ variant: 'warning', title: 'Player Rejected', description: 'The player registration has been rejected.' });
          await markAsRead(notificationId);
          fetchNotifications();
        } else {
          const data = await response.json();
          addToast({ variant: 'error', title: 'Rejection Failed', description: data.error || 'Unknown error' });
        }
      } catch (err: any) {
        addToast({ variant: 'error', title: 'Rejection Failed', description: err.message });
      }
    });
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const fetchCount = async (url: string, allowed: boolean) => {
        if (!allowed) return 0;
        const response = await fetch(url);
        if (!response.ok) return 0;
        const data = await response.json();
        return Array.isArray(data) ? data.length : data?.length || 0;
      };

      const [newsCount, matchesCount, playersCount, mediaCount, pagesCount] = await Promise.all([
        fetchCount('/api/news?admin=true', canAccess('news_articles:read')),
        fetchCount('/api/matches', canAccess('matches:read')),
        fetchCount('/api/players', canAccess('players:read')),
        fetchCount('/api/media', canAccess('media:read')),
        fetchCount('/api/pages?admin=true', canAccess('page_contents:read')),
      ]);

      setStats({ newsCount, matchesCount, playersCount, mediaCount, pagesCount });
    } catch (err: any) {
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (permissionsLoading) return;
    fetchStats();
    if (canAccess('notifications:read')) {
      fetchNotifications();
    } else {
      setNotificationsLoading(false);
    }
  }, [permissionsLoading]);

  if (loading || permissionsLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Welcome skeleton */}
        <div className="rounded-2xl border bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#1f2937] p-8 text-white shadow-lg">
          <Skeleton className="h-4 w-24 mb-2 bg-white/10" />
          <Skeleton className="h-9 w-48 mb-3 bg-white/15" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-16 rounded-full bg-white/10" />
            <Skeleton className="h-4 w-40 bg-white/10" />
          </div>
        </div>
        {/* Stat cards skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="overflow-hidden border-0 shadow-sm">
              <CardContent className="p-5">
                <Skeleton className="h-11 w-11 rounded-xl mb-4" />
                <Skeleton className="h-7 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    const AlertCircleIcon = icons.AlertCircle;
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-destructive">
            {AlertCircleIcon ? <AlertCircleIcon size={20} /> : null}
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const AlertCircleIcon = icons.AlertCircle;

  const statCards = [
    {
      title: 'News Articles',
      count: stats.newsCount,
      icon: icons.Newspaper,
      link: '/admin/news',
      color: '#6366f1',
      permission: 'news_articles:read',
    },
    {
      title: 'Matches',
      count: stats.matchesCount,
      icon: icons.Calendar,
      link: '/admin/matches',
      color: '#f43f5e',
      permission: 'matches:read',
    },
    {
      title: 'Players',
      count: stats.playersCount,
      icon: icons.Users,
      link: '/admin/players',
      color: '#22c55e',
      permission: 'players:read',
    },
    {
      title: 'Media Items',
      count: stats.mediaCount,
      icon: icons.Images,
      link: '/admin/media',
      color: '#f59e0b',
      permission: 'media:read',
    },
    {
      title: 'Pages',
      count: stats.pagesCount,
      icon: icons.FileText,
      link: '/admin/pages',
      color: '#0ea5e9',
      permission: 'page_contents:read',
    },
  ].filter((card) => canAccess(card.permission));

  const quickActions = [
    { icon: icons.Plus, label: 'Create News Article', link: '/admin/news/new', color: '#6366f1', permission: 'news_articles:create' },
    { icon: icons.Plus, label: 'Create Match', link: '/admin/matches/new', color: '#f43f5e', permission: 'matches:create' },
    { icon: icons.Plus, label: 'Add Player', link: '/admin/players/new', color: '#22c55e', permission: 'players:create' },
    { icon: icons.Plus, label: 'Add Media', link: '/admin/media/new', color: '#f59e0b', permission: 'media:create' },
    { icon: icons.Plus, label: 'Create Page', link: '/admin/pages/new', color: '#0ea5e9', permission: 'page_contents:create' },
  ].filter((action) => canAccess(action.permission));

  const ChevronRightIcon = icons.ChevronRight;
  const BoltIcon = icons.Bolt;
  const FolderOpenIcon = icons.FolderOpen;
  const NewspaperIcon = icons.Newspaper;
  const CalendarIcon = icons.Calendar;
  const UsersIcon = icons.Users;
  const ImagesIcon = icons.Images;
  const FileTextIcon = icons.FileText;
  const BellIcon = icons.Bell;

  const contentItems = [
    {
      icon: NewspaperIcon,
      title: 'News Articles',
      description: 'Manage news and blog posts',
      link: '/admin/news',
      color: '#6366f1',
      permission: 'news_articles:read',
    },
    {
      icon: CalendarIcon,
      title: 'Matches',
      description: 'Manage fixtures and results',
      link: '/admin/matches',
      color: '#f43f5e',
      permission: 'matches:read',
    },
    {
      icon: UsersIcon,
      title: 'Players',
      description: 'Manage player profiles',
      link: '/admin/players',
      color: '#22c55e',
      permission: 'players:read',
    },
    {
      icon: ImagesIcon,
      title: 'Media',
      description: 'Manage images, videos, and audio',
      link: '/admin/media',
      color: '#f59e0b',
      permission: 'media:read',
    },
    {
      icon: FileTextIcon,
      title: 'Pages',
      description: 'Manage static page content',
      link: '/admin/pages',
      color: '#0ea5e9',
      permission: 'page_contents:read',
    },
  ].filter((item) => canAccess(item.permission));

  const hasAnyAccess = canAccessAny([
    'news_articles:read',
    'matches:read',
    'players:read',
    'media:read',
    'page_contents:read',
    'teams:read',
    'leagues:read',
    'seasons:read',
    'staff:read',
    'roles:read',
    'users:read',
    'reports:read',
    'notifications:read',
    'game_rules:read',
    'potw:read',
    'sponsors:read',
    'tournaments:read',
  ]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#1e293b] p-8 text-white shadow-xl">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative z-10">
          <p className="text-sm uppercase tracking-[0.25em] text-white/50 mb-1">
            {getGreeting()}
          </p>
          <h1 className="text-3xl md:text-4xl font-heading font-semibold text-white">
            {user?.name || 'Welcome'}
          </h1>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {roles.length > 0 && (
              <Badge className="bg-white/10 text-white/80 border-white/20 text-xs hover:bg-white/15">
                {roles[0]}
              </Badge>
            )}
            <span className="text-sm text-white/40">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Screen reader only summary */}
      <div className="sr-only">
        <h2>Content Statistics</h2>
        <ul>
          <li>News Articles: {stats.newsCount}</li>
          <li>Matches: {stats.matchesCount}</li>
          <li>Players: {stats.playersCount}</li>
          <li>Media Items: {stats.mediaCount}</li>
          <li>Pages: {stats.pagesCount}</li>
        </ul>
      </div>

      {!hasAnyAccess && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-destructive">
              {AlertCircleIcon ? <AlertCircleIcon size={20} /> : null}
              <span>You currently don't have access to any admin modules.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <a
                key={card.title}
                href={card.link}
                className="block no-underline group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
                data-astro-prefetch
                aria-label={`${card.title}: ${card.count} items. Click to manage.`}
              >
                <Card className="relative overflow-hidden border-0 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${card.color}12`, color: card.color }}
                      >
                        {Icon ? <Icon size={22} /> : <Skeleton className="w-5 h-5" />}
                      </div>
                      <div className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
                        {ChevronRightIcon && (
                          <ChevronRightIcon size={16} className="group-hover:translate-x-0.5 transition-transform" />
                        )}
                      </div>
                    </div>
                    <h3 className="text-2xl font-semibold text-foreground leading-none mb-1">
                      {card.count.toLocaleString()}
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      {card.title}
                    </p>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>
      )}

      {/* Dashboard Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <Card>
            <CardHeader className="pb-4 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                {BoltIcon ? <BoltIcon size={18} /> : null}
                Quick Actions
              </CardTitle>
              <CardDescription>Create new content quickly</CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {quickActions.map((action) => {
                  const ActionIcon = action.icon;
                  return (
                    <a
                      key={action.label}
                      href={action.link}
                      className={cn(
                        'flex items-center gap-3 p-3.5 rounded-lg',
                        'border border-border bg-background',
                        'transition-all hover:bg-accent hover:border-accent-foreground/20',
                        'hover:translate-x-0.5 no-underline text-foreground',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                      )}
                      data-astro-prefetch
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${action.color}12`, color: action.color }}
                      >
                        {ActionIcon ? <ActionIcon size={18} /> : <Skeleton className="w-4 h-4" />}
                      </div>
                      <span className="flex-1 font-medium text-sm">{action.label}</span>
                      {ChevronRightIcon ? (
                        <ChevronRightIcon size={14} className="text-muted-foreground/40" />
                      ) : null}
                    </a>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Management */}
        {contentItems.length > 0 && (
          <Card>
            <CardHeader className="pb-4 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                {FolderOpenIcon ? <FolderOpenIcon size={18} /> : null}
                Content Management
              </CardTitle>
              <CardDescription>Manage all your content</CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="space-y-2.5">
                {contentItems.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <a
                      key={item.title}
                      href={item.link}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-lg',
                        'border border-border bg-background',
                        'transition-all hover:bg-accent hover:border-accent-foreground/20',
                        'hover:translate-x-0.5 no-underline text-foreground',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                      )}
                      data-astro-prefetch
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
                        style={{ backgroundColor: item.color }}
                      >
                        {ItemIcon ? <ItemIcon size={18} /> : <Skeleton className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground text-sm mb-0.5">{item.title}</h4>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      {ChevronRightIcon ? (
                        <ChevronRightIcon size={14} className="text-muted-foreground/40 flex-shrink-0" />
                      ) : null}
                    </a>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Registration Notifications */}
      {canAccess('notifications:read') && (
        <Card>
          <CardHeader className="pb-4 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              {BellIcon ? <BellIcon size={18} /> : null}
              Recent Registrations
            </CardTitle>
            <CardDescription>New team and player registrations</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            {notificationsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-border">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                {BellIcon && <BellIcon size={32} className="mb-3 text-muted-foreground/30" />}
                <p className="font-medium text-sm">All caught up</p>
                <p className="text-xs text-muted-foreground/60 mt-1">No pending registrations</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => {
                  const getIcon = () => {
                    if (notification.type === 'TEAM_REGISTERED') return icons.Users || null;
                    if (notification.type === 'PLAYER_REGISTERED') return icons.UserPlus || null;
                    return icons.Link || null;
                  };

                  const getColor = () => {
                    if (notification.type === 'TEAM_REGISTERED') return '#6366f1';
                    if (notification.type === 'PLAYER_REGISTERED') return '#22c55e';
                    return '#0ea5e9';
                  };

                  const NotificationIcon = getIcon();
                  const color = getColor();
                  const timeAgo = formatTimeAgo(new Date(notification.createdAt));
                  const canApproveTeams = canAccess('teams:approve');
                  const canApprovePlayers = canAccess('players:approve');
                  const isProcessing = processingIds.has(notification.id);

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        'flex items-start gap-4 p-4 rounded-xl border transition-all',
                        notification.read
                          ? 'border-border bg-background opacity-60'
                          : 'border-primary/20 bg-primary/5'
                      )}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
                        style={{ backgroundColor: color }}
                      >
                        {NotificationIcon ? <NotificationIcon size={18} /> : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm mb-1">{notification.message}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span>{timeAgo}</span>
                          {notification.team && (
                            <>
                              <span>&middot;</span>
                              <a
                                href={`/admin/teams/view/${notification.team.id}`}
                                className="text-primary hover:underline"
                                onClick={() => markAsRead(notification.id)}
                              >
                                View Team
                              </a>
                            </>
                          )}
                          {notification.player && (
                            <>
                              <span>&middot;</span>
                              <a
                                href={`/admin/players/edit/${notification.player.id}`}
                                className="text-primary hover:underline"
                                onClick={() => markAsRead(notification.id)}
                              >
                                View Player
                              </a>
                            </>
                          )}
                        </div>
                        {!notification.read && (
                          <div className="flex items-center gap-2 mt-2">
                            {notification.type === 'TEAM_REGISTERED' && notification.team && canApproveTeams && (
                              <>
                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                                  disabled={isProcessing}
                                  onClick={() => approveTeam(notification.team!.id, notification.id)}
                                >
                                  {isProcessing ? 'Approving...' : 'Approve'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                                  disabled={isProcessing}
                                  onClick={() => rejectTeam(notification.team!.id, notification.id)}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {notification.type === 'PLAYER_REGISTERED' && notification.player && canApprovePlayers && (
                              <>
                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                                  disabled={isProcessing}
                                  onClick={() => approvePlayer(notification.player!.id, notification.id)}
                                >
                                  {isProcessing ? 'Approving...' : 'Approve'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                                  disabled={isProcessing}
                                  onClick={() => rejectPlayer(notification.player!.id, notification.id)}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => markAsRead(notification.id)}
                            >
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
}
