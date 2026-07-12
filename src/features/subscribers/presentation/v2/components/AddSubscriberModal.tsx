import { useState } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";

interface Props {
	onClose: () => void;
	onAdd: (email: string, name: string) => Promise<string | null>;
}

export default function AddSubscriberModal({ onClose, onAdd }: Props) {
	const [email, setEmail] = useState("");
	const [name, setName] = useState("");
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setSaving(true);
		const err = await onAdd(email, name);
		setSaving(false);
		if (err) setError(err);
		else onClose();
	};

	return (
		<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4" onMouseDown={onClose}>
			<div className="w-full max-w-[420px] rounded-2xl border border-[var(--bord)] bg-[var(--surf)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.5)]" onMouseDown={(e) => e.stopPropagation()}>
				<div className="mb-5 flex items-start justify-between">
					<h2 className="font-['Anton'] text-[22px] uppercase leading-none text-[var(--tx)]">Add Subscriber</h2>
					<button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--bord)] text-[var(--txm)] hover:border-[var(--brand)] hover:text-[var(--brand)]"><X className="h-[15px] w-[15px]" /></button>
				</div>
				<form onSubmit={submit} className="space-y-4">
					{error && <div className="flex items-center gap-2 rounded-lg border border-[var(--brand)]/40 bg-[var(--brand)]/[0.1] px-3.5 py-2.5 font-['Archivo'] text-[12.5px] text-[var(--brandsoft)]"><AlertCircle className="h-4 w-4 flex-shrink-0" />{error}</div>}
					<div>
						<label className="mb-1.5 block font-['Space_Mono'] text-[11px] uppercase tracking-[0.1em] text-[var(--txm)]">Email address</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							autoFocus
							placeholder="fan@example.com"
							className="w-full rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-2.5 font-['Archivo'] text-[13.5px] text-[var(--tx)] outline-none placeholder:text-[var(--faint)] focus:border-[var(--brand)]"
						/>
					</div>
					<div>
						<label className="mb-1.5 block font-['Space_Mono'] text-[11px] uppercase tracking-[0.1em] text-[var(--txm)]">Name <span className="text-[var(--faint)]">(optional)</span></label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Grace Achieng"
							className="w-full rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-3.5 py-2.5 font-['Archivo'] text-[13.5px] text-[var(--tx)] outline-none placeholder:text-[var(--faint)] focus:border-[var(--brand)]"
						/>
					</div>
					<div className="flex items-center justify-end gap-2 pt-2">
						<button type="button" onClick={onClose} className="rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-4 py-2.5 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]">Cancel</button>
						<button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2.5 font-['Anton'] text-[13px] uppercase tracking-[0.06em] text-white hover:bg-[var(--brandlt)] disabled:opacity-60">
							{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
