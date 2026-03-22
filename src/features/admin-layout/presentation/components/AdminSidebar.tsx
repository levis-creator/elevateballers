import { useState, useEffect, type ComponentType } from 'react';
import { cn } from '@/lib/utils';
import { usePermissions, clearPermissionCache } from '@/features/rbac/presentation/hooks/usePermissions';
import { useAdminLayoutStore } from '../stores/adminLayoutStore';
import { useMessagesStore } from '../stores/messagesStore';

interface NavItem {
  href: string;
  icon: ComponentType<any> | undefined;
  label: string;
  permission?: string;
  permissionsAny?: string[];
  permissionsAll?: string[];
}

const styles = `
  .sb {
    position: fixed;
    left: 0; top: 0;
    width: 260px;
    height: 100vh;
    background: #111;
    border-right: 1px solid rgba(255,255,255,0.08);
    display: flex;
    flex-direction: column;
    z-index: 1000;
    transition: transform 280ms ease;
  }
  .sb.hidden { transform: translateX(-100%); }

  /* Logo */
  .sb-logo {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 1.25rem 1rem;
    text-decoration: none;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    flex-shrink: 0;
  }
  .sb-logo-icon {
    width: 2rem; height: 2rem;
    border-radius: 50%;
    background: rgba(221,51,51,0.15);
    border: 1px solid rgba(221,51,51,0.3);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .sb-logo-text {
    font-family: var(--font-heading);
    font-size: 1.1rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  /* Nav */
  .sb-nav {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0.75rem 0;
    scrollbar-width: none;
  }
  .sb-nav::-webkit-scrollbar { display: none; }

  /* Group label */
  .sb-group-label {
    padding: 0.75rem 1rem 0.25rem;
    font-family: var(--font-heading);
    font-size: 0.6rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.25);
  }

  /* Nav link */
  .sb-link {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.5rem 1rem;
    margin: 0.05rem 0.5rem;
    border-radius: 6px;
    text-decoration: none;
    color: rgba(255,255,255,0.5) !important;
    font-size: 0.875rem;
    font-weight: 400;
    transition: background 150ms ease, color 150ms ease;
  }
  .sb-link:hover {
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.9) !important;
  }
  .sb-link.active {
    background: var(--color-primary);
    color: #fff !important;
    font-weight: 500;
  }
  .sb-link.active:hover {
    background: var(--color-primary-dark);
  }
  .sb-link-icon {
    opacity: 0.6;
    flex-shrink: 0;
  }
  .sb-link.active .sb-link-icon,
  .sb-link:hover .sb-link-icon { opacity: 1; }

  /* Badge */
  .sb-badge {
    margin-left: auto;
    background: #fff;
    color: var(--color-primary);
    font-size: 0.6rem;
    font-weight: 700;
    padding: 0.1rem 0.4rem;
    border-radius: 9999px;
    line-height: 1.4;
  }
  .sb-link:not(.active) .sb-badge {
    background: var(--color-primary);
    color: #fff;
  }

  /* Footer */
  .sb-footer {
    border-top: 1px solid rgba(255,255,255,0.07);
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  /* User row */
  .sb-user-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.4rem 0.25rem;
  }
  .sb-avatar {
    width: 2rem; height: 2rem;
    border-radius: 50%;
    background: rgba(221,51,51,0.15);
    border: 1px solid rgba(221,51,51,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.78rem; font-weight: 700;
    color: var(--color-primary);
    flex-shrink: 0;
  }
  .sb-user { flex: 1; min-width: 0; }
  .sb-user-name {
    font-size: 0.82rem; font-weight: 600;
    color: rgba(255,255,255,0.9);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .sb-user-role {
    font-size: 0.65rem;
    color: rgba(255,255,255,0.3);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-top: 0.05rem;
  }

  /* Action buttons row */
  .sb-footer-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.4rem;
  }
  .sb-icon-btn {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.09);
    cursor: pointer;
    color: rgba(255,255,255,0.55) !important;
    padding: 0.45rem 0;
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center; gap: 0.35rem;
    font-size: 0.75rem;
    font-weight: 500;
    transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
    text-decoration: none !important;
    outline: none !important;
    width: 100%;
  }
  .sb-icon-btn:hover {
    background: rgba(255,255,255,0.1);
    color: #fff !important;
    border-color: rgba(255,255,255,0.15);
    outline: none !important;
  }
  .sb-icon-btn.danger:hover {
    background: rgba(221,51,51,0.12);
    color: var(--color-primary) !important;
    border-color: rgba(221,51,51,0.25);
  }

  /* Mobile toggle */
  .sb-toggle {
    position: fixed;
    top: 0.75rem; left: 0.75rem;
    z-index: 1001;
    width: 2.25rem; height: 2.25rem;
    background: #111;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px;
    color: rgba(255,255,255,0.7);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  }
  .sb-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 999;
  }

  @media (min-width: 769px) {
    .sb-toggle { display: none; }
    .sb { transform: translateX(0) !important; }
  }
`;

