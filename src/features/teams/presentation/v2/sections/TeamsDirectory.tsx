import { useTeamsFilterStore } from "@/features/teams/presentation/stores/v2/useTeamsFilterStore";
import { pillClass } from "@/features/home/presentation/v2/lib/tab-styles";
import type { TeamCard, LeagueTab } from "@/features/teams/domain/entities/teams-v2";

interface Props {
	teams: TeamCard[];
	leagues: LeagueTab[];
	perPage?: number;
}

/** hex → rgba tint for league-coloured crests/badges. */
function tint(hex: string, a: number): string {
	const h = hex.replace("#", "");
	const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
	const n = parseInt(full, 16);
	return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

const pagerBtn = (active: boolean) =>
	`cursor-pointer rounded-md border px-3.5 py-2 font-mono text-[12px] ${
		active ? "border-brand bg-brand text-white" : "border-black/15 bg-white text-ink2 hover:border-brand"
	}`;

/** Teams directory — filter bar + grid + pager + empty state. React island;
 *  league filter / search / page live in a Zustand store. */
export default function TeamsDirectory({ teams, leagues, perPage = 9 }: Props) {
	const { league, query, page, setLeague, setQuery, setPage } = useTeamsFilterStore();

	const q = query.trim().toLowerCase();
	const filtered = teams.filter((t) => {
		const byLeague = league === "all" || t.league === league;
		const bySearch = !q || t.name.toLowerCase().includes(q) || t.coach.toLowerCase().includes(q);
		return byLeague && bySearch;
	});

	const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
	const current = Math.min(Math.max(1, page), totalPages);
	const start = (current - 1) * perPage;
	const pageTeams = filtered.slice(start, start + perPage);
	const rangeLabel = filtered.length
		? `Showing ${start + 1}–${Math.min(start + perPage, filtered.length)} of ${filtered.length}`
		: "0 clubs";

	return (
		<>
			{/* FILTER BAR */}
			<section className="border-b border-black/[0.08] bg-panel">
				<div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-8 py-6 max-[960px]:px-6">
					<div className="flex flex-wrap items-center gap-2">
						{leagues.map((t) => (
							<button key={t.value} type="button" onClick={() => setLeague(t.value)} className={pillClass(league === t.value)}>
								{t.label}
							</button>
						))}
					</div>
					<div className="flex items-center gap-3 rounded-lg border border-black/15 bg-white px-4 py-2.5 max-[600px]:w-full">
						<span className="font-mono text-[13px] text-muted2">⌕</span>
						<input
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search teams or coaches…"
							className="w-[220px] border-none bg-transparent font-body text-[14px] text-ink2 outline-none max-[600px]:w-full"
						/>
					</div>
				</div>
			</section>

			{/* DIRECTORY */}
			<section className="mx-auto max-w-[1280px] px-8 py-[56px] max-[960px]:px-6 max-[960px]:py-10">
				<div className="mb-6 flex items-center justify-between">
					<h2 className="font-display text-[26px] uppercase text-ink">Find a Club</h2>
					<span className="font-mono text-[12px] text-muted2">{rangeLabel}</span>
				</div>

				{filtered.length > 0 ? (
					<>
						<div className="grid grid-cols-3 gap-5 max-[960px]:grid-cols-2 max-[600px]:grid-cols-1">
							{pageTeams.map((t) => (
								<a
									key={t.id}
									href={t.href}
									className="flex flex-col rounded-xl border border-black/10 bg-white p-5 shadow-[0_1px_2px_rgba(20,16,9,0.04)] no-underline hover:border-brand/40"
								>
									<div className="flex items-center gap-4">
										<div
											className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full font-display text-[18px]"
											style={{ background: tint(t.leagueColor, 0.12), color: t.leagueColor }}
										>
											{t.initials}
										</div>
										<div className="min-w-0 flex-1">
											<div className="truncate font-body text-[16px] font-extrabold uppercase leading-tight text-ink2">{t.name}</div>
											<span
												className="mt-2 inline-block rounded px-2 py-[3px] font-mono text-[10px] uppercase tracking-[0.1em]"
												style={{ background: tint(t.leagueColor, 0.1), color: t.leagueColor }}
											>
												{t.league}
											</span>
										</div>
									</div>
									<div className="mt-[18px] flex items-end justify-between border-t border-black/[0.07] pt-[18px]">
										<div className="min-w-0">
											<div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted2">Coach</div>
											<div className="truncate text-[14px] font-semibold text-ink2">{t.coach}</div>
										</div>
										<div className="flex-shrink-0 pl-3 text-right">
											<div className="font-display text-[24px] leading-none text-ink">{t.players}</div>
											<div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted2">Players</div>
										</div>
									</div>
									<div className="mt-4 font-mono text-[11px] tracking-[0.06em] text-brand">View roster →</div>
								</a>
							))}
						</div>

						{totalPages > 1 && (
							<div className="mt-10 flex items-center justify-center gap-2">
								<button type="button" onClick={() => setPage(current - 1)} disabled={current === 1} className={`${pagerBtn(false)} disabled:cursor-not-allowed disabled:opacity-40`}>
									← Prev
								</button>
								{Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
									<button key={p} type="button" onClick={() => setPage(p)} className={pagerBtn(p === current)}>
										{p}
									</button>
								))}
								<button type="button" onClick={() => setPage(current + 1)} disabled={current === totalPages} className={`${pagerBtn(false)} disabled:cursor-not-allowed disabled:opacity-40`}>
									Next →
								</button>
							</div>
						)}
					</>
				) : (
					<div className="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-black/[0.16] bg-paper2 px-8 py-16 text-center">
						<div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-panel font-mono text-[18px] text-muted2">⌕</div>
						<div className="font-display text-[22px] uppercase text-ink">No clubs found</div>
						<p className="max-w-[360px] text-[14px] leading-[1.5] text-muted">
							No teams match {query ? `"${query}"` : "your filters"}. Try a different name, coach, or clear the filters.
						</p>
						<button
							type="button"
							onClick={() => {
								setLeague("all");
								setQuery("");
							}}
							className="mt-1 cursor-pointer rounded-md border border-black/20 bg-white px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.04em] text-ink2 hover:border-brand hover:text-brand"
						>
							Clear filters
						</button>
					</div>
				)}
			</section>
		</>
	);
}
