import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, CheckCircle2, CircleAlert, Edit3, Eye, History, Image as ImageIcon, Search, Trash2 } from 'lucide-react';
import type { PlayerOfTheWeekWithPlayer } from '../../domain/entities';
import type { PotwCandidate } from '../../data/datasources/editorial-queries';
import type { PotwSlot } from '../../lib/potw-slots';
import { potwSlotKey } from '../../lib/potw-slots';
import ImageUpload from '@/components/ImageUpload';
import { MediaLibraryPicker } from '../components/MediaLibraryPicker';
import './potw-v2.css';
import './potw-action-shot.css';

type SlotsResponse = { slots: PotwSlot[]; currentSlotKeys: string[]; active: PlayerOfTheWeekWithPlayer[] };

const keyOf = (item: Pick<PlayerOfTheWeekWithPlayer, 'leagueSeasonId' | 'conferenceId'>) =>
  item.leagueSeasonId ? potwSlotKey(item.leagueSeasonId, item.conferenceId) : null;

/** "Clutch · EBL" for a conference award, the league code for a league-wide one, "Overall" for pre-slot awards. */
const slotLabelOf = (item: PlayerOfTheWeekWithPlayer, slots: PotwSlot[]) => {
  const slot = slots.find((entry) => entry.key === keyOf(item));
  if (slot) return slot.label;
  if (item.conference) return item.conference.name;
  if (item.leagueSeason) return item.leagueSeason.league.name;
  return 'Overall';
};

