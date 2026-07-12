import { useCallback, useEffect, useMemo, useState } from "react";
import { type Message, type MessageFilter, MESSAGE_FILTERS, matchesFilter, matchesSearch } from "@/features/messages/domain/entities/message";

const patchMessage = (id: string, body: Record<string, unknown>) =>
	fetch("/api/contact-messages", {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ id, ...body }),
	});

/**
 * Owns the admin inbox state + actions (SRP). Presentation renders the returned
 * state and never touches the API. Mutations are optimistic; failures reload.
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
	const [draftToast, setDraftToast] = useState(false);
	const [savingDraft, setSavingDraft] = useState(false);
	const [checked, setChecked] = useState<Set<string>>(new Set());
	const [draftLoaded, setDraftLoaded] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const res = await fetch("/api/contact-messages?pageSize=100");
			if (!res.ok) throw new Error("Failed to load messages");
			const data = await res.json();
			setMessages(Array.isArray(data?.data) ? data.data : []);
		} catch {
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
		const c = { All: 0, Unread: 0, Read: 0, Replied: 0, Trash: 0 } as Record<MessageFilter, number>;
		for (const m of messages) {
			if (m.trashedAt) {
				c.Trash++;
				continue;
			}
			c.All++;
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
			await patchMessage(id, { read });
		} catch {
			load();
		}
	}, [load]);

	const select = useCallback(
		(id: string) => {
			setSelectedId(id);
			setToast("");
			setDraftToast(false);
			const m = messages.find((x) => x.id === id);
			// Preload any saved draft into the composer.
			const draft = m?.draftReply?.trim() ? m.draftReply : "";
			setReply(draft || "");
			setDraftLoaded(!!draft);
			if (m && !m.read && !m.trashedAt) setRead(id, true);
		},
		[messages, setRead],
	);

	const closeReading = useCallback(() => {
		setSelectedId(null);
		setReply("");
		setDraftLoaded(false);
	}, []);

	const toggleRead = useCallback(() => {
		if (selected) setRead(selected.id, !selected.read);
	}, [selected, setRead]);

	const markAllRead = useCallback(async () => {
		const unread = messages.filter((m) => !m.read && !m.trashedAt);
		if (!unread.length) return;
		setMessages((prev) => prev.map((m) => (m.trashedAt ? m : { ...m, read: true })));
		await Promise.allSettled(unread.map((m) => patchMessage(m.id, { read: true })));
	}, [messages]);

	// ── Trash (soft delete) ──────────────────────────────────────────────
	const setTrashed = useCallback(async (id: string, trashed: boolean) => {
		patchLocal(id, { trashedAt: trashed ? new Date().toISOString() : null });
		try {
			await patchMessage(id, { trashed });
		} catch {
			load();
		}
	}, [load]);

	const moveToTrash = useCallback(() => {
		if (!selected) return;
		setTrashed(selected.id, true);
		setSelectedId(null);
	}, [selected, setTrashed]);

	const restore = useCallback(() => {
		if (selected) setTrashed(selected.id, false);
	}, [selected, setTrashed]);

	const rowDelete = useCallback(async (id: string) => {
		if (!window.confirm("Permanently delete this message? This cannot be undone.")) return;
		setMessages((prev) => prev.filter((m) => m.id !== id));
		setSelectedId((cur) => (cur === id ? null : cur));
		try {
			await fetch(`/api/contact-messages/${id}`, { method: "DELETE" });
		} catch {
			load();
		}
	}, [load]);

	const deleteForever = useCallback(() => {
		if (selected) rowDelete(selected.id);
	}, [selected, rowDelete]);

	// ── Bulk selection ───────────────────────────────────────────────────
	const toggleCheck = useCallback((id: string) => {
		setChecked((prev) => {
			const n = new Set(prev);
			n.has(id) ? n.delete(id) : n.add(id);
			return n;
		});
	}, []);
	const clearChecked = useCallback(() => setChecked(new Set()), []);

	const bulkRead = useCallback(async () => {
		const ids = [...checked];
		if (!ids.length) return;
		setMessages((prev) => prev.map((m) => (checked.has(m.id) ? { ...m, read: true } : m)));
		clearChecked();
		await Promise.allSettled(ids.map((id) => patchMessage(id, { read: true })));
	}, [checked, clearChecked]);

	const bulkTrash = useCallback(async () => {
		const ids = [...checked];
		if (!ids.length) return;
		const now = new Date().toISOString();
		setMessages((prev) => prev.map((m) => (checked.has(m.id) ? { ...m, trashedAt: now } : m)));
		if (selectedId && checked.has(selectedId)) setSelectedId(null);
		clearChecked();
		await Promise.allSettled(ids.map((id) => patchMessage(id, { trashed: true })));
	}, [checked, clearChecked, selectedId]);

	// ── Drafts ───────────────────────────────────────────────────────────
	const onReplyChange = (v: string) => {
		setReply(v);
		setDraftLoaded(false);
		if (toast) setToast("");
		if (draftToast) setDraftToast(false);
	};

	const saveDraft = useCallback(async () => {
		if (!selected || savingDraft) return;
		const text = reply.trim();
		setSavingDraft(true);
		patchLocal(selected.id, { draftReply: text || null });
		try {
			await patchMessage(selected.id, { draftReply: text });
			setDraftToast(true);
		} catch {
			load();
		} finally {
			setSavingDraft(false);
		}
	}, [selected, reply, savingDraft, load]);

	// ── Send reply (SMTP) ────────────────────────────────────────────────
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
			patchLocal(selected.id, { repliedAt: new Date().toISOString(), replyBody: text, read: true, draftReply: null });
			setReply("");
			setDraftLoaded(false);
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
		filters: MESSAGE_FILTERS,
		loading,
		error,
		selected,
		selectedId,
		search,
		setSearch,
		filter,
		setFilter,
		reply,
		onReplyChange,
		sending,
		toast,
		draftToast,
		draftLoaded,
		checked,
		select,
		closeReading,
		toggleRead,
		markAllRead,
		moveToTrash,
		restore,
		deleteForever,
		rowSetRead: setRead,
		rowTrash: setTrashed,
		rowDelete,
		toggleCheck,
		clearChecked,
		bulkRead,
		bulkTrash,
		saveDraft,
		savingDraft,
		sendReply,
		refresh: load,
	};
}
