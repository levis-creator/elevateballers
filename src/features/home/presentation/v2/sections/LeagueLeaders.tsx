import { useLeaderTabStore } from "@/features/home/presentation/stores/v2/useLeaderTabStore";
import { pillClass } from "@/features/home/presentation/v2/lib/tab-styles";
import type { LeaderData } from "@/features/home/domain/entities/home-v2";

interface Props {
	leaderData: LeaderData;
	tabs: string[];
}

/** League Leaders — React island; active tab lives in a Zustand store. */
export default function LeagueLeaders({ leaderData, tabs }: Props) {
	const tab = useLeaderTabStore((s) => s.tab);
	const setTab = useLeaderTabStore((s) => s.setTab);
	const rows = leaderData[tab] ?? leaderData[tabs[0]] ?? [];
	const max = Math.max(1, ...rows.map((r) => r.val));

	return (
		<div>
			<div className="mb-[22px] flex items-baseline justify-between">
				<h2 className="font-display text-[32px] uppercase text-ink">League Leaders</h2>
				<a href="/stats/leaders" className="font-mono text-[12px] text-brand no-underline">All stats →</a>
			</div>
			<div className="mb-5 flex gap-2">
				{tabs.map((t) => (
					<button key={t} type="button" onClick={() => setTab(t)} className={pillClass(tab === t)}>
						{t}
					</button>
				))}
			</div>
			<div className="flex flex-col gap-0.5">
				{rows.map((p, i) => {
					const first = i === 0;
					const pct = Math.round((p.val / max) * 100);
					return (
						<div key={p.name} className="flex items-center gap-4 border-b border-black/[0.08] px-1 py-3.5">
							<span className="w-[26px] font-display text-[20px]" style={{ color: first ? "#e4002b" : "#b3a99c" }}>
								{i + 1}
							</span>
							<div className="h-10 w-10 flex-shrink-0 rounded-full bg-[#ddd7cd]" />
							<div className="flex-1">
								<div className="font-body text-[15px] font-bold text-ink2">{p.name}</div>
								<div className="font-mono text-[11px] text-muted2">{p.team}</div>
							</div>
							<div className="max-w-[160px] flex-[1.2]">
								<div className="h-1.5 overflow-hidden rounded-[3px] bg-black/[0.08]">
									<div
										className="h-full rounded-[3px]"
										style={{ width: `${pct}%`, background: first ? "#e4002b" : "rgba(228,0,43,0.4)" }}
									/>
								</div>
							</div>
							<span className="w-14 text-right font-display text-[22px] text-ink">{p.val.toFixed(1)}</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}
