/**
 * v2 News list entities. The full published feed is passed to the React island,
 * which filters (category + search), paginates, and highlights a featured post.
 */

export interface NewsCard {
	cat: string;
	title: string;
	excerpt: string;
	date: string;
	read: string;
	href: string;
	image: string | null;
}

export interface CategoryCount {
	label: string;
	count: number;
}

export interface ArchiveItem {
	label: string; // e.g. "April 2026"
	count: number;
}

export interface NewsListData {
	articles: NewsCard[];
	/** Categories present, with post counts (for the sidebar + filter tabs). */
	categories: CategoryCount[];
	archives: ArchiveItem[];
}
