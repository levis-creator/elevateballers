import { p as prisma } from './prisma_Cvn-nyRW.mjs';
import { g as generateSlug } from './utils_AjT2vheH.mjs';

async function manageFeaturedLimit(excludeArticleId) {
  const MAX_FEATURED = 5;
  const whereClause = {
    published: true,
    feature: true
  };
  if (excludeArticleId) {
    whereClause.id = { not: excludeArticleId };
  }
  const featuredCount = await prisma.newsArticle.count({
    where: whereClause
  });
  if (featuredCount >= MAX_FEATURED) {
    const allFeatured = await prisma.newsArticle.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        publishedAt: true,
        createdAt: true
      }
    });
    const sortedFeatured = allFeatured.sort((a, b) => {
      if (a.publishedAt && b.publishedAt) {
        return a.publishedAt.getTime() - b.publishedAt.getTime();
      }
      if (a.publishedAt && !b.publishedAt) {
        return -1;
      }
      if (!a.publishedAt && b.publishedAt) {
        return 1;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
    const oldestFeatured = sortedFeatured[0];
    if (oldestFeatured) {
      await prisma.newsArticle.update({
        where: { id: oldestFeatured.id },
        data: { feature: false }
      });
      console.log(`Automatically unfeatured oldest article: "${oldestFeatured.title}" (ID: ${oldestFeatured.id})`);
    }
  }
}
async function createNewsArticle(data) {
  if (data.feature === true && data.published === true) {
    await manageFeaturedLimit();
  }
  const article = await prisma.newsArticle.create({
    data: {
      ...data,
      publishedAt: data.published ? data.publishedAt || /* @__PURE__ */ new Date() : null
    },
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
async function updateNewsArticle(id, data) {
  const updateData = { ...data };
  if (data.published === true) {
    updateData.publishedAt = data.publishedAt || /* @__PURE__ */ new Date();
  } else if (data.published === false) {
    updateData.publishedAt = null;
  }
  const willBeFeatured = data.feature === true;
  const willBePublished = data.published === true || data.published === void 0;
  const currentArticle = await prisma.newsArticle.findUnique({
    where: { id },
    select: { published: true, feature: true }
  });
  const isCurrentlyPublished = currentArticle?.published ?? false;
  const isCurrentlyFeatured = currentArticle?.feature ?? false;
  if (willBeFeatured && (willBePublished || isCurrentlyPublished) && !isCurrentlyFeatured) {
    await manageFeaturedLimit(id);
  }
  const article = await prisma.newsArticle.update({
    where: { id },
    data: updateData,
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
async function deleteNewsArticle(id) {
  try {
    await prisma.newsArticle.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    console.error("Error deleting news article:", error);
    return false;
  }
}
async function generateUniqueSlug(baseSlug, excludeId) {
  let slug = generateSlug(baseSlug);
  let counter = 1;
  const originalSlug = slug;
  while (true) {
    const whereClause = { slug };
    if (excludeId) {
      whereClause.id = { not: excludeId };
    }
    const existing = await prisma.team.findFirst({
      where: whereClause
    });
    if (!existing) {
      return slug;
    }
    slug = `${originalSlug}-${counter}`;
    counter++;
  }
}
async function createTeam(data) {
  const slug = data.slug || await generateUniqueSlug(data.name);
  return await prisma.team.create({
    data: {
      ...data,
      slug,
      approved: data.approved ?? true
      // Default to true for admin-created teams
    }
  });
}
async function updateTeam(id, data) {
  try {
    const updateData = { ...data };
    if (data.name && !data.slug) {
      updateData.slug = await generateUniqueSlug(data.name, id);
    } else if (data.slug) {
      updateData.slug = await generateUniqueSlug(data.slug, id);
    }
    return await prisma.team.update({
      where: { id },
      data: updateData
    });
  } catch (error) {
    console.error("Error updating team:", error);
    return null;
  }
}
async function createMatch(data) {
  const matchData = {
    date: new Date(data.date),
    team1Score: data.team1Score,
    team2Score: data.team2Score,
    status: data.status || "UPCOMING"
  };
  if (data.stage && data.stage.trim() !== "") {
    matchData.stage = data.stage;
  }
  if (data.leagueId) {
    matchData.leagueId = data.leagueId;
  } else {
    matchData.leagueName = data.league || "";
  }
  if (data.seasonId) {
    matchData.seasonId = data.seasonId;
  }
  if (data.team1Id) {
    matchData.team1Id = data.team1Id;
  } else {
    matchData.team1Name = data.team1Name || "";
    matchData.team1Logo = data.team1Logo || "";
  }
  if (data.team2Id) {
    matchData.team2Id = data.team2Id;
  } else {
    matchData.team2Name = data.team2Name || "";
    matchData.team2Logo = data.team2Logo || "";
  }
  return await prisma.match.create({
    data: matchData,
    // @ts-expect-error - Prisma types will be correct after full sync
    include: {
      team1: true,
      team2: true,
      league: true,
      season: true
    }
  });
}
async function updateMatch(id, data) {
  const updateData = {};
  if (data.date) {
    updateData.date = new Date(data.date);
  }
  if (data.team1Score !== void 0) updateData.team1Score = data.team1Score;
  if (data.team2Score !== void 0) updateData.team2Score = data.team2Score;
  if (data.status !== void 0) updateData.status = data.status;
  if (data.stage !== void 0) {
    if (data.stage && data.stage.trim() !== "") {
      updateData.stage = data.stage;
    } else {
      updateData.stage = null;
    }
  }
  if (data.leagueId !== void 0) {
    if (data.leagueId) {
      updateData.leagueId = data.leagueId;
      updateData.leagueName = null;
    } else {
      updateData.leagueId = null;
      updateData.leagueName = data.league || "";
    }
  } else if (data.league !== void 0) {
    updateData.leagueName = data.league;
  }
  if (data.team1Id !== void 0) {
    if (data.team1Id) {
      updateData.team1Id = data.team1Id;
      updateData.team1Name = null;
      updateData.team1Logo = null;
    } else {
      updateData.team1Id = null;
      updateData.team1Name = data.team1Name || "";
      updateData.team1Logo = data.team1Logo || "";
    }
  } else if (data.team1Name !== void 0 || data.team1Logo !== void 0) {
    if (data.team1Name !== void 0) updateData.team1Name = data.team1Name;
    if (data.team1Logo !== void 0) updateData.team1Logo = data.team1Logo;
  }
  if (data.team2Id !== void 0) {
    if (data.team2Id) {
      updateData.team2Id = data.team2Id;
      updateData.team2Name = null;
      updateData.team2Logo = null;
    } else {
      updateData.team2Id = null;
      updateData.team2Name = data.team2Name || "";
      updateData.team2Logo = data.team2Logo || "";
    }
  } else if (data.team2Name !== void 0 || data.team2Logo !== void 0) {
    if (data.team2Name !== void 0) updateData.team2Name = data.team2Name;
    if (data.team2Logo !== void 0) updateData.team2Logo = data.team2Logo;
  }
  try {
    return await prisma.match.update({
      where: { id },
      data: updateData,
      // @ts-expect-error - Prisma types will be correct after full sync
      include: {
        team1: true,
        team2: true,
        league: true,
        season: true
      }
    });
  } catch (error) {
    console.error("Error updating match:", error);
    return null;
  }
}
async function deleteMatch(id) {
  try {
    await prisma.match.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    console.error("Error deleting match:", error);
    return false;
  }
}
async function createPlayer(data) {
  return await prisma.player.create({
    data: {
      ...data,
      approved: data.approved ?? true
      // Default to true for admin-created players
    }
  });
}
async function updatePlayer(id, data) {
  try {
    return await prisma.player.update({
      where: { id },
      data
    });
  } catch (error) {
    console.error("Error updating player:", error);
    return null;
  }
}
async function deletePlayer(id) {
  try {
    await prisma.player.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    console.error("Error deleting player:", error);
    return false;
  }
}
async function deleteTeam(id) {
  try {
    await prisma.team.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    console.error("Error deleting team:", error);
    return false;
  }
}
async function createMedia(data) {
  return await prisma.media.create({
    data: {
      ...data,
      tags: data.tags || []
    }
  });
}
async function updateMedia(id, data) {
  try {
    return await prisma.media.update({
      where: { id },
      data
    });
  } catch (error) {
    console.error("Error updating media:", error);
    return null;
  }
}
async function deleteMedia(id) {
  try {
    await prisma.media.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    console.error("Error deleting media:", error);
    return false;
  }
}
async function createPageContent(data) {
  return await prisma.pageContent.create({
    data
  });
}
async function updatePageContent(id, data) {
  try {
    return await prisma.pageContent.update({
      where: { id },
      data
    });
  } catch (error) {
    console.error("Error updating page content:", error);
    return null;
  }
}
async function deletePageContent(id) {
  try {
    await prisma.pageContent.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    console.error("Error deleting page content:", error);
    return false;
  }
}
async function createSiteSetting(data) {
  return await prisma.siteSetting.create({
    data
  });
}
async function updateSiteSetting(id, data) {
  try {
    return await prisma.siteSetting.update({
      where: { id },
      data
    });
  } catch (error) {
    console.error("Error updating site setting:", error);
    return null;
  }
}
async function deleteSiteSetting(id) {
  try {
    await prisma.siteSetting.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    console.error("Error deleting site setting:", error);
    return false;
  }
}
async function createComment(data) {
  if (!prisma.comment) {
    throw new Error("Prisma comment model not available. Please run: npx prisma generate");
  }
  const article = await prisma.newsArticle.findUnique({
    where: { id: data.articleId }
  });
  if (!article) {
    throw new Error("Article not found");
  }
  if (data.parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: data.parentId }
    });
    if (!parent) {
      throw new Error("Parent comment not found");
    }
    if (parent.articleId !== data.articleId) {
      throw new Error("Parent comment does not belong to this article");
    }
  }
  const comment = await prisma.comment.create({
    data: {
      content: data.content,
      authorName: data.authorName || null,
      // Allow null for anonymous comments
      authorEmail: data.authorEmail,
      authorUrl: data.authorUrl,
      articleId: data.articleId,
      userId: data.userId,
      parentId: data.parentId,
      approved: true
      // Comments are approved by default
    }
  });
  return comment;
}
async function updateComment(id, data) {
  if (!prisma.comment) {
    console.error("Prisma comment model not available. Please run: npx prisma generate");
    return null;
  }
  try {
    const comment = await prisma.comment.update({
      where: { id },
      data: {
        ...data.content && { content: data.content },
        ...data.approved !== void 0 && { approved: data.approved }
      }
    });
    return comment;
  } catch (error) {
    console.error("Error updating comment:", error);
    return null;
  }
}
async function deleteComment(id) {
  if (!prisma.comment) {
    console.error("Prisma comment model not available. Please run: npx prisma generate");
    return false;
  }
  try {
    await prisma.comment.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    console.error("Error deleting comment:", error);
    return false;
  }
}
async function approveComment(id) {
  return updateComment(id, { approved: true });
}
async function rejectComment(id) {
  return updateComment(id, { approved: false });
}
async function createStaff(data) {
  return await prisma.staff.create({
    data
  });
}
async function updateStaff(id, data) {
  try {
    return await prisma.staff.update({
      where: { id },
      data
    });
  } catch (error) {
    console.error("Error updating staff:", error);
    return null;
  }
}
async function deleteStaff(id) {
  try {
    await prisma.staff.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    console.error("Error deleting staff:", error);
    return false;
  }
}
async function assignStaffToTeam(data) {
  const existing = await prisma.teamStaff.findUnique({
    where: {
      teamId_staffId: {
        teamId: data.teamId,
        staffId: data.staffId
      }
    }
  });
  if (existing) {
    throw new Error("This staff member is already assigned to this team");
  }
  return await prisma.teamStaff.create({
    data
  });
}
async function updateTeamStaff(id, data) {
  try {
    return await prisma.teamStaff.update({
      where: { id },
      data
    });
  } catch (error) {
    console.error("Error updating team staff:", error);
    return null;
  }
}
async function removeStaffFromTeam(id) {
  try {
    await prisma.teamStaff.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    console.error("Error removing staff from team:", error);
    return false;
  }
}
async function createLeague(data) {
  let slug = data.slug;
  if (!slug) {
    slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }
  let uniqueSlug = slug;
  let counter = 1;
  while (await prisma.league.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  return await prisma.league.create({
    data: {
      ...data,
      slug: uniqueSlug
    }
  });
}
async function updateLeague(id, data) {
  try {
    if (data.name && !data.slug) {
      const existing = await prisma.league.findUnique({ where: { id } });
      if (existing) {
        const newSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        let uniqueSlug = newSlug;
        let counter = 1;
        while (await prisma.league.findFirst({
          where: {
            slug: uniqueSlug,
            NOT: { id }
          }
        })) {
          uniqueSlug = `${newSlug}-${counter}`;
          counter++;
        }
        data.slug = uniqueSlug;
      }
    }
    return await prisma.league.update({
      where: { id },
      data
    });
  } catch (error) {
    console.error("Error updating league:", error);
    return null;
  }
}
async function deleteLeague(id) {
  try {
    await prisma.league.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    console.error("Error deleting league:", error);
    return false;
  }
}
async function createSeason(data) {
  if (!data.leagueId) {
    throw new Error("League ID is required for creating a season");
  }
  let slug = data.slug;
  if (!slug) {
    slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }
  let uniqueSlug = slug;
  let counter = 1;
  while (await prisma.season.findFirst({
    where: {
      slug: uniqueSlug,
      leagueId: data.leagueId
    }
  })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  return await prisma.season.create({
    data: {
      ...data,
      slug: uniqueSlug,
      leagueId: data.leagueId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate)
    }
  });
}
async function updateSeason(id, data) {
  try {
    const existing = await prisma.season.findUnique({ where: { id } });
    if (!existing) {
      return null;
    }
    const leagueId = data.leagueId || existing.leagueId;
    if (data.name && !data.slug) {
      const newSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      let uniqueSlug = newSlug;
      let counter = 1;
      while (await prisma.season.findFirst({
        where: {
          slug: uniqueSlug,
          leagueId,
          NOT: { id }
        }
      })) {
        uniqueSlug = `${newSlug}-${counter}`;
        counter++;
      }
      data.slug = uniqueSlug;
    } else if (data.slug) {
      let uniqueSlug = data.slug;
      let counter = 1;
      while (await prisma.season.findFirst({
        where: {
          slug: uniqueSlug,
          leagueId,
          NOT: { id }
        }
      })) {
        uniqueSlug = `${data.slug}-${counter}`;
        counter++;
      }
      data.slug = uniqueSlug;
    }
    const updateData = { ...data };
    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      updateData.endDate = new Date(data.endDate);
    }
    if (data.leagueId) {
      updateData.leagueId = data.leagueId;
    }
    return await prisma.season.update({
      where: { id },
      data: updateData
    });
  } catch (error) {
    console.error("Error updating season:", error);
    return null;
  }
}
async function deleteSeason(id) {
  try {
    await prisma.season.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    console.error("Error deleting season:", error);
    return false;
  }
}
async function createMatchPlayer(data) {
  try {
    return await prisma.matchPlayer.create({
      data: {
        matchId: data.matchId,
        playerId: data.playerId,
        teamId: data.teamId,
        started: data.started ?? false,
        position: data.position,
        jerseyNumber: data.jerseyNumber,
        minutesPlayed: data.minutesPlayed
      }
    });
  } catch (error) {
    console.error("Error creating match player:", error);
    return null;
  }
}
async function updateMatchPlayer(id, data) {
  try {
    return await prisma.matchPlayer.update({
      where: { id },
      data
    });
  } catch (error) {
    console.error("Error updating match player:", error);
    return null;
  }
}
async function deleteMatchPlayer(id) {
  try {
    await prisma.matchPlayer.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    console.error("Error deleting match player:", error);
    return false;
  }
}
async function createMatchEvent(data) {
  try {
    return await prisma.matchEvent.create({
      data: {
        matchId: data.matchId,
        eventType: data.eventType,
        minute: data.minute,
        teamId: data.teamId,
        playerId: data.playerId,
        assistPlayerId: data.assistPlayerId,
        description: data.description,
        metadata: data.metadata
      }
    });
  } catch (error) {
    console.error("Error creating match event:", error);
    return null;
  }
}
async function updateMatchEvent(id, data) {
  try {
    return await prisma.matchEvent.update({
      where: { id },
      data
    });
  } catch (error) {
    console.error("Error updating match event:", error);
    return null;
  }
}
async function deleteMatchEvent(id) {
  try {
    await prisma.matchEvent.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    console.error("Error deleting match event:", error);
    return false;
  }
}

export { updatePlayer as A, deletePlayer as B, createPlayer as C, createTeam as D, createStaff as E, assignStaffToTeam as F, updateSeason as G, deleteSeason as H, createSeason as I, updateSiteSetting as J, deleteSiteSetting as K, createSiteSetting as L, updateStaff as M, deleteStaff as N, updateTeamStaff as O, removeStaffFromTeam as P, updateTeam as Q, deleteTeam as R, approveComment as a, updateLeague as b, createComment as c, deleteComment as d, deleteLeague as e, createLeague as f, updateMatchEvent as g, deleteMatchEvent as h, createMatchEvent as i, updateMatchPlayer as j, deleteMatchPlayer as k, createMatchPlayer as l, updateMatch as m, deleteMatch as n, createMatch as o, updateMedia as p, deleteMedia as q, rejectComment as r, createMedia as s, updateNewsArticle as t, updateComment as u, deleteNewsArticle as v, createNewsArticle as w, updatePageContent as x, deletePageContent as y, createPageContent as z };
