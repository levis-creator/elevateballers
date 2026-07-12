import { Trophy, CheckCircle2, UserPlus, CalendarDays } from "lucide-react";
import type { LeagueStats } from "@/features/leagues/domain/entities/league";

const CARDS = [
	{ key: "total", label: "Total Leagues", icon: Trophy, tint: "#e4002b" },
	{ key: "active", label: "Active", icon: CheckCircle2, tint: "#1f8a5b" },
	{ key: "registering", label: "Registration Open", icon: UserPlus, tint: "#2a6fdb" },
	{ key: "matches", label: "Matches Scheduled", icon: CalendarDays, tint: "#7c5cff" },
] as const;

export default function LeagueKpis({ stats }: { stats: LeagueStats }) {
	return (
		<div className="mb-6 grid grid-cols-4 gap-3.5 max-[900px]:grid-cols-2">
			{CARDS.map((card) => {
				const Icon = card.icon;
				return (
					<div key={card.key} className="rounded-xl border border-[var(--bord)] bg-[var(--surf)] p-4">
						<div
							className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg"
							style={{ background: `${card.tint}22`, color: card.tint }}
						>
							<Icon className="h-[16px] w-[16px]" />
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
