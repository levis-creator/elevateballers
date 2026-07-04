import { useTeamViewStore } from "@/features/teams/presentation/stores/v2/useTeamViewStore";
import type { ResultMatch, UpcomingMatch } from "@/features/teams/domain/entities/team-detail";

interface Props {
	recent: ResultMatch[];
	upcoming: UpcomingMatch[];
	seasons: string[];
	perPage?: number;
}

const tagStyle = (r: string): React.CSSProperties =>
	r === "win"
		? { background: "rgba(63,191,111,0.14)", color: "#2f9e44" }
		: r === "loss"
			? { background: "rgba(228,0,43,0.1)", color: "#e4002b" }
			: { background: "#f0ede7", color: "#a49a8d" };

const pagerBtn = (active: boolean) =>
	`cursor-pointer rounded-md border px-3.5 py-2 font-mono text-[12px] ${
		active ? "border-brand bg-brand text-white" : "border-black/15 bg-white text-ink2 hover:border-brand"
	}`;

/** Recent (season filter + pager) + Upcoming matches. React island; season and
 *  page live in the shared Zustand store. */
export default function TeamMatches({ recent, upcoming, seasons, perPage = 4 }: Props) {
	const { season, recentPage, setSeason, setRecentPage } = useTeamViewStore();

	// Default to the current (most recent) season; guard against a stale choice
	// carried over from another team. When no seasons are tagged, show everything.
	const hasSeasons = seasons.length > 0;
	const activeSeason = hasSeasons ? (season && seasons.includes(season) ? season : seasons[0]) : "";
	const filtered = hasSeasons ? recent.filter((m) => m.season === activeSeason) : recent;
	const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
	const current = Math.min(Math.max(1, recentPage), totalPages);
	const start = (current - 1) * perPage;
	const pageItems = filtered.slice(start, start + perPage);

	return (
		<section className="mx-auto grid max-w-[1280px] grid-cols-2 gap-10 px-8 py-[56px] max-[960px]:grid-cols-1 max-[960px]:gap-9 max-[960px]:px-6 max-[960px]:py-10">
			{/* RECENT */}
			<div>
				<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
					<h2 className="font-display text-[26px] uppercase text-ink">Recent Matches</h2>
					{seasons.length > 0 && (
						<div className="relative">
							<select
								value={activeSeason}
								onChange={(e) => setSeason(e.target.value)}
								className="cursor-pointer appearance-none rounded-md border border-black/15 bg-white py-[9px] pl-3.5 pr-8 font-body text-[12px] font-bold uppercase tracking-[0.04em] text-ink2 outline-none"
							>
								{seasons.map((s) => (
									<option key={s} value={s}>
										{s}
									</option>
								))}
							</select>
							<span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-muted">▼</span>
						</div>
					)}
				</div>
				<div className="mb-3 font-mono text-[11px] uppercase tracking-[0.08em] text-muted2">{filtered.length} results</div>

				{pageItems.length > 0 ? (
					<div className="flex flex-col gap-3">
						{pageItems.map((m) => (
							<a key={m.id} href={m.href} className="block rounded-[10px] border border-black/10 bg-white px-[18px] pb-4 pt-3.5 text-inherit no-underline shadow-[0_1px_2px_rgba(20,16,9,0.04)] hover:border-brand/40">
								<div className="mb-3 flex items-center justify-between">
									<span className="rounded px-[9px] py-[3px] font-mono text-[10px] uppercase tracking-[0.12em]" style={tagStyle(m.result)}>
										{m.tag}
									</span>
									<span className="font-mono text-[11px] text-muted2">{m.date}</span>
								</div>
								<div className="flex flex-col gap-[11px]">
									<div className="flex items-center gap-3">
										<div className="h-[30px] w-[30px] flex-shrink-0 rounded-full" style={{ background: "repeating-linear-gradient(45deg,#e7e2da,#e7e2da 5px,#f0ece5 5px,#f0ece5 10px)" }} />
										<span className="flex-1 font-body text-[15px] font-bold" style={{ color: m.homeColor }}>{m.home}</span>
										<span className="font-display text-[22px]" style={{ color: m.homeColor }}>{m.hs}</span>
									</div>
									<div className="flex items-center gap-3">
										<div className="h-[30px] w-[30px] flex-shrink-0 rounded-full" style={{ background: "repeating-linear-gradient(45deg,#e7e2da,#e7e2da 5px,#f0ece5 5px,#f0ece5 10px)" }} />
										<span className="flex-1 font-body text-[15px] font-bold" style={{ color: m.awayColor }}>{m.away}</span>
										<span className="font-display text-[22px]" style={{ color: m.awayColor }}>{m.as}</span>
									</div>
								</div>
							</a>
						))}
					</div>
				) : (
					<div className="rounded-[10px] border border-dashed border-black/[0.16] bg-white px-6 py-10 text-center">
						<div className="font-display text-[18px] uppercase text-ink">No matches{hasSeasons ? " this season" : " yet"}</div>
						<p className="mt-1.5 font-body text-[13px] text-muted">This team has no recorded games{hasSeasons ? ` for the ${activeSeason} season.` : "."}</p>
					</div>
				)}

				{totalPages > 1 && (
					<div className="mt-5 flex items-center justify-center gap-2">
						<button type="button" onClick={() => setRecentPage(current - 1)} disabled={current === 1} className={`${pagerBtn(false)} disabled:cursor-not-allowed disabled:opacity-40`}>
							← Prev
						</button>
						{Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
							<button key={p} type="button" onClick={() => setRecentPage(p)} className={pagerBtn(p === current)}>
								{p}
							</button>
						))}
						<button type="button" onClick={() => setRecentPage(current + 1)} disabled={current === totalPages} className={`${pagerBtn(false)} disabled:cursor-not-allowed disabled:opacity-40`}>
							Next →
						</button>
					</div>
				)}
			</div>

			{/* UPCOMING */}
			<div>
				<h2 className="mb-6 font-display text-[26px] uppercase text-ink">Upcoming Matches</h2>
				{upcoming.length > 0 ? (
					<div className="flex flex-col gap-3">
						{upcoming.map((m) => (
							<a key={m.id} href={m.href} className="block rounded-[10px] border border-black/10 bg-white px-[18px] pb-4 pt-3.5 text-inherit no-underline shadow-[0_1px_2px_rgba(20,16,9,0.04)] hover:border-brand/40">
								<div className="mb-3 flex items-center justify-between gap-2">
									<span className="rounded bg-brand/[0.08] px-[9px] py-[3px] font-mono text-[10px] uppercase tracking-[0.12em] text-brand">{m.when}</span>
									<span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted2">{m.league}</span>
								</div>
								<div className="flex items-center gap-3">
									<span className="flex-1 font-body text-[15px] font-bold text-ink2">{m.home}</span>
									<span className="font-display text-[15px] text-[#a49a8d]">VS</span>
									<span className="flex-1 text-right font-body text-[15px] font-bold text-ink2">{m.away}</span>
								</div>
							</a>
						))}
					</div>
				) : (
					<div className="rounded-[10px] border border-dashed border-black/[0.16] bg-white px-6 py-10 text-center">
						<div className="font-display text-[18px] uppercase text-ink">No upcoming matches</div>
						<p className="mt-1.5 font-body text-[13px] text-muted">Check back once the next fixtures are scheduled.</p>
					</div>
				)}
			</div>
		</section>
	);
}
