import { useEffect, useRef, useState } from "react";
import { PermissionProvider } from "@/features/rbac/usePermissions";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import EntityAvatar from "@/components/EntityAvatar";
import { Search, Download, Plus, Check, MoreVertical, Mail, Loader2, AlertCircle } from "lucide-react";
import { useSubscribers } from "./hooks/useSubscribers";
import SubscriberKpis from "./components/SubscriberKpis";
import AddSubscriberModal from "./components/AddSubscriberModal";
import type { SubscriberFilter } from "@/features/subscribers/domain/entities/subscriber";

const dateFmt = (iso: string) => {
	const d = new Date(iso);
	return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

function SubscribersContent() {
	const v = useSubscribers();
	const [showAdd, setShowAdd] = useState(false);
	const [menuId, setMenuId] = useState<string | null>(null);
	const bodyRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!menuId) return;
		const onDown = (e: MouseEvent) => {
			if (!(e.target as HTMLElement).closest("[data-kebab]")) setMenuId(null);
		};
		document.addEventListener("mousedown", onDown);
		return () => document.removeEventListener("mousedown", onDown);
	}, [menuId]);

	const allChecked = v.paged.length > 0 && v.paged.every((s) => v.checked.has(s.id));

	return (
		<div className="font-['Archivo'] text-[var(--tx)]">
			{/* header */}
			<div className="mb-5 flex flex-wrap items-end justify-between gap-3">
				<div>
					<div className="mb-1 font-['Space_Mono'] text-[11px] uppercase tracking-[0.16em] text-[var(--brandsoft)]">Communication</div>
					<h1 className="font-['Anton'] text-[30px] uppercase leading-none text-[var(--tx)]">Subscribers</h1>
					<p className="mt-1.5 font-['Archivo'] text-[13px] text-[var(--txm)]">People subscribed to match-day and news email alerts.</p>
				</div>
				<div className="flex items-center gap-2">
					<button type="button" onClick={v.exportCsv} className="flex items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-2 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]"><Download className="h-[14px] w-[14px]" />Export CSV</button>
					{v.canManage && (
						<button type="button" onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-3.5 py-2 font-['Archivo'] text-[12px] font-extrabold uppercase tracking-[0.04em] text-white hover:bg-[var(--brandlt)]"><Plus className="h-[14px] w-[14px]" />Add subscriber</button>
					)}
				</div>
			</div>

			<SubscriberKpis stats={v.stats} />

			<div className="overflow-visible rounded-2xl border border-[var(--bord)] bg-[var(--surf)]">
				{/* toolbar */}
				<div className="flex flex-wrap items-center gap-3 border-b border-[var(--bord2)] px-5 py-3.5">
					<div className="flex min-w-[220px] max-w-[340px] flex-1 items-center gap-2.5 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3 py-2">
						<Search className="h-[15px] w-[15px] flex-shrink-0 text-[var(--txm)]" />
						<input type="text" value={v.search} onChange={(e) => v.setSearch(e.target.value)} placeholder="Search by email or name…" className="w-full border-none bg-transparent font-['Archivo'] text-[13px] text-[var(--tx)] outline-none placeholder:text-[var(--faint)]" />
					</div>
					<div className="flex gap-1.5">
						{v.filters.map((f: SubscriberFilter) => {
							const on = v.filter === f;
							return (
								<button key={f} type="button" onClick={() => v.setFilter(f)} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-['Archivo'] text-[12px] font-bold uppercase tracking-[0.02em] ${on ? "border-[var(--brand)] bg-[var(--brand)]/[0.12] text-[var(--brandsoft)]" : "border-[var(--bord)] text-[var(--txm)]"}`}>
									{f}<span className={`inline-flex min-w-[16px] justify-center rounded-full px-1 font-['Space_Mono'] text-[9.5px] ${on ? "bg-[var(--brand)] text-white" : "bg-[var(--chip)] text-[var(--txm)]"}`}>{v.counts[f]}</span>
								</button>
							);
						})}
					</div>
					<span className="ml-auto font-['Space_Mono'] text-[11px] text-[var(--txm)]">{v.filtered.length} shown</span>
				</div>

				{/* bulk bar */}
				{v.checked.size > 0 && (
					<div className="flex items-center gap-2 border-b border-[var(--bord2)] bg-[var(--surf2)] px-5 py-2.5">
						<span className="font-['Space_Mono'] text-[11px] font-bold text-[var(--tx)]">{v.checked.size} selected</span>
						{v.canManage && <button type="button" onClick={v.bulkUnsub} className="rounded-md border border-[var(--bord)] bg-[var(--surf)] px-2.5 py-1.5 font-['Archivo'] text-[11px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]">Unsubscribe</button>}
						{v.canManage && <button type="button" onClick={v.bulkDelete} className="rounded-md border border-[var(--brand)]/40 bg-[var(--brand)]/[0.08] px-2.5 py-1.5 font-['Archivo'] text-[11px] font-bold text-[var(--brand)] hover:bg-[var(--brand)]/[0.16]">Delete</button>}
						<button type="button" onClick={v.clearChecked} className="ml-auto border-none bg-transparent p-0 font-['Archivo'] text-[11px] font-bold text-[var(--txm)] hover:text-[var(--brand)]">Clear</button>
					</div>
				)}

				{/* table */}
				<div ref={bodyRef} className="overflow-x-auto">
					{v.loading ? (
						<div className="flex items-center justify-center gap-2 py-16 text-[var(--txm)]"><Loader2 className="h-5 w-5 animate-spin" />Loading subscribers…</div>
					) : v.error ? (
						<div className="flex flex-col items-center gap-2 py-16 text-center"><AlertCircle className="h-6 w-6 text-[var(--brand)]" /><p className="font-['Archivo'] text-[13px] text-[var(--txm)]">{v.error}</p></div>
					) : v.filtered.length === 0 ? (
						<div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
							<span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surf2)] text-[var(--txm)]"><Mail className="h-[22px] w-[22px]" /></span>
							<div className="font-['Anton'] text-[20px] uppercase text-[var(--tx)]">No subscribers</div>
							<p className="max-w-[300px] font-['Archivo'] text-[13px] text-[var(--txm)]">Nothing matches this filter or search.</p>
						</div>
					) : (
						<table className="w-full border-collapse">
							<thead>
								<tr>
									<th className="w-[44px] border-b border-[var(--bord2)] px-4 py-3">
										<button type="button" onClick={v.toggleAll} aria-label="Select all" className={`flex h-[18px] w-[18px] items-center justify-center rounded border ${allChecked ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-[var(--bord)] text-transparent hover:border-[var(--brand)]"}`}><Check className="h-3 w-3" strokeWidth={3} /></button>
									</th>
									<th className="border-b border-[var(--bord2)] px-4 py-3 text-left font-['Space_Mono'] text-[10px] uppercase tracking-[0.1em] text-[var(--txm)]">Subscriber</th>
									<th className="border-b border-[var(--bord2)] px-4 py-3 text-left font-['Space_Mono'] text-[10px] uppercase tracking-[0.1em] text-[var(--txm)]">Status</th>
									<th className="border-b border-[var(--bord2)] px-4 py-3 text-left font-['Space_Mono'] text-[10px] uppercase tracking-[0.1em] text-[var(--txm)] max-[600px]:hidden">Subscribed</th>
									<th className="w-[52px] border-b border-[var(--bord2)] px-4 py-3" />
								</tr>
							</thead>
							<tbody>
								{v.paged.map((s) => {
									const isChecked = v.checked.has(s.id);
									return (
										<tr key={s.id} className={isChecked ? "bg-[var(--hov)]" : ""}>
											<td className="border-b border-[var(--bord2)] px-4 py-3 align-middle">
												<button type="button" onClick={() => v.toggleCheck(s.id)} aria-label="Select" className={`flex h-[18px] w-[18px] items-center justify-center rounded border ${isChecked ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-[var(--bord)] text-transparent hover:border-[var(--brand)]"}`}><Check className="h-3 w-3" strokeWidth={3} /></button>
											</td>
											<td className="border-b border-[var(--bord2)] px-4 py-3 align-middle">
												<div className="flex items-center gap-3">
													<EntityAvatar seed={s.email} label={s.name || s.email} maxInitials={1} className="h-9 w-9 rounded-full text-[14px]" />
													<div className="min-w-0">
														<div className="truncate font-['Archivo'] text-[13.5px] font-bold text-[var(--tx)]">{s.email}</div>
														{s.name && <div className="truncate font-['Space_Mono'] text-[11px] text-[var(--txm)]">{s.name}</div>}
													</div>
												</div>
											</td>
											<td className="border-b border-[var(--bord2)] px-4 py-3 align-middle">
												<span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-['Space_Mono'] text-[10px] font-bold uppercase tracking-[0.06em]" style={s.active ? { background: "rgba(31,157,85,0.16)", color: "#1f9d55" } : { background: "var(--chip)", color: "var(--txm)" }}>
													<span className="h-1.5 w-1.5 rounded-full" style={{ background: s.active ? "#1f9d55" : "#8a817a" }} />{s.active ? "Active" : "Unsubscribed"}
												</span>
											</td>
											<td className="border-b border-[var(--bord2)] px-4 py-3 align-middle font-['Space_Mono'] text-[12px] text-[var(--txm)] max-[600px]:hidden">{dateFmt(s.createdAt)}</td>
											<td className="border-b border-[var(--bord2)] px-4 py-3 align-middle">
												{v.canManage && (
													<div className="relative" data-kebab>
														<button type="button" onClick={() => setMenuId(menuId === s.id ? null : s.id)} aria-label="More options" className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--txm)] hover:bg-[var(--hov)] hover:text-[var(--brand)]"><MoreVertical className="h-[15px] w-[15px]" /></button>
														{menuId === s.id && (
															<div className="absolute right-0 top-8 z-50 w-[180px] overflow-hidden rounded-lg border border-[var(--bord)] bg-[var(--surf)] shadow-[0_14px_40px_rgba(0,0,0,0.4)]">
																<button type="button" onClick={() => { v.setActive(s.id, !s.active); setMenuId(null); }} className="block w-full px-3.5 py-2.5 text-left font-['Archivo'] text-[12.5px] font-semibold text-[var(--txd)] hover:bg-[var(--hov)]">{s.active ? "Mark unsubscribed" : "Reactivate"}</button>
																<button type="button" onClick={() => { setMenuId(null); v.remove(s.id); }} className="block w-full px-3.5 py-2.5 text-left font-['Archivo'] text-[12.5px] font-semibold text-[var(--brand)] hover:bg-[var(--hov)]">Delete</button>
															</div>
														)}
													</div>
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					)}
				</div>

				{/* footer / pagination */}
				{!v.loading && v.filtered.length > 0 && (
					<div className="flex items-center justify-between border-t border-[var(--bord2)] px-5 py-3 font-['Space_Mono'] text-[11px] text-[var(--txm)]">
						<span>Showing {v.paged.length} of {v.filtered.length}</span>
						<span className="flex gap-1.5">
							<button type="button" disabled={v.page <= 1} onClick={() => v.setPage(v.page - 1)} className="rounded border border-[var(--bord)] bg-[var(--surf2)] px-2.5 py-1 text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)] disabled:opacity-40">Prev</button>
							<span className="px-1 py-1">{v.page} / {v.totalPages}</span>
							<button type="button" disabled={v.page >= v.totalPages} onClick={() => v.setPage(v.page + 1)} className="rounded border border-[var(--bord)] bg-[var(--surf2)] px-2.5 py-1 text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)] disabled:opacity-40">Next</button>
						</span>
					</div>
				)}
			</div>

			{showAdd && <AddSubscriberModal onClose={() => setShowAdd(false)} onAdd={v.add} />}
		</div>
	);
}

/** Establishes its own PermissionProvider (matches the other admin islands). */
export default function SubscribersTable() {
	return (
		<ErrorBoundary>
			<PermissionProvider>
				<SubscribersContent />
			</PermissionProvider>
		</ErrorBoundary>
	);
}
