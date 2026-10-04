/**
 * Rules the live console needs, resolved from the match's GameRules.
 *
 * GameRules has no fields for the FIBA half-split timeouts, the technical /
 * unsportsmanlike disqualification counts or team fouls carrying into
 * overtime, so those come from FIBA constants. `timeouts60Second` is
 * deliberately ignored: the console uses the 2 / 3 half split instead.
 */
import type { GameRules } from '@prisma/client';

export interface ConsoleRules {
  label: string;
  periods: number;
  periodMin: number;
  otMin: number;
  halftimePeriod: number;
  timeoutsFirstHalf: number;
  timeoutsSecondHalf: number;
  timeoutsPerOT: number;
  foulsForBonus: number;
  foulsToFoulOut: number;
  techsToDQ: number;
  unsportsToDQ: number;
  teamFoulsCarryIntoOT: boolean;
  trackTurnoverTypes: boolean;
}

export const FIBA = {
  timeoutsFirstHalf: 2,
  timeoutsSecondHalf: 3,
  techsToDQ: 2,
  unsportsToDQ: 2,
  teamFoulsCarryIntoOT: true,
} as const;

type RulesSource = Partial<
  Pick<
    GameRules,
    | 'name'
    | 'numberOfPeriods'
    | 'minutesPerPeriod'
    | 'overtimeLength'
    | 'halftimePeriod'
    | 'timeoutsPerOvertime'
    | 'foulsForBonus'
    | 'foulsToFoulOut'
    | 'trackTurnoverTypes'
  >
>;

export function toConsoleRules(source: RulesSource | null | undefined): ConsoleRules {
  const r = source ?? {};
  return {
    label: r.name ?? 'Default',
    periods: r.numberOfPeriods ?? 4,
    periodMin: r.minutesPerPeriod ?? 10,
    otMin: r.overtimeLength ?? 5,
    halftimePeriod: r.halftimePeriod ?? 2,
    timeoutsFirstHalf: FIBA.timeoutsFirstHalf,
    timeoutsSecondHalf: FIBA.timeoutsSecondHalf,
    timeoutsPerOT: r.timeoutsPerOvertime ?? 1,
    foulsForBonus: r.foulsForBonus ?? 5,
    foulsToFoulOut: r.foulsToFoulOut ?? 5,
    techsToDQ: FIBA.techsToDQ,
    unsportsToDQ: FIBA.unsportsToDQ,
    teamFoulsCarryIntoOT: FIBA.teamFoulsCarryIntoOT,
    trackTurnoverTypes: r.trackTurnoverTypes ?? false,
  };
}

export function periodLabel(period: number, rules: ConsoleRules): string {
  return period <= rules.periods ? `Q${period}` : `OT${period - rules.periods}`;
}

/** Length of a period in seconds. */
export function periodLength(period: number, rules: ConsoleRules): number {
  return (period <= rules.periods ? rules.periodMin : rules.otMin) * 60;
}

/** Timeout allowance for the window the given period sits in. */
export function timeoutWindow(period: number, rules: ConsoleRules) {
  const H = rules.halftimePeriod;
  const N = rules.periods;
  const inWindow = (p: number) =>
    period <= H ? p <= H : period <= N ? p > H && p <= N : p === period;
  const cap =
    period <= H ? rules.timeoutsFirstHalf : period <= N ? rules.timeoutsSecondHalf : rules.timeoutsPerOT;
  const label =
    period <= H
      ? `First half · ${rules.timeoutsFirstHalf} each`
      : period <= N
        ? `Second half · ${rules.timeoutsSecondHalf} each`
        : `${periodLabel(period, rules)} · ${rules.timeoutsPerOT} each`;
  return { cap, inWindow, label };
}

/** 1-based game minute an event falls in, counting regulation then overtime. */
export function gameMinute(period: number, secondsRemaining: number | null, rules: ConsoleRules): number {
  const len = periodLength(period, rules);
  const elapsed = len - (secondsRemaining ?? len);
  const before = Math.min(period - 1, rules.periods) * rules.periodMin + Math.max(0, period - 1 - rules.periods) * rules.otMin;
  return before + Math.floor(elapsed / 60) + 1;
}

export function rulesShort(rules: ConsoleRules): string {
  return `${rules.periods} × ${rules.periodMin}′ · OT ${rules.otMin}′`;
}
