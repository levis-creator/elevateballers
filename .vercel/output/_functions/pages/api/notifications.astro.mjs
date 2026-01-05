import { r as requireAdmin } from '../../chunks/auth_CrN9ezVw.mjs';
import { p as prisma } from '../../chunks/prisma_Cvn-nyRW.mjs';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const GET = async ({ request }) => {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get("unread") === "true";
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : void 0;
    const where = {};
    if (unreadOnly) {
      where.read = false;
    }
    const notifications = await prisma.registrationNotification.findMany({
      where,
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit
    });
    return new Response(JSON.stringify(notifications), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to fetch notifications" }),
      {
        status: error.message === "Unauthorized" || error.message.includes("Forbidden") ? 401 : 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
const PATCH = async ({ request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();
    if (!data.id) {
      return new Response(
        JSON.stringify({ error: "Notification ID is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const notification = await prisma.registrationNotification.update({
      where: { id: data.id },
      data: {
        read: data.read !== void 0 ? data.read : void 0
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });
    return new Response(JSON.stringify(notification), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating notification:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to update notification" }),
      {
        status: error.message === "Unauthorized" || error.message.includes("Forbidden") ? 401 : 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  PATCH,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
