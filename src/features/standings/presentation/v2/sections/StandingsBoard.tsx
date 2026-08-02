import { useEffect } from "react";
import { useStandingsStore } from "@/features/standings/presentation/stores/v2/useStandingsStore";
import { pillClass } from "@/features/home/presentation/v2/lib/tab-styles";
import TeamName from "@/features/teams/presentation/components/TeamName";
import type { StandingTable } from "@/features/standings/domain/entities/standings-v2";
import type { PublicCompetitionOption } from "@/features/seasons/domain/entities/public-competition";
import { configuredDefaultCompetitionId, type PublicCompetitionSettings } from "@/features/settings/application/competitionSettings";
import { standingsCutLabel, standingsEyebrow, type PublicStandingsSettings } from "@/features/settings/application/standingsSettings";

interface Props {
	competitions: PublicCompetitionOption[];
	tables: StandingTable[];
	defaultLeagueSeasonId: string;
	competitionSettings: PublicCompetitionSettings;
	settings: PublicStandingsSettings;
}

const diffLabel = (d: number) => `${d > 0 ? "+" : ""}${d}`;
const diffColor = (d: number) => (d > 0 ? "#2f9e44" : d < 0 ? "var(--brand)" : "var(--muted2,#a49a8d)");
const PLACE = ["1st Place", "2nd Place", "3rd Place"];
const conferenceAccent = (name: string, index: number) => {
	if (name.toLowerCase().includes("grind")) return "var(--brand)";
	if (name.toLowerCase().includes("clutch")) return "var(--ink,#141009)";
	return index % 2 === 0 ? "var(--brand)" : "var(--ink,#141009)";
};

/** Standings — hero + league filter tabs + top-3 + full table + search.
 *  React island; league filter and search live in a Zustand store. Rankings are
 *  computed within the active league filter. */
