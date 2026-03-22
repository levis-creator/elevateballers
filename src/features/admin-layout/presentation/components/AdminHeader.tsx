import { useState, useEffect, type ComponentType } from 'react';
import { usePermissions, clearPermissionCache } from '@/features/rbac/presentation/hooks/usePermissions';
import { useNotificationsStore, type NotificationItem } from '../stores/notificationsStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const PATH_LABELS: Record<string, string> = {
  admin: 'Dashboard',
  news: 'News Articles',
  matches: 'Matches',
  players: 'Players',
  teams: 'Teams',
  leagues: 'Leagues',
  seasons: 'Seasons',
  staff: 'Staff',
  media: 'Media Library',
  pages: 'Pages',
  users: 'System Users',
  roles: 'Roles & Permissions',
  highlights: 'Highlights',
  potw: 'Player of the Week',
  sponsors: 'Sponsors',
  reports: 'Reports',
  profile: 'My Profile',
  'game-rules': 'Game Rules',
  new: 'Create New',
  edit: 'Edit',
  view: 'View',
};

export default function AdminHeader() {
  const { user, roles, can, loading } = usePermissions();
  const { notifications, unreadCount, notificationsEnabled, setNotificationsEnabled, setNotifications, dismissNotification } =
    useNotificationsStore();
  const [breadcrumbs, setBreadcrumbs] = useState<{ label: string; href: string }[]>([]);
  const [icons, setIcons] = useState<{
    Bell?: ComponentType<any>;
    ChevronRight?: ComponentType<any>;
    ExternalLink?: ComponentType<any>;
    LogOut?: ComponentType<any>;
    User?: ComponentType<any>;
    Settings?: ComponentType<any>;
    Home?: ComponentType<any>;
    ChevronDown?: ComponentType<any>;
    Check?: ComponentType<any>;
    X?: ComponentType<any>;
    BellOff?: ComponentType<any>;
  }>({});

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        Bell: mod.Bell,
        ChevronRight: mod.ChevronRight,
        ExternalLink: mod.ExternalLink,
        LogOut: mod.LogOut,
        User: mod.User,
        Settings: mod.Settings,
        Home: mod.Home,
        ChevronDown: mod.ChevronDown,
        Check: mod.Check,
        X: mod.X,
        BellOff: mod.BellOff,
      });
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pathname = window.location.pathname;
    const segments = pathname.split('/').filter(Boolean);

    const crumbs: { label: string; href: string }[] = [];
    let currentPath = '';

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentPath += `/${segment}`;

      if (i === 0 && segment === 'admin') {
        crumbs.push({ label: 'Dashboard', href: '/admin' });
        continue;
      }

      const isId = segment.length > 8 && /^[a-f0-9-]+$/i.test(segment);
      const label = isId ? 'Details' : (PATH_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '));
      crumbs.push({ label, href: currentPath });
    }

    setBreadcrumbs(crumbs);
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/notifications/settings');
        if (response.ok) {
          const data = await response.json();
          setNotificationsEnabled(Boolean(data.enabled));
        }
      } catch {
        // Non-critical; default to enabled
      }
    };

    if (!loading) {
      fetchSettings();
    }
  }, [loading]);

  useEffect(() => {
    if (loading || !can('notifications:read') || !notificationsEnabled) return;

    const fetchUnread = async () => {
      try {
        const response = await fetch('/api/notifications?unread=true&limit=10');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setNotifications(data);
          }
        }
      } catch {
        // Silently fail - notification count is non-critical
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [loading, can, notificationsEnabled]);

  const handleLogout = async () => {
    clearPermissionCache();
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        window.location.href = '/admin/login';
      }
    } catch {
      window.location.href = '/admin/login';
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, read: true }),
      });
      dismissNotification(id);
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notification.id, read: true }),
      });

      dismissNotification(notification.id);

      if (notification.type === 'TEAM_REGISTERED' && notification.team) {
        window.location.href = `/admin/teams/${notification.team.id}`;
      } else if (notification.type === 'PLAYER_REGISTERED' && notification.player) {
         window.location.href = `/admin/players/${notification.player.id}`;
      } else if (notification.type === 'PLAYER_AUTO_LINKED' && notification.player) {
         window.location.href = `/admin/players/${notification.player.id}`;
      } else if (notification.type === 'CONTACT_MESSAGE') {
         const targetId = notification.metadata?.contactMessageId;
         window.location.href = targetId ? `/admin/messages?id=${targetId}` : '/admin/messages';
      } else {
         window.location.href = '/admin/notifications';
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const BellIcon = icons.Bell;
  const ChevronRightIcon = icons.ChevronRight;
  const ExternalLinkIcon = icons.ExternalLink;
  const LogOutIcon = icons.LogOut;
  const UserIcon = icons.User;
  const SettingsIcon = icons.Settings;
  const HomeIcon = icons.Home;
  const ChevronDownIcon = icons.ChevronDown;
  const XIcon = icons.X;
  const BellOffIcon = icons.BellOff;

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 z-[998]',
        'bg-white/95 backdrop-blur-sm border-b border-border',
        'flex items-center justify-between px-8',
        'ml-[260px] w-[calc(100%-260px)]',
        'max-md:ml-0 max-md:w-full max-md:h-14 max-md:px-4 max-md:pl-16'
      )}
    >
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isFirst = index === 0;
          return (
            <div key={crumb.href} className="flex items-center gap-1.5 min-w-0">
              {index > 0 && ChevronRightIcon && (
                <ChevronRightIcon size={14} className="text-muted-foreground/50 flex-shrink-0" aria-hidden="true" />
              )}
              {isLast ? (
                <span className="font-medium text-foreground truncate" aria-current="page">
                  {isFirst && HomeIcon ? (
                    <span className="flex items-center gap-1.5">
                      <HomeIcon size={14} className="flex-shrink-0" aria-hidden="true" />
                      <span className="max-md:hidden">{crumb.label}</span>
                    </span>
                  ) : (
                    crumb.label
                  )}
                </span>
              ) : (
                <a
                  href={crumb.href}
                  className="text-muted-foreground hover:text-foreground transition-colors no-underline truncate"
                  data-astro-prefetch
                >
                  {isFirst && HomeIcon ? (
                    <span className="flex items-center gap-1.5">
                      <HomeIcon size={14} className="flex-shrink-0" aria-hidden="true" />
                      <span className="max-md:hidden">{crumb.label}</span>
                    </span>
                  ) : (
                    crumb.label
                  )}
                </a>
              )}
            </div>
          );
        })}
      </nav>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        {can('notifications:read') && notificationsEnabled && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 border-none outline-none ring-0 shadow-none hover:bg-zinc-100 hover:text-zinc-900 data-[state=open]:bg-zinc-100 data-[state=open]:text-zinc-900 admin-header-button"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              >
                {BellIcon ? <BellIcon size={18} /> : <span className="w-[18px] h-[18px]" />}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-[14px] min-w-[14px] px-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-semibold flex items-center justify-center leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 z-[1001]">
              <DropdownMenuLabel className="font-normal flex justify-between items-center">
                <span>Notifications</span>
                {unreadCount > 0 && (
                   <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="cursor-pointer flex flex-col items-start gap-1 p-3 focus:bg-zinc-100 focus:text-zinc-900"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex w-full justify-between items-start gap-2">
                        <span className="font-medium text-sm leading-none">
                          {notification.type === 'TEAM_REGISTERED' ? 'New Team' :
                           notification.type === 'PLAYER_REGISTERED' ? 'New Player' :
                           notification.type === 'PLAYER_AUTO_LINKED' ? 'Player Linked' :
                           notification.type === 'CONTACT_MESSAGE' ? 'New Message' : 'Notification'}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismiss(notification.id);
                            }}
                            className="text-muted-foreground hover:text-foreground p-0.5 rounded-sm hover:bg-zinc-200 transition-colors"
                            aria-label="Dismiss"
                          >
                            {XIcon ? <XIcon size={12} /> : <span className="w-3 h-3 block" />}
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 pr-4">
                        {notification.message}
                      </p>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  {/* View all notifications - Pending implementation of notifications page */}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {can('notifications:read') && !notificationsEnabled && (
          <div className="h-9 px-3 rounded-md bg-zinc-100 text-xs text-muted-foreground flex items-center gap-2">
            {BellOffIcon ? <BellOffIcon size={14} /> : null}
            Notifications Off
          </div>
        )}

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-9 px-2 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 border-none outline-none ring-0 shadow-none hover:bg-zinc-100 hover:text-zinc-900 data-[state=open]:bg-zinc-100 data-[state=open]:text-zinc-900 admin-header-button"
              aria-label="User menu"
            >
              <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-semibold text-zinc-900 flex-shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <span className="text-sm font-medium max-md:hidden truncate max-w-[120px]">
                {user?.name || 'User'}
              </span>
              {ChevronDownIcon && <ChevronDownIcon size={14} className="text-muted-foreground max-md:hidden" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 z-[1001]">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email || ''}</p>
                {roles.length > 0 && (
                  <div className="pt-1">
                    <Badge variant="outline" className="text-[10px] h-5">
                      {roles[0]}
                    </Badge>
                  </div>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/admin/settings" className="no-underline cursor-pointer">
                {SettingsIcon && <SettingsIcon size={14} />}
                Settings
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/admin/notification-settings" className="no-underline cursor-pointer">
                {BellIcon && <BellIcon size={14} />}
                Notification Settings
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/admin/profile" className="no-underline cursor-pointer">
                {UserIcon && <UserIcon size={14} />}
                My Profile
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/" target="_blank" rel="noopener noreferrer" className="no-underline cursor-pointer">
                {ExternalLinkIcon && <ExternalLinkIcon size={14} />}
                View Site
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={handleLogout}
            >
              {LogOutIcon && <LogOutIcon size={14} />}
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
