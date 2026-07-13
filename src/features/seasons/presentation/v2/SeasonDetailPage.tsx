import { PermissionProvider } from "@/features/rbac/usePermissions";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { useSeasonDetail } from "./hooks/useSeasonDetail";
import SeasonHero from "./components/SeasonHero";
import SeasonScheduleTab from "./components/SeasonScheduleTab";
import SeasonStandingsTab from "./components/SeasonStandingsTab";
import SeasonTeamsTab from "./components/SeasonTeamsTab";

function SeasonDetailContent({ seasonId }: { seasonId: string }) {
	const v = useSeasonDetail(seasonId);

	if (v.loading) {
		return (
			<div className="flex items-center justify-center gap-2 py-24 text-[var(--txm)]">
				<Loader2 className="h-5 w-5 animate-spin" />
				Loading season…
			</div>
		);
	}

	if (v.error || !v.detail || !v.stats) {
		return (
			<div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--bord)] bg-[var(--surf)] py-16 text-center">
				<AlertCircle className="h-6 w-6 text-[var(--brand)]" />
				<p className="font-['Archivo'] text-[13px] text-[var(--txm)]">{v.error || "Could not load this season."}</p>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={v.refresh}
						className="rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-2 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
					>
						Retry
					</button>
					<a
						href="/admin/seasons"
						className="rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-2 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] no-underline hover:border-[var(--brand)] hover:text-[var(--brand)]"
					>
						All seasons
					</a>
				</div>
			</div>
		);
	}

	const { season, fixtures, standings, teams } = v.detail;

	return (
		<div className="font-['Archivo'] text-[var(--tx)]">
			<a
				href="/admin/seasons"
				className="mb-4 inline-flex items-center gap-2 font-['Space_Mono'] text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--txm)] no-underline hover:text-[var(--brand)]"
			>
				<ArrowLeft className="h-[14px] w-[14px]" />
				All seasons
			</a>

			<SeasonHero season={season} stats={v.stats} canUpdate={v.canUpdate} canCreateMatch={v.canCreateMatch} />

			{/* tabs */}
			<div className="mb-5 flex gap-2 border-b border-[var(--bord2)]">
				{v.tabs.map((tab) => {
					const on = v.tab === tab;
					return (
						<button
							key={tab}
							type="button"
							onClick={() => v.setTab(tab)}
							className={`-mb-px mr-[22px] border-b-2 bg-transparent px-1 py-[11px] font-['Archivo'] text-[13px] font-bold uppercase tracking-[0.02em] ${
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

			{v.tab === "Schedule" && <SeasonScheduleTab fixtures={fixtures} seasonId={season.id} />}
			{v.tab === "Standings" && <SeasonStandingsTab standings={standings} seasonName={season.name} />}
			{v.tab === "Teams" && <SeasonTeamsTab teams={teams} />}
		</div>
	);
}

/** Establishes its own PermissionProvider (matches the other admin islands). */
export default function SeasonDetailPage({ seasonId }: { seasonId: string }) {
	return (
		<ErrorBoundary>
			<PermissionProvider>
				<SeasonDetailContent seasonId={seasonId} />
			</PermissionProvider>
		</ErrorBoundary>
	);
}
