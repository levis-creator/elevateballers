import { useCallback, useEffect, useState } from "react";
import { navigate } from "astro:transitions/client";

export interface AdminNotification {
	id: string;
	type: "TEAM_REGISTERED" | "PLAYER_REGISTERED" | "PLAYER_AUTO_LINKED" | "CONTACT_MESSAGE" | string;
	message: string;
	read: boolean;
	createdAt: string;
	team?: { id: string; name: string; slug: string } | null;
	player?: { id: string; firstName: string; lastName: string } | null;
	metadata?: { contactMessageId?: string } | null;
}

/**
 * Notification state for the v2 admin header. Same endpoints and polling cadence
 * as the v1 header: reads the master toggle, polls unread notifications every
 * 60s, and marks read on dismiss/click. Only active when the caller passes
 * `enabled` (i.e. the user has `notifications:read`).
 */
export function useAdminNotifications(enabled: boolean) {
	const [notifications, setNotifications] = useState<AdminNotification[]>([]);
	const [notificationsEnabled, setNotificationsEnabled] = useState(false);

	const unreadCount = notifications.filter((n) => !n.read).length;

	useEffect(() => {
		if (!enabled) return;
		let cancelled = false;
		fetch("/api/notifications/settings")
			.then((r) => (r.ok ? r.json() : { enabled: false }))
			.then((d) => !cancelled && setNotificationsEnabled(Boolean(d?.enabled)))
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [enabled]);

	const load = useCallback(() => {
		if (!enabled) return;
		fetch("/api/notifications?unread=true&limit=10")
			.then((r) => (r.ok ? r.json() : []))
			.then((d) => setNotifications(Array.isArray(d) ? d : []))
			.catch(() => {});
	}, [enabled]);

	useEffect(() => {
		if (!enabled || !notificationsEnabled) return;
		load();
		const id = window.setInterval(load, 60_000);
		return () => window.clearInterval(id);
	}, [enabled, notificationsEnabled, load]);

	const markRead = useCallback(async (id: string) => {
		setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
		try {
			await fetch("/api/notifications", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id, read: true }),
			});
		} catch {
			/* ignore — optimistic */
		}
	}, []);

	const open = useCallback(
		(n: AdminNotification) => {
			markRead(n.id);
			if (n.team) navigate(`/admin/teams/${n.team.id}`);
			else if (n.player) navigate(`/admin/players/${n.player.id}`);
			else if (n.metadata?.contactMessageId) navigate(`/admin/messages?id=${n.metadata.contactMessageId}`);
			else navigate("/admin/notifications");
		},
		[markRead],
	);

	return { notifications, notificationsEnabled, unreadCount, markRead, open };
}
