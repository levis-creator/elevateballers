import { Search, Inbox } from "lucide-react";
import { type Message, type MessageFilter, messageStatus } from "@/features/messages/domain/entities/message";

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
}

export default function MessageList({ filtered, filters, filter, setFilter, counts, search, setSearch, selectedId, onSelect }: Props) {
	return (
		<div className="flex w-[380px] flex-shrink-0 flex-col border-r border-[var(--bord2)] max-[900px]:w-full max-[900px]:border-b max-[900px]:border-r-0">
			<div className="flex-shrink-0 border-b border-[var(--bord2)] px-4 py-3">
				<div className="mb-3 flex items-center gap-2.5 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3 py-2">
					<Search className="h-[15px] w-[15px] flex-shrink-0 text-[var(--txm)]" />
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search name, email, subject…"
						className="w-full border-none bg-transparent font-['Archivo'] text-[13px] text-[var(--tx)] outline-none placeholder:text-[var(--faint)]"
					/>
				</div>
				<div className="flex gap-1.5">
					{filters.map((f) => {
						const on = filter === f;
						return (
							<button
								key={f}
								type="button"
								onClick={() => setFilter(f)}
								className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-['Archivo'] text-[11.5px] font-bold ${on ? "border-[var(--brand)] bg-[var(--brand)]/[0.12] text-[var(--brandsoft)]" : "border-[var(--bord)] text-[var(--txm)]"}`}
							>
								{f}
								<span className={`inline-flex min-w-[16px] justify-center rounded-full px-1 font-['Space_Mono'] text-[9px] ${on ? "bg-[var(--brand)] text-white" : "bg-[var(--chip)] text-[var(--txm)]"}`}>{counts[f]}</span>
							</button>
						);
					})}
				</div>
			</div>

			<div className="eb-scroll min-h-0 flex-1 overflow-y-auto">
				{filtered.map((m) => {
					const unread = messageStatus(m) === "unread";
					const active = m.id === selectedId;
					return (
						<button
							key={m.id}
							type="button"
							onClick={() => onSelect(m.id)}
							className={`flex w-full items-start gap-3 border-b border-[var(--bord2)] px-4 py-3 text-left transition-colors ${active ? "bg-[var(--brand)]/[0.08]" : "hover:bg-[var(--hov)]"}`}
						>
							<span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-['Anton'] text-[14px] text-white" style={{ background: avatarTint(m.name) }}>{initialOf(m.name)}</span>
							<span className="min-w-0 flex-1">
								<span className="flex items-center justify-between gap-2">
									<span className={`truncate font-['Archivo'] text-[13px] ${unread ? "font-bold text-[var(--tx)]" : "text-[var(--txd)]"}`}>{m.name}</span>
									<span className="flex-shrink-0 font-['Space_Mono'] text-[10px] text-[var(--txm)]">{shortTime(m.createdAt)}</span>
								</span>
								<span className={`mt-0.5 block truncate font-['Archivo'] text-[12.5px] ${unread ? "font-semibold text-[var(--tx)]" : "text-[var(--txd)]"}`}>{m.subject}</span>
								<span className="mt-0.5 block truncate font-['Archivo'] text-[11.5px] text-[var(--txm)]">{m.message}</span>
							</span>
							{unread && <span className="mt-1 h-[7px] w-[7px] flex-shrink-0 rounded-full bg-[var(--brand)]" />}
						</button>
					);
				})}
				{filtered.length === 0 && (
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
