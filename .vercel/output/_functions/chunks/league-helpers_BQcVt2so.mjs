function getTeam1Name(match) {
  if (!match) return "Team 1";
  if ("team1" in match && match.team1) {
    return match.team1.name;
  }
  return match.team1Name || "Team 1";
}
function getTeam1Logo(match) {
  if (!match) return null;
  if ("team1" in match && match.team1?.logo) {
    return match.team1.logo;
  }
  return match.team1Logo || null;
}
function getTeam2Name(match) {
  if (!match) return "Team 2";
  if ("team2" in match && match.team2) {
    return match.team2.name;
  }
  return match.team2Name || "Team 2";
}
function getTeam2Logo(match) {
  if (!match) return null;
  if ("team2" in match && match.team2?.logo) {
    return match.team2.logo;
  }
  return match.team2Logo || null;
}
function getTeam1Id(match) {
  if (!match) return null;
  if ("team1" in match && match.team1) {
    return match.team1.id;
  }
  return match.team1Id || null;
}
function getTeam2Id(match) {
  if (!match) return null;
  if ("team2" in match && match.team2) {
    return match.team2.id;
  }
  return match.team2Id || null;
}

function getLeagueName(match) {
  if (!match) return null;
  if ("league" in match && match.league) {
    return match.league.name;
  }
  return match.leagueName || null;
}
function getLeagueId(match) {
  return match.leagueId || null;
}

export { getTeam1Logo as a, getTeam2Name as b, getTeam2Logo as c, getLeagueName as d, getTeam1Id as e, getTeam2Id as f, getTeam1Name as g, getLeagueId as h };
