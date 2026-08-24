import type { ReactNode } from "react";
import { ArrowLeft, Briefcase, CalendarClock, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StaffFormData } from "@/features/staff/data/datasources/staff-api";
import { staffRoleLabel } from "@/features/staff/domain/entities/staff-management";

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "?";
}

function expiryLabel(value?: string | null) {
  if (!value) return { label: "Not recorded", urgent: false };
  const date = new Date(value); const days = Math.ceil((date.getTime() - Date.now()) / 86400000);
  return { label: days < 0 ? "Expired" : `${days} days left`, urgent: days <= 60 };
}

export function StaffDetailHeader({ value, staffId }: { value: StaffFormData; staffId?: string }) {
  const name = `${value.firstName} ${value.lastName}`.trim() || "New staff member";
  const expiry = expiryLabel(value.licenseExpiresAt);
  const assignmentCount = value.assignments?.length ?? 0;
  return <>
    <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.14em] text-[#8c8175]"><a href="/admin/staff" className="hover:text-[#e4002b]">Staff</a><span>/</span><span className="truncate text-[#3f3831]">{name}</span></div>
    <section className="overflow-hidden rounded-2xl border border-[#ded8cf] bg-white shadow-sm">
      <div className="h-1.5 bg-gradient-to-r from-[#e4002b] via-[#ff5a72] to-transparent" />
      <div className="flex flex-col gap-6 p-5 lg:flex-row lg:items-center lg:p-7">
        <div className="flex min-w-0 flex-1 items-center gap-4"><div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#fce7ea] font-display text-3xl text-[#e4002b]">{value.image ? <img src={value.image} alt="" className="h-full w-full object-cover" /> : initials(value.firstName, value.lastName)}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="truncate font-heading text-3xl font-semibold text-[#171310]">{name}</h1><Badge className="bg-[#fce7ea] text-[#c50026] hover:bg-[#fce7ea]">{staffRoleLabel(value.role)}</Badge><Badge variant="outline" className="font-mono text-[10px] uppercase tracking-[0.08em]">{value.active === false ? "Inactive" : "Active"}</Badge></div><p className="mt-1 text-sm text-[#6f665c]">{value.tagline || "Staff profile and operational record"}</p><div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#6f665c]"><span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6e1d8] bg-[#faf8f4] px-2.5 py-1.5"><Users className="h-3.5 w-3.5" />{assignmentCount} team {assignmentCount === 1 ? "assignment" : "assignments"}</span><span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6e1d8] bg-[#faf8f4] px-2.5 py-1.5"><ShieldCheck className="h-3.5 w-3.5" />{value.safeguardingStatus || "Safeguarding not recorded"}</span></div></div></div>
        <div className="flex shrink-0 flex-wrap items-center gap-2"><Button variant="outline" asChild><a href="/admin/staff"><ArrowLeft className="mr-2 h-4 w-4" />Back</a></Button>{staffId && <Button variant="outline" asChild><a href={`/admin/staff/${staffId}?mode=edit`}>Edit record</a></Button>}</div>
      </div>
      <div className="grid grid-cols-2 border-t border-[#ece7df] sm:grid-cols-4"><Kpi icon={<Users />} value={String(assignmentCount)} label="Team assignments" /><Kpi icon={<Briefcase />} value={value.active === false ? "Off" : "On"} label="Directory status" /><Kpi icon={<CalendarClock />} value={expiry.label} label="Licence" urgent={expiry.urgent} /><Kpi icon={<ShieldCheck />} value={value.approved === false ? "Pending" : "Approved"} label="Approval" /></div>
    </section>
    {expiry.urgent && <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#f0c77e] bg-[#fff7e7] px-4 py-3 text-sm text-[#6f4b0b]"><CalendarClock className="h-4 w-4 shrink-0" /><span>Coaching licence status needs attention: {expiry.label.toLowerCase()}.</span><a href="#licenseExpiresAt" className="font-semibold underline underline-offset-2">Review licence</a></div>}
  </>;
}

function Kpi({ icon, value, label, urgent }: { icon: ReactNode; value: string; label: string; urgent?: boolean }) {
  return <div className="min-w-0 border-r border-[#ece7df] px-4 py-4 last:border-r-0 sm:px-5"><div className={`flex items-center gap-2 font-mono text-xl font-bold ${urgent ? "text-[#c50026]" : "text-[#171310]"}`}>{icon && <span className="h-4 w-4 text-[#8c8175]">{icon}</span>}{value}</div><div className="mt-1 truncate text-[11px] uppercase tracking-[0.08em] text-[#8c8175]">{label}</div></div>;
}
