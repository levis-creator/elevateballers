import EntityAvatar from "@/components/EntityAvatar";
import type { LeagueDetail } from "@/features/leagues/domain/entities/league-detail";

const dayFmt = (iso: string) => {
	const d = new Date(iso);
	return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

/** A rank medal for the top three, plain muted numerals below. */
const rankColor = (rank: number) => (rank === 1 ? "#e4002b" : rank <= 3 ? "var(--tx)" : "var(--txm)");

export default function LeagueOverviewTab({ detail }: { detail: LeagueDetail }) {
	const { standings, recentMatches, currentSeason } = detail;

	return (
		<div className="grid grid-cols-[1.5fr_1fr] gap-5 max-[900px]:grid-cols-1">
			{/* standings */}
			<div className="overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)]">
				<div className="flex items-center justify-between border-b border-[var(--bord2)] px-5 py-4">
					<h2 className="font-['Anton'] text-[18px] uppercase tracking-[0.01em] text-[var(--tx)]">Standings</h2>
					<span className="font-['Space_Mono'] text-[10px] uppercase tracking-[0.1em] text-[var(--txm)]">
						{currentSeason?.name ?? "No season"}
					</span>
				</div>

				{standings.length === 0 ? (
					<p className="px-5 py-12 text-center font-['Archivo'] text-[13px] text-[var(--txm)]">
						No completed matches yet, so there is nothing to rank.
					</p>
				) : (
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
											<span className="font-['Anton'] text-[16px]" style={{ color: rankColor(row.rank) }}>
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
										<Td className="text-center">{row.won}</Td>
										<Td className="text-center">{row.lost}</Td>
										<td className="border-b border-[var(--bord2)] px-5 py-2.5 text-center font-['Anton'] text-[16px] text-[var(--tx)]">
											{row.points}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* recent matches */}
			<div className="overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)]">
				<div className="flex items-center justify-between border-b border-[var(--bord2)] px-5 py-4">
					<h2 className="font-['Anton'] text-[18px] uppercase tracking-[0.01em] text-[var(--tx)]">Recent Matches</h2>
					<a
						href={`/admin/matches?leagueId=${detail.league.id}`}
						className="font-['Space_Mono'] text-[11px] text-[var(--brandsoft)] no-underline hover:text-[var(--brand)]"
					>
						All →
					</a>
				</div>

				{recentMatches.length === 0 ? (
					<p className="px-5 py-12 text-center font-['Archivo'] text-[13px] text-[var(--txm)]">
						No matches scheduled in this league yet.
					</p>
				) : (
					<div className="flex flex-col">
						{recentMatches.map((match) => {
							const played = match.team1Score !== null && match.team2Score !== null;
							return (
								<div key={match.id} className="flex items-center gap-3 border-b border-[var(--bord2)] px-5 py-3">
									<span className="w-[48px] flex-shrink-0 font-['Space_Mono'] text-[10px] uppercase text-[var(--txm)]">
										{dayFmt(match.date)}
									</span>
									<span className="flex-1 truncate text-right font-['Archivo'] text-[12.5px] font-bold text-[var(--tx)]">
										{match.team1}
									</span>
									<span
										className="flex-shrink-0 rounded px-2 py-1 font-['Space_Mono'] text-[11px] font-bold"
										style={
											played
												? { background: "var(--chip)", color: "var(--tx)" }
												: { background: "rgba(228,0,43,0.12)", color: "var(--brandsoft)" }
										}
									>
										{played ? `${match.team1Score}–${match.team2Score}` : match.status === "LIVE" ? "LIVE" : "vs"}
									</span>
									<span className="flex-1 truncate font-['Archivo'] text-[12.5px] font-bold text-[var(--tx)]">
										{match.team2}
									</span>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
	return (
		<th
			className={`border-b border-[var(--bord2)] py-2.5 font-['Space_Mono'] text-[10px] uppercase tracking-[0.1em] text-[var(--txm)] ${className}`}
		>
			{children}
		</th>
	);
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
	return (
		<td
			className={`border-b border-[var(--bord2)] px-3 py-2.5 font-['Space_Mono'] text-[13px] text-[var(--txd)] ${className}`}
		>
			{children}
		</td>
	);
}
