import { useEffect, useState } from "react";
import { X, Loader2, AlertCircle, CalendarDays } from "lucide-react";

interface LinkableSeason {
	id: string;
	name: string;
	startDate: string;
	endDate: string;
}

interface Props {
	onClose: () => void;
	fetchLinkable: () => Promise<LinkableSeason[]>;
	onLink: (seasonId: string) => Promise<void>;
}

const rangeFmt = (start: string, end: string) => {
	const fmt = (iso: string) => {
		const d = new Date(iso);
		return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
	};
	return `${fmt(start)} – ${fmt(end)}`;
};

/** Attaches an existing season to this league. Seasons already linked are excluded upstream. */
export default function LinkSeasonModal({ onClose, fetchLinkable, onLink }: Props) {
	const [seasons, setSeasons] = useState<LinkableSeason[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [linking, setLinking] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		fetchLinkable()
			.then((list) => {
				if (!cancelled) setSeasons(list);
			})
			.catch(() => {
				if (!cancelled) setError("Could not load seasons.");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [fetchLinkable]);

	const link = async (id: string) => {
		setLinking(id);
		await onLink(id);
		setLinking(null);
		onClose();
	};

	return (
		<div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/60" onClick={onClose} />

			<div
				role="dialog"
				aria-modal="true"
				aria-label="Link an existing season"
				className="relative z-10 flex max-h-[80vh] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)] shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
			>
				<div className="flex items-center justify-between border-b border-[var(--bord2)] px-5 py-4">
					<div>
						<h3 className="font-['Anton'] text-[18px] uppercase text-[var(--tx)]">Link existing season</h3>
						<p className="font-['Space_Mono'] text-[11px] text-[var(--txm)]">
							A season can run in more than one league
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close"
						className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--bord)] bg-[var(--surf2)] text-[var(--txm)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
					>
						<X className="h-[15px] w-[15px]" />
					</button>
				</div>

				<div className="eb-scroll min-h-0 flex-1 overflow-y-auto p-5">
					{loading ? (
						<div className="flex items-center justify-center gap-2 py-12 text-[var(--txm)]">
							<Loader2 className="h-5 w-5 animate-spin" />
							Loading seasons…
						</div>
					) : error ? (
						<div className="flex flex-col items-center gap-2 py-12 text-center">
							<AlertCircle className="h-6 w-6 text-[var(--brand)]" />
							<p className="font-['Archivo'] text-[13px] text-[var(--txm)]">{error}</p>
						</div>
					) : seasons.length === 0 ? (
						<div className="flex flex-col items-center gap-2 py-12 text-center">
							<span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surf2)] text-[var(--txm)]">
								<CalendarDays className="h-[22px] w-[22px]" />
							</span>
							<div className="font-['Anton'] text-[17px] uppercase text-[var(--tx)]">Nothing to link</div>
							<p className="max-w-[320px] font-['Archivo'] text-[13px] text-[var(--txm)]">
								Every existing season is already attached to this league.
							</p>
						</div>
					) : (
						<div className="flex flex-col gap-2">
							{seasons.map((s) => (
								<div
									key={s.id}
									className="flex items-center gap-3 rounded-xl border border-[var(--bord)] bg-[var(--surf2)] px-4 py-3"
								>
									<span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--brand)]/[0.12] text-[var(--brand)]">
										<CalendarDays className="h-[16px] w-[16px]" />
									</span>
									<div className="min-w-0 flex-1">
										<div className="truncate font-['Archivo'] text-[13px] font-bold text-[var(--tx)]">{s.name}</div>
										<div className="font-['Space_Mono'] text-[11px] text-[var(--txm)]">
											{rangeFmt(s.startDate, s.endDate)}
										</div>
									</div>
									<button
										type="button"
										disabled={linking !== null}
										onClick={() => link(s.id)}
										className="flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 py-1.5 font-['Archivo'] text-[11px] font-extrabold uppercase tracking-[0.04em] text-white hover:bg-[var(--brandlt)] disabled:opacity-50"
									>
										{linking === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Link"}
									</button>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
