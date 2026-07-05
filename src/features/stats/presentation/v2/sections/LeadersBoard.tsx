import { useLeadersStore } from "@/features/stats/presentation/stores/v2/useLeadersStore";
import { STAT_METAS, ALL_LEAGUES } from "@/features/stats/domain/entities/leaders-v2";
import type { LeadersData, LeaderRow, StatKey } from "@/features/stats/domain/entities/leaders-v2";

interface Props {
	data: LeadersData;
}

const CREST_LIGHT = "repeating-linear-gradient(45deg,#e7e2da,#e7e2da 4px,#f0ece5 4px,#f0ece5 8px)";
const CREST_DARK = "repeating-linear-gradient(45deg,#1a1714,#1a1714 4px,#151210 4px,#151210 8px)";

const selectCls =
	"cursor-pointer appearance-none rounded-md border border-black/15 bg-white py-[11px] pl-4 pr-9 font-body text-[13px] font-bold tracking-[0.04em] text-ink2 outline-none";

const pill = (on: boolean): string =>
	`cursor-pointer rounded-md border px-[15px] py-[9px] text-[12px] uppercase tracking-[0.04em] ${
		on ? "border-brand bg-brand font-bold text-white" : "border-black/15 bg-white font-semibold text-muted hover:border-brand"
	}`;

function Select({ value, options, onChange, suffix }: { value: string; options: string[]; onChange: (v: string) => void; suffix?: string }) {
	return (
		<div className="relative">
			<select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
				{options.map((o) => (
					<option key={o} value={o}>
						{suffix ? `${o}${suffix}` : o}
					</option>
				))}
			</select>
			<span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] text-muted">▼</span>
		</div>
	);
}

/** Stat-Leaders board — hero controls + category tabs + podium + full leaderboard.
 *  React island; the selected stat/league/season live in a Zustand store. */
export default function LeadersBoard({ data }: Props) {
	const { stat, league, season, setStat, setLeague, setSeason } = useLeadersStore();
	const activeSeason = season || data.defaultSeason;
	const meta = STAT_METAS.find((m) => m.key === stat) ?? STAT_METAS[0];

	const pool = data.rows
		.filter((r) => r.season === activeSeason)
		.filter((r) => league === ALL_LEAGUES || r.league === league)
		.filter((r) => r.gp >= data.minGames)
		.map((r) => ({ row: r, val: r.vals[stat] }))
		.sort((a, b) => b.val - a.val);

	const podium = pool.slice(0, 3);
	const tags = ["Leader", "Runner-up", "Third"];
	const fmt = (v: number) => v.toFixed(1);

	return (
		<>
			{/* HERO */}
			<section className="relative overflow-hidden border-b border-black/[0.08]">
				<div className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 82% -10%,rgba(228,0,43,0.12),transparent 58%)" }} />
				<div className="absolute -top-20 right-[-140px] h-[520px] w-[520px] rounded-full border border-brand/[0.14]" />
				<div className="relative mx-auto flex max-w-[1280px] flex-wrap items-end justify-between gap-6 px-8 pb-[40px] pt-[52px] max-[960px]:px-6">
					<div>
						<div className="mb-[18px] inline-flex items-center gap-[10px] font-mono text-[12px] uppercase tracking-[0.14em] text-brand">
							<span className="h-px w-[26px] bg-brand" />
							Statistical Leaders · {activeSeason}
						</div>
						<h1 className="font-display text-[clamp(52px,7.5vw,110px)] uppercase leading-[0.86] tracking-[0.01em] text-ink">League Leaders</h1>
					</div>
					<div className="flex items-center gap-3">
						<Select value={league} options={data.leagues} onChange={setLeague} />
						<Select value={activeSeason} options={data.seasons} onChange={setSeason} />
					</div>
				</div>
			</section>

			{/* CATEGORY SELECTOR */}
			<section className="border-b border-black/[0.08] bg-panel">
				<div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-2 px-8 py-5 max-[960px]:px-6">
					<span className="mr-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted2">Category</span>
					{STAT_METAS.map((m) => (
						<button key={m.key} type="button" onClick={() => setStat(m.key)} className={pill(stat === m.key)}>
							{m.label}
						</button>
					))}
				</div>
			</section>

			{pool.length === 0 ? (
				<section className="mx-auto max-w-[1280px] px-8 py-24 text-center max-[960px]:px-6">
					<div className="mx-auto flex max-w-[440px] flex-col items-center gap-3 rounded-[14px] border border-dashed border-black/[0.16] bg-paper2 px-8 py-16">
						<div className="font-display text-[24px] uppercase text-ink">No qualified leaders</div>
						<p className="text-[14px] leading-[1.5] text-muted">
							No players have played the minimum {data.minGames} game{data.minGames === 1 ? "" : "s"} in this league and season yet — check back once more games are recorded.
						</p>
					</div>
				</section>
			) : (
				<>
					{/* PODIUM */}
					<section className="mx-auto max-w-[1280px] px-8 pt-[48px] max-[960px]:px-6 max-[960px]:pt-9">
						<div className="mb-2 flex items-baseline gap-3">
							<h2 className="font-display text-[26px] uppercase text-ink">{meta.label} Leaders</h2>
							<span className="font-mono text-[11px] text-muted2">per game</span>
						</div>
						<div className="mt-5 grid grid-cols-3 gap-5 max-[760px]:grid-cols-1">
							{podium.map(({ row, val }, i) => (
								<PodiumCard key={row.playerId} row={row} val={fmt(val)} rank={i + 1} tag={tags[i]} unit={meta.unit} lead={i === 0} />
							))}
						</div>
					</section>

					{/* FULL LEADERBOARD */}
					<section className="mx-auto max-w-[1280px] px-8 py-[48px] max-[960px]:px-6 max-[960px]:py-9">
						<h2 className="mb-5 font-display text-[26px] uppercase text-ink">Full Leaderboard</h2>
						<div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-[0_1px_2px_rgba(20,16,9,0.04)]">
							<div className="min-w-[680px]">
								<div className="grid grid-cols-[56px_1fr_1fr_72px_80px] items-center gap-2 border-b border-black/[0.08] bg-paper2 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-muted2">
									<span>Rank</span>
									<span>Player</span>
									<span>Team</span>
									<span className="text-center">GP</span>
									<span className="text-right">{meta.unit}</span>
								</div>
								{pool.map(({ row, val }, i) => (
									<LeaderRowItem key={row.playerId} row={row} val={fmt(val)} rank={i + 1} />
								))}
							</div>
						</div>
						<div className="mt-4 font-mono text-[11px] text-muted2">
							GP Games Played · {meta.unit} {meta.label} per game · Minimum {data.minGames} game{data.minGames === 1 ? "" : "s"} to qualify
						</div>
					</section>
				</>
			)}
		</>
	);
}

