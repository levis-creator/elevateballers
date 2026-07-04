import { useTeamViewStore } from "@/features/teams/presentation/stores/v2/useTeamViewStore";
import { pillClass } from "@/features/home/presentation/v2/lib/tab-styles";
import type { SquadPlayer } from "@/features/teams/domain/entities/team-detail";

interface Props {
	players: SquadPlayer[];
	playerCount: number;
}

const STRIPE = "repeating-linear-gradient(45deg,#e7e2da,#e7e2da 4px,#f0ece5 4px,#f0ece5 8px)";

/** Squad — Roster/Stats tabs. React island; active tab lives in the Zustand store. */
export default function TeamSquad({ players, playerCount }: Props) {
	const { tab, setTab } = useTeamViewStore();

	return (
		<section className="border-y border-black/[0.08] bg-panel">
			<div className="mx-auto max-w-[1280px] px-8 py-[56px] max-[960px]:px-6 max-[960px]:py-10">
				<div className="mb-6 flex flex-wrap items-center justify-between gap-4">
					<h2 className="font-display text-[26px] uppercase text-ink">Squad</h2>
					<div className="flex items-center gap-3">
						<div className="flex gap-2">
							<button type="button" onClick={() => setTab("roster")} className={pillClass(tab === "roster")}>
								Roster
							</button>
							<button type="button" onClick={() => setTab("stats")} className={pillClass(tab === "stats")}>
								Stats
							</button>
						</div>
						<span className="font-mono text-[12px] text-muted2">{playerCount} players</span>
					</div>
				</div>

				{players.length === 0 ? (
					<div className="rounded-xl border border-dashed border-black/[0.16] bg-white px-6 py-12 text-center">
						<div className="font-display text-[20px] uppercase text-ink">No players yet</div>
						<p className="mt-1.5 font-body text-[13px] text-muted">This team's roster hasn't been published.</p>
					</div>
				) : tab === "roster" ? (
					<div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_1px_2px_rgba(20,16,9,0.04)]">
						<div className="grid grid-cols-[48px_1fr_150px_90px_90px] items-center gap-4 border-b border-black/[0.08] bg-paper2 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.1em] text-muted2 max-[600px]:grid-cols-[40px_1fr_60px]">
							<span>#</span>
							<span>Player</span>
							<span className="max-[600px]:hidden">Position</span>
							<span className="max-[600px]:hidden">Height</span>
							<span>Wt</span>
						</div>
						{players.map((p) => (
							<a key={p.id} href={p.href} className="grid grid-cols-[48px_1fr_150px_90px_90px] items-center gap-4 border-b border-black/[0.06] px-5 py-3.5 no-underline hover:bg-paper2 max-[600px]:grid-cols-[40px_1fr_60px]">
								<span className="font-display text-[18px] text-brand">{p.jersey}</span>
								<span className="flex items-center gap-3">
									<span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-mono text-[11px] text-muted2" style={{ background: STRIPE }}>
										{p.initials}
									</span>
									<span className="font-body text-[15px] font-bold text-ink2">{p.name}</span>
								</span>
								<span className="font-body text-[13px] text-muted max-[600px]:hidden">{p.pos}</span>
								<span className="font-mono text-[13px] text-ink2 max-[600px]:hidden">{p.height}</span>
								<span className="font-mono text-[13px] text-ink2">{p.weight}</span>
							</a>
						))}
					</div>
				) : (
					<div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-[0_1px_2px_rgba(20,16,9,0.04)]">
						<div className="min-w-[720px]">
							<div className="grid grid-cols-[48px_1.6fr_repeat(6,1fr)] items-center gap-3 border-b border-black/[0.08] bg-paper2 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-muted2">
								<span>#</span>
								<span>Player</span>
								<span className="text-right">PPG</span>
								<span className="text-right">RPG</span>
								<span className="text-right">APG</span>
								<span className="text-right">FG%</span>
								<span className="text-right">FT%</span>
								<span className="text-right">3P%</span>
							</div>
							{players.map((p) => (
								<div key={p.id} className="grid grid-cols-[48px_1.6fr_repeat(6,1fr)] items-center gap-3 border-b border-black/[0.06] px-5 py-3.5 hover:bg-paper2">
									<span className="font-display text-[16px] text-brand">{p.jersey}</span>
									<span className="flex items-center gap-3">
										<span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-mono text-[10px] text-muted2" style={{ background: STRIPE }}>
											{p.initials}
										</span>
										<span className="font-body text-[14px] font-bold text-ink2">{p.name}</span>
									</span>
									<span className="text-right font-display text-[18px]" style={{ color: p.ppgColor }}>{p.ppg}</span>
									<span className="text-right font-mono text-[13px] text-ink2">{p.rpg}</span>
									<span className="text-right font-mono text-[13px] text-ink2">{p.apg}</span>
									<span className="text-right font-mono text-[13px] text-muted">{p.fg}</span>
									<span className="text-right font-mono text-[13px] text-muted">{p.ft}</span>
									<span className="text-right font-mono text-[13px] text-muted">{p.tp}</span>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</section>
	);
}
