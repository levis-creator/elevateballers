/**
 * v2 News list data source. Reuses getNewsArticles (published feed) and maps
 * each to a display card, plus category counts and month archives for the
 * sidebar. Read time is derived from the article content.
 */
import { getNewsArticles } from "@/features/cms/lib/queries";
import { getDisplayImageUrl } from "@/lib/asset-url";
import type { NewsListData, NewsCard, CategoryCount, ArchiveItem } from "@/features/news/domain/entities/news-list-v2";

const CATEGORY_LABEL: Record<string, string> = {
	INTERVIEWS: "Interviews",
	CHAMPIONSHIPS: "Championships",
	MATCH_REPORT: "Match Report",
	ANALYSIS: "Analysis",
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const fmtDate = (d: Date | string | null | undefined): string => {
	if (!d) return "";
	const date = new Date(d);
	if (Number.isNaN(date.getTime())) return "";
	return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

/** ~200 wpm read time from the article's text content. */
function readTimeOf(html: string): string {
	const words = html.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").split(/\s+/).filter(Boolean).length;
	return `${Math.max(1, Math.round(words / 200))} min read`;
}

export async function fetchNewsListData(): Promise<NewsListData | null> {
	try {
		const rows = await getNewsArticles();
		if (!rows.length) return null;

		// Newest first.
		const sorted = [...(rows as any[])].sort(
			(a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime(),
		);

		const articles: NewsCard[] = sorted.map((n) => ({
			cat: CATEGORY_LABEL[n.category] || n.category,
			title: n.title,
			excerpt: n.excerpt || "",
			date: fmtDate(n.publishedAt || n.createdAt),
			read: readTimeOf(n.content || ""),
			href: `/news/${n.slug}`,
			image: getDisplayImageUrl(n.image),
		}));

		// Category counts (only categories that have posts).
		const catMap = new Map<string, number>();
		for (const a of articles) catMap.set(a.cat, (catMap.get(a.cat) ?? 0) + 1);
		const categories: CategoryCount[] = [...catMap.entries()]
			.sort((a, b) => b[1] - a[1])
			.map(([label, count]) => ({ label, count }));

		// Month archives (newest first).
		const archMap = new Map<string, { label: string; ts: number; count: number }>();
		for (const n of sorted) {
			const d = new Date(n.publishedAt || n.createdAt);
			if (Number.isNaN(d.getTime())) continue;
			const key = `${d.getFullYear()}-${d.getMonth()}`;
			const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
			const ts = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
			const cur = archMap.get(key);
			if (cur) cur.count += 1;
			else archMap.set(key, { label, ts, count: 1 });
		}
		const archives: ArchiveItem[] = [...archMap.values()]
			.sort((a, b) => b.ts - a.ts)
			.slice(0, 6)
			.map((a) => ({ label: a.label, count: a.count }));

		return { articles, categories, archives };
	} catch {
		return null;
	}
}
