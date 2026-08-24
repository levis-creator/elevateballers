import type { APIRoute } from "astro";
import { transferStaff } from "@/features/staff/application/usecases/staff-management";
import { requirePermission } from "@/features/rbac/middleware";
import { logAudit } from "@/features/cms/lib/audit";
import { handleApiError } from "@/lib/apiError";
export const prerender = false;
export const POST: APIRoute = async ({ params, request }) => {
  try { const actor = await requirePermission(request, "staff:update"); const data = await request.json(); const assignment = await transferStaff(params.id!, data, actor.id); await logAudit(request, "STAFF_TRANSFERRED", { staffId: params.id, fromTeamStaffId: data.fromTeamStaffId, toTeamId: data.toTeamId, effectiveFrom: assignment.effectiveFrom, transferReason: data.transferReason || undefined }); return new Response(JSON.stringify(assignment), { status: 201, headers: { "Content-Type": "application/json" } }); } catch (error) { return handleApiError(error, "transfer staff", request); }
};
