import type { StaffRole } from "@prisma/client";
import { LockKeyhole } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import ImageUpload from "@/components/ImageUpload";
import type { StaffFormData } from "@/features/staff/data/datasources/staff-api";
import { STAFF_ROLES, staffRoleLabel } from "@/features/staff/domain/entities/staff-management";
import { Field, StaffFormSection, staffInputClass } from "./StaffFormSection";

export function StaffProfileFields({ value, onChange, disabled }: { value: StaffFormData; onChange: (patch: Partial<StaffFormData>) => void; disabled?: boolean }) {
  return <>
    <StaffFormSection title="Identity" description="Name, role and photo. The photo is shown publicly on the Staff page.">
      <div className="flex flex-wrap gap-5">
        <div className="flex w-[100px] shrink-0 flex-col gap-2">
          <ImageUpload value={value.image ?? ""} onChange={(image) => onChange({ image })} disabled={disabled} folder="staff" variant="staff" />
          <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-[var(--faint)]">Portrait · 3:4</span>
        </div>
        <div className="grid min-w-[300px] flex-1 grid-cols-2 gap-x-4 gap-y-4 max-[720px]:grid-cols-1">
          <Field label="First name *" htmlFor="firstName"><Input className={staffInputClass} id="firstName" required maxLength={80} value={value.firstName} onChange={(e) => onChange({ firstName: e.target.value })} disabled={disabled} placeholder="First name" /></Field>
          <Field label="Last name *" htmlFor="lastName"><Input className={staffInputClass} id="lastName" required maxLength={80} value={value.lastName} onChange={(e) => onChange({ lastName: e.target.value })} disabled={disabled} placeholder="Last name" /></Field>
          <Field label="Role *" htmlFor="role"><Select value={value.role} onValueChange={(role) => onChange({ role: role as StaffRole })} disabled={disabled}><SelectTrigger className={staffInputClass} id="role"><SelectValue /></SelectTrigger><SelectContent>{STAFF_ROLES.map((role) => <SelectItem key={role} value={role}>{staffRoleLabel(role)}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Status" htmlFor="active"><div className="flex w-full items-center gap-3 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3 py-[7px] hover:border-[var(--brand)]"><Switch id="active" checked={value.active !== false} onCheckedChange={(active) => onChange({ active })} disabled={disabled} /><span className="min-w-0 flex-1 text-[13px] font-bold text-[var(--tx)]">{value.active !== false ? "Active" : "Inactive"}</span></div><p className={`mt-1.5 font-body text-[11px] ${value.active !== false ? "text-[var(--faint)]" : "text-amber-400"}`}>{value.active !== false ? "Appears on the public staff page and can be put on a match sheet." : "Hidden publicly; history and past seasons stay intact."}</p></Field>
          <div className="col-span-2 max-[720px]:col-span-1"><Field label="Public URL" htmlFor="slug"><div className="flex items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3 py-2"><span className="font-mono text-[11.5px] text-[var(--faint)]">/staff/</span><input id="slug" value={value.slug ?? ""} onChange={(e) => onChange({ slug: e.target.value })} disabled={disabled} className="w-full border-none bg-transparent font-mono text-[12px] text-[var(--tx)] outline-none" placeholder="staff-slug" /></div></Field></div>
          <div className="col-span-2 max-[720px]:col-span-1"><Field label="Tagline" htmlFor="tagline"><Input className={staffInputClass} id="tagline" maxLength={240} value={value.tagline ?? ""} onChange={(e) => onChange({ tagline: e.target.value })} disabled={disabled} placeholder="One line shown under the name on the public profile" /></Field></div>
        </div>
      </div>
    </StaffFormSection>
    <StaffFormSection title="Contact" description="Internal only. Never shown on the public site." headerAside={<span className="flex items-center gap-1.5 rounded-md border border-[var(--bord)] bg-[var(--surf2)] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--txm)]"><LockKeyhole className="h-[11px] w-[11px]" />Private</span>}>
      <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
        <Field label="Email" htmlFor="email"><Input className={staffInputClass} id="email" type="email" maxLength={254} value={value.email ?? ""} onChange={(e) => onChange({ email: e.target.value })} disabled={disabled} placeholder="name@example.com" /><p className="font-body text-[11px] text-[var(--txm)]">Used for portal access and account notifications.</p></Field>
        <Field label="Phone" htmlFor="phone"><Input className={staffInputClass} id="phone" type="tel" maxLength={40} value={value.phone ?? ""} onChange={(e) => onChange({ phone: e.target.value })} disabled={disabled} placeholder="0712 345 678" /><p className="font-body text-[11px] text-[var(--faint)]">Stored as typed and normalized on save.</p></Field>
        <Field label="Alternate phone" htmlFor="phoneSecondary"><Input className={staffInputClass} id="phoneSecondary" type="tel" maxLength={40} value={value.phoneSecondary ?? ""} onChange={(e) => onChange({ phoneSecondary: e.target.value })} disabled={disabled} placeholder="Optional" /></Field>
        <Field label="Emergency contact" htmlFor="nextOfKin"><Input className={staffInputClass} id="nextOfKin" maxLength={160} value={value.nextOfKin ?? ""} onChange={(e) => onChange({ nextOfKin: e.target.value })} disabled={disabled} placeholder="Name · relationship · phone" /></Field>
      </div>
    </StaffFormSection>
    <StaffFormSection title="Biography & notes" description="The biography is public; the note is restricted to administrators.">
      <div className="grid gap-4"><Field label="Public biography" htmlFor="bio"><Textarea className={staffInputClass} id="bio" rows={4} maxLength={5000} value={value.bio ?? ""} onChange={(e) => onChange({ bio: e.target.value })} disabled={disabled} placeholder="Shown on the public staff profile." /><div className="mt-1.5 flex justify-between font-mono text-[9.5px] text-[var(--faint)]"><span>Public · /staff/{value.slug || "…"}</span><span>{(value.bio ?? "").length} / 5000</span></div></Field><Field label="Internal note" htmlFor="internalNote"><Textarea className={staffInputClass} id="internalNote" rows={3} maxLength={5000} value={value.internalNote ?? ""} onChange={(e) => onChange({ internalNote: e.target.value })} disabled={disabled} placeholder="Context for other admins. Never published." /></Field></div>
    </StaffFormSection>
  </>;
}
