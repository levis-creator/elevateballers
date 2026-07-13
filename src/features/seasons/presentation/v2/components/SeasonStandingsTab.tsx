import { Trophy } from "lucide-react";
import EntityAvatar from "@/components/EntityAvatar";
import type { SeasonStandingRow } from "@/features/seasons/domain/entities/season-detail";

interface Props {
	standings: SeasonStandingRow[];
	seasonName: string;
}

export default function SeasonStandingsTab({ standings, seasonName }: Props) {
	if (standings.length === 0) {
		return (
			<div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--bord)] bg-[var(--surf)] px-6 py-16 text-center">
				<span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surf2)] text-[var(--brand)]">
					<Trophy className="h-[22px] w-[22px]" />
				</span>
				<div className="font-['Anton'] text-[20px] uppercase text-[var(--tx)]">No standings yet</div>
				<p className="max-w-[340px] font-['Archivo'] text-[13px] text-[var(--txm)]">
					The table fills in once matches in this season have been played.
				</p>
			</div>
		);
	}

	return (
		<div className="overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)]">
			<div className="flex items-center justify-between border-b border-[var(--bord2)] px-5 py-4">
				<h2 className="font-['Anton'] text-[18px] uppercase tracking-[0.01em] text-[var(--tx)]">Standings</h2>
				<span className="font-['Space_Mono'] text-[10px] uppercase tracking-[0.1em] text-[var(--txm)]">
					{seasonName}
				</span>
			</div>

			<div className="overflow-x-auto">
				<table className="w-full border-collapse">
					<thead>
						<tr>
							<Th className="px-5 text-left">#</Th>
							<Th className="px-3 text-left">Team</Th>
							<Th className="px-3 text-center">W</Th>
							<Th className="px-3 text-center">L</Th>
							<Th className="px-5 text-center">Pts</Th>
						</tr>
					</thead>
					<tbody>
						{standings.map((row) => (
							<tr key={row.teamId} className="hover:bg-[var(--hov)]">
								<td className="border-b border-[var(--bord2)] px-5 py-2.5">
									<span
										className="font-['Anton'] text-[16px]"
										style={{ color: row.rank === 1 ? "#e4002b" : "var(--txm)" }}
									>
										{row.rank}
									</span>
								</td>
								<td className="border-b border-[var(--bord2)] px-3 py-2.5">
									<span className="flex items-center gap-2.5">
										<EntityAvatar
											seed={row.teamId}
											label={row.team}
											src={row.logo}
											className="h-7 w-7 rounded-full text-[12px]"
										/>
										<span className="font-['Archivo'] text-[13px] font-bold text-[var(--tx)]">{row.team}</span>
									</span>
								</td>
								<td className="border-b border-[var(--bord2)] px-3 py-2.5 text-center font-['Space_Mono'] text-[13px] text-[var(--txd)]">
									{row.won}
								</td>
								<td className="border-b border-[var(--bord2)] px-3 py-2.5 text-center font-['Space_Mono'] text-[13px] text-[var(--txd)]">
									{row.lost}
								</td>
								<td className="border-b border-[var(--bord2)] px-5 py-2.5 text-center font-['Anton'] text-[16px] text-[var(--tx)]">
									{row.points}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
	return (
		<th
			className={`border-b border-[var(--bord2)] py-2.5 font-['Space_Mono'] text-[10px] uppercase tracking-[0.1em] font-normal text-[var(--txm)] ${className}`}
		>
			{children}
		</th>
	);
}
