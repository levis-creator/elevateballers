import type { APIRoute } from "astro";
import { getTeamById, getTeamStaffMembers } from "@/features/cms/lib/queries";
import { createTeamStaffMember, removeTeamStaffMember, updateTeamStaffMember } from "@/features/cms/lib/mutations";
import { requirePermission } from "@/features/rbac/middleware";
import { logAudit } from "@/features/cms/lib/audit";
import { handleApiError } from "@/lib/apiError";

export const prerender = false;

const VALID_TYPES = new Set(["coach", "manager", "support"]);

export const GET: APIRoute = async ({ params, request }) => {
	try {
		const url = new URL(request.url);
		const includeInactive = url.searchParams.get("includeInactive") === "true";
		const staff = await getTeamStaffMembers(params.id!, includeInactive);
		return new Response(JSON.stringify(staff), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		return handleApiError(error, "fetch coaching staff");
	}
};

export const POST: APIRoute = async ({ params, request }) => {
	try {
		await requirePermission(request, "teams:manage_staff");
		const data = await request.json();
		if (!data.name || !data.role || !data.type || !VALID_TYPES.has(data.type)) {
			return new Response(JSON.stringify({ error: "Name, role, and a valid type are required" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const team = await getTeamById(params.id!, true);
		if (!team) {
			return new Response(JSON.stringify({ error: "Team not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		const staff = await createTeamStaffMember({
			teamId: params.id!,
			seasonId: data.seasonId || null,
			name: String(data.name).trim(),
			role: String(data.role).trim(),
			type: data.type,
			email: data.email ? String(data.email).trim() : null,
			photo: data.photo ? String(data.photo).trim() : null,
			sortOrder: Number(data.sortOrder ?? 0),
		});

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

export const PUT: APIRoute = async ({ request }) => {
	try {
		await requirePermission(request, "teams:manage_staff");
		const data = await request.json();
		if (!data.id) {
			return new Response(JSON.stringify({ error: "Coaching staff ID is required" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const staff = await updateTeamStaffMember(data.id, {
			seasonId: data.seasonId || null,
			name: data.name ? String(data.name).trim() : undefined,
			role: data.role ? String(data.role).trim() : undefined,
			type: data.type && VALID_TYPES.has(data.type) ? data.type : undefined,
			email: data.email ? String(data.email).trim() : null,
			photo: data.photo ? String(data.photo).trim() : null,
			sortOrder: data.sortOrder === undefined ? undefined : Number(data.sortOrder),
			active: data.active,
		});

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
		await requirePermission(request, "teams:manage_staff");
		const url = new URL(request.url);
		const id = url.searchParams.get("id");
		if (!id) {
			return new Response(JSON.stringify({ error: "Coaching staff ID is required" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const success = await removeTeamStaffMember(id);
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
