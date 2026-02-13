import { useState, useEffect, type ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { tekoFont, navActive, navHover } from '../lib/ui-helpers';
import { clearPermissionCache } from '@/features/rbac/usePermissions';
import type { UserRole } from '../types';

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [icons, setIcons] = useState<{
    LayoutDashboard?: ComponentType<any>;
    Newspaper?: ComponentType<any>;
    Calendar?: ComponentType<any>;
    Users?: ComponentType<any>;
    User?: ComponentType<any>;
    Shield?: ComponentType<any>;
    Briefcase?: ComponentType<any>;
    Images?: ComponentType<any>;
    FileText?: ComponentType<any>;
    Settings?: ComponentType<any>;
    ExternalLink?: ComponentType<any>;
    LogOut?: ComponentType<any>;
    Dribbble?: ComponentType<any>;
    Trophy?: ComponentType<any>;
    Menu?: ComponentType<any>;
    X?: ComponentType<any>;
    Star?: ComponentType<any>;
    Handshake?: ComponentType<any>;
    ShieldCheck?: ComponentType<any>;
  }>({});

  useEffect(() => {
    // Load icons only on client side
    import('lucide-react').then((mod) => {
      setIcons({
        LayoutDashboard: mod.LayoutDashboard,
        Newspaper: mod.Newspaper,
        Calendar: mod.Calendar,
        Users: mod.Users,
        User: mod.User,
        Shield: mod.Shield,
        Briefcase: mod.Briefcase,
        Images: mod.Images,
        FileText: mod.FileText,
        Settings: mod.Settings,
        ExternalLink: mod.ExternalLink,
        LogOut: mod.LogOut,
        Dribbble: mod.Dribbble,
        Trophy: mod.Trophy,
        Menu: mod.Menu,
        X: mod.X,
        Star: mod.Star,
        Handshake: mod.Handshake,
        ShieldCheck: mod.ShieldCheck,
      });
    });

    // Fetch user roles
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.user && data.user.roles) {
            // Check if user has Admin role
            const hasAdminRole = data.user.roles.some((r: any) => r.name === 'Admin');
            setUserRole(hasAdminRole ? 'ADMIN' : 'EDITOR');
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    fetchUserRole();

    // Check if mobile on mount and resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Close sidebar when clicking outside on mobile
    const handleClickOutside = (e: MouseEvent) => {
      if (isMobile) {
        const target = e.target as HTMLElement;
        if (!target.closest('.admin-sidebar') && !target.closest('.mobile-menu-toggle')) {
          setIsOpen(false);
        }
      }
    };

    // Close sidebar on route change
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

  const navGroups = [
    {
      label: 'GENERAL',
      items: [
        { href: '/admin', icon: icons.LayoutDashboard, label: 'Dashboard' },
        { href: '/admin/media', icon: icons.Images, label: 'Media Highlights' },
      ]
    },
    {
      label: 'COMPETITION',
      items: [
        { href: '/admin/leagues', icon: icons.Trophy, label: 'Leagues' },
        { href: '/admin/matches', icon: icons.Calendar, label: 'Matches' },
        { href: '/admin/teams', icon: icons.Shield, label: 'Teams' },
      ]
    },
    {
      label: 'PERSONNEL',
      items: [
        { href: '/admin/players', icon: icons.Users, label: 'Players' },
        { href: '/admin/staff', icon: icons.Briefcase, label: 'Staff' },
      ]
    },
    {
      label: 'EDITORIAL',
      items: [
        { href: '/admin/news', icon: icons.Newspaper, label: 'News Articles' },
        { href: '/admin/highlights/potw', icon: icons.Star, label: 'Player of the Week' },
        { href: '/admin/highlights/sponsors', icon: icons.Handshake, label: 'Sponsors' },
      ]
    },
    {
      label: 'SYSTEM',
      items: [
        { href: '/admin/users', icon: icons.Users, label: 'System Users' },
        { href: '/admin/roles', icon: icons.ShieldCheck, label: 'Roles & Permissions' },
      ]
    }
  ].map(group => ({
    ...group,
    items: group.items.filter(item => {
      // Only show admin-only pages to admins
      if (item.href === '/admin/users' || item.href === '/admin/roles') {
        return userRole === 'ADMIN';
      }
      return true;
    })
  })).filter(group => group.items.length > 0);

  const UserIcon = icons.User;
  const BasketballIcon = icons.Dribbble;
  const ExternalLinkIcon = icons.ExternalLink;
  const LogOutIcon = icons.LogOut;
  const MenuIcon = icons.Menu;
  const XIcon = icons.X;

  const [activePath, setActivePath] = useState<string>('');

  useEffect(() => {
    // Set active path only on client
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
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (response.ok) {
        window.location.href = '/admin/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
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
          "fixed top-4 left-4 z-[1001]",
          "bg-[#1e293b] text-white hover:bg-[#1e293b]/90",
          "md:hidden",
          "shadow-lg"
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        {isOpen && XIcon ? <XIcon size={24} /> : MenuIcon ? <MenuIcon size={24} /> : '☰'}
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
          "admin-sidebar",
          "fixed left-0 top-0 h-screen w-[260px]",
          "bg-[#1e293b]",
          "flex flex-col",
          "z-[1000] shadow-lg",
          "transition-transform duration-300 ease-in-out",
          "md:translate-x-0",
          isMobile && !isOpen && "-translate-x-full",
          isMobile && isOpen && "translate-x-0"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/10">
          <a
            href="/admin"
            className="flex items-center !text-white no-underline hover:opacity-90 transition-opacity"
            data-astro-prefetch
          >
            {BasketballIcon ? <BasketballIcon size={24} className="!text-primary mr-2" /> : <span className="w-6 h-6 mr-2" />}
            <span className="text-xl font-bold !text-white" style={tekoFont}>Elevate CMS</span>
          </a>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide" aria-label="Main navigation">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-6 last:mb-0">
              <div className="px-6 mb-2 text-[0.7rem] font-bold text-white/40 tracking-[0.1em] uppercase">
                {group.label}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = getActiveClass(item.href);
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center px-6 py-2.5 !text-white no-underline",
                        "transition-all duration-200",
                        "border-l-[3px] border-transparent",
                        navHover,
                        isActive && navActive,
                        "text-[0.9rem] font-medium"
                      )}
                      {...(isActive && { 'aria-current': 'page' })}
                      aria-label={item.label}
                      data-astro-prefetch
                      onClick={handleNavClick}
                    >
                      {Icon ? <Icon size={18} className="mr-3 flex-shrink-0 !text-white" aria-hidden="true" /> : <span className="w-4 h-4 mr-3 flex-shrink-0" aria-hidden="true" />}
                      <span className="!text-white">{item.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-white/10">
          <a
            href="/"
            className={cn(
              "flex items-center px-6 py-3.5 !text-white no-underline",
              "transition-all duration-200",
              "border-l-[3px] border-transparent",
              navHover,
              "text-[0.95rem] font-medium"
            )}
            onClick={handleNavClick}
          >
            {ExternalLinkIcon ? <ExternalLinkIcon size={20} className="mr-3 flex-shrink-0 !text-white" /> : <span className="w-5 h-5 mr-3 flex-shrink-0" />}
            <span className="!text-white">View Site</span>
          </a>
          <a
            href="/admin/profile"
            className={cn(
              "flex items-center px-6 py-3.5 !text-white no-underline",
              "transition-all duration-200",
              "border-l-[3px] border-transparent",
              navHover,
              getActiveClass('/admin/profile') && navActive,
              "text-[0.95rem] font-medium"
            )}
            onClick={handleNavClick}
          >
            {UserIcon ? <UserIcon size={20} className="mr-3 flex-shrink-0 !text-white" /> : <span className="w-5 h-5 mr-3 flex-shrink-0" />}
            <span className="!text-white">My Profile</span>
          </a>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Logout from admin panel"
            className={cn(
              "flex items-center px-6 py-3.5 !text-white w-full text-left",
              "transition-all duration-200",
              "border-l-[3px] border-transparent",
              "hover:bg-red-500/20 hover:border-red-500",
              "text-[0.95rem] font-medium",
              "bg-transparent border-0 cursor-pointer"
            )}
          >
            {LogOutIcon ? <LogOutIcon size={20} className="mr-3 flex-shrink-0 !text-white" aria-hidden="true" /> : <span className="w-5 h-5 mr-3 flex-shrink-0" aria-hidden="true" />}
            <span className="!text-white">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
