import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { navigate } from 'astro:transitions/client';
import { Menu, Search, Plus, Sun, Moon, ChevronDown, Bell } from 'lucide-react';
import { usePermissions, clearPermissionCache } from '@/features/rbac/usePermissions';
import { useAdminShell } from '@/features/cms/presentation/components/AdminShellContext';
import { ADMIN_NAV } from './lib/admin-nav';
import { useAdminTheme } from './hooks/useAdminTheme';
import { useAdminNotifications, type AdminNotification } from './hooks/useAdminNotifications';

function notificationPresentation(notification: AdminNotification) {
  if (notification.type === 'TEAM_REGISTERED') return { title: 'New team registration', priority: 'Needs review', action: 'Review team', tone: 'text-emerald-500' };
  if (notification.type === 'PLAYER_REGISTERED') return { title: 'New player registration', priority: 'Needs review', action: 'Review player', tone: 'text-emerald-500' };
  if (notification.type === 'PLAYER_AUTO_LINKED') return { title: 'Player linked automatically', priority: 'Informational', action: 'View player', tone: 'text-sky-500' };
  if (notification.type === 'CONTACT_MESSAGE') return { title: 'New contact message', priority: 'Needs attention', action: 'Open message', tone: 'text-[var(--brand)]' };
  if (notification.type === 'MAILBOX_SYNC_FAILED') return { title: 'Mailbox sync failed', priority: 'Critical', action: 'Retry sync', tone: 'text-rose-500' };
  if (notification.type === 'ATTACHMENT_BLOCKED') return { title: 'Attachment blocked', priority: 'Critical', action: 'Review attachment', tone: 'text-rose-500' };
  if (notification.type === 'EMAIL_DELIVERY_FAILED') return { title: 'Email delivery failed', priority: 'Critical', action: 'Retry email', tone: 'text-rose-500' };
  if (notification.type === 'JOB_FAILED') return { title: 'Scheduled job failed', priority: 'Critical', action: 'Review job', tone: 'text-rose-500' };
  if (notification.type === 'SECURITY_ALERT') return { title: 'Security alert', priority: 'Critical', action: 'Review alert', tone: 'text-rose-500' };
  if (notification.type === 'REGISTRATION_DUPLICATE') return { title: 'Possible duplicate registration', priority: 'Needs review', action: 'Review duplicate', tone: 'text-amber-500' };
  return { title: 'Admin notification', priority: 'Needs attention', action: 'Open notification', tone: 'text-[var(--brand)]' };
}

/**
 * v2 admin topbar. Presentation + light local UI state (open menus). Reuses the
 * shell context (sidebar toggle), permissions, and the theme hook. Logout
 * mirrors the existing flow.
 */
