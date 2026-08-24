import { useEffect, useState } from "react";
import { navigate } from "astro:transitions/client";
import { ArrowLeft, CheckCircle, Loader2, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { StaffRole } from "@prisma/client";
import { staffApi, type StaffFormData } from "@/features/staff/data/datasources/staff-api";
import { StaffAssignments } from "./StaffAssignments";
import { StaffComplianceFields } from "./StaffComplianceFields";
import { StaffProfileFields } from "./StaffProfileFields";

const EMPTY: StaffFormData = { firstName: "", lastName: "", role: "COACH", active: true, assignments: [] };
const toForm = (staff: Awaited<ReturnType<typeof staffApi.get>>): StaffFormData => ({
  firstName: staff.firstName, lastName: staff.lastName, tagline: staff.tagline ?? "", email: staff.email ?? "", phone: staff.phone ?? "", phoneSecondary: staff.phoneSecondary ?? "", nextOfKin: staff.nextOfKin ?? "", role: staff.role,
  bio: staff.bio ?? "", internalNote: staff.internalNote ?? "", image: staff.image ?? "", licenseNumber: staff.licenseNumber ?? "", licenseExpiresAt: staff.licenseExpiresAt?.toISOString() ?? null, safeguardingStatus: staff.safeguardingStatus ?? "", idNumber: staff.idNumber ?? "", active: staff.active,
  assignments: staff.teams.map((assignment) => ({ teamId: assignment.teamId, role: assignment.role as StaffRole, effectiveFrom: assignment.effectiveFrom?.toISOString() ?? null })),
});

export default function StaffEditor({ staffId }: { staffId?: string }) {
  const [form, setForm] = useState<StaffFormData>(EMPTY); const [loading, setLoading] = useState(Boolean(staffId)); const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [saved, setSaved] = useState(false);
  useEffect(() => { if (!staffId) return; staffApi.get(staffId).then((staff) => setForm(toForm(staff))).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, [staffId]);
  const update = (patch: Partial<StaffFormData>) => setForm((current) => ({ ...current, ...patch }));
  async function submit(event: React.FormEvent) { event.preventDefault(); setSaving(true); setError(""); setSaved(false); try { if (staffId) await staffApi.update(staffId, form); else await staffApi.create(form); setSaved(true); window.setTimeout(() => navigate("/admin/staff"), 700); } catch (e) { setError(e instanceof Error ? e.message : "Unable to save staff member"); } finally { setSaving(false); } }
  if (loading) return <div className="space-y-4"><Skeleton className="h-14 w-full" /><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" />;</div>;
  return <div className="mx-auto max-w-4xl space-y-6 rounded-3xl bg-[#f5efe6] p-4 sm:p-8">
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#d8cbb8] pb-6"><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a56a39]">Staff directory</p><h1 className="mt-2 font-heading text-3xl font-semibold text-[#27231f]">{staffId ? "Edit staff member" : "Add staff member"}</h1><p className="mt-2 max-w-xl text-sm text-[#746b61]">Build a complete staff profile while keeping operational information private to administrators.</p></div><Button variant="outline" asChild><a href="/admin/staff"><ArrowLeft className="mr-2 h-4 w-4" />Back to staff</a></Button></header>
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}{saved && <Alert className="border-green-400 bg-green-50 text-green-900"><CheckCircle className="h-4 w-4" /><AlertDescription>Staff member saved. Returning to the directory…</AlertDescription></Alert>}
    <form onSubmit={submit} className="space-y-5"><StaffProfileFields value={form} onChange={update} disabled={saving} /><StaffComplianceFields value={form} onChange={update} disabled={saving} /><StaffAssignments value={form} onChange={update} disabled={saving} /><div className="flex flex-wrap gap-3 pt-2"><Button type="submit" disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{staffId ? "Save changes" : "Create staff member"}</Button><Button type="button" variant="ghost" asChild><a href="/admin/staff">Cancel</a></Button></div></form>
  </div>;
}
