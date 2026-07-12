/**
 * Contact message domain types shared by the admin inbox. Pure — no framework.
 */
export interface Message {
	id: string;
	name: string;
	email: string;
	subject: string;
	message: string;
	read: boolean;
	repliedAt: string | null;
	repliedBy?: string | null;
	replyBody?: string | null;
	draftReply?: string | null;
	trashedAt: string | null;
	createdAt: string;
}

export type MessageStatus = "unread" | "read" | "replied";
export type MessageFilter = "All" | "Unread" | "Read" | "Replied" | "Trash";

export const MESSAGE_FILTERS: MessageFilter[] = ["All", "Unread", "Read", "Replied", "Trash"];

/** A replied message is the strongest state, then read, then unread. */
export function messageStatus(m: Message): MessageStatus {
	if (m.repliedAt) return "replied";
	return m.read ? "read" : "unread";
}

export function isTrashed(m: Message): boolean {
	return !!m.trashedAt;
}

export function hasDraft(m: Message): boolean {
	return !!(m.draftReply && m.draftReply.trim());
}

/**
 * Filter predicate. Trash is a separate view: every non-Trash filter hides
 * trashed messages, and the Trash filter shows only trashed ones.
 */
export function matchesFilter(m: Message, filter: MessageFilter): boolean {
	if (filter === "Trash") return isTrashed(m);
	if (isTrashed(m)) return false;
	switch (filter) {
		case "Unread":
			return !m.read;
		case "Read":
			return m.read && !m.repliedAt;
		case "Replied":
			return !!m.repliedAt;
		default:
			return true;
	}
}

export function matchesSearch(m: Message, query: string): boolean {
	const q = query.trim().toLowerCase();
	if (!q) return true;
	return [m.name, m.email, m.subject, m.message].some((f) => (f || "").toLowerCase().includes(q));
}
