import { ClipboardList } from "lucide-react";
import type { LeagueFormErrors, LeagueFormValues } from "@/features/leagues/domain/entities/league-form";
import CardHeader from "./CardHeader";

interface Props {
	values: LeagueFormValues;
	errors: LeagueFormErrors;
	touched: boolean;
	set: <K extends keyof LeagueFormValues>(key: K, value: LeagueFormValues[K]) => void;
}

export default function LeagueRegistrationCard({ values, errors, touched, set }: Props) {
	const on = values.registrationOpen;

	return (
		<div className="mb-5 overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)]">
			<CardHeader icon={ClipboardList} title="Registration" subtitle="Control who can sign up and when" />

			<div className="p-6">
				{/* master toggle */}
				<div className="mb-5 flex items-center gap-3.5 rounded-xl border border-[var(--bord)] bg-[var(--surf2)] px-4 py-3.5">
					<button
						type="button"
						role="switch"
						aria-checked={on}
						aria-label="Toggle registration"
						onClick={() => set("registrationOpen", !on)}
						className={`relative h-[26px] w-[46px] flex-shrink-0 rounded-full transition-colors ${
							on ? "bg-[var(--brand)]" : "bg-[var(--chip)]"
						}`}
					>
						<span
							className="absolute top-[3px] h-[20px] w-[20px] rounded-full bg-white transition-all"
							style={{ left: on ? 23 : 3 }}
						/>
					</button>

					<div className="min-w-0 flex-1">
						<div className="font-['Archivo'] text-[13.5px] font-bold text-[var(--tx)]">
							{on ? "Registration is open" : "Registration is closed"}
						</div>
						<div className="font-['Space_Mono'] text-[11px] text-[var(--txm)]">
							Master switch. When closed, registration is blocked regardless of the dates below.
						</div>
					</div>

					<span
						className="flex-shrink-0 rounded-md px-2.5 py-1 font-['Space_Mono'] text-[10px] font-bold uppercase tracking-[0.06em]"
						style={
							on
								? { background: "rgba(31,157,85,0.16)", color: "#1f9d55" }
								: { background: "var(--chip)", color: "var(--txm)" }
						}
					>
						{on ? "Open" : "Closed"}
					</span>
				</div>

				{/* window */}
				<div
					className="grid grid-cols-2 gap-5 max-[600px]:grid-cols-1"
					style={on ? undefined : { opacity: 0.5, pointerEvents: "none" }}
				>
					<div>
						<label className="eb-lb" htmlFor="reg-opens">
							Opens At
						</label>
						<input
							id="reg-opens"
							className="eb-in"
							type="datetime-local"
							disabled={!on}
							value={values.registrationOpensAt}
							onChange={(e) => set("registrationOpensAt", e.target.value)}
						/>
						<p className="mt-1.5 font-['Space_Mono'] text-[10.5px] text-[var(--txm)]">
							Optional. Leave empty for no start limit.
						</p>
					</div>

					<div>
						<label className="eb-lb" htmlFor="reg-closes">
							Deadline (Closes At)
						</label>
						<input
							id="reg-closes"
							className="eb-in"
							type="datetime-local"
							disabled={!on}
							value={values.registrationClosesAt}
							onChange={(e) => set("registrationClosesAt", e.target.value)}
						/>
						{touched && errors.registrationClosesAt ? (
							<p className="mt-1.5 font-['Space_Mono'] text-[10.5px] text-[var(--brandsoft)]">
								{errors.registrationClosesAt}
							</p>
						) : (
							<p className="mt-1.5 font-['Space_Mono'] text-[10.5px] text-[var(--txm)]">
								Optional. Leave empty for no deadline.
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
