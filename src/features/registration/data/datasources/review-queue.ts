import { prisma } from '../../../../lib/prisma';

export async function getRegistrationReviewQueue(input: { page: number; limit: number; kind?: string; status?: string; search?: string }) {
  const db = prisma as any;
  const playerWhere: any = { ...(input.status ? { approved: input.status === 'APPROVED' } : {}), ...(input.search ? { OR: [{ firstName: { contains: input.search } }, { lastName: { contains: input.search } }, { email: { contains: input.search } }] } : {}) };
  const teamWhere: any = { ...(input.status ? { approved: input.status === 'APPROVED' } : {}), ...(input.search ? { OR: [{ name: { contains: input.search } }, { contactEmail: { contains: input.search } }] } : {}) };
  const includePlayers = !input.kind || input.kind === 'PLAYER';
  const includeTeams = !input.kind || input.kind === 'TEAM';
  const [players, teams, playerTotal, teamTotal] = await Promise.all([
    includePlayers ? db.player.findMany({ where: playerWhere, orderBy: { createdAt: 'desc' }, skip: (input.page - 1) * input.limit, take: input.limit, include: { team: true } }) : [],
    includeTeams ? db.team.findMany({ where: teamWhere, orderBy: { createdAt: 'desc' }, skip: (input.page - 1) * input.limit, take: input.limit }) : [],
    includePlayers ? db.player.count({ where: playerWhere }) : 0,
    includeTeams ? db.team.count({ where: teamWhere }) : 0,
  ]);
  const duplicates = await db.player.findMany({ where: { OR: [{ email: { not: null } }, { firstName: { not: null }, lastName: { not: null } }] }, select: { id: true, firstName: true, lastName: true, email: true } });
  const duplicateKeys = new Map<string, string[]>();
  for (const player of duplicates) { const key = player.email?.toLowerCase() || `${player.firstName?.toLowerCase()}::${player.lastName?.toLowerCase()}`; if (key) duplicateKeys.set(key, [...(duplicateKeys.get(key) || []), player.id]); }
  return { players, teams, duplicates: [...duplicateKeys.entries()].filter(([, ids]) => ids.length > 1).map(([key, ids]) => ({ key, ids })), page: input.page, limit: input.limit, total: playerTotal + teamTotal, totalPages: Math.max(1, Math.ceil((playerTotal + teamTotal) / input.limit)) };
}

export async function bulkReviewRegistrations(input: { kind: 'PLAYER' | 'TEAM'; ids: string[]; action: 'APPROVE' | 'REJECT' }) {
  const db = prisma as any;
  const approved = input.action === 'APPROVE';
  if (input.kind === 'PLAYER') return db.player.updateMany({ where: { id: { in: input.ids } }, data: { approved } });
  return db.team.updateMany({ where: { id: { in: input.ids } }, data: { approved } });
}
