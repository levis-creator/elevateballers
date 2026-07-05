/**
 * getArticleView — resolves the v2 news-article view model by slug.
 * Returns null when the article doesn't exist (or is unpublished) so the route
 * can 404.
 */
import type { ArticleView } from "@/features/news/domain/entities/article-v2";
import { fetchArticleView } from "@/features/news/data/datasources/article-v2";

export async function getArticleView(slug: string): Promise<ArticleView | null> {
	if (!slug) return null;
	return fetchArticleView(slug);
}
