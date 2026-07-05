import { usePlayersDirectoryStore } from "@/features/player/presentation/stores/v2/usePlayersDirectoryStore";
import type { PlayerSort, PosFilter } from "@/features/player/presentation/stores/v2/usePlayersDirectoryStore";
import type { PlayersDirectoryData, PlayerCard } from "@/features/player/domain/entities/players-directory-v2";

interface Props {
	data: PlayersDirectoryData;
	perPage?: number;
}

const STRIPE = "repeating-linear-gradient(45deg,#e7e2da,#e7e2da 12px,#f0ece5 12px,#f0ece5 24px)";

const selectCls =
	"cursor-pointer appearance-none rounded-lg border border-black/15 bg-white py-2.5 pl-3.5 pr-9 font-body text-[13px] font-semibold text-ink2 outline-none";

const posPill = (on: boolean): string =>
	`cursor-pointer rounded-lg border px-3.5 py-[9px] text-[12px] uppercase tracking-[0.04em] ${
		on ? "border-brand bg-brand font-bold text-white" : "border-black/15 bg-white font-semibold text-muted hover:border-brand"
	}`;

const pagerBtn = (active: boolean): string =>
	`h-[38px] min-w-[38px] cursor-pointer rounded-lg border font-display text-[14px] ${
		active ? "border-brand bg-brand text-white" : "border-black/15 bg-white text-muted hover:border-brand"
	}`;

const POS_TABS: Array<[PosFilter, string]> = [
	["All", "All"],
	["G", "Guards"],
	["F", "Forwards"],
	["C", "Centers"],
];
const SORT_OPTIONS: Array<[PlayerSort, string]> = [
	["ppg", "Sort: Points"],
	["rpg", "Sort: Rebounds"],
	["apg", "Sort: Assists"],
	["name", "Sort: Name (A–Z)"],
];

/** Players directory — search + team + position + sort + paginated card grid.
 *  React island; all filter state lives in a Zustand store. */
