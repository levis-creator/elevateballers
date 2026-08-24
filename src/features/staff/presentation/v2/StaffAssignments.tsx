import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { StaffFormData } from "@/features/staff/data/datasources/staff-api";
import { StaffFormSection } from "./StaffFormSection";

type Team = { id: string; name: string };
export function StaffAssignments({ value, onChange, disabled }: { value: StaffFormData; onChange: (patch: Partial<StaffFormData>) => void; disabled?: boolean }) {
  const [teams, setTeams] = useState<Team[]>([]);
  useEffect(() => { fetch("/api/teams?approved=true", { credentials: "same-origin" }).then((r) => r.ok ? r.json() : []).then((rows: Team[]) => setTeams(rows)).catch(() => setTeams([])); }, []);
  const assignments = value.assignments ?? [];
  const toggle = (teamId: string, checked: boolean) => onChange({ assignments: checked ? [...assignments, { teamId, role: value.role }] : assignments.filter((a) => a.teamId !== teamId) });
  return <StaffFormSection title="Team assignments" description="Assign this staff member to teams without changing the separate team-coaching-staff records.">
    {teams.length === 0 ? <p className="text-sm text-[#746b61]">No eligible teams were returned. Save the profile first, then assign from a team page if needed.</p> : <div className="grid gap-3 sm:grid-cols-2">{teams.map((team) => <label key={team.id} className="flex items-center gap-3 rounded-lg border border-[#e5dacb] p-3"><Checkbox checked={assignments.some((a) => a.teamId === team.id)} onCheckedChange={(checked) => toggle(team.id, checked === true)} disabled={disabled} /><span className="text-sm">{team.name}</span></label>)}</div>}
  </StaffFormSection>;
}
