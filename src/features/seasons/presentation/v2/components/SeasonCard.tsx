import { CalendarDays, Check, MoreVertical, Volleyball } from "lucide-react";
import { avatarTint } from "@/lib/avatar";
import {
	type AdminSeason,
	type SeasonStatus,
	formatRange,
	seasonProgress,
	seasonStatus,
} from "@/features/seasons/domain/entities/season";

const STATUS_STYLE: Record<SeasonStatus, { bg: string; fg: string; dot: string }> = {
	Live: { bg: "rgba(228,0,43,0.14)", fg: "#e4002b", dot: "#e4002b" },
	Upcoming: { bg: "rgba(217,131,36,0.16)", fg: "#c9741d", dot: "#d98324" },
	Completed: { bg: "rgba(31,157,85,0.16)", fg: "#1f9d55", dot: "#1f9d55" },
};

interface Props {
	season: AdminSeason;
	checked: boolean;
	menuOpen: boolean;
	canUpdate: boolean;
	canDelete: boolean;
	onToggleCheck: (id: string) => void;
	onToggleMenu: (id: string | null) => void;
	onSetActive: (id: string, active: boolean) => void;
	onDelete: (id: string) => void;
}

export default function SeasonCard({
	season,
	checked,
	menuOpen,
	canUpdate,
	canDelete,
	onToggleCheck,
	onToggleMenu,
	onSetActive,
	onDelete,
}: Props) {
	const status = seasonStatus(season);
	const pill = STATUS_STYLE[status];
	const progress = seasonProgress(season);
	const editHref = `/admin/seasons/${season.id}`;
	const matchesHref = `/admin/seasons/${season.id}/matches`;

	// The card's accent follows its first league, so a season keeps the same
	// colour wherever it appears. A season with no league falls back to neutral.
	const accent = season.leagues.length ? avatarTint(season.leagues[0]!.id) : "#8a817a";
	const isCompleted = status === "Completed";

	const open = () => {
		window.location.href = editHref;
	};

	return (
		<div
			role="link"
			tabIndex={0}
			onClick={open}
			onKeyDown={(e) => {
				if (e.key === "Enter") open();
			}}
			className={`group relative cursor-pointer rounded-2xl border bg-[var(--surf)] p-5 transition-colors hover:border-[var(--brand)]/40 hover:shadow-[0_10px_30px_rgba(0,0,0,0.28)] max-[600px]:p-4 ${
				checked ? "border-[var(--brand)]/60 shadow-[inset_0_0_0_2px_rgba(228,0,43,0.5)]" : "border-[var(--bord)]"
			}`}
		>
			<div className="flex items-start gap-4 max-[600px]:flex-col">
				<button
					type="button"
					aria-label={`Select ${season.name}`}
					aria-pressed={checked}
					onClick={(e) => {
						e.stopPropagation();
						onToggleCheck(season.id);
					}}
					className={`mt-3.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px] ${
						checked
							? "border-[var(--brand)] bg-[var(--brand)] text-white"
							: "border-[var(--bord)] text-transparent hover:border-[var(--brand)]"
					}`}
				>
					<Check className="h-3 w-3" strokeWidth={3} />
				</button>

				<span
					className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
					style={{ background: `${accent}22`, color: accent }}
				>
					<CalendarDays className="h-[22px] w-[22px]" />
				</span>

				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2.5">
						<h3 className="font-['Anton'] text-[20px] uppercase leading-none text-[var(--tx)]">{season.name}</h3>
						<span
							className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-['Space_Mono'] text-[10px] font-bold uppercase tracking-[0.06em]"
							style={{ background: pill.bg, color: pill.fg }}
						>
							<span className="h-1.5 w-1.5 rounded-full" style={{ background: pill.dot }} />
							{status}
						</span>

						{season.leagues.length > 0 ? (
							season.leagues.map((league) => (
								<span
									key={league.id}
									className="inline-flex items-center gap-1.5 rounded-md border border-[var(--bord)] bg-[var(--surf2)] px-2.5 py-1 font-['Space_Mono'] text-[10.5px] font-bold text-[var(--txd)]"
								>
									<span className="h-1.5 w-1.5 rounded-full" style={{ background: avatarTint(league.id) }} />
									{league.name}
								</span>
							))
						) : (
							<span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--bord)] bg-[var(--surf2)] px-2.5 py-1 font-['Space_Mono'] text-[10.5px] font-bold text-[var(--txm)]">
								<span className="h-1.5 w-1.5 rounded-full bg-[#8a817a]" />
								Unaffiliated
							</span>
						)}
					</div>

					{season.description && (
						<p className="mt-1.5 font-['Archivo'] text-[13px] text-[var(--txm)]">{season.description}</p>
					)}

					<div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
						<span className="inline-flex items-center gap-2 font-['Space_Mono'] text-[11.5px] text-[var(--txd)]">
							<CalendarDays className="h-[14px] w-[14px] text-[var(--txm)]" />
							{formatRange(season.startDate, season.endDate)}
						</span>
						<span className="inline-flex items-center gap-2 font-['Space_Mono'] text-[11.5px] text-[var(--txd)]">
							<Volleyball className="h-[14px] w-[14px] text-[var(--txm)]" />
							{season.matches} {season.matches === 1 ? "match" : "matches"}
						</span>
					</div>
				</div>

				<div className="flex w-[168px] flex-shrink-0 flex-col items-end gap-2 max-[600px]:w-full max-[600px]:flex-row max-[600px]:items-center max-[600px]:justify-between">
					<div className="w-full max-[600px]:max-w-[200px]">
						<div className="mb-1 flex items-baseline justify-between font-['Space_Mono'] text-[10px] uppercase tracking-[0.08em] text-[var(--txm)]">
							<span>Played</span>
							<span className="font-['Anton'] text-[14px] tracking-normal text-[var(--tx)]">{progress}%</span>
						</div>
						<div className="h-1.5 overflow-hidden rounded-full bg-[var(--chip)]">
							<div
								className="h-full rounded-full"
								style={{
									width: `${progress}%`,
									background: isCompleted ? "#1f9d55" : "linear-gradient(to right,#e4002b,#ff2d43)",
								}}
							/>
						</div>
					</div>

					<div className="relative flex items-center gap-1.5" data-kebab>
						<a
							href={editHref}
							onClick={(e) => e.stopPropagation()}
							className="rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3 py-1.5 font-['Archivo'] text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--txd)] no-underline hover:border-[var(--brand)] hover:text-[var(--brand)]"
						>
							Open
						</a>

						<button
							type="button"
							aria-label="More options"
							onClick={(e) => {
								e.stopPropagation();
								onToggleMenu(menuOpen ? null : season.id);
							}}
							className={`flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-[var(--bord)] text-[var(--txm)] hover:text-[var(--brand)] ${
								menuOpen ? "bg-[var(--hov)]" : "bg-[var(--surf2)]"
							}`}
						>
							<MoreVertical className="h-[15px] w-[15px]" />
						</button>

						{menuOpen && (
							<div
								onClick={(e) => e.stopPropagation()}
								className="absolute right-0 top-[38px] z-50 w-[190px] overflow-hidden rounded-lg border border-[var(--bord)] bg-[var(--surf)] shadow-[0_14px_40px_rgba(0,0,0,0.4)]"
							>
								<a
									href={matchesHref}
									className="block w-full px-3.5 py-2.5 text-left font-['Archivo'] text-[12.5px] font-semibold text-[var(--txd)] no-underline hover:bg-[var(--hov)]"
								>
									View matches
								</a>
								<a
									href={editHref}
									className="block w-full px-3.5 py-2.5 text-left font-['Archivo'] text-[12.5px] font-semibold text-[var(--txd)] no-underline hover:bg-[var(--hov)]"
								>
									Edit season
								</a>
								{canUpdate && (
									<button
										type="button"
										onClick={() => {
											onToggleMenu(null);
											onSetActive(season.id, !season.active);
										}}
										className="block w-full px-3.5 py-2.5 text-left font-['Archivo'] text-[12.5px] font-semibold text-[var(--txd)] hover:bg-[var(--hov)]"
									>
										{season.active ? "Mark completed" : "Reopen"}
									</button>
								)}
								{canDelete && (
									<button
										type="button"
										onClick={() => {
											onToggleMenu(null);
											onDelete(season.id);
										}}
										className="block w-full px-3.5 py-2.5 text-left font-['Archivo'] text-[12.5px] font-semibold text-[var(--brand)] hover:bg-[var(--hov)]"
									>
										Delete
									</button>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
