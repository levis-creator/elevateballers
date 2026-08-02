import { createHash } from 'node:crypto';
import { prisma } from '../../../../lib/prisma';
import { createPlayer } from '../../../cms/lib/mutations';
import { createStaff, createTeam, assignStaffToTeam } from '../../../cms/lib/mutations';

const EXPIRY_DAYS = 30;

function emailHash(email: string): string { return createHash('sha256').update(email).digest('hex'); }
function expiresAt(): Date { const date = new Date(); date.setDate(date.getDate() + EXPIRY_DAYS); return date; }

export type TeamSubmissionInput = {
  idempotencyKey: string;
  name: string;
  coachName: string;
  contactEmail: string;
  contactPhone: string;
  leagueId?: string;
  additionalInfo?: string;
  leagueName?: string;
  requireApproval: boolean;
  entryFee: number;
};

export type PlayerSubmissionInput = {
  idempotencyKey: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  jerseyNumber?: number;
  height?: string;
  weight?: string;
  teamName?: string;
  teamId?: string;
  additionalInfo?: string;
  requireApproval: boolean;
  entryFee: number;
};

export async function findSubmission(idempotencyKey: string): Promise<any | null> {
  return (prisma as any).publicRegistrationSubmission.findUnique({ where: { idempotencyKey } });
}

export async function submitTeamRegistration(input: TeamSubmissionInput): Promise<{ response: Record<string, unknown>; jobIds: string[]; teamId: string }> {
  return prisma.$transaction(async (tx) => {
    const db = tx as any;
    const description = [input.leagueName && `League: ${input.leagueName}`, `Coach: ${input.coachName}`, input.additionalInfo && `Additional Info: ${input.additionalInfo}`].filter(Boolean).join('\n');
    const team = await createTeam({ name: input.name, description: description || undefined, approved: !input.requireApproval }, db);
    const parts = input.coachName.trim().split(/\s+/);
    const coachStaff = await createStaff({ firstName: parts[0], lastName: parts.slice(1).join(' ') || parts[0], email: input.contactEmail, phone: input.contactPhone, role: 'COACH', bio: input.additionalInfo || undefined, approved: !input.requireApproval }, db);
    const assignment = await db.teamStaff.findUnique({ where: { teamId_staffId: { teamId: team.id, staffId: coachStaff.id } } });
    if (!assignment) await assignStaffToTeam({ teamId: team.id, staffId: coachStaff.id, role: 'COACH' }, db);

    const playersToLink = await db.player.findMany({ where: { teamId: null, OR: [{ bio: { contains: `Team: ${team.name}` } }, { bio: { contains: team.name } }] }, select: { id: true, firstName: true, lastName: true } });
    if (playersToLink.length) {
      await db.player.updateMany({ where: { id: { in: playersToLink.map((player: any) => player.id) } }, data: { teamId: team.id } });
      for (const player of playersToLink) await db.registrationNotification.create({ data: { type: 'PLAYER_AUTO_LINKED', playerId: player.id, teamId: team.id, message: `Player ${player.firstName} ${player.lastName} was automatically linked to team ${team.name}`, metadata: { playerName: `${player.firstName} ${player.lastName}`, teamName: team.name } } });
    }

    await db.registrationNotification.create({ data: { type: 'TEAM_REGISTERED', teamId: team.id, staffId: coachStaff.id, message: `New team registration: ${team.name} (Coach: ${input.coachName})`, metadata: { teamName: team.name, coachName: input.coachName, leagueName: input.leagueName ?? null, linkedPlayersCount: playersToLink.length, entryFee: input.entryFee, approvalRequired: input.requireApproval } } });
    const response = { success: true, message: 'Team registration submitted successfully', entityId: team.id, status: input.requireApproval ? 'pending' : 'approved', entryFee: input.entryFee };
    const submission = await db.publicRegistrationSubmission.create({ data: { idempotencyKey: input.idempotencyKey, kind: 'TEAM', emailHash: emailHash(input.contactEmail), entityId: team.id, response, expiresAt: expiresAt() } });
    const jobs = await Promise.all([
      db.publicRegistrationEmailJob.create({ data: { submissionKey: submission.idempotencyKey, jobType: 'team_registration_auto_reply', payload: { jobType: 'team_registration_auto_reply', data: { coachName: input.coachName, email: input.contactEmail, teamName: team.name, leagueName: input.leagueName ?? null } } } }),
      db.publicRegistrationEmailJob.create({ data: { submissionKey: submission.idempotencyKey, jobType: 'team_registration_admin_notification', payload: { jobType: 'admin_notification', data: { type: 'team_registered', title: 'New Team Registration', message: `${team.name} was submitted by ${input.coachName}.`, actionUrl: `${process.env.SITE_URL || 'https://elevateballers.com'}/admin/teams/${team.id}`, actionText: 'Review Team' } } } }),
    ]);
    return { response, jobIds: jobs.map((job: any) => job.id), teamId: team.id };
  });
}

export async function submitPlayerRegistration(input: PlayerSubmissionInput): Promise<{ response: Record<string, unknown>; jobIds: string[]; playerId: string }> {
  return prisma.$transaction(async (tx) => {
    const db = tx as any;
    const bio = input.additionalInfo ? `Additional Info: ${input.additionalInfo}` : undefined;
    const player = await createPlayer({ firstName: input.firstName, lastName: input.lastName, email: input.email, phone: input.phone, height: input.height, weight: input.weight, position: input.position, jerseyNumber: input.jerseyNumber, teamId: input.teamId, bio, approved: !input.requireApproval }, db);
    await db.registrationNotification.create({ data: { type: 'PLAYER_REGISTERED', playerId: player.id, teamId: input.teamId || undefined, message: `New player registration: ${input.firstName} ${input.lastName}${input.teamId ? ` (Team: ${input.teamName})` : ''}`, metadata: { playerName: `${input.firstName} ${input.lastName}`, teamName: input.teamName || null, teamLinked: !!input.teamId, entryFee: input.entryFee, approvalRequired: input.requireApproval } } });
    const response = { success: true, message: 'Player registration submitted successfully', entityId: player.id, status: input.requireApproval ? 'pending' : 'approved', entryFee: input.entryFee };
    const submission = await db.publicRegistrationSubmission.create({ data: { idempotencyKey: input.idempotencyKey, kind: 'PLAYER', emailHash: emailHash(input.email), entityId: player.id, response, expiresAt: expiresAt() } });
    const jobs = await Promise.all([
      db.publicRegistrationEmailJob.create({ data: { submissionKey: submission.idempotencyKey, jobType: 'player_registration_auto_reply', payload: { jobType: 'player_registration_auto_reply', data: { name: `${input.firstName} ${input.lastName}`.trim(), email: input.email, teamName: input.teamName || null } } } }),
      db.publicRegistrationEmailJob.create({ data: { submissionKey: submission.idempotencyKey, jobType: 'player_registration_admin_notification', payload: { jobType: 'admin_notification', data: { type: 'player_registered', title: 'New Player Registration', message: `${input.firstName} ${input.lastName} submitted a player registration.`, actionUrl: `${process.env.SITE_URL || 'https://elevateballers.com'}/admin/players/${player.id}`, actionText: 'Review Player' } } } }),
    ]);
    return { response, jobIds: jobs.map((job: any) => job.id), playerId: player.id };
  });
}
