import { prisma } from '@/lib/prisma';
import { isRegistrationOpen, registrationClosedMessage } from '@/lib/registration';
import {
  registrationWindow,
  resolvePublicRegistrationSettings,
  siteSettingsService,
} from '@/features/settings';

const openStatuses = ['REGISTRATION', 'SCHEDULED', 'ACTIVE', 'PLAYOFFS'] as const;
const adminWindowKeys = new Set(['registration_opens', 'registration_closes']);

async function getActiveSeason() {
  return prisma.season.findFirst({
    where: { active: true },
    orderBy: { startDate: 'desc' },
    select: { id: true, name: true, registrationOpensAt: true, registrationClosesAt: true },
  });
}

function getEffectiveEditionRegistration(
  edition: {
    league: {
      registrationOpen: boolean;
      registrationOpensAt: Date | null;
      registrationClosesAt: Date | null;
    };
    season: { registrationOpensAt: Date | null; registrationClosesAt: Date | null };
  },
  siteMasterOpen: boolean,
  adminWindowOverride: boolean
) {
  // Admin dates override the season when explicitly configured. Otherwise,
  // the active season window remains the source of truth.
  const season = adminWindowOverride ? null : edition.season;
  return isRegistrationOpen(
    siteMasterOpen
      ? { registrationOpen: true, registrationOpensAt: null, registrationClosesAt: null }
      : edition.league,
    season
  );
}

export async function listTeamSeasonRegistrationOptions(teamId: string) {
  const rawRegistrationSettings = await siteSettingsService.list('registration');
  const registrationSettings = resolvePublicRegistrationSettings(rawRegistrationSettings);
  const adminWindowOverride = rawRegistrationSettings.some((setting) =>
    adminWindowKeys.has(setting.key)
  );
  const activeSeason = await getActiveSeason();
  const registrationWindowDisplay = adminWindowOverride
    ? { opensAt: registrationSettings.opens, closesAt: registrationSettings.closes }
    : {
        opensAt: activeSeason?.registrationOpensAt ?? null,
        closesAt: activeSeason?.registrationClosesAt ?? null,
      };
  const globalWindow = registrationWindow(registrationSettings);
  if (!registrationSettings.open || (adminWindowOverride && !globalWindow.open))
    return {
      options: [],
      registrationClosed: true,
      closedMessage: registrationSettings.closedBody,
      activeSeason: activeSeason ? { id: activeSeason.id, name: activeSeason.name } : null,
      registrationWindow: registrationWindowDisplay,
      approvalRequired: registrationSettings.approval,
      history: await getTeamRegistrationHistory(teamId),
    };
  if (!activeSeason)
    return {
      options: [],
      registrationClosed: false,
      closedMessage: null,
      activeSeason: null,
      registrationWindow: registrationWindowDisplay,
      approvalRequired: registrationSettings.approval,
      history: await getTeamRegistrationHistory(teamId),
    };
  const [editions, existingTeams, pendingApplications] = await Promise.all([
    prisma.leagueSeason.findMany({
      where: { seasonId: activeSeason.id, status: { in: [...openStatuses] } },
      select: {
        id: true,
        status: true,
        registrationOpensAt: true,
        registrationClosesAt: true,
        league: {
          select: {
            name: true,
            registrationOpen: true,
            registrationOpensAt: true,
            registrationClosesAt: true,
          },
        },
        season: {
          select: { id: true, name: true, registrationOpensAt: true, registrationClosesAt: true },
        },
      },
      orderBy: [{ season: { startDate: 'desc' } }, { league: { name: 'asc' } }],
    }),
    prisma.seasonTeam.findMany({ where: { teamId }, select: { leagueSeasonId: true } }),
    prisma.seasonRegistrationApplication.findMany({
      where: { teamId, status: { in: ['PENDING', 'OWNERSHIP_VERIFICATION', 'APPROVED'] } },
      select: { leagueSeasonId: true },
    }),
  ]);
  const registered = new Set(
    [...existingTeams, ...pendingApplications].map((row) => row.leagueSeasonId)
  );
  const unregistered = editions.filter((edition) => !registered.has(edition.id));
  // The admin Registration setting is the authoritative master switch. A
  // legacy league-level switch must not hide an edition after an admin opens
  // registration globally; its date windows still apply.
  const options = unregistered.filter(
    (edition) =>
      getEffectiveEditionRegistration(edition, registrationSettings.open, adminWindowOverride).open
  );
  const closedOptions = unregistered.filter(
    (edition) =>
      !getEffectiveEditionRegistration(edition, registrationSettings.open, adminWindowOverride).open
  );
  const firstClosedStatus =
    closedOptions.length > 0
      ? getEffectiveEditionRegistration(
          closedOptions[0],
          registrationSettings.open,
          adminWindowOverride
        )
      : null;
  return {
    activeSeason: { id: activeSeason.id, name: activeSeason.name },
    options: options.map((edition) => ({
      id: edition.id,
      seasonId: edition.season.id,
      seasonName: edition.season.name,
      leagueName: edition.league.name,
      status: edition.status,
      registrationOpensAt: edition.registrationOpensAt,
      registrationClosesAt: edition.registrationClosesAt,
    })),
    registrationClosed: options.length === 0 && closedOptions.length > 0,
    closedMessage: firstClosedStatus ? registrationClosedMessage(firstClosedStatus) : null,
    registrationWindow: registrationWindowDisplay,
    approvalRequired: registrationSettings.approval,
    history: await getTeamRegistrationHistory(teamId),
  };
}

