import { Inbox, Check, Trash2, CornerUpLeft, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { type Message, messageStatus } from "@/features/messages/domain/entities/message";
import { avatarTint, initialOf } from "./MessageList";

const STATUS_META: Record<string, { label: string; color: string }> = {
	unread: { label: "Unread", color: "#2a6fdb" },
	read: { label: "Read", color: "#8a817a" },
	replied: { label: "Replied", color: "#1f9d55" },
};

function fullTime(iso: string): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

interface Props {
	selected: Message | null;
	reply: string;
	setReply: (s: string) => void;
	onSend: () => void;
	sending: boolean;
	toast: string;
	error: string;
	onToggleRead: () => void;
	onDelete: () => void;
}

export default function MessageReadingPane({ selected, reply, setReply, onSend, sending, toast, error, onToggleRead, onDelete }: Props) {
	if (!selected) {
		return (
			<div className="eb-scroll flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto bg-[var(--surf3)] px-6 py-16 text-center">
				<span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surf2)] text-[var(--txm)]"><Inbox className="h-7 w-7" /></span>
				<div className="font-['Anton'] text-[22px] uppercase text-[var(--tx)]">Select a message</div>
				<p className="max-w-[300px] font-['Archivo'] text-[13px] text-[var(--txm)]">Choose a message from the list to read it and reply.</p>
			</div>
		);
	}

	const status = messageStatus(selected);
	const st = STATUS_META[status];
	const firstName = selected.name.trim().split(/\s+/)[0] || selected.name;

	return (
		<div className="eb-scroll min-h-0 flex-1 overflow-y-auto bg-[var(--surf3)]">
			<div className="mx-auto max-w-[760px] px-8 py-7 max-[600px]:px-5 max-[600px]:py-5">
				<div className="mb-5 flex items-start justify-between gap-4">
					<h2 className="font-['Anton'] text-[26px] uppercase leading-[0.95] text-[var(--tx)]">{selected.subject}</h2>
					<span className="flex-shrink-0 rounded-md px-2.5 py-1 font-['Space_Mono'] text-[10px] font-bold uppercase tracking-[0.06em]" style={{ background: `${st.color}22`, color: st.color }}>{st.label}</span>
				</div>

				<div className="mb-6 flex flex-wrap items-center gap-3.5 rounded-xl border border-[var(--bord)] bg-[var(--surf)] px-4 py-3.5">
					<span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full font-['Anton'] text-[17px] text-white" style={{ background: avatarTint(selected.name) }}>{initialOf(selected.name)}</span>
					<div className="min-w-0 flex-1">
						<div className="font-['Archivo'] text-[15px] font-bold text-[var(--tx)]">{selected.name}</div>
						<a href={`mailto:${selected.email}`} className="font-['Space_Mono'] text-[12px] text-[var(--brandsoft)] no-underline hover:text-[var(--brand)]">{selected.email}</a>
					</div>
					<div className="font-['Space_Mono'] text-[11px] text-[var(--txm)]">{fullTime(selected.createdAt)}</div>
				</div>

				<div className="mb-7 rounded-xl border border-[var(--bord)] bg-[var(--surf)] px-5 py-5">
					<p className="whitespace-pre-line font-['Archivo'] text-[14.5px] leading-[1.7] text-[var(--txd)]">{selected.message}</p>
				</div>

				<div className="mb-6 flex flex-wrap items-center gap-2">
					<button type="button" onClick={onToggleRead} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf)] px-3.5 py-2 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]">
						<Check className="h-[14px] w-[14px]" />{selected.read ? "Mark as unread" : "Mark as read"}
					</button>
					<button type="button" onClick={onDelete} className="ml-auto flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf)] px-3.5 py-2 font-['Archivo'] text-[12px] font-bold text-[var(--txm)] hover:border-[var(--brand)]/50 hover:text-[var(--brand)]">
						<Trash2 className="h-[14px] w-[14px]" />Delete
					</button>
				</div>

				<div className="rounded-xl border border-[var(--bord)] bg-[var(--surf)] p-4">
					<div className="mb-2.5 flex items-center gap-2">
						<span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--brand)]/[0.12] text-[var(--brand)]"><CornerUpLeft className="h-[14px] w-[14px]" /></span>
						<span className="font-['Anton'] text-[15px] uppercase tracking-[0.02em] text-[var(--tx)]">Reply to {firstName}</span>
					</div>
					<textarea
						value={reply}
						onChange={(e) => setReply(e.target.value)}
						placeholder="Type your reply…"
						className="mb-3 h-[110px] w-full resize-none rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-3 font-['Archivo'] text-[13.5px] leading-[1.55] text-[var(--tx)] outline-none placeholder:text-[var(--faint)]"
					/>
					{error && (
						<div className="mb-3 flex items-center gap-2 font-['Archivo'] text-[12.5px] text-[var(--brandsoft)]"><AlertCircle className="h-4 w-4 flex-shrink-0" />{error}</div>
					)}
					<div className="flex items-center justify-between gap-3">
						<span className="font-['Space_Mono'] text-[11px] text-[var(--txm)]">Replies are sent to {selected.email}</span>
						<button
							type="button"
							onClick={onSend}
							disabled={sending || !reply.trim()}
							className="flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2.5 font-['Anton'] text-[13px] uppercase tracking-[0.06em] text-white hover:bg-[var(--brandlt)] disabled:cursor-not-allowed disabled:opacity-60"
						>
							{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="inline-flex items-center gap-2">Send Reply<ArrowRight className="h-[14px] w-[14px]" /></span>}
						</button>
					</div>
					{toast && (
						<div className="mt-3 flex items-center gap-2 font-['Archivo'] text-[12.5px] text-[#1f9d55] [animation:eb-pop_.3s_ease]"><CheckCircle2 className="h-4 w-4 flex-shrink-0" />{toast}</div>
					)}
				</div>
			</div>
		</div>
	);
}
