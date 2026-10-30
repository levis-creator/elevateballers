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
import { Skeleton, SkeletonPanel, SkeletonRegion, SkeletonTable, SkeletonText } from '@/shared/components/skeleton/Skeleton';

type SlotsResponse = { slots: PotwSlot[]; currentSlotKeys: string[]; active: PlayerOfTheWeekWithPlayer[] };

const keyOf = (item: Pick<PlayerOfTheWeekWithPlayer, 'leagueSeasonId' | 'conferenceId'>) =>
  item.leagueSeasonId ? potwSlotKey(item.leagueSeasonId, item.conferenceId) : null;

/** "Clutch · EBL" for a conference award, the league code for a league-wide one, "Overall" for pre-slot awards. */
const shortDate = (date: string | Date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const fullName = (item: PlayerOfTheWeekWithPlayer) => `${item.player.firstName} ${item.player.lastName}`.trim();
const imageOf = (item: PlayerOfTheWeekWithPlayer) => item.customImage || item.player.image || '';
/** "Elevate Ballers League (EBL)" → "Elevate Ballers League". */
const leagueNameOf = (slot: PotwSlot) => slot.leagueLabel.replace(/\s*\([^)]*\)\s*$/, '');

const slotLabelOf = (item: PlayerOfTheWeekWithPlayer, slots: PotwSlot[]) => {
  const slot = slots.find((entry) => entry.key === keyOf(item));
  if (slot) return slot.label;
  if (item.conference) return item.conference.name;
  if (item.leagueSeason) return item.leagueSeason.league.name;
  return 'Overall';
};

