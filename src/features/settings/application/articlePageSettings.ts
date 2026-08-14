import type { SiteSetting } from '../domain/siteSetting';

export type ArticleModeration = 'Hold every comment' | 'Publish, flag reports' | 'Publish immediately';
export type ArticleShareTarget = { name: string };

export type PublicArticlePageSettings = {
  categoryChip: boolean;
  standfirst: boolean;
  author: boolean;
  readTime: boolean;
  heroImage: boolean;
  tags: boolean;
  share: boolean;
  shareTargets: ArticleShareTarget[];
  comments: boolean;
  commentsHeading: string;
  commentPlaceholder: string;
  commentNote: string;
  commentButton: string;
  moderation: ArticleModeration;
  replies: boolean;
};

export const DEFAULT_PUBLIC_ARTICLE_PAGE_SETTINGS: PublicArticlePageSettings = {
  categoryChip: true,
  standfirst: true,
  author: true,
  readTime: true,
  heroImage: true,
  tags: true,
  share: true,
  shareTargets: [{ name: 'FB' }, { name: 'X' }, { name: 'IG' }, { name: 'in' }],
  comments: true,
  commentsHeading: 'Comments',
  commentPlaceholder: 'Add a comment…',
  commentNote: 'Be respectful — comments are moderated.',
  commentButton: 'Post Comment',
  moderation: 'Hold every comment',
  replies: true,
};

const bool = (value: string | undefined, fallback: boolean) => value === 'true' ? true : value === 'false' ? false : fallback;
const text = (value: string | undefined, fallback: string) => value === undefined ? fallback : value.trim();
const targets = (value: string | undefined, fallback: ArticleShareTarget[]) => {
  if (value === undefined) return fallback;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return fallback;
    return parsed.map((item) => ({ name: String(item?.name ?? '').trim() })).filter((item) => item.name).slice(0, 8);
  } catch {
    return fallback;
  }
};

export function resolvePublicArticlePageSettings(settings: SiteSetting[]): PublicArticlePageSettings {
  const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const defaults = DEFAULT_PUBLIC_ARTICLE_PAGE_SETTINGS;
  const moderation = text(values.article_moderation, defaults.moderation);
  return {
    categoryChip: bool(values.article_categoryChip, defaults.categoryChip),
    standfirst: bool(values.article_standfirst, defaults.standfirst),
    author: bool(values.article_author, defaults.author),
    readTime: bool(values.article_readTime, defaults.readTime),
    heroImage: bool(values.article_heroImage, defaults.heroImage),
    tags: bool(values.article_tags, defaults.tags),
    share: bool(values.article_share, defaults.share),
    shareTargets: targets(values.article_shareTargets, defaults.shareTargets),
    comments: bool(values.article_comments, defaults.comments),
    commentsHeading: text(values.article_commentsHeading, defaults.commentsHeading),
    commentPlaceholder: text(values.article_commentPlaceholder, defaults.commentPlaceholder),
    commentNote: text(values.article_commentNote, defaults.commentNote),
    commentButton: text(values.article_commentButton, defaults.commentButton),
    moderation: ['Hold every comment', 'Publish, flag reports', 'Publish immediately'].includes(moderation)
      ? moderation as ArticleModeration
      : defaults.moderation,
    replies: bool(values.article_replies, defaults.replies),
  };
}
