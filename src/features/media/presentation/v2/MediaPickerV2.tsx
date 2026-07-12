import { useCallback, useEffect, useRef, useState } from "react";
import { X, UploadCloud, Image as ImageIcon, Loader2, AlertCircle } from "lucide-react";

interface MediaItem {
	id: string;
	title: string;
	url: string;
	type?: string;
}

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Called with the chosen URL when the user confirms. */
	onSelect: (url: string) => void;
	title?: string;
	subtitle?: string;
}

type Tab = "Library" | "Upload";

/**
 * The v2 media picker: browse the library or upload a new file, then confirm.
 * Shared across the redesigned admin — it deliberately does NOT replace the
 * legacy `MediaLibraryPicker`, which seven v1 editors still render.
 */
export default function MediaPickerV2({
	open,
	onOpenChange,
	onSelect,
	title = "Select logo",
	subtitle = "Choose from your media library or upload a new file",
}: Props) {
	const [tab, setTab] = useState<Tab>("Library");
	const [items, setItems] = useState<MediaItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [selected, setSelected] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [uploaded, setUploaded] = useState<{ name: string; url: string } | null>(null);
	const fileRef = useRef<HTMLInputElement>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const res = await fetch("/api/media?type=IMAGE");
			if (!res.ok) throw new Error("failed");
			const data = await res.json();
			setItems(Array.isArray(data) ? data : (data?.data ?? []));
		} catch {
			setError("Could not load your media library.");
		} finally {
			setLoading(false);
		}
	}, []);

	// Reset to a clean sheet each time the dialog opens.
	useEffect(() => {
		if (!open) return;
		setTab("Library");
		setSelected(null);
		setUploaded(null);
		setError("");
		load();
	}, [open, load]);

	// Escape closes, matching every other dialog in the admin.
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onOpenChange(false);
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open, onOpenChange]);

	if (!open) return null;

	const upload = async (file: File) => {
		setUploading(true);
		setError("");
		try {
			const body = new FormData();
			body.append("files", file);
			body.append("folder", "general");

			const res = await fetch("/api/media/batch-upload", { method: "POST", body });
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data?.error || "Upload failed");

			const first = Array.isArray(data.results)
				? data.results.find((r: { url?: string; error?: string }) => r.url && !r.error)
				: null;
			if (!first?.url) throw new Error(data?.results?.[0]?.error || "Upload failed");

			setUploaded({ name: file.name, url: first.url });
			setSelected(first.url);
			await load();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Upload failed");
		} finally {
			setUploading(false);
		}
	};

	const confirm = () => {
		if (!selected) return;
		onSelect(selected);
		onOpenChange(false);
	};

	return (
		<div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/60" onClick={() => onOpenChange(false)} />

			<div
				role="dialog"
				aria-modal="true"
				aria-label={title}
				className="relative z-10 flex max-h-[86vh] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)] shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
			>
				{/* header */}
				<div className="flex items-center justify-between border-b border-[var(--bord2)] px-5 py-4">
					<div>
						<h3 className="font-['Anton'] text-[18px] uppercase text-[var(--tx)]">{title}</h3>
						<p className="font-['Space_Mono'] text-[11px] text-[var(--txm)]">{subtitle}</p>
					</div>
					<button
						type="button"
						onClick={() => onOpenChange(false)}
						aria-label="Close"
						className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--bord)] bg-[var(--surf2)] text-[var(--txm)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
					>
						<X className="h-[15px] w-[15px]" />
					</button>
				</div>

				{/* tabs */}
				<div className="flex gap-1 border-b border-[var(--bord2)] px-5 pt-3">
					{(["Library", "Upload"] as Tab[]).map((t) => {
						const on = tab === t;
						return (
							<button
								key={t}
								type="button"
								onClick={() => setTab(t)}
								className={`-mb-px border-b-2 px-4 py-2.5 font-['Archivo'] text-[12.5px] font-bold uppercase tracking-[0.04em] ${
									on
										? "border-[var(--brand)] text-[var(--tx)]"
										: "border-transparent text-[var(--txm)] hover:text-[var(--txd)]"
								}`}
							>
								{t}
							</button>
						);
					})}
				</div>

				{/* body */}
				<div className="eb-scroll min-h-0 flex-1 overflow-y-auto p-5">
					{error && (
						<div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--brand)]/40 bg-[var(--brand)]/[0.1] px-3.5 py-2.5 font-['Archivo'] text-[12.5px] text-[var(--brandsoft)]">
							<AlertCircle className="h-4 w-4 flex-shrink-0" />
							{error}
						</div>
					)}

					{tab === "Library" &&
						(loading ? (
							<div className="flex items-center justify-center gap-2 py-16 text-[var(--txm)]">
								<Loader2 className="h-5 w-5 animate-spin" />
								Loading media…
							</div>
						) : items.length === 0 ? (
							<div className="flex flex-col items-center gap-2 py-16 text-center">
								<span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surf2)] text-[var(--txm)]">
									<ImageIcon className="h-[22px] w-[22px]" />
								</span>
								<div className="font-['Anton'] text-[18px] uppercase text-[var(--tx)]">Library is empty</div>
								<p className="font-['Archivo'] text-[13px] text-[var(--txm)]">Upload a file to get started.</p>
							</div>
						) : (
							<>
								<div className="grid grid-cols-4 gap-3 max-[600px]:grid-cols-3">
									{items.map((item) => {
										const on = selected === item.url;
										return (
											<button
												key={item.id}
												type="button"
												title={item.title}
												onClick={() => setSelected(item.url)}
												className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-[var(--bord)] bg-[var(--surf2)]"
											>
												<img src={item.url} alt="" className="h-full w-full object-cover" loading="lazy" />
												{on && (
													<>
														<span
															className="absolute inset-0 rounded-xl"
															style={{ boxShadow: "inset 0 0 0 3px #e4002b" }}
														/>
														<span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand)] text-[11px] font-bold leading-none text-white">
															✓
														</span>
													</>
												)}
											</button>
										);
									})}
								</div>
								<p className="mt-3 font-['Space_Mono'] text-[11px] text-[var(--txm)]">
									{items.length} item{items.length === 1 ? "" : "s"} in library
								</p>
							</>
						))}

					{tab === "Upload" && (
						<>
							<label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--bord)] bg-[var(--surf2)] px-6 py-12 text-center hover:border-[var(--brand)]">
								<span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand)]/[0.12] text-[var(--brand)]">
									{uploading ? (
										<Loader2 className="h-[26px] w-[26px] animate-spin" />
									) : (
										<UploadCloud className="h-[26px] w-[26px]" />
									)}
								</span>
								<div className="font-['Anton'] text-[18px] uppercase text-[var(--tx)]">
									{uploading ? "Uploading…" : "Drop a file or browse"}
								</div>
								<p className="max-w-[320px] font-['Archivo'] text-[13px] text-[var(--txm)]">
									PNG, JPG or SVG up to 5MB. Square images look best.
								</p>
								<input
									ref={fileRef}
									type="file"
									accept="image/*"
									disabled={uploading}
									className="hidden"
									onChange={(e) => {
										const file = e.target.files?.[0];
										if (file) upload(file);
										e.target.value = "";
									}}
								/>
								<span className="mt-1 rounded-lg bg-[var(--brand)] px-4 py-2 font-['Archivo'] text-[12px] font-extrabold uppercase tracking-[0.04em] text-white">
									Browse files
								</span>
							</label>

							{uploaded && (
								<div className="mt-4 flex items-center gap-3 rounded-xl border border-[var(--bord)] bg-[var(--surf2)] px-4 py-3">
									<img src={uploaded.url} alt="" className="h-11 w-11 flex-shrink-0 rounded-lg object-cover" />
									<div className="min-w-0 flex-1">
										<div className="truncate font-['Archivo'] text-[13px] font-bold text-[var(--tx)]">
											{uploaded.name}
										</div>
										<div className="font-['Space_Mono'] text-[11px] text-[#1f9d55]">Ready to use</div>
									</div>
									<span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#1f9d55] text-[12px] font-bold leading-none text-white">
										✓
									</span>
								</div>
							)}
						</>
					)}
				</div>

				{/* footer */}
				<div className="flex items-center justify-between gap-3 border-t border-[var(--bord2)] px-5 py-4">
					<button
						type="button"
						onClick={() => onOpenChange(false)}
						className="rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-4 py-2 font-['Archivo'] text-[12px] font-bold text-[var(--txd)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={confirm}
						disabled={!selected}
						className="rounded-lg bg-[var(--brand)] px-4 py-2 font-['Archivo'] text-[12px] font-extrabold uppercase tracking-[0.04em] text-white hover:bg-[var(--brandlt)] disabled:cursor-not-allowed disabled:opacity-40"
					>
						Use selected
					</button>
				</div>
			</div>
		</div>
	);
}
