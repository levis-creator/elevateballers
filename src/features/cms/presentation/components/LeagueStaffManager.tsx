import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MediaLibraryPicker } from "./MediaLibraryPicker";

/** Org-wide league staff record (mirrors the LeagueStaff model). */
interface LeagueStaff {
	id: string;
	name: string;
	role: string;
	department: string;
	email: string | null;
	photo: string | null;
	bio: string | null;
	active: boolean;
	sortOrder: number;
}

type FormState = {
	id?: string;
	name: string;
	role: string;
	department: string;
	email: string;
	photo: string;
	bio: string;
	active: boolean;
	sortOrder: number;
};

const KNOWN_DEPARTMENTS = ["Leadership", "League Management", "Officiating", "Operations & Media"];

const EMPTY: FormState = { name: "", role: "", department: "", email: "", photo: "", bio: "", active: true, sortOrder: 0 };

/**
 * Admin manager for org-wide League Staff (the /staff page source). CRUD over
 * `/api/league-staff`, grouped by department. Team coaches are managed on their
 * team page, not here.
 */
export default function LeagueStaffManager() {
	const [staff, setStaff] = useState<LeagueStaff[]>([]);
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
			const res = await fetch("/api/league-staff?includeInactive=true", { credentials: "same-origin" });
			if (!res.ok) throw new Error(`Failed to load (${res.status})`);
			setStaff(await res.json());
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to load league staff");
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		load();
	}, []);

	function openCreate() {
		setForm(EMPTY);
		setOpen(true);
	}
	function openEdit(s: LeagueStaff) {
		setForm({
			id: s.id,
			name: s.name,
			role: s.role,
			department: s.department,
			email: s.email ?? "",
			photo: s.photo ?? "",
			bio: s.bio ?? "",
			active: s.active,
			sortOrder: s.sortOrder,
		});
		setOpen(true);
	}

	async function save() {
		if (!form.name.trim() || !form.role.trim() || !form.department.trim()) {
			setError("Name, role and department are required.");
			return;
		}
		setSaving(true);
		setError("");
		try {
			const payload = {
				name: form.name.trim(),
				role: form.role.trim(),
				department: form.department.trim(),
				email: form.email.trim() || null,
				photo: form.photo.trim() || null,
				bio: form.bio.trim() || null,
				active: form.active,
				sortOrder: Number(form.sortOrder) || 0,
			};
			const res = await fetch(form.id ? `/api/league-staff/${form.id}` : "/api/league-staff", {
				method: form.id ? "PUT" : "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "same-origin",
				body: JSON.stringify(payload),
			});
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error || `Save failed (${res.status})`);
			}
			setOpen(false);
			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Save failed");
		} finally {
			setSaving(false);
		}
	}

	async function remove(s: LeagueStaff) {
		if (!confirm(`Delete “${s.name}” from league staff? This cannot be undone.`)) return;
		setError("");
		try {
			const res = await fetch(`/api/league-staff/${s.id}`, { method: "DELETE", credentials: "same-origin" });
			if (!res.ok) throw new Error(`Delete failed (${res.status})`);
			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Delete failed");
		}
	}

	// Group by department (known departments first, then any others), sorted within by sortOrder → name.
	const departments = [...new Set([...KNOWN_DEPARTMENTS, ...staff.map((s) => s.department)])].filter((d) =>
		staff.some((s) => s.department === d),
	);

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold">League Staff</h1>
					<p className="text-sm text-muted-foreground">
						Org-wide people shown on the public /staff page, grouped by department. Team coaches are managed on each team.
					</p>
				</div>
				<Button onClick={openCreate}>Add league staff</Button>
			</div>

			{error && <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

			{loading ? (
				<p className="text-sm text-muted-foreground">Loading…</p>
			) : staff.length === 0 ? (
				<Card>
					<CardContent className="py-10 text-center text-sm text-muted-foreground">
						No league staff yet. Click “Add league staff” to create the first record.
					</CardContent>
				</Card>
			) : (
				departments.map((dept) => {
					const people = staff
						.filter((s) => s.department === dept)
						.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
					return (
						<div key={dept} className="space-y-2">
							<div className="flex items-center gap-3">
								<h2 className="text-lg font-semibold">{dept}</h2>
								<span className="text-xs text-muted-foreground">{people.length} member{people.length === 1 ? "" : "s"}</span>
							</div>
							<div className="grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
								{people.map((s) => (
									<Card key={s.id} className={s.active ? "" : "opacity-60"}>
										<CardContent className="flex items-center justify-between gap-3 py-3">
											<div className="min-w-0">
												<div className="flex items-center gap-2">
													<span className="truncate font-semibold">{s.name}</span>
													{!s.active && <Badge variant="secondary">Inactive</Badge>}
												</div>
												<div className="truncate text-sm text-muted-foreground">{s.role}</div>
												{s.email && <div className="truncate text-xs text-muted-foreground">{s.email}</div>}
											</div>
											<div className="flex flex-shrink-0 gap-2">
												<Button variant="outline" size="sm" onClick={() => openEdit(s)}>
													Edit
												</Button>
												<Button variant="outline" size="sm" onClick={() => remove(s)}>
													Delete
												</Button>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</div>
					);
				})
			)}

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{form.id ? "Edit league staff" : "Add league staff"}</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div>
							<Label htmlFor="ls-name">Name *</Label>
							<Input id="ls-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Anthony Njenga" />
						</div>
						<div>
							<Label htmlFor="ls-role">Role *</Label>
							<Input id="ls-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Head of Referees" />
						</div>
						<div>
							<Label htmlFor="ls-dept">Department *</Label>
							<Input id="ls-dept" list="ls-departments" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Officiating" />
							<datalist id="ls-departments">
								{KNOWN_DEPARTMENTS.map((d) => (
									<option key={d} value={d} />
								))}
							</datalist>
						</div>
						<div>
							<Label htmlFor="ls-email">Email</Label>
							<Input id="ls-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="optional" />
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
						<div>
							<Label htmlFor="ls-bio">Bio</Label>
							<Textarea
								id="ls-bio"
								value={form.bio}
								onChange={(e) => setForm({ ...form, bio: e.target.value })}
								placeholder="Shown on the Leadership spotlight cards. Optional for other departments."
								rows={3}
							/>
						</div>
						<div className="flex items-center gap-6">
							<div className="flex items-center gap-2">
								<Switch id="ls-active" checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
								<Label htmlFor="ls-active">Active</Label>
							</div>
							<div className="flex items-center gap-2">
								<Label htmlFor="ls-sort">Sort order</Label>
								<Input id="ls-sort" type="number" className="w-24" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
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
