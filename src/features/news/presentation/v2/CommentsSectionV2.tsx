import { useState } from "react";
import type { ArticleComment } from "@/features/news/domain/entities/article-v2";
import type { PublicArticlePageSettings } from "@/features/settings/application/articlePageSettings";

interface Props {
	articleId: string;
	initialComments: ArticleComment[];
	initialCount: number;
	settings: PublicArticlePageSettings;
}

const COMMENT_COLORS = ["var(--brand)", "#1f6feb", "#2f9e44", "#f08c00", "#7048e8", "#0c8599"];
const initialsOf = (name: string): string =>
	name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
const colorFor = (name: string): string => {
	let h = 0;
	for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
	return COMMENT_COLORS[h % COMMENT_COLORS.length];
};

/**
 * v2 comments — React island. The approved comments are SSR'd (passed as props);
 * the form posts to the existing /api/comments endpoint. New comments are
 * moderated, so on success we show a pending-review notice rather than optimistically
 * inserting them.
 */
export default function CommentsSectionV2({ articleId, initialComments, initialCount, settings }: Props) {
	const [comments, setComments] = useState<ArticleComment[]>(initialComments);
	const [count, setCount] = useState(initialCount);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [body, setBody] = useState("");
	const [replyTo, setReplyTo] = useState<string | null>(null);
	const [replyBody, setReplyBody] = useState("");
	const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
	const [feedback, setFeedback] = useState("");

	const busy = status === "loading";
	const field = "rounded-lg border border-black/15 bg-white px-4 py-3 font-body text-[14px] text-ink2 outline-none focus:border-brand disabled:opacity-60";

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (body.trim().length < 3) {
			setStatus("error");
			setFeedback("Please write a comment before posting.");
			return;
		}
		setStatus("loading");
		setFeedback("");
		try {
			const res = await fetch("/api/comments", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					articleId,
					content: body.trim(),
					authorName: name.trim() || "Anonymous",
					authorEmail: email.trim() || undefined,
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				setStatus("error");
				setFeedback(data.error || "Something went wrong. Please try again.");
				return;
			}
			const created = data?.comment ?? data;
			const posterName = name.trim() || "Anonymous";
			if (created?.approved !== false) setComments((prev) => [
				{
					id: created?.id ?? `local-${Date.now()}`,
					name: posterName,
					initials: initialsOf(posterName),
					color: colorFor(posterName),
					ago: "just now",
					body: body.trim(),
					replies: [],
				},
				...prev,
			]);
			if (created?.approved !== false) setCount((c) => c + 1);
			setStatus("success");
			setFeedback(created?.approved === false ? "Thanks — your comment is awaiting moderation." : "Thanks — your comment has been posted.");
			fetch(`/api/news/${articleId}/engagement`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ type: "COMMENT" }),
			}).catch(() => {});
			setName("");
			setEmail("");
			setBody("");
		} catch {
			setStatus("error");
			setFeedback("Something went wrong. Please try again.");
		}
	};

	const handleReply = async (parentId: string) => {
		if (replyBody.trim().length < 3) return;
		setStatus("loading");
		setFeedback("");
		try {
			const res = await fetch("/api/comments", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ articleId, parentId, content: replyBody.trim(), authorName: name.trim() || "Anonymous", authorEmail: email.trim() || undefined }),
			});
			const created = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(created.error || "Unable to post reply.");
			if (created.approved !== false) {
				const posterName = name.trim() || "Anonymous";
				const reply: ArticleComment = { id: created.id, name: posterName, initials: initialsOf(posterName), color: colorFor(posterName), ago: "just now", body: replyBody.trim(), replies: [] };
				setComments((current) => current.map((comment) => comment.id === parentId ? { ...comment, replies: [...comment.replies, reply] } : comment));
				setCount((current) => current + 1);
			}
			setReplyBody("");
			setReplyTo(null);
			setStatus("success");
			setFeedback(created.approved === false ? "Thanks — your reply is awaiting moderation." : "Thanks — your reply has been posted.");
		} catch (error) {
			setStatus("error");
			setFeedback(error instanceof Error ? error.message : "Unable to post reply.");
		}
	};

	return (
		<div className="mx-auto max-w-[820px] px-8 py-[52px] max-[960px]:px-6">
			<div className="mb-6 flex items-center gap-3">
				<h2 className="font-display text-[26px] uppercase text-ink">{settings.commentsHeading}</h2>
				<span className="rounded-full bg-brand/10 px-2.5 py-1 font-mono text-[11px] text-brand">{count}</span>
			</div>

			{/* comment form */}
			<form onSubmit={handleSubmit} className="mb-9 rounded-2xl border border-black/10 bg-paper2 p-5 max-[600px]:p-4">
				<div className="grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
					<input type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} placeholder="Your name" className={field} />
					<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} placeholder="Email (not published)" className={field} />
				</div>
				<textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} disabled={busy} placeholder={settings.commentPlaceholder} className={`mt-3 w-full resize-y ${field}`} />
				<div className="mt-3 flex items-center justify-between gap-3 max-[600px]:flex-col max-[600px]:items-stretch">
					<span className="font-mono text-[11px] text-muted2">{settings.commentNote}</span>
					<button type="submit" disabled={busy} className="rounded-lg bg-brand px-6 py-3 font-body text-[13px] font-extrabold uppercase tracking-[0.05em] text-brandfg hover:bg-brandlt disabled:cursor-not-allowed disabled:opacity-60">
						{busy ? "Posting…" : settings.commentButton}
					</button>
				</div>
				{feedback && (
					<p className={`mt-3 text-[13px] ${status === "error" ? "text-brand" : "text-[#2f9e44]"}`}>{feedback}</p>
				)}
			</form>

			{/* comment list */}
			{comments.length > 0 ? (
				<div className="flex flex-col gap-6">
					{comments.map((c) => (
						<div key={c.id}>
						<div className="flex gap-4">
							<span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full font-display text-[14px] text-white" style={{ background: c.color }}>
								{c.initials}
							</span>
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2.5">
									<span className="font-body text-[14px] font-bold text-ink2">{c.name}</span>
									<span className="font-mono text-[11px] text-muted2">{c.ago}</span>
								</div>
								<p className="mt-1.5 whitespace-pre-line text-[15px] leading-[1.6] text-ink2">{c.body}</p>
								{settings.replies && <button type="button" onClick={() => setReplyTo(replyTo === c.id ? null : c.id)} className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-brand">Reply</button>}
							</div>
						</div>
						{c.replies.map((reply) => <div key={reply.id} className="ml-14 mt-4 flex gap-3 border-l border-black/10 pl-4"><span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-display text-[12px] text-white" style={{ background: reply.color }}>{reply.initials}</span><div><div className="flex items-center gap-2"><strong className="text-[13px] text-ink2">{reply.name}</strong><span className="font-mono text-[10px] text-muted2">{reply.ago}</span></div><p className="mt-1 whitespace-pre-line text-[14px] leading-[1.55] text-ink2">{reply.body}</p></div></div>)}
						{replyTo === c.id && <div className="ml-14 mt-4 flex gap-2"><textarea rows={2} value={replyBody} onChange={(event) => setReplyBody(event.target.value)} placeholder="Write a reply…" className={`min-w-0 flex-1 resize-y ${field}`} /><button type="button" disabled={busy} onClick={() => void handleReply(c.id)} className="self-end rounded-lg bg-brand px-4 py-3 text-[12px] font-bold text-brandfg disabled:opacity-60">Post reply</button></div>}
						</div>
					))}
				</div>
			) : (
				<p className="text-[14px] text-muted">Be the first to comment.</p>
			)}
		</div>
	);
}
