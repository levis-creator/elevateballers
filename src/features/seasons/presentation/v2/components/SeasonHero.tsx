import { CalendarDays, Pencil, Plus, Volleyball } from "lucide-react";
import { avatarTint } from "@/lib/avatar";
import {
	type AdminSeason,
	type SeasonStatus,
	formatRange,
	seasonProgress,
	seasonStatus,
} from "@/features/seasons/domain/entities/season";
import type { SeasonDetailStats } from "@/features/seasons/domain/entities/season-detail";

const STATUS_STYLE: Record<SeasonStatus, { bg: string; fg: string; dot: string }> = {
	Live: { bg: "rgba(228,0,43,0.14)", fg: "#e4002b", dot: "#e4002b" },
	Upcoming: { bg: "rgba(217,131,36,0.16)", fg: "#c9741d", dot: "#d98324" },
	Completed: { bg: "rgba(31,157,85,0.16)", fg: "#1f9d55", dot: "#1f9d55" },
};

interface Props {
	season: AdminSeason;
	stats: SeasonDetailStats;
	canUpdate: boolean;
	canCreateMatch: boolean;
}

export default function SeasonHero({ season, stats, canUpdate, canCreateMatch }: Props) {
	const status = seasonStatus(season);
	const pill = STATUS_STYLE[status];
	const progress = seasonProgress(season);
	const accent = season.leagues.length ? avatarTint(season.leagues[0]!.id) : "#8a817a";

	const rail = [
		{ value: stats.matches, label: "Matches" },
		{ value: stats.played, label: "Played" },
		{ value: stats.remaining, label: "Remaining" },
		{ value: stats.teams, label: "Teams" },
	];

	return (
		<div className="relative mb-5 overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)] p-6 max-[600px]:p-5">
			<div
				className="pointer-events-none absolute inset-0"
				style={{ background: "radial-gradient(70% 130% at 92% -20%,rgba(228,0,43,0.22),transparent 55%)" }}
			/>

			<div className="relative flex flex-wrap items-start gap-5">
				<span
					className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded-2xl"
					style={{ background: `${accent}22`, color: accent }}
				>
					<CalendarDays className="h-9 w-9" />
				</span>

				<div className="min-w-0 flex-1">
					<div className="mb-2 flex flex-wrap items-center gap-2.5">
						<h1 className="font-['Anton'] text-[40px] uppercase leading-[0.9] text-[var(--tx)] max-[600px]:text-[30px]">
							{season.name}
						</h1>
						<span
							className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-['Space_Mono'] text-[10px] font-bold uppercase tracking-[0.06em]"
							style={{ background: pill.bg, color: pill.fg }}
						>
							<span className="h-1.5 w-1.5 rounded-full" style={{ background: pill.dot }} />
							{status}
						</span>

						{season.leagues.map((league) => (
							<a
								key={league.id}
								href={`/admin/leagues/${league.id}/view`}
								className="inline-flex items-center gap-1.5 rounded-md border border-[var(--bord)] bg-[var(--surf2)] px-2.5 py-1 font-['Space_Mono'] text-[10.5px] font-bold text-[var(--txd)] no-underline hover:border-[var(--brand)] hover:text-[var(--brand)]"
							>
								<span className="h-1.5 w-1.5 rounded-full" style={{ background: avatarTint(league.id) }} />
								{league.name}
							</a>
						))}
					</div>

					<p className="mb-4 font-['Archivo'] text-[14px] text-[var(--txd)]">
						{season.description ? `${season.description} · ` : ""}
						{formatRange(season.startDate, season.endDate)}
					</p>

					<div className="flex flex-wrap gap-2">
						<a
							href={`/admin/seasons/${season.id}/matches`}
							className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2.5 font-['Archivo'] text-[12px] font-extrabold uppercase tracking-[0.04em] text-white no-underline hover:bg-[var(--brandlt)]"
						>
							<Volleyball className="h-[14px] w-[14px]" />
							View matches
						</a>
						{canUpdate && (
							<a
								href={`/admin/seasons/${season.id}`}
								className="flex items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-4 py-2.5 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] no-underline hover:border-[var(--brand)] hover:text-[var(--brand)]"
							>
								<Pencil className="h-[14px] w-[14px]" />
								Edit season
							</a>
						)}
						{canCreateMatch && (
							<a
								href={`/admin/matches/new?seasonId=${season.id}`}
								className="flex items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-4 py-2.5 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] no-underline hover:border-[var(--brand)] hover:text-[var(--brand)]"
							>
								<Plus className="h-[14px] w-[14px]" />
								Add fixture
							</a>
						)}
					</div>
				</div>
			</div>

			{/* progress */}
			<div className="relative mt-6 border-t border-[var(--bord2)] pt-5">
				<div className="mb-1.5 flex items-baseline justify-between font-['Space_Mono'] text-[11px] uppercase tracking-[0.1em] text-[var(--txm)]">
					<span>Season progress</span>
					<span className="text-[var(--tx)]">
						{stats.played} / {stats.matches} matches
					</span>
				</div>
				<div className="h-2 overflow-hidden rounded-full bg-[var(--chip)]">
					<div
						className="h-full rounded-full"
						style={{
							width: `${progress}%`,
							background: status === "Completed" ? "#1f9d55" : "linear-gradient(to right,#e4002b,#ff2d43)",
						}}
					/>
				</div>
				<div className="mt-1.5 font-['Space_Mono'] text-[10px] tracking-[0.06em] text-[var(--faint)]">
					{progress}% complete · {stats.remaining} {stats.remaining === 1 ? "match" : "matches"} remaining
				</div>
			</div>

			{/* stat rail */}
			<div className="relative mt-5 grid grid-cols-4 gap-3 border-t border-[var(--bord2)] pt-5 max-[600px]:grid-cols-2">
				{rail.map((stat) => (
					<div key={stat.label}>
						<div className="font-['Anton'] text-[28px] leading-none text-[var(--tx)]">{stat.value}</div>
						<div className="mt-1.5 font-['Space_Mono'] text-[10px] uppercase tracking-[0.1em] text-[var(--txm)]">
							{stat.label}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
