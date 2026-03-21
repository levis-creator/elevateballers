import { prisma } from '../../../../../lib/prisma';
import type { MediaWithFolderAndUploader } from '../../../types';

function mapMediaRow(row: any): MediaWithFolderAndUploader {
  return {
    id: row.id, title: row.title, url: row.url, type: row.type,
    thumbnail: row.thumbnail, tags: row.tags,
    size: row.size ? Number(row.size) : null,
    filePath: row.filePath || row.file_path,
    folderId: row.folderId || row.folder_id,
    uploaderId: row.uploaderId || row.uploaded_by,
    createdAt: row.createdAt || row.created_at,
    updatedAt: row.updatedAt || row.updated_at,
    featured: Boolean(row.featured),
    folder: row.folder_id
      ? { id: row.folder_id, name: row.folder_name, isPrivate: Boolean(row.folder_isPrivate ?? row.folder_is_private) }
      : null,
    uploader: row.uploader_id
      ? { id: row.uploader_id, name: row.uploader_name, email: row.uploader_email }
      : null,
  } as MediaWithFolderAndUploader;
}

/** Get media items with optional type filter */
export async function getMedia(type?: string): Promise<MediaWithFolderAndUploader[]> {
  const typeMap: Record<string, string> = { image: 'IMAGE', video: 'VIDEO', audio: 'AUDIO', document: 'DOCUMENT' };
  const typeCondition = type ? `WHERE m.type = ?` : '';
  const typeParam = type && typeMap[type.toLowerCase()] ? [typeMap[type.toLowerCase()]] : [];

  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT m.id, m.title, m.url, m.type, m.thumbnail, m.tags, m.size, m.file_path as filePath,
        m.folder_id as folderId, m.uploaded_by as uploaderId, m.created_at as createdAt, m.updated_at as updatedAt,
        COALESCE(m.featured, 0) as featured,
        f.id as folder_id, f.name as folder_name, f.is_private as folder_isPrivate,
        u.id as uploader_id, u.name as uploader_name, u.email as uploader_email
      FROM media m
      LEFT JOIN folders f ON m.folder_id = f.id
      LEFT JOIN users u ON m.uploaded_by = u.id
      ${typeCondition}
      ORDER BY m.created_at DESC`,
      ...typeParam
    );
    return rows.map(mapMediaRow);
  } catch (error: any) {
    if (error.code === 'P2010' || error.message?.includes("doesn't exist")) {
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT m.id, m.title, m.url, m.type, m.thumbnail, m.tags, m.size, m.file_path as filePath,
          m.folder_id as folderId, m.uploaded_by as uploaderId, m.created_at as createdAt, m.updated_at as updatedAt,
          COALESCE(m.featured, 0) as featured,
          u.id as uploader_id, u.name as uploader_name, u.email as uploader_email
        FROM media m
        LEFT JOIN users u ON m.uploaded_by = u.id
        ${typeCondition}
        ORDER BY m.created_at DESC`,
        ...typeParam
      );
      return rows.map((r) => ({ ...mapMediaRow(r), folder: null }));
    }
    throw error;
  }
}

/** Get featured media items — excludes private folders */
export async function getFeaturedMedia(limit?: number): Promise<MediaWithFolderAndUploader[]> {
  const limitClause = limit ? `LIMIT ${limit}` : '';

  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT m.id, m.title, m.url, m.type, m.thumbnail, m.tags, m.size, m.file_path as filePath,
        m.folder_id as folderId, m.uploaded_by as uploaderId, m.created_at as createdAt, m.updated_at as updatedAt,
        COALESCE(m.featured, 0) as featured,
        f.id as folder_id, f.name as folder_name, f.is_private as folder_isPrivate,
        u.id as uploader_id, u.name as uploader_name, u.email as uploader_email
      FROM media m
      LEFT JOIN folders f ON m.folder_id = f.id
      LEFT JOIN users u ON m.uploaded_by = u.id
      WHERE COALESCE(m.featured, 0) = 1
      ORDER BY m.created_at DESC
      ${limitClause}`
    );
    return rows.map(mapMediaRow).filter((item) => !item.folder || !item.folder.isPrivate);
  } catch (error: any) {
    if (error.code === 'P2010' || error.message?.includes("doesn't exist")) {
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT m.id, m.title, m.url, m.type, m.thumbnail, m.tags, m.size, m.file_path as filePath,
          m.folder_id as folderId, m.uploaded_by as uploaderId, m.created_at as createdAt, m.updated_at as updatedAt,
          COALESCE(m.featured, 0) as featured,
          u.id as uploader_id, u.name as uploader_name, u.email as uploader_email
        FROM media m
        LEFT JOIN users u ON m.uploaded_by = u.id
        WHERE COALESCE(m.featured, 0) = 1
        ORDER BY m.created_at DESC
        ${limitClause}`
      );
      return rows.map((r) => ({ ...mapMediaRow(r), folder: null }));
    }
    throw error;
  }
}

export async function getMediaById(id: string): Promise<MediaWithFolderAndUploader | null> {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT m.id, m.title, m.url, m.type, m.thumbnail, m.tags, m.size, m.file_path as filePath,
        m.folder_id as folderId, m.uploaded_by as uploaderId, m.created_at as createdAt, m.updated_at as updatedAt,
        COALESCE(m.featured, 0) as featured,
        f.id as folder_id, f.name as folder_name, f.is_private as folder_isPrivate,
        u.id as uploader_id, u.name as uploader_name, u.email as uploader_email
      FROM media m
      LEFT JOIN folders f ON m.folder_id = f.id
      LEFT JOIN users u ON m.uploaded_by = u.id
      WHERE m.id = ? LIMIT 1`,
      id
    );
    return rows.length > 0 ? mapMediaRow(rows[0]) : null;
  } catch (error: any) {
    if (error.code === 'P2010' || error.message?.includes("doesn't exist")) {
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT m.id, m.title, m.url, m.type, m.thumbnail, m.tags, m.size, m.file_path as filePath,
          m.folder_id as folderId, m.uploaded_by as uploaderId, m.created_at as createdAt, m.updated_at as updatedAt,
          COALESCE(m.featured, 0) as featured,
          u.id as uploader_id, u.name as uploader_name, u.email as uploader_email
        FROM media m
        LEFT JOIN users u ON m.uploaded_by = u.id
        WHERE m.id = ? LIMIT 1`,
        id
      );
      return rows.length > 0 ? { ...mapMediaRow(rows[0]), folder: null } : null;
    }
    throw error;
  }
}
