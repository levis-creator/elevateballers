import { Trophy, Pencil, Plus } from "lucide-react";
import { leagueStatus, type AdminLeague } from "@/features/leagues/domain/entities/league";
import type { LeagueDetailStats } from "@/features/leagues/domain/entities/league-detail";

const STATUS_STYLE: Record<string, { bg: string; fg: string; dot: string }> = {
	Registering: { bg: "rgba(31,157,85,0.16)", fg: "#1f9d55", dot: "#1f9d55" },
	Active: { bg: "rgba(42,111,219,0.16)", fg: "#5b93e8", dot: "#2a6fdb" },
	Archived: { bg: "var(--chip)", fg: "var(--txm)", dot: "#8a817a" },
};

const dateFmt = (iso: string) => {
	const d = new Date(iso);
	return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
};

interface Props {
	league: AdminLeague;
	stats: LeagueDetailStats;
	canUpdate: boolean;
	canCreateSeason: boolean;
	onSetActive: (active: boolean) => void;
}

export default function LeagueHero({ league, stats, canUpdate, canCreateSeason, onSetActive }: Props) {
	const status = leagueStatus(league);
	const pill = STATUS_STYLE[status];

	// Only real, stored facts — the schema has no "founded" or "region" field.
	const facts = [league.description, `/${league.slug}`, `Created ${dateFmt(league.createdAt)}`]
		.filter(Boolean)
		.join(" · ");

	const rail: Array<{ value: number; label: string }> = [
		{ value: stats.seasons, label: "Seasons" },
		{ value: stats.teams, label: "Teams" },
		{ value: stats.matches, label: "Matches" },
		{ value: stats.completed, label: "Completed" },
	];

	return (
		<div className="relative mb-5 overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)] p-6 max-[600px]:p-5">
			<div
				className="pointer-events-none absolute inset-0"
				style={{ background: "radial-gradient(70% 130% at 92% -20%, rgba(228,0,43,0.22), transparent 55%)" }}
			/>
			{/* Decorative half-court arc, mirroring the mockup. */}
			<svg
				className="pointer-events-none absolute -right-[40px] -top-[60px] h-[230px] w-[230px] max-[760px]:hidden"
				viewBox="0 0 408 408"
				fill="none"
				aria-hidden="true"
			>
				<defs>
					<clipPath id="league-hero-clip">
						<circle cx="204" cy="204" r="180" />
					</clipPath>
				</defs>
				<circle cx="204" cy="204" r="180" fill="none" stroke="#e4002b" strokeWidth="2" strokeOpacity="0.18" />
				<g clipPath="url(#league-hero-clip)" stroke="#e4002b" strokeWidth="2" strokeOpacity="0.18" fill="none">
					<line x1="204" y1="20" x2="204" y2="388" />
					<line x1="20" y1="204" x2="388" y2="204" />
					<path d="M92 40 C 168 150, 168 258, 92 368" />
					<path d="M316 40 C 240 150, 240 258, 316 368" />
				</g>
			</svg>

			<div className="relative flex flex-wrap items-start gap-5">
				<span className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--brand)]/[0.12] text-[var(--brand)]">
					{league.logo ? (
						<img src={league.logo} alt="" className="h-full w-full object-cover" />
					) : (
						<Trophy className="h-[38px] w-[38px]" />
					)}
				</span>

				<div className="min-w-0 flex-1">
					<div className="mb-2 flex flex-wrap items-center gap-2.5">
						<h1 className="font-['Anton'] text-[40px] uppercase leading-[0.9] text-[var(--tx)] max-[600px]:text-[30px]">
							{league.name}
						</h1>
						<span
							className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-['Space_Mono'] text-[10px] font-bold uppercase tracking-[0.06em]"
							style={{ background: pill.bg, color: pill.fg }}
						>
							<span className="h-1.5 w-1.5 rounded-full" style={{ background: pill.dot }} />
							{status}
						</span>
					</div>
					<p className="mb-4 font-['Archivo'] text-[14px] text-[var(--txd)]">{facts}</p>

					<div className="flex flex-wrap gap-2">
						{canUpdate && (
							<a
								href={`/admin/leagues/${league.id}`}
								className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2.5 font-['Archivo'] text-[12px] font-extrabold uppercase tracking-[0.04em] text-white no-underline hover:bg-[var(--brandlt)]"
							>
								<Pencil className="h-[14px] w-[14px]" />
								Edit league
							</a>
						)}
						{canCreateSeason && (
							<a
								href="/admin/seasons/new"
								className="flex items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-4 py-2.5 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] no-underline hover:border-[var(--brand)] hover:text-[var(--brand)]"
							>
								<Plus className="h-[14px] w-[14px]" />
								New season
							</a>
						)}
						{canUpdate && (
							<button
								type="button"
								onClick={() => onSetActive(!league.active)}
								className="flex items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-4 py-2.5 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
							>
								{league.active ? "Archive league" : "Restore league"}
							</button>
						)}
					</div>
				</div>
			</div>

			<div className="relative mt-6 grid grid-cols-4 gap-3 border-t border-[var(--bord2)] pt-5 max-[600px]:grid-cols-2">
				{rail.map((stat) => (
					<div key={stat.label}>
						<div className="font-['Anton'] text-[30px] leading-none text-[var(--tx)]">{stat.value}</div>
						<div className="mt-1.5 font-['Space_Mono'] text-[10px] uppercase tracking-[0.1em] text-[var(--txm)]">
							{stat.label}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
