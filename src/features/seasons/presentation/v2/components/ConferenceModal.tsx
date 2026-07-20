import { useMemo, useState } from "react";
import { AlertCircle, Check, Loader2, Trash2, Users, X } from "lucide-react";
import EntityAvatar from "@/components/EntityAvatar";
import type { SeasonTeamSummary } from "@/features/seasons/domain/entities/season-detail";

interface Props {
	seasonId: string;
	/** null → create mode; otherwise editing this conference. */
	conference: { id: string; name: string } | null;
	/** The season's rostered teams — the only teams a conference can contain. */
	teams: SeasonTeamSummary[];
	onClose: () => void;
	/** Called after a successful save/delete so the parent can re-fetch. */
	onSaved: () => void | Promise<void>;
}

/**
 * Create or edit one conference and, in the same step, choose which of the
 * season's rostered teams belong to it. Checking a team that sits in another
 * conference moves it here on save.
 */
export default function ConferenceModal({ seasonId, conference, teams, onClose, onSaved }: Props) {
	const isEdit = conference !== null;
	const [name, setName] = useState(conference?.name ?? "");
	const [selected, setSelected] = useState<Set<string>>(
		() => new Set(isEdit ? teams.filter((t) => t.conferenceId === conference.id).map((t) => t.id) : []),
	);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [error, setError] = useState("");

	const trimmed = name.trim();
	const canSave = trimmed.length > 0 && !saving && !deleting;
	const selectedCount = selected.size;

	const toggle = (teamId: string) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(teamId)) next.delete(teamId);
			else next.add(teamId);
			return next;
		});
	};

	const save = async () => {
		if (!canSave) return;
		setSaving(true);
		setError("");
		try {
			const teamIds = [...selected];
			const res = await fetch(
				isEdit
					? `/api/seasons/${seasonId}/conferences/${conference.id}`
					: `/api/seasons/${seasonId}/conferences`,
				{
					method: isEdit ? "PATCH" : "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name: trimmed, teamIds }),
				},
			);
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(
					res.status === 409
						? "A conference with that name already exists in this season."
						: data?.error || "Could not save the conference.",
				);
			}
			await onSaved();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not save the conference.");
			setSaving(false);
		}
	};

	const remove = async () => {
		if (!isEdit) return;
		setDeleting(true);
		setError("");
		try {
			const res = await fetch(`/api/seasons/${seasonId}/conferences/${conference.id}`, { method: "DELETE" });
			if (!res.ok) throw new Error("failed");
			await onSaved();
			onClose();
		} catch {
			setError("Could not delete the conference. Please try again.");
			setDeleting(false);
			setConfirmDelete(false);
		}
	};

	const teamList = useMemo(
		() => [...teams].sort((a, b) => a.name.localeCompare(b.name)),
		[teams],
	);

	return (
		<div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/60" onClick={onClose} />

			<div
				role="dialog"
				aria-modal="true"
				aria-label={isEdit ? "Edit conference" : "Add conference"}
				className="relative z-10 flex max-h-[82vh] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)] shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
			>
				<div className="flex items-center justify-between border-b border-[var(--bord2)] px-5 py-4">
					<div>
						<h3 className="font-['Anton'] text-[18px] uppercase text-[var(--tx)]">
							{isEdit ? "Edit conference" : "Add conference"}
						</h3>
						<p className="font-['Space_Mono'] text-[11px] text-[var(--txm)]">
							{selectedCount} {selectedCount === 1 ? "team" : "teams"} selected
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close"
						className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--bord)] bg-[var(--surf2)] text-[var(--txm)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
					>
						<X className="h-[15px] w-[15px]" />
					</button>
				</div>

				<div className="eb-scroll min-h-0 flex-1 overflow-y-auto p-5">
					<label className="mb-1.5 block font-['Archivo'] text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--txd)]">
						Conference name <span className="text-[var(--brand)]">*</span>
					</label>
					<input
						type="text"
						value={name}
						autoFocus
						onChange={(e) => setName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") save();
						}}
						placeholder="e.g. East"
						className="w-full rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-2.5 font-['Archivo'] text-[14px] text-[var(--tx)] outline-none placeholder:text-[var(--faint)] focus:border-[var(--brand)]"
					/>

					<div className="mt-4 mb-1.5 font-['Archivo'] text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--txd)]">
						Teams in this conference
					</div>

					{teamList.length === 0 ? (
						<div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--bord)] px-4 py-8 text-center">
							<span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surf2)] text-[var(--txm)]">
								<Users className="h-[18px] w-[18px]" />
							</span>
							<p className="max-w-[320px] font-['Archivo'] text-[12.5px] text-[var(--txm)]">
								No teams are rostered in this season yet. Enter teams first, then assign them to a conference.
							</p>
						</div>
					) : (
						<div className="flex flex-col gap-1.5">
							{teamList.map((team) => {
								const on = selected.has(team.id);
								// Surface when checking this team would move it out of another conference.
								const elsewhere =
									team.conferenceId && team.conferenceId !== conference?.id ? team.conferenceName : null;
								return (
									<button
										key={team.id}
										type="button"
										aria-pressed={on}
										onClick={() => toggle(team.id)}
										className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left ${
											on
												? "border-[var(--brand)] bg-[var(--brand)]/[0.08]"
												: "border-[var(--bord)] bg-[var(--surf2)] hover:border-[var(--brand)]/40"
										}`}
									>
										<span
											className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px] ${
												on ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-[var(--bord)] text-transparent"
											}`}
										>
											<Check className="h-3 w-3" strokeWidth={3} />
										</span>
										<EntityAvatar
											seed={team.id}
											label={team.name}
											src={team.logo}
											className="h-8 w-8 rounded-full text-[13px]"
										/>
										<span className="min-w-0 flex-1">
											<span className="block truncate font-['Archivo'] text-[13px] font-bold text-[var(--tx)]">
												{team.name}
											</span>
											{elsewhere && (
												<span className="block font-['Space_Mono'] text-[10.5px] text-[var(--txm)]">
													Currently in {elsewhere}
												</span>
											)}
										</span>
									</button>
								);
							})}
						</div>
					)}

					{error && (
						<div className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--brand)]/40 bg-[var(--brand)]/[0.1] px-3.5 py-2.5 font-['Archivo'] text-[12.5px] text-[var(--brandsoft)]">
							<AlertCircle className="h-4 w-4 flex-shrink-0" />
							{error}
						</div>
					)}
				</div>

				<div className="flex items-center justify-between gap-2 border-t border-[var(--bord2)] px-5 py-4">
					{isEdit ? (
						confirmDelete ? (
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={remove}
									disabled={deleting}
									className="flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 py-2 font-['Archivo'] text-[12px] font-bold text-white hover:bg-[var(--brandlt)] disabled:opacity-50"
								>
									{deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
									Confirm delete
								</button>
								<button
									type="button"
									onClick={() => setConfirmDelete(false)}
									disabled={deleting}
									className="rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3 py-2 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] hover:border-[var(--brand)]"
								>
									Keep
								</button>
							</div>
						) : (
							<button
								type="button"
								onClick={() => setConfirmDelete(true)}
								disabled={saving}
								className="flex items-center gap-1.5 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3 py-2 font-['Archivo'] text-[12px] font-bold text-[var(--txm)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
							>
								<Trash2 className="h-3.5 w-3.5" />
								Delete
							</button>
						)
					) : (
						<span />
					)}

					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={onClose}
							disabled={saving || deleting}
							className="rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-4 py-2 font-['Archivo'] text-[13px] font-bold text-[var(--txd)] hover:border-[var(--brand)] disabled:opacity-50"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={save}
							disabled={!canSave}
							className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 font-['Archivo'] text-[13px] font-extrabold uppercase tracking-[0.04em] text-white hover:bg-[var(--brandlt)] disabled:cursor-not-allowed disabled:opacity-50"
						>
							{saving ? <Loader2 className="h-[15px] w-[15px] animate-spin" /> : <Check className="h-[15px] w-[15px]" />}
							{isEdit ? "Save" : "Create"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
