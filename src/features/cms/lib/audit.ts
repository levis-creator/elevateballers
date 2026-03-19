import { getUserIdFromRequest, writeAuditLog } from './auth';

export async function logAudit(
  request: Request,
  action: string,
  metadata?: Record<string, unknown>,
  targetUserId?: string,
  source: 'explicit' | 'middleware' | 'legacy' = 'explicit'
): Promise<void> {
  const actorId = getUserIdFromRequest(request) ?? 'anonymous';
  const userId = targetUserId ?? actorId;
  const nextMetadata = { ...(metadata ?? {}), source };
  await writeAuditLog(userId, action, actorId, nextMetadata).catch(() => {});
}

export async function logAuditSystem(
  action: string,
  metadata?: Record<string, unknown>,
  targetUserId: string = 'system'
): Promise<void> {
  const nextMetadata = { ...(metadata ?? {}), source: 'system' };
  await writeAuditLog(targetUserId, action, 'system', nextMetadata).catch(() => {});
}
