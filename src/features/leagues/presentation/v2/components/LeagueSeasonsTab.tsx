import { CalendarDays } from "lucide-react";
import {
	seasonBadge,
	seasonProgress,
	type LeagueSeasonSummary,
} from "@/features/leagues/domain/entities/league-detail";

const BADGE_STYLE: Record<string, { bg: string; fg: string }> = {
	Active: { bg: "rgba(31,157,85,0.16)", fg: "#1f9d55" },
	Upcoming: { bg: "rgba(42,111,219,0.16)", fg: "#5b93e8" },
	Completed: { bg: "var(--chip)", fg: "var(--txm)" },
};

const rangeFmt = (start: string, end: string) => {
	const fmt = (iso: string) => {
		const d = new Date(iso);
		return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
	};
	return `${fmt(start)} – ${fmt(end)}`;
};

export default function LeagueSeasonsTab({ seasons }: { seasons: LeagueSeasonSummary[] }) {
	if (seasons.length === 0) {
		return (
			<div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--bord)] bg-[var(--surf)] px-6 py-16 text-center">
				<span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surf2)] text-[var(--brand)]">
					<CalendarDays className="h-[24px] w-[24px]" />
				</span>
				<div className="font-['Anton'] text-[20px] uppercase text-[var(--tx)]">No seasons yet</div>
				<p className="max-w-[320px] font-['Archivo'] text-[13px] text-[var(--txm)]">
					Add a season to this league to start scheduling matches.
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			{seasons.map((season) => {
				const badge = seasonBadge(season);
				const style = BADGE_STYLE[badge];
				const progress = seasonProgress(season);

				return (
					<div
						key={season.id}
						className="flex flex-wrap items-center gap-4 rounded-xl border border-[var(--bord)] bg-[var(--surf)] px-5 py-4"
					>
						<span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--brand)]/[0.12] text-[var(--brand)]">
							<CalendarDays className="h-[20px] w-[20px]" />
						</span>

						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-2">
								<h3 className="font-['Anton'] text-[17px] uppercase text-[var(--tx)]">{season.name}</h3>
								<span
									className="rounded-md px-2 py-0.5 font-['Space_Mono'] text-[9.5px] font-bold uppercase tracking-[0.06em]"
									style={{ background: style.bg, color: style.fg }}
								>
									{badge}
								</span>
							</div>
							<p className="mt-0.5 font-['Space_Mono'] text-[11px] text-[var(--txm)]">
								{rangeFmt(season.startDate, season.endDate)} · {season.teams} teams · {season.matches} matches
							</p>
						</div>

						<div className="flex items-center gap-6 max-[600px]:w-full max-[600px]:justify-between">
							<div className="text-center">
								<div className="font-['Anton'] text-[20px] leading-none text-[var(--tx)]">{progress}%</div>
								<div className="mt-1 font-['Space_Mono'] text-[9px] uppercase tracking-[0.08em] text-[var(--txm)]">
									Played
								</div>
							</div>
							<a
								href={`/admin/seasons/${season.id}`}
								className="rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-2 font-['Archivo'] text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--txd)] no-underline hover:border-[var(--brand)] hover:text-[var(--brand)]"
							>
								Open
							</a>
						</div>
					</div>
				);
			})}
		</div>
	);
}
