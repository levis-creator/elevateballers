import { useState, useEffect, type ComponentType } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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
  const [permissions, setPermissions] = useState<string[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
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
    // Load icons only on client side
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

  useEffect(() => {
    const bootstrap = async () => {
      await fetchPermissions();
    };
    bootstrap();
  }, []);

  const fetchPermissions = async () => {
    try {
      setPermissionsLoading(true);
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.user?.permissions || []);
      } else {
        setPermissions([]);
      }
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setPermissions([]);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const canAccess = (permission?: string) => {
    if (!permission) return true;
    return permissions.includes(permission);
  };

  const canAccessAny = (permissionList?: string[]) => {
    if (!permissionList || permissionList.length === 0) return true;
    return permissionList.some((permission) => permissions.includes(permission));
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

  const approveTeam = async (teamId: string, notificationId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      });
      if (response.ok) {
        // Mark notification as read and refresh
        await markAsRead(notificationId);
        fetchNotifications();
      } else {
        const error = await response.json();
        alert('Error approving team: ' + (error.error || 'Unknown error'));
      }
    } catch (err: any) {
      console.error('Error approving team:', err);
      alert('Error approving team: ' + err.message);
    }
  };

  const rejectTeam = async (teamId: string, notificationId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: false }),
      });
      if (response.ok) {
        // Just mark as read (team stays unapproved)
        await markAsRead(notificationId);
        fetchNotifications();
      } else {
        const error = await response.json();
        alert('Error rejecting team: ' + (error.error || 'Unknown error'));
      }
    } catch (err: any) {
      console.error('Error rejecting team:', err);
      alert('Error rejecting team: ' + err.message);
    }
  };

  const approvePlayer = async (playerId: string, notificationId: string) => {
    try {
      const response = await fetch(`/api/players/${playerId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      });
      if (response.ok) {
        await markAsRead(notificationId);
        fetchNotifications();
      } else {
        const error = await response.json();
        alert('Error approving player: ' + (error.error || 'Unknown error'));
      }
    } catch (err: any) {
      console.error('Error approving player:', err);
      alert('Error approving player: ' + err.message);
    }
  };

  const rejectPlayer = async (playerId: string, notificationId: string) => {
    try {
      const response = await fetch(`/api/players/${playerId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: false }),
      });
      if (response.ok) {
        await markAsRead(notificationId);
        fetchNotifications();
      } else {
        const error = await response.json();
        alert('Error rejecting player: ' + (error.error || 'Unknown error'));
      }
    } catch (err: any) {
      console.error('Error rejecting player:', err);
      alert('Error rejecting player: ' + err.message);
    }
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

      const [
        newsCount,
        matchesCount,
        playersCount,
        mediaCount,
        pagesCount,
      ] = await Promise.all([
        fetchCount('/api/news?admin=true', canAccess('news_articles:read')),
        fetchCount('/api/matches', canAccess('matches:read')),
        fetchCount('/api/players', canAccess('players:read')),
        fetchCount('/api/media', canAccess('media:read')),
        fetchCount('/api/pages?admin=true', canAccess('page_contents:read')),
      ]);

      setStats({
        newsCount,
        matchesCount,
        playersCount,
        mediaCount,
        pagesCount,
      });
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
  }, [permissionsLoading, permissions]);

  if (loading || permissionsLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="rounded-2xl border bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#1f2937] p-8 text-white shadow-lg">
          <Skeleton className="h-6 w-40 mb-3 bg-white/20" />
          <Skeleton className="h-10 w-64 bg-white/20" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6">
                <Skeleton className="h-14 w-14 rounded-xl mb-4" />
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-32" />
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#1e293b] p-8 text-white shadow-xl">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative z-10">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">Admin Console</p>
          <h1 className="mt-2 text-4xl font-heading font-semibold text-white">Dashboard</h1>
          <p className="mt-3 max-w-2xl text-white/75">
            Your RBAC-aware command center. We only show the modules and actions
            your role allows.
          </p>
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
              <span>You currently don’t have access to any admin modules.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <a
                key={card.title}
                href={card.link}
                className="block no-underline"
                data-astro-prefetch
              >
                <Card className="relative overflow-hidden border-0 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_60px_rgba(15,23,42,0.14)] group">
                  <div
                    className="absolute top-0 left-0 right-0 h-1 opacity-100"
                    style={{ backgroundColor: card.color }}
                  />
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-2xl bg-black/5 flex items-center justify-center flex-shrink-0"
                        style={{ color: card.color }}
                      >
                        {Icon ? <Icon size={24} /> : <Skeleton className="w-6 h-6" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-3xl font-semibold text-foreground mb-1 leading-none">
                          {card.count}
                        </h3>
                        <p className="text-sm text-muted-foreground font-medium">{card.title}</p>
                      </div>
                      <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                        {ChevronRightIcon ? (
                          <ChevronRightIcon size={18} className="group-hover:translate-x-1 transition-transform" />
                        ) : (
                          <Skeleton className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>
      )}

      {/* Dashboard Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-4 border-b">
            <CardTitle className="flex items-center gap-2 text-xl">
              {BoltIcon ? <BoltIcon size={20} /> : null}
              Quick Actions
            </CardTitle>
            <CardDescription>Create new content quickly</CardDescription>
          </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {quickActions.length === 0 && (
              <div className="text-sm text-muted-foreground">
                You don’t have any create permissions yet.
              </div>
            )}
            {quickActions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <a
                  key={action.label}
                  href={action.link}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl",
                    "border border-border bg-background",
                    "transition-all hover:bg-accent hover:border-accent-foreground/20",
                    "hover:translate-x-1 no-underline text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                    data-astro-prefetch
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ color: action.color }}
                    >
                      {ActionIcon ? <ActionIcon size={20} /> : <Skeleton className="w-5 h-5" />}
                    </div>
                    <span className="flex-1 font-medium">{action.label}</span>
                    {ChevronRightIcon ? (
                      <ChevronRightIcon size={16} className="text-muted-foreground" />
                    ) : (
                      <Skeleton className="w-4 h-4" />
                    )}
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Content Management */}
        <Card>
          <CardHeader className="pb-4 border-b">
            <CardTitle className="flex items-center gap-2 text-xl">
              {FolderOpenIcon ? <FolderOpenIcon size={20} /> : null}
              Content Management
            </CardTitle>
            <CardDescription>Manage all your content</CardDescription>
          </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {contentItems.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No content modules available for your role yet.
              </div>
            )}
            {contentItems.map((item) => {
              const ItemIcon = item.icon;
              return (
                <a
                  key={item.title}
                  href={item.link}
                  className={cn(
                    "flex items-center gap-4 p-5 rounded-xl",
                    "border border-border bg-background",
                    "transition-all hover:bg-accent hover:border-accent-foreground/20",
                    "hover:translate-x-1 no-underline text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                    data-astro-prefetch
                  >
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
                      style={{ backgroundColor: item.color }}
                    >
                      {ItemIcon ? <ItemIcon size={20} /> : <Skeleton className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    {ChevronRightIcon ? (
                      <ChevronRightIcon size={16} className="text-muted-foreground flex-shrink-0" />
                    ) : (
                      <Skeleton className="w-4 h-4" />
                    )}
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Registration Notifications */}
      {canAccess('notifications:read') && (
      <Card>
        <CardHeader className="pb-4 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            {icons.Bell ? <icons.Bell size={20} /> : null}
            Recent Registrations
          </CardTitle>
          <CardDescription>New team and player registrations</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
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
            <div className="text-center py-8 text-muted-foreground">
              <p>No new registrations</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const getIcon = () => {
                  if (notification.type === 'TEAM_REGISTERED') {
                    return icons.Users || null;
                  } else if (notification.type === 'PLAYER_REGISTERED') {
                    return icons.UserPlus || null;
                  } else {
                    return icons.Link || null;
                  }
                };

                const getColor = () => {
                  if (notification.type === 'TEAM_REGISTERED') {
                    return '#6366f1';
                  } else if (notification.type === 'PLAYER_REGISTERED') {
                    return '#22c55e';
                  } else {
                    return '#0ea5e9';
                  }
                };

                const NotificationIcon = getIcon();
                const color = getColor();
                const date = new Date(notification.createdAt);
                const timeAgo = formatTimeAgo(date);
                const canApproveTeams = canAccess('teams:approve');
                const canApprovePlayers = canAccess('players:approve');

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-xl border transition-all",
                      notification.read
                        ? "border-border bg-background opacity-60"
                        : "border-primary/20 bg-primary/5"
                    )}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
                      style={{ backgroundColor: color }}
                    >
                      {NotificationIcon ? <NotificationIcon size={20} /> : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground mb-1">{notification.message}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span>{timeAgo}</span>
                        {notification.team && (
                          <>
                            <span>•</span>
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
                            <span>•</span>
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
                              <button
                                onClick={() => approveTeam(notification.team!.id, notification.id)}
                                className="px-3 py-1 text-xs font-medium bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                title="Approve team registration"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => rejectTeam(notification.team!.id, notification.id)}
                                className="px-3 py-1 text-xs font-medium bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                title="Reject team registration"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {notification.type === 'PLAYER_REGISTERED' && notification.player && canApprovePlayers && (
                            <>
                              <button
                                onClick={() => approvePlayer(notification.player!.id, notification.id)}
                                className="px-3 py-1 text-xs font-medium bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                title="Approve player registration"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => rejectPlayer(notification.player!.id, notification.id)}
                                className="px-3 py-1 text-xs font-medium bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                title="Reject player registration"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                            title="Dismiss notification"
                          >
                            Dismiss
                          </button>
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
