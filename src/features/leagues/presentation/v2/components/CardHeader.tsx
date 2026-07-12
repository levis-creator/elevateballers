import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
	icon: LucideIcon;
	title: string;
	subtitle: string;
	/** Optional actions rendered on the right (e.g. the Seasons card's buttons). */
	actions?: ReactNode;
}

/** The section header shared by every card on the league editor. */
export default function CardHeader({ icon: Icon, title, subtitle, actions }: Props) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--bord2)] px-6 py-4">
			<div className="flex items-center gap-3">
				<span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--brand)]/[0.12] text-[var(--brand)]">
					<Icon className="h-[16px] w-[16px]" />
				</span>
				<div>
					<h2 className="font-['Anton'] text-[18px] uppercase tracking-[0.01em] text-[var(--tx)]">{title}</h2>
					<p className="font-['Space_Mono'] text-[11px] text-[var(--txm)]">{subtitle}</p>
				</div>
			</div>
			{actions && <div className="flex items-center gap-2">{actions}</div>}
		</div>
	);
}
