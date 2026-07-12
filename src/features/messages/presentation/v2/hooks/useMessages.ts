import { useCallback, useEffect, useMemo, useState } from "react";
import { type Message, type MessageFilter, matchesFilter, matchesSearch } from "@/features/messages/domain/entities/message";

const FILTERS: MessageFilter[] = ["All", "Unread", "Read", "Replied"];

/**
 * Owns the admin inbox state + actions (SRP). Presentation renders the returned
 * state and never touches the API. All mutations are optimistic with a server
 * round-trip; failures reload from the server.
 */
export function useMessages() {
	const [messages, setMessages] = useState<Message[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState<MessageFilter>("All");
	const [reply, setReply] = useState("");
	const [sending, setSending] = useState(false);
	const [toast, setToast] = useState("");

	const load = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const res = await fetch("/api/contact-messages?pageSize=100");
			if (!res.ok) throw new Error("Failed to load messages");
			const data = await res.json();
			const list: Message[] = Array.isArray(data?.data) ? data.data : [];
			setMessages(list);
		} catch (e) {
			setError("Could not load messages. Please try again.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const filtered = useMemo(() => messages.filter((m) => matchesFilter(m, filter) && matchesSearch(m, search)), [messages, filter, search]);

	const counts = useMemo(() => {
		const c: Record<MessageFilter, number> = { All: messages.length, Unread: 0, Read: 0, Replied: 0 };
		for (const m of messages) {
			if (!m.read) c.Unread++;
			if (m.read && !m.repliedAt) c.Read++;
			if (m.repliedAt) c.Replied++;
		}
		return c;
	}, [messages]);

	const selected = useMemo(() => messages.find((m) => m.id === selectedId) ?? null, [messages, selectedId]);

	const patchLocal = (id: string, changes: Partial<Message>) => setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...changes } : m)));

	const setRead = useCallback(async (id: string, read: boolean) => {
		patchLocal(id, { read });
		try {
			await fetch("/api/contact-messages", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id, read }),
			});
		} catch {
			load();
		}
	}, [load]);

	const select = useCallback(
		(id: string) => {
			setSelectedId(id);
			setReply("");
			setToast("");
			const m = messages.find((x) => x.id === id);
			if (m && !m.read) setRead(id, true);
		},
		[messages, setRead],
	);

	const toggleRead = useCallback(() => {
		if (!selected) return;
		setRead(selected.id, !selected.read);
	}, [selected, setRead]);

	const markAllRead = useCallback(async () => {
		const unread = messages.filter((m) => !m.read);
		if (!unread.length) return;
		setMessages((prev) => prev.map((m) => ({ ...m, read: true })));
		await Promise.allSettled(
			unread.map((m) =>
				fetch("/api/contact-messages", {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ id: m.id, read: true }),
				}),
			),
		);
	}, [messages]);

	const remove = useCallback(async () => {
		if (!selected) return;
		const id = selected.id;
		if (!window.confirm("Delete this message? This cannot be undone.")) return;
		setMessages((prev) => prev.filter((m) => m.id !== id));
		setSelectedId(null);
		try {
			await fetch(`/api/contact-messages/${id}`, { method: "DELETE" });
		} catch {
			load();
		}
	}, [selected, load]);

	const sendReply = useCallback(async () => {
		if (!selected) return;
		const text = reply.trim();
		if (!text || sending) return;
		setSending(true);
		setError("");
		try {
			const res = await fetch(`/api/contact-messages/${selected.id}/reply`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ reply: text }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				setError(data.error || "Failed to send reply.");
				return;
			}
			patchLocal(selected.id, { repliedAt: new Date().toISOString(), read: true });
			setReply("");
			setToast("Reply sent — message marked as replied.");
		} catch {
			setError("Failed to send reply. Please try again.");
		} finally {
			setSending(false);
		}
	}, [selected, reply, sending]);

	return {
		messages,
		filtered,
		counts,
		filters: FILTERS,
		loading,
		error,
		selected,
		selectedId,
		search,
		setSearch,
		filter,
		setFilter,
		reply,
		setReply,
		sending,
		toast,
		select,
		toggleRead,
		markAllRead,
		remove,
		sendReply,
		refresh: load,
	};
}
