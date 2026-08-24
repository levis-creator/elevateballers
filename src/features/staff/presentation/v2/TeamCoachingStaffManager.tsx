import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaLibraryPicker } from "@/features/cms/presentation/components/MediaLibraryPicker";
import { teamCoachingStaffApi, type TeamCoachingStaffRecord } from "@/features/staff/data/datasources/team-coaching-staff-api";

type CoachType = TeamCoachingStaffRecord["type"];
type CoachingStaff = TeamCoachingStaffRecord;

type FormState = {
	id?: string;
	name: string;
	role: string;
	type: CoachType;
	email: string;
	photo: string;
	active: boolean;
	sortOrder: number;
};

const EMPTY: FormState = { name: "", role: "", type: "coach", email: "", photo: "", active: true, sortOrder: 0 };
const TYPE_LABEL: Record<CoachType, string> = { coach: "Coach", manager: "Manager", support: "Support" };
const TYPE_RANK: Record<CoachType, number> = { coach: 0, manager: 1, support: 2 };

interface Props {
	teamId: string;
}

/**
 * Admin manager for a team's Coaching Staff (the new `team_staff_members` table,
 * shown in the "Coaching Staff" section on the public team page). CRUD over
 * `/api/teams/{teamId}/coaching-staff`. Separate from the org-wide League Staff.
 */
export default function TeamCoachingStaffManager({ teamId }: Props) {
	const [staff, setStaff] = useState<CoachingStaff[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [open, setOpen] = useState(false);
	const [form, setForm] = useState<FormState>(EMPTY);
	const [saving, setSaving] = useState(false);
	const [pickerOpen, setPickerOpen] = useState(false);

	async function load() {
		setLoading(true);
		setError("");
		try {
			setStaff(await teamCoachingStaffApi.list(teamId));
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to load coaching staff");
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		load();
	}, [teamId]);

	function openCreate() {
		setForm(EMPTY);
		setOpen(true);
	}
	function openEdit(s: CoachingStaff) {
		setForm({ id: s.id, name: s.name, role: s.role, type: s.type, email: s.email ?? "", photo: s.photo ?? "", active: s.active, sortOrder: s.sortOrder });
		setOpen(true);
	}

	async function save() {
		if (!form.name.trim() || !form.role.trim()) {
			setError("Name and role are required.");
			return;
		}
		setSaving(true);
		setError("");
		try {
			const payload: Record<string, unknown> = {
				name: form.name.trim(),
				role: form.role.trim(),
				type: form.type,
				email: form.email.trim() || null,
				photo: form.photo.trim() || null,
				sortOrder: Number(form.sortOrder) || 0,
				active: form.active,
			};
			if (form.id) payload.id = form.id;
			await teamCoachingStaffApi.save(teamId, payload, form.id);
			setOpen(false);
			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Save failed");
		} finally {
			setSaving(false);
		}
	}

	async function remove(s: CoachingStaff) {
		if (!confirm(`Remove “${s.name}” from this team's coaching staff?`)) return;
		setError("");
		try {
			await teamCoachingStaffApi.remove(teamId, s.id);
			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Delete failed");
		}
	}

	const ordered = [...staff].sort((a, b) => TYPE_RANK[a.type] - TYPE_RANK[b.type] || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="text-xl font-bold">Coaching Staff</h2>
					<p className="text-sm text-muted-foreground">Head coach, assistants, manager and support for this team (shown on the public team page).</p>
				</div>
				<Button onClick={openCreate}>Add coaching staff</Button>
			</div>

			{error && <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

			{loading ? (
				<p className="text-sm text-muted-foreground">Loading…</p>
			) : ordered.length === 0 ? (
				<Card>
					<CardContent className="py-8 text-center text-sm text-muted-foreground">No coaching staff yet. Add the head coach to get started.</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
					{ordered.map((s) => (
						<Card key={s.id} className={s.active ? "" : "opacity-60"}>
							<CardContent className="flex items-center justify-between gap-3 py-3">
								<div className="min-w-0">
									<div className="flex items-center gap-2">
										<span className="truncate font-semibold">{s.name}</span>
										<Badge variant="secondary">{TYPE_LABEL[s.type]}</Badge>
										{!s.active && <Badge variant="outline">Inactive</Badge>}
									</div>
									<div className="truncate text-sm text-muted-foreground">{s.role}</div>
									{s.email && <div className="truncate text-xs text-muted-foreground">{s.email}</div>}
								</div>
								<div className="flex flex-shrink-0 gap-2">
									<Button variant="outline" size="sm" onClick={() => openEdit(s)}>
										Edit
									</Button>
									<Button variant="outline" size="sm" onClick={() => remove(s)}>
										Remove
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{form.id ? "Edit coaching staff" : "Add coaching staff"}</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div>
							<Label htmlFor="cs-name">Name *</Label>
							<Input id="cs-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sky Mburu" />
						</div>
						<div>
							<Label htmlFor="cs-role">Role *</Label>
							<Input id="cs-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Head Coach" />
						</div>
						<div>
							<Label>Type *</Label>
							<Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as CoachType })}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="coach">Coach</SelectItem>
									<SelectItem value="manager">Manager</SelectItem>
									<SelectItem value="support">Support</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label htmlFor="cs-email">Email</Label>
							<Input id="cs-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="optional" />
						</div>
						<div>
							<Label>Photo</Label>
							<div className="mt-1 flex items-center gap-3">
								<div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
									{form.photo ? (
										<img src={form.photo} alt="" className="h-full w-full object-cover" />
									) : (
										<span className="text-[11px] text-muted-foreground">None</span>
									)}
								</div>
								<div className="flex flex-col items-start gap-1.5">
									<Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
										{form.photo ? "Change photo" : "Select / upload photo"}
									</Button>
									{form.photo && (
										<Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, photo: "" })}>
											Remove
										</Button>
									)}
								</div>
							</div>
						</div>
						<div className="flex items-center gap-6">
							<div className="flex items-center gap-2">
								<Switch id="cs-active" checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
								<Label htmlFor="cs-active">Active</Label>
							</div>
							<div className="flex items-center gap-2">
								<Label htmlFor="cs-sort">Sort order</Label>
								<Input id="cs-sort" type="number" className="w-24" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
							Cancel
						</Button>
						<Button onClick={save} disabled={saving}>
							{saving ? "Saving…" : form.id ? "Save changes" : "Create"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<MediaLibraryPicker
				open={pickerOpen}
				onOpenChange={setPickerOpen}
				onSelect={(url) => setForm((f) => ({ ...f, photo: url }))}
				title="Select or upload staff photo"
			/>
		</div>
	);
}
