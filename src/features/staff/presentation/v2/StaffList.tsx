import { useEffect, useMemo, useState } from "react";
import { Briefcase, Plus, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Staff } from "@prisma/client";
import { staffApi } from "@/features/staff/data/datasources/staff-api";
import { staffRoleLabel } from "@/features/staff/domain/entities/staff-management";

export default function StaffList() {
  const [staff, setStaff] = useState<Staff[]>([]); const [query, setQuery] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = () => { setLoading(true); staffApi.list().then(setStaff).catch((e) => setError(e.message)).finally(() => setLoading(false)); };
  useEffect(load, []);
  const filtered = useMemo(() => staff.filter((person) => `${person.firstName} ${person.lastName} ${person.email ?? ""} ${person.role}`.toLowerCase().includes(query.toLowerCase())), [staff, query]);
  async function remove(person: Staff) { if (!window.confirm(`Delete ${person.firstName} ${person.lastName}? Team assignments will also be removed.`)) return; try { await staffApi.remove(person.id); load(); } catch (e) { setError(e instanceof Error ? e.message : "Unable to delete staff"); } }
  if (loading) return <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>;
  return <div className="space-y-6 rounded-3xl bg-[#f5efe6] p-4 sm:p-8"><header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#d8cbb8] pb-6"><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a56a39]">People & operations</p><h1 className="mt-2 flex items-center gap-2 font-heading text-3xl font-semibold text-[#27231f]"><Briefcase className="h-7 w-7" />Staff</h1><p className="mt-2 text-sm text-[#746b61]">Manage staff profiles, compliance details, and team assignments.</p></div><Button asChild><a href="/admin/staff/new"><Plus className="mr-2 h-4 w-4" />Add staff</a></Button></header>
    {error && <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="relative max-w-lg"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search staff" className="pl-9" placeholder="Search by name, email, or role" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
    {filtered.length === 0 ? <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No staff members match this search.</CardContent></Card> : <div className="grid gap-3 md:grid-cols-2">{filtered.map((person) => <Card key={person.id} className={!person.active ? "opacity-65" : ""}><CardContent className="flex items-start justify-between gap-4 p-5"><div className="min-w-0"><h2 className="truncate font-semibold text-[#27231f]">{person.firstName} {person.lastName}</h2><p className="mt-1 text-sm text-[#746b61]">{staffRoleLabel(person.role)}</p>{person.email && <p className="mt-1 truncate text-xs text-[#85796c]">{person.email}</p>}<div className="mt-3 flex gap-2">{!person.active && <Badge variant="secondary">Inactive</Badge>}<Badge variant="outline">{person.approved ? "Approved" : "Pending"}</Badge></div></div><div className="flex shrink-0 gap-2"><Button variant="outline" size="sm" asChild><a href={`/admin/staff/${person.id}`}>Edit</a></Button><Button variant="ghost" size="icon" aria-label={`Delete ${person.firstName} ${person.lastName}`} onClick={() => remove(person)}><Trash2 className="h-4 w-4" /></Button></div></CardContent></Card>)}</div>}
  </div>;
}
