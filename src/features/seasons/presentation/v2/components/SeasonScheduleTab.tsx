import { CalendarDays } from "lucide-react";
import {
	type FixtureResult,
	type SeasonFixture,
	fixtureDay,
	fixtureResult,
	fixtureScore,
} from "@/features/seasons/domain/entities/season-detail";

const TAG_COLOR: Record<FixtureResult, string> = {
	Final: "var(--txm)",
	Live: "#e4002b",
	Upcoming: "#c9741d",
};

export default function SeasonScheduleTab({ fixtures, seasonId }: { fixtures: SeasonFixture[]; seasonId: string }) {
	if (fixtures.length === 0) {
		return (
			<div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--bord)] bg-[var(--surf)] px-6 py-16 text-center">
				<span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surf2)] text-[var(--brand)]">
					<CalendarDays className="h-[22px] w-[22px]" />
				</span>
				<div className="font-['Anton'] text-[20px] uppercase text-[var(--tx)]">No fixtures yet</div>
				<p className="max-w-[320px] font-['Archivo'] text-[13px] text-[var(--txm)]">
					Add a fixture to start building this season's schedule.
				</p>
			</div>
		);
	}

	return (
		<div className="overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)]">
			<div className="flex items-center justify-between border-b border-[var(--bord2)] px-5 py-4">
				<h2 className="font-['Anton'] text-[18px] uppercase tracking-[0.01em] text-[var(--tx)]">
					Fixtures &amp; Results
				</h2>
				<a
					href={`/admin/seasons/${seasonId}/matches`}
					className="font-['Space_Mono'] text-[11px] text-[var(--brandsoft)] no-underline hover:text-[var(--brand)]"
				>
					Full schedule →
				</a>
			</div>

			<div className="flex flex-col">
				{fixtures.map((fixture) => {
					const result = fixtureResult(fixture);
					const isPlayed = result !== "Upcoming";

					return (
						<a
							key={fixture.id}
							href={`/admin/matches/${fixture.id}`}
							className="flex items-center gap-4 border-b border-[var(--bord2)] px-5 py-3.5 no-underline last:border-b-0 hover:bg-[var(--hov)] max-[600px]:gap-2.5"
						>
							<span className="w-[70px] flex-shrink-0 font-['Space_Mono'] text-[11px] uppercase tracking-[0.04em] text-[var(--txm)] max-[600px]:w-[54px]">
								{fixtureDay(fixture)}
							</span>
							<span className="flex-1 truncate text-right font-['Archivo'] text-[13.5px] font-bold text-[var(--tx)]">
								{fixture.team1}
							</span>
							<span
								className="flex-shrink-0 rounded-md px-2.5 py-1 font-['Space_Mono'] text-[12px] font-bold"
								style={
									isPlayed
										? { background: "var(--chip)", color: "var(--tx)" }
										: { background: "rgba(228,0,43,0.14)", color: "#e4002b" }
								}
							>
								{fixtureScore(fixture)}
							</span>
							<span className="flex-1 truncate font-['Archivo'] text-[13.5px] font-bold text-[var(--tx)]">
								{fixture.team2}
							</span>
							<span
								className="w-[84px] flex-shrink-0 text-right font-['Space_Mono'] text-[10.5px] uppercase tracking-[0.04em]"
								style={{ color: TAG_COLOR[result] }}
							>
								{result}
							</span>
						</a>
					);
				})}
			</div>
		</div>
	);
}
