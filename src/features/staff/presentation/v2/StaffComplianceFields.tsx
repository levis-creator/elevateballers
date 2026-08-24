import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { StaffFormData } from "@/features/staff/data/datasources/staff-api";
import { Field, StaffFormSection, staffInputClass } from "./StaffFormSection";
import { StaffPortalAccess } from "./StaffPortalAccess";

export function StaffComplianceFields({ staffId, value, onChange, disabled }: { staffId?: string; value: StaffFormData; onChange: (patch: Partial<StaffFormData>) => void; disabled?: boolean }) {
  return <>
    <StaffFormSection title="Credentials" description="Eligibility to be on a bench. Expiries drive warnings on the staff list.">
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Coaching licence" htmlFor="licenseNumber"><Input className={staffInputClass} id="licenseNumber" maxLength={120} value={value.licenseNumber ?? ""} onChange={(e) => onChange({ licenseNumber: e.target.value })} disabled={disabled} placeholder="None on file" /></Field><Field label="Licence expires" htmlFor="licenseExpiresAt"><Input className={staffInputClass} id="licenseExpiresAt" type="date" value={value.licenseExpiresAt?.slice(0, 10) ?? ""} onChange={(e) => onChange({ licenseExpiresAt: e.target.value || null })} disabled={disabled} placeholder="2027-06-30" /></Field><Field label="Safeguarding check" htmlFor="safeguardingStatus"><Input className={staffInputClass} id="safeguardingStatus" maxLength={80} value={value.safeguardingStatus ?? ""} onChange={(e) => onChange({ safeguardingStatus: e.target.value })} disabled={disabled} placeholder="Not started" /></Field><Field label="National ID" htmlFor="idNumber"><div className="flex items-center gap-2"><Input className={staffInputClass} id="idNumber" maxLength={120} value={value.idNumber ?? ""} onChange={(e) => onChange({ idNumber: e.target.value })} disabled={disabled} placeholder="•••• 4821" /><Button type="button" variant="outline" disabled className="shrink-0 border-[var(--bord)] bg-[var(--surf2)] text-[var(--txd)]">Reveal</Button></div><p className="mt-1.5 font-body text-[11px] text-[var(--faint)]">Sensitive field. Reveal auditing is not available in this flow.</p></Field></div>
    </StaffFormSection>
    <StaffPortalAccess staffId={staffId} disabled={disabled} />
  </>;
}
