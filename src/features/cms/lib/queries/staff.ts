import { prisma } from '../../../../lib/prisma';
import type { Staff, StaffWithTeams, TeamStaffWithStaff } from '../../types';

export async function getStaff(): Promise<Staff[]> {
  return await prisma.staff.findMany({
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  });
}

export async function getStaffById(id: string): Promise<StaffWithTeams | null> {
  return await prisma.staff.findUnique({
    where: { id },
    include: { teams: { include: { team: true } } },
  });
}

export async function getStaffBySlug(slug: string): Promise<StaffWithTeams | null> {
  return await prisma.staff.findFirst({
    where: { slug, approved: true },
    include: { teams: { include: { team: true } } },
  });
}

export async function getPublicStaff(): Promise<Staff[]> {
  return await prisma.staff.findMany({
    where: { approved: true, slug: { not: null } },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  });
}

export async function getStaffByTeam(teamId: string, includeUnapproved = false): Promise<TeamStaffWithStaff[]> {
  return await prisma.teamStaff.findMany({
    where: { teamId, ...(includeUnapproved ? {} : { staff: { approved: true } }) },
    include: { staff: true },
    orderBy: { role: 'asc' },
  });
}
