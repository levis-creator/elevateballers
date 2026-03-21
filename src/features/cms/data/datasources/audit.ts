import { getUserIdFromRequest, writeAuditLog } from '../../domain/usecases/auth';

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
  await writeAuditLog(userId, action, actorId, nextMetadata).catch((err: unknown) => {
    console.error('[audit] Failed to write audit log:', { action, userId, actorId, err });
  });
}

export async function logAuditSystem(
  action: string,
  metadata?: Record<string, unknown>,
  targetUserId: string = 'system'
): Promise<void> {
  const nextMetadata = { ...(metadata ?? {}), source: 'system' };
  await writeAuditLog(targetUserId, action, 'system', nextMetadata).catch((err: unknown) => {
    console.error('[audit] Failed to write system audit log:', { action, targetUserId, err });
  });
}
