import { useEffect, useRef, useState } from "react";
import { Search, Inbox, MoreVertical, Check } from "lucide-react";
import { type Message, type MessageFilter, messageStatus, hasDraft, isTrashed } from "@/features/messages/domain/entities/message";

const TINTS = ["#e4002b", "#1f8a5b", "#2a6fdb", "#d98324", "#7c5cff", "#c026a6"];
export function avatarTint(name: string): string {
	let h = 0;
	for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
	return TINTS[h % TINTS.length];
}
export function initialOf(name: string): string {
	return (name.trim()[0] || "?").toUpperCase();
}
export function shortTime(iso: string): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	const diff = Date.now() - d.getTime();
	const day = 86_400_000;
	if (diff < day) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
	if (diff < 7 * day) return `${Math.floor(diff / day)}d`;
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface Props {
	filtered: Message[];
	filters: MessageFilter[];
	filter: MessageFilter;
	setFilter: (f: MessageFilter) => void;
	counts: Record<MessageFilter, number>;
	search: string;
	setSearch: (s: string) => void;
	selectedId: string | null;
	onSelect: (id: string) => void;
	checked: Set<string>;
	onToggleCheck: (id: string) => void;
	onClearChecked: () => void;
	onBulkRead: () => void;
	onBulkTrash: () => void;
	rowSetRead: (id: string, read: boolean) => void;
	rowTrash: (id: string, trashed: boolean) => void;
	rowDelete: (id: string) => void;
}

