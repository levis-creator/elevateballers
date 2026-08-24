import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { StaffFormData } from "@/features/staff/data/datasources/staff-api";
import { Field, StaffFormSection } from "./StaffFormSection";
import ImageUpload from "@/components/ImageUpload";

export function StaffComplianceFields({ value, onChange, disabled }: { value: StaffFormData; onChange: (patch: Partial<StaffFormData>) => void; disabled?: boolean }) {
  return <>
    <StaffFormSection title="Photo & visibility" description="Choose the profile image and whether this record is active in public listings.">
      <ImageUpload value={value.image ?? ""} onChange={(image) => onChange({ image })} disabled={disabled} label="Profile image" helperText="Use a clear staff portrait." folder="staff" />
      <div className="mt-5 flex items-center gap-3"><Switch id="active" checked={value.active !== false} onCheckedChange={(active) => onChange({ active })} disabled={disabled} /><label htmlFor="active" className="text-sm font-medium">Active staff record</label></div>
    </StaffFormSection>
    <StaffFormSection title="Safeguarding & licensing" description="Operational checks remain private and are only visible to administrators.">
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Safeguarding status" htmlFor="safeguardingStatus"><Input id="safeguardingStatus" maxLength={80} value={value.safeguardingStatus ?? ""} onChange={(e) => onChange({ safeguardingStatus: e.target.value })} disabled={disabled} placeholder="e.g. Verified" /></Field><Field label="ID number" htmlFor="idNumber"><Input id="idNumber" maxLength={120} value={value.idNumber ?? ""} onChange={(e) => onChange({ idNumber: e.target.value })} disabled={disabled} /></Field><Field label="License number" htmlFor="licenseNumber"><Input id="licenseNumber" maxLength={120} value={value.licenseNumber ?? ""} onChange={(e) => onChange({ licenseNumber: e.target.value })} disabled={disabled} /></Field><Field label="License expiry" htmlFor="licenseExpiresAt"><Input id="licenseExpiresAt" type="date" value={value.licenseExpiresAt?.slice(0, 10) ?? ""} onChange={(e) => onChange({ licenseExpiresAt: e.target.value || null })} disabled={disabled} /></Field></div>
    </StaffFormSection>
    <StaffFormSection title="Internal notes" description="Notes for authorized administrators; never shown on the public staff directory."><Field label="Internal note" htmlFor="internalNote"><Textarea id="internalNote" rows={4} maxLength={5000} value={value.internalNote ?? ""} onChange={(e) => onChange({ internalNote: e.target.value })} disabled={disabled} /></Field></StaffFormSection>
  </>;
}
