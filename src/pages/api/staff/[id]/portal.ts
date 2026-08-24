import type { APIRoute } from "astro";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/features/rbac/middleware";
import { logAudit } from "@/features/cms/data/datasources/audit";

export const prerender = false;

export const GET: APIRoute = async ({ request, params }) => {
  try {
    await requirePermission(request, "staff:read");
    if (new URL(request.url).searchParams.get("available") === "1") {
      await requirePermission(request, "users:read");
      const users = await prisma.user.findMany({ where: { staffProfile: null }, select: { id: true, name: true, email: true, active: true }, orderBy: { name: "asc" }, take: 200 });
      return new Response(JSON.stringify({ users }), { headers: { "Content-Type": "application/json" } });
    }
    const staff = await prisma.staff.findUnique({ where: { id: params.id }, select: { user: { select: { id: true, name: true, email: true, active: true } } } });
    if (!staff) return new Response(JSON.stringify({ error: "Staff member not found" }), { status: 404 });
    return new Response(JSON.stringify({ user: staff.user }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    if (error instanceof Error && /unknown column|unknown field|does not exist|staff_user_id/i.test(error.message)) {
      return new Response(JSON.stringify({ user: null, unavailable: true }), { headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unable to load portal account" }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, params }) => {
  try {
    await requirePermission(request, "staff:update");
    const body = await request.json().catch(() => ({}));
    const userId = typeof body.userId === "string" && body.userId.trim() ? body.userId.trim() : null;
    const staff = await prisma.staff.findUnique({ where: { id: params.id }, select: { id: true, userId: true } });
    if (!staff) return new Response(JSON.stringify({ error: "Staff member not found" }), { status: 404 });
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, active: true } });
      if (!user) return new Response(JSON.stringify({ error: "User account not found" }), { status: 404 });
      const alreadyLinked = await prisma.staff.findFirst({ where: { userId, id: { not: staff.id } }, select: { id: true } });
      if (alreadyLinked) return new Response(JSON.stringify({ error: "That user account is already linked to another staff profile" }), { status: 409 });
    }
    const updated = await prisma.staff.update({ where: { id: staff.id }, data: { userId }, select: { user: { select: { id: true, name: true, email: true, active: true } } } });
    logAudit(request, userId ? "STAFF_PORTAL_ACCOUNT_LINKED" : "STAFF_PORTAL_ACCOUNT_UNLINKED", { staffId: staff.id, userId: userId ?? staff.userId });
    return new Response(JSON.stringify({ user: updated.user }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unable to update portal account" }), { status: 500 });
  }
};
