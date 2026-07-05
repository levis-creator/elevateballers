import type { APIRoute } from "astro";
import { getLeagueStaff } from "@/features/cms/lib/queries";
import { createLeagueStaff } from "@/features/cms/lib/mutations";
import { requirePermission } from "@/features/rbac/middleware";
import { logAudit } from "@/features/cms/lib/audit";
import { handleApiError } from "@/lib/apiError";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
	try {
		const url = new URL(request.url);
		const includeInactive = url.searchParams.get("includeInactive") === "true";
		const staff = await getLeagueStaff(includeInactive);
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
		const data = await request.json();
		if (!data.name || !data.role || !data.department) {
			return new Response(JSON.stringify({ error: "Name, role, and department are required" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const staff = await createLeagueStaff({
			name: String(data.name).trim(),
			role: String(data.role).trim(),
			department: String(data.department).trim(),
			email: data.email ? String(data.email).trim() : undefined,
			photo: data.photo ? String(data.photo).trim() : undefined,
			active: data.active ?? true,
			sortOrder: Number(data.sortOrder ?? 0),
		});

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
