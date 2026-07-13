import { PermissionProvider } from "@/features/rbac/usePermissions";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AlertCircle, ArrowLeft, Check, Loader2, Save } from "lucide-react";
import { useSeasonForm } from "./hooks/useSeasonForm";
import SeasonDetailsCard from "./components/SeasonDetailsCard";
import SeasonLeaguesCard from "./components/SeasonLeaguesCard";
import SeasonScheduleCard from "./components/SeasonScheduleCard";
import SeasonRegistrationCard from "./components/SeasonRegistrationCard";
import SeasonPreviewRail from "./components/SeasonPreviewRail";

function SeasonFormContent({ seasonId }: { seasonId?: string }) {
	const v = useSeasonForm(seasonId);

	if (v.loading) {
		return (
			<div className="flex items-center justify-center gap-2 py-24 text-[var(--txm)]">
				<Loader2 className="h-5 w-5 animate-spin" />
				Loading…
			</div>
		);
	}

	const linked = v.leagues.filter((league) => v.values.leagueIds.includes(league.id));

	return (
		<div className="font-['Archivo'] text-[var(--tx)]">
			{/* header */}
			<div className="mb-5 flex flex-wrap items-end justify-between gap-3">
				<div>
					<div className="mb-1 font-['Space_Mono'] text-[11px] uppercase tracking-[0.16em] text-[var(--brandsoft)]">
						Competition
					</div>
					<h1 className="font-['Anton'] text-[30px] uppercase leading-none text-[var(--tx)]">
						{v.isEdit ? "Edit Season" : "Create Season"}
					</h1>
					<p className="mt-1.5 font-['Archivo'] text-[13px] text-[var(--txm)]">
						{v.isEdit
							? "Update this season's details, leagues and window."
							: "Set up a new season, link it to leagues, and define its window."}
					</p>
				</div>
				<a
					href="/admin/seasons"
					className="flex flex-shrink-0 items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-2 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] no-underline hover:border-[var(--brand)] hover:text-[var(--brand)]"
				>
					<ArrowLeft className="h-[14px] w-[14px]" />
					Back to Seasons
				</a>
			</div>

			{v.error && (
				<div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--brand)]/40 bg-[var(--brand)]/[0.1] px-4 py-3 font-['Archivo'] text-[13px] text-[var(--brandsoft)]">
					<AlertCircle className="h-4 w-4 flex-shrink-0" />
					{v.error}
				</div>
			)}

			<div className="grid grid-cols-[1.55fr_1fr] gap-5 max-[900px]:grid-cols-1">
				{/* form column */}
				<div className="flex flex-col gap-5">
					<SeasonDetailsCard
						values={v.values}
						errors={v.errors}
						touched={v.touched}
						slugPreview={v.slugPreview}
						set={v.set}
					/>

					<SeasonLeaguesCard
						leagues={v.leagues}
						selected={v.values.leagueIds}
						canCreateLeague={v.canCreateLeague}
						onToggle={v.toggleLeague}
					/>

					<SeasonScheduleCard
						values={v.values}
						errors={v.errors}
						touched={v.touched}
						status={v.status}
						statusLocked={v.statusLocked}
						set={v.set}
					/>

					<SeasonRegistrationCard values={v.values} errors={v.errors} touched={v.touched} set={v.set} />

					{/* actions */}
					<div className="flex flex-wrap items-center gap-2.5">
						<button
							type="button"
							onClick={v.save}
							disabled={!v.canSave}
							className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-5 py-2.5 font-['Archivo'] text-[13px] font-extrabold uppercase tracking-[0.05em] text-white hover:bg-[var(--brandlt)] disabled:cursor-not-allowed disabled:opacity-50"
						>
							{v.saving ? (
								<Loader2 className="h-[15px] w-[15px] animate-spin" />
							) : (
								<Save className="h-[15px] w-[15px]" />
							)}
							{v.isEdit ? "Update Season" : "Create Season"}
						</button>

						<a
							href="/admin/seasons"
							className="flex items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-4 py-2.5 font-['Archivo'] text-[13px] font-bold text-[var(--txd)] no-underline hover:border-[var(--brand)] hover:text-[var(--brand)]"
						>
							Cancel
						</a>

						{v.saved && !v.touched && (
							<span className="flex items-center gap-2 font-['Archivo'] text-[12.5px] font-bold text-[#1f9d55]">
								<span className="flex h-[16px] w-[16px] items-center justify-center rounded-full bg-[#1f9d55] text-white">
									<Check className="h-[10px] w-[10px]" strokeWidth={4} />
								</span>
								{v.isEdit ? "Changes saved" : "Season created"}
							</span>
						)}
					</div>
				</div>

				{/* preview rail */}
				<SeasonPreviewRail
					name={v.values.name}
					status={v.status}
					range={v.range}
					linked={linked}
					checklist={v.checklist}
				/>
			</div>
		</div>
	);
}

/** Establishes its own PermissionProvider (matches the other admin islands). */
export default function SeasonFormPage({ seasonId }: { seasonId?: string }) {
	return (
		<ErrorBoundary>
			<PermissionProvider>
				<SeasonFormContent seasonId={seasonId} />
			</PermissionProvider>
		</ErrorBoundary>
	);
}
