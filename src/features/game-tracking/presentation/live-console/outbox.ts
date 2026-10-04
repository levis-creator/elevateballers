/**
 * Live console outbox.
 *
 * Every write the scorer makes (events, undo/restore, clock, possession,
 * period, timeouts, substitutions) is saved to IndexedDB first, then sent by one sender, one
 * item at a time in tap order. An item is deleted only once the server
 * confirms it, so nothing tapped is lost to a dropped connection, a sleeping
 * tablet or a reload. The screen never waits on any of this.
 *
 * - Network errors, timeouts, 408/429 and 5xx are retried with backoff.
 *   Retries are safe: events, timeouts and substitution batches carry an
 *   idempotency key the database holds unique per match.
 * - Other 4xx (e.g. a completed match) are dropped and reported.
 * - Consecutive state writes (clock value, possession, period) are merged,
 *   so only the latest value is sent.
 */
import { offlineStore, type OutboxItem } from '../../lib/offlineStore';

export type OutboxStatus = 'idle' | 'sending' | 'slow' | 'retrying' | 'offline';

export interface OutboxSnapshot {
  items: OutboxItem[];
  status: OutboxStatus;
}

interface Handlers {
  /** An item was confirmed; `data` is the parsed response body. */
  onSaved: (item: OutboxItem, data: unknown) => void;
  /** The server refused an item; it has been dropped. */
  onRejected: (item: OutboxItem, message: string) => void;
  onChange: (snapshot: OutboxSnapshot) => void;
  /** Server id for a client event id that was saved before this session. */
  resolveId: (cid: string) => string | null;
}

const REQUEST_TIMEOUT_MS = 10_000;
const SLOW_AFTER_MS = 2_500;
const MAX_SERVER_ERRORS = 8;

type Pending = OutboxItem & { _saved?: Promise<number | undefined> };

export class LiveOutbox {
  private items: Pending[] = [];
  private status: OutboxStatus = 'idle';
  private sending = false;
  private disposed = false;
  private retryTimer: ReturnType<typeof setTimeout> | undefined;
  private slowTimer: ReturnType<typeof setTimeout> | undefined;
  private cidToId = new Map<string, string>();
  private drainWaiters: Array<() => void> = [];

  constructor(private matchId: string, private h: Handlers) {
    window.addEventListener('online', this.kick);
    document.addEventListener('visibilitychange', this.kick);
  }

  dispose() {
    this.disposed = true;
    window.removeEventListener('online', this.kick);
    document.removeEventListener('visibilitychange', this.kick);
    clearTimeout(this.retryTimer);
    clearTimeout(this.slowTimer);
  }

  /** Load anything left from an earlier session, including the old event queue. */
  async load() {
    try {
      const saved = await offlineStore.outbox.where('matchId').equals(this.matchId).sortBy('createdAt');
      const legacy = await offlineStore.pendingEvents.where('matchId').equals(this.matchId).sortBy('createdAt');
      const legacySubs = await offlineStore.pendingSubBatches.where('matchId').equals(this.matchId).sortBy('createdAt');
      for (const b of legacySubs) {
        const item: OutboxItem = {
          matchId: b.matchId,
          kind: 'subs',
          url: `/api/games/${b.matchId}/substitutions`,
          method: 'POST',
          body: { teamId: b.teamId, period: b.period, secondsRemaining: b.secondsRemaining, pairs: b.pairs, clientBatchId: b.clientBatchId },
          tappedAt: b.createdAt,
          attempts: 0,
          createdAt: b.createdAt,
        };
        item.id = await offlineStore.outbox.add(item);
        if (b.id !== undefined) await offlineStore.pendingSubBatches.delete(b.id);
        saved.push(item);
      }
      for (const ev of legacy) {
        const { id: legacyId, createdAt, matchId, ...body } = ev;
        const item: OutboxItem = {
          matchId,
          kind: 'event',
          url: `/api/matches/${matchId}/events`,
          method: 'POST',
          body,
          cid: (body.metadata?.cid as string | undefined) ?? null,
          tappedAt: createdAt,
          attempts: 0,
          createdAt,
        };
        item.id = await offlineStore.outbox.add(item);
        if (legacyId !== undefined) await offlineStore.pendingEvents.delete(legacyId);
        saved.push(item);
      }
      this.items = [...saved, ...this.items].sort((a, b) => a.createdAt - b.createdAt);
    } catch {
      /* IndexedDB unavailable (private mode) — keep working in memory */
    }
    this.emit();
    this.kick();
  }

  add(input: Omit<OutboxItem, 'matchId' | 'attempts' | 'createdAt' | 'tappedAt'> & { tappedAt?: number }) {
    const now = Date.now();
    const last = this.items[this.items.length - 1];
    // Merge consecutive state writes that haven't been sent yet.
    if (input.kind === 'state' && last && last.kind === 'state' && !(this.sending && last === this.items[0])) {
      last.body = { ...last.body, ...input.body };
      last.tappedAt = now;
      this.persist(last);
      this.emit();
      return;
    }
    const item: Pending = { ...input, matchId: this.matchId, tappedAt: input.tappedAt ?? now, attempts: 0, createdAt: now };
    item._saved = offlineStore.outbox
      .add(strip(item))
      .then((id) => {
        item.id = id;
        return id;
      })
      .catch(() => undefined);
    this.items.push(item);
    this.emit();
    this.kick();
  }

