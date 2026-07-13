import { Check, Info, Plus, Trophy } from "lucide-react";
import { avatarTint } from "@/lib/avatar";
import type { FormLeague } from "../hooks/useSeasonForm";

interface Props {
	leagues: FormLeague[];
	selected: string[];
	canCreateLeague: boolean;
	onToggle: (leagueId: string) => void;
}

export default function SeasonLeaguesCard({ leagues, selected, canCreateLeague, onToggle }: Props) {
	const count = selected.length;
	const subtitle = count === 0 ? "None linked yet" : `${count} selected`;

	return (
		<div className="rounded-2xl border border-[var(--bord)] bg-[var(--surf)] p-6 max-[600px]:p-5">
			<div className="mb-4 flex flex-wrap items-center justify-between gap-2">
				<div className="flex items-center gap-3">
					<span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--brand)]/[0.12] text-[var(--brand)]">
						<Trophy className="h-4 w-4" />
					</span>
					<div>
						<h2 className="font-['Anton'] text-[18px] uppercase tracking-[0.01em] text-[var(--tx)]">Leagues</h2>
						<p className="font-['Space_Mono'] text-[11px] text-[var(--txm)]">{subtitle}</p>
					</div>
				</div>
				{canCreateLeague && (
					<a
						href="/admin/leagues/new"
						className="flex items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-2 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] no-underline hover:border-[var(--brand)] hover:text-[var(--brand)]"
					>
						<Plus className="h-[14px] w-[14px]" />
						New League
					</a>
				)}
			</div>

			{leagues.length === 0 ? (
				<p className="font-['Archivo'] text-[12.5px] text-[var(--txm)]">
					No leagues exist yet. You can create the season now and link it later.
				</p>
			) : (
				<div className="flex flex-col gap-2">
					{leagues.map((league) => {
						const on = selected.includes(league.id);
						return (
							<button
								key={league.id}
								type="button"
								aria-pressed={on}
								onClick={() => onToggle(league.id)}
								className={`flex w-full items-center gap-[11px] rounded-[10px] border px-3.5 py-2.5 ${
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
								<span
									className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
									style={{ background: avatarTint(league.id) }}
								/>
								<span className="flex-1 text-left font-['Archivo'] text-[13.5px] font-bold text-[var(--tx)]">
									{league.name}
								</span>
								<span className="font-['Space_Mono'] text-[11px] text-[var(--txm)]">
									{league.teamCount} {league.teamCount === 1 ? "team" : "teams"}
								</span>
							</button>
						);
					})}
				</div>
			)}

			<p className="mt-3 flex items-start gap-2 font-['Archivo'] text-[11.5px] leading-[1.5] text-[var(--txm)]">
				<Info className="mt-0.5 h-[13px] w-[13px] flex-shrink-0" />
				Link this season to one or more leagues, or leave it unlinked and attach it later.
			</p>
		</div>
	);
}
