import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import EntityAvatar from "@/components/EntityAvatar";
import type { FormTeam } from "../hooks/useSeasonForm";

interface Props {
	/** Prefilled name when editing; empty when adding. */
	initialName?: string;
	/** Lowercased names already used by other conferences — for duplicate checks. */
	existingNames: string[];
	/**
	 * When provided, the modal shows a team picker; checked teams get rostered
	 * under the season's single league on save. When undefined, name-only.
	 */
	teams?: FormTeam[];
	initialTeamIds?: string[];
	/** League the picked teams will be rostered under, for the hint line. */
	leagueName?: string | null;
	onClose: () => void;
	onSubmit: (name: string, teamIds?: string[]) => void;
}

/**
 * Captures a conference name — and, on single-league seasons, the teams to put
 * in it — for the season form. Purely local: it hands values back to form state,
 * and the season save rosters + assigns the teams. On multi-/no-league seasons
 * it's name-only, and teams are assigned later on the Teams tab.
 */
export default function ConferenceNameModal({
	initialName,
	existingNames,
	teams,
	initialTeamIds,
	leagueName,
	onClose,
	onSubmit,
}: Props) {
	const isEdit = initialName !== undefined;
	const canPickTeams = teams !== undefined;
	const [name, setName] = useState(initialName ?? "");
	const [selected, setSelected] = useState<Set<string>>(() => new Set(initialTeamIds ?? []));

	const trimmed = name.trim();
	const duplicate = existingNames.includes(trimmed.toLowerCase());
	const error = !trimmed ? "" : duplicate ? "A conference with that name already exists." : "";
	const canSave = trimmed.length > 0 && !duplicate;

	const toggle = (teamId: string) =>
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(teamId)) next.delete(teamId);
			else next.add(teamId);
			return next;
		});

	const submit = () => {
		if (!canSave) return;
		onSubmit(trimmed, canPickTeams ? [...selected] : undefined);
		onClose();
	};

	const sortedTeams = useMemo(() => [...(teams ?? [])].sort((a, b) => a.name.localeCompare(b.name)), [teams]);

	return (
		<div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/60" onClick={onClose} />

			<div
				role="dialog"
				aria-modal="true"
				aria-label={isEdit ? "Edit conference" : "Add conference"}
				className="relative z-10 flex max-h-[82vh] w-full max-w-[460px] flex-col overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)] shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
			>
				<div className="flex items-center justify-between border-b border-[var(--bord2)] px-5 py-4">
					<h3 className="font-['Anton'] text-[18px] uppercase text-[var(--tx)]">
						{isEdit ? "Edit conference" : "Add conference"}
					</h3>
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
							if (e.key === "Enter" && !canPickTeams) submit();
						}}
						placeholder="e.g. East"
						className={`w-full rounded-lg border bg-[var(--surf2)] px-3.5 py-2.5 font-['Archivo'] text-[14px] text-[var(--tx)] outline-none placeholder:text-[var(--faint)] focus:border-[var(--brand)] ${
							error ? "border-[var(--brand)]" : "border-[var(--bord)]"
						}`}
					/>
					{error && <p className="mt-1.5 font-['Archivo'] text-[11.5px] text-[var(--brand)]">{error}</p>}

					{canPickTeams ? (
						<div className="mt-4">
							<div className="mb-1.5 flex items-baseline justify-between">
								<span className="font-['Archivo'] text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--txd)]">
									Teams
								</span>
								<span className="font-['Space_Mono'] text-[11px] text-[var(--txm)]">{selected.size} selected</span>
							</div>
							{sortedTeams.length === 0 ? (
								<p className="rounded-xl border border-dashed border-[var(--bord)] px-4 py-6 text-center font-['Archivo'] text-[12.5px] text-[var(--txm)]">
									No teams exist yet. Create teams first, then add them to a conference.
								</p>
							) : (
								<div className="flex flex-col gap-1.5">
									{sortedTeams.map((team) => {
										const on = selected.has(team.id);
										return (
											<button
												key={team.id}
												type="button"
												aria-pressed={on}
												onClick={() => toggle(team.id)}
												className={`flex items-center gap-3 rounded-xl border px-3.5 py-2 text-left ${
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
													className="h-7 w-7 rounded-full text-[12px]"
												/>
												<span className="min-w-0 flex-1 truncate font-['Archivo'] text-[13px] font-bold text-[var(--tx)]">
													{team.name}
												</span>
											</button>
										);
									})}
								</div>
							)}
							<p className="mt-2 font-['Archivo'] text-[11.5px] leading-[1.5] text-[var(--txm)]">
								Selected teams are added to the season{leagueName ? ` under ${leagueName}` : ""} and placed in this
								conference when you save.
							</p>
						</div>
					) : (
						<p className="mt-2 font-['Archivo'] text-[11.5px] leading-[1.5] text-[var(--txm)]">
							Link the season to a single league to pick teams here — otherwise assign them on the Teams tab after
							saving.
						</p>
					)}
				</div>

				<div className="flex items-center justify-end gap-2 border-t border-[var(--bord2)] px-5 py-4">
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-4 py-2 font-['Archivo'] text-[13px] font-bold text-[var(--txd)] hover:border-[var(--brand)]"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={submit}
						disabled={!canSave}
						className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 font-['Archivo'] text-[13px] font-extrabold uppercase tracking-[0.04em] text-white hover:bg-[var(--brandlt)] disabled:cursor-not-allowed disabled:opacity-50"
					>
						<Check className="h-[15px] w-[15px]" />
						{isEdit ? "Save" : "Add"}
					</button>
				</div>
			</div>
		</div>
	);
}
