import { C as createPlayer } from '../../../chunks/mutations_BV82jF-A.mjs';
import { p as prisma } from '../../../chunks/prisma_Cvn-nyRW.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const POST = async ({ request }) => {
  try {
    const data = await request.json();
    if (!data.firstName || !data.lastName || !data.email || !data.phone) {
      return new Response(
        JSON.stringify({ error: "First name, last name, email, and phone are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    let teamId;
    if (data.teamName) {
      const team = await prisma.team.findUnique({
        where: { name: data.teamName },
        select: { id: true }
      });
      teamId = team?.id;
    }
    const bioParts = [
      data.email && `Email: ${data.email}`,
      data.phone && `Phone: ${data.phone}`,
      data.teamName && `Team: ${data.teamName}`,
      data.additionalInfo && `Additional Info: ${data.additionalInfo}`
    ].filter(Boolean).join("\n");
    const player = await createPlayer({
      firstName: data.firstName,
      lastName: data.lastName,
      height: data.height,
      weight: data.weight,
      position: data.position,
      jerseyNumber: data.jerseyNumber,
      teamId,
      bio: bioParts || void 0,
      approved: false
      // Public registrations are unapproved by default
    });
    try {
      await prisma.registrationNotification.create({
        data: {
          type: "PLAYER_REGISTERED",
          playerId: player.id,
          teamId: teamId || void 0,
          message: `New player registration: ${data.firstName} ${data.lastName}${teamId ? ` (Team: ${data.teamName})` : data.teamName ? ` (Pending team: ${data.teamName})` : ""}`,
          metadata: {
            playerName: `${data.firstName} ${data.lastName}`,
            email: data.email,
            phone: data.phone,
            teamName: data.teamName || null,
            teamLinked: !!teamId
          }
        }
      });
    } catch (error) {
      console.error("Error creating player registration notification:", error);
    }
    return new Response(JSON.stringify({
      success: true,
      message: "Player registration submitted successfully",
      player
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating player registration:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to submit player registration" }),
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
