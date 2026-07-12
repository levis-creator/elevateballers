import { Inbox, Check, Trash2, RotateCcw, CornerUpLeft, ArrowRight, Loader2, AlertCircle, CheckCircle2, X } from "lucide-react";
import { type Message, messageStatus, isTrashed } from "@/features/messages/domain/entities/message";
import { avatarTint, initialOf } from "./MessageList";

const STATUS_META: Record<string, { label: string; color: string }> = {
	unread: { label: "Unread", color: "#2a6fdb" },
	read: { label: "Read", color: "#8a817a" },
	replied: { label: "Replied", color: "#1f9d55" },
};

function fullTime(iso: string | null): string {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

interface Props {
	selected: Message | null;
	reply: string;
	onReplyChange: (s: string) => void;
	onSend: () => void;
	sending: boolean;
	toast: string;
	draftToast: boolean;
	draftLoaded: boolean;
	error: string;
	onToggleRead: () => void;
	onMoveToTrash: () => void;
	onRestore: () => void;
	onDeleteForever: () => void;
	onSaveDraft: () => void;
	savingDraft: boolean;
	onClose: () => void;
}

export default function MessageReadingPane(p: Props) {
	const s = p.selected;
	if (!s) {
		return (
			<div className="eb-scroll flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto bg-[var(--surf3)] px-6 py-16 text-center">
				<span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surf2)] text-[var(--txm)]"><Inbox className="h-7 w-7" /></span>
				<div className="font-['Anton'] text-[22px] uppercase text-[var(--tx)]">Select a message</div>
				<p className="max-w-[300px] font-['Archivo'] text-[13px] text-[var(--txm)]">Choose a message from the list to read it and reply.</p>
			</div>
		);
	}

	const st = STATUS_META[messageStatus(s)];
	const trashed = isTrashed(s);
	const firstName = s.name.trim().split(/\s+/)[0] || s.name;
	const replyText = p.reply.trim();

	return (
		<div className="eb-scroll min-h-0 flex-1 overflow-y-auto bg-[var(--surf3)]">
			<div className="mx-auto max-w-[760px] px-8 py-7 max-[600px]:px-5 max-[600px]:py-5">
				<div className="mb-5 flex items-start justify-between gap-4">
					<h2 className="font-['Anton'] text-[26px] uppercase leading-[0.95] text-[var(--tx)]">{s.subject}</h2>
					<div className="flex flex-shrink-0 items-center gap-2">
						<span className="rounded-md px-2.5 py-1 font-['Space_Mono'] text-[10px] font-bold uppercase tracking-[0.06em]" style={{ background: `${st.color}22`, color: st.color }}>{st.label}</span>
						<button type="button" onClick={p.onClose} aria-label="Close message" title="Close" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--bord)] bg-[var(--surf)] text-[var(--txm)] hover:border-[var(--brand)] hover:text-[var(--brand)]"><X className="h-[15px] w-[15px]" /></button>
					</div>
				</div>

				<div className="mb-6 flex flex-wrap items-center gap-3.5 rounded-xl border border-[var(--bord)] bg-[var(--surf)] px-4 py-3.5">
					<span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full font-['Anton'] text-[17px] text-white" style={{ background: avatarTint(s.name) }}>{initialOf(s.name)}</span>
					<div className="min-w-0 flex-1">
						<div className="font-['Archivo'] text-[15px] font-bold text-[var(--tx)]">{s.name}</div>
						<a href={`mailto:${s.email}`} className="font-['Space_Mono'] text-[12px] text-[var(--brandsoft)] no-underline hover:text-[var(--brand)]">{s.email}</a>
					</div>
					<div className="font-['Space_Mono'] text-[11px] text-[var(--txm)]">{fullTime(s.createdAt)}</div>
				</div>

				<div className="mb-4 rounded-xl border border-[var(--bord)] bg-[var(--surf)] px-5 py-5">
					<p className="whitespace-pre-line font-['Archivo'] text-[14.5px] leading-[1.7] text-[var(--txd)]">{s.message}</p>
				</div>

				{/* Sent reply thread */}
				{s.replyBody && (
					<div className="mb-7 rounded-xl border px-5 py-4" style={{ borderColor: "rgba(31,157,85,0.4)", background: "rgba(31,157,85,0.06)" }}>
						<div className="mb-3 flex items-center gap-3">
							<span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand)] font-['Anton'] text-[15px] leading-none text-white">A</span>
							<div className="min-w-0 flex-1">
								<div className="font-['Archivo'] text-[14px] font-bold text-[var(--tx)]">ElevateBallers Team <span className="font-['Archivo'] text-[12px] font-normal text-[var(--txm)]">· you</span></div>
								<div className="font-['Space_Mono'] text-[11px] text-[var(--txm)]">Replied {fullTime(s.repliedAt)}</div>
							</div>
							<span className="flex-shrink-0 rounded-md px-2.5 py-1 font-['Space_Mono'] text-[10px] font-bold uppercase tracking-[0.06em]" style={{ background: "rgba(31,157,85,0.16)", color: "#1f9d55" }}>Sent</span>
						</div>
						<p className="whitespace-pre-line font-['Archivo'] text-[14px] leading-[1.65] text-[var(--txd)]">{s.replyBody}</p>
					</div>
				)}

				{/* Trashed state */}
				{trashed ? (
					<div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--bord)] bg-[var(--surf)] px-4 py-3">
						<span className="flex-1 font-['Archivo'] text-[12.5px] text-[var(--txm)]">This message is in Trash. Restore it to reply.</span>
						<button type="button" onClick={p.onRestore} className="flex items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-2 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]"><RotateCcw className="h-[14px] w-[14px]" />Restore</button>
						<button type="button" onClick={p.onDeleteForever} className="flex items-center gap-2 rounded-lg border border-[var(--brand)]/40 bg-[var(--brand)]/[0.08] px-3.5 py-2 font-['Archivo'] text-[12px] font-bold text-[var(--brand)] hover:bg-[var(--brand)]/[0.16]"><Trash2 className="h-[14px] w-[14px]" />Delete forever</button>
					</div>
				) : (
					<>
						<div className="mb-6 flex flex-wrap items-center gap-2">
							<button type="button" onClick={p.onToggleRead} className="flex items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf)] px-3.5 py-2 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]"><Check className="h-[14px] w-[14px]" />{s.read ? "Mark as unread" : "Mark as read"}</button>
							<button type="button" onClick={p.onMoveToTrash} className="ml-auto flex items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf)] px-3.5 py-2 font-['Archivo'] text-[12px] font-bold text-[var(--txm)] hover:border-[var(--brand)]/50 hover:text-[var(--brand)]"><Trash2 className="h-[14px] w-[14px]" />Move to trash</button>
						</div>

						<div className="rounded-xl border border-[var(--bord)] bg-[var(--surf)] p-4">
							<div className="mb-2.5 flex items-center gap-2">
								<span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--brand)]/[0.12] text-[var(--brand)]"><CornerUpLeft className="h-[14px] w-[14px]" /></span>
								<span className="font-['Anton'] text-[15px] uppercase tracking-[0.02em] text-[var(--tx)]">Reply to {firstName}</span>
								{p.draftLoaded && <span className="ml-auto rounded px-2 py-0.5 font-['Space_Mono'] text-[9px] font-bold uppercase tracking-[0.06em]" style={{ background: "rgba(217,131,36,0.16)", color: "#c9741d" }}>Draft loaded</span>}
							</div>
							<textarea
								value={p.reply}
								onChange={(e) => p.onReplyChange(e.target.value)}
								placeholder="Type your reply…"
								className="mb-3 h-[110px] w-full resize-none rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-3 font-['Archivo'] text-[13.5px] leading-[1.55] text-[var(--tx)] outline-none placeholder:text-[var(--faint)]"
							/>
							{p.error && <div className="mb-3 flex items-center gap-2 font-['Archivo'] text-[12.5px] text-[var(--brandsoft)]"><AlertCircle className="h-4 w-4 flex-shrink-0" />{p.error}</div>}
							<div className="flex flex-wrap items-center justify-between gap-3">
								<span className="font-['Space_Mono'] text-[11px] text-[var(--txm)]">Replies are sent to {s.email}</span>
								<span className="flex items-center gap-2">
									<button type="button" onClick={p.onSaveDraft} disabled={p.savingDraft} className="rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-2 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)] disabled:opacity-60">Save draft</button>
									<button type="button" onClick={p.onSend} disabled={p.sending || !replyText} className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2.5 font-['Anton'] text-[13px] uppercase tracking-[0.06em] text-white hover:bg-[var(--brandlt)] disabled:cursor-not-allowed disabled:opacity-60">
										{p.sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="inline-flex items-center gap-2">Send Reply<ArrowRight className="h-[14px] w-[14px]" /></span>}
									</button>
								</span>
							</div>

							{replyText && (
								<div className="mt-4 overflow-hidden rounded-lg border border-[var(--bord)] bg-[var(--surf2)]">
									<div className="flex items-center justify-between border-b border-[var(--bord2)] px-4 py-2">
										<span className="font-['Space_Mono'] text-[10px] uppercase tracking-[0.14em] text-[var(--txm)]">Preview</span>
										<span className="font-['Space_Mono'] text-[10px] text-[var(--faint)]">to {s.email}</span>
									</div>
									<div className="px-4 py-3.5">
										<div className="mb-2 font-['Archivo'] text-[13px] font-bold text-[var(--tx)]">Re: {s.subject}</div>
										<div className="whitespace-pre-line font-['Archivo'] text-[13.5px] leading-[1.65] text-[var(--txd)]">{p.reply}</div>
									</div>
								</div>
							)}

							{p.draftToast && <div className="mt-3 flex items-center gap-2 font-['Archivo'] text-[12.5px]" style={{ color: "#c9741d" }}><span className="flex h-[16px] w-[16px] items-center justify-center rounded-full text-[10px] font-bold leading-none text-white" style={{ background: "#d98324" }}>✓</span>Draft saved.</div>}
							{p.toast && <div className="mt-3 flex items-center gap-2 font-['Archivo'] text-[12.5px] text-[#1f9d55] [animation:eb-pop_.3s_ease]"><CheckCircle2 className="h-4 w-4 flex-shrink-0" />{p.toast}</div>}
						</div>
					</>
				)}
			</div>
		</div>
	);
}
