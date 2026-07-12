import { CalendarDays } from "lucide-react";

/**
 * Stands in for the Seasons table while creating a league. A season must attach
 * to a league that already exists, so there is nothing actionable to show yet —
 * this says so rather than rendering an empty, un-usable table.
 */
export default function SeasonsPlaceholderCard() {
	return (
		<div className="flex flex-col items-center gap-2.5 rounded-2xl border border-dashed border-[var(--bord)] bg-[var(--surf)] px-6 py-12 text-center">
			<span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surf2)] text-[var(--brand)]">
				<CalendarDays className="h-[22px] w-[22px]" />
			</span>
			<div className="font-['Anton'] text-[18px] uppercase text-[var(--tx)]">Seasons come next</div>
			<p className="max-w-[360px] font-['Archivo'] text-[13px] text-[var(--txm)]">
				Create the league first — then you'll be able to add seasons, set date ranges, and schedule matches from its
				edit page.
			</p>
		</div>
	);
}
