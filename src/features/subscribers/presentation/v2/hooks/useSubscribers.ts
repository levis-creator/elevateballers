import { useCallback, useEffect, useMemo, useState } from "react";
import { usePermissions } from "@/features/rbac/usePermissions";
import { type Subscriber, type SubscriberFilter, SUBSCRIBER_FILTERS, matchesFilter, matchesSearch, computeStats } from "@/features/subscribers/domain/entities/subscriber";

const PAGE_SIZE = 25;

/**
 * Owns the subscribers admin state + actions (SRP). Presentation renders the
 * returned state; it never touches the API. Mutations are optimistic; failures
 * reload from the server.
 */
export function useSubscribers() {
	const { can } = usePermissions();
	const canManage = can("subscribers:manage");

	const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState<SubscriberFilter>("All");
	const [checked, setChecked] = useState<Set<string>>(new Set());
	const [page, setPage] = useState(1);

	const load = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const res = await fetch("/api/subscribers?active=false");
			if (!res.ok) throw new Error("Failed to load");
			const data = await res.json();
			setSubscribers(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []);
		} catch {
			setError("Could not load subscribers. Please try again.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const stats = useMemo(() => computeStats(subscribers), [subscribers]);
	const counts = useMemo(
		() => ({ All: subscribers.length, Active: stats.active, Unsubscribed: stats.unsubscribed }) as Record<SubscriberFilter, number>,
		[subscribers.length, stats],
	);

	const filtered = useMemo(() => subscribers.filter((s) => matchesFilter(s, filter) && matchesSearch(s, search)), [subscribers, filter, search]);

	// Reset to page 1 whenever the result set changes.
	useEffect(() => setPage(1), [filter, search]);
	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const pageClamped = Math.min(page, totalPages);
	const paged = useMemo(() => filtered.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE), [filtered, pageClamped]);

	const patchLocal = (id: string, ch: Partial<Subscriber>) => setSubscribers((prev) => prev.map((s) => (s.id === id ? { ...s, ...ch } : s)));

	// ── Row mutations ─────────────────────────────────────────────────────
	const setActive = useCallback(async (id: string, active: boolean) => {
		patchLocal(id, { active });
		try {
			await fetch(`/api/subscribers/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active }) });
		} catch {
			load();
		}
	}, [load]);

	const remove = useCallback(async (id: string) => {
		if (!window.confirm("Permanently delete this subscriber?")) return;
		setSubscribers((prev) => prev.filter((s) => s.id !== id));
		try {
			await fetch(`/api/subscribers/${id}`, { method: "DELETE" });
		} catch {
			load();
		}
	}, [load]);

	// ── Selection + bulk ──────────────────────────────────────────────────
	const toggleCheck = useCallback((id: string) => {
		setChecked((prev) => {
			const n = new Set(prev);
			n.has(id) ? n.delete(id) : n.add(id);
			return n;
		});
	}, []);
	const toggleAll = useCallback(() => {
		setChecked((prev) => {
			const allOn = paged.length > 0 && paged.every((s) => prev.has(s.id));
			const n = new Set(prev);
			paged.forEach((s) => (allOn ? n.delete(s.id) : n.add(s.id)));
			return n;
		});
	}, [paged]);
	const clearChecked = useCallback(() => setChecked(new Set()), []);

	const bulkUnsub = useCallback(async () => {
		const ids = [...checked];
		if (!ids.length) return;
		setSubscribers((prev) => prev.map((s) => (checked.has(s.id) ? { ...s, active: false } : s)));
		clearChecked();
		await Promise.allSettled(ids.map((id) => fetch(`/api/subscribers/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: false }) })));
	}, [checked, clearChecked]);

	const bulkDelete = useCallback(async () => {
		const ids = [...checked];
		if (!ids.length) return;
		if (!window.confirm(`Permanently delete ${ids.length} subscriber${ids.length === 1 ? "" : "s"}?`)) return;
		setSubscribers((prev) => prev.filter((s) => !checked.has(s.id)));
		clearChecked();
		await Promise.allSettled(ids.map((id) => fetch(`/api/subscribers/${id}`, { method: "DELETE" })));
	}, [checked, clearChecked]);

	// ── Add ───────────────────────────────────────────────────────────────
	const add = useCallback(async (email: string, name: string): Promise<string | null> => {
		const trimmed = email.trim();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Please enter a valid email address.";
		try {
			const res = await fetch("/api/subscribers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: trimmed, name: name.trim() || undefined }) });
			const data = await res.json().catch(() => ({}));
			if (!res.ok) return data.error || "Could not add subscriber.";
			await load();
			return null;
		} catch {
			return "Could not add subscriber. Please try again.";
		}
	}, [load]);

	// ── CSV export (client-side, current filter/search) ───────────────────
	const exportCsv = useCallback(() => {
		const rows = [["Email", "Name", "Status", "Subscribed"], ...filtered.map((s) => [s.email, s.name || "", s.active ? "Active" : "Unsubscribed", new Date(s.createdAt).toISOString().slice(0, 10)])];
		const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
		const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
		const a = document.createElement("a");
		a.href = url;
		a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}, [filtered]);

	return {
		subscribers,
		filtered,
		paged,
		loading,
		error,
		stats,
		counts,
		filters: SUBSCRIBER_FILTERS,
		filter,
		setFilter,
		search,
		setSearch,
		checked,
		toggleCheck,
		toggleAll,
		clearChecked,
		setActive,
		remove,
		bulkUnsub,
		bulkDelete,
		add,
		exportCsv,
		canManage,
		page: pageClamped,
		totalPages,
		setPage,
		refresh: load,
	};
}