async function getTeamRegistrationHistory(teamId: string) {
  const [applications, seasonTeams] = await Promise.all([
    prisma.seasonRegistrationApplication.findMany({
      where: { teamId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        leagueSeason: {
          select: {
            id: true,
            league: { select: { name: true } },
            season: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.seasonTeam.findMany({
      where: { teamId },
      select: {
        id: true,
        createdAt: true,
        leagueSeason: {
          select: {
            id: true,
            league: { select: { name: true } },
            season: { select: { name: true } },
          },
        },
      },
    }),
  ]);
  const applicationEditions = new Set(applications.map((row) => row.leagueSeason.id));
  return [
    ...applications.map((row) => ({
      id: row.id,
      seasonName: row.leagueSeason.season.name,
      leagueName: row.leagueSeason.league.name,
      status: row.status,
      date: row.createdAt,
    })),
    ...seasonTeams
      .filter((row) => !applicationEditions.has(row.leagueSeason.id))
      .map((row) => ({
        id: row.id,
        seasonName: row.leagueSeason.season.name,
        leagueName: row.leagueSeason.league.name,
        status: 'APPROVED' as const,
        date: row.createdAt,
      })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function submitTeamSeasonRegistration(input: {
  teamId: string;
  teamName: string;
  leagueSeasonId: string;
  applicantName: string;
  applicantEmail: string;
  notes?: string;
}) {
  const rawRegistrationSettings = await siteSettingsService.list('registration');
  const registrationSettings = resolvePublicRegistrationSettings(rawRegistrationSettings);
  const adminWindowOverride = rawRegistrationSettings.some((setting) =>
    adminWindowKeys.has(setting.key)
  );
  const globalWindow = registrationWindow(registrationSettings);
  if (!registrationSettings.open || (adminWindowOverride && !globalWindow.open))
    throw new Error(registrationSettings.closedBody);
  const activeSeason = await getActiveSeason();
  const edition = activeSeason
    ? await prisma.leagueSeason.findFirst({
        where: {
          id: input.leagueSeasonId,
          seasonId: activeSeason.id,
          status: { in: [...openStatuses] },
        },
        select: {
          id: true,
          seasonId: true,
          leagueId: true,
          registrationOpensAt: true,
          registrationClosesAt: true,
          season: { select: { name: true, registrationOpensAt: true, registrationClosesAt: true } },
          league: {
            select: {
              name: true,
              registrationOpen: true,
              registrationOpensAt: true,
              registrationClosesAt: true,
            },
          },
        },
      })
    : null;
  if (!edition) throw new Error('That season registration window is no longer available.');
  const registrationStatus = getEffectiveEditionRegistration(
    edition,
    registrationSettings.open,
    adminWindowOverride
  );
  if (!registrationStatus.open) throw new Error(registrationClosedMessage(registrationStatus));

  const existing = await prisma.seasonTeam.findUnique({
    where: { leagueSeasonId_teamId: { leagueSeasonId: edition.id, teamId: input.teamId } },
    select: { id: true },
  });
  if (existing) throw new Error('This team is already registered for that season.');
  const pending = await prisma.seasonRegistrationApplication.findFirst({
    where: {
      leagueSeasonId: edition.id,
      teamId: input.teamId,
      status: { in: ['PENDING', 'OWNERSHIP_VERIFICATION'] },
    },
    select: { id: true },
  });
  if (pending)
    throw new Error('This team already has a registration awaiting review for that season.');

  const { application } = await prisma.$transaction(async (tx) => {
    const seasonTeam = registrationSettings.approval
      ? null
      : await tx.seasonTeam.upsert({
          where: { leagueSeasonId_teamId: { leagueSeasonId: edition.id, teamId: input.teamId } },
          update: {},
          create: {
            leagueSeasonId: edition.id,
            leagueId: edition.leagueId,
            seasonId: edition.seasonId,
            teamId: input.teamId,
          },
        });
    const application = await tx.seasonRegistrationApplication.create({
      data: {
        leagueSeasonId: edition.id,
        teamId: input.teamId,
        requestedTeamName: input.teamName,
        type: 'RETURNING_TEAM',
        status: registrationSettings.approval ? 'PENDING' : 'APPROVED',
        applicantName: input.applicantName,
        applicantEmail: input.applicantEmail,
        notes: input.notes,
        seasonTeamId: seasonTeam?.id,
        ...(registrationSettings.approval ? {} : { reviewedAt: new Date() }),
      },
    });
    await tx.registrationNotification.create({
      data: {
        type: 'TEAM_REGISTERED',
        teamId: input.teamId,
        message: `${input.teamName} requested registration for ${edition.season.name} · ${edition.league.name}`,
        metadata: {
          applicationId: application.id,
          leagueSeasonId: edition.id,
          type: 'RETURNING_TEAM',
        },
      },
    });
    return { application };
  });
  return {
    id: application.id,
    status: application.status,
    seasonName: edition.season.name,
    leagueName: edition.league.name,
  };
}
