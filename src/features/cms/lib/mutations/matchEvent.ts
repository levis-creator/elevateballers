import type { CreateMatchEventInput } from '../../types';
import { createMatchEvent } from '../../data/datasources/mutations/matchEvent';

export { createMatchEvent, updateMatchEvent, deleteMatchEvent } from '../../data/datasources/mutations/matchEvent';

/** CSV import: creates events one by one through the same path as the console. */
export async function bulkCreateMatchEvents(
  matchId: string,
  events: Omit<CreateMatchEventInput, 'matchId'>[]
): Promise<{ created: number; errors: { row: number; message: string }[] }> {
  const errors: { row: number; message: string }[] = [];
  let created = 0;

  for (let i = 0; i < events.length; i++) {
    try {
      const result = await createMatchEvent({ ...events[i], matchId });
      if (result) {
        created++;
      } else {
        errors.push({ row: i + 1, message: 'Failed to create event' });
      }
    } catch (err: any) {
      errors.push({ row: i + 1, message: err?.message ?? 'Unknown error' });
    }
  }

  return { created, errors };
}
