import { prisma } from '../../../../lib/prisma';
import type { CreateMediaInput, MediaEntity, MediaType, UpdateMediaInput } from '../../domain/entities';

type MediaRow = Record<string, any>;

function mapRow(row: MediaRow): MediaEntity {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    type: row.type as MediaType,
    thumbnail: row.thumbnail ?? null,
    tags: Array.isArray(row.tags) ? row.tags : [],
    size: row.size == null ? null : Number(row.size),
    filePath: row.filePath ?? row.file_path ?? null,
    folderId: row.folderId ?? row.folder_id ?? null,
    uploaderId: row.uploaderId ?? row.uploaded_by ?? null,
    createdAt: new Date(row.createdAt ?? row.created_at),
    updatedAt: new Date(row.updatedAt ?? row.updated_at),
    featured: Boolean(row.featured),
    isPrivate: Boolean(row.isPrivate ?? row.is_private ?? row.folder_isPrivate ?? row.folder_is_private),
    folder: row.folder_id
      ? { id: row.folder_id, name: row.folder_name ?? '', isPrivate: Boolean(row.folder_isPrivate ?? row.folder_is_private) }
      : null,
    uploader: row.uploader_id
      ? { id: row.uploader_id, name: row.uploader_name ?? '', email: row.uploader_email ?? '' }
      : null,
  };
}

const select = `
  SELECT m.id, m.title, m.url, m.type, m.thumbnail, m.tags, m.size,
    m.file_path as filePath, m.folder_id as folderId, m.uploaded_by as uploaderId,
    m.created_at as createdAt, m.updated_at as updatedAt,
    COALESCE(m.featured, 0) as featured, COALESCE(m.is_private, 0) as isPrivate,
    f.id as folder_id, f.name as folder_name, f.is_private as folder_isPrivate,
    u.id as uploader_id, u.name as uploader_name, u.email as uploader_email
  FROM media m
  LEFT JOIN folders f ON m.folder_id = f.id
  LEFT JOIN users u ON m.uploaded_by = u.id`;

export async function listMedia(options: { type?: MediaType; folderId?: string } = {}): Promise<MediaEntity[]> {
  const conditions: string[] = [];
  const params: string[] = [];
  if (options.type) {
    conditions.push('m.type = ?');
    params.push(options.type);
  }
  if (options.folderId) {
    conditions.push('m.folder_id = ?');
    params.push(options.folderId);
  }
  const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
  const rows = await prisma.$queryRawUnsafe<MediaRow[]>(`${select}${where} ORDER BY m.created_at DESC`, ...params);
  return rows.map(mapRow);
}

export async function listFeaturedMedia(limit?: number): Promise<MediaEntity[]> {
  const safeLimit = limit == null ? undefined : Math.min(Math.max(Math.trunc(limit), 1), 100);
  const limitClause = safeLimit === undefined ? '' : ` LIMIT ${safeLimit}`;
  const rows = await prisma.$queryRawUnsafe<MediaRow[]>(
    `${select} WHERE COALESCE(m.featured, 0) = 1 AND COALESCE(m.is_private, f.is_private, 0) = 0 ORDER BY m.created_at DESC${limitClause}`
  );
  return rows.map(mapRow);
}

export async function getMediaById(id: string): Promise<MediaEntity | null> {
  const rows = await prisma.$queryRawUnsafe<MediaRow[]>(`${select} WHERE m.id = ? LIMIT 1`, id);
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function createMedia(input: CreateMediaInput): Promise<MediaEntity> {
  const media = await prisma.media.create({ data: input as any });
  const rows = await prisma.$queryRawUnsafe<MediaRow[]>(`${select} WHERE m.id = ? LIMIT 1`, media.id);
  return mapRow(rows[0]);
}

export async function updateMedia(id: string, input: UpdateMediaInput): Promise<MediaEntity | null> {
  try {
    await prisma.media.update({ where: { id }, data: input as any });
    const rows = await prisma.$queryRawUnsafe<MediaRow[]>(`${select} WHERE m.id = ? LIMIT 1`, id);
    return rows[0] ? mapRow(rows[0]) : null;
  } catch {
    return null;
  }
}
