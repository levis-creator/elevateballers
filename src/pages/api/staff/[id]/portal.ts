import type { APIRoute } from "astro";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/features/rbac/middleware";
import { requireSystemAdmin } from "@/features/rbac/auth-helpers";
import { logAudit } from "@/features/cms/data/datasources/audit";
import { hashPassword } from "@/features/cms/lib/auth";
import { COACH_ROLE_NAME } from "@/features/users/domain/entities/user-directory";
import { sendWelcomeSetPasswordEmail } from "@/lib/email";
import { getRuntimeEmailTemplates } from "@/lib/email/runtime-settings";

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
    await requireSystemAdmin(request);
    const body = await request.json().catch(() => ({}));
    const userId = typeof body.userId === "string" && body.userId.trim() ? body.userId.trim() : null;
    const staff = await prisma.staff.findUnique({ where: { id: params.id }, select: { id: true, userId: true, firstName: true, lastName: true, email: true, phone: true, teams: { where: { effectiveTo: null }, select: { teamId: true } } } });
    if (!staff) return new Response(JSON.stringify({ error: "Staff member not found" }), { status: 404 });

    if (body.action === "invite") {
      const email = staff.email?.trim().toLowerCase();
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        return new Response(JSON.stringify({ error: "A valid Staff email is required before sending an invite" }), { status: 400 });
      }

      const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true, active: true, activatedAt: true } });
      if (existing && existing.id !== staff.userId) {
        return new Response(JSON.stringify({ error: "A User already exists with this email. Link it through User administration instead of creating a duplicate." }), { status: 409 });
      }

      const ttlMinutes = (await getRuntimeEmailTemplates()).linkExpiry;
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
      const name = `${staff.firstName} ${staff.lastName}`.trim();
      const role = await prisma.role.findUnique({ where: { name: COACH_ROLE_NAME }, select: { id: true } });
      if (!role) return new Response(JSON.stringify({ error: `Required ${COACH_ROLE_NAME} role is not configured` }), { status: 500 });
      const passwordHash = await hashPassword(crypto.randomBytes(32).toString("hex"));
      const user = await prisma.$transaction(async (database) => {
        const created = existing ?? await database.user.create({ data: { email, name, phone: staff.phone ?? null, passwordHash }, select: { id: true, name: true, email: true, active: true, activatedAt: true } });
        if (!existing) {
          await database.userRole.create({ data: { userId: created.id, roleId: role.id } });
          if (staff.teams.length) await database.teamOwnership.createMany({ data: staff.teams.map(({ teamId }) => ({ teamId, userId: created.id, email, role: COACH_ROLE_NAME, verifiedAt: new Date() })) });
          await database.staff.update({ where: { id: staff.id }, data: { userId: created.id } });
        } else if (staff.userId === existing.id) {
          await database.user.update({ where: { id: existing.id }, data: { active: true, tokenVersion: { increment: 1 } } });
          await database.teamOwnership.updateMany({ where: { userId: existing.id, role: COACH_ROLE_NAME, revokedAt: null }, data: { revokedAt: new Date(), effectiveTo: new Date() } });
          if (staff.teams.length) await database.teamOwnership.createMany({ data: staff.teams.map(({ teamId }) => ({ teamId, userId: existing.id, email, role: COACH_ROLE_NAME, verifiedAt: new Date(), effectiveFrom: new Date() })) });
        }
        await database.passwordResetToken.create({ data: { userId: created.id, tokenHash, expiresAt } });
        return created;
      });
      const setPasswordUrl = `${new URL(request.url).origin}/admin/reset-password?token=${token}`;
      try {
        await sendWelcomeSetPasswordEmail({ email: user.email, name: user.name, setPasswordUrl, expiresInMinutes: ttlMinutes });
      } catch (emailError) {
        console.error("[staff] Failed to send portal invite email:", emailError);
      }
      logAudit(request, existing ? "STAFF_PORTAL_INVITE_RESENT" : "STAFF_PORTAL_ACCOUNT_CREATED", { staffId: staff.id, userId: user.id, teamCount: staff.teams.length });
      return new Response(JSON.stringify({ user: { ...user, activatedAt: user.activatedAt }, invited: true }), { status: existing ? 200 : 201, headers: { "Content-Type": "application/json" } });
    }

    if (body.action === "revoke") {
      if (!staff.userId) return new Response(JSON.stringify({ user: null }), { headers: { "Content-Type": "application/json" } });
      const now = new Date();
      await prisma.$transaction(async (database) => {
        await database.user.update({ where: { id: staff.userId! }, data: { active: false, tokenVersion: { increment: 1 } } });
        await database.userSession.updateMany({ where: { userId: staff.userId!, revokedAt: null }, data: { revokedAt: now, revokeReason: "staff_portal_access_revoked" } });
        await database.teamOwnership.updateMany({ where: { userId: staff.userId!, role: COACH_ROLE_NAME, revokedAt: null }, data: { revokedAt: now, effectiveTo: now } });
      });
      logAudit(request, "STAFF_PORTAL_ACCESS_REVOKED", { staffId: staff.id, userId: staff.userId });
      const revoked = await prisma.user.findUnique({ where: { id: staff.userId }, select: { id: true, name: true, email: true, active: true, activatedAt: true } });
      return new Response(JSON.stringify({ user: revoked }), { headers: { "Content-Type": "application/json" } });
    }

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
