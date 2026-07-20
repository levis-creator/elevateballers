import { useMemo, useState } from "react";
import { AlertCircle, Pencil, Plus, Users } from "lucide-react";
import EntityAvatar from "@/components/EntityAvatar";
import type {
	SeasonConferenceOption,
	SeasonTeamSummary,
} from "@/features/seasons/domain/entities/season-detail";
import ConferenceModal from "./ConferenceModal";

interface Props {
	teams: SeasonTeamSummary[];
	conferences: SeasonConferenceOption[];
	seasonId: string;
	/** Whether the viewer may reassign teams / manage conferences (seasons:update). */
	canAssign: boolean;
	/** Re-fetch the season overview — called after a conference is saved/deleted. */
	onRefresh: () => void | Promise<void>;
}

const TILE =
	"flex flex-col gap-2.5 rounded-xl border border-[var(--bord)] bg-[var(--surf)] px-4 py-3.5";

/** null → no modal; { conference } → open (create when conference is null). */
type ModalState = { conference: { id: string; name: string } | null } | null;

/** One team card: name links out; the optional select reassigns its conference. */
function TeamTile({
	team,
	conferences,
	value,
	canAssign,
	busy,
	onAssign,
}: {
	team: SeasonTeamSummary;
	conferences: SeasonConferenceOption[];
	value: string | null;
	canAssign: boolean;
	busy: boolean;
	onAssign: (conferenceId: string | null) => void;
}) {
	const showSelect = conferences.length > 0 && canAssign;
	return (
		<div className={TILE}>
			<a
				href={`/admin/teams/${team.id}`}
				className="flex items-center gap-3 no-underline hover:opacity-90"
			>
				<EntityAvatar
					seed={team.id}
					label={team.name}
					src={team.logo}
					className="h-10 w-10 rounded-full text-[15px]"
				/>
				<div className="min-w-0 flex-1">
					<div className="truncate font-['Archivo'] text-[13.5px] font-bold text-[var(--tx)]">{team.name}</div>
					<div className="font-['Space_Mono'] text-[11px] text-[var(--txm)]">
						{team.played === 0 ? "No matches played" : `${team.won}W · ${team.lost}L`}
					</div>
				</div>
			</a>

			{showSelect && (
				<select
					value={value ?? ""}
					disabled={busy}
					aria-label={`Conference for ${team.name}`}
					onChange={(e) => onAssign(e.target.value || null)}
					className="w-full rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-2.5 py-2 font-['Archivo'] text-[12.5px] text-[var(--tx)] outline-none focus:border-[var(--brand)] disabled:opacity-60"
				>
					<option value="">Unassigned</option>
					{conferences.map((conference) => (
						<option key={conference.id} value={conference.id}>
							{conference.name}
						</option>
					))}
				</select>
			)}
		</div>
	);
}