  count() {
    return this.items.length;
  }

  /** Resolves when the outbox is empty, or after `timeoutMs`. */
  drain(timeoutMs: number): Promise<number> {
    if (!this.items.length) return Promise.resolve(0);
    this.kick();
    return new Promise((resolve) => {
      const done = () => {
        clearTimeout(t);
        resolve(this.items.length);
      };
      const t = setTimeout(() => {
        this.drainWaiters = this.drainWaiters.filter((w) => w !== done);
        resolve(this.items.length);
      }, timeoutMs);
      this.drainWaiters.push(done);
    });
  }

  kick = () => {
    if (this.disposed || this.sending || !this.items.length) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setStatus('offline');
      return;
    }
    clearTimeout(this.retryTimer);
    void this.run();
  };

  private async run() {
    this.sending = true;
    try {
      while (!this.disposed && this.items.length) {
        if (!navigator.onLine) {
          this.setStatus('offline');
          return;
        }
        const item = this.items[0];
        const url = this.urlFor(item);
        if (!url) {
          // A patch for an event that was never saved — nothing to change.
          await this.remove(item);
          continue;
        }
        this.setStatus(this.status === 'retrying' ? 'retrying' : 'sending');
        clearTimeout(this.slowTimer);
        this.slowTimer = setTimeout(() => this.setStatus('slow'), SLOW_AFTER_MS);

        const body = item.kind === 'clock' ? { ...item.body, delayMs: Date.now() - item.tappedAt } : item.body;
        let res: Response | null = null;
        try {
          const ctrl = new AbortController();
          const abort = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
          res = await fetch(url, {
            method: item.method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: ctrl.signal,
          });
          clearTimeout(abort);
        } catch {
          res = null;
        }
        clearTimeout(this.slowTimer);

        if (res?.ok) {
          const data = await res.json().catch(() => null);
          if (item.cid && data && typeof data === 'object' && 'id' in data) {
            const id = String((data as { id: unknown }).id);
            this.cidToId.set(item.cid, id);
            for (const other of this.items) {
              if (other.refCid === item.cid && !other.refId) {
                other.refId = id;
                this.persist(other);
              }
            }
          }
          await this.remove(item, () => this.h.onSaved(item, data));
          this.setStatus(this.items.length ? 'sending' : 'idle');
          continue;
        }

        const status = res?.status ?? 0;
        const retryable = !res || status === 408 || status === 429 || status >= 500;
        if (!retryable) {
          const data = await res!.json().catch(() => null);
          await this.remove(item, () => this.h.onRejected(item, data?.error || `Rejected by the server (${status})`));
          continue;
        }
        item.attempts += 1;
        if (res && item.attempts >= MAX_SERVER_ERRORS) {
          const data = await res.json().catch(() => null);
          await this.remove(item, () => this.h.onRejected(item, data?.error || 'The server kept failing to save this'));
          continue;
        }
        this.persist(item);
        this.setStatus(navigator.onLine ? 'retrying' : 'offline');
        const wait = Math.min(15_000, 1000 * 2 ** Math.min(item.attempts - 1, 4));
        this.retryTimer = setTimeout(this.kick, wait);
        return;
      }
    } finally {
      this.sending = false;
      if (!this.items.length) {
        this.setStatus('idle');
        const waiters = this.drainWaiters;
        this.drainWaiters = [];
        waiters.forEach((w) => w());
      }
    }
  }

  private urlFor(item: OutboxItem): string | null {
    if (item.kind !== 'patch') return item.url;
    const id = item.refId ?? (item.refCid ? this.cidToId.get(item.refCid) ?? this.h.resolveId(item.refCid) : null);
    // Items run in order, so an unresolved target was dropped by the server:
    // the patch has nothing to change.
    return id ? item.url.replace(':id', id) : null;
  }

  private async remove(item: Pending, after?: () => void) {
    this.items = this.items.filter((x) => x !== item);
    // Notify before emitting so the saved event replaces its pending copy in
    // the same render.
    after?.();
    this.emit();
    const id = item.id ?? (await item._saved);
    if (id !== undefined) await offlineStore.outbox.delete(id).catch(() => undefined);
  }

  private persist(item: Pending) {
    void (async () => {
      const id = item.id ?? (await item._saved);
      if (id !== undefined) await offlineStore.outbox.put({ ...strip(item), id }).catch(() => undefined);
    })();
  }

  private setStatus(s: OutboxStatus) {
    if (this.status === s) return;
    this.status = s;
    this.emit();
  }

  private emit() {
    if (!this.disposed) this.h.onChange({ items: this.items.map(strip), status: this.status });
  }
}

function strip(item: Pending): OutboxItem {
  const { _saved, ...rest } = item;
  void _saved;
  return rest;
}
