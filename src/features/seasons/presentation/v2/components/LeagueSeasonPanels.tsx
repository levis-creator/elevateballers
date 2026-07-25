import { CalendarRange, Check, Trophy } from "lucide-react";
import {
	BRACKET_TYPES,
	type LeagueSeasonFormValues,
	type SeasonFormErrors,
} from "@/features/seasons/domain/entities/season-form";
import type { FormLeague, FormTeam } from "../hooks/useSeasonForm";
import FormCard, { FieldError, Label } from "./FormCard";
import SeasonConferencesCard from "./SeasonConferencesCard";

interface Props {
	competitions: LeagueSeasonFormValues[];
	leagues: FormLeague[];
	teams: FormTeam[];
	errors: SeasonFormErrors;
	touched: boolean;
	onChange: (leagueId: string, patch: Partial<LeagueSeasonFormValues>) => void;
	onAddConference: (leagueId: string, name: string, teamIds?: string[]) => void;
	onUpdateConference: (leagueId: string, index: number, name: string, teamIds?: string[]) => void;
	onRemoveConference: (leagueId: string, index: number) => void;
}

const inputClass =
	"w-full rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3 py-2.5 text-[13px] text-[var(--tx)] outline-none focus:border-[var(--brand)]";

const statuses = [
	["DRAFT", "Draft"],
	["REGISTRATION", "Registration"],
	["SCHEDULED", "Scheduled"],
	["ACTIVE", "Active"],
	["PLAYOFFS", "Playoffs"],
	["COMPLETED", "Completed"],
] as const;

export default function LeagueSeasonPanels({
	competitions,
	leagues,
	teams,
	errors,
	touched,
	onChange,
	onAddConference,
	onUpdateConference,
	onRemoveConference,
}: Props) {
	return (
		<FormCard
			icon={Trophy}
			title="League competitions"
			subtitle="Each league has its own dates, structure and lifecycle"
		>
			<div className="flex flex-col gap-4">
				{competitions.map((competition) => {
					const league = leagues.find((row) => row.id === competition.leagueId);
					return (
						<div
							key={competition.leagueId}
							className="rounded-xl border border-[var(--bord)] bg-[var(--surf2)] p-4"
						>
							<div className="flex items-center justify-between gap-3">
								<div>
									<h3 className="font-['Archivo'] text-[15px] font-extrabold text-[var(--tx)]">
										{competition.leagueName}
									</h3>
									<p className="text-[11.5px] text-[var(--txm)]">
										{league?.teamCount ?? 0} available teams
									</p>
								</div>
								<button
									type="button"
									role="switch"
									aria-checked={competition.enabled}
									onClick={() => onChange(competition.leagueId, { enabled: !competition.enabled })}
									className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase ${
										competition.enabled
											? "bg-[#1f9d55]/15 text-[#1f9d55]"
											: "bg-[var(--surf)] text-[var(--txm)]"
									}`}
								>
									{competition.enabled && <Check className="h-3.5 w-3.5" />}
									{competition.enabled ? "Included" : "Not included"}
								</button>
							</div>

							{competition.enabled && (
								<div className="mt-4 flex flex-col gap-4 border-t border-[var(--bord)] pt-4">
									<div className="grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
										<div>
											<Label required>Starts</Label>
											<input
												type="date"
												value={competition.startDate}
												onChange={(event) =>
													onChange(competition.leagueId, { startDate: event.target.value })
												}
												className={inputClass}
											/>
										</div>
										<div>
											<Label required>Ends</Label>
											<input
												type="date"
												value={competition.endDate}
												onChange={(event) =>
													onChange(competition.leagueId, { endDate: event.target.value })
												}
												className={inputClass}
											/>
										</div>
										<div>
											<Label>Status</Label>
											<select
												value={competition.status}
												onChange={(event) =>
													onChange(competition.leagueId, {
														status: event.target.value as LeagueSeasonFormValues["status"],
													})
												}
												className={inputClass}
											>
												{statuses.map(([value, label]) => (
													<option key={value} value={value}>{label}</option>
												))}
											</select>
										</div>
										<div>
											<Label>Competition structure</Label>
											<select
												value={competition.competitionStructure}
												onChange={(event) =>
													onChange(competition.leagueId, {
														competitionStructure: event.target.value as LeagueSeasonFormValues["competitionStructure"],
													})
												}
												className={inputClass}
											>
												<option value="SINGLE_TABLE">Single table (no conferences)</option>
												<option value="CONFERENCES">Conferences / divisions / pools</option>
											</select>
										</div>
										<div>
											<Label>Bracket</Label>
											<select
												value={competition.bracketType}
												onChange={(event) =>
													onChange(competition.leagueId, { bracketType: event.target.value })
												}
												className={inputClass}
											>
												{BRACKET_TYPES.map((option) => (
													<option key={option.value} value={option.value}>{option.label}</option>
												))}
											</select>
										</div>
									</div>

									<div>
										<Label>Participating teams</Label>
										<div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-[var(--bord)] bg-[var(--surf)] p-3 max-[600px]:grid-cols-1">
											{teams.map((team) => {
												const selected = competition.teamIds.includes(team.id);
												return (
													<label key={team.id} className="flex cursor-pointer items-center gap-2 text-[12.5px]">
														<input
															type="checkbox"
															checked={selected}
															onChange={() =>
																onChange(competition.leagueId, {
																	teamIds: selected
																		? competition.teamIds.filter((id) => id !== team.id)
																		: [...competition.teamIds, team.id],
																})
															}
														/>
														{team.name}
													</label>
												);
											})}
											{teams.length === 0 && <span className="text-[var(--txm)]">No teams available.</span>}
										</div>
									</div>

									<label className="flex items-center gap-2 text-[12.5px] font-bold">
										<input
											type="checkbox"
											checked={competition.hasRegistrationWindow}
											onChange={(event) =>
												onChange(competition.leagueId, {
													hasRegistrationWindow: event.target.checked,
												})
											}
										/>
										<CalendarRange className="h-4 w-4 text-[var(--brand)]" />
										Use a registration window for this league
									</label>
									{competition.hasRegistrationWindow && (
										<div className="grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
											<div>
												<Label>Registration opens</Label>
												<input
													type="datetime-local"
													value={competition.registrationOpensAt}
													onChange={(event) =>
														onChange(competition.leagueId, { registrationOpensAt: event.target.value })
													}
													className={inputClass}
												/>
											</div>
											<div>
												<Label>Registration closes</Label>
												<input
													type="datetime-local"
													value={competition.registrationClosesAt}
													onChange={(event) =>
														onChange(competition.leagueId, { registrationClosesAt: event.target.value })
													}
													className={inputClass}
												/>
											</div>
										</div>
									)}

									{competition.competitionStructure === "CONFERENCES" && (
										<SeasonConferencesCard
											conferences={competition.conferences}
											errors={{ conferences: errors.leagueSeasons }}
											touched={touched}
											teams={teams}
											canPickTeams
											leagueName={competition.leagueName}
											onAdd={(name, teamIds) =>
												onAddConference(competition.leagueId, name, teamIds)
											}
											onUpdate={(index, name, teamIds) =>
												onUpdateConference(competition.leagueId, index, name, teamIds)
											}
											onRemove={(index) => onRemoveConference(competition.leagueId, index)}
										/>
									)}
								</div>
							)}
						</div>
					);
				})}
			</div>
			<FieldError message={touched ? errors.leagueSeasons : undefined} />
		</FormCard>
	);
}
