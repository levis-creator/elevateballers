import type { APIRoute } from "astro";
import { createLeagueStaff, listLeagueStaff } from "@/features/staff/application/usecases/league-staff-management";
import { requirePermission } from "@/features/rbac/middleware";
import { logAudit } from "@/features/cms/lib/audit";
import { handleApiError } from "@/lib/apiError";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
	try {
		const url = new URL(request.url);
		const includeInactive = url.searchParams.get("includeInactive") === "true";
		const staff = await listLeagueStaff(includeInactive);
		return new Response(JSON.stringify(staff), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		return handleApiError(error, "fetch league staff");
	}
};

export const POST: APIRoute = async ({ request }) => {
	try {
		await requirePermission(request, "staff:create");
		const staff = await createLeagueStaff(await request.json());

		await logAudit(request, "LEAGUE_STAFF_CREATED", {
			leagueStaffId: staff.id,
			name: staff.name,
			role: staff.role,
			department: staff.department,
		});

		return new Response(JSON.stringify(staff), {
			status: 201,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		return handleApiError(error, "create league staff", request);
	}
};