export default function AdminHeaderV2() {
  const { user, can } = usePermissions();
  const { toggleSidebar } = useAdminShell();
  const { theme, toggle: toggleTheme } = useAdminTheme();
  const { notifications, unreadCount: notificationCount, markAllRead, open: openNotification } = useAdminNotifications(can('notifications:read'));

  const [menu, setMenu] = useState<null | 'user' | 'notifications'>(null);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  // Close any open menu on outside click.
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menu]);

  // Lightweight quick-nav: Enter jumps to the first nav item matching the query.
  const onSearchKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const q = query.trim().toLowerCase();
    if (!q) return;
    const match = ADMIN_NAV.flatMap((g) => g.items).find((i) => i.label.toLowerCase().includes(q));
    if (match) {
      setQuery('');
      navigate(match.href);
    }
  };

  const handleLogout = async () => {
    try {
      clearPermissionCache();
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    window.location.href = '/admin/login';
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || '?';
  const iconBtn =
    'flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[var(--bord)] bg-[var(--surf2)] text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]';

  return (
    <header
      ref={rootRef}
      className="fixed left-[var(--admin-sidebar-width,248px)] right-0 top-0 z-30 flex h-[57px] items-center gap-4 border-b border-[var(--bord2)] bg-[var(--topbar)] px-6 transition-[left] duration-[280ms] ease-out max-[900px]:left-0 max-[600px]:px-4"
    >
      <button type="button" onClick={toggleSidebar} aria-label="Toggle sidebar" className={iconBtn}>
        <span className="flex flex-col gap-[3px]">
          <Menu className="h-4 w-4" />
        </span>
      </button>

      <div className="flex min-w-0 max-w-[360px] flex-1 items-center gap-2.5 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3 py-2 max-[720px]:hidden">
        <Search className="h-[15px] w-[15px] flex-shrink-0 text-[var(--txm)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onSearchKey}
          placeholder="Jump to players, teams, articles…"
          className="w-full border-none bg-transparent font-['Archivo'] text-[13px] text-[var(--tx)] outline-none placeholder:text-[var(--faint)]"
        />
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <a
          href="/admin"
          data-astro-prefetch="hover"
          className="flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--brand)] px-3.5 py-2 font-['Archivo'] text-[12px] font-extrabold uppercase tracking-[0.04em] text-[var(--brandfg)] no-underline hover:bg-[var(--brandlt)]"
        >
          <Plus className="h-[14px] w-[14px]" />
          <span className="max-[600px]:hidden">Create</span>
        </a>

        {can('notifications:read') && (
          <div className="relative">
          <button
            type="button"
            onClick={() => setMenu((current) => current === 'notifications' ? null : 'notifications')}
            aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ''}`}
            title="Notifications"
            className={`${iconBtn} relative`}
          >
            <Bell className="h-4 w-4" />
            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 min-w-[17px] rounded-full bg-[var(--brand)] px-1 py-0.5 text-center font-['Space_Mono'] text-[8px] font-bold leading-none text-white">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>
          {menu === 'notifications' && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[340px] overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)] shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
              <div className="flex items-start justify-between gap-3 border-b border-[var(--bord2)] px-4 py-3">
                <div>
                  <div className="font-['Space_Mono'] text-[9px] uppercase tracking-[0.16em] text-[var(--brandsoft)]">Admin desk</div>
                  <span className="mt-0.5 block font-['Anton'] text-[18px] uppercase leading-none text-[var(--tx)]">Notifications</span>
                </div>
                <span className="rounded-full bg-[var(--chip)] px-2 py-1 font-['Space_Mono'] text-[9px] font-bold uppercase text-[var(--txm)]">{notificationCount} unread</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto p-2">
                {notifications.length === 0 ? (
                  <div className="px-3 py-8 text-center">
                    <Bell className="mx-auto mb-2 h-5 w-5 text-[var(--faint)]" />
                    <p className="font-['Archivo'] text-[12px] font-semibold text-[var(--txd)]">You’re all caught up</p>
                    <p className="mt-1 font-['Space_Mono'] text-[9px] uppercase tracking-[0.08em] text-[var(--faint)]">No unread notifications</p>
                  </div>
                ) : notifications.map((notification) => (
                  (() => {
                    const presentation = notificationPresentation(notification);
                    const related = notification.team?.name || (notification.player ? `${notification.player.firstName} ${notification.player.lastName}`.trim() : null);
                    return <button
                      type="button"
                      key={notification.id}
                      onClick={() => { openNotification(notification); setMenu(null); }}
                      className="w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--hov)]"
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-['Archivo'] text-[12px] font-bold text-[var(--tx)]">{presentation.title}</span>
                        <span className={`font-['Space_Mono'] text-[8px] font-bold uppercase tracking-[0.06em] ${presentation.tone}`}>{presentation.priority}</span>
                      </span>
                      <span className="mt-1 block font-['Archivo'] text-[11.5px] leading-4 text-[var(--txd)]">{notification.message}</span>
                      <span className="mt-1.5 flex items-center justify-between gap-2 font-['Space_Mono'] text-[9px] text-[var(--txm)]">
                        <span>{related || 'Admin activity'} · {new Date(notification.createdAt).toLocaleString()}</span>
                        <span className="font-bold text-[var(--brand)]">{presentation.action} →</span>
                      </span>
                    </button>;
                  })()
                ))}
              </div>
              <div className="flex gap-2 border-t border-[var(--bord2)] px-3 py-3">
              <button
                type="button"
                disabled={notificationCount === 0}
                onClick={() => { void markAllRead(); setMenu(null); }}
                className="flex-1 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3 py-2 text-[11px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Mark all as read
              </button>
              <a href="/admin" onClick={() => setMenu(null)} className="rounded-lg bg-[var(--brand)] px-3 py-2 font-['Archivo'] text-[11px] font-bold text-white no-underline hover:opacity-90">Dashboard</a>
              </div>
            </div>
          )}
          </div>
        )}

        {/* Theme */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle light or dark mode"
          title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          className={iconBtn}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* User */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenu((m) => (m === 'user' ? null : 'user'))}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] py-1.5 pl-1.5 pr-3 hover:border-[var(--brand)]"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand)] font-['Anton'] text-[13px] leading-none text-[var(--brandfg)]">
              {initial}
            </span>
            <span className="font-['Archivo'] text-[12.5px] font-bold text-[var(--tx)] max-[600px]:hidden">
              {user?.name?.split(' ')[0] || 'User'}
            </span>
            <ChevronDown className="h-3 w-3 text-[var(--txm)]" />
          </button>
          {menu === 'user' && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-[200px] overflow-hidden rounded-xl border border-[var(--bord)] bg-[var(--surf)] shadow-[0_14px_40px_rgba(0,0,0,0.45)]">
              <div className="border-b border-[var(--bord2)] px-3.5 py-2.5">
                <span className="block font-['Archivo'] text-[12.5px] font-bold text-[var(--tx)]">
                  {user?.name || 'User'}
                </span>
                <span className="block font-['Space_Mono'] text-[9.5px] uppercase tracking-[0.1em] text-[var(--txm)]">
                  Admin
                </span>
              </div>
              <a
                href="/admin"
                data-astro-prefetch="hover"
                className="block px-3.5 py-2.5 font-['Archivo'] text-[12.5px] font-semibold text-[var(--tx)] no-underline hover:bg-[var(--hov)]"
              >
                Dashboard
              </a>
              <a
                href="/"
                className="block px-3.5 py-2.5 font-['Archivo'] text-[12.5px] font-semibold text-[var(--tx)] no-underline hover:bg-[var(--hov)]"
              >
                View site
              </a>
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full border-t border-[var(--bord2)] px-3.5 py-2.5 text-left font-['Archivo'] text-[12.5px] font-bold text-[var(--brand)] hover:bg-[var(--hov)]"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
