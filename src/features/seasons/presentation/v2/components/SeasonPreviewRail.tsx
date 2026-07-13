import { CalendarDays, Check } from "lucide-react";
import { avatarTint } from "@/lib/avatar";
import type { SeasonStatus } from "@/features/seasons/domain/entities/season";
import type { ChecklistItem } from "@/features/seasons/domain/entities/season-form";
import type { FormLeague } from "../hooks/useSeasonForm";

const STATUS_STYLE: Record<SeasonStatus, { bg: string; fg: string; dot: string }> = {
	Live: { bg: "rgba(228,0,43,0.14)", fg: "#e4002b", dot: "#e4002b" },
	Upcoming: { bg: "rgba(217,131,36,0.16)", fg: "#c9741d", dot: "#d98324" },
	Completed: { bg: "rgba(31,157,85,0.16)", fg: "#1f9d55", dot: "#1f9d55" },
};

interface Props {
	name: string;
	status: SeasonStatus;
	range: string;
	/** The leagues actually ticked, in the order they appear in the picker. */
	linked: FormLeague[];
	checklist: ChecklistItem[];
}

export default function SeasonPreviewRail({ name, status, range, linked, checklist }: Props) {
	const pill = STATUS_STYLE[status];
	const accent = linked.length ? avatarTint(linked[0]!.id) : "#8a817a";

	return (
		<div className="sticky top-0 flex flex-col gap-5">
			{/* live card preview */}
			<div className="rounded-2xl border border-[var(--bord)] bg-[var(--surf)] p-5">
				<div className="mb-3 font-['Space_Mono'] text-[10px] uppercase tracking-[0.14em] text-[var(--txm)]">
					Live preview
				</div>
				<div className="rounded-xl border border-[var(--bord)] bg-[var(--surf2)] p-4">
					<div className="flex items-start gap-3">
						<span
							className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
							style={{ background: `${accent}22`, color: accent }}
						>
							<CalendarDays className="h-5 w-5" />
						</span>
						<div className="min-w-0 flex-1">
							<div className="flex flex-wrap items-center gap-2">
								<h3 className="font-['Anton'] text-[17px] uppercase leading-none text-[var(--tx)]">
									{name.trim() || "Untitled season"}
								</h3>
								<span
									className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-['Space_Mono'] text-[9.5px] font-bold uppercase tracking-[0.06em]"
									style={{ background: pill.bg, color: pill.fg }}
								>
									<span className="h-1.5 w-1.5 rounded-full" style={{ background: pill.dot }} />
									{status}
								</span>
							</div>
							<p className="mt-1 font-['Space_Mono'] text-[11px] text-[var(--txm)]">{range}</p>
						</div>
					</div>

					<div className="mt-3 flex flex-wrap gap-1.5">
						{linked.length === 0 ? (
							<span className="font-['Space_Mono'] text-[11px] text-[var(--faint)]">No leagues linked yet</span>
						) : (
							linked.map((league) => (
								<span
									key={league.id}
									className="inline-flex items-center gap-1.5 rounded-md border border-[var(--bord)] bg-[var(--surf)] px-2 py-1 font-['Space_Mono'] text-[10px] font-bold text-[var(--txd)]"
								>
									<span className="h-1.5 w-1.5 rounded-full" style={{ background: avatarTint(league.id) }} />
									{league.name}
								</span>
							))
						)}
					</div>
				</div>
			</div>

			{/* checklist */}
			<div className="rounded-2xl border border-[var(--bord)] bg-[var(--surf)] p-5">
				<div className="mb-3 font-['Space_Mono'] text-[10px] uppercase tracking-[0.14em] text-[var(--txm)]">
					Before you save
				</div>
				<div className="flex flex-col gap-2.5">
					{checklist.map((item) => (
						<div key={item.label} className="flex items-center gap-2.5">
							<span
								className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full ${
									item.done ? "bg-[#1f9d55] text-white" : "bg-[var(--chip)] text-[var(--txm)]"
								}`}
							>
								{item.done ? <Check className="h-[10px] w-[10px]" strokeWidth={4} /> : null}
							</span>
							<span
								className={`font-['Archivo'] text-[12.5px] ${
									item.done ? "text-[var(--tx)]" : "text-[var(--txm)]"
								}`}
							>
								{item.label}
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
