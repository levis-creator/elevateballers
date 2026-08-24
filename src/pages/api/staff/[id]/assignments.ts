import type { APIRoute } from "astro";
import { getStaffAssignmentHistory } from "@/features/staff/application/usecases/staff-management";
import { requirePermission } from "@/features/rbac/middleware";
import { handleApiError } from "@/lib/apiError";
export const prerender = false;
export const GET: APIRoute = async ({ params, request }) => {
  try { await requirePermission(request, "staff:read"); const history = await getStaffAssignmentHistory(params.id!); return new Response(JSON.stringify(history), { headers: { "Content-Type": "application/json" } }); } catch (error) { return handleApiError(error, "fetch staff assignment history", request); }
};
