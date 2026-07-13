import { CalendarDays, Radio, Star, Volleyball } from "lucide-react";
import type { SeasonStats } from "@/features/seasons/domain/entities/season";

const CARDS = [
	{ key: "total", label: "Total Seasons", tag: "All leagues", icon: CalendarDays, tint: "#2a6fdb" },
	{ key: "live", label: "Live Now", tag: "● Active", icon: Radio, tint: "#e4002b" },
	{ key: "upcoming", label: "Upcoming", tag: "Scheduled", icon: Star, tint: "#d98324" },
	{ key: "matches", label: "Total Matches", tag: "Season-wide", icon: Volleyball, tint: "#1f8a5b" },
] as const;

export default function SeasonKpis({ stats }: { stats: SeasonStats }) {
	return (
		<div className="mb-6 grid grid-cols-4 gap-3.5 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
			{CARDS.map((card) => {
				const Icon = card.icon;
				const highlight = card.key === "live" || card.key === "upcoming";
				return (
					<div key={card.key} className="rounded-xl border border-[var(--bord)] bg-[var(--surf)] p-4">
						<div className="mb-3 flex items-center justify-between">
							<span
								className="flex h-8 w-8 items-center justify-center rounded-lg"
								style={{ background: `${card.tint}22`, color: card.tint }}
							>
								<Icon className="h-[16px] w-[16px]" />
							</span>
							<span
								className="font-['Space_Mono'] text-[10px] font-bold uppercase tracking-[0.06em]"
								style={{ color: highlight ? card.tint : "var(--txm)" }}
							>
								{card.tag}
							</span>
						</div>
						<div className="font-['Anton'] text-[30px] leading-none text-[var(--tx)]">{stats[card.key]}</div>
						<div className="mt-1.5 font-['Space_Mono'] text-[10px] uppercase tracking-[0.1em] text-[var(--txm)]">
							{card.label}
						</div>
					</div>
				);
			})}
		</div>
	);
}
