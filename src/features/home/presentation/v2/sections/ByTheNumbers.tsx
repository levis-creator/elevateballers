import { useEffect, useState } from "react";
import type { CountTargets } from "@/features/home/domain/entities/home-v2";

interface Props {
	counts: CountTargets;
}

const CARDS = [
	{ key: "matches", label: "Matches Played", accent: true },
	{ key: "players", label: "Players", accent: false },
	{ key: "teams", label: "Teams", accent: false },
	{ key: "awards", label: "Awards Won", accent: true },
] as const;

/** Ease-out count-up. Runs on mount; the island is client:visible so mount ≈
 *  scrolled-into-view. Self-contained (no external dependency). */
function Counter({ end }: { end: number }) {
	const [val, setVal] = useState(0);
	useEffect(() => {
		const dur = 1400;
		const start = performance.now();
		let raf = 0;
		const tick = (now: number) => {
			const p = Math.min(1, (now - start) / dur);
			setVal(Math.round(end * (1 - Math.pow(1 - p, 3))));
			if (p < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [end]);
	return <>{val}</>;
}

/** By The Numbers — React island (count-up animation). */
export default function ByTheNumbers({ counts }: Props) {
	return (
		<div>
			<h2 className="mb-[22px] font-display text-[32px] uppercase text-ink">By The Numbers</h2>
			<div className="grid grid-cols-2 gap-4">
				{CARDS.map((c) => (
					<div key={c.key} className="rounded-xl border border-black/10 bg-white p-[26px] shadow-[0_1px_2px_rgba(20,16,9,0.04)]">
						<div className={`font-display text-[52px] leading-none ${c.accent ? "text-brand" : "text-ink"}`}>
							<Counter end={counts[c.key]} />
						</div>
						<div className="mt-2 font-mono text-[12px] uppercase tracking-[0.08em] text-muted">{c.label}</div>
					</div>
				))}
			</div>
		</div>
	);
}
