import { useEffect, useState } from "react";
import { PermissionProvider } from "@/features/rbac/usePermissions";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Search, Plus, Trophy, Loader2, AlertCircle } from "lucide-react";
import { useLeagues } from "./hooks/useLeagues";
import LeagueKpis from "./components/LeagueKpis";
import LeagueCard from "./components/LeagueCard";
import type { LeagueFilter } from "@/features/leagues/domain/entities/league";

function LeaguesContent() {
	const v = useLeagues();
	const [menuId, setMenuId] = useState<string | null>(null);

	// Close an open kebab menu on any click outside of one.
	useEffect(() => {
		if (!menuId) return;
		const onDown = (e: MouseEvent) => {
			if (!(e.target as HTMLElement).closest("[data-kebab]")) setMenuId(null);
		};
		document.addEventListener("mousedown", onDown);
		return () => document.removeEventListener("mousedown", onDown);
	}, [menuId]);

	return (
		<div className="font-['Archivo'] text-[var(--tx)]">
			{/* header */}
			<div className="mb-5 flex flex-wrap items-end justify-between gap-3">
				<div>
					<div className="mb-1 font-['Space_Mono'] text-[11px] uppercase tracking-[0.16em] text-[var(--brandsoft)]">
						Competition
					</div>
					<h1 className="font-['Anton'] text-[30px] uppercase leading-none text-[var(--tx)]">Leagues</h1>
					<p className="mt-1.5 font-['Archivo'] text-[13px] text-[var(--txm)]">
						Manage leagues and tournaments across the organization.
					</p>
				</div>
				{v.canCreate && (
					<a
						href="/admin/leagues/new"
						className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2.5 font-['Archivo'] text-[12px] font-extrabold uppercase tracking-[0.04em] text-white no-underline hover:bg-[var(--brandlt)]"
					>
						<Plus className="h-[14px] w-[14px]" />
						Create League
					</a>
				)}
			</div>

			<LeagueKpis stats={v.stats} />

			{/* toolbar */}
			<div className="mb-4 flex flex-wrap items-center gap-3">
				<div className="flex min-w-[220px] max-w-[360px] flex-1 items-center gap-2.5 rounded-lg border border-[var(--bord)] bg-[var(--surf)] px-3 py-2.5">
					<Search className="h-[15px] w-[15px] flex-shrink-0 text-[var(--txm)]" />
					<input
						type="text"
						value={v.search}
						onChange={(e) => v.setSearch(e.target.value)}
						placeholder="Search leagues…"
						className="w-full border-none bg-transparent font-['Archivo'] text-[13px] text-[var(--tx)] outline-none placeholder:text-[var(--faint)]"
					/>
				</div>
				<div className="flex gap-1.5">
					{v.filters.map((f: LeagueFilter) => {
						const on = v.filter === f;
						return (
							<button
								key={f}
								type="button"
								onClick={() => v.setFilter(f)}
								className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-['Archivo'] text-[12px] font-bold uppercase tracking-[0.02em] ${
									on
										? "border-[var(--brand)] bg-[var(--brand)]/[0.12] text-[var(--brandsoft)]"
										: "border-[var(--bord)] text-[var(--txm)] hover:border-[var(--brand)]/40"
								}`}
							>
								{f}
								<span
									className={`inline-flex min-w-[16px] justify-center rounded-full px-1 font-['Space_Mono'] text-[9.5px] ${
										on ? "bg-[var(--brand)] text-white" : "bg-[var(--chip)] text-[var(--txm)]"
									}`}
								>
									{v.counts[f]}
								</span>
							</button>
						);
					})}
				</div>
			</div>

			{/* bulk bar */}
			{v.checked.size > 0 && (
				<div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-4 py-2.5">
					<span className="font-['Space_Mono'] text-[11px] font-bold text-[var(--tx)]">
						{v.checked.size} selected
					</span>
					{v.canUpdate && (
						<button
							type="button"
							onClick={v.bulkArchive}
							className="rounded-md border border-[var(--bord)] bg-[var(--surf)] px-2.5 py-1.5 font-['Archivo'] text-[11px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
						>
							Set archived
						</button>
					)}
					{v.canDelete && (
						<button
							type="button"
							onClick={v.bulkDelete}
							className="rounded-md border border-[var(--brand)]/40 bg-[var(--brand)]/[0.08] px-2.5 py-1.5 font-['Archivo'] text-[11px] font-bold text-[var(--brand)] hover:bg-[var(--brand)]/[0.16]"
						>
							Delete
						</button>
					)}
					<button
						type="button"
						onClick={v.clearChecked}
						className="ml-auto border-none bg-transparent p-0 font-['Archivo'] text-[11px] font-bold text-[var(--txm)] hover:text-[var(--brand)]"
					>
						Clear
					</button>
				</div>
			)}

			{/* body */}
			{v.loading ? (
				<div className="flex items-center justify-center gap-2 py-20 text-[var(--txm)]">
					<Loader2 className="h-5 w-5 animate-spin" />
					Loading leagues…
				</div>
			) : v.error ? (
				<div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--bord)] bg-[var(--surf)] py-16 text-center">
					<AlertCircle className="h-6 w-6 text-[var(--brand)]" />
					<p className="font-['Archivo'] text-[13px] text-[var(--txm)]">{v.error}</p>
					<button
						type="button"
						onClick={v.refresh}
						className="rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-2 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
					>
						Retry
					</button>
				</div>
			) : v.filtered.length === 0 ? (
				<div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--bord)] bg-[var(--surf)] px-6 py-16 text-center">
					<span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surf2)] text-[var(--brand)]">
						<Trophy className="h-[24px] w-[24px]" />
					</span>
					<div className="font-['Anton'] text-[20px] uppercase text-[var(--tx)]">No leagues found</div>
					<p className="max-w-[300px] font-['Archivo'] text-[13px] text-[var(--txm)]">
						{v.leagues.length === 0
							? "Create your first league to get started."
							: "Nothing matches this filter or search."}
					</p>
				</div>
			) : (
				<div className="grid grid-cols-2 gap-3.5 max-[760px]:grid-cols-1">
					{v.filtered.map((league) => (
						<LeagueCard
							key={league.id}
							league={league}
							checked={v.checked.has(league.id)}
							menuOpen={menuId === league.id}
							canUpdate={v.canUpdate}
							canDelete={v.canDelete}
							onToggleCheck={v.toggleCheck}
							onToggleMenu={setMenuId}
							onSetActive={v.setActive}
							onDelete={v.remove}
						/>
					))}
				</div>
			)}
		</div>
	);
}

/** Establishes its own PermissionProvider (matches the other admin islands). */
export default function LeaguesBoard() {
	return (
		<ErrorBoundary>
			<PermissionProvider>
				<LeaguesContent />
			</PermissionProvider>
		</ErrorBoundary>
	);
}