export default function PlayersBoard({ data, perPage = 12 }: Props) {
	const { q, team, pos, sort, page, setQ, setTeam, setPos, setSort, setPage } = usePlayersDirectoryStore();
	const query = q.trim().toLowerCase();

	let list = data.players
		.filter((p) => team === "All Teams" || p.team === team)
		.filter((p) => pos === "All" || p.posCode === pos)
		.filter((p) => !query || p.name.toLowerCase().includes(query) || p.team.toLowerCase().includes(query));

	list =
		sort === "name"
			? [...list].sort((a, b) => a.name.localeCompare(b.name))
			: [...list].sort((a, b) => b[sort] - a[sort]);

	const totalPages = Math.max(1, Math.ceil(list.length / perPage));
	const current = Math.min(Math.max(1, page), totalPages);
	const pageItems = list.slice((current - 1) * perPage, current * perPage);
	const emptyBody = query
		? `Nothing matches “${q}”. Try another name or team.`
		: "No players match these filters. Try clearing them.";

	return (
		<>
			{/* FILTER BAR */}
			<section className="sticky top-[71px] z-40 border-b border-black/[0.08] bg-panel/95 backdrop-blur-md">
				<div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-3 px-8 py-4 max-[960px]:px-6">
					<div className="flex items-center gap-2.5 rounded-lg border border-black/15 bg-white px-4 py-2.5">
						<span className="font-mono text-[13px] text-muted2">⌕</span>
						<input
							type="text"
							value={q}
							onChange={(e) => setQ(e.target.value)}
							placeholder="Search players…"
							className="w-[220px] border-none bg-transparent font-body text-[14px] text-ink2 outline-none max-[600px]:w-[130px]"
						/>
					</div>

					<div className="relative">
						<select value={team} onChange={(e) => setTeam(e.target.value)} className={`${selectCls} max-w-[220px]`}>
							{data.teams.map((t) => (
								<option key={t} value={t}>
									{t}
								</option>
							))}
						</select>
						<span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-muted">▼</span>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{POS_TABS.map(([v, label]) => (
							<button key={v} type="button" onClick={() => setPos(v)} className={posPill(pos === v)}>
								{label}
							</button>
						))}
					</div>

					<div className="relative ml-auto">
						<select value={sort} onChange={(e) => setSort(e.target.value as PlayerSort)} className={selectCls}>
							{SORT_OPTIONS.map(([v, label]) => (
								<option key={v} value={v}>
									{label}
								</option>
							))}
						</select>
						<span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-muted">▼</span>
					</div>
				</div>
			</section>

			{/* PLAYER GRID */}
			<section className="mx-auto max-w-[1280px] px-8 py-[48px] max-[960px]:px-6 max-[960px]:py-9">
				{pageItems.length > 0 ? (
					<>
						<div className="grid grid-cols-4 gap-5 max-[600px]:grid-cols-2 max-[960px]:grid-cols-3">
							{pageItems.map((p) => (
								<PlayerTile key={p.id} p={p} />
							))}
						</div>

						{totalPages > 1 && (
							<div className="mt-10 flex items-center justify-center gap-2">
								<button type="button" onClick={() => setPage(current - 1)} disabled={current === 1} className={`${pagerBtn(false)} disabled:cursor-not-allowed disabled:opacity-40`}>
									‹
								</button>
								{Array.from({ length: totalPages }, (_, i) => i + 1).map((pnum) => (
									<button key={pnum} type="button" onClick={() => setPage(pnum)} className={pagerBtn(pnum === current)}>
										{pnum}
									</button>
								))}
								<button type="button" onClick={() => setPage(current + 1)} disabled={current === totalPages} className={`${pagerBtn(false)} disabled:cursor-not-allowed disabled:opacity-40`}>
									›
								</button>
							</div>
						)}
					</>
				) : (
					<div className="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-black/[0.16] bg-paper2 px-8 py-20 text-center">
						<div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-panel font-mono text-[18px] text-muted2">⌕</div>
						<div className="font-display text-[22px] uppercase text-ink">No players found</div>
						<p className="max-w-[360px] text-[14px] leading-[1.5] text-muted">{emptyBody}</p>
					</div>
				)}
			</section>
		</>
	);
}

function PlayerTile({ p }: { p: PlayerCard }) {
	const Tag = p.href && p.href !== "#" ? "a" : "div";
	return (
		<Tag
			{...(Tag === "a" ? { href: p.href } : {})}
			className="group flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white no-underline shadow-[0_1px_2px_rgba(20,16,9,0.04)] hover:border-brand/40"
		>
			<span className="relative flex aspect-[4/5] items-center justify-center overflow-hidden" style={p.image ? undefined : { background: STRIPE }}>
				{p.image ? (
					<img src={p.image} alt={p.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
				) : (
					<span className="font-display text-[40px] text-[#cfc7bb]">{p.initials}</span>
				)}
				<span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-brand">{p.posLabel}</span>
				<span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-night font-display text-[13px] text-white">{p.number}</span>
			</span>
			<span className="flex flex-1 flex-col p-4">
				<span title={p.name} className="truncate font-body text-[16px] font-extrabold text-ink2 group-hover:text-brand">{p.name}</span>
				<span title={p.team} className="mt-0.5 truncate font-mono text-[11px] text-muted2">{p.team}</span>
				<span className="mt-3 flex items-center justify-between border-t border-black/[0.06] pt-3">
					{([["PPG", p.ppg], ["RPG", p.rpg], ["APG", p.apg]] as const).map(([label, val]) => (
						<span key={label} className="text-center">
							<span className="block font-display text-[18px] text-ink">{val.toFixed(1)}</span>
							<span className="font-mono text-[9px] uppercase tracking-[0.06em] text-muted2">{label}</span>
						</span>
					))}
				</span>
			</span>
		</Tag>
	);
}
