import { prisma } from "@/lib/prisma";

/** The active season (at most one is), or null — for server-rendered filters that key seasons by name. */
export async function getActiveSeason(): Promise<{ id: string; name: string } | null> {
	return prisma.season.findFirst({ where: { active: true }, orderBy: { startDate: "desc" }, select: { id: true, name: true } });
}
