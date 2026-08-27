import { prisma } from '@/lib/prisma';
import { isRegistrationOpen, registrationClosedMessage } from '@/lib/registration';
import { registrationWindow, resolvePublicRegistrationSettings, siteSettingsService } from '@/features/settings';

const openStatuses = ['REGISTRATION', 'SCHEDULED', 'ACTIVE', 'PLAYOFFS'] as const;

async function getActiveSeason() {
  return prisma.season.findFirst({ where: { active: true }, orderBy: { startDate: 'desc' }, select: { id: true, name: true, registrationOpensAt: true, registrationClosesAt: true } });
}

export async function listTeamSeasonRegistrationOptions(teamId: string) {
  const registrationSettings = resolvePublicRegistrationSettings(await siteSettingsService.list('registration'));
  const globalWindow = registrationWindow(registrationSettings);
  if (!globalWindow.open) return { options: [], registrationClosed: true, closedMessage: registrationSettings.closedBody, activeSeason: null, history: await getTeamRegistrationHistory(teamId) };
  const activeSeason = await getActiveSeason();
  if (!activeSeason) return { options: [], registrationClosed: false, closedMessage: null, activeSeason: null, history: await getTeamRegistrationHistory(teamId) };
  const [editions, existingTeams, pendingApplications] = await Promise.all([
    prisma.leagueSeason.findMany({
      where: { seasonId: activeSeason.id, status: { in: [...openStatuses] } },
      select: { id: true, status: true, registrationOpensAt: true, registrationClosesAt: true, league: { select: { name: true, registrationOpen: true, registrationOpensAt: true, registrationClosesAt: true } }, season: { select: { id: true, name: true, registrationOpensAt: true, registrationClosesAt: true } } },
      orderBy: [{ season: { startDate: 'desc' } }, { league: { name: 'asc' } }],
    }),
    prisma.seasonTeam.findMany({ where: { teamId }, select: { leagueSeasonId: true } }),
    prisma.seasonRegistrationApplication.findMany({ where: { teamId, status: { in: ['PENDING', 'OWNERSHIP_VERIFICATION'] } }, select: { leagueSeasonId: true } }),
  ]);
  const registered = new Set([...existingTeams, ...pendingApplications].map((row) => row.leagueSeasonId));
  const unregistered = editions.filter((edition) => !registered.has(edition.id));
  const options = unregistered.filter((edition) => isRegistrationOpen(edition.league, edition.season).open);
  const closedOptions = unregistered.filter((edition) => !isRegistrationOpen(edition.league, edition.season).open);
  return { activeSeason: { id: activeSeason.id, name: activeSeason.name }, options: options.map((edition) => ({
    id: edition.id,
    seasonId: edition.season.id,
    seasonName: edition.season.name,
    leagueName: edition.league.name,
    status: edition.status,
    registrationOpensAt: edition.registrationOpensAt,
    registrationClosesAt: edition.registrationClosesAt,
  })), registrationClosed: options.length === 0 && closedOptions.length > 0, closedMessage: closedOptions.length > 0 ? registrationClosedMessage(isRegistrationOpen(closedOptions[0].league, closedOptions[0].season)) : null, history: await getTeamRegistrationHistory(teamId) };
}

async function getTeamRegistrationHistory(teamId: string) {
  const [applications, seasonTeams] = await Promise.all([
    prisma.seasonRegistrationApplication.findMany({ where: { teamId }, select: { id: true, status: true, createdAt: true, leagueSeason: { select: { id: true, league: { select: { name: true } }, season: { select: { name: true } } } } }, orderBy: { createdAt: 'desc' } }),
    prisma.seasonTeam.findMany({ where: { teamId }, select: { id: true, createdAt: true, leagueSeason: { select: { id: true, league: { select: { name: true } }, season: { select: { name: true } } } } } }),
  ]);
  const applicationEditions = new Set(applications.map((row) => row.leagueSeason.id));
  return [...applications.map((row) => ({ id: row.id, seasonName: row.leagueSeason.season.name, leagueName: row.leagueSeason.league.name, status: row.status, date: row.createdAt })), ...seasonTeams.filter((row) => !applicationEditions.has(row.leagueSeason.id)).map((row) => ({ id: row.id, seasonName: row.leagueSeason.season.name, leagueName: row.leagueSeason.league.name, status: 'APPROVED' as const, date: row.createdAt }))].sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function submitTeamSeasonRegistration(input: { teamId: string; teamName: string; leagueSeasonId: string; applicantName: string; applicantEmail: string; notes?: string }) {
  const registrationSettings = resolvePublicRegistrationSettings(await siteSettingsService.list('registration'));
  const globalWindow = registrationWindow(registrationSettings);
  if (!globalWindow.open) throw new Error(registrationSettings.closedBody);
  const activeSeason = await getActiveSeason();
  const edition = activeSeason ? await prisma.leagueSeason.findFirst({ where: { id: input.leagueSeasonId, seasonId: activeSeason.id, status: { in: [...openStatuses] } }, select: { id: true, seasonId: true, leagueId: true, registrationOpensAt: true, registrationClosesAt: true, season: { select: { name: true, registrationOpensAt: true, registrationClosesAt: true } }, league: { select: { name: true, registrationOpen: true, registrationOpensAt: true, registrationClosesAt: true } } } }) : null;
  if (!edition) throw new Error('That season registration window is no longer available.');
  const registrationStatus = isRegistrationOpen(edition.league, edition.season);
  if (!registrationStatus.open) throw new Error(registrationClosedMessage(registrationStatus));

  const existing = await prisma.seasonTeam.findUnique({ where: { leagueSeasonId_teamId: { leagueSeasonId: edition.id, teamId: input.teamId } }, select: { id: true } });
  if (existing) throw new Error('This team is already registered for that season.');
  const pending = await prisma.seasonRegistrationApplication.findFirst({ where: { leagueSeasonId: edition.id, teamId: input.teamId, status: { in: ['PENDING', 'OWNERSHIP_VERIFICATION'] } }, select: { id: true } });
  if (pending) throw new Error('This team already has a registration awaiting review for that season.');

  const application = await prisma.seasonRegistrationApplication.create({ data: { leagueSeasonId: edition.id, teamId: input.teamId, requestedTeamName: input.teamName, type: 'RETURNING_TEAM', status: 'PENDING', applicantName: input.applicantName, applicantEmail: input.applicantEmail, notes: input.notes } });
  await prisma.registrationNotification.create({ data: { type: 'TEAM_REGISTERED', teamId: input.teamId, message: `${input.teamName} requested registration for ${edition.season.name} · ${edition.league.name}`, metadata: { applicationId: application.id, leagueSeasonId: edition.id, type: 'RETURNING_TEAM' } } });
  return { id: application.id, status: application.status, seasonName: edition.season.name, leagueName: edition.league.name };
}
