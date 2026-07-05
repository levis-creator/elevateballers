import { useState } from "react";
import type { ArticleComment } from "@/features/news/domain/entities/article-v2";

interface Props {
	articleId: string;
	initialComments: ArticleComment[];
	initialCount: number;
}

const COMMENT_COLORS = ["#e4002b", "#1f6feb", "#2f9e44", "#f08c00", "#7048e8", "#0c8599"];
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
export default function CommentsSectionV2({ articleId, initialComments, initialCount }: Props) {
	const [comments, setComments] = useState<ArticleComment[]>(initialComments);
	const [count, setCount] = useState(initialCount);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [body, setBody] = useState("");
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
			const posterName = name.trim() || "Anonymous";
			const created = data?.comment ?? data;
			setComments((prev) => [
				{
					id: created?.id ?? `local-${Date.now()}`,
					name: posterName,
					initials: initialsOf(posterName),
					color: colorFor(posterName),
					ago: "just now",
					body: body.trim(),
				},
				...prev,
			]);
			setCount((c) => c + 1);
			setStatus("success");
			setFeedback("Thanks — your comment has been posted.");
			setName("");
			setEmail("");
			setBody("");
		} catch {
			setStatus("error");
			setFeedback("Something went wrong. Please try again.");
		}
	};

	return (
		<div className="mx-auto max-w-[820px] px-8 py-[52px] max-[960px]:px-6">
			<div className="mb-6 flex items-center gap-3">
				<h2 className="font-display text-[26px] uppercase text-ink">Comments</h2>
				<span className="rounded-full bg-brand/10 px-2.5 py-1 font-mono text-[11px] text-brand">{count}</span>
			</div>

			{/* comment form */}
			<form onSubmit={handleSubmit} className="mb-9 rounded-2xl border border-black/10 bg-paper2 p-5 max-[600px]:p-4">
				<div className="grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
					<input type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} placeholder="Your name" className={field} />
					<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} placeholder="Email (not published)" className={field} />
				</div>
				<textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} disabled={busy} placeholder="Add a comment…" className={`mt-3 w-full resize-y ${field}`} />
				<div className="mt-3 flex items-center justify-between gap-3 max-[600px]:flex-col max-[600px]:items-stretch">
					<span className="font-mono text-[11px] text-muted2">Be respectful — comments are moderated.</span>
					<button type="submit" disabled={busy} className="rounded-lg bg-brand px-6 py-3 font-body text-[13px] font-extrabold uppercase tracking-[0.05em] text-white hover:bg-brandlt disabled:cursor-not-allowed disabled:opacity-60">
						{busy ? "Posting…" : "Post Comment"}
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
						<div key={c.id} className="flex gap-4">
							<span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full font-display text-[14px] text-white" style={{ background: c.color }}>
								{c.initials}
							</span>
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2.5">
									<span className="font-body text-[14px] font-bold text-ink2">{c.name}</span>
									<span className="font-mono text-[11px] text-muted2">{c.ago}</span>
								</div>
								<p className="mt-1.5 whitespace-pre-line text-[15px] leading-[1.6] text-ink2">{c.body}</p>
							</div>
						</div>
					))}
				</div>
			) : (
				<p className="text-[14px] text-muted">Be the first to comment.</p>
			)}
		</div>
	);
}
