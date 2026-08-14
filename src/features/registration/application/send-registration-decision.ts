import { prisma } from '../../../lib/prisma';
import { sendPlayerApprovedEmail, sendRegistrationRejectedEmail, sendTeamApprovedEmail } from '../../../lib/email';

export async function notifyTeamRegistrationDecision(teamId: string, approved: boolean): Promise<void> {
  const db = prisma as any;
  const [team, application, coaches] = await Promise.all([
    db.team.findUnique({ where: { id: teamId }, select: { id: true, name: true, contactEmail: true } }),
    db.seasonRegistrationApplication.findFirst({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      include: { leagueSeason: { include: { league: true, season: true } } },
    }),
    db.teamStaff.findMany({ where: { teamId, role: 'COACH' }, include: { staff: true } }),
  ]);
  if (!team) return;
  const recipients = new Map<string, string>();
  if (team.contactEmail) recipients.set(team.contactEmail.trim().toLowerCase(), application?.applicantName || team.name);
  if (application?.applicantEmail) recipients.set(application.applicantEmail.trim().toLowerCase(), application.applicantName || team.name);
  for (const relation of coaches) {
    if (relation.staff?.email) recipients.set(relation.staff.email.trim().toLowerCase(), `${relation.staff.firstName} ${relation.staff.lastName}`.trim());
  }
  const tasks = [...recipients].map(([email, name]) => approved
    ? sendTeamApprovedEmail({ coachName: name, email, teamName: team.name })
    : sendRegistrationRejectedEmail({
        name, email, teamName: team.name,
        leagueName: application?.leagueSeason?.league?.name,
        seasonName: application?.leagueSeason?.season?.name,
        applicationId: application?.id,
        status: 'rejected',
      }));
  const results = await Promise.allSettled(tasks);
  const failure = results.find((result) => result.status === 'rejected');
  if (failure?.status === 'rejected') throw failure.reason;
}

export async function notifyPlayerRegistrationDecision(playerId: string, approved: boolean): Promise<void> {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { id: true, firstName: true, lastName: true, email: true, team: { select: { name: true } } },
  });
  if (!player?.email) return;
  const name = `${player.firstName} ${player.lastName}`.trim();
  if (approved) {
    await sendPlayerApprovedEmail({ name, email: player.email, teamName: player.team?.name });
    return;
  }
  await sendRegistrationRejectedEmail({
    name,
    email: player.email,
    teamName: player.team?.name || 'your player registration',
    applicationId: player.id,
    status: 'rejected',
  });
}
