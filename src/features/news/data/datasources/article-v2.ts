/**
 * v2 News-article data source. Resolves the article by slug and builds the view:
 * sanitized Quill body, derived read time, hero image, and a sidebar (recent
 * results, categories, latest news) + SSR'd approved comments. Reuses the
 * existing news/comment queries, getCompletedMatches and sanitizeHtml.
 */
import { getNewsArticleBySlug, getNewsArticles, getArticleComments, getArticleCommentCount } from "@/features/cms/lib/queries";
import { getCompletedMatches } from "@/features/matches/lib/queries";
import { sanitizeHtml } from "@/lib/sanitize";
import { getDisplayImageUrl } from "@/lib/asset-url";
import type { ArticleView, SidebarResult, SidebarNews, ArticleComment } from "@/features/news/domain/entities/article-v2";

const CATEGORY_LABEL: Record<string, string> = {
	INTERVIEWS: "Interviews",
	CHAMPIONSHIPS: "Championships",
	MATCH_REPORT: "Match Report",
	ANALYSIS: "Analysis",
};

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COMMENT_COLORS = ["#e4002b", "#1f6feb", "#2f9e44", "#f08c00", "#7048e8", "#0c8599"];

const initialsOf = (name: string): string =>
	name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

const fmtDate = (d: Date | string | null | undefined): string => {
	if (!d) return "";
	const date = new Date(d);
	if (Number.isNaN(date.getTime())) return "";
	return `${MON[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

/** ~200 wpm read time from the article's text content. */
function readTimeOf(html: string): string {
	const text = html.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ");
	const words = text.split(/\s+/).filter(Boolean).length;
	return `${Math.max(1, Math.round(words / 200))} min read`;
}

/** "3 days ago" / "just now". */
function timeAgo(d: Date | string): string {
	const then = new Date(d).getTime();
	const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
	const units: Array<[number, string]> = [
		[31536000, "year"],
		[2592000, "month"],
		[604800, "week"],
		[86400, "day"],
		[3600, "hour"],
		[60, "minute"],
	];
	for (const [s, label] of units) {
		const n = Math.floor(secs / s);
		if (n >= 1) return `${n} ${label}${n > 1 ? "s" : ""} ago`;
	}
	return "just now";
}

/** Colour + initials from name, deterministic (so the same commenter is stable). */
const colorFor = (name: string): string => {
	let h = 0;
	for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
	return COMMENT_COLORS[h % COMMENT_COLORS.length];
};

export async function fetchArticleView(slug: string): Promise<ArticleView | null> {
	try {
		const article: any = await getNewsArticleBySlug(slug);
		if (!article || !article.published) return null;

		const categoryLabel = CATEGORY_LABEL[article.category] || article.category;
		const authorName = article.author?.name || "Elevate Ballers Editorial";

		// Sidebar + comments in parallel.
		const [latestRows, completed, commentRows, commentCount] = await Promise.all([
			getNewsArticles().catch(() => [] as any[]),
			getCompletedMatches(3).catch(() => [] as any[]),
			getArticleComments(article.id).catch(() => [] as any[]),
			getArticleCommentCount(article.id).catch(() => 0),
		]);

		const recent: SidebarResult[] = (completed as any[]).slice(0, 3).map((m) => {
			const hs = m.team1Score ?? 0;
			const as = m.team2Score ?? 0;
			return {
				home: m.team1?.name || m.team1Name || "TBD",
				away: m.team2?.name || m.team2Name || "TBD",
				score: `${hs} – ${as}`,
				hColor: hs >= as ? "#141009" : "#a49a8d",
				aColor: as >= hs ? "#141009" : "#a49a8d",
				href: `/matches/${m.slug || m.id}`,
			};
		});

		const latest: SidebarNews[] = (latestRows as any[])
			.filter((n) => n.slug !== article.slug)
			.slice(0, 4)
			.map((n) => ({
				title: n.title,
				date: fmtDate(n.publishedAt || n.createdAt),
				href: `/news/${n.slug}`,
				image: getDisplayImageUrl(n.image),
			}));

		const categories = Object.values(CATEGORY_LABEL).map((label) => ({
			label,
			href: `/news?category=${encodeURIComponent(label)}`,
		}));

		const comments: ArticleComment[] = (commentRows as any[]).map((c) => {
			const name = c.user?.name || c.authorName || "Anonymous";
			return {
				id: c.id,
				name,
				initials: initialsOf(name),
				color: colorFor(name),
				ago: timeAgo(c.createdAt),
				body: c.content,
			};
		});

		return {
			id: article.id,
			slug: article.slug,
			category: categoryLabel,
			categoryHref: `/news?category=${encodeURIComponent(categoryLabel)}`,
			title: article.title,
			excerpt: article.excerpt || "",
			author: { name: authorName, initials: initialsOf(authorName) },
			dateText: fmtDate(article.publishedAt || article.createdAt),
			publishedTime: new Date(article.publishedAt || article.createdAt).toISOString(),
			modifiedTime: new Date(article.updatedAt || article.publishedAt || article.createdAt).toISOString(),
			readTime: readTimeOf(article.content || ""),
			heroImage: getDisplayImageUrl(article.image),
			bodyHtml: sanitizeHtml(article.content || ""),
			tags: [categoryLabel],
			sidebar: { recent, categories, latest },
			comments,
			commentCount: commentCount ?? comments.length,
		};
	} catch {
		return null;
	}
}