export default function MessageList(p: Props) {
	const [menuId, setMenuId] = useState<string | null>(null);
	const listRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!menuId) return;
		const onDown = (e: MouseEvent) => {
			if (listRef.current && !(e.target as HTMLElement).closest("[data-row-menu]")) setMenuId(null);
		};
		document.addEventListener("mousedown", onDown);
		return () => document.removeEventListener("mousedown", onDown);
	}, [menuId]);

	const anyChecked = p.checked.size > 0;

	return (
		<div className="flex w-[380px] flex-shrink-0 flex-col border-r border-[var(--bord2)] max-[900px]:w-full max-[900px]:border-b max-[900px]:border-r-0">
			<div className="flex-shrink-0 border-b border-[var(--bord2)] px-4 py-3">
				<div className="mb-3 flex items-center gap-2.5 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3 py-2">
					<Search className="h-[15px] w-[15px] flex-shrink-0 text-[var(--txm)]" />
					<input
						type="text"
						value={p.search}
						onChange={(e) => p.setSearch(e.target.value)}
						placeholder="Search name, email, subject…"
						className="w-full border-none bg-transparent font-['Archivo'] text-[13px] text-[var(--tx)] outline-none placeholder:text-[var(--faint)]"
					/>
				</div>
				<div className="flex flex-wrap gap-1.5">
					{p.filters.map((f) => {
						const on = p.filter === f;
						return (
							<button
								key={f}
								type="button"
								onClick={() => p.setFilter(f)}
								className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-['Archivo'] text-[11.5px] font-bold ${on ? "border-[var(--brand)] bg-[var(--brand)]/[0.12] text-[var(--brandsoft)]" : "border-[var(--bord)] text-[var(--txm)]"}`}
							>
								{f}
								<span className={`inline-flex min-w-[16px] justify-center rounded-full px-1 font-['Space_Mono'] text-[9px] ${on ? "bg-[var(--brand)] text-white" : "bg-[var(--chip)] text-[var(--txm)]"}`}>{p.counts[f]}</span>
							</button>
						);
					})}
				</div>
			</div>

			{anyChecked && (
				<div className="flex flex-shrink-0 items-center gap-2 border-b border-[var(--bord2)] bg-[var(--surf2)] px-4 py-2.5">
					<span className="font-['Space_Mono'] text-[11px] font-bold text-[var(--tx)]">{p.checked.size} selected</span>
					<button type="button" onClick={p.onBulkRead} className="cursor-pointer rounded-md border border-[var(--bord)] bg-[var(--surf)] px-2.5 py-1.5 font-['Archivo'] text-[11px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]">Mark read</button>
					<button type="button" onClick={p.onBulkTrash} className="cursor-pointer rounded-md border border-[var(--bord)] bg-[var(--surf)] px-2.5 py-1.5 font-['Archivo'] text-[11px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]">Trash</button>
					<button type="button" onClick={p.onClearChecked} className="ml-auto cursor-pointer border-none bg-transparent p-0 font-['Archivo'] text-[11px] font-bold text-[var(--txm)] hover:text-[var(--brand)]">Clear</button>
				</div>
			)}

			<div ref={listRef} className="eb-scroll min-h-0 flex-1 overflow-y-auto">
				{p.filtered.map((m) => {
					const unread = !m.trashedAt && messageStatus(m) === "unread";
					const active = m.id === selectedRowId(p, m);
					const isChecked = p.checked.has(m.id);
					const trashed = isTrashed(m);
					return (
						<div key={m.id} className={`flex items-start gap-1 border-b border-[var(--bord2)] pr-1 ${active ? "bg-[var(--brand)]/[0.08]" : ""}`}>
							<button
								type="button"
								onClick={() => p.onToggleCheck(m.id)}
								aria-label={isChecked ? "Deselect" : "Select"}
								className={`ml-3 mt-4 flex h-[17px] w-[17px] flex-shrink-0 items-center justify-center rounded border ${isChecked ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-[var(--bord)] bg-transparent text-transparent hover:border-[var(--brand)]"}`}
							>
								<Check className="h-3 w-3" strokeWidth={3} />
							</button>

							<button type="button" onClick={() => p.onSelect(m.id)} className="flex min-w-0 flex-1 items-start gap-3 py-3 pl-1.5 pr-1 text-left">
								<span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-['Anton'] text-[14px] text-white" style={{ background: avatarTint(m.name) }}>{initialOf(m.name)}</span>
								<span className="min-w-0 flex-1">
									<span className="flex items-center justify-between gap-2">
										<span className={`truncate font-['Archivo'] text-[13px] ${unread ? "font-bold text-[var(--tx)]" : "text-[var(--txd)]"}`}>{m.name}</span>
										<span className="flex-shrink-0 font-['Space_Mono'] text-[10px] text-[var(--txm)]">{shortTime(m.createdAt)}</span>
									</span>
									<span className={`mt-0.5 block truncate font-['Archivo'] text-[12.5px] ${unread ? "font-semibold text-[var(--tx)]" : "text-[var(--txd)]"}`}>{m.subject}</span>
									<span className="mt-0.5 block truncate font-['Archivo'] text-[11.5px] text-[var(--txm)]">{m.message}</span>
									{hasDraft(m) && !trashed && (
										<span className="mt-1 inline-block rounded px-1.5 py-0.5 font-['Space_Mono'] text-[9px] font-bold uppercase tracking-[0.06em]" style={{ background: "rgba(217,131,36,0.16)", color: "#c9741d" }}>✎ Draft</span>
									)}
								</span>
							</button>

							<div className="relative mt-3 flex-shrink-0" data-row-menu>
								{unread && <span className="absolute right-[26px] top-1.5 h-[7px] w-[7px] rounded-full bg-[var(--brand)]" />}
								<button type="button" onClick={() => setMenuId(menuId === m.id ? null : m.id)} aria-label="More options" className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--txm)] hover:bg-[var(--hov)] hover:text-[var(--brand)]">
									<MoreVertical className="h-[15px] w-[15px]" />
								</button>
								{menuId === m.id && (
									<div className="absolute right-0 top-8 z-50 w-[160px] overflow-hidden rounded-lg border border-[var(--bord)] bg-[var(--surf)] shadow-[0_14px_40px_rgba(0,0,0,0.4)]">
										{trashed ? (
											<>
												<MenuItem label="Restore" onClick={() => { p.rowTrash(m.id, false); setMenuId(null); }} />
												<MenuItem label="Delete forever" danger onClick={() => { setMenuId(null); p.rowDelete(m.id); }} />
											</>
										) : (
											<>
												<MenuItem label={m.read ? "Mark as unread" : "Mark as read"} onClick={() => { p.rowSetRead(m.id, !m.read); setMenuId(null); }} />
												<MenuItem label="Move to trash" onClick={() => { p.rowTrash(m.id, true); setMenuId(null); }} />
											</>
										)}
									</div>
								)}
							</div>
						</div>
					);
				})}
				{p.filtered.length === 0 && (
					<div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
						<span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surf2)] text-[var(--txm)]"><Inbox className="h-5 w-5" /></span>
						<div className="font-['Archivo'] text-[14px] font-bold text-[var(--tx)]">No messages</div>
						<p className="max-w-[220px] font-['Archivo'] text-[12.5px] text-[var(--txm)]">Nothing matches this filter or search.</p>
					</div>
				)}
			</div>
		</div>
	);
}

function MenuItem({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`block w-full px-3.5 py-2.5 text-left font-['Archivo'] text-[12.5px] font-semibold hover:bg-[var(--hov)] ${danger ? "text-[var(--brand)]" : "text-[var(--txd)]"}`}
		>
			{label}
		</button>
	);
}

// selectedId is passed via prop `selectedId`; small helper keeps the row map tidy.
function selectedRowId(p: Props, _m: Message): string | null {
	return p.selectedId;
}
