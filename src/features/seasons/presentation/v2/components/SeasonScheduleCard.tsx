import { CalendarDays } from "lucide-react";
import type { SeasonStatus } from "@/features/seasons/domain/entities/season";
import {
	type SeasonFormErrors,
	type SeasonFormValues,
	BRACKET_TYPES,
} from "@/features/seasons/domain/entities/season-form";
import FormCard, { FieldError, Label } from "./FormCard";

const STATUS_STYLE: Record<SeasonStatus, { bg: string; fg: string; dot: string }> = {
	Live: { bg: "rgba(228,0,43,0.14)", fg: "#e4002b", dot: "#e4002b" },
	Upcoming: { bg: "rgba(217,131,36,0.16)", fg: "#c9741d", dot: "#d98324" },
	Completed: { bg: "rgba(31,157,85,0.16)", fg: "#1f9d55", dot: "#1f9d55" },
};

const INPUT =
	"w-full rounded-lg border bg-[var(--surf2)] px-3.5 py-2.5 font-['Archivo'] text-[13.5px] text-[var(--tx)] outline-none focus:border-[var(--brand)]";

interface Props {
	values: SeasonFormValues;
	errors: SeasonFormErrors;
	touched: boolean;
	/** The status the season will actually read as, given its dates and `active`. */
	status: SeasonStatus;
	/** True when the dates alone settle the status (the season has not started). */
	statusLocked: boolean;
	set: <K extends keyof SeasonFormValues>(key: K, value: SeasonFormValues[K]) => void;
}

export default function SeasonScheduleCard({ values, errors, touched, status, statusLocked, set }: Props) {
	const pill = STATUS_STYLE[status];

	return (
		<FormCard icon={CalendarDays} title="Schedule & Format" subtitle="Status, dates and bracket">
			<Label>Status</Label>
			<div className="mb-2 inline-flex flex-wrap gap-1.5 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] p-1">
				{([true, false] as const).map((active) => {
					const on = values.active === active;
					return (
						<button
							key={String(active)}
							type="button"
							aria-pressed={on}
							onClick={() => set("active", active)}
							className={`rounded-[7px] px-3.5 py-1.5 font-['Archivo'] text-[12px] font-bold uppercase tracking-[0.02em] ${
								on ? "bg-[var(--brand)] text-white" : "bg-transparent text-[var(--txm)] hover:text-[var(--txd)]"
							}`}
						>
							{active ? "Live" : "Completed"}
						</button>
					);
				})}
			</div>

			{/* There is no status column: the dates decide the lifecycle and `active`
			    is the override. Show what the season will really read as, so this
			    form and the seasons board can never seem to disagree. */}
			<p className="mb-4 flex flex-wrap items-center gap-2 font-['Archivo'] text-[11.5px] text-[var(--txm)]">
				Will show as
				<span
					className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-['Space_Mono'] text-[9.5px] font-bold uppercase tracking-[0.06em]"
					style={{ background: pill.bg, color: pill.fg }}
				>
					<span className="h-1.5 w-1.5 rounded-full" style={{ background: pill.dot }} />
					{status}
				</span>
				{statusLocked && <span>— its start date is in the future.</span>}
			</p>

			<div className="mb-4 grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
				<div>
					<Label required>Start Date</Label>
					<input
						type="date"
						value={values.startDate}
						onChange={(e) => set("startDate", e.target.value)}
						className={`${INPUT} ${touched && errors.startDate ? "border-[var(--brand)]" : "border-[var(--bord)]"}`}
					/>
					<FieldError message={touched ? errors.startDate : undefined} />
				</div>
				<div>
					<Label required>End Date</Label>
					<input
						type="date"
						value={values.endDate}
						onChange={(e) => set("endDate", e.target.value)}
						className={`${INPUT} ${touched && errors.endDate ? "border-[var(--brand)]" : "border-[var(--bord)]"}`}
					/>
					<FieldError message={touched ? errors.endDate : undefined} />
				</div>
			</div>

			<Label>Tournament Bracket Type</Label>
			<select
				value={values.bracketType}
				onChange={(e) => set("bracketType", e.target.value)}
				className={`${INPUT} cursor-pointer appearance-none border-[var(--bord)] py-3 pr-10`}
			>
				{BRACKET_TYPES.map((bracket) => (
					<option key={bracket.value} value={bracket.value}>
						{bracket.label}
					</option>
				))}
			</select>
			<p className="mt-2 font-['Archivo'] text-[11.5px] leading-[1.5] text-[var(--txm)]">
				Default bracket when generating tournaments for this season. You can override it later.
			</p>
		</FormCard>
	);
}
