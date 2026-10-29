import { useMemo, useState } from "react";
import CourtShotChart from "@/features/game-tracking/presentation/components/CourtShotChart";
import { summariseShots } from "@/features/game-tracking/domain/live-console/shotChart";
import type { MatchView } from "@/features/matches/domain/entities/match-detail-v2";

const seg = (active: boolean) =>
	`cursor-pointer rounded-md px-4 py-2 font-body text-[12px] uppercase tracking-[0.05em] ${
		active ? "border-none bg-brand font-bold text-brandfg" : "border border-black/15 bg-white font-semibold text-muted hover:border-brand"
	}`;

/** Shot chart for the box score tab: one team at a time, optionally one player. Hidden when no shots were located. */
export default function MatchShotChart({ view }: { view: MatchView }) {
	const [side, setSide] = useState<"home" | "away">("home");
	const [player, setPlayer] = useState("");
	const team = view.shots[side];
	const players = useMemo(() => [...new Set(team.shots.map((s) => s.player))].sort(), [team]);
	const shown = player ? team.shots.filter((s) => s.player === player) : team.shots;
	const zones = summariseShots(shown);
	const made = shown.filter((s) => s.made).length;
	const color = side === "home" ? "var(--brand)" : "var(--ink,#141009)";

	if (!view.shots.home.shots.length && !view.shots.away.shots.length) return null;

	const pick = (next: "home" | "away") => {
		setSide(next);
		setPlayer("");
	};

	return (
		<section className="mx-auto max-w-[1000px] px-8 pt-[48px] max-[960px]:px-6 max-[960px]:pt-9">
			<h2 className="mb-4 font-display text-[22px] uppercase text-ink">Shot Chart</h2>
			<div className="mb-4 flex flex-wrap items-center gap-2">
				<button type="button" onClick={() => pick("home")} className={seg(side === "home")}>{view.home.name}</button>
				<button type="button" onClick={() => pick("away")} className={seg(side === "away")}>{view.away.name}</button>
				<select
					value={player}
					onChange={(e) => setPlayer(e.target.value)}
					aria-label="Filter shots by player"
					className="ml-auto h-[38px] max-w-full rounded-md border border-black/15 bg-white px-3 font-body text-[13px] text-ink2 max-[600px]:ml-0 max-[600px]:w-full"
				>
					<option value="">All players</option>
					{players.map((p) => <option key={p} value={p}>{p}</option>)}
				</select>
			</div>
			<div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-6 rounded-xl border border-black/10 bg-white p-6 shadow-[0_1px_2px_rgb(var(--site-ink-rgb)/0.04)] max-[720px]:grid-cols-1">
				{shown.length ? (
					<CourtShotChart
						shots={shown}
						color={color}
						line="rgb(var(--site-ink-rgb,20 16 9) / 0.28)"
						floor="var(--paper,#f5f3ef)"
						paint="var(--panel,#f0ece5)"
						className="block w-full rounded-lg"
						label={`${side === "home" ? view.home.name : view.away.name} shot chart`}
					/>
				) : (
					<div className="flex aspect-[150/140] items-center justify-center rounded-lg bg-paper2 font-body text-[13px] text-muted">No located shots for this team yet.</div>
				)}
				<div className="flex flex-col gap-4">
					<div>
						<div className="font-display text-[34px] leading-none text-ink">{made}/{shown.length}</div>
						<div className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted2">
							Field goals{shown.length ? ` · ${Math.round((made / shown.length) * 100)}%` : ""}
						</div>
					</div>
					<div className="flex flex-col gap-2.5">
						{zones.map((z) => (
							<div key={z.group}>
								<div className="mb-1 flex items-center justify-between font-mono text-[12px]">
									<span className="uppercase tracking-[0.06em] text-muted2">{z.group}</span>
									<span className="font-bold text-ink2">{z.made}/{z.attempts}{z.pct != null ? ` · ${z.pct}%` : ""}</span>
								</div>
								<div className="h-2 overflow-hidden rounded-full bg-black/[0.06]">
									<div className="h-full rounded-full" style={{ width: `${z.pct ?? 0}%`, background: color }} />
								</div>
							</div>
						))}
					</div>
					<div className="mt-auto flex flex-wrap items-center gap-4 border-t border-black/[0.06] pt-3 font-mono text-[11px] text-muted2">
						<span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />Made</span>
						<span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full border-[1.5px]" style={{ borderColor: color }} />Missed</span>
						{!player && team.attempts > team.shots.length && <span>{team.shots.length} of {team.attempts} shots located</span>}
					</div>
				</div>
			</div>
		</section>
	);
}
