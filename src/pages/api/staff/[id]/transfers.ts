import type { APIRoute } from "astro";
import { getStaffTransferHistory } from "@/features/staff/application/usecases/staff-management";
import { requirePermission } from "@/features/rbac/middleware";
import { handleApiError } from "@/lib/apiError";
export const prerender = false;
export const GET: APIRoute = async ({ params, request }) => {
  try { await requirePermission(request, "staff:read"); const transfers = await getStaffTransferHistory(params.id!); return new Response(JSON.stringify(transfers), { headers: { "Content-Type": "application/json" } }); } catch (error) { if (error instanceof Error && /staff_transfers|unknown table|does not exist/i.test(error.message)) return new Response("[]", { headers: { "Content-Type": "application/json", "X-Staff-History-Available": "false" } }); return handleApiError(error, "fetch staff transfer history", request); }
};
