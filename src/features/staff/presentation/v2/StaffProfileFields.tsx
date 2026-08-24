import type { StaffRole } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { StaffFormData } from "@/features/staff/data/datasources/staff-api";
import { STAFF_ROLES, staffRoleLabel } from "@/features/staff/domain/entities/staff-management";
import { Field, StaffFormSection } from "./StaffFormSection";

export function StaffProfileFields({ value, onChange, disabled }: { value: StaffFormData; onChange: (patch: Partial<StaffFormData>) => void; disabled?: boolean }) {
  return <>
    <StaffFormSection title="Profile" description="The public identity and role shown wherever this staff member appears.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" htmlFor="firstName"><Input id="firstName" required maxLength={80} value={value.firstName} onChange={(e) => onChange({ firstName: e.target.value })} disabled={disabled} /></Field>
        <Field label="Last name" htmlFor="lastName"><Input id="lastName" required maxLength={80} value={value.lastName} onChange={(e) => onChange({ lastName: e.target.value })} disabled={disabled} /></Field>
        <Field label="Primary role" htmlFor="role"><Select value={value.role} onValueChange={(role) => onChange({ role: role as StaffRole })} disabled={disabled}><SelectTrigger id="role"><SelectValue /></SelectTrigger><SelectContent>{STAFF_ROLES.map((role) => <SelectItem key={role} value={role}>{staffRoleLabel(role)}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Tagline" htmlFor="tagline"><Input id="tagline" maxLength={240} value={value.tagline ?? ""} onChange={(e) => onChange({ tagline: e.target.value })} disabled={disabled} placeholder="Optional public title" /></Field>
      </div>
      <div className="mt-4"><Field label="Biography" htmlFor="bio"><Textarea id="bio" rows={5} maxLength={5000} value={value.bio ?? ""} onChange={(e) => onChange({ bio: e.target.value })} disabled={disabled} /></Field></div>
    </StaffFormSection>
    <StaffFormSection title="Contact" description="Private contact details are restricted to authorized administrators.">
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Email" htmlFor="email"><Input id="email" type="email" maxLength={254} value={value.email ?? ""} onChange={(e) => onChange({ email: e.target.value })} disabled={disabled} /></Field><Field label="Primary phone" htmlFor="phone"><Input id="phone" type="tel" maxLength={40} value={value.phone ?? ""} onChange={(e) => onChange({ phone: e.target.value })} disabled={disabled} /></Field><Field label="Secondary phone" htmlFor="phoneSecondary"><Input id="phoneSecondary" type="tel" maxLength={40} value={value.phoneSecondary ?? ""} onChange={(e) => onChange({ phoneSecondary: e.target.value })} disabled={disabled} /></Field><Field label="Next of kin" htmlFor="nextOfKin"><Input id="nextOfKin" maxLength={160} value={value.nextOfKin ?? ""} onChange={(e) => onChange({ nextOfKin: e.target.value })} disabled={disabled} /></Field></div>
    </StaffFormSection>
  </>;
}
