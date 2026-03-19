import { useState, useEffect, type ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { tekoFont } from '../lib/ui-helpers';
import { usePermissions, clearPermissionCache } from '@/features/rbac/usePermissions';

interface NavItem {
  href: string;
  icon: ComponentType<any> | undefined;
  label: string;
  permission?: string;
  permissionsAny?: string[];
  permissionsAll?: string[];
}

export default function AdminSidebar() {
  const { can, canAny, canAll, user, roles } = usePermissions();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [icons, setIcons] = useState<{
    LayoutDashboard?: ComponentType<any>;
    Newspaper?: ComponentType<any>;
    Calendar?: ComponentType<any>;
    Users?: ComponentType<any>;
    Shield?: ComponentType<any>;
    Briefcase?: ComponentType<any>;
    Images?: ComponentType<any>;
    FileText?: ComponentType<any>;
    ExternalLink?: ComponentType<any>;
    LogOut?: ComponentType<any>;
    Dribbble?: ComponentType<any>;
    Trophy?: ComponentType<any>;
    Menu?: ComponentType<any>;
    X?: ComponentType<any>;
    Star?: ComponentType<any>;
    Handshake?: ComponentType<any>;
    ShieldCheck?: ComponentType<any>;
    ChevronDown?: ComponentType<any>;
    Settings?: ComponentType<any>;
    MessageSquare?: ComponentType<any>;
    Mail?: ComponentType<any>;
  }>({});

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        LayoutDashboard: mod.LayoutDashboard,
        Newspaper: mod.Newspaper,
        Calendar: mod.Calendar,
        Users: mod.Users,
        Shield: mod.Shield,
        Briefcase: mod.Briefcase,
        Images: mod.Images,
        FileText: mod.FileText,
        ExternalLink: mod.ExternalLink,
        LogOut: mod.LogOut,
        Dribbble: mod.Dribbble,
        Trophy: mod.Trophy,
        Menu: mod.Menu,
        X: mod.X,
        Star: mod.Star,
        Handshake: mod.Handshake,
        ShieldCheck: mod.ShieldCheck,
        ChevronDown: mod.ChevronDown,
        Settings: mod.Settings,
        MessageSquare: mod.MessageSquare,
        Mail: mod.Mail,
      });
    });

    fetch('/api/contact-messages?unread=true')
      .then((r) => r.ok ? r.json() : [])
      .then((data: unknown[]) => setUnreadCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {});

    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const handleClickOutside = (e: MouseEvent) => {
      if (isMobile) {
        const target = e.target as HTMLElement;
        if (!target.closest('.admin-sidebar') && !target.closest('.mobile-menu-toggle')) {
          setIsOpen(false);
        }
      }
    };

    const handleRouteChange = () => {
      if (isMobile) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [isMobile]);

  const canAccess = (permission?: string) => {
    if (!permission) return true;
    return can(permission);
  };

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const navGroups: { label: string; items: NavItem[] }[] = [
    {
      label: 'GENERAL',
      items: [
        {
          href: '/admin',
          icon: icons.LayoutDashboard,
          label: 'Dashboard',
          permissionsAny: [
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
            'audit_logs:read',
            'audit_logs:manage',
          ],
        },
      ],
    },
    {
      label: 'COMMUNICATION',
      items: [
        { href: '/admin/messages', icon: icons.MessageSquare, label: 'Messages', permission: 'contact_messages:read' },
        { href: '/admin/subscribers', icon: icons.Mail, label: 'Subscribers', permission: 'subscribers:read' },
      ],
    },
    {
      label: 'COMPETITION',
      items: [
        { href: '/admin/leagues', icon: icons.Trophy, label: 'Leagues', permission: 'leagues:read' },
        { href: '/admin/matches', icon: icons.Calendar, label: 'Matches', permission: 'matches:read' },
        { href: '/admin/teams', icon: icons.Shield, label: 'Teams', permission: 'teams:read' },
      ],
    },
    {
      label: 'PERSONNEL',
      items: [
        { href: '/admin/players', icon: icons.Users, label: 'Players', permission: 'players:read' },
        { href: '/admin/staff', icon: icons.Briefcase, label: 'Staff', permission: 'staff:read' },
      ],
    },
    {
      label: 'EDITORIAL',
      items: [
        { href: '/admin/news', icon: icons.Newspaper, label: 'News Articles', permission: 'news_articles:read' },
        { href: '/admin/highlights/potw', icon: icons.Star, label: 'Player of the Week', permission: 'potw:read' },
        { href: '/admin/highlights/sponsors', icon: icons.Handshake, label: 'Sponsors', permission: 'sponsors:read' },
      ],
    },
    {
      label: 'ASSETS',
      items: [
        { href: '/admin/media', icon: icons.Images, label: 'Media Library', permission: 'media:read' },
      ],
    },
    {
      label: 'SYSTEM',
      items: [
        { href: '/admin/users', icon: icons.Users, label: 'System Users', permission: 'users:read' },
        { href: '/admin/roles', icon: icons.ShieldCheck, label: 'Roles & Permissions', permission: 'roles:read' },
        {
          href: '/admin/audit-logs',
          icon: icons.FileText,
          label: 'Audit Logs',
          permissionsAny: ['audit_logs:read', 'audit_logs:manage'],
        },
        {
          href: '/admin/settings',
          icon: icons.Settings,
          label: 'Site Settings',
          permissionsAny: ['site_settings:read', 'site_settings:manage'],
        },
      ],
    },
  ]
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.permission && !canAccess(item.permission)) return false;
        if (item.permissionsAny?.length && !canAny(item.permissionsAny)) return false;
        if (item.permissionsAll?.length && !canAll(item.permissionsAll)) return false;
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);

  const BasketballIcon = icons.Dribbble;
  const ExternalLinkIcon = icons.ExternalLink;
  const LogOutIcon = icons.LogOut;
  const MenuIcon = icons.Menu;
  const XIcon = icons.X;
  const ChevronDownIcon = icons.ChevronDown;

  const [activePath, setActivePath] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActivePath(window.location.pathname);
    }
  }, []);

  const getActiveClass = (href: string) => {
    if (!activePath) return false;
    if (href === '/admin' && activePath === '/admin') return true;
    if (href !== '/admin' && activePath.startsWith(href)) return true;
    return false;
  };

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) return;
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

  const handleNavClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'mobile-menu-toggle',
          'fixed top-4 left-4 z-[1001]',
          'bg-[#1e293b] text-white hover:bg-[#1e293b]/90',
          'md:hidden',
          'shadow-lg'
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        {isOpen && XIcon ? <XIcon size={24} /> : MenuIcon ? <MenuIcon size={24} /> : '\u2630'}
      </Button>

      {/* Mobile Overlay */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-[999] md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'admin-sidebar',
          'fixed left-0 top-0 h-screen w-[260px]',
          'bg-gradient-to-b from-[#0b1220] via-[#0f172a] to-[#111827]',
          'flex flex-col',
          'overflow-x-hidden',
          'z-[1000] shadow-[0_24px_60px_rgba(2,6,23,0.45)] border-r border-white/10',
          'transition-transform duration-300 ease-in-out',
          'md:translate-x-0',
          isMobile && !isOpen && '-translate-x-full',
          isMobile && isOpen && 'translate-x-0'
        )}
      >
        {/* Sidebar Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/10">
          <a
            href="/admin"
            className="flex items-center !text-white no-underline hover:opacity-90 transition-opacity"
            data-astro-prefetch
          >
            <span className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mr-3">
              {BasketballIcon ? (
                <BasketballIcon size={20} className="!text-primary" />
              ) : (
                <span className="w-5 h-5" />
              )}
            </span>
            <span className="text-xl font-bold !text-white leading-none" style={tekoFont}>
              Elevate CMS
              <span className="block text-[0.6rem] tracking-[0.35em] text-white/40 mt-1">ADMIN</span>
            </span>
          </a>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 scrollbar-hide" aria-label="Main navigation">
          {navGroups.map((group) => {
            const isCollapsed = collapsedGroups.has(group.label);
            return (
              <div key={group.label} className="mb-2 last:mb-0">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-2 mx-3 rounded-lg',
                    'text-[0.65rem] font-semibold text-white/60 tracking-[0.35em] uppercase',
                    'bg-white/5 border border-white/5',
                    'hover:bg-white/10 hover:text-white/80 transition-colors',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30',
                    'bg-transparent border-0 cursor-pointer'
                  )}
                  aria-expanded={!isCollapsed}
                  aria-controls={`nav-group-${group.label}`}
                >
                  <span>{group.label}</span>
                  {ChevronDownIcon && (
                    <ChevronDownIcon
                      size={14}
                      className={cn(
                        'transition-transform duration-200 text-white/40',
                        isCollapsed && '-rotate-90'
                      )}
                      aria-hidden="true"
                    />
                  )}
                </button>

                <div
                  id={`nav-group-${group.label}`}
                  className={cn(
                    'space-y-0.5 overflow-hidden transition-all duration-200',
                    isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'
                  )}
                >
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = getActiveClass(item.href);
                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center px-4 py-2.5 !text-white no-underline mx-3 rounded-xl',
                          'transition-all duration-200',
                          'border border-transparent',
                          'hover:bg-white/10 hover:border-white/10',
                          isActive
                            ? 'bg-white/10 border-white/20 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
                            : '',
                          'text-[0.9rem]'
                        )}
                        {...(isActive && { 'aria-current': 'page' as const })}
                        aria-label={item.label}
                        data-astro-prefetch
                        onClick={handleNavClick}
                      >
                        <span className={cn(
                          'w-9 h-9 rounded-lg flex items-center justify-center mr-3 flex-shrink-0',
                          isActive ? 'bg-white/10' : 'bg-white/5'
                        )}>
                          {Icon ? (
                            <Icon size={16} className="!text-white" aria-hidden="true" />
                          ) : (
                            <span className="w-4 h-4" aria-hidden="true" />
                          )}
                        </span>
                        <span className="!text-white font-medium flex-1">{item.label}</span>
                        {item.href === '/admin/messages' && unreadCount > 0 && (
                          <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[0.65rem] font-bold flex items-center justify-center leading-none flex-shrink-0">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-white/10 py-4">
          {/* User info */}
          <div className="px-5 py-3 mx-1 flex items-center gap-3 mb-2 rounded-xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-white/40 truncate">{roles[0] || 'Member'}</p>
            </div>
          </div>

          <a
            href="/"
            className={cn(
              'flex items-center px-4 py-2.5 !text-white no-underline mx-3 rounded-xl',
              'transition-all duration-200',
              'border border-transparent hover:bg-white/10 hover:border-white/10',
              'text-[0.85rem] font-medium'
            )}
            onClick={handleNavClick}
          >
            {ExternalLinkIcon ? (
              <ExternalLinkIcon size={18} className="mr-3 flex-shrink-0 !text-white" />
            ) : (
              <span className="w-5 h-5 mr-3 flex-shrink-0" />
            )}
            <span className="!text-white">View Site</span>
          </a>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Logout from admin panel"
            className={cn(
              'flex items-center px-4 py-2.5 !text-white w-full text-left mx-3 rounded-xl',
              'transition-all duration-200',
              'border border-transparent hover:bg-red-500/20 hover:border-red-500/30',
              'text-[0.85rem] font-medium',
              'bg-transparent border-0 cursor-pointer'
            )}
          >
            {LogOutIcon ? (
              <LogOutIcon size={18} className="mr-3 flex-shrink-0 !text-white" aria-hidden="true" />
            ) : (
              <span className="w-5 h-5 mr-3 flex-shrink-0" aria-hidden="true" />
            )}
            <span className="!text-white">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