export default function POTWManagerV2() {
  const [slots, setSlots] = useState<PotwSlot[]>([]);
  const [active, setActive] = useState<PlayerOfTheWeekWithPlayer[]>([]);
  const [history, setHistory] = useState<PlayerOfTheWeekWithPlayer[]>([]);
  const [candidates, setCandidates] = useState<PotwCandidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [seasonId, setSeasonId] = useState('');
  const [slotKey, setSlotKey] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [description, setDescription] = useState('');
  const [customImage, setCustomImage] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<PlayerOfTheWeekWithPlayer | null>(null);
  const [filter, setFilter] = useState<'All' | 'This slot'>('All');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [notifySubscribers, setNotifySubscribers] = useState(false);
  const formRef = useRef<HTMLElement>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [slotsRes, historyRes] = await Promise.all([
        fetch('/api/highlights/potw?slots=true'), fetch('/api/highlights/potw?history=true'),
      ]);
      if (!slotsRes.ok || !historyRes.ok) throw new Error('Failed to load Player of the Week data');
      const slotData: SlotsResponse = await slotsRes.json();
      setSlots(slotData.slots); setActive(slotData.active); setHistory(await historyRes.json());
      // Open on the first current slot that still needs a pick, else the first current slot.
      if (!slotKey) {
        const current = slotData.slots.filter((slot) => slotData.currentSlotKeys.includes(slot.key));
        const filled = new Set(slotData.active.map(keyOf));
        const first = current.find((slot) => !filled.has(slot.key)) ?? current[0] ?? slotData.slots[0];
        if (first) { setSeasonId(first.seasonId); setSlotKey(first.key); }
      }
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void fetchData(); }, []);

  const seasons = useMemo(() => {
    const seen = new Map<string, string>();
    for (const slot of slots) if (!seen.has(slot.seasonId)) seen.set(slot.seasonId, slot.seasonLabel);
    return [...seen].map(([id, name]) => ({ id, name }));
  }, [slots]);
  const seasonSlots = slots.filter((slot) => slot.seasonId === seasonId);
  const slot = slots.find((entry) => entry.key === slotKey) ?? null;
  const slotPick = active.find((item) => keyOf(item) === slotKey) ?? null;
  const filledKeys = useMemo(() => new Set(active.map(keyOf)), [active]);
  const multiLeague = new Set(seasonSlots.map((entry) => entry.leagueId)).size > 1;
  const slotTitle = (entry: PotwSlot) => entry.conferenceId && multiLeague ? `${entry.label} · ${entry.leagueLabel}` : entry.label;

  useEffect(() => {
    if (!slot) { setCandidates([]); return; }
    let cancelled = false;
    setCandidatesLoading(true);
    const params = new URLSearchParams({ candidates: 'true', leagueSeasonId: slot.leagueSeasonId });
    if (slot.conferenceId) params.set('conferenceId', slot.conferenceId);
    fetch(`/api/highlights/potw?${params}`)
      .then((response) => response.ok ? response.json() : [])
      .then((data: PotwCandidate[]) => { if (!cancelled) setCandidates(data); })
      .catch(() => { if (!cancelled) setCandidates([]); })
      .finally(() => { if (!cancelled) setCandidatesLoading(false); });
    return () => { cancelled = true; };
  }, [slotKey, slots]);

  const resetForm = () => { setEditing(null); setSelectedPlayerId(''); setDescription(''); setCustomImage(''); setSearch(''); };
  const chooseSlot = (key: string) => { setSlotKey(key); resetForm(); setError(''); setSuccess(''); };
  const chooseSeason = (id: string) => { setSeasonId(id); const first = slots.find((entry) => entry.seasonId === id); chooseSlot(first?.key ?? ''); };

  const selectedCandidate = candidates.find((player) => player.id === selectedPlayerId);
  // An award being edited may predate the current roster — fall back to its own player.
  const selectedPlayer = selectedCandidate
    ? { name: `${selectedCandidate.firstName ?? ''} ${selectedCandidate.lastName ?? ''}`.trim(), image: selectedCandidate.image, team: selectedCandidate.teamName }
    : editing && editing.playerId === selectedPlayerId
      ? { name: `${editing.player.firstName} ${editing.player.lastName}`, image: editing.player.image, team: editing.player.team?.name ?? null }
      : null;
  const visiblePlayers = useMemo(() => candidates.filter((player) => `${player.firstName || ''} ${player.lastName || ''} ${player.teamName || ''}`.toLowerCase().includes(search.toLowerCase())).slice(0, 8), [candidates, search]);
  const wordCount = description.trim().split(/\s+/).filter(Boolean).length;

  const save = async () => {
    if (!selectedPlayerId || !description.trim()) { setError('Choose a player and add their story before publishing'); return; }
    if (!editing && !slot) { setError('Choose a slot first'); return; }
    try {
      setSaving(true); setError(''); setSuccess('');
      const payload = { playerId: selectedPlayerId, description, customImage: customImage || undefined, active: true };
      const body = editing
        ? { id: editing.id, ...payload }
        : { ...payload, leagueSeasonId: slot!.leagueSeasonId, conferenceId: slot!.conferenceId };
      const response = await fetch('/api/highlights/potw', { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || 'Failed to publish Player of the Week'); }
      setSuccess(editing ? 'Player of the Week updated' : `${slot?.label ?? 'Player of the Week'} pick published`);
      resetForm(); await fetchData();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Failed to publish Player of the Week'); }
    finally { setSaving(false); }
  };

  const restore = (item: PlayerOfTheWeekWithPlayer) => {
    const key = keyOf(item);
    const itemSlot = key ? slots.find((entry) => entry.key === key) : null;
    if (itemSlot) { setSeasonId(itemSlot.seasonId); setSlotKey(itemSlot.key); }
    setEditing(item); setSelectedPlayerId(item.playerId); setDescription(item.description); setCustomImage(item.customImage || '');
    window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };
  const remove = async (id: string) => { if (!window.confirm('Delete this Player of the Week record?')) return; await fetch(`/api/highlights/potw?id=${id}`, { method: 'DELETE' }); if (editing?.id === id) resetForm(); await fetchData(); };

  if (loading) return <div className="eb-potw-v2-loading"><span /><span /><span /></div>;

  const historyRows = history.filter((item) => filter === 'All' || keyOf(item) === slotKey);

  return <section className="eb-potw-v2">
    <header className="eb-potw-v2-heading"><div><div className="eb-potw-eyebrow">Editorial</div><h1>Player of the Week</h1><p>One standout per conference, and one per league that plays as a single table. Publishing a new pick archives only the current holder of that slot.</p></div><a href="/" className="eb-potw-site-link"><Eye size={14} /> View on site</a></header>
    <div className="eb-potw-scope"><span>Season</span><select value={seasonId} onChange={(event) => chooseSeason(event.target.value)}>{!seasons.length && <option value="">No published seasons</option>}{seasons.map((season) => <option key={season.id} value={season.id}>{season.name}</option>)}</select><b>›</b><span>Slot</span><div className="eb-potw-leagues eb-potw-slots" role="tablist" aria-label="Award slot">{seasonSlots.map((entry) => <button type="button" role="tab" aria-selected={slotKey === entry.key} key={entry.key} className={slotKey === entry.key ? 'active' : ''} onClick={() => chooseSlot(entry.key)} title={filledKeys.has(entry.key) ? 'Has a live pick' : 'No pick yet'}><i className={filledKeys.has(entry.key) ? 'filled' : ''} />{slotTitle(entry)}</button>)}</div>{slot && <small><i className={slotPick ? '' : 'empty'} />{slotPick ? 'Live pick in this slot' : 'No pick in this slot yet'} <em>{slot.conferenceId ? `${slot.label} conference · ${slot.leagueLabel}` : slot.leagueLabel}</em></small>}</div>
    {!slots.length && <div className="eb-potw-alert">No published league seasons yet. Publish a season under Seasons to start awarding Player of the Week.</div>}
    {slotPick && <article className="eb-potw-current"><div className="eb-potw-shot">{(slotPick.customImage || slotPick.player.image) && <img src={slotPick.customImage || slotPick.player.image || ''} alt="" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/images/default-player.png'; }} />}<span>Action shot</span></div><div className="eb-potw-current-copy"><div className="eb-potw-live"><strong><i /> Live now</strong><span>{slot?.label}</span></div><h2>{slotPick.player.firstName} {slotPick.player.lastName}</h2><div className="eb-potw-meta">{slotPick.player.team?.name || 'Free Agent'} <span>#{slotPick.player.jerseyNumber ?? '—'} · {slotPick.player.position || 'Player'}</span></div><p>{slotPick.description}</p><div className="eb-potw-current-actions"><button type="button" onClick={() => restore(slotPick)}>Edit this story</button><button type="button" onClick={() => void remove(slotPick.id)}>Unpublish</button><small>Awarded {new Date(slotPick.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</small></div></div></article>}
      <div className="eb-potw-main-grid"><main className="eb-potw-form-stack">
      <section className="eb-potw-card" ref={formRef}><div className="eb-potw-card-heading"><div><h3>{editing ? 'Edit this award' : `Pick the ${slot?.label ?? ''} player`}</h3><span>{editing ? 'Update the selected award and publish the change.' : candidatesLoading ? 'Loading roster…' : `${candidates.length} on ${slot?.conferenceId ? `${slot.label} conference` : slot?.leagueLabel ?? 'the'} rosters · ranked by points per game`}</span></div>{editing && <div className="eb-potw-tabs"><button type="button" onClick={resetForm}>Cancel edit</button></div>}</div><div className="eb-potw-card-body"><label className="eb-potw-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search players in this slot…" /></label><div className="eb-potw-candidates">{visiblePlayers.map((player) => <button type="button" key={player.id} className={`eb-potw-candidate ${selectedPlayerId === player.id ? 'selected' : ''}`} onClick={() => setSelectedPlayerId(player.id)}><span className="eb-potw-avatar">{player.image ? <img src={player.image} alt="" /> : `${player.firstName?.[0] || ''}${player.lastName?.[0] || ''}`}</span><span className="eb-potw-candidate-name"><strong>{player.firstName} {player.lastName}</strong><small>{player.teamName || 'Free Agent'} · #{player.jerseyNumber ?? '—'} · {player.position || 'Player'}</small></span><span className="eb-potw-candidate-stat"><b>{player.pointsPerGame ?? '—'}</b><small>PPG</small></span>{selectedPlayerId === player.id && <span className="eb-potw-check"><Check size={13} /></span>}</button>)}{!candidatesLoading && slot && !candidates.length && <div className="eb-potw-empty">No approved players on these rosters yet.</div>}</div></div></section>
      <section className="eb-potw-card"><div className="eb-potw-card-title">Action shot</div><div className="eb-potw-action-layout"><div className="eb-potw-action-preview">{customImage && <img src={customImage} alt="" />}<span>3:4 crop</span>{customImage && <button type="button" onClick={() => setCustomImage('')} aria-label="Remove action shot">×</button>}</div><div className="eb-potw-action-controls"><ImageUpload variant="potw" value={customImage} onChange={setCustomImage} onOpenMediaLibrary={() => setPickerOpen(true)} disabled={saving} folder="potw" /><small>Portrait 3:4 is what the public card crops to. Empty uses the player’s profile photo.</small></div></div></section>
      <section className="eb-potw-card"><div className="eb-potw-card-heading"><h3>The story</h3><span className={wordCount >= 60 ? 'good' : ''}>{wordCount} words · aim for 60–160</span></div><div className="eb-potw-card-body"><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What did they do this week? Lead with the moment, then the numbers…" /><div className="eb-potw-help">Blank line starts a new paragraph <span>First 24 words show on the homepage card</span></div></div></section>
      {(error || success) && <div className={`eb-potw-alert ${success ? 'success' : ''}`}>{success || error}</div>}<button type="button" className="eb-potw-publish" disabled={saving || !selectedPlayerId} onClick={() => void save()}>{saving ? 'Publishing…' : editing ? 'Save changes' : `Set as ${slot?.label ?? ''} Player of the Week`}</button>
    </main><aside className="eb-potw-rail"><section className="eb-potw-card"><div className="eb-potw-rail-title">Live preview · public card</div><div className="eb-potw-preview"><div className="eb-potw-preview-image">{(customImage || selectedPlayer?.image) && <img src={customImage || selectedPlayer?.image || ''} alt="" />}<b>{slot?.label ?? 'Player of the week'}</b></div><div className="eb-potw-preview-body"><span>Player of the Week</span><h3>{selectedPlayer?.name || 'Select a player'}</h3><strong>{selectedPlayer?.team || 'Team name'}</strong><p>{description || 'Your story preview will appear here.'}</p></div></div></section><section className="eb-potw-card eb-potw-publish-card"><div className="eb-potw-rail-title">Before publishing</div><div className="eb-potw-checklist"><span className={selectedPlayerId ? 'done' : 'missing'}>{selectedPlayerId ? <CheckCircle2 /> : <CircleAlert />}<b>Player selected</b></span><span className={description.trim() ? 'done' : 'missing'}>{description.trim() ? <CheckCircle2 /> : <CircleAlert />}<b>Story added</b></span><span className={customImage || selectedPlayer?.image ? 'done' : 'missing'}>{customImage || selectedPlayer?.image ? <CheckCircle2 /> : <ImageIcon />}<b>Action shot ready</b></span><span className="eb-potw-notify-row"><span><strong>Notify subscribers</strong><small>{notifySubscribers ? 'Emails subscribers after publish' : 'Send once when published'}</small></span><button type="button" aria-label="Notify subscribers" aria-pressed={notifySubscribers} className={notifySubscribers ? 'active' : ''} onClick={() => setNotifySubscribers((current) => !current)}><i /></button></span><button type="button" className="eb-potw-rail-publish" disabled={saving || !selectedPlayerId || !description.trim()} onClick={() => void save()}>{saving ? 'Publishing…' : 'Publish Player of the Week'}</button><small className="eb-potw-publish-note">Publishing archives the current {slot?.label ?? ''} holder only.</small></div></section></aside></div>
    <section className="eb-potw-card eb-potw-history"><div className="eb-potw-card-heading"><div><h3><History size={16} /> Past winners</h3><span>{history.length} recorded awards</span></div><div className="eb-potw-tabs">{(['All', 'This slot'] as const).map((item) => <button type="button" key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div></div><div className="eb-potw-table-wrap"><table><thead><tr><th>Player</th><th>Slot</th><th>Team</th><th>Awarded</th><th>Status</th><th>Actions</th></tr></thead><tbody>{historyRows.map((item) => <tr key={item.id}><td><span className="eb-potw-table-player">{item.player.image ? <img src={item.player.image} alt="" /> : <i>{item.player.firstName?.[0]}</i>}<b>{item.player.firstName} {item.player.lastName}<small>{item.description.slice(0, 44)}{item.description.length > 44 ? '…' : ''}</small></b></span></td><td>{slotLabelOf(item, slots)}<small>{item.leagueSeason?.season.name ?? '—'}</small></td><td>{item.player.team?.name || 'Free Agent'}</td><td>{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td><td><span className={`eb-potw-status ${item.active ? 'active' : ''}`}>{item.active ? 'Active' : 'Past'}</span></td><td><button type="button" aria-label="Edit winner" onClick={() => restore(item)}><Edit3 size={14} /></button><button type="button" aria-label="Delete winner" onClick={() => void remove(item.id)}><Trash2 size={14} /></button></td></tr>)}</tbody></table>{historyRows.length === 0 && <div className="eb-potw-empty">No past winners recorded.</div>}</div></section><MediaLibraryPicker open={pickerOpen} onOpenChange={setPickerOpen} onSelect={setCustomImage} title="Choose action shot" />
  </section>;
}
