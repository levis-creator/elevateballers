import { useCallback, useEffect, useState, type FormEvent } from 'react';

type Entry = {
  id: string;
  type: 'SUSPENSION' | 'INJURY';
  reason: string | null;
  label: string;
  teamName: string | null;
  matchCount: number | null;
  automatic: boolean;
  createdAt: string;
  resolvedAt: string | null;
  active: boolean;
};

const inputStyle = {
  width: '100%',
  padding: '7px 9px',
  border: '1px solid var(--bord)',
  borderRadius: 6,
  background: 'var(--surf2)',
  color: 'var(--pd-txd)',
  font: '12px Archivo',
} as const;

/** Admin card on the player page: current suspensions and injuries, plus controls to add or end them. */
export default function PlayerAvailabilityCard({ playerId }: { playerId: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [type, setType] = useState<'SUSPENSION' | 'INJURY'>('SUSPENSION');
  const [matchCount, setMatchCount] = useState('1');
  const [reason, setReason] = useState('');

  const load = useCallback(() => {
    fetch(`/api/players/${playerId}/availability`, { cache: 'no-store' })
      .then((response) => response.json())
      .then((value) => (Array.isArray(value) ? setEntries(value) : setError(value?.error || 'Unable to load.')))
      .catch(() => setError('Unable to load suspensions and injuries.'));
  }, [playerId]);
  useEffect(load, [load]);

  const send = async (method: 'POST' | 'PATCH', body: unknown) => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/players/${playerId}/availability`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const value = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(value.error || 'Unable to save.');
      load();
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const body =
      type === 'SUSPENSION'
        ? { type, matchCount: Number(matchCount), reason: reason.trim() || undefined }
        : { type, reason: reason.trim() || undefined };
    if (await send('POST', body)) setReason('');
  };

  const active = entries.filter((entry) => entry.active);
  const past = entries.filter((entry) => !entry.active).slice(0, 5);

  return (
    <section className="eb-pd-card eb-pd-rail-card">
      <div className="eb-pd-eyebrow">Suspensions &amp; injuries</div>
      {active.length === 0 && (
        <div className="eb-pd-record">
          <span>Status</span>
          <strong>Available</strong>
        </div>
      )}
      {active.map((entry) => (
        <div key={entry.id} className="eb-pd-record" style={{ alignItems: 'center' }}>
          <span>
            <strong style={{ color: 'var(--pd-brandsoft)' }}>{entry.label}</strong>
            {entry.reason && <><br />{entry.reason}</>}
            {entry.automatic && <><br /><small>Automatic after ejection</small></>}
          </span>
          <button
            className="eb-pd-small-button"
            disabled={busy}
            onClick={() => {
              const what = entry.type === 'SUSPENSION' ? 'Lift this suspension early?' : 'Mark this player fit?';
              if (window.confirm(what)) void send('PATCH', { id: entry.id });
            }}
          >
            {entry.type === 'SUSPENSION' ? 'Lift' : 'Mark fit'}
          </button>
        </div>
      ))}
      <form onSubmit={submit} style={{ display: 'grid', gap: 8, marginTop: 16 }}>
        <select value={type} onChange={(event) => setType(event.target.value as typeof type)} style={inputStyle}>
          <option value="SUSPENSION">Suspend</option>
          <option value="INJURY">Mark injured</option>
        </select>
        {type === 'SUSPENSION' && (
          <label style={{ display: 'grid', gap: 4, color: 'var(--pd-txm)', fontSize: 11 }}>
            Team matches
            <input
              type="number"
              min={1}
              max={50}
              required
              value={matchCount}
              onChange={(event) => setMatchCount(event.target.value)}
              style={inputStyle}
            />
          </label>
        )}
        <input
          placeholder="Reason (shown publicly)"
          maxLength={500}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          style={inputStyle}
        />
        <button className="eb-pd-small-button" disabled={busy} type="submit">
          {type === 'SUSPENSION' ? 'Suspend player' : 'Mark injured'}
        </button>
      </form>
      {error && <div className="eb-pd-record" style={{ color: 'var(--pd-brandsoft)' }}>{error}</div>}
      {past.length > 0 && (
        <>
          <div className="eb-pd-eyebrow" style={{ marginTop: 18 }}>History</div>
          {past.map((entry) => (
            <div key={entry.id} className="eb-pd-record">
              <span>
                {entry.type === 'SUSPENSION' ? `Suspended ${entry.matchCount ?? ''}` : 'Injured'}
                {entry.reason ? ` · ${entry.reason}` : ''}
              </span>
              <strong>{new Date(entry.createdAt).toLocaleDateString()}</strong>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
