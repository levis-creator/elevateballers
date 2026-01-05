import { p as prisma } from './prisma_sB1uhqJV.mjs';
import { c as categoryMap } from './types_DXfYTmyI.mjs';

async function getNewsArticles(category) {
  const where = { published: true };
  if (category && category !== "All") {
    if (categoryMap[category]) {
      where.category = categoryMap[category];
    }
  }
  const articles = await prisma.newsArticle.findMany({
    where,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      publishedAt: "desc"
    }
  });
  return articles;
}
async function getAllNewsArticles(includeUnpublished = false) {
  const where = includeUnpublished ? {} : { published: true };
  const articles = await prisma.newsArticle.findMany({
    where,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
  return articles;
}
async function getNewsArticleById(id) {
  const article = await prisma.newsArticle.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
  return article;
}
async function getNewsArticleBySlug(slug) {
  const article = await prisma.newsArticle.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
  return article;
}
async function getFeaturedNewsArticles() {
  const articles = await prisma.newsArticle.findMany({
    where: {
      published: true,
      // Security: Only published articles
      feature: true
      // Only featured articles
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      publishedAt: "desc"
    },
    take: 5
    // Limit to 5 featured articles
  });
  return articles;
}
async function getMatchById(id) {
  return await prisma.match.findUnique({
    where: { id },
    // @ts-expect-error - Prisma types will be correct after dev server restart
    include: {
      team1: true,
      team2: true,
      league: true,
      season: true
    }
  });
}
async function getTeams(includeUnapproved = false) {
  return await prisma.team.findMany({
    where: includeUnapproved ? {} : { approved: true },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      description: true,
      approved: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          players: true
        }
      }
    },
    orderBy: {
      name: "asc"
    }
  });
}
async function getTeamById(id, includeUnapproved = false) {
  return await prisma.team.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      description: true,
      approved: true,
      createdAt: true,
      updatedAt: true,
      players: {
        where: includeUnapproved ? {} : { approved: true },
        orderBy: [
          {
            firstName: "asc"
          },
          {
            lastName: "asc"
          }
        ]
      }
    }
  });
}
async function getTeamBySlug(slug) {
  return await prisma.team.findUnique({
    where: {
      slug,
      approved: true
      // Only return approved teams for public access
    },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      description: true,
      approved: true,
      createdAt: true,
      updatedAt: true,
      players: {
        where: { approved: true },
        // Only return approved players
        orderBy: [
          {
            firstName: "asc"
          },
          {
            lastName: "asc"
          }
        ]
      }
    }
  });
}
async function getPlayers(teamId, includeUnapproved = false) {
  const where = {
    ...includeUnapproved ? {} : { approved: true }
  };
  if (teamId) {
    where.teamId = teamId;
  }
  return await prisma.player.findMany({
    where,
    include: {
      team: {
        select: {
          id: true,
          name: true,
          slug: true,
          approved: true
        }
      }
    },
    orderBy: [
      {
        firstName: "asc"
      },
      {
        lastName: "asc"
      }
    ]
  });
}
async function getPlayerById(id) {
  return await prisma.player.findUnique({
    where: { id },
    include: {
      team: true
    }
  });
}
async function getMedia(type) {
  const where = {};
  if (type) {
    const typeMap = {
      "image": "IMAGE",
      "video": "VIDEO",
      "audio": "AUDIO"
    };
    if (typeMap[type.toLowerCase()]) {
      where.type = typeMap[type.toLowerCase()];
    }
  }
  return await prisma.media.findMany({
    where,
    orderBy: {
      createdAt: "desc"
    }
  });
}
async function getMediaById(id) {
  return await prisma.media.findUnique({
    where: { id }
  });
}
async function getAllPageContents() {
  return await prisma.pageContent.findMany({
    orderBy: {
      title: "asc"
    }
  });
}
async function getPageContentById(id) {
  return await prisma.pageContent.findUnique({
    where: { id }
  });
}
async function getPageContentBySlug(slug) {
  return await prisma.pageContent.findUnique({
    where: { slug }
  });
}
async function getAllSiteSettings(category) {
  const where = {};
  if (category) {
    where.category = category;
  }
  return await prisma.siteSetting.findMany({
    where,
    orderBy: {
      category: "asc"
    }
  });
}
async function getSiteSettingByKey(key) {
  return await prisma.siteSetting.findUnique({
    where: { key }
  });
}
async function getRepliesRecursive(parentId, approvedOnly = true) {
  const whereClause = {
    parentId
  };
  if (approvedOnly) {
    whereClause.approved = true;
  }
  const replies = await prisma.comment.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  });
  const repliesWithNested = await Promise.all(
    replies.map(async (reply) => {
      const nestedReplies = await getRepliesRecursive(reply.id, approvedOnly);
      return {
        ...reply,
        replies: nestedReplies
      };
    })
  );
  return repliesWithNested;
}
async function getArticleComments(articleId) {
  if (!prisma.comment) {
    console.error("Prisma comment model not available. Please run: npx prisma generate");
    return [];
  }
  const comments = await prisma.comment.findMany({
    where: {
      articleId,
      approved: true,
      parentId: null
      // Only top-level comments
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  });
  const commentsWithReplies = await Promise.all(
    comments.map(async (comment) => {
      const replies = await getRepliesRecursive(comment.id, true);
      return {
        ...comment,
        replies
      };
    })
  );
  return commentsWithReplies;
}
async function getAllArticleComments(articleId) {
  if (!prisma.comment) {
    console.error("Prisma comment model not available. Please run: npx prisma generate");
    return [];
  }
  const comments = await prisma.comment.findMany({
    where: {
      articleId,
      parentId: null
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  });
  const commentsWithReplies = await Promise.all(
    comments.map(async (comment) => {
      const replies = await getRepliesRecursive(comment.id, false);
      return {
        ...comment,
        replies
      };
    })
  );
  return commentsWithReplies;
}
async function getArticleCommentCount(articleId) {
  if (!prisma.comment) {
    console.error("Prisma comment model not available. Please run: npx prisma generate");
    return 0;
  }
  return await prisma.comment.count({
    where: {
      articleId,
      approved: true
    }
  });
}
async function getCommentById(id) {
  if (!prisma.comment) {
    console.error("Prisma comment model not available. Please run: npx prisma generate");
    return null;
  }
  const comment = await prisma.comment.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
  return comment;
}
async function getStaff() {
  return await prisma.staff.findMany({
    orderBy: [
      {
        firstName: "asc"
      },
      {
        lastName: "asc"
      }
    ]
  });
}
async function getStaffById(id) {
  return await prisma.staff.findUnique({
    where: { id },
    include: {
      teams: {
        include: {
          team: true
        }
      }
    }
  });
}
async function getStaffByTeam(teamId) {
  return await prisma.teamStaff.findMany({
    where: { teamId },
    include: {
      staff: true
    },
    orderBy: {
      role: "asc"
    }
  });
}
async function getLeagues(activeOnly = false) {
  const where = activeOnly ? { active: true } : {};
  return await prisma.league.findMany({
    where,
    // @ts-expect-error - Prisma types will be correct after full sync
    include: {
      _count: {
        select: {
          matches: true,
          seasons: true
        }
      }
    },
    orderBy: {
      name: "asc"
    }
  });
}
async function getLeagueById(id) {
  return await prisma.league.findUnique({
    where: { id },
    // @ts-expect-error - Prisma types will be correct after full sync
    include: {
      _count: {
        select: {
          matches: true,
          seasons: true
        }
      }
    }
  });
}
async function getSeasons(activeOnly = false, leagueId) {
  const where = activeOnly ? { active: true } : {};
  if (leagueId) {
    where.leagueId = leagueId;
  }
  return await prisma.season.findMany({
    where,
    // @ts-expect-error - Prisma types will be correct after full sync
    include: {
      league: true,
      _count: {
        select: {
          matches: true
        }
      }
    },
    orderBy: {
      startDate: "desc"
    }
  });
}
async function getSeasonById(id) {
  return await prisma.season.findUnique({
    where: { id },
    // @ts-expect-error - Prisma types will be correct after full sync
    include: {
      league: true,
      _count: {
        select: {
          matches: true
        }
      }
    }
  });
}
async function getMatchPlayers(matchId) {
  return await prisma.matchPlayer.findMany({
    where: { matchId },
    include: {
      player: true,
      team: true
    },
    orderBy: [
      { started: "desc" },
      { jerseyNumber: "asc" }
    ]
  });
}
async function getMatchPlayersByTeam(matchId, teamId) {
  return await prisma.matchPlayer.findMany({
    where: { matchId, teamId },
    include: {
      player: true,
      team: true
    },
    orderBy: [
      { started: "desc" },
      { jerseyNumber: "asc" }
    ]
  });
}
async function getMatchPlayerById(id) {
  return await prisma.matchPlayer.findUnique({
    where: { id },
    include: {
      player: true,
      team: true
    }
  });
}
async function getMatchEvents(matchId) {
  return await prisma.matchEvent.findMany({
    where: { matchId },
    include: {
      player: true,
      assistPlayer: true,
      team: true
    },
    orderBy: {
      minute: "asc"
    }
  });
}
async function getMatchEventsByTeam(matchId, teamId) {
  return await prisma.matchEvent.findMany({
    where: { matchId, teamId },
    include: {
      player: true,
      assistPlayer: true,
      team: true
    },
    orderBy: {
      minute: "asc"
    }
  });
}
async function getMatchEventsByType(matchId, eventType) {
  return await prisma.matchEvent.findMany({
    where: { matchId, eventType },
    include: {
      player: true,
      assistPlayer: true,
      team: true
    },
    orderBy: {
      minute: "asc"
    }
  });
}
async function getMatchEventById(id) {
  return await prisma.matchEvent.findUnique({
    where: { id },
    include: {
      player: true,
      assistPlayer: true,
      team: true
    }
  });
}
async function getMatchWithFullDetails(matchId) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        team1: true,
        team2: true,
        league: true,
        season: true
      }
    });
    if (!match) return null;
    let matchPlayers = [];
    let events = [];
    try {
      matchPlayers = await getMatchPlayers(matchId);
    } catch (err) {
      console.warn("Failed to fetch match players:", err);
    }
    try {
      events = await getMatchEvents(matchId);
    } catch (err) {
      console.warn("Failed to fetch match events:", err);
    }
    return {
      ...match,
      matchPlayers: matchPlayers || [],
      events: events || []
    };
  } catch (error) {
    console.error("Error in getMatchWithFullDetails:", error);
    throw error;
  }
}

export { getSeasonById as A, getSeasons as B, getSiteSettingByKey as C, getAllSiteSettings as D, getStaffById as E, getStaff as F, getStaffByTeam as G, getTeamById as H, getTeams as I, getNewsArticleBySlug as J, getTeamBySlug as K, getCommentById as a, getAllArticleComments as b, getArticleComments as c, getLeagueById as d, getLeagues as e, getMatchEventById as f, getNewsArticleById as g, getMatchEventsByTeam as h, getMatchEventsByType as i, getMatchEvents as j, getMatchPlayerById as k, getMatchPlayersByTeam as l, getMatchPlayers as m, getMatchWithFullDetails as n, getMatchById as o, getMediaById as p, getMedia as q, getAllNewsArticles as r, getFeaturedNewsArticles as s, getNewsArticles as t, getArticleCommentCount as u, getPageContentById as v, getPageContentBySlug as w, getAllPageContents as x, getPlayerById as y, getPlayers as z };
