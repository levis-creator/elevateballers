import { D as createTeam, E as createStaff, F as assignStaffToTeam } from '../../../chunks/mutations_BV82jF-A.mjs';
import { p as prisma } from '../../../chunks/prisma_Cvn-nyRW.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
function parseName(fullName) {
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  } else if (parts.length === 2) {
    return { firstName: parts[0], lastName: parts[1] };
  } else {
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(" ")
    };
  }
}
const POST = async ({ request }) => {
  try {
    const data = await request.json();
    if (!data.name || !data.coachName || !data.contactEmail || !data.contactPhone) {
      return new Response(
        JSON.stringify({ error: "Team name, coach name, contact email, and contact phone are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const existing = await prisma.team.findUnique({
      where: { name: data.name },
      select: { id: true, name: true }
    });
    if (existing) {
      return new Response(
        JSON.stringify({ error: "A team with this name already exists" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    let leagueName;
    if (data.leagueId) {
      const league = await prisma.league.findUnique({
        where: { id: data.leagueId },
        select: { name: true }
      });
      leagueName = league?.name;
    }
    const description = [
      leagueName && `League: ${leagueName}`,
      data.coachName && `Coach: ${data.coachName}`,
      data.contactEmail && `Contact Email: ${data.contactEmail}`,
      data.contactPhone && `Contact Phone: ${data.contactPhone}`,
      data.additionalInfo && `Additional Info: ${data.additionalInfo}`
    ].filter(Boolean).join("\n");
    const team = await createTeam({
      name: data.name,
      description: description || void 0,
      approved: false
      // Public registrations are unapproved by default
    });
    const { firstName, lastName } = parseName(data.coachName);
    let coachStaff = await prisma.staff.findFirst({
      where: {
        email: data.contactEmail
      }
    });
    if (!coachStaff) {
      coachStaff = await createStaff({
        firstName,
        lastName: lastName || firstName,
        // Use firstName as lastName if lastName is empty
        email: data.contactEmail,
        phone: data.contactPhone,
        role: "COACH",
        bio: data.additionalInfo || void 0
      });
    }
    try {
      await assignStaffToTeam({
        teamId: team.id,
        staffId: coachStaff.id,
        role: "COACH"
      });
    } catch (error) {
      if (!error.message.includes("already assigned")) {
        console.error("Error assigning coach to team:", error);
      }
    }
    let linkedPlayersCount = 0;
    try {
      const playersToLink = await prisma.player.findMany({
        where: {
          teamId: null,
          OR: [
            {
              bio: {
                contains: `Team: ${team.name}`
              }
            },
            {
              bio: {
                contains: team.name
              }
            }
          ]
        }
      });
      if (playersToLink.length > 0) {
        await prisma.player.updateMany({
          where: {
            id: {
              in: playersToLink.map((p) => p.id)
            }
          },
          data: {
            teamId: team.id
          }
        });
        linkedPlayersCount = playersToLink.length;
        for (const player of playersToLink) {
          await prisma.registrationNotification.create({
            data: {
              type: "PLAYER_AUTO_LINKED",
              playerId: player.id,
              teamId: team.id,
              message: `Player ${player.firstName} ${player.lastName} was automatically linked to team ${team.name}`,
              metadata: {
                playerName: `${player.firstName} ${player.lastName}`,
                teamName: team.name
              }
            }
          });
        }
      }
    } catch (error) {
      console.error("Error auto-linking players:", error);
    }
    try {
      await prisma.registrationNotification.create({
        data: {
          type: "TEAM_REGISTERED",
          teamId: team.id,
          staffId: coachStaff.id,
          message: `New team registration: ${team.name} (Coach: ${data.coachName})`,
          metadata: {
            teamName: team.name,
            coachName: data.coachName,
            contactEmail: data.contactEmail,
            contactPhone: data.contactPhone,
            leagueName,
            linkedPlayersCount
          }
        }
      });
    } catch (error) {
      console.error("Error creating team registration notification:", error);
    }
    return new Response(JSON.stringify({
      success: true,
      message: "Team registration submitted successfully",
      team,
      coach: coachStaff,
      linkedPlayers: linkedPlayersCount
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating team registration:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to submit team registration" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
