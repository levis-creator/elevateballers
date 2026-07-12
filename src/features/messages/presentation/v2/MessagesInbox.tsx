import { PermissionProvider } from "@/features/rbac/usePermissions";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CheckCheck, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { useMessages } from "./hooks/useMessages";
import MessageList from "./components/MessageList";
import MessageReadingPane from "./components/MessageReadingPane";

function InboxContent() {
	const m = useMessages();

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
					<button type="button" onClick={m.markAllRead} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-2 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]">
						<CheckCheck className="h-[14px] w-[14px]" />Mark all read
					</button>
					<button type="button" onClick={m.refresh} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-2 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]">
						<RefreshCw className={`h-[14px] w-[14px] ${m.loading ? "animate-spin" : ""}`} />Refresh
					</button>
				</div>
			</div>

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
