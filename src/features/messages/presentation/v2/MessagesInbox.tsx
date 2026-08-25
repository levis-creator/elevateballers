import { PermissionProvider } from "@/features/rbac/usePermissions";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CheckCheck, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useMessages } from "./hooks/useMessages";
import MessageList from "./components/MessageList";
import MessageReadingPane from "./components/MessageReadingPane";

function InboxContent() {
	const m = useMessages();
	const initialQuery = typeof window === "undefined" ? null : new URLSearchParams(window.location.search);
	const [composeOpen, setComposeOpen] = useState(initialQuery?.get("compose") === "1");
	const [composeTo, setComposeTo] = useState(initialQuery?.get("to") ?? "");
	const [composeName, setComposeName] = useState(initialQuery?.get("name") ?? "");
	const [composeSubject, setComposeSubject] = useState("");
	const [composeMessage, setComposeMessage] = useState("");
	const [composeError, setComposeError] = useState("");
	const [composeSending, setComposeSending] = useState(false);
	const sendCompose = async () => {
		setComposeSending(true);
		setComposeError("");
		try {
			const response = await fetch("/api/admin-messages/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: composeName, email: composeTo, subject: composeSubject, message: composeMessage }) });
			const body = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(body.error || "Unable to send message.");
			setComposeOpen(false);
			setComposeSubject("");
			setComposeMessage("");
		} catch (error) {
			setComposeError(error instanceof Error ? error.message : "Unable to send message.");
		} finally {
			setComposeSending(false);
		}
	};

	return (
		<div className="font-['Archivo'] text-[var(--tx)]">
			{/* page header */}
			<div className="mb-4 flex flex-wrap items-end justify-between gap-3">
				<div>
					<div className="mb-1 font-['Space_Mono'] text-[11px] uppercase tracking-[0.16em] text-[var(--brandsoft)]">Communication</div>
					<h1 className="font-['Anton'] text-[28px] uppercase leading-none text-[var(--tx)]">Contact Messages</h1>
					<p className="mt-1.5 font-['Archivo'] text-[13px] text-[var(--txm)]">Messages submitted through the public contact form.</p>
				</div>
				<div className="flex items-center gap-2">
					<button type="button" onClick={() => setComposeOpen(true)} className="flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--brand)] px-3.5 py-2 font-['Archivo'] text-[12px] font-bold text-white hover:opacity-90">New message</button>
					<button type="button" onClick={m.markAllRead} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-2 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]">
						<CheckCheck className="h-[14px] w-[14px]" />Mark all read
					</button>
					<button type="button" onClick={m.refresh} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-2 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]">
						<RefreshCw className={`h-[14px] w-[14px] ${m.loading ? "animate-spin" : ""}`} />Refresh
					</button>
				</div>
			</div>
			{composeOpen && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setComposeOpen(false); }}><div className="w-full max-w-[560px] rounded-2xl border border-[var(--bord)] bg-[var(--surf)] shadow-[0_28px_80px_rgba(0,0,0,0.55)]" role="dialog" aria-modal="true" aria-labelledby="compose-message-title"><div className="flex items-start justify-between border-b border-[var(--bord2)] px-5 py-4"><div><div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-[var(--brandsoft)]">Communication</div><h2 id="compose-message-title" className="mt-0.5 font-['Anton'] text-[20px] uppercase leading-none text-[var(--tx)]">New message</h2></div><button type="button" onClick={() => setComposeOpen(false)} className="text-xl text-[var(--txm)]">✕</button></div><div className="grid gap-3 px-5 py-5"><label className="grid gap-1 text-[11px] font-bold text-[var(--tx)]">Recipient<input className="h-9 rounded-md border border-[var(--bord)] bg-[var(--surf2)] px-2 text-[12px] text-[var(--tx)]" value={composeTo} onChange={(event) => setComposeTo(event.target.value)} /></label><label className="grid gap-1 text-[11px] font-bold text-[var(--tx)]">Name<input className="h-9 rounded-md border border-[var(--bord)] bg-[var(--surf2)] px-2 text-[12px] text-[var(--tx)]" value={composeName} onChange={(event) => setComposeName(event.target.value)} /></label><label className="grid gap-1 text-[11px] font-bold text-[var(--tx)]">Subject<input className="h-9 rounded-md border border-[var(--bord)] bg-[var(--surf2)] px-2 text-[12px] text-[var(--tx)]" value={composeSubject} onChange={(event) => setComposeSubject(event.target.value)} placeholder="Message from ElevateBallers" /></label><label className="grid gap-1 text-[11px] font-bold text-[var(--tx)]">Message<textarea className="min-h-[130px] resize-y rounded-md border border-[var(--bord)] bg-[var(--surf2)] px-2 py-2 text-[12px] text-[var(--tx)]" value={composeMessage} onChange={(event) => setComposeMessage(event.target.value)} placeholder="Write your message…" /></label>{composeError && <p role="alert" className="text-[12px] text-[var(--brand)]">{composeError}</p>}</div><div className="flex justify-end gap-2 border-t border-[var(--bord2)] px-5 py-4"><button type="button" onClick={() => setComposeOpen(false)} className="rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-2.5 text-[12px] font-bold text-[var(--txd)]">Cancel</button><button type="button" disabled={composeSending} onClick={() => void sendCompose()} className="rounded-lg bg-[var(--brand)] px-3.5 py-2.5 text-[12px] font-bold text-white disabled:opacity-50">{composeSending ? "Sending…" : "Send message"}</button></div></div></div>}

			{/* master-detail — contained inbox that fills the viewport height */}
			<div className="flex h-[calc(100vh-190px)] min-h-[520px] overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)] max-[900px]:h-auto max-[900px]:min-h-0 max-[900px]:flex-col">
				{m.loading && m.messages.length === 0 ? (
					<div className="flex flex-1 items-center justify-center gap-2 py-20 text-[var(--txm)]"><Loader2 className="h-5 w-5 animate-spin" />Loading messages…</div>
				) : m.error && m.messages.length === 0 ? (
					<div className="flex flex-1 flex-col items-center justify-center gap-2 py-20 text-center"><AlertCircle className="h-6 w-6 text-[var(--brand)]" /><p className="font-['Archivo'] text-[13px] text-[var(--txm)]">{m.error}</p></div>
				) : (
					<>
						<MessageList
							filtered={m.filtered}
							filters={m.filters}
							filter={m.filter}
							setFilter={m.setFilter}
							counts={m.counts}
							search={m.search}
							setSearch={m.setSearch}
							selectedId={m.selectedId}
							onSelect={m.select}
							checked={m.checked}
							onToggleCheck={m.toggleCheck}
							onClearChecked={m.clearChecked}
							onBulkRead={m.bulkRead}
							onBulkTrash={m.bulkTrash}
							rowSetRead={m.rowSetRead}
							rowTrash={m.rowTrash}
							rowDelete={m.rowDelete}
						/>
						<MessageReadingPane
							selected={m.selected}
							reply={m.reply}
							onReplyChange={m.onReplyChange}
							onSend={m.sendReply}
							sending={m.sending}
							toast={m.toast}
							draftToast={m.draftToast}
							draftLoaded={m.draftLoaded}
							error={m.error}
							onToggleRead={m.toggleRead}
							onMoveToTrash={m.moveToTrash}
							onRestore={m.restore}
							onDeleteForever={m.deleteForever}
							onSaveDraft={m.saveDraft}
							savingDraft={m.savingDraft}
							onClose={m.closeReading}
						/>
					</>
				)}
			</div>
		</div>
	);
}

/** Establishes its own PermissionProvider (matches the other admin islands). */
export default function MessagesInbox() {
	return (
		<ErrorBoundary>
			<PermissionProvider>
				<InboxContent />
			</PermissionProvider>
		</ErrorBoundary>
	);
}
