/**
 * Shared filter/tab pill classes for the v2 interactive sections
 * (LatestNews, LeagueLeaders, FeaturedMedia). Returns Tailwind classes so the
 * React islands can use it directly in `className`.
 */
export function pillClass(active: boolean): string {
	const base = "cursor-pointer rounded-md px-[15px] py-[9px] text-[12px] uppercase tracking-[0.04em]";
	return active
		? `${base} border border-brand bg-brand font-bold text-white`
		: `${base} border border-black/15 bg-white font-semibold text-muted hover:border-brand`;
}