export default function AdminSidebar() {
  const { can, canAny, canAll, user, roles } = usePermissions();
  const { isSidebarOpen, setSidebarOpen, toggleSidebar, isMobile, setMobile, activePath, setActivePath, hideSidebar } =
    useAdminLayoutStore();
  const { unreadMessageCount, setUnreadMessageCount } = useMessagesStore();
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
      .then((data: unknown[]) => setUnreadMessageCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {});

    if (typeof window !== 'undefined') setActivePath(window.location.pathname);

    const checkMobile = () => setMobile(window.innerWidth <= 768);

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const handleOutside = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (isMobile && !t.closest('.sb') && !t.closest('.sb-toggle')) setSidebarOpen(false);
    };
    const handleRoute = () => { if (isMobile) setSidebarOpen(false); };

    document.addEventListener('click', handleOutside);
    window.addEventListener('popstate', handleRoute);
    return () => {
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('click', handleOutside);
      window.removeEventListener('popstate', handleRoute);
    };
  }, [isMobile]);

  useEffect(() => {
    const root = document.documentElement;
    if (hideSidebar) {
      root.style.setProperty('--admin-sidebar-width', '0px');
      setSidebarOpen(false);
    } else {
      root.style.removeProperty('--admin-sidebar-width');
    }
  }, [hideSidebar]);

  const canAccess = (p?: string) => !p || can(p);
  const getActive = (href: string) => {
    if (!activePath) return false;
    if (href === '/admin') return activePath === '/admin';
    return activePath.startsWith(href);
  };
  const handleNavClick = () => { if (isMobile) setSidebarOpen(false); };

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
      <style>{styles}</style>

      {/* Mobile toggle / hidden-sidebar toggle */}
      <button
        className="sb-toggle"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
        aria-expanded={isSidebarOpen}
        style={hideSidebar ? { display: 'flex' } : undefined}
      >
        {isSidebarOpen && XIcon ? <XIcon size={18} /> : MenuIcon ? <MenuIcon size={18} /> : '☰'}
      </button>

      {/* Overlay */}
      {isSidebarOpen && (isMobile || hideSidebar) && <div className="sb-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}

      {/* Sidebar */}
      <aside
        className={cn('sb', (isMobile || hideSidebar) && !isSidebarOpen && 'hidden')}
        style={hideSidebar && isSidebarOpen ? { transform: 'translateX(0)' } : undefined}
        aria-label="Admin navigation"
      >

        {/* Logo */}
        <a href="/admin" className="sb-logo" data-astro-prefetch>
          <span className="sb-logo-icon" aria-hidden="true">
            {Ball ? <Ball size={16} style={{ color: 'var(--color-primary)' }} /> : null}
          </span>
          <span className="sb-logo-text">Elevate CMS</span>
        </a>

        {/* Nav */}
        <nav className="sb-nav" aria-label="Main navigation">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="sb-group-label">{group.label}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = getActive(item.href);
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={cn('sb-link', isActive && 'active')}
                    {...(isActive && { 'aria-current': 'page' as const })}
                    data-astro-prefetch
                    onClick={handleNavClick}
                  >
                    <span className="sb-link-icon" aria-hidden="true">
                      {Icon ? <Icon size={15} /> : <span style={{ width: 15, display: 'block' }} />}
                    </span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.href === '/admin/messages' && unreadMessageCount > 0 && (
                      <span className="sb-badge" aria-label={`${unreadMessageCount} unread`}>{unreadMessageCount > 99 ? '99+' : unreadMessageCount}</span>
                    )}
                  </a>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sb-footer">
          {/* User info */}
          <div className="sb-user-row">
            <div className="sb-avatar" aria-hidden="true">{user?.name?.charAt(0)?.toUpperCase() || '?'}</div>
            <div className="sb-user">
              <div className="sb-user-name">{user?.name || 'User'}</div>
              <div className="sb-user-role">{roles[0] || 'Member'}</div>
            </div>
          </div>
          {/* Actions */}
          <div className="sb-footer-actions">
            <a href="/" className="sb-icon-btn" target="_blank" rel="noopener noreferrer" aria-label="View public site">
              {ExternalLinkIcon && <ExternalLinkIcon size={13} />}
              View Site
            </a>
            <button className="sb-icon-btn danger" onClick={handleLogout} aria-label="Logout">
              {LogOutIcon && <LogOutIcon size={13} />}
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