export default function POTWManagerV2() {
  const [slots, setSlots] = useState<PotwSlot[]>([]);
  const [currentSlotKeys, setCurrentSlotKeys] = useState<string[]>([]);
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
  const [filter, setFilter] = useState('all');
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
      setSlots(slotData.slots); setCurrentSlotKeys(slotData.currentSlotKeys); setActive(slotData.active); setHistory(await historyRes.json());
      // Open on the active season's current slots (else every current slot): the
      // first that still needs a pick, else the first of them.
      if (!slotKey) {
        const current = slotData.slots.filter((slot) => slotData.currentSlotKeys.includes(slot.key));
        const activeSeason = current.filter((slot) => slot.seasonActive);
        const pool = activeSeason.length ? activeSeason : current;
        const filled = new Set(slotData.active.map(keyOf));
        const first = pool.find((slot) => !filled.has(slot.key)) ?? pool[0]
          ?? slotData.slots.find((slot) => slot.seasonActive) ?? slotData.slots[0];
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
  const chooseSeason = (id: string) => { setSeasonId(id); setFilter('all'); const first = slots.find((entry) => entry.seasonId === id); chooseSlot(first?.key ?? ''); };

  const selectedCandidate = candidates.find((player) => player.id === selectedPlayerId);
  // An award being edited may predate the current roster — fall back to its own player.
  const selectedPlayer = selectedCandidate
    ? { name: `${selectedCandidate.firstName ?? ''} ${selectedCandidate.lastName ?? ''}`.trim(), image: selectedCandidate.image, team: selectedCandidate.teamName }
    : editing && editing.playerId === selectedPlayerId
      ? { name: `${editing.player.firstName} ${editing.player.lastName}`, image: editing.player.image, team: editing.player.team?.name ?? null }
      : null;
  // Earlier winners of this slot, so a repeat pick is a deliberate one.
  const lastWonBySlotPlayer = useMemo(() => {
    const won = new Map<string, Date>();
    for (const item of history) {
      if (keyOf(item) !== slotKey || item.id === editing?.id) continue;
      const at = new Date(item.createdAt);
      const previous = won.get(item.playerId);
      if (!previous || at > previous) won.set(item.playerId, at);
    }
    return won;
  }, [history, slotKey, editing]);
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

  const heading = (
    <header className="eb-potw-v2-heading"><div><div className="eb-potw-eyebrow">Editorial</div><h1>Player of the Week</h1><p>One winner per slot — each conference, and each league that plays as a single table, shows side by side on the homepage. Publishing a slot only replaces that slot’s winner.</p></div><a href="/" className="eb-potw-site-link"><Eye size={14} /> View on site</a></header>
  );
  if (loading) return <section className="eb-potw-v2">{heading}<SkeletonRegion label="Loading Player of the Week"><Skeleton w={300} h={40} style={{ borderRadius: 10 }} /><div className="eb-skel-grid" style={{ ['--skel-min' as string]: '260px' }}><div className="eb-skel-card"><div className="eb-skel-row" style={{ justifyContent: 'space-between' }}><Skeleton w={110} h={9} /><Skeleton w={70} h={18} round /></div><div className="eb-skel-row"><Skeleton w={72} h={96} style={{ borderRadius: 10 }} /><SkeletonText lines={3} /></div></div><div className="eb-skel-card"><div className="eb-skel-row" style={{ justifyContent: 'space-between' }}><Skeleton w={110} h={9} /><Skeleton w={70} h={18} round /></div><div className="eb-skel-row"><Skeleton w={72} h={96} style={{ borderRadius: 10 }} /><SkeletonText lines={3} /></div></div><div className="eb-skel-card"><div className="eb-skel-row" style={{ justifyContent: 'space-between' }}><Skeleton w={110} h={9} /><Skeleton w={70} h={18} round /></div><div className="eb-skel-row"><Skeleton w={72} h={96} style={{ borderRadius: 10 }} /><SkeletonText lines={3} /></div></div></div><div className="eb-skel-split"><div className="eb-skel-region"><SkeletonTable rows={5} columns={1} pill={false} /><SkeletonPanel lines={4} /></div><div className="eb-skel-region"><SkeletonPanel lines={3} /><SkeletonPanel lines={4} /></div></div></SkeletonRegion></section>;

  const historyRows = history.filter((item) => filter === 'all' || keyOf(item) === filter);
  const draftName = !editing && selectedPlayer ? selectedPlayer.name : '';
  const homeRow = slots.filter((entry) => currentSlotKeys.includes(entry.key)).map((entry) => {
    const pick = active.find((item) => keyOf(item) === entry.key) ?? null;
    const isDraft = entry.key === slotKey && !!draftName;
    return { slot: entry, name: isDraft ? draftName : pick ? fullName(pick) : 'Not awarded', state: isDraft ? 'draft' : pick ? 'live' : 'empty', image: isDraft ? customImage || selectedPlayer?.image || '' : pick ? imageOf(pick) : '' };
  });
  const liveInSeason = seasonSlots.filter((entry) => filledKeys.has(entry.key)).length;

  return <section className="eb-potw-v2">
    {heading}
    <div className="eb-potw-scope"><span>Season</span><select value={seasonId} onChange={(event) => chooseSeason(event.target.value)}>{!seasons.length && <option value="">No published seasons</option>}{seasons.map((season) => <option key={season.id} value={season.id}>{season.name}</option>)}</select>{seasonSlots.length > 0 && <small><i className={liveInSeason === seasonSlots.length ? '' : 'empty'} />{liveInSeason} of {seasonSlots.length} slots live</small>}</div>
    {!slots.length && <div className="eb-potw-alert">No published league seasons yet. Publish a season under Seasons to start awarding Player of the Week.</div>}
    {seasonSlots.length > 0 && <div className="eb-potw-slot-grid" role="tablist" aria-label="Award slot">{seasonSlots.map((entry) => {
      const pick = active.find((item) => keyOf(item) === entry.key) ?? null;
      return <button type="button" role="tab" aria-selected={slotKey === entry.key} key={entry.key} className={`eb-potw-slot-card ${slotKey === entry.key ? 'active' : ''}`} onClick={() => chooseSlot(entry.key)}>
        <span className="eb-potw-slot-head"><span>{leagueNameOf(entry)}</span><em className={pick ? 'live' : ''}><i />{pick ? 'Live' : 'Not awarded'}</em></span>
        <span className="eb-potw-slot-body"><span className="eb-potw-slot-shot">{pick && imageOf(pick) ? <img src={imageOf(pick)} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : '3:4'}</span><span className="eb-potw-slot-copy"><b>{entry.label}</b><strong className={pick ? '' : 'empty'}>{pick ? fullName(pick) : 'No winner yet'}</strong><small>{pick ? `${pick.player.team?.name || 'Free Agent'} · #${pick.player.jerseyNumber ?? '—'}` : 'Pick one below'}</small><small className="eb-potw-slot-note">{pick ? `Awarded ${shortDate(pick.createdAt)}` : entry.conferenceId ? `${entry.label} conference rosters` : `${entry.label} rosters`}</small></span></span>
      </button>;
    })}</div>}
    {seasonSlots.length > 0 && <p className="eb-potw-slot-hint">Slots follow each league season’s structure: a league split into conferences gets one winner per conference, a single-table league gets one. A slot with no new winner keeps its last one on the homepage.</p>}
    {slot && <div className="eb-potw-editing"><span>Editing slot</span><strong>{slotTitle(slot)}</strong><em className={editing ? 'draft' : slotPick ? 'live' : ''}>{editing ? 'Editing award' : slotPick ? `Live · ${fullName(slotPick)}` : 'Not awarded'}</em>{slotPick && !editing && <span className="eb-potw-editing-actions"><button type="button" onClick={() => restore(slotPick)}>Edit live story</button><button type="button" className="danger" onClick={() => void remove(slotPick.id)}>Unpublish this slot</button></span>}</div>}
      <div className="eb-potw-main-grid"><main className="eb-potw-form-stack">
      <section className="eb-potw-card" ref={formRef}><div className="eb-potw-card-heading"><div><h3>{editing ? 'Edit this award' : `Pick the ${slot?.label ?? ''} player`}</h3><span>{editing ? 'Update the selected award and publish the change.' : candidatesLoading ? 'Loading roster…' : `${candidates.length} on ${slot?.conferenceId ? `${slot.label} conference` : slot?.leagueLabel ?? 'the'} rosters · ranked by points per game`}</span></div>{editing && <div className="eb-potw-tabs"><button type="button" onClick={resetForm}>Cancel edit</button></div>}</div><div className="eb-potw-card-body"><label className="eb-potw-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search players in this slot…" /></label><div className="eb-potw-candidates">{visiblePlayers.map((player) => <button type="button" key={player.id} className={`eb-potw-candidate ${selectedPlayerId === player.id ? 'selected' : ''}`} onClick={() => setSelectedPlayerId(player.id)}><span className="eb-potw-avatar">{player.image ? <img src={player.image} alt="" /> : `${player.firstName?.[0] || ''}${player.lastName?.[0] || ''}`}</span><span className="eb-potw-candidate-name"><strong>{player.firstName} {player.lastName}</strong><small>{player.teamName || 'Free Agent'} · #{player.jerseyNumber ?? '—'} · {player.position || 'Player'}</small></span><span className="eb-potw-candidate-stat"><b>{player.pointsPerGame ?? '—'}</b><small>PPG</small></span>{lastWonBySlotPlayer.has(player.id) && <span className="eb-potw-won">Won {shortDate(lastWonBySlotPlayer.get(player.id)!)}</span>}{selectedPlayerId === player.id && <span className="eb-potw-check"><Check size={13} /></span>}</button>)}{!candidatesLoading && slot && !candidates.length && <div className="eb-potw-empty">No approved players on these rosters yet.</div>}</div></div></section>
      <section className="eb-potw-card"><div className="eb-potw-card-title">Action shot</div><div className="eb-potw-action-layout"><div className="eb-potw-action-preview">{customImage && <img src={customImage} alt="" />}<span>3:4 crop</span>{customImage && <button type="button" onClick={() => setCustomImage('')} aria-label="Remove action shot">×</button>}</div><div className="eb-potw-action-controls"><ImageUpload variant="potw" value={customImage} onChange={setCustomImage} onOpenMediaLibrary={() => setPickerOpen(true)} disabled={saving} folder="potw" /><small>Portrait 3:4 is what the public card crops to. Empty uses the player’s profile photo.</small></div></div></section>
      <section className="eb-potw-card"><div className="eb-potw-card-heading"><h3>The story</h3><span className={wordCount >= 60 ? 'good' : ''}>{wordCount} words · aim for 60–160</span></div><div className="eb-potw-card-body"><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What did they do this week? Lead with the moment, then the numbers…" /><div className="eb-potw-help">Blank line starts a new paragraph <span>First 24 words show on the homepage card</span></div></div></section>
      {(error || success) && <div className={`eb-potw-alert ${success ? 'success' : ''}`}>{success || error}</div>}<button type="button" className="eb-potw-publish" disabled={saving || !selectedPlayerId} onClick={() => void save()}>{saving ? 'Publishing…' : editing ? 'Save changes' : `Set as ${slot?.label ?? ''} Player of the Week`}</button>
    </main><aside className="eb-potw-rail">{homeRow.length > 0 && <section className="eb-potw-card"><div className="eb-potw-rail-title">Homepage row</div><div className="eb-potw-home-row">{homeRow.map((cell) => <span key={cell.slot.key} className={`eb-potw-home-cell ${cell.state}`}><span className="eb-potw-home-shot">{cell.image && <img src={cell.image} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}</span><span className="eb-potw-home-copy"><b>{cell.slot.label}</b><strong>{cell.name}</strong><small>{cell.state === 'draft' ? 'Draft · not published' : cell.state === 'live' ? 'Live' : 'Hidden until awarded'}</small></span></span>)}</div></section>}<section className="eb-potw-card"><div className="eb-potw-rail-title">Live preview · public card</div><div className="eb-potw-preview"><div className="eb-potw-preview-image">{(customImage || selectedPlayer?.image) && <img src={customImage || selectedPlayer?.image || ''} alt="" />}<b>{slot?.label ?? 'Player of the week'}</b></div><div className="eb-potw-preview-body"><span>Player of the Week</span><h3>{selectedPlayer?.name || 'Select a player'}</h3><strong>{selectedPlayer?.team || 'Team name'}</strong><p>{description || 'Your story preview will appear here.'}</p></div></div></section><section className="eb-potw-card eb-potw-publish-card"><div className="eb-potw-rail-title">Before publishing</div><div className="eb-potw-checklist"><span className={selectedPlayerId ? 'done' : 'missing'}>{selectedPlayerId ? <CheckCircle2 /> : <CircleAlert />}<b>Player selected</b></span><span className={description.trim() ? 'done' : 'missing'}>{description.trim() ? <CheckCircle2 /> : <CircleAlert />}<b>Story added</b></span><span className={customImage || selectedPlayer?.image ? 'done' : 'missing'}>{customImage || selectedPlayer?.image ? <CheckCircle2 /> : <ImageIcon />}<b>Action shot ready</b></span><span className="eb-potw-notify-row"><span><strong>Notify subscribers</strong><small>{notifySubscribers ? 'Emails subscribers after publish' : 'Send once when published'}</small></span><button type="button" aria-label="Notify subscribers" aria-pressed={notifySubscribers} className={notifySubscribers ? 'active' : ''} onClick={() => setNotifySubscribers((current) => !current)}><i /></button></span><button type="button" className="eb-potw-rail-publish" disabled={saving || !selectedPlayerId || !description.trim()} onClick={() => void save()}>{saving ? 'Publishing…' : 'Publish Player of the Week'}</button><small className="eb-potw-publish-note">Publishing archives the current {slot?.label ?? ''} holder only.</small></div></section></aside></div>
    <section className="eb-potw-card eb-potw-history"><div className="eb-potw-card-heading"><div><h3><History size={16} /> Past winners</h3><span>{historyRows.length} of {history.length} recorded awards</span></div><div className="eb-potw-tabs">{[{ key: 'all', label: 'All' }, ...seasonSlots.map((entry) => ({ key: entry.key, label: entry.label }))].map((item) => <button type="button" key={item.key} className={filter === item.key ? 'active' : ''} onClick={() => setFilter(item.key)}>{item.label}</button>)}</div></div><div className="eb-potw-table-wrap"><table><thead><tr><th>Player</th><th>Slot</th><th>Team</th><th>Awarded</th><th>Status</th><th>Actions</th></tr></thead><tbody>{historyRows.map((item) => <tr key={item.id}><td><span className="eb-potw-table-player">{item.player.image ? <img src={item.player.image} alt="" /> : <i>{item.player.firstName?.[0]}</i>}<b>{item.player.firstName} {item.player.lastName}<small>{item.description.slice(0, 44)}{item.description.length > 44 ? '…' : ''}</small></b></span></td><td>{slotLabelOf(item, slots)}<small>{item.leagueSeason?.season.name ?? '—'}</small></td><td>{item.player.team?.name || 'Free Agent'}</td><td>{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td><td><span className={`eb-potw-status ${item.active ? 'active' : ''}`}>{item.active ? 'Active' : 'Past'}</span></td><td><button type="button" aria-label="Edit winner" onClick={() => restore(item)}><Edit3 size={14} /></button><button type="button" aria-label="Delete winner" onClick={() => void remove(item.id)}><Trash2 size={14} /></button></td></tr>)}</tbody></table>{historyRows.length === 0 && <div className="eb-potw-empty">No past winners recorded.</div>}</div></section><MediaLibraryPicker open={pickerOpen} onOpenChange={setPickerOpen} onSelect={setCustomImage} title="Choose action shot" />
  </section>;
}
