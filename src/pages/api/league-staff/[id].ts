import type { APIRoute } from "astro";
import { getLeagueStaffById } from "@/features/cms/lib/queries";
import { updateLeagueStaff, deleteLeagueStaff } from "@/features/cms/lib/mutations";
import { requirePermission } from "@/features/rbac/middleware";
import { logAudit } from "@/features/cms/lib/audit";
import { handleApiError } from "@/lib/apiError";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
	try {
		const staff = await getLeagueStaffById(params.id!);
		if (!staff) {
			return new Response(JSON.stringify({ error: "League staff not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}
		return new Response(JSON.stringify(staff), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		return handleApiError(error, "fetch league staff");
	}
};

export const PUT: APIRoute = async ({ params, request }) => {
	try {
		await requirePermission(request, "staff:update");
		const data = await request.json();
		const staff = await updateLeagueStaff(params.id!, {
			name: data.name ? String(data.name).trim() : undefined,
			role: data.role ? String(data.role).trim() : undefined,
			department: data.department ? String(data.department).trim() : undefined,
			email: data.email ? String(data.email).trim() : null,
			photo: data.photo ? String(data.photo).trim() : null,
			active: data.active,
			sortOrder: data.sortOrder === undefined ? undefined : Number(data.sortOrder),
		});

		if (!staff) {
			return new Response(JSON.stringify({ error: "League staff not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		await logAudit(request, "LEAGUE_STAFF_UPDATED", { leagueStaffId: staff.id });
		return new Response(JSON.stringify(staff), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		return handleApiError(error, "update league staff", request);
	}
};

export const DELETE: APIRoute = async ({ params, request }) => {
	try {
		await requirePermission(request, "staff:update");
		const success = await deleteLeagueStaff(params.id!);
		if (!success) {
			return new Response(JSON.stringify({ error: "League staff not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		await logAudit(request, "LEAGUE_STAFF_DEACTIVATED", { leagueStaffId: params.id });
		return new Response(null, { status: 204 });
	} catch (error) {
		return handleApiError(error, "deactivate league staff", request);
	}
};
