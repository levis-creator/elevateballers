import { prisma } from '../../../../lib/prisma';
import type { TeamWithPlayerCount, TeamWithPlayers } from '../../types';

const TEAMS_PAGINATION_SELECT = {
  id: true, name: true, slug: true, logo: true, description: true,
  approved: true, createdAt: true, updatedAt: true,
  _count: { select: { players: true } },
} as const;

export type TeamsPaginatedResult = {
  teams: TeamWithPlayerCount[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
};

export async function getTeams(includeUnapproved = false): Promise<TeamWithPlayerCount[]> {
  return await prisma.team.findMany({
    where: includeUnapproved ? {} : { approved: true },
    select: {
      id: true, name: true, slug: true, logo: true, description: true,
      approved: true, createdAt: true, updatedAt: true,
      _count: { select: { players: true } },
    },
    orderBy: { name: 'asc' },
  }) as TeamWithPlayerCount[];
}

export async function getTeamsPaginated(
  page = 1,
  perPage = 12,
  includeUnapproved = false,
  search?: string | null
): Promise<TeamsPaginatedResult> {
  const baseWhere = includeUnapproved ? {} : { approved: true };
  const searchTerm = typeof search === 'string' ? search.trim() : '';
  const where = searchTerm.length > 0
    ? { ...baseWhere, OR: [{ name: { contains: searchTerm } }, { slug: { contains: searchTerm } }] }
    : baseWhere;

  const [totalCount, teams] = await Promise.all([
    prisma.team.count({ where }),
    prisma.team.findMany({
      where,
      select: TEAMS_PAGINATION_SELECT,
      orderBy: { name: 'asc' },
      skip: (Math.max(1, page) - 1) * perPage,
      take: perPage,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const currentPage = Math.max(1, Math.min(page, totalPages));
  return { teams: teams as TeamWithPlayerCount[], totalCount, totalPages, currentPage, perPage };
}

export async function getTeamById(id: string, includeUnapproved = false): Promise<TeamWithPlayers | null> {
  return await prisma.team.findUnique({
    where: { id },
    select: {
      id: true, name: true, slug: true, logo: true, description: true,
      approved: true, createdAt: true, updatedAt: true,
      players: {
        where: includeUnapproved ? {} : { approved: true },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      },
    },
  }) as TeamWithPlayers | null;
}

export async function getTeamBySlug(slug: string): Promise<TeamWithPlayers | null> {
  return await prisma.team.findUnique({
    where: { slug, approved: true },
    select: {
      id: true, name: true, slug: true, logo: true, description: true,
      approved: true, createdAt: true, updatedAt: true,
      players: {
        where: { approved: true },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        select: {
          id: true, slug: true, firstName: true, lastName: true, image: true,
          bio: true, height: true, weight: true, position: true, jerseyNumber: true,
          stats: true, approved: true, teamId: true, createdAt: true, updatedAt: true,
        },
      },
    },
  }) as TeamWithPlayers | null;
}
