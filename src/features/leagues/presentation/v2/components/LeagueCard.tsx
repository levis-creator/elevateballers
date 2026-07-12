import { Trophy, Check, MoreVertical } from "lucide-react";
import EntityAvatar from "@/components/EntityAvatar";
import { type AdminLeague, leagueStatus } from "@/features/leagues/domain/entities/league";

const STATUS_STYLE: Record<string, { bg: string; fg: string; dot: string }> = {
	Registering: { bg: "rgba(31,157,85,0.16)", fg: "#1f9d55", dot: "#1f9d55" },
	Active: { bg: "rgba(42,111,219,0.16)", fg: "#5b93e8", dot: "#2a6fdb" },
	Archived: { bg: "var(--chip)", fg: "var(--txm)", dot: "#8a817a" },
};

interface Props {
	league: AdminLeague;
	checked: boolean;
	menuOpen: boolean;
	canUpdate: boolean;
	canDelete: boolean;
	onToggleCheck: (id: string) => void;
	onToggleMenu: (id: string | null) => void;
	onSetActive: (id: string, active: boolean) => void;
	onDelete: (id: string) => void;
}

export default function LeagueCard({
	league,
	checked,
	menuOpen,
	canUpdate,
	canDelete,
	onToggleCheck,
	onToggleMenu,
	onSetActive,
	onDelete,
}: Props) {
	const status = leagueStatus(league);
	const pill = STATUS_STYLE[status];
	const editHref = `/admin/leagues/${league.id}`;
	const detailHref = `/admin/leagues/${league.id}/view`;

	// Clicking the card opens the league's detail page; editing is an explicit choice.
	const open = () => {
		window.location.href = detailHref;
	};

	return (
		<div
			role="link"
			tabIndex={0}
			onClick={open}
			onKeyDown={(e) => {
				if (e.key === "Enter") open();
			}}
			className={`group relative cursor-pointer rounded-2xl border bg-[var(--surf)] p-5 transition-colors hover:border-[var(--brand)]/40 hover:shadow-[0_10px_30px_rgba(0,0,0,0.28)] ${
				checked ? "border-[var(--brand)]/60" : "border-[var(--bord)]"
			} ${league.active ? "" : "opacity-70"}`}
		>
			<div className="flex items-start gap-3.5">
				<button
					type="button"
					aria-label={`Select ${league.name}`}
					aria-pressed={checked}
					onClick={(e) => {
						e.stopPropagation();
						onToggleCheck(league.id);
					}}
					className={`mt-1 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded border ${
						checked
							? "border-[var(--brand)] bg-[var(--brand)] text-white"
							: "border-[var(--bord)] text-transparent hover:border-[var(--brand)]"
					}`}
				>
					<Check className="h-3 w-3" strokeWidth={3} />
				</button>

				<EntityAvatar
					seed={league.id || league.name}
					src={league.logo}
					fallback={<Trophy className="h-[24px] w-[24px]" />}
					className="h-12 w-12 rounded-xl"
				/>

				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<h3 className="truncate font-['Anton'] text-[19px] uppercase tracking-[0.01em] text-[var(--tx)]">
							{league.name}
						</h3>
						<span
							className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 font-['Space_Mono'] text-[9.5px] font-bold uppercase tracking-[0.06em]"
							style={{ background: pill.bg, color: pill.fg }}
						>
							<span className="h-1.5 w-1.5 rounded-full" style={{ background: pill.dot }} />
							{status}
						</span>
					</div>
					<p className="mt-0.5 truncate font-['Archivo'] text-[12.5px] text-[var(--txm)]">
						{league.description || `/${league.slug}`}
					</p>
				</div>

				{(canUpdate || canDelete) && (
					<div className="relative flex-shrink-0" data-kebab>
						<button
							type="button"
							aria-label="More options"
							onClick={(e) => {
								e.stopPropagation();
								onToggleMenu(menuOpen ? null : league.id);
							}}
							className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--txm)] hover:bg-[var(--hov)] hover:text-[var(--brand)]"
						>
							<MoreVertical className="h-[15px] w-[15px]" />
						</button>

						{menuOpen && (
							<div
								onClick={(e) => e.stopPropagation()}
								className="absolute right-0 top-8 z-50 w-[190px] overflow-hidden rounded-lg border border-[var(--bord)] bg-[var(--surf)] shadow-[0_14px_40px_rgba(0,0,0,0.4)]"
							>
								<a
									href={detailHref}
									className="block w-full px-3.5 py-2.5 text-left font-['Archivo'] text-[12.5px] font-semibold text-[var(--txd)] no-underline hover:bg-[var(--hov)]"
								>
									View details
								</a>
								<a
									href={editHref}
									className="block w-full px-3.5 py-2.5 text-left font-['Archivo'] text-[12.5px] font-semibold text-[var(--txd)] no-underline hover:bg-[var(--hov)]"
								>
									Edit league
								</a>
								{canUpdate && (
									<button
										type="button"
										onClick={() => {
											onToggleMenu(null);
											onSetActive(league.id, !league.active);
										}}
										className="block w-full px-3.5 py-2.5 text-left font-['Archivo'] text-[12.5px] font-semibold text-[var(--txd)] hover:bg-[var(--hov)]"
									>
										{league.active ? "Set archived" : "Restore"}
									</button>
								)}
								{canDelete && (
									<button
										type="button"
										onClick={() => {
											onToggleMenu(null);
											onDelete(league.id);
										}}
										className="block w-full px-3.5 py-2.5 text-left font-['Archivo'] text-[12.5px] font-semibold text-[var(--brand)] hover:bg-[var(--hov)]"
									>
										Delete
									</button>
								)}
							</div>
						)}
					</div>
				)}
			</div>

			<div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--bord2)] pt-4">
				<Stat value={league._count.leagueSeasons} label="Seasons" />
				<Stat value={league._count.matches} label="Matches" className="border-x border-[var(--bord2)]" />
				<Stat value={league.teamCount ?? 0} label="Teams" />
			</div>
		</div>
	);
}

function Stat({ value, label, className = "" }: { value: number; label: string; className?: string }) {
	return (
		<div className={`text-center ${className}`}>
			<div className="font-['Anton'] text-[22px] leading-none text-[var(--tx)]">{value}</div>
			<div className="mt-1 font-['Space_Mono'] text-[9px] uppercase tracking-[0.08em] text-[var(--txm)]">{label}</div>
		</div>
	);
}