export default function StandingsBoard({ competitions, tables, defaultLeagueSeasonId, competitionSettings, settings }: Props) {
	const { leagueSeasonId, conferenceId, query, setLeagueSeason, setConference, setQuery } = useStandingsStore();
	const allCompetitions = "__all__";
	const isOverall = Boolean(competitionSettings.allLabel) && leagueSeasonId === allCompetitions;
	const configuredDefaultId = configuredDefaultCompetitionId(competitions, competitionSettings, defaultLeagueSeasonId);
	const selected = competitions.find((item) => item.id === leagueSeasonId)
		?? competitions.find((item) => item.id === configuredDefaultId)
		?? competitions[0];
	useEffect(() => {
		if (competitionSettings.defaultLeague !== "Remember last choice") return;
		const remembered = window.localStorage.getItem("eb-public-league-season");
		if (remembered && (remembered === allCompetitions || competitions.some((item) => item.id === remembered)) && remembered !== selected?.id) setLeagueSeason(remembered);
	}, []);
	useEffect(() => {
		if (competitionSettings.defaultLeague === "Remember last choice" && leagueSeasonId) window.localStorage.setItem("eb-public-league-season", leagueSeasonId);
	}, [leagueSeasonId, competitionSettings.defaultLeague]);
	const seasonIds = [...new Set(competitions.map((item) => item.seasonId))];
	const seasonId = selected?.seasonId ?? seasonIds[0] ?? "";
	const seasonCompetitions = competitions.filter((item) => item.seasonId === seasonId);
	const showConferences = !isOverall && selected?.structure === "CONFERENCES" && selected.conferences.length > 0;
	const activeConferenceId = settings.conferenceTabs && showConferences && selected.conferences.some((item) => item.id === conferenceId)
		? conferenceId
		: "";
	const activeCompetitionIds = new Set(seasonCompetitions.map((item) => item.id));
	const rows = isOverall
		? tables.filter((table) => activeCompetitionIds.has(table.leagueSeasonId) && table.conferenceId === null).flatMap((table) => table.rows)
		: tables.find((table) => table.leagueSeasonId === selected?.id && (table.conferenceId ?? "") === activeConferenceId)?.rows ?? [];
	const ranked = [...rows]
		.sort((a, b) => b.pts - a.pts || b.diff - a.diff || b.pf - a.pf)
		.map((r, i) => ({ ...r, rank: i + 1 }));

	const podium = ranked.slice(0, 3);
	const q = query.trim().toLowerCase();
	const table = q ? ranked.filter((r) => r.name.toLowerCase().includes(q)) : ranked;
	const conferenceLeaders = showConferences
		? selected.conferences.map((conference, index) => {
			const conferenceRows = [...(tables.find((table) =>
				table.leagueSeasonId === selected.id
				&& table.conferenceId === conference.id
			)?.rows ?? [])]
				.sort((a, b) => b.pts - a.pts || b.diff - a.diff || b.pf - a.pf)
				.map((row, rowIndex) => ({ ...row, rank: rowIndex + 1 }));

			return {
				...conference,
				accent: conferenceAccent(conference.name, index),
				rows: conferenceRows.slice(0, 3),
				teamCount: conferenceRows.length,
			};
		}).filter((conference) => conference.rows.length > 0)
		: [];
	const showConferenceRace = activeConferenceId === "" && conferenceLeaders.length > 1;
	const tableTitle = activeConferenceId
		? `${selected?.conferences.find((item) => item.id === activeConferenceId)?.name ?? "Conference"} Conference Table`
		: "Full Table";
	const tableMeta = `${table.length} teams · ${isOverall ? competitionSettings.allLabel : selected?.leagueLabel ?? "League"}${activeConferenceId ? " Conference" : " Overall"}`;
	const heroSeason = competitionSettings.seasonLabel
		? (selected?.seasonLabel ?? "").replace(new RegExp(`\\s+${competitionSettings.seasonLabel}$`, "i"), "")
		: selected?.seasonLabel ?? "";
	const playoffSpots = settings.playoffSpots;
	const gridTemplateColumns = `60px minmax(180px,1fr) ${settings.columns.map(() => "minmax(52px,64px)").join(" ")}`;
	const statValue = (row: typeof ranked[number], code: string) => {
		switch (code.toLowerCase()) {
			case "p": return row.p; case "w": return row.w; case "d": return row.d; case "l": return row.l;
			case "pf": return row.pf; case "pa": return row.pa; case "diff": return diffLabel(row.diff); case "pts": return row.pts;
			default: return "—";
		}
	};
	const selectSeason = (nextSeasonId: string) => {
		const next = competitions.find((item) => item.seasonId === nextSeasonId);
		if (next) setLeagueSeason(next.id);
	};

	return (
		<>
			{/* HERO */}
			<section className="relative overflow-hidden border-b border-black/[0.08] bg-paper">
				<div className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 82% -10%,rgb(var(--site-brand-rgb) / 0.12),transparent 58%)" }} />
				<div className="absolute -top-20 right-[-140px] h-[520px] w-[520px] rounded-full border border-brand/[0.14]" />
				<div className="absolute right-[12%] top-12 hidden h-20 w-20 rounded-full border-[12px] border-brand/10 max-[960px]:hidden" />
				<div className="relative mx-auto max-w-[1280px] px-8 pb-[48px] pt-[62px] max-[960px]:px-6">
					<div className="mb-[18px] inline-flex items-center gap-[10px] font-mono text-[12px] uppercase tracking-[0.14em] text-brand">
							<span className="h-px w-[26px] bg-brand" />{standingsEyebrow(settings.eyebrow, heroSeason)}
					</div>
					<div className="flex flex-wrap items-end justify-between gap-6">
						<h1 className="font-display text-[clamp(56px,8vw,120px)] uppercase leading-[0.86] tracking-[0.01em] text-ink">{settings.title}</h1>
						<p className="max-w-[420px] pb-2 text-[15px] leading-[1.65] text-muted">
							Track playoff positioning, conference races and table points across Elevate Ballers competitions.
						</p>
					</div>
				</div>
			</section>

			{ranked.length === 0 ? (
				<section className="mx-auto max-w-[1280px] px-8 py-[72px] max-[960px]:px-6">
					<div className="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-black/[0.16] bg-paper2 px-8 py-20 text-center">
						<div className="font-display text-[24px] uppercase text-ink">No standings yet</div>
						<p className="max-w-[400px] text-[15px] leading-[1.6] text-muted">Once games are played, standings will appear here.</p>
					</div>
				</section>
			) : (
				<>
					{/* SEASON → COMPETITION → OPTIONAL CONFERENCE */}
					{selected && (
						<section className="border-b border-black/[0.08] bg-panel">
							<div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-4 px-8 py-5 max-[960px]:px-6">
								{seasonIds.length > 1 && (
									<label className="flex items-center gap-2">
										<span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted2">Season</span>
										<select value={seasonId} onChange={(event) => selectSeason(event.target.value)} className="rounded-md border border-black/15 bg-white px-3 py-2 text-[13px] font-bold text-ink2">
											{seasonIds.map((id) => {
												const item = competitions.find((competition) => competition.seasonId === id);
												return <option key={id} value={id}>{item?.seasonLabel}</option>;
											})}
										</select>
									</label>
								)}
								<div className="flex flex-wrap items-center gap-2">
									<span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted2">Competition</span>
									{competitionSettings.allLabel && <button type="button" onClick={() => { setConference(""); setLeagueSeason(allCompetitions); }} className={pillClass(isOverall)}>{competitionSettings.allLabel}</button>}
									{seasonCompetitions.map((item) => (
										<button key={item.id} type="button" onClick={() => setLeagueSeason(item.id)} className={pillClass(!isOverall && selected.id === item.id)}>
											{item.leagueLabel}
										</button>
									))}
								</div>
								{settings.conferenceTabs && showConferences && (
									<div className="flex flex-wrap items-center gap-2">
										<span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted2">Conference</span>
										<button type="button" onClick={() => setConference("")} className={pillClass(activeConferenceId === "")}>Overall</button>
										{selected.conferences.map((conference) => (
											<button key={conference.id} type="button" onClick={() => setConference(conference.id)} className={pillClass(activeConferenceId === conference.id)}>
												{conference.name}
											</button>
										))}
									</div>
								)}
							</div>
						</section>
					)}

					{/* PODIUM */}
					{settings.podium && <section className="mx-auto max-w-[1280px] px-8 pt-[48px] max-[960px]:px-6 max-[960px]:pt-9">
						<div className="grid grid-cols-3 gap-5 max-[960px]:grid-cols-1">
							{podium.map((p, i) => {
								const first = i === 0;
								return (
									<div
										key={p.teamId}
										className="relative overflow-hidden rounded-2xl border p-6"
										style={first ? { background: "var(--night,#0c0b0a)", borderColor: "rgba(255,255,255,0.12)" } : { background: "#fff", borderColor: "rgba(0,0,0,0.1)" }}
									>
										<div className="mb-5 flex items-center justify-between">
											<span className="font-display text-[40px] leading-none" style={{ color: first ? "var(--brand)" : "var(--muted2,#a49a8d)" }}>#{p.rank}</span>
											<span className="rounded px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em]" style={first ? { background: "rgb(var(--site-brand-rgb) / 0.16)", color: "var(--brandsoft)" } : { background: "var(--panel,#f0ede7)", color: "var(--muted,#6f665c)" }}>{PLACE[i]}</span>
										</div>
										<div className="mb-5 flex min-w-0 items-center gap-3">
											<TeamName
												team={{ name: p.name, nickname: p.nickname, logo: p.logo, initials: p.initials }}
												variant="compact"
												withCrest
												className="font-body text-[17px] font-extrabold uppercase leading-tight"
												crestClassName="h-12 w-12 font-display text-[16px]"
												textStyle={{ color: first ? "var(--cream,#f6f2ec)" : "var(--night2,#1a1712)" }}
											/>
											<div className="flex-shrink-0">
												<div className="mt-0.5 font-mono text-[11px]" style={{ color: "var(--muted2,#8a817a)" }}>{p.w}-{p.l}{p.d ? `-${p.d}` : ""}</div>
											</div>
										</div>
										<div className="grid grid-cols-3 gap-2 border-t pt-4" style={{ borderColor: first ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }}>
											<div>
												<div className="font-display text-[26px] leading-none" style={{ color: "var(--brand)" }}>{p.pts}</div>
												<div className="mt-1 font-mono text-[9px] uppercase tracking-[0.08em] text-muted2">Points</div>
											</div>
											<div>
												<div className="font-display text-[26px] leading-none" style={{ color: first ? "var(--cream,#f6f2ec)" : "var(--ink,#141009)" }}>{p.p}</div>
												<div className="mt-1 font-mono text-[9px] uppercase tracking-[0.08em] text-muted2">Played</div>
											</div>
											<div>
												<div className="font-display text-[26px] leading-none" style={{ color: diffColor(p.diff) }}>{diffLabel(p.diff)}</div>
												<div className="mt-1 font-mono text-[9px] uppercase tracking-[0.08em] text-muted2">Diff</div>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</section>}

					{settings.conferenceRace && showConferenceRace && (
						<section className="mx-auto max-w-[1280px] px-8 pt-[34px] max-[960px]:px-6">
							<div className="mb-4 flex items-end justify-between gap-4">
								<div>
									<div className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-brand">{settings.raceHeading}</div>
									<h2 className="font-display text-[28px] uppercase leading-none text-ink">Top Conference Seeds</h2>
								</div>
								<div className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted2">{selected?.leagueLabel}</div>
							</div>
							<div className="grid grid-cols-2 gap-5 max-[760px]:grid-cols-1">
								{conferenceLeaders.map((conference) => (
									<div key={conference.id} className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_1px_2px_rgb(var(--site-ink-rgb)/0.04)]">
										<div className="flex items-center justify-between border-b border-black/[0.08] px-5 py-4">
											<div>
												<div className="font-display text-[24px] uppercase leading-none text-ink">{conference.name}</div>
												<div className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted2">{conference.teamCount} teams</div>
											</div>
											<button type="button" onClick={() => setConference(conference.id)} className="rounded-md border border-black/10 bg-paper2 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink2 hover:border-brand hover:text-brand">
												View Table
											</button>
										</div>
										<div className="h-1" style={{ background: conference.accent }} />
										<div className="divide-y divide-black/[0.06]">
											{conference.rows.map((row) => (
												<a key={row.teamId} href={row.href} className="grid grid-cols-[42px_minmax(0,1fr)_58px_54px] items-center gap-3 px-5 py-3 no-underline hover:bg-paper2">
													<span className="font-display text-[18px]" style={{ color: row.rank === 1 ? conference.accent : "var(--muted2,#b3a99c)" }}>{row.rank}</span>
													<TeamName
														team={{ name: row.name, nickname: row.nickname, logo: row.logo, initials: row.initials }}
														variant="compact"
														withCrest
														className="font-body text-[13px] font-bold text-ink2"
														crestClassName="h-9 w-9 text-[12px]"
													/>
													<span className="text-center font-mono text-[12px] text-muted">{row.w}-{row.l}</span>
													<span className="text-right font-display text-[20px] text-ink">{row.pts}</span>
												</a>
											))}
										</div>
									</div>
								))}
							</div>
						</section>
					)}

					{/* FULL TABLE */}
					<section className="mx-auto max-w-[1280px] px-8 py-[48px] max-[960px]:px-6 max-[960px]:py-9">
						<div className="mb-5 flex flex-wrap items-center justify-between gap-4">
							<div>
								<h2 className="font-display text-[26px] uppercase text-ink">{tableTitle}</h2>
								<div className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-muted2">{tableMeta}</div>
							</div>
							{settings.search && <div className="flex items-center gap-2.5 rounded-lg border border-black/15 bg-white px-4 py-2.5">
								<span className="font-mono text-[13px] text-muted2">⌕</span>
								<input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search teams…" className="w-[180px] border-none bg-transparent font-body text-[14px] text-ink2 outline-none max-[600px]:w-[120px]" />
							</div>}
						</div>

						{table.length > 0 ? (
							<>
								<div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-[0_1px_2px_rgb(var(--site-ink-rgb)/0.04)]">
									<div className="min-w-[820px]">
										<div className="grid items-center gap-2 border-b border-black/[0.08] bg-paper2 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-muted2" style={{ gridTemplateColumns }}>
											<span>Rank</span><span>Team</span>
											{settings.columns.map((column, index) => <span key={`${column.code}-${index}`} title={column.name} className="text-center">{column.code}</span>)}
										</div>
										{table.map((t) => (
											<div key={t.teamId}>
												<a href={t.href} className="grid items-center gap-2 border-b border-black/[0.06] px-5 py-3 no-underline hover:bg-paper2" style={{ gridTemplateColumns, ...(t.rank <= playoffSpots ? { background: "rgb(var(--site-brand-rgb) / 0.04)" } : {}) }}>
													<span className="font-display text-[16px]" style={{ color: t.rank <= 3 ? "var(--brand)" : "var(--night2,#1a1712)" }}>{t.rank}</span>
													<TeamName
														team={{ name: t.name, nickname: t.nickname, logo: t.logo, initials: t.initials }}
														variant="table"
														withCrest
														className="font-body text-[14px] font-bold text-ink2"
													/>
													{settings.columns.map((column, index) => <span key={`${column.code}-${index}`} className="text-center font-mono text-[13px] font-bold" style={column.code.toLowerCase() === "diff" ? { color: diffColor(t.diff) } : undefined}>{statValue(t, column.code)}</span>)}
												</a>
												{settings.playoffLine && !q && t.rank === playoffSpots && ranked.length > playoffSpots && (
													<div className="flex items-center gap-3 bg-brand/[0.04] px-5 py-1.5">
														<span className="h-px flex-1 bg-brand/25" />
														<span className="font-mono text-[9px] uppercase tracking-[0.12em] text-brand">{standingsCutLabel(settings.cutLabel, playoffSpots)}</span>
														<span className="h-px flex-1 bg-brand/25" />
													</div>
												)}
											</div>
										))}
									</div>
								</div>
								{(settings.legend || settings.tiebreak) && <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] text-muted2">
									<span className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-brand/20" />Playoff position</span>
									{settings.legend && <span>{settings.columns.map((column) => `${column.code} ${column.name}`).join(" · ")}</span>}
									{settings.tiebreak && <span>{settings.tiebreak}</span>}
								</div>}
							</>
						) : (
							<div className="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-black/[0.16] bg-paper2 px-8 py-16 text-center">
								<div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-panel font-mono text-[18px] text-muted2">⌕</div>
								<div className="font-display text-[22px] uppercase text-ink">No teams found</div>
								<p className="max-w-[360px] text-[14px] leading-[1.5] text-muted">Nothing matches "{query}". Try a different team name.</p>
							</div>
						)}
					</section>
				</>
			)}
		</>
	);
}
