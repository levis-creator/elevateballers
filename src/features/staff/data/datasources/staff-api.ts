import type { Staff, StaffRole, TeamStaff, User } from "@prisma/client";
import type { StaffWithAssignments } from "@/features/staff/domain/entities/staff-management";

export type StaffFormData = {
  id?: string; createdAt?: string; updatedAt?: string; lastEditedBy?: string | null; firstName: string; lastName: string; slug?: string; tagline?: string; email?: string; phone?: string; phoneSecondary?: string;
  nextOfKin?: string; role: StaffRole; bio?: string; internalNote?: string; image?: string; licenseNumber?: string;
  licenseExpiresAt?: string | null; safeguardingStatus?: string; idNumber?: string; active?: boolean; approved?: boolean;
  assignments?: Array<{ teamId: string; role: StaffRole; effectiveFrom?: string | null; effectiveTo?: string | null }>;
};
export type StaffListRow = Staff & { user: Pick<User, "id" | "name" | "email" | "active" | "activatedAt"> | null; teams: Array<TeamStaff & { team: { id: string; name: string } }> };
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "same-origin", ...init });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
  return body as T;
}
export const staffApi = {
  list: () => request<StaffListRow[]>("/api/staff"),
  get: (id: string) => request<StaffWithAssignments>(`/api/staff/${id}`),
  create: (data: StaffFormData) => request<StaffWithAssignments>("/api/staff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
  update: (id: string, data: Partial<StaffFormData>) => request<StaffWithAssignments>(`/api/staff/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/api/staff/${id}`, { method: "DELETE" }),
  bulkRemove: (ids: string[]) => request<{ deleted: number }>("/api/staff/bulk-delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) }),
};
