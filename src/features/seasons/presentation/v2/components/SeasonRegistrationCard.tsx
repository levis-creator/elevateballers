import { Clock } from "lucide-react";
import type { SeasonFormErrors, SeasonFormValues } from "@/features/seasons/domain/entities/season-form";
import FormCard, { FieldError, Label } from "./FormCard";

const INPUT =
	"w-full rounded-lg border bg-[var(--surf2)] px-3.5 py-2.5 font-['Archivo'] text-[13px] text-[var(--tx)] outline-none focus:border-[var(--brand)]";

interface Props {
	values: SeasonFormValues;
	errors: SeasonFormErrors;
	touched: boolean;
	set: <K extends keyof SeasonFormValues>(key: K, value: SeasonFormValues[K]) => void;
}

export default function SeasonRegistrationCard({ values, errors, touched, set }: Props) {
	const on = values.hasRegistrationWindow;

	const toggle = (
		<button
			type="button"
			role="switch"
			aria-checked={on}
			aria-label="Enable a season registration window"
			onClick={() => set("hasRegistrationWindow", !on)}
			className={`flex h-[26px] w-[46px] flex-shrink-0 items-center rounded-full border p-[3px] ${
				on ? "justify-end border-[var(--brand)] bg-[var(--brand)]" : "justify-start border-[var(--bord)] bg-[var(--surf2)]"
			}`}
		>
			<span className={`block h-[18px] w-[18px] rounded-full ${on ? "bg-white" : "bg-[var(--txm)]"}`} />
		</button>
	);

	return (
		<FormCard
			icon={Clock}
			title="Registration Window"
			subtitle="Optional · narrows the league window"
			action={toggle}
		>
			{on ? (
				<>
					<div className="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
						<div>
							<Label>Opens At</Label>
							<input
								type="datetime-local"
								value={values.registrationOpensAt}
								onChange={(e) => set("registrationOpensAt", e.target.value)}
								className={`${INPUT} border-[var(--bord)]`}
							/>
						</div>
						<div>
							<Label>Deadline</Label>
							<input
								type="datetime-local"
								value={values.registrationClosesAt}
								onChange={(e) => set("registrationClosesAt", e.target.value)}
								className={`${INPUT} ${
									touched && errors.registrationClosesAt ? "border-[var(--brand)]" : "border-[var(--bord)]"
								}`}
							/>
							<FieldError message={touched ? errors.registrationClosesAt : undefined} />
						</div>
					</div>
					<p className="mt-3 font-['Archivo'] text-[11.5px] leading-[1.5] text-[var(--txm)]">
						Registration must be open at both the league and the season level. Leave this off to use only the
						league's window.
					</p>
				</>
			) : (
				<p className="font-['Archivo'] text-[12.5px] text-[var(--txm)]">
					Using the league's registration window. Toggle on to set season-specific dates.
				</p>
			)}
		</FormCard>
	);
}
