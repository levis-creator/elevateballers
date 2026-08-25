import type { APIRoute } from "astro";
import { transferStaff } from "@/features/staff/application/usecases/staff-management";
import { requireSystemAdmin } from "@/features/rbac/auth-helpers";
import { logAudit } from "@/features/cms/lib/audit";
import { handleApiError } from "@/lib/apiError";
import { prisma } from "@/lib/prisma";
import { sendStaffTransferNotification } from "@/lib/email";
export const prerender = false;
export const POST: APIRoute = async ({ params, request }) => {
  try {
    const actor = await requireSystemAdmin(request);
    const data = await request.json();
    const assignment = await transferStaff(params.id!, data, actor.id);
    const staff = await prisma.staff.findUnique({ where: { id: params.id! }, select: { firstName: true, lastName: true, email: true } });
    if (staff?.email) {
      void sendStaffTransferNotification({ email: staff.email, name: `${staff.firstName} ${staff.lastName}`.trim(), fromTeam: assignment.fromTeam.name, toTeam: assignment.toTeam.name, effectiveFrom: assignment.effectiveFrom }).catch((error) => console.error('[staff] transfer notification failed', error));
    }
    await logAudit(request, "STAFF_TRANSFERRED", { staffId: params.id, fromTeamStaffId: data.fromTeamStaffId, toTeamId: data.toTeamId, effectiveFrom: assignment.effectiveFrom, transferReason: data.transferReason || undefined });
    return new Response(JSON.stringify(assignment), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (error) { return handleApiError(error, "transfer staff", request); }
};
