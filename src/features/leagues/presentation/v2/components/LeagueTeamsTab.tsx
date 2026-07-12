import { Users } from "lucide-react";
import EntityAvatar from "@/components/EntityAvatar";
import type { LeagueTeamSummary } from "@/features/leagues/domain/entities/league-detail";

export default function LeagueTeamsTab({ teams }: { teams: LeagueTeamSummary[] }) {
	if (teams.length === 0) {
		return (
			<div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--bord)] bg-[var(--surf)] px-6 py-16 text-center">
				<span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surf2)] text-[var(--brand)]">
					<Users className="h-[24px] w-[24px]" />
				</span>
				<div className="font-['Anton'] text-[20px] uppercase text-[var(--tx)]">No teams yet</div>
				<p className="max-w-[320px] font-['Archivo'] text-[13px] text-[var(--txm)]">
					Teams appear here once they are entered into one of this league's seasons.
				</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-3 gap-3 max-[760px]:grid-cols-2 max-[480px]:grid-cols-1">
			{teams.map((team) => (
				<a
					key={team.id}
					href={`/admin/teams/${team.id}`}
					className="flex items-center gap-3 rounded-xl border border-[var(--bord)] bg-[var(--surf)] px-4 py-3.5 no-underline hover:border-[var(--brand)]/40"
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
							{team.played === 0 ? "No matches played" : `${team.won}–${team.lost} · ${team.played} played`}
						</div>
					</div>
				</a>
			))}
		</div>
	);
}
