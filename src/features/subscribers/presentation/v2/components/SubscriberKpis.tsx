import { Users, UserPlus, UserX, TrendingUp } from "lucide-react";
import type { SubscriberStats } from "@/features/subscribers/domain/entities/subscriber";

const CARDS = [
	{ key: "total", label: "Total Subscribers", icon: Users, tint: "#2a6fdb" },
	{ key: "active", label: "Active", icon: UserPlus, tint: "#1f8a5b" },
	{ key: "unsubscribed", label: "Unsubscribed", icon: UserX, tint: "#e4002b" },
	{ key: "newThisMonth", label: "New This Month", icon: TrendingUp, tint: "#7c5cff" },
] as const;

export default function SubscriberKpis({ stats }: { stats: SubscriberStats }) {
	return (
		<div className="mb-6 grid grid-cols-4 gap-3.5 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
			{CARDS.map((c) => {
				const Icon = c.icon;
				return (
					<div key={c.key} className="rounded-xl border border-[var(--bord)] bg-[var(--surf)] p-4">
						<div className="mb-3 flex items-center">
							<span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${c.tint}22`, color: c.tint }}><Icon className="h-[16px] w-[16px]" /></span>
						</div>
						<div className="font-['Anton'] text-[30px] leading-none text-[var(--tx)]">{stats[c.key]}</div>
						<div className="mt-1.5 font-['Space_Mono'] text-[10px] uppercase tracking-[0.1em] text-[var(--txm)]">{c.label}</div>
					</div>
				);
			})}
		</div>
	);
}
