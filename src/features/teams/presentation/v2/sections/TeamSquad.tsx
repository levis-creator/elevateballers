import { useTeamViewStore } from "@/features/teams/presentation/stores/v2/useTeamViewStore";
import { pillClass } from "@/features/home/presentation/v2/lib/tab-styles";
import type { SquadPlayer } from "@/features/teams/domain/entities/team-detail";
import { useState } from 'react';
import type { PublicTeamPageSettings } from '@/features/settings/application/teamPageSettings';

interface Props {
	players: SquadPlayer[];
	playerCount: number;
	settings: PublicTeamPageSettings;
}

const STRIPE = "repeating-linear-gradient(45deg,rgb(var(--site-paper-border-rgb,231 226 218)),rgb(var(--site-paper-border-rgb,231 226 218)) 4px,var(--panel,#f0ece5) 4px,var(--panel,#f0ece5) 8px)";

/** Squad — Roster/Stats tabs. React island; active tab lives in the Zustand store. */
export default function TeamSquad({ players, playerCount, settings }: Props) {
	const { tab, setTab } = useTeamViewStore();
	const [position, setPosition] = useState('All');
	const positions = ['All', ...Array.from(new Set(players.map((player) => player.pos).filter((value) => value && value !== '—')))];
	const visiblePlayers = position === 'All' ? players : players.filter((player) => player.pos === position);
	const cardStat = (player: SquadPlayer) => settings.squadStat === 'Jersey number' ? `#${player.jersey}` : settings.squadStat === 'Position' ? player.pos : settings.squadStat === 'Points per game' ? `${player.ppg} PPG` : '';

	return (
		<section className="border-y border-black/[0.08] bg-panel">
			<div className="mx-auto max-w-[1280px] px-8 py-[56px] max-[960px]:px-6 max-[960px]:py-10">
				<div className="mb-6 flex flex-wrap items-center justify-between gap-4">
					<h2 className="font-display text-[26px] uppercase text-ink">{settings.squadHeading}</h2>
					<div className="flex items-center gap-3">
						{settings.squadLayout === 'Table' && <div className="flex gap-2">
							<button type="button" onClick={() => setTab("roster")} className={pillClass(tab === "roster")}>
								Roster
							</button>
							<button type="button" onClick={() => setTab("stats")} className={pillClass(tab === "stats")}>
								Stats
							</button>
						</div>}
						<span className="font-mono text-[12px] text-muted2">{playerCount} players</span>
					</div>
				</div>
				{settings.positionFilter && positions.length > 1 && <div className="mb-6 flex flex-wrap gap-2">{positions.map((item) => <button key={item} type="button" onClick={() => setPosition(item)} className={pillClass(position === item)}>{item}</button>)}</div>}

				{visiblePlayers.length === 0 ? (
					<div className="rounded-xl border border-dashed border-black/[0.16] bg-white px-6 py-12 text-center">
						<div className="font-display text-[20px] uppercase text-ink">No players yet</div>
						<p className="mt-1.5 font-body text-[13px] text-muted">This team's roster hasn't been published.</p>
					</div>
				) : settings.squadLayout === 'Card grid' ? (
					<div className="grid grid-cols-4 gap-5 max-[600px]:grid-cols-2 max-[960px]:grid-cols-3">
						{visiblePlayers.map((p) => <a key={p.id} href={p.href} className="group overflow-hidden rounded-2xl border border-black/10 bg-white text-center no-underline shadow-[0_1px_2px_rgb(var(--site-ink-rgb)/0.04)] transition-colors hover:border-brand/40">
							<div className="relative aspect-square w-full overflow-hidden bg-paper2">
								{p.image ? <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" /> : <span className="flex h-full w-full items-center justify-center font-display text-[48px] text-muted2" style={{ background: STRIPE }}>{p.initials}</span>}
								<span className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-ink font-display text-[14px] text-white shadow-[0_1px_2px_rgb(0_0_0/0.2)]">{p.jersey}</span>
							</div>
							<div className="p-4">
								<span className="block font-body text-[15px] font-extrabold text-ink2">{p.name}</span>
								{cardStat(p) && <span className="mt-1 block font-mono text-[11px] uppercase text-brand">{cardStat(p)}</span>}
							</div>
						</a>)}
					</div>
				) : tab === "roster" ? (
					<div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_1px_2px_rgb(var(--site-ink-rgb)/0.04)]">
						<div className="grid grid-cols-[48px_1fr_150px_90px_90px] items-center gap-4 border-b border-black/[0.08] bg-paper2 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.1em] text-muted2 max-[600px]:grid-cols-[40px_1fr_60px]">
							<span>#</span>
							<span>Player</span>
							<span className="max-[600px]:hidden">Position</span>
							<span className="max-[600px]:hidden">Height</span>
							<span>Wt</span>
						</div>
						{visiblePlayers.map((p) => (
							<a key={p.id} href={p.href} className="grid grid-cols-[48px_1fr_150px_90px_90px] items-center gap-4 border-b border-black/[0.06] px-5 py-3.5 no-underline hover:bg-paper2 max-[600px]:grid-cols-[40px_1fr_60px]">
								<span className="font-display text-[18px] text-brand">{p.jersey}</span>
								<span className="flex items-center gap-3">
									{p.image ? (
										<img
											src={p.image}
											alt={p.name}
											width={36}
											height={36}
											loading="lazy"
											decoding="async"
											className="h-9 w-9 flex-shrink-0 rounded-full border border-black/10 object-cover"
										/>
									) : (
										<span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-mono text-[11px] text-muted2" style={{ background: STRIPE }}>
											{p.initials}
										</span>
									)}
									<span className="font-body text-[15px] font-bold text-ink2">{p.name}</span>
								</span>
								<span className="font-body text-[13px] text-muted max-[600px]:hidden">{p.pos}</span>
								<span className="font-mono text-[13px] text-ink2 max-[600px]:hidden">{p.height}</span>
								<span className="font-mono text-[13px] text-ink2">{p.weight}</span>
							</a>
						))}
					</div>
				) : (
					<div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-[0_1px_2px_rgb(var(--site-ink-rgb)/0.04)]">
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
							{visiblePlayers.map((p) => (
								<div key={p.id} className="grid grid-cols-[48px_1.6fr_repeat(6,1fr)] items-center gap-3 border-b border-black/[0.06] px-5 py-3.5 hover:bg-paper2">
									<span className="font-display text-[16px] text-brand">{p.jersey}</span>
									<span className="flex items-center gap-3">
										{p.image ? (
											<img
												src={p.image}
												alt={p.name}
												width={32}
												height={32}
												loading="lazy"
												decoding="async"
												className="h-8 w-8 flex-shrink-0 rounded-full border border-black/10 object-cover"
											/>
										) : (
											<span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-mono text-[10px] text-muted2" style={{ background: STRIPE }}>
												{p.initials}
											</span>
										)}
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
