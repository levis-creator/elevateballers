import { prisma } from '../../../../lib/prisma';
import type {
  CreateMediaInput,
  MediaEntity,
  MediaLibraryQuery,
  MediaLibraryResult,
  MediaLibraryRow,
  MediaStats,
  MediaType,
  UpdateMediaInput,
} from '../../domain/entities';

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
    isPrivate: Boolean(
      row.isPrivate ?? row.is_private ?? row.folder_isPrivate ?? row.folder_is_private
    ),
    folder: row.folder_id
      ? {
          id: row.folder_id,
          name: row.folder_name ?? '',
          isPrivate: Boolean(row.folder_isPrivate ?? row.folder_is_private),
        }
      : null,
    uploader: row.uploader_id
      ? { id: row.uploader_id, name: row.uploader_name ?? '', email: row.uploader_email ?? '' }
      : null,
  };
}

function mapLibraryRow(row: MediaRow): MediaLibraryRow {
  const base = mapRow(row);
  const fileName =
    String(base.filePath || base.url)
      .split('/')
      .pop() || base.title;
  return {
    ...base,
    fileName,
    thumbUrl: base.thumbnail || base.url,
    mime: row.mime ?? row.mimeType ?? row.mime_type ?? null,
    originalSize: row.originalSize == null ? null : Number(row.originalSize),
    folderName: row.folder_name ?? null,
    folderPrivate: Boolean(row.folder_is_private),
    uploaderName: row.uploader_name ?? null,
    storage: String(base.url).includes('supabase') ? 'supabase' : 'r2',
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

export async function listMedia(
  options: { type?: MediaType; folderId?: string } = {}
): Promise<MediaEntity[]> {
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
  const rows = await prisma.$queryRawUnsafe<MediaRow[]>(
    `${select}${where} ORDER BY m.created_at DESC`,
    ...params
  );
  return rows.map(mapRow);
}

export async function listMediaPage(options: MediaLibraryQuery = {}): Promise<MediaLibraryResult> {
  const page = Math.max(1, Math.trunc(options.page || 1));
  const limit = Math.min(100, Math.max(1, Math.trunc(options.limit || 24)));
  const conditions: string[] = [];
  const params: (string | number)[] = [];
  if (options.type) {
    conditions.push('m.type = ?');
    params.push(options.type);
  }
  if (options.folderId) {
    conditions.push('m.folder_id = ?');
    params.push(options.folderId);
  }
  if (options.storage) {
    conditions.push(options.storage === 'supabase' ? 'm.url LIKE ?' : 'm.url NOT LIKE ?');
    params.push('%supabase%');
  }
  if (options.q?.trim()) {
    const term = `%${options.q.trim()}%`;
    conditions.push(
      '(m.title LIKE ? OR m.url LIKE ? OR m.file_path LIKE ? OR CAST(m.tags AS CHAR) LIKE ?)'
    );
    params.push(term, term, term, term);
  }
  const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
  const sortMap: Record<string, string> = {
    createdAt: 'm.created_at',
    name: 'm.title',
    size: 'm.size',
    type: 'm.type',
  };
  const sort = sortMap[options.sort || 'createdAt'] || sortMap.createdAt;
  const dir = options.dir === 'asc' ? 'ASC' : 'DESC';
  const offset = (page - 1) * limit;
  const from = `FROM media m LEFT JOIN folders f ON m.folder_id = f.id LEFT JOIN users u ON m.uploaded_by = u.id`;
  const select = `SELECT m.id, m.title, m.url, m.type, m.thumbnail, m.tags, m.size, m.original_size as originalSize, m.mime_type as mime, m.file_path as filePath, m.folder_id as folderId, m.uploaded_by as uploaderId, m.created_at as createdAt, m.updated_at as updatedAt, COALESCE(m.featured, 0) as featured, COALESCE(m.is_private, 0) as isPrivate, f.id as folder_id, f.name as folder_name, f.is_private as folder_is_private, u.id as uploader_id, u.name as uploader_name, u.email as uploader_email`;
  const countRows = await prisma.$queryRawUnsafe<Array<{ total: number }>>(
    `SELECT COUNT(*) as total ${from}${where}`,
    ...params
  );
  const rows = await prisma.$queryRawUnsafe<MediaRow[]>(
    `${select} ${from}${where} ORDER BY ${sort} ${dir}, m.id DESC LIMIT ? OFFSET ?`,
    ...params,
    limit,
    offset
  );
  const total = Number(countRows[0]?.total || 0);
  return {
    items: rows.map(mapLibraryRow),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getMediaStats(
  options: Pick<MediaLibraryQuery, 'folderId' | 'type' | 'storage' | 'q'> = {}
): Promise<MediaStats> {
  const result = await listMediaPage({ ...options, page: 1, limit: 1 });
  const conditions: string[] = [];
  const params: string[] = [];
  if (options.folderId) {
    conditions.push('m.folder_id = ?');
    params.push(options.folderId);
  }
  if (options.type) {
    conditions.push('m.type = ?');
    params.push(options.type);
  }
  if (options.storage) {
    conditions.push(options.storage === 'supabase' ? 'm.url LIKE ?' : 'm.url NOT LIKE ?');
    params.push('%supabase%');
  }
  if (options.q?.trim()) {
    const term = `%${options.q.trim()}%`;
    conditions.push(
      '(m.title LIKE ? OR m.url LIKE ? OR m.file_path LIKE ? OR CAST(m.tags AS CHAR) LIKE ?)'
    );
    params.push(term, term, term, term);
  }
  const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
  const rows = await prisma.$queryRawUnsafe<
    Array<{ bytes: number; legacyCount: number; untagged: number }>
  >(
    `SELECT COALESCE(SUM(m.size), 0) as bytes, SUM(CASE WHEN m.url LIKE '%supabase%' THEN 1 ELSE 0 END) as legacyCount, SUM(CASE WHEN m.tags IS NULL OR CAST(m.tags AS CHAR) IN ('[]', '') THEN 1 ELSE 0 END) as untagged FROM media m${where}`,
    ...params
  );
  return {
    count: result.total,
    bytes: Number(rows[0]?.bytes || 0),
    legacyCount: Number(rows[0]?.legacyCount || 0),
    untagged: Number(rows[0]?.untagged || 0),
  };
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
  const rows = await prisma.$queryRawUnsafe<MediaRow[]>(
    `${select} WHERE m.id = ? LIMIT 1`,
    media.id
  );
  return mapRow(rows[0]);
}

export async function updateMedia(
  id: string,
  input: UpdateMediaInput
): Promise<MediaEntity | null> {
  try {
    await prisma.media.update({ where: { id }, data: input as any });
    const rows = await prisma.$queryRawUnsafe<MediaRow[]>(`${select} WHERE m.id = ? LIMIT 1`, id);
    return rows[0] ? mapRow(rows[0]) : null;
  } catch {
    return null;
  }
}
