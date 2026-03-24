import { useState, useEffect, type ComponentType } from 'react';
import { cn } from '@/lib/utils';
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [activePath, setActivePath] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname : ''
  );
  const [icons, setIcons] = useState<{
    LayoutDashboard?: ComponentType<any>;
    Newspaper?: ComponentType<any>;
    Calendar?: ComponentType<any>;
    Users?: ComponentType<any>;
    Shield?: ComponentType<any>;
    Briefcase?: ComponentType<any>;
    Images?: ComponentType<any>;
    FileText?: ComponentType<any>;
    LogOut?: ComponentType<any>;
    ExternalLink?: ComponentType<any>;
    Dribbble?: ComponentType<any>;
    Trophy?: ComponentType<any>;
    Menu?: ComponentType<any>;
    X?: ComponentType<any>;
    Star?: ComponentType<any>;
    Handshake?: ComponentType<any>;
    ShieldCheck?: ComponentType<any>;
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
        LogOut: mod.LogOut,
        ExternalLink: mod.ExternalLink,
        Dribbble: mod.Dribbble,
        Trophy: mod.Trophy,
        Menu: mod.Menu,
        X: mod.X,
        Star: mod.Star,
        Handshake: mod.Handshake,
        ShieldCheck: mod.ShieldCheck,
        Settings: mod.Settings,
        MessageSquare: mod.MessageSquare,
        Mail: mod.Mail,
      });
    });

    fetch('/api/contact-messages?unread=true')
      .then((r) => r.ok ? r.json() : [])
      .then((data: unknown[]) => setUnreadCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {});

    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const handleOutside = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (isMobile && !t.closest('.sb') && !t.closest('.sb-toggle')) setIsOpen(false);
    };
    const handleRoute = () => { if (isMobile) setIsOpen(false); };

    document.addEventListener('click', handleOutside);
    window.addEventListener('popstate', handleRoute);
    return () => {
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('click', handleOutside);
      window.removeEventListener('popstate', handleRoute);
    };
  }, [isMobile]);

  const canAccess = (p?: string) => !p || can(p);
  const getActive = (href: string) => {
    if (!activePath) return false;
    if (href === '/admin') return activePath === '/admin';
    return activePath.startsWith(href);
  };
  const handleNavClick = () => { if (isMobile) setIsOpen(false); };

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) return;
    clearPermissionCache();
    try {
      const r = await fetch('/api/auth/logout', { method: 'POST' });
      if (r.ok) window.location.href = '/admin/login';
    } catch { window.location.href = '/admin/login'; }
  };

  const navGroups: { label: string; items: NavItem[] }[] = [
    {
      label: 'General',
      items: [
        { href: '/admin', icon: icons.LayoutDashboard, label: 'Dashboard', permissionsAny: ['news_articles:read','matches:read','players:read','media:read','teams:read','leagues:read','staff:read','roles:read','users:read','audit_logs:read'] },
      ],
    },
    {
      label: 'Communication',
      items: [
        { href: '/admin/messages',    icon: icons.MessageSquare, label: 'Messages',    permission: 'contact_messages:read' },
        { href: '/admin/subscribers', icon: icons.Mail,          label: 'Subscribers', permission: 'subscribers:read' },
      ],
    },
    {
      label: 'Competition',
      items: [
        { href: '/admin/leagues', icon: icons.Trophy,    label: 'Leagues', permission: 'leagues:read' },
        { href: '/admin/matches', icon: icons.Calendar,  label: 'Matches', permission: 'matches:read' },
        { href: '/admin/teams',   icon: icons.Shield,    label: 'Teams',   permission: 'teams:read' },
      ],
    },
    {
      label: 'Personnel',
      items: [
        { href: '/admin/players', icon: icons.Users,     label: 'Players', permission: 'players:read' },
        { href: '/admin/staff',   icon: icons.Briefcase, label: 'Staff',   permission: 'staff:read' },
      ],
    },
    {
      label: 'Editorial',
      items: [
        { href: '/admin/news',                icon: icons.Newspaper, label: 'News Articles',      permission: 'news_articles:read' },
        { href: '/admin/highlights/potw',     icon: icons.Star,      label: 'Player of the Week', permission: 'potw:read' },
        { href: '/admin/highlights/sponsors', icon: icons.Handshake, label: 'Sponsors',           permission: 'sponsors:read' },
      ],
    },
    {
      label: 'Assets',
      items: [
        { href: '/admin/media', icon: icons.Images, label: 'Media Library', permission: 'media:read' },
      ],
    },
    {
      label: 'System',
      items: [
        { href: '/admin/users',      icon: icons.Users,       label: 'Users',               permission: 'users:read' },
        { href: '/admin/roles',      icon: icons.ShieldCheck, label: 'Roles & Permissions', permission: 'roles:read' },
        { href: '/admin/audit-logs', icon: icons.FileText,    label: 'Audit Logs',          permissionsAny: ['audit_logs:read','audit_logs:manage'] },
        { href: '/admin/settings',   icon: icons.Settings,    label: 'Settings',            permissionsAny: ['site_settings:read','site_settings:manage'] },
      ],
    },
  ]
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => {
        if (item.permission && !canAccess(item.permission)) return false;
        if (item.permissionsAny?.length && !canAny(item.permissionsAny)) return false;
        if (item.permissionsAll?.length && !canAll(item.permissionsAll)) return false;
        return true;
      }),
    }))
    .filter((g) => g.items.length > 0);

  const { Dribbble: Ball, LogOut: LogOutIcon, ExternalLink: ExternalLinkIcon, Menu: MenuIcon, X: XIcon } = icons;

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="sb-toggle fixed top-3 left-3 z-[1001] w-9 h-9 bg-[#111] border border-white/10 rounded-[6px] text-white/70 flex items-center justify-center cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.4)] md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        {isOpen && XIcon ? <XIcon size={18} /> : MenuIcon ? <MenuIcon size={18} /> : '☰'}
      </button>

      {/* Overlay */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-[999]"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'sb fixed left-0 top-0 w-[260px] h-screen bg-[#111] border-r border-white/[0.08] flex flex-col z-[1000] transition-transform duration-[280ms] ease md:!translate-x-0',
          isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'
        )}
        aria-label="Admin navigation"
      >
        {/* Logo */}
        <a
          href="/admin"
          className="flex items-center gap-[0.65rem] py-5 px-4 no-underline border-b border-white/[0.07] shrink-0"
          data-astro-prefetch
        >
          <span
            className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            {Ball ? <Ball size={16} className="text-white" /> : null}
          </span>
          <span className="font-['Teko'] text-[1.1rem] font-bold text-white tracking-[0.04em] uppercase">
            Elevate CMS
          </span>
        </a>

        {/* Nav */}
        <nav
          className="flex-1 overflow-y-auto overflow-x-hidden py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Main navigation"
        >
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="pt-3 px-4 pb-1 text-[0.6rem] tracking-[0.25em] uppercase text-white/25 font-['Teko']">
                {group.label}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = getActive(item.href);
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-[0.65rem] py-2 px-4 my-[0.05rem] mx-2 rounded-[6px] no-underline text-sm font-normal transition-[background,color] duration-150',
                      isActive
                        ? 'text-white font-medium bg-brand-red border-l-2 border-transparent'
                        : 'text-white/50 hover:bg-white/[0.06] hover:text-white/90 border-l-2 border-transparent'
                    )}
                    {...(isActive && { 'aria-current': 'page' as const })}
                    data-astro-prefetch
                    onClick={handleNavClick}
                  >
                    <span
                      className={cn('shrink-0 transition-opacity duration-150', isActive ? 'opacity-90' : 'opacity-60 group-hover:opacity-100')}
                      aria-hidden="true"
                    >
                      {Icon ? <Icon size={15} /> : <span className="block w-[15px]" />}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.href === '/admin/messages' && unreadCount > 0 && (
                      <span
                        className={cn(
                          'ml-auto text-[0.6rem] font-bold py-[0.1rem] px-[0.4rem] rounded-full leading-[1.4]',
                          isActive ? 'bg-white text-brand-red' : 'bg-brand-red text-white'
                        )}
                        aria-label={`${unreadCount} unread`}
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/[0.07] p-3 flex flex-col gap-2 shrink-0">
          {/* User info */}
          <div className="flex items-center gap-[0.6rem] py-[0.4rem] px-1">
            <div
              className="w-8 h-8 rounded-full bg-brand-red/15 border border-brand-red/30 flex items-center justify-center text-[0.78rem] font-bold text-brand-red shrink-0"
              aria-hidden="true"
            >
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[0.82rem] font-semibold text-white/90 truncate">{user?.name || 'User'}</div>
              <div className="text-[0.65rem] text-white/30 truncate mt-[0.05rem]">{roles[0] || 'Member'}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-[0.4rem]">
            <a
              href="/"
              className="w-full bg-white/[0.05] border border-white/[0.09] cursor-pointer text-white/55 py-[0.45rem] px-0 rounded-[6px] flex items-center justify-center gap-[0.35rem] text-xs font-medium transition-[background,color,border-color] duration-150 no-underline outline-none hover:bg-white/10 hover:text-white hover:border-white/15"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View public site"
            >
              {ExternalLinkIcon && <ExternalLinkIcon size={13} />}
              View Site
            </a>
            <button
              className="w-full bg-brand-red border border-brand-red cursor-pointer text-white py-[0.45rem] px-0 rounded-[6px] flex items-center justify-center gap-[0.35rem] text-xs font-medium transition-[background,color,border-color] duration-150 outline-none hover:bg-brand-red-dark hover:border-brand-red-dark hover:text-white"
              onClick={handleLogout}
              aria-label="Logout"
            >
              {LogOutIcon && <LogOutIcon size={13} />}
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
