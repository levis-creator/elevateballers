import { useState } from "react";
import { Info, LayoutGrid, Pencil, Plus, X } from "lucide-react";
import type { SeasonConferenceInput, SeasonFormErrors } from "@/features/seasons/domain/entities/season-form";
import type { FormTeam } from "../hooks/useSeasonForm";
import FormCard, { FieldError } from "./FormCard";
import ConferenceNameModal from "./ConferenceNameModal";

interface Props {
	conferences: SeasonConferenceInput[];
	errors: SeasonFormErrors;
	touched: boolean;
	/** All teams — the pool for the conference modal (only used when single-league). */
	teams: FormTeam[];
	/** True when the season is linked to exactly one league (teams can be picked here). */
	canPickTeams: boolean;
	/** The single linked league's name, for the modal hint. */
	leagueName: string | null;
	onAdd: (name: string, teamIds?: string[]) => void;
	onUpdate: (index: number, name: string, teamIds?: string[]) => void;
	onRemove: (index: number) => void;
}

/** null → closed; { index: null } → add; { index } → edit that row. */
type ModalState = { index: number | null } | null;

export default function SeasonConferencesCard({
	conferences,
	errors,
	touched,
	teams,
	canPickTeams,
	leagueName,
	onAdd,
	onUpdate,
	onRemove,
}: Props) {
	const [modal, setModal] = useState<ModalState>(null);

	const count = conferences.length;
	const subtitle =
		count === 0 ? "None yet — teams stay ungrouped" : `${count} ${count === 1 ? "conference" : "conferences"}`;

	const action = (
		<button
			type="button"
			onClick={() => setModal({ index: null })}
			className="flex items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-2 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
		>
			<Plus className="h-[14px] w-[14px]" />
			Add Conference
		</button>
	);

	// Names in use, lowercased, excluding the row being edited — for the modal's
	// duplicate check so a rename to its own current value is still allowed.
	const otherNames = (skipIndex: number | null) =>
		conferences
			.filter((_, i) => i !== skipIndex)
			.map((conference) => conference.name.trim().toLowerCase())
			.filter(Boolean);

	return (
		<FormCard icon={LayoutGrid} title="Conferences" subtitle={subtitle} action={action}>
			{count === 0 ? (
				<p className="font-['Archivo'] text-[12.5px] text-[var(--txm)]">
					No conferences — the season's teams won't be grouped. Add one (e.g. East / West) to split them.
				</p>
			) : (
				<div className="flex flex-col gap-2">
					{conferences.map((conference, index) => {
						const teamCount = conference.teamIds?.length ?? 0;
						return (
							// Positional key: rows have no stable id until saved and are never reordered.
							// eslint-disable-next-line react/no-array-index-key
							<div
								key={index}
								className="flex items-center gap-2 rounded-[10px] border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-2.5"
							>
								<LayoutGrid className="h-[15px] w-[15px] flex-shrink-0 text-[var(--brand)]" />
								<span className="min-w-0 flex-1 truncate font-['Archivo'] text-[13.5px] font-bold text-[var(--tx)]">
									{conference.name.trim() || <span className="italic text-[var(--txm)]">Unnamed</span>}
								</span>
								{canPickTeams && (
									<span className="flex-shrink-0 font-['Space_Mono'] text-[11px] text-[var(--txm)]">
										{teamCount} {teamCount === 1 ? "team" : "teams"}
									</span>
								)}
								<button
									type="button"
									onClick={() => setModal({ index })}
									aria-label={`Edit conference ${index + 1}`}
									className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg border border-[var(--bord)] bg-[var(--surf)] text-[var(--txm)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
								>
									<Pencil className="h-[13px] w-[13px]" />
								</button>
								<button
									type="button"
									onClick={() => onRemove(index)}
									aria-label={`Remove conference ${index + 1}`}
									className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg border border-[var(--bord)] bg-[var(--surf)] text-[var(--txm)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
								>
									<X className="h-[14px] w-[14px]" />
								</button>
							</div>
						);
					})}
				</div>
			)}

			<FieldError message={touched ? errors.conferences : undefined} />

			<p className="mt-3 flex items-start gap-2 font-['Archivo'] text-[11.5px] leading-[1.5] text-[var(--txm)]">
				<Info className="mt-0.5 h-[13px] w-[13px] flex-shrink-0" />
				Conferences group a season's teams (e.g. East / West).{" "}
				{canPickTeams
					? "Pick each conference's teams here, or adjust them later on the Teams tab."
					: "Assign each team to one on the season's Teams tab."}
			</p>

			{modal && (
				<ConferenceNameModal
					initialName={modal.index === null ? undefined : conferences[modal.index]?.name ?? ""}
					existingNames={otherNames(modal.index)}
					teams={canPickTeams ? teams : undefined}
					initialTeamIds={modal.index === null ? [] : conferences[modal.index]?.teamIds ?? []}
					leagueName={leagueName}
					onClose={() => setModal(null)}
					onSubmit={(name, teamIds) => {
						if (modal.index === null) onAdd(name, teamIds);
						else onUpdate(modal.index, name, teamIds);
					}}
				/>
			)}
		</FormCard>
	);
}
