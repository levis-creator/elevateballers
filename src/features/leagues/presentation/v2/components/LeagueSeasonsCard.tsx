import { useEffect, useState } from "react";
import { CalendarDays, Link2, Plus, MoreVertical } from "lucide-react";
import {
	seasonStatus,
	type SeasonStatus,
	type LeagueSeasonSummary,
} from "@/features/leagues/domain/entities/league-detail";
import CardHeader from "./CardHeader";
import LinkSeasonModal from "./LinkSeasonModal";

const BADGE_STYLE: Record<SeasonStatus, { bg: string; fg: string; dot: string }> = {
	Live: { bg: "rgba(31,157,85,0.16)", fg: "#1f9d55", dot: "#1f9d55" },
	Upcoming: { bg: "rgba(42,111,219,0.16)", fg: "#5b93e8", dot: "#2a6fdb" },
	Completed: { bg: "var(--chip)", fg: "var(--txm)", dot: "#8a817a" },
};

const dateFmt = (iso: string) => {
	const d = new Date(iso);
	return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

/** "SINGLE_ELIMINATION" → "Single elimination". */
const prettyBracket = (raw: string | null) => {
	if (!raw) return "—";
	const words = raw.replace(/[_-]+/g, " ").toLowerCase().trim();
	return words.charAt(0).toUpperCase() + words.slice(1);
};

interface Props {
	seasons: LeagueSeasonSummary[];
	canManageSeasons: boolean;
	canCreateSeason: boolean;
	fetchLinkable: () => Promise<any[]>;
	onLink: (seasonId: string) => Promise<void>;
	onUnlink: (seasonId: string, seasonName: string) => Promise<void>;
}

export default function LeagueSeasonsCard({
	seasons,
	canManageSeasons,
	canCreateSeason,
	fetchLinkable,
	onLink,
	onUnlink,
}: Props) {
	const [menuId, setMenuId] = useState<string | null>(null);
	const [linkOpen, setLinkOpen] = useState(false);

	useEffect(() => {
		if (!menuId) return;
		const onDown = (e: MouseEvent) => {
			if (!(e.target as HTMLElement).closest("[data-kebab]")) setMenuId(null);
		};
		document.addEventListener("mousedown", onDown);
		return () => document.removeEventListener("mousedown", onDown);
	}, [menuId]);

	const actions = (
		<>
			{canManageSeasons && (
				<button
					type="button"
					onClick={() => setLinkOpen(true)}
					className="flex items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-2 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
				>
					<Link2 className="h-[14px] w-[14px]" />
					Link existing
				</button>
			)}
			{canCreateSeason && (
				<a
					href="/admin/seasons/new"
					className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-3.5 py-2 font-['Archivo'] text-[12px] font-extrabold uppercase tracking-[0.04em] text-white no-underline hover:bg-[var(--brandlt)]"
				>
					<Plus className="h-[14px] w-[14px]" />
					Create season
				</a>
			)}
		</>
	);

	return (
		<div className="overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)]">
			<CardHeader
				icon={CalendarDays}
				title="Seasons"
				subtitle="Manage seasons for this league"
				actions={actions}
			/>

			{seasons.length === 0 ? (
				<div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
					<span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surf2)] text-[var(--brand)]">
						<CalendarDays className="h-[22px] w-[22px]" />
					</span>
					<div className="font-['Anton'] text-[18px] uppercase text-[var(--tx)]">No seasons yet</div>
					<p className="max-w-[320px] font-['Archivo'] text-[13px] text-[var(--txm)]">
						Create a season or link an existing one to start scheduling matches.
					</p>
				</div>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full border-collapse">
						<thead>
							<tr>
								<Th className="px-6 text-left">Season</Th>
								<Th className="px-4 text-left max-[600px]:hidden">Date range</Th>
								<Th className="px-4 text-left max-[720px]:hidden">Bracket</Th>
								<Th className="px-4 text-center">Matches</Th>
								<Th className="px-4 text-left">Status</Th>
								<th className="w-[52px] border-b border-[var(--bord2)] px-4 py-3" />
							</tr>
						</thead>
						<tbody>
							{seasons.map((season) => {
								const badge = seasonStatus(season);
								const style = BADGE_STYLE[badge];
								return (
									<tr key={season.id} className="hover:bg-[var(--hov)]">
										<td className="border-b border-[var(--bord2)] px-6 py-3.5 align-middle">
											<div className="font-['Archivo'] text-[13.5px] font-bold text-[var(--tx)]">{season.name}</div>
											<div className="mt-0.5 font-['Space_Mono'] text-[11px] text-[var(--txm)]">
												{season.teams} team{season.teams === 1 ? "" : "s"}
											</div>
										</td>
										<td className="border-b border-[var(--bord2)] px-4 py-3.5 align-middle font-['Space_Mono'] text-[11.5px] leading-[1.5] text-[var(--txd)] max-[600px]:hidden">
											{dateFmt(season.startDate)} → {dateFmt(season.endDate)}
										</td>
										<td className="border-b border-[var(--bord2)] px-4 py-3.5 align-middle font-['Archivo'] text-[12.5px] text-[var(--txm)] max-[720px]:hidden">
											{prettyBracket(season.bracketType)}
										</td>
										<td className="border-b border-[var(--bord2)] px-4 py-3.5 text-center align-middle font-['Anton'] text-[16px] text-[var(--tx)]">
											{season.matches}
										</td>
										<td className="border-b border-[var(--bord2)] px-4 py-3.5 align-middle">
											<span
												className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-['Space_Mono'] text-[10px] font-bold uppercase tracking-[0.06em]"
												style={{ background: style.bg, color: style.fg }}
											>
												<span className="h-1.5 w-1.5 rounded-full" style={{ background: style.dot }} />
												{badge}
											</span>
										</td>
										<td className="border-b border-[var(--bord2)] px-4 py-3.5 align-middle">
											<div className="relative" data-kebab>
												<button
													type="button"
													aria-label="More options"
													onClick={() => setMenuId(menuId === season.id ? null : season.id)}
													className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--txm)] hover:bg-[var(--hov)] hover:text-[var(--brand)]"
												>
													<MoreVertical className="h-[15px] w-[15px]" />
												</button>
												{menuId === season.id && (
													<div className="absolute right-0 top-8 z-50 w-[190px] overflow-hidden rounded-lg border border-[var(--bord)] bg-[var(--surf)] shadow-[0_14px_40px_rgba(0,0,0,0.4)]">
														<a
															href={`/admin/seasons/${season.id}`}
															className="block w-full px-3.5 py-2.5 text-left font-['Archivo'] text-[12.5px] font-semibold text-[var(--txd)] no-underline hover:bg-[var(--hov)]"
														>
															Edit season
														</a>
														{canManageSeasons && (
															<button
																type="button"
																onClick={() => {
																	setMenuId(null);
																	onUnlink(season.id, season.name);
																}}
																className="block w-full px-3.5 py-2.5 text-left font-['Archivo'] text-[12.5px] font-semibold text-[var(--brand)] hover:bg-[var(--hov)]"
															>
																Unlink from league
															</button>
														)}
													</div>
												)}
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}

			{linkOpen && (
				<LinkSeasonModal onClose={() => setLinkOpen(false)} fetchLinkable={fetchLinkable} onLink={onLink} />
			)}
		</div>
	);
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
	return (
		<th
			className={`border-b border-[var(--bord2)] py-3 font-['Space_Mono'] text-[10px] uppercase tracking-[0.1em] text-[var(--txm)] ${className}`}
		>
			{children}
		</th>
	);
}