function PodiumCard({ row, val, rank, tag, unit, lead }: { row: LeaderRow; val: string; rank: number; tag: string; unit: string; lead: boolean }) {
	const Tag = row.href && row.href !== "#" ? "a" : "div";
	return (
		<Tag
			{...(Tag === "a" ? { href: row.href } : {})}
			className="relative flex flex-col overflow-hidden rounded-2xl border p-6 no-underline"
			style={{
				background: lead ? "#0c0b0a" : "#fff",
				borderColor: lead ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
				boxShadow: lead ? "0 20px 40px rgba(20,16,9,0.18)" : "0 1px 2px rgba(20,16,9,0.04)",
			}}
		>
			<div className="mb-5 flex items-center justify-between">
				<span className="font-display text-[40px] leading-none text-brand">#{rank}</span>
				<span
					className="rounded px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em]"
					style={lead ? { background: "rgba(228,0,43,0.16)", color: "#ff5a72" } : { background: "rgba(228,0,43,0.1)", color: "#e4002b" }}
				>
					{tag}
				</span>
			</div>
			<div className="flex items-center gap-3">
				<span
					className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full font-display text-[18px]"
					style={{ background: lead ? CREST_DARK : CREST_LIGHT, color: lead ? "#e4002b" : "#141009" }}
				>
					{row.initials}
				</span>
				<div className="min-w-0">
					<div className="truncate font-body text-[17px] font-extrabold" style={{ color: lead ? "#f6f2ec" : "#1a1712" }}>
						{row.name}
					</div>
					<div className="mt-0.5 font-mono text-[11px]" style={{ color: lead ? "#8a817a" : "#6f665c" }}>
						{row.team}
					</div>
				</div>
			</div>
			<div className="mt-5 flex items-end justify-between border-t pt-4" style={{ borderColor: lead ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }}>
				<div>
					<div className="font-display text-[44px] leading-none text-brand">{val}</div>
					<div className="mt-1 font-mono text-[9px] uppercase tracking-[0.08em]" style={{ color: lead ? "#8a817a" : "#6f665c" }}>
						{unit} / game
					</div>
				</div>
				<div className="text-right font-mono text-[11px]" style={{ color: lead ? "#8a817a" : "#6f665c" }}>
					{row.gp} GP
				</div>
			</div>
		</Tag>
	);
}

function LeaderRowItem({ row, val, rank }: { row: LeaderRow; val: string; rank: number }) {
	const Tag = row.href && row.href !== "#" ? "a" : "div";
	const rankColor = rank === 1 ? "#e4002b" : rank <= 3 ? "#141009" : "#b3a99c";
	return (
		<Tag
			{...(Tag === "a" ? { href: row.href } : {})}
			className="grid grid-cols-[56px_1fr_1fr_72px_80px] items-center gap-2 border-b border-black/[0.06] px-5 py-3 no-underline last:border-0 hover:bg-paper2"
		>
			<span className="font-display text-[16px]" style={{ color: rankColor }}>
				{rank}
			</span>
			<span className="flex min-w-0 items-center gap-3">
				<span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-mono text-[10px] text-muted2" style={{ background: CREST_LIGHT }}>
					{row.initials}
				</span>
				<span title={row.name} className="truncate font-body text-[14px] font-bold text-ink2">
					{row.name}
				</span>
			</span>
			<span title={row.team} className="truncate font-mono text-[12px] text-muted">
				{row.team}
			</span>
			<span className="text-center font-mono text-[13px] text-muted">{row.gp}</span>
			<span className="text-right font-display text-[20px] text-ink">{val}</span>
		</Tag>
	);
}
