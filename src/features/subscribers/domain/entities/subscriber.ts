/**
 * Subscriber domain types for the admin list. Pure — no framework.
 */
export interface Subscriber {
	id: string;
	email: string;
	name: string | null;
	active: boolean;
	createdAt: string;
}

export type SubscriberFilter = "All" | "Active" | "Unsubscribed";
export const SUBSCRIBER_FILTERS: SubscriberFilter[] = ["All", "Active", "Unsubscribed"];

export function matchesFilter(s: Subscriber, filter: SubscriberFilter): boolean {
	if (filter === "Active") return s.active;
	if (filter === "Unsubscribed") return !s.active;
	return true;
}

export function matchesSearch(s: Subscriber, query: string): boolean {
	const q = query.trim().toLowerCase();
	if (!q) return true;
	return `${s.email} ${s.name || ""}`.toLowerCase().includes(q);
}

export interface SubscriberStats {
	total: number;
	active: number;
	unsubscribed: number;
	newThisMonth: number;
}

export function computeStats(list: Subscriber[]): SubscriberStats {
	const now = new Date();
	const y = now.getFullYear();
	const m = now.getMonth();
	let active = 0;
	let newThisMonth = 0;
	for (const s of list) {
		if (s.active) active++;
		const d = new Date(s.createdAt);
		if (d.getFullYear() === y && d.getMonth() === m) newThisMonth++;
	}
	return { total: list.length, active, unsubscribed: list.length - active, newThisMonth };
}
