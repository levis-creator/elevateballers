/**
 * Timezone-aware conversion between a `<input type="datetime-local">` value and
 * a UTC ISO string, anchored to the league's match timezone. Pure — shared by
 * the match form(s) so the create/edit round-trip can't drift.
 */
import { MATCH_TIMEZONE } from './utils';

function tzOffsetMinutes(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');
  const asUTC = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return (asUTC - date.getTime()) / 60000;
}

/** Interpret a `YYYY-MM-DDThh:mm` local input (in `timeZone`) as a UTC ISO string. */
export function parseLocalDateTimeToUTC(dateTimeLocal: string, timeZone: string = MATCH_TIMEZONE): string {
  const [datePart, timePart = '00:00'] = dateTimeLocal.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  const utcBaseMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offset = tzOffsetMinutes(new Date(utcBaseMs), timeZone);
  return new Date(utcBaseMs - offset * 60000).toISOString();
}

/** Render a UTC date as a `YYYY-MM-DDThh:mm` value for a datetime-local input. */
export function formatUTCToLocalInput(value: Date | string, timeZone: string = MATCH_TIMEZONE): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const parts = dtf.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}
