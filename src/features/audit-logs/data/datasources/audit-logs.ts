import type { AuditActionCount, AuditLogEntry } from '../../domain/usecases/audit-log-view';

export interface AuditLogQuery {
  limit?: number;
  search?: string;
  metadataSearch?: string;
  action?: string;
  from?: string;
  to?: string;
  cursorCreatedAt?: string;
  cursorId?: string;
}

export interface AuditLogPage {
  logs: AuditLogEntry[];
  total: number;
  nextCursor: { createdAt: string; id: string } | null;
}

function buildParams(query: AuditLogQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.limit) params.set('limit', String(query.limit));
  if (query.search) params.set('search', query.search);
  if (query.metadataSearch) params.set('metadataSearch', query.metadataSearch);
  if (query.action) params.set('action', query.action);
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.cursorCreatedAt && query.cursorId) {
    params.set('cursorCreatedAt', query.cursorCreatedAt);
    params.set('cursorId', query.cursorId);
  }
  return params;
}

export async function fetchAuditLogs(query: AuditLogQuery): Promise<AuditLogPage> {
  const res = await fetch(`/api/audit-logs?${buildParams(query).toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || 'Failed to fetch audit logs');
  }
  const data = await res.json();
  return {
    logs: Array.isArray(data.logs) ? data.logs : [],
    total: typeof data.total === 'number' ? data.total : 0,
    nextCursor: data.nextCursor ?? null,
  };
}

export async function fetchAuditActions(): Promise<AuditActionCount[]> {
  const res = await fetch('/api/audit-logs/actions');
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.actions) ? data.actions : [];
}

export function buildAuditExportUrl(query: AuditLogQuery, format: 'csv' | 'json'): string {
  const params = buildParams(query);
  params.set('format', format);
  return `/api/audit-logs/export?${params.toString()}`;
}
