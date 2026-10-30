import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, RefreshCw } from 'lucide-react';
import { useAdminNotifications, type AdminNotification } from './hooks/useAdminNotifications';
import { PermissionProvider, usePermissions } from '@/features/rbac/usePermissions';
import { SkeletonList, SkeletonRegion, useFirstLoad } from '@/shared/components/skeleton/Skeleton';

function presentation(notification: AdminNotification) {
  const labels: Record<string, [string, string]> = {
    TEAM_REGISTERED: ['Team registration', 'Review team'],
    PLAYER_REGISTERED: ['Player registration', 'Review player'],
    PLAYER_AUTO_LINKED: ['Player linked', 'View player'],
    CONTACT_MESSAGE: ['Contact message', 'Open message'],
    MAILBOX_SYNC_FAILED: ['Mailbox sync failed', 'Open messages'],
    ATTACHMENT_BLOCKED: ['Attachment blocked', 'Open media'],
    EMAIL_DELIVERY_FAILED: ['Email delivery failed', 'Open messages'],
    JOB_FAILED: ['Scheduled job failed', 'Review job'],
    SECURITY_ALERT: ['Security alert', 'Review security'],
    REGISTRATION_DUPLICATE: ['Possible duplicate', 'Review registrations'],
  };
  return labels[notification.type] ?? ['Admin notification', 'Review notification'];
}

function NotificationsContent() {
  const { can } = usePermissions();
  const { markRead, markAllRead, open } = useAdminNotifications(can('notifications:read'));
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [loading, setLoading] = useState(true);
  const firstLoad = useFirstLoad(loading);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/notifications?limit=100${filter === 'UNREAD' ? '&unread=true' : ''}`);
      if (!response.ok) throw new Error('Could not load notifications.');
      setItems(await response.json());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [filter]);

  const unread = useMemo(() => items.filter((item) => !item.read).length, [items]);
  const markItemRead = async (item: AdminNotification) => {
    await markRead(item.id);
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry));
  };

  return <div className="font-['Archivo'] text-[var(--tx)]">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div><div className="mb-1 font-['Space_Mono'] text-[11px] uppercase tracking-[0.16em] text-[var(--brandsoft)]">Admin desk</div><h1 className="font-['Anton'] text-[30px] uppercase leading-none">Notifications</h1><p className="mt-2 text-[13px] text-[var(--txm)]">Review alerts, workflow events, and operational issues.</p></div>
      <div className="flex gap-2"><button type="button" onClick={() => { void markAllRead(); setItems((current) => current.map((item) => ({ ...item, read: true }))); }} disabled={!unread} className="inline-flex items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3 py-2 text-[12px] font-bold text-[var(--txd)] disabled:opacity-50"><CheckCheck className="h-4 w-4" /> Mark all read</button><button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3 py-2 text-[12px] font-bold text-[var(--txd)]"><RefreshCw className="h-4 w-4" /> Refresh</button></div>
    </div>
    <div className="mb-4 flex gap-2"><button type="button" onClick={() => setFilter('ALL')} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${filter === 'ALL' ? 'bg-[var(--brand)] text-white' : 'border border-[var(--bord)] bg-[var(--surf2)] text-[var(--txm)]'}`}>All</button><button type="button" onClick={() => setFilter('UNREAD')} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${filter === 'UNREAD' ? 'bg-[var(--brand)] text-white' : 'border border-[var(--bord)] bg-[var(--surf2)] text-[var(--txm)]'}`}>Unread</button></div>
    <section className="overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)]"><div className={loading && !firstLoad ? 'eb-refreshing' : undefined}>{firstLoad ? <SkeletonRegion label="Loading notifications" ><SkeletonList rows={7} bare /></SkeletonRegion> : error ? <div className="p-12 text-center text-[13px] text-[var(--brand)]">{error}</div> : !items.length ? <div className="p-12 text-center"><Bell className="mx-auto mb-2 h-6 w-6 text-[var(--faint)]" /><p className="text-[13px] font-semibold text-[var(--txd)]">No notifications found</p></div> : <div>{items.map((item) => { const [title, action] = presentation(item); const related = item.team?.name || (item.player ? `${item.player.firstName} ${item.player.lastName}` : 'Admin activity'); return <article key={item.id} className={`border-b border-[var(--bord2)] p-4 last:border-0 ${item.read ? '' : 'bg-[var(--surf2)]'}`}><div className="flex items-start gap-3"><span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--chip)] text-[var(--brand)]"><Bell className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-[13px] font-bold">{title}</h2>{!item.read && <span className="rounded-full bg-[var(--brand)] px-2 py-0.5 font-['Space_Mono'] text-[8px] font-bold uppercase text-white">Unread</span>}</div><p className="mt-1 text-[12.5px] leading-5 text-[var(--txd)]">{item.message}</p><div className="mt-1.5 font-['Space_Mono'] text-[9px] text-[var(--txm)]">{related} · {new Date(item.createdAt).toLocaleString()}</div></div><div className="flex flex-wrap justify-end gap-2">{!item.read && <button type="button" onClick={() => void markItemRead(item)} className="rounded-md border border-[var(--bord)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--txd)]">Mark read</button>}<button type="button" onClick={() => { open(item); }} className="rounded-md bg-[var(--brand)] px-2.5 py-1.5 text-[10px] font-bold text-white">{action}</button></div></div></article>; })}</div>}</div></section>
  </div>;
}

/** Establishes its own PermissionProvider (matches the other admin islands). */
export default function NotificationsPageV2() {
  return (
    <PermissionProvider>
      <NotificationsContent />
    </PermissionProvider>
  );
}
