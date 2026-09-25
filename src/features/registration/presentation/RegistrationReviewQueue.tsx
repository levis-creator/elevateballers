import { useEffect, useState } from 'react';

type Kind = 'PLAYER' | 'TEAM' | 'ROSTER';
const key = (kind: Kind, id: string) => `${kind}:${id}`;
const REQUEST_LABEL: Record<string, string> = {
  NEW: 'Add player',
  EDIT: 'Edit player',
  REMOVAL: 'Remove player',
};

type Queue = {
  players: any[];
  teams: any[];
  rosterProposals: any[];
  duplicates: { key: string; ids: string[] }[];
  page: number;
  total: number;
  totalPages: number;
};

export default function RegistrationReviewQueue() {
  const [queue, setQueue] = useState<Queue>({
    players: [],
    teams: [],
    rosterProposals: [],
    duplicates: [],
    page: 1,
    total: 0,
    totalPages: 1,
  });
  const [kind, setKind] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const load = async (page = 1) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: '25',
      ...(kind && { kind }),
      ...(status && { status }),
      ...(search && { search }),
    });
    const response = await fetch(`/api/registration/review-queue?${params}`);
    if (response.ok) setQueue(await response.json());
  };
  useEffect(() => {
    void load();
  }, [kind, status]);
  const toggle = (kind: Kind, id: string) =>
    setSelected((v) => (v.includes(key(kind, id)) ? v.filter((k) => k !== key(kind, id)) : [...v, key(kind, id)]));
  // Each row carries its own kind, so a mixed "All types" selection reaches the
  // right table instead of being treated as players.
  const review = async (keys: string[], action: 'APPROVE' | 'REJECT') => {
    const byKind = new Map<Kind, string[]>();
    for (const k of keys) {
      const [kind, id] = k.split(':') as [Kind, string];
      byKind.set(kind, [...(byKind.get(kind) ?? []), id]);
    }
    const results = await Promise.all(
      [...byKind].map(([kind, ids]) =>
        fetch('/api/registration/review-queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind, ids, action }),
        })
      )
    );
    const failed = results.find((r) => !r.ok);
    setMessage(
      failed
        ? ((await failed.json().catch(() => ({}))).error ?? 'Some items could not be updated.')
        : `${keys.length} item${keys.length === 1 ? '' : 's'} ${action === 'APPROVE' ? 'approved' : 'rejected'}.`
    );
    setSelected((v) => v.filter((k) => !keys.includes(k)));
    void load(queue.page);
  };
  const bulk = (action: 'APPROVE' | 'REJECT') => selected.length && void review(selected, action);
  const players = queue.players;
  const teams = queue.teams;
  return (
    <section style={{ padding: 24 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <h1 style={{ marginRight: 'auto' }}>Registration review queue</h1>
        <button
          onClick={() =>
            (window.location.href = `/api/registration/review-queue-export?kind=${kind}&status=${status}&search=${encodeURIComponent(search)}`)
          }
        >
          Export CSV
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
        <input
          placeholder="Search name, email, team"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void load(1)}
        />
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="">All types</option>
          <option value="PLAYER">Players</option>
          <option value="TEAM">Teams</option>
          <option value="ROSTER">Coach roster proposals</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <button onClick={() => void load(1)}>Filter</button>
      </div>
      {message && (
        <p role="status" style={{ marginBottom: 12 }}>
          {message}
        </p>
      )}
      {selected.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <strong>{selected.length} selected</strong>
          <button onClick={() => void bulk('APPROVE')}>Approve</button>
          <button onClick={() => void bulk('REJECT')}>Reject</button>
        </div>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th></th>
            <th>Type</th>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Team / proposer</th>
            <th>Request</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={`p-${p.id}`}>
              <td>
                <input
                  type="checkbox"
                  checked={selected.includes(key('PLAYER', p.id))}
                  onChange={() => toggle('PLAYER', p.id)}
                />
              </td>
              <td>Player</td>
              <td>{`${p.firstName || ''} ${p.lastName || ''}`.trim()}</td>
              <td>{p.email || '—'}</td>
              <td>{p.approved ? 'Approved' : 'Pending'}</td>
              <td>{p.team?.name || '—'}</td>
              <td colSpan={2}></td>
            </tr>
          ))}
          {teams.map((t) => (
            <tr key={`t-${t.id}`}>
              <td>
                <input
                  type="checkbox"
                  checked={selected.includes(key('TEAM', t.id))}
                  onChange={() => toggle('TEAM', t.id)}
                />
              </td>
              <td>Team</td>
              <td>{t.name}</td>
              <td>{t.contactEmail || '—'}</td>
              <td>{t.approved ? 'Approved' : 'Pending'}</td>
              <td>{t.name}</td>
              <td colSpan={2}></td>
            </tr>
          ))}
          {queue.rosterProposals.map((row) => (
            <tr key={`r-${row.id}`}>
              <td>
                <input
                  type="checkbox"
                  checked={selected.includes(key('ROSTER', row.id))}
                  onChange={() => toggle('ROSTER', row.id)}
                />
              </td>
              <td>Coach request</td>
              <td>
                {`${row.player?.firstName || ''} ${row.player?.lastName || ''}`.trim() ||
                  'Unnamed player'}
              </td>
              <td>{row.player?.email || '—'}</td>
              <td>{row.status}</td>
              <td>
                {row.team?.name || '—'} ·{' '}
                {row.proposedBy?.name || row.proposedBy?.email || 'Unknown coach'} ·{' '}
                {new Date(row.proposedAt).toLocaleString()}
              </td>
              <td>
                <strong>{REQUEST_LABEL[row.requestType] ?? 'Roster change'}</strong>
                {row.requestType !== 'REMOVAL' && (
                  <div>
                    #{row.jerseyNumber ?? '—'} · {row.position || 'No position'}
                  </div>
                )}
                {row.note && <div>Note: {row.note}</div>}
              </td>
              <td style={{ whiteSpace: 'nowrap' }}>
                {row.requestType === 'REMOVAL' || row.status === 'PENDING' ? (
                  <>
                    <button onClick={() => void review([key('ROSTER', row.id)], 'APPROVE')}>
                      Approve
                    </button>{' '}
                    <button onClick={() => void review([key('ROSTER', row.id)], 'REJECT')}>
                      Reject
                    </button>
                  </>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {queue.duplicates.length > 0 && (
        <aside style={{ marginTop: 16 }}>
          <strong>Possible duplicates:</strong>{' '}
          {queue.duplicates.map((d) => (
            <span key={d.key} style={{ marginLeft: 8 }}>
              {d.key} ({d.ids.length})
            </span>
          ))}
        </aside>
      )}
      <nav style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button disabled={queue.page <= 1} onClick={() => void load(queue.page - 1)}>
          Previous
        </button>
        <span>
          Page {queue.page} of {queue.totalPages}
        </span>
        <button disabled={queue.page >= queue.totalPages} onClick={() => void load(queue.page + 1)}>
          Next
        </button>
      </nav>
    </section>
  );
}
