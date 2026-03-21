import { prisma } from '../../../../../lib/prisma';
import type { CreateCommentInput, UpdateCommentInput, Comment } from '../../../types';

export async function createComment(data: CreateCommentInput): Promise<Comment> {
  if (!prisma.comment) {
    throw new Error('Prisma comment model not available. Please run: npx prisma generate');
  }

  const article = await prisma.newsArticle.findUnique({ where: { id: data.articleId } });
  if (!article) throw new Error('Article not found');

  if (data.parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: data.parentId } });
    if (!parent) throw new Error('Parent comment not found');
    if (parent.articleId !== data.articleId) throw new Error('Parent comment does not belong to this article');
  }

  return await prisma.comment.create({
    data: {
      content: data.content,
      authorName: data.authorName || null,
      authorEmail: data.authorEmail,
      authorUrl: data.authorUrl,
      articleId: data.articleId,
      userId: data.userId,
      parentId: data.parentId,
      approved: true,
    },
  });
}

export async function updateComment(id: string, data: UpdateCommentInput): Promise<Comment | null> {
  if (!prisma.comment) {
    console.error('Prisma comment model not available. Please run: npx prisma generate');
    return null;
  }

  try {
    return await prisma.comment.update({
      where: { id },
      data: {
        ...(data.content && { content: data.content }),
        ...(data.approved !== undefined && { approved: data.approved }),
      },
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    return null;
  }
}

export async function deleteComment(id: string): Promise<boolean> {
  if (!prisma.comment) {
    console.error('Prisma comment model not available. Please run: npx prisma generate');
    return false;
  }

  try {
    await prisma.comment.delete({ where: { id } });
    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    return false;
  }
}

export async function approveComment(id: string): Promise<Comment | null> {
  return updateComment(id, { approved: true });
}

export async function rejectComment(id: string): Promise<Comment | null> {
  return updateComment(id, { approved: false });
}