export default function SeasonTeamsTab({ teams, conferences, seasonId, canAssign, onRefresh }: Props) {
	// Seed a local assignment map so a per-team reassignment reflects instantly (the
	// team hops to its new section) without re-fetching. Re-seeded on remount.
	const [assignments, setAssignments] = useState<Record<string, string | null>>(() =>
		Object.fromEntries(teams.map((team) => [team.id, team.conferenceId])),
	);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [error, setError] = useState("");
	const [modal, setModal] = useState<ModalState>(null);

	async function assign(teamId: string, conferenceId: string | null) {
		const previous = assignments[teamId] ?? null;
		if (previous === conferenceId) return;

		// Optimistic: show the new assignment immediately, revert if the save fails.
		setAssignments((prev) => ({ ...prev, [teamId]: conferenceId }));
		setBusyId(teamId);
		setError("");
		try {
			const res = await fetch(`/api/seasons/${seasonId}/teams/${teamId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ conferenceId }),
			});
			if (!res.ok) throw new Error("failed");
		} catch {
			setAssignments((prev) => ({ ...prev, [teamId]: previous }));
			setError("Could not update that team's conference. Please try again.");
		} finally {
			setBusyId(null);
		}
	}

	const conferenceName = useMemo(
		() => new Map(conferences.map((c) => [c.id, c.name])),
		[conferences],
	);

	// Teams with their latest (locally-tracked) conference applied — so the modal's
	// pre-checked teams and "currently in X" hints match what's on screen even
	// after a per-team dropdown change that hasn't been refreshed from the server.
	const effectiveTeams = useMemo<SeasonTeamSummary[]>(
		() =>
			teams.map((team) => {
				const conferenceId = assignments[team.id] ?? null;
				return { ...team, conferenceId, conferenceName: conferenceId ? conferenceName.get(conferenceId) ?? null : null };
			}),
		[teams, assignments, conferenceName],
	);

	// Bucket teams by their (locally-tracked) conference, keeping conference order
	// and collecting anything unassigned into a trailing group.
	const grouped = useMemo(() => {
		const byConference = new Map<string, SeasonTeamSummary[]>(conferences.map((c) => [c.id, []]));
		const unassigned: SeasonTeamSummary[] = [];
		for (const team of effectiveTeams) {
			const bucket = team.conferenceId ? byConference.get(team.conferenceId) : undefined;
			if (bucket) bucket.push(team);
			else unassigned.push(team);
		}
		return { byConference, unassigned };
	}, [effectiveTeams, conferences]);

	const grid = "grid grid-cols-3 gap-3 max-[760px]:grid-cols-2 max-[480px]:grid-cols-1";

	function conferenceSection(conference: SeasonConferenceOption, sectionTeams: SeasonTeamSummary[]) {
		return (
			<div key={conference.id}>
				<div className="mb-2.5 flex items-center justify-between gap-2">
					<div className="flex items-baseline gap-2">
						<h3 className="font-['Anton'] text-[15px] uppercase tracking-[0.02em] text-[var(--tx)]">{conference.name}</h3>
						<span className="font-['Space_Mono'] text-[11px] text-[var(--txm)]">
							{sectionTeams.length} {sectionTeams.length === 1 ? "team" : "teams"}
						</span>
					</div>
					{canAssign && (
						<button
							type="button"
							onClick={() => setModal({ conference: { id: conference.id, name: conference.name } })}
							className="flex items-center gap-1.5 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-2.5 py-1.5 font-['Archivo'] text-[11px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
						>
							<Pencil className="h-3 w-3" />
							Edit
						</button>
					)}
				</div>
				{sectionTeams.length === 0 ? (
					<p className="rounded-xl border border-dashed border-[var(--bord)] px-4 py-5 font-['Archivo'] text-[12.5px] text-[var(--txm)]">
						No teams in this conference yet.
					</p>
				) : (
					<div className={grid}>
						{sectionTeams.map((team) => (
							<TeamTile
								key={team.id}
								team={team}
								conferences={conferences}
								value={team.conferenceId}
								canAssign={canAssign}
								busy={busyId === team.id}
								onAssign={(conferenceId) => assign(team.id, conferenceId)}
							/>
						))}
					</div>
				)}
			</div>
		);
	}

	// The "Add Conference" toolbar shows whenever the viewer can manage the season,
	// even with no teams yet, so conferences can be defined up front.
	const toolbar = canAssign && (
		<div className="flex items-center justify-between gap-2">
			<div className="font-['Space_Mono'] text-[11px] uppercase tracking-[0.1em] text-[var(--txm)]">
				{conferences.length === 0
					? "No conferences"
					: `${conferences.length} ${conferences.length === 1 ? "conference" : "conferences"}`}
			</div>
			<button
				type="button"
				onClick={() => setModal({ conference: null })}
				className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-3.5 py-2 font-['Archivo'] text-[12px] font-extrabold uppercase tracking-[0.04em] text-white hover:bg-[var(--brandlt)]"
			>
				<Plus className="h-[14px] w-[14px]" />
				Add Conference
			</button>
		</div>
	);

	let content: React.ReactNode;
	if (teams.length === 0) {
		content = (
			<div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--bord)] bg-[var(--surf)] px-6 py-16 text-center">
				<span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surf2)] text-[var(--brand)]">
					<Users className="h-[22px] w-[22px]" />
				</span>
				<div className="font-['Anton'] text-[20px] uppercase text-[var(--tx)]">No teams yet</div>
				<p className="max-w-[340px] font-['Archivo'] text-[13px] text-[var(--txm)]">
					Enter teams into this season to build its schedule and standings.
				</p>
			</div>
		);
	} else if (conferences.length === 0) {
		// No conferences → a flat grid, no selectors (use the toolbar to add one).
		content = (
			<div className={grid}>
				{effectiveTeams.map((team) => (
					<TeamTile
						key={team.id}
						team={team}
						conferences={conferences}
						value={team.conferenceId}
						canAssign={canAssign}
						busy={busyId === team.id}
						onAssign={(conferenceId) => assign(team.id, conferenceId)}
					/>
				))}
			</div>
		);
	} else {
		content = (
			<div className="flex flex-col gap-6">
				{conferences.map((conference) =>
					conferenceSection(conference, grouped.byConference.get(conference.id) ?? []),
				)}
				{grouped.unassigned.length > 0 && (
					<div>
						<div className="mb-2.5 flex items-baseline gap-2">
							<h3 className="font-['Anton'] text-[15px] uppercase tracking-[0.02em] text-[var(--tx)]">Unassigned</h3>
							<span className="font-['Space_Mono'] text-[11px] text-[var(--txm)]">
								{grouped.unassigned.length} {grouped.unassigned.length === 1 ? "team" : "teams"}
							</span>
						</div>
						<div className={grid}>
							{grouped.unassigned.map((team) => (
								<TeamTile
									key={team.id}
									team={team}
									conferences={conferences}
									value={team.conferenceId}
									canAssign={canAssign}
									busy={busyId === team.id}
									onAssign={(conferenceId) => assign(team.id, conferenceId)}
								/>
							))}
						</div>
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-5">
			{toolbar}
			{error && (
				<div className="flex items-center gap-2 rounded-lg border border-[var(--brand)]/40 bg-[var(--brand)]/[0.1] px-4 py-3 font-['Archivo'] text-[13px] text-[var(--brandsoft)]">
					<AlertCircle className="h-4 w-4 flex-shrink-0" />
					{error}
				</div>
			)}
			{content}

			{modal && (
				<ConferenceModal
					seasonId={seasonId}
					conference={modal.conference}
					teams={effectiveTeams}
					onClose={() => setModal(null)}
					onSaved={onRefresh}
				/>
			)}
		</div>
	);
}
