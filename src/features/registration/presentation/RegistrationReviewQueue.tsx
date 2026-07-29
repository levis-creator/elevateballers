import { useEffect, useState } from 'react';

type Queue = { players: any[]; teams: any[]; duplicates: { key: string; ids: string[] }[]; page: number; total: number; totalPages: number };

export default function RegistrationReviewQueue() {
  const [queue, setQueue] = useState<Queue>({ players: [], teams: [], duplicates: [], page: 1, total: 0, totalPages: 1 });
  const [kind, setKind] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const load = async (page = 1) => { const params = new URLSearchParams({ page: String(page), limit: '25', ...(kind && { kind }), ...(status && { status }), ...(search && { search }) }); const response = await fetch(`/api/registration/review-queue?${params}`); if (response.ok) setQueue(await response.json()); };
  useEffect(() => { void load(); }, [kind, status]);
  const bulk = async (action: 'APPROVE' | 'REJECT') => { if (!selected.length) return; await fetch('/api/registration/review-queue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: kind || 'PLAYER', ids: selected, action }) }); setSelected([]); void load(queue.page); };
  const players = queue.players;
  const teams = queue.teams;
  return <section style={{ padding: 24 }}>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}><h1 style={{ marginRight: 'auto' }}>Registration review queue</h1><button onClick={() => window.location.href = `/api/registration/review-queue-export?kind=${kind}&status=${status}&search=${encodeURIComponent(search)}`}>Export CSV</button></div>
    <div style={{ display: 'flex', gap: 8, margin: '16px 0' }}><input placeholder="Search name, email, team" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && void load(1)} /><select value={kind} onChange={e => setKind(e.target.value)}><option value="">All types</option><option value="PLAYER">Players</option><option value="TEAM">Teams</option></select><select value={status} onChange={e => setStatus(e.target.value)}><option value="PENDING">Pending</option><option value="APPROVED">Approved</option></select><button onClick={() => void load(1)}>Filter</button></div>
    {selected.length > 0 && <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}><strong>{selected.length} selected</strong><button onClick={() => void bulk('APPROVE')}>Approve</button><button onClick={() => void bulk('REJECT')}>Reject</button></div>}
    <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th></th><th>Type</th><th>Name</th><th>Email</th><th>Status</th><th>Team</th></tr></thead><tbody>{players.map(p => <tr key={`p-${p.id}`}><td><input type="checkbox" checked={selected.includes(p.id)} onChange={() => setSelected(v => v.includes(p.id) ? v.filter(id => id !== p.id) : [...v, p.id])} /></td><td>Player</td><td>{`${p.firstName || ''} ${p.lastName || ''}`.trim()}</td><td>{p.email || '—'}</td><td>{p.approved ? 'Approved' : 'Pending'}</td><td>{p.team?.name || '—'}</td></tr>)}{teams.map(t => <tr key={`t-${t.id}`}><td><input type="checkbox" checked={selected.includes(t.id)} onChange={() => setSelected(v => v.includes(t.id) ? v.filter(id => id !== t.id) : [...v, t.id])} /></td><td>Team</td><td>{t.name}</td><td>{t.contactEmail || '—'}</td><td>{t.approved ? 'Approved' : 'Pending'}</td><td>{t.name}</td></tr>)}</tbody></table>
    {queue.duplicates.length > 0 && <aside style={{ marginTop: 16 }}><strong>Possible duplicates:</strong> {queue.duplicates.map(d => <span key={d.key} style={{ marginLeft: 8 }}>{d.key} ({d.ids.length})</span>)}</aside>}
    <nav style={{ display: 'flex', gap: 8, marginTop: 16 }}><button disabled={queue.page <= 1} onClick={() => void load(queue.page - 1)}>Previous</button><span>Page {queue.page} of {queue.totalPages}</span><button disabled={queue.page >= queue.totalPages} onClick={() => void load(queue.page + 1)}>Next</button></nav>
  </section>;
}
