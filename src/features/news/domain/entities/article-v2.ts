/**
 * v2 News-article (detail) entity. `ArticleView` is display-ready: the body is
 * the sanitized Quill HTML (rendered into `.article-body`, styled by the prose
 * CSS), plus header, hero, tags, share links, a sidebar (recent results,
 * categories, latest news) and SSR'd comments.
 */

export interface ArticleShare {
	label: string;
	href: string;
}

export interface SidebarResult {
	home: string;
	away: string;
	score: string;
	hColor: string;
	aColor: string;
	href: string;
}

export interface SidebarNews {
	title: string;
	date: string;
	href: string;
	image: string | null;
}

export interface SidebarCategory {
	label: string;
	href: string;
}

export interface ArticleComment {
	id: string;
	name: string;
	initials: string;
	color: string;
	ago: string;
	body: string;
}

export interface ArticleView {
	id: string;
	slug: string;
	category: string;
	categoryHref: string;
	title: string;
	excerpt: string;
	author: { name: string; initials: string };
	dateText: string;
	readTime: string;
	heroImage: string | null;
	/** Sanitized Quill HTML for `.article-body`. */
	bodyHtml: string;
	tags: string[];
	sidebar: {
		recent: SidebarResult[];
		categories: SidebarCategory[];
		latest: SidebarNews[];
	};
	comments: ArticleComment[];
	commentCount: number;
}
