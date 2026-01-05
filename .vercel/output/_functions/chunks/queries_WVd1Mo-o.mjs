import { p as prisma } from './prisma_sB1uhqJV.mjs';

async function getUpcomingMatches(limit) {
  const now = /* @__PURE__ */ new Date();
  now.setHours(0, 0, 0, 0);
  const matches = await prisma.match.findMany({
    where: {
      OR: [
        {
          date: { gte: now },
          status: { in: ["UPCOMING", "LIVE"] }
        },
        {
          status: "LIVE"
        }
      ]
    },
    // @ts-expect-error - Prisma types will be correct after migration
    include: {
      team1: true,
      team2: true,
      league: true,
      season: true
    },
    orderBy: {
      date: "asc"
    },
    take: limit
  });
  return matches;
}
async function getCompletedMatches(limit) {
  const matches = await prisma.match.findMany({
    where: {
      status: "COMPLETED"
    },
    // @ts-expect-error - Prisma types will be correct after migration
    include: {
      team1: true,
      team2: true,
      league: true,
      season: true
    },
    orderBy: {
      date: "desc"
    },
    take: limit
  });
  return matches;
}
async function getFilteredMatches(filter = {}, sort = "date-asc", limit) {
  const where = {};
  if (filter.status && filter.status !== "all") {
    where.status = filter.status;
  }
  if (filter.stage) {
    where.stage = filter.stage;
  }
  if (filter.leagueId) {
    where.leagueId = filter.leagueId;
  } else if (filter.league) {
    const league = await prisma.league.findFirst({
      where: {
        OR: [
          { slug: filter.league },
          { name: { equals: filter.league, mode: "insensitive" } }
        ]
      }
    });
    if (league) {
      where.leagueId = league.id;
    } else {
      where.leagueName = {
        contains: filter.league,
        mode: "insensitive"
      };
    }
  }
  if (filter.dateFrom || filter.dateTo) {
    where.date = {};
    if (filter.dateFrom) {
      where.date.gte = filter.dateFrom;
    }
    if (filter.dateTo) {
      where.date.lte = filter.dateTo;
    }
  }
  if (filter.search) {
    where.OR = [
      { team1Name: { contains: filter.search, mode: "insensitive" } },
      { team2Name: { contains: filter.search, mode: "insensitive" } },
      { league: { contains: filter.search, mode: "insensitive" } }
    ];
  }
  const orderBy = {};
  if (sort === "date-asc") {
    orderBy.date = "asc";
  } else if (sort === "date-desc") {
    orderBy.date = "desc";
  } else if (sort === "league-asc") {
    orderBy.league = "asc";
  } else if (sort === "league-desc") {
    orderBy.league = "desc";
  }
  const matches = await prisma.match.findMany({
    where,
    // @ts-expect-error - Prisma types will be correct after migration
    include: {
      team1: true,
      team2: true,
      league: true,
      season: true
    },
    orderBy,
    take: limit
  });
  return matches;
}

export { getCompletedMatches as a, getUpcomingMatches as b, getFilteredMatches as g };
