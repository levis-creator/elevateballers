import { PermissionProvider } from "@/features/rbac/usePermissions";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useLeagueDetail } from "./hooks/useLeagueDetail";
import LeagueHero from "./components/LeagueHero";
import LeagueOverviewTab from "./components/LeagueOverviewTab";
import LeagueSeasonsTab from "./components/LeagueSeasonsTab";
import LeagueTeamsTab from "./components/LeagueTeamsTab";
import type { LeagueTab } from "@/features/leagues/domain/entities/league-detail";

function BackLink() {
	return (
		<a
			href="/admin/leagues"
			className="mb-4 inline-flex items-center gap-2 font-['Space_Mono'] text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--txm)] no-underline hover:text-[var(--brand)]"
		>
			<ArrowLeft className="h-[14px] w-[14px]" />
			All leagues
		</a>
	);
}

function LeagueDetailContent({ leagueId }: { leagueId: string }) {
	const v = useLeagueDetail(leagueId);

	if (v.loading) {
		return (
			<div className="flex items-center justify-center gap-2 py-24 text-[var(--txm)]">
				<Loader2 className="h-5 w-5 animate-spin" />
				Loading league…
			</div>
		);
	}

	if (v.error || !v.detail || !v.stats) {
		return (
			<div className="font-['Archivo']">
				<BackLink />
				<div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--bord)] bg-[var(--surf)] py-16 text-center">
					<AlertCircle className="h-6 w-6 text-[var(--brand)]" />
					<p className="font-['Archivo'] text-[13px] text-[var(--txm)]">{v.error || "Could not load this league."}</p>
					<button
						type="button"
						onClick={v.refresh}
						className="rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-2 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	const { detail } = v;

	return (
		<div className="font-['Archivo'] text-[var(--tx)]">
			<BackLink />

			<LeagueHero
				league={detail.league}
				stats={v.stats}
				canUpdate={v.canUpdate}
				canCreateSeason={v.canCreateSeason}
				onSetActive={v.setActive}
			/>

			{/* tabs */}
			<div className="mb-5 flex gap-2 border-b border-[var(--bord2)]">
				{v.tabs.map((tab: LeagueTab) => {
					const on = v.tab === tab;
					return (
						<button
							key={tab}
							type="button"
							onClick={() => v.setTab(tab)}
							className={`-mb-px border-b-2 px-4 py-2.5 font-['Archivo'] text-[12.5px] font-bold uppercase tracking-[0.04em] ${
								on
									? "border-[var(--brand)] text-[var(--tx)]"
									: "border-transparent text-[var(--txm)] hover:text-[var(--txd)]"
							}`}
						>
							{tab}
						</button>
					);
				})}
			</div>

			{v.tab === "Overview" && <LeagueOverviewTab detail={detail} />}
			{v.tab === "Seasons" && <LeagueSeasonsTab seasons={detail.seasons} />}
			{v.tab === "Teams" && <LeagueTeamsTab teams={detail.teams} />}
		</div>
	);
}

/** Establishes its own PermissionProvider (matches the other admin islands). */
export default function LeagueDetailPage({ leagueId }: { leagueId: string }) {
	return (
		<ErrorBoundary>
			<PermissionProvider>
				<LeagueDetailContent leagueId={leagueId} />
			</PermissionProvider>
		</ErrorBoundary>
	);
}
