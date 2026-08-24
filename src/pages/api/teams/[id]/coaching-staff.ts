import type { APIRoute } from "astro";
import { createTeamCoachingStaff, deleteTeamCoachingStaff, listTeamCoachingStaff, teamExists, updateTeamCoachingStaff } from "@/features/staff/application/usecases/team-coaching-staff-management";
import { requireCoachingStaffScopedPermission } from "@/features/rbac/middleware";
import { logAudit } from "@/features/cms/lib/audit";
import { handleApiError } from "@/lib/apiError";

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
	try {
		const url = new URL(request.url);
		const includeInactive = url.searchParams.get("includeInactive") === "true";
		const staff = await listTeamCoachingStaff(params.id!, includeInactive);
		return new Response(JSON.stringify(staff), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		return handleApiError(error, "fetch coaching staff");
	}
};

export const POST: APIRoute = async ({ params, request }) => {
	try {
		await requireCoachingStaffScopedPermission(request, params.id!, "teams:manage_staff");
		const data = await request.json();
		const team = await teamExists(params.id!);
		if (!team) {
			return new Response(JSON.stringify({ error: "Team not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		const staff = await createTeamCoachingStaff({ ...data, teamId: params.id! });

		await logAudit(request, "TEAM_COACHING_STAFF_CREATED", {
			teamId: params.id,
			teamStaffMemberId: staff.id,
			name: staff.name,
			role: staff.role,
			type: staff.type,
		});

		return new Response(JSON.stringify(staff), {
			status: 201,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		return handleApiError(error, "create coaching staff", request);
	}
};

export const PUT: APIRoute = async ({ params, request }) => {
	try {
		const data = await request.json();
		if (!data.id) {
			return new Response(JSON.stringify({ error: "Coaching staff ID is required" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}
		await requireCoachingStaffScopedPermission(request, params.id!, "teams:manage_staff", data.id);

		const staff = await updateTeamCoachingStaff(data.id, data);

		if (!staff) {
			return new Response(JSON.stringify({ error: "Coaching staff not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		await logAudit(request, "TEAM_COACHING_STAFF_UPDATED", { teamStaffMemberId: staff.id });
		return new Response(JSON.stringify(staff), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		return handleApiError(error, "update coaching staff", request);
	}
};

export const DELETE: APIRoute = async ({ params, request }) => {
	try {
		const url = new URL(request.url);
		const id = url.searchParams.get("id");
		if (!id) {
			return new Response(JSON.stringify({ error: "Coaching staff ID is required" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}
		await requireCoachingStaffScopedPermission(request, params.id!, "teams:manage_staff", id);

		const success = await deleteTeamCoachingStaff(id);
		if (!success) {
			return new Response(JSON.stringify({ error: "Coaching staff not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		await logAudit(request, "TEAM_COACHING_STAFF_DEACTIVATED", {
			teamId: params.id,
			teamStaffMemberId: id,
		});
		return new Response(null, { status: 204 });
	} catch (error) {
		return handleApiError(error, "deactivate coaching staff", request);
	}
};
