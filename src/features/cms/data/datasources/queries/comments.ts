import { prisma } from '../../../../../lib/prisma';
import type { CommentWithAuthor } from '../../../types';

async function getRepliesRecursive(parentId: string, approvedOnly = true): Promise<CommentWithAuthor[]> {
  const replies = await prisma.comment.findMany({
    where: { parentId, ...(approvedOnly ? { approved: true } : {}) },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return await Promise.all(
    replies.map(async (reply) => ({
      ...reply,
      replies: await getRepliesRecursive(reply.id, approvedOnly),
    } as CommentWithAuthor))
  );
}

export async function getArticleComments(articleId: string): Promise<CommentWithAuthor[]> {
  if (!prisma.comment) {
    console.error('Prisma comment model not available. Please run: npx prisma generate');
    return [];
  }

  const comments = await prisma.comment.findMany({
    where: { articleId, approved: true, parentId: null },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return await Promise.all(
    comments.map(async (comment) => ({
      ...comment,
      replies: await getRepliesRecursive(comment.id, true),
    } as CommentWithAuthor))
  );
}

export async function getAllArticleComments(articleId: string): Promise<CommentWithAuthor[]> {
  if (!prisma.comment) {
    console.error('Prisma comment model not available. Please run: npx prisma generate');
    return [];
  }

  const comments = await prisma.comment.findMany({
    where: { articleId, parentId: null },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return await Promise.all(
    comments.map(async (comment) => ({
      ...comment,
      replies: await getRepliesRecursive(comment.id, false),
    } as CommentWithAuthor))
  );
}

export async function getArticleCommentCount(articleId: string): Promise<number> {
  if (!prisma.comment) {
    console.error('Prisma comment model not available. Please run: npx prisma generate');
    return 0;
  }
  return await prisma.comment.count({ where: { articleId, approved: true } });
}

export async function getCommentById(id: string): Promise<CommentWithAuthor | null> {
  if (!prisma.comment) {
    console.error('Prisma comment model not available. Please run: npx prisma generate');
    return null;
  }

  return await prisma.comment.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true } } },
  }) as CommentWithAuthor | null;
}
