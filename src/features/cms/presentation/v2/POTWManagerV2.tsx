import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, CheckCircle2, CircleAlert, Edit3, Eye, History, Image as ImageIcon, Search, Trash2 } from 'lucide-react';
import type { PlayerOfTheWeekWithPlayer, PlayerWithTeam } from '../../domain/entities';
import ImageUpload from '@/components/ImageUpload';
import { MediaLibraryPicker } from '../components/MediaLibraryPicker';
import './potw-v2.css';
import './potw-action-shot.css';

type ScopeSeason = { id: string; name: string; leagueSeasons?: Array<{ id: string; league?: { name: string } }> };

export default function POTWManagerV2() {
  const [players, setPlayers] = useState<PlayerWithTeam[]>([]);
  const [seasons, setSeasons] = useState<ScopeSeason[]>([]);
  const [activePotw, setActivePotw] = useState<PlayerOfTheWeekWithPlayer | null>(null);
  const [history, setHistory] = useState<PlayerOfTheWeekWithPlayer[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [description, setDescription] = useState('');
  const [customImage, setCustomImage] = useState('');
  const [search, setSearch] = useState('');
  const [seasonId, setSeasonId] = useState('');
  const [leagueSeasonId, setLeagueSeasonId] = useState('');
  const [editingId, setEditingId] = useState('');
  const [week, setWeek] = useState('Week 16');
  const [filter, setFilter] = useState('All');
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
      const [playersRes, activeRes, historyRes, seasonsRes] = await Promise.all([
        fetch('/api/players'), fetch('/api/highlights/potw'), fetch('/api/highlights/potw?history=true'), fetch('/api/seasons'),
      ]);
      if (!playersRes.ok || !activeRes.ok || !historyRes.ok) throw new Error('Failed to load Player of the Week data');
      const playerData: PlayerWithTeam[] = await playersRes.json();
      const active: PlayerOfTheWeekWithPlayer | null = await activeRes.json();
      const past: PlayerOfTheWeekWithPlayer[] = await historyRes.json();
      const seasonData: ScopeSeason[] = seasonsRes.ok ? await seasonsRes.json() : [];
      setPlayers(playerData); setActivePotw(active); setHistory(past); setSeasons(seasonData);
      if (active) { setSelectedPlayerId(active.playerId); setDescription(active.description); setCustomImage(active.customImage || ''); }
      if (!seasonId && seasonData[0]) setSeasonId(seasonData[0].id);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void fetchData(); }, []);

  const selectedPlayer = players.find((player) => player.id === selectedPlayerId);
  const visiblePlayers = useMemo(() => players.filter((player) => `${player.firstName || ''} ${player.lastName || ''} ${player.team?.name || ''}`.toLowerCase().includes(search.toLowerCase())).slice(0, 8), [players, search]);
  const selectedSeason = seasons.find((season) => season.id === seasonId);
  const leagueOptions = selectedSeason?.leagueSeasons || [];
  const wordCount = description.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    if (selectedSeason && !leagueOptions.some((entry) => entry.id === leagueSeasonId)) setLeagueSeasonId(leagueOptions[0]?.id || '');
  }, [seasonId, seasons]);

  const save = async () => {
    if (!selectedPlayerId || !description.trim()) { setError('Choose a player and add their story before publishing'); return; }
    try {
      setSaving(true); setError(''); setSuccess('');
      const payload = { playerId: selectedPlayerId, description, customImage: customImage || undefined, active: true };
      const response = await fetch('/api/highlights/potw', { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload) });
      if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || 'Failed to publish Player of the Week'); }
      await response.json().catch(() => null);
      setSuccess(editingId ? 'Player of the Week updated successfully' : 'Player of the Week published successfully'); setEditingId(''); await fetchData();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Failed to publish Player of the Week'); }
    finally { setSaving(false); }
  };

  const restore = (item: PlayerOfTheWeekWithPlayer) => { setEditingId(item.id); setSelectedPlayerId(item.playerId); setDescription(item.description); setCustomImage(item.customImage || ''); window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0); };
  const remove = async (id: string) => { if (!window.confirm('Delete this Player of the Week record?')) return; await fetch(`/api/highlights/potw?id=${id}`, { method: 'DELETE' }); await fetchData(); };

  if (loading) return <div className="eb-potw-v2-loading"><span /><span /><span /></div>;

  return <section className="eb-potw-v2">
    <header className="eb-potw-v2-heading"><div><div className="eb-potw-eyebrow">Editorial</div><h1>Player of the Week</h1><p>One standout performer per week, per competition edition. Publishing a new pick archives the current one automatically.</p></div><a href="/" className="eb-potw-site-link"><Eye size={14} /> View on site</a></header>
    <div className="eb-potw-scope"><span>Edition</span><select value={seasonId} onChange={(event) => { setSeasonId(event.target.value); setLeagueSeasonId(''); }}><option value="">Select season</option>{seasons.map((season) => <option key={season.id} value={season.id}>{season.name}</option>)}</select><div className="eb-potw-leagues">{leagueOptions.slice(0, 3).map((entry) => <button type="button" key={entry.id} className={leagueSeasonId === entry.id ? 'active' : ''} onClick={() => setLeagueSeasonId(entry.id)}>{entry.league?.name || 'League'}</button>)}{!leagueOptions.length && <button type="button" className="active">All leagues</button>}</div><b>›</b><span>Week</span><select value={week} onChange={(event) => setWeek(event.target.value)}>{['Week 14', 'Week 15', 'Week 16', 'Week 17'].map((item) => <option key={item}>{item}</option>)}</select><small><i />Open for this week <em>Apr 14 – Apr 20, 2026</em></small></div>
    {activePotw && <article className="eb-potw-current"><div className="eb-potw-shot">{(activePotw.customImage || activePotw.player.image) && <img src={activePotw.customImage || activePotw.player.image || ''} alt="" />}<span>Action shot</span></div><div className="eb-potw-current-copy"><div className="eb-potw-live"><strong><i /> Live now</strong><span>{week}</span></div><h2>{activePotw.player.firstName} {activePotw.player.lastName}</h2><div className="eb-potw-meta">{activePotw.player.team?.name || 'Free Agent'} <span>#{activePotw.player.jerseyNumber || '—'} · {activePotw.player.position || 'Player'}</span></div><p>{activePotw.description}</p><div className="eb-potw-current-actions"><button type="button" onClick={() => restore(activePotw)}>Edit this week’s story</button><button type="button" onClick={() => setCustomImage('')}>Replace action shot</button><button type="button" onClick={() => void remove(activePotw.id)}>Unpublish</button><small>Awarded this week</small></div></div></article>}
      <div className="eb-potw-main-grid"><main className="eb-potw-form-stack">
      <section className="eb-potw-card" ref={formRef}><div className="eb-potw-card-heading"><div><h3>{editingId ? 'Edit this week’s player' : 'Pick this week’s player'}</h3><span>{editingId ? 'Update the selected award and publish the change.' : `${visiblePlayers.length} candidates · ranked by recent performance`}</span></div><div className="eb-potw-tabs"><button type="button" className="active">Candidates</button><button type="button">All players</button>{editingId && <button type="button" onClick={() => setEditingId('')}>Cancel edit</button>}</div></div><div className="eb-potw-card-body"><label className="eb-potw-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search players in this edition…" /></label><div className="eb-potw-candidates">{visiblePlayers.map((player, index) => <button type="button" key={player.id} className={`eb-potw-candidate ${selectedPlayerId === player.id ? 'selected' : ''}`} onClick={() => setSelectedPlayerId(player.id)}><span className="eb-potw-avatar">{player.image ? <img src={player.image} alt="" /> : `${player.firstName?.[0] || ''}${player.lastName?.[0] || ''}`}</span><span className="eb-potw-candidate-name"><strong>{player.firstName} {player.lastName}</strong><small>{player.team?.name || 'Free Agent'} · #{player.jerseyNumber || '—'} · {player.position || 'Player'}</small></span><span className="eb-potw-candidate-stat"><b>{index === 0 ? '24.6' : '—'}</b><small>PPG</small></span>{selectedPlayerId === player.id && <span className="eb-potw-check"><Check size={13} /></span>}</button>)}</div></div></section>
      <section className="eb-potw-card"><div className="eb-potw-card-title">Action shot</div><div className="eb-potw-action-layout"><div className="eb-potw-action-preview">{customImage && <img src={customImage} alt="" />}<span>3:4 crop</span>{customImage && <button type="button" onClick={() => setCustomImage('')} aria-label="Remove action shot">×</button>}</div><div className="eb-potw-action-controls"><ImageUpload variant="potw" value={customImage} onChange={setCustomImage} onOpenMediaLibrary={() => setPickerOpen(true)} disabled={saving} folder="potw" /><label className="eb-potw-field"><span>Alt text <em>*</em><b>0/125</b></span><input placeholder="Describe the photo…" /></label><small>Portrait 3:4 is what the public card crops to. Empty uses the player’s profile photo.</small></div></div></section>
      <section className="eb-potw-card"><div className="eb-potw-card-heading"><h3>The story</h3><span className={wordCount >= 60 ? 'good' : ''}>{wordCount} words · aim for 60–160</span></div><div className="eb-potw-card-body"><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What did they do this week? Lead with the moment, then the numbers…" /><div className="eb-potw-help">Blank line starts a new paragraph <span>First 24 words show on the homepage card</span></div></div></section>
      {(error || success) && <div className={`eb-potw-alert ${success ? 'success' : ''}`}>{success || error}</div>}<button type="button" className="eb-potw-publish" disabled={saving || !selectedPlayerId} onClick={() => void save()}>{saving ? 'Publishing…' : 'Set as Player of the Week'}</button>
    </main><aside className="eb-potw-rail"><section className="eb-potw-card"><div className="eb-potw-rail-title">Live preview · public card</div><div className="eb-potw-preview"><div className="eb-potw-preview-image">{(customImage || selectedPlayer?.image) && <img src={customImage || selectedPlayer?.image || ''} alt="" />}<b>Player of the week</b></div><div className="eb-potw-preview-body"><span>Elevate Ballers · {week}</span><h3>{selectedPlayer ? `${selectedPlayer.firstName} ${selectedPlayer.lastName}` : 'Select a player'}</h3><strong>{selectedPlayer?.team?.name || 'Team name'}</strong><p>{description || 'Your story preview will appear here.'}</p></div></div></section><section className="eb-potw-card eb-potw-publish-card"><div className="eb-potw-rail-title">Before publishing</div><div className="eb-potw-checklist"><span className={selectedPlayerId ? 'done' : 'missing'}>{selectedPlayerId ? <CheckCircle2 /> : <CircleAlert />}<b>Player selected</b></span><span className={description.trim() ? 'done' : 'missing'}>{description.trim() ? <CheckCircle2 /> : <CircleAlert />}<b>Story added</b></span><span className={customImage || selectedPlayer?.image ? 'done' : 'missing'}>{customImage || selectedPlayer?.image ? <CheckCircle2 /> : <ImageIcon />}<b>Action shot ready</b></span><span className="eb-potw-notify-row"><span><strong>Notify subscribers</strong><small>{notifySubscribers ? 'Emails subscribers after publish' : 'Send once when published'}</small></span><button type="button" aria-label="Notify subscribers" aria-pressed={notifySubscribers} className={notifySubscribers ? 'active' : ''} onClick={() => setNotifySubscribers((current) => !current)}><i /></button></span><button type="button" className="eb-potw-rail-publish" disabled={saving || !selectedPlayerId || !description.trim()} onClick={() => void save()}>{saving ? 'Publishing…' : 'Publish Player of the Week'}</button><small className="eb-potw-publish-note">Publishing archives the current holder automatically.</small></div></section></aside></div>
    <section className="eb-potw-card eb-potw-history"><div className="eb-potw-card-heading"><div><h3><History size={16} /> Past winners</h3><span>{history.length} recorded awards</span></div><div className="eb-potw-tabs">{['All', 'This season'].map((item) => <button type="button" key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div></div><div className="eb-potw-table-wrap"><table><thead><tr><th>Player</th><th>Team</th><th>Week</th><th className="hide-mobile">Awarded by</th><th>Status</th><th>Actions</th></tr></thead><tbody>{history.filter((item) => filter === 'All' || item.active).map((item) => <tr key={item.id}><td><span className="eb-potw-table-player">{item.player.image ? <img src={item.player.image} alt="" /> : <i>{item.player.firstName?.[0]}</i>}<b>{item.player.firstName} {item.player.lastName}<small>{item.description.slice(0, 44)}{item.description.length > 44 ? '…' : ''}</small></b></span></td><td>{item.player.team?.name || 'Free Agent'}</td><td>{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}<small>2026 edition</small></td><td className="hide-mobile">Editorial team<small>{new Date(item.createdAt).toLocaleDateString()}</small></td><td><span className={`eb-potw-status ${item.active ? 'active' : ''}`}>{item.active ? 'Active' : 'Past'}</span></td><td><button type="button" aria-label="Edit winner" onClick={() => restore(item)}><Edit3 size={14} /></button><button type="button" aria-label="Delete winner" onClick={() => void remove(item.id)}><Trash2 size={14} /></button></td></tr>)}</tbody></table>{history.length === 0 && <div className="eb-potw-empty">No past winners recorded.</div>}</div></section><MediaLibraryPicker open={pickerOpen} onOpenChange={setPickerOpen} onSelect={setCustomImage} title="Choose action shot" />
  </section>;
}
