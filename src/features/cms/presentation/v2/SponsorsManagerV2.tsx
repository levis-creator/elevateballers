import { useEffect, useRef, useState, type DragEvent } from 'react';
import { ChevronDown, ChevronUp, GripVertical, Plus, Upload, X } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import type { Sponsor } from '../../types';
import ActionDialog from './ActionDialog';
import { Presence } from '@/shared/components/motion/Presence';
import { Skeleton, SkeletonRegion, SkeletonTable, SkeletonPanel, useFirstLoad } from '@/shared/components/skeleton/Skeleton';
import './sponsors-v2.css';

type Filter = 'All' | 'Visible' | 'Hidden';
type Draft = { id: string | null; name: string; image: string; link: string; active: boolean };

const LOGO_TYPES = 'image/png,image/webp,image/jpeg,image/gif';
const emptyDraft = (): Draft => ({ id: null, name: '', image: '', link: '', active: true });
const toDraft = (sponsor: Sponsor): Draft => ({ id: sponsor.id, name: sponsor.name, image: sponsor.image, link: sponsor.link || '', active: sponsor.active });
const pad = (n: number) => String(n).padStart(2, '0');
/** The last path segment of a logo URL, shown as its file name. */
const fileNameOf = (url: string) => { try { return decodeURIComponent(new URL(url, 'https://x').pathname.split('/').pop() || url); } catch { return url; } };

/** Same hostname rule the API applies (normalizeExternalUrl), so a link that passes here also saves. */
const isWebAddress = (u: string) => {
  const m = u.match(/^https?:\/\/([^/?#:\s]+)(?::\d+)?([/?#]\S*)?$/i);
  return !!m && /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(m[1]);
};

/** Flags a sponsor link that won't open, with a one-click fix where the intent is clear. */
function checkUrl(raw: string): { err: string | null; fix?: string | null } {
  const u = raw.trim();
  if (!u || isWebAddress(u)) return { err: null };
  const m = u.match(/^(https?)[:/]+(.+)$/i);
  const [host, ...rest] = (m ? m[2] : u).replace(/^\/+/, '').split(/(?=[/?#])/);
  // "www,example.com" is a typo for a dot.
  const repaired = `${m ? m[1].toLowerCase() : 'https'}://${host.replace(/,/g, '.').toLowerCase()}${rest.join('')}`;
  const fix = isWebAddress(repaired) ? repaired : null;
  if (!fix) return { err: 'Enter a full web address.', fix: null };
  if (!m) return { err: 'Add https:// to the start.', fix };
  return { err: /^https?:\/\//i.test(u) ? 'This web address has a typo.' : 'This link won’t open — it’s missing “://”.', fix };
}

function Switch({ on, big, label, title, onClick }: { on: boolean; big?: boolean; label: string; title?: string; onClick: () => void }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} title={title} className={`eb-sp-switch ${big ? 'big' : ''} ${on ? 'on' : ''}`} onClick={onClick}><span /></button>;
}

export default function SponsorsManagerV2() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const [footer, setFooter] = useState<'dark' | 'light'>('dark');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [logoMode, setLogoMode] = useState<'upload' | 'url'>('upload');
  const [uploading, setUploading] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const fileInput = useRef<HTMLInputElement>(null);

  const flash = (message: string) => { setToast(message); window.clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToast(null), 2200); };
  const openEdit = (sponsor: Sponsor) => { setDraft(toDraft(sponsor)); setLogoMode('upload'); setFormError(''); };
  const startNew = () => { setDraft(emptyDraft()); setLogoMode('upload'); setFormError(''); };
  const closeEditor = () => { setDraft(null); setFormError(''); };
  const setD = (change: Partial<Draft>) => setDraft((current) => current ? { ...current, ...change } : current);

  const fetchSponsors = async () => {
    try {
      setLoadError('');
      const response = await fetch('/api/highlights/sponsors?active=false');
      if (!response.ok) throw new Error('Failed to load sponsors');
      const data: Sponsor[] = await response.json();
      setSponsors(data);
      return data;
    } catch (caught) {
      setLoadError(caught instanceof Error ? caught.message : 'Failed to load sponsors');
      return [];
    } finally { setLoading(false); }
  };

  useEffect(() => {
    void fetchSponsors().then((data) => { if (data[0]) openEdit(data[0]); else startNew(); });
    return () => window.clearTimeout(toastTimer.current);
  }, []);

  const saveOrder = async (list: Sponsor[]) => {
    try {
      const response = await fetch('/api/highlights/sponsors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reorder: true, ids: list.map((s) => s.id) }) });
      if (!response.ok) throw new Error();
    } catch { flash('Couldn’t save the new order'); void fetchSponsors(); }
  };
  const move = (id: string, delta: number) => {
    const list = [...sponsors];
    const i = list.findIndex((s) => s.id === id); const j = i + delta;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    setSponsors(list); void saveOrder(list);
  };
  const reorder = (fromId: string | null, toId: string) => {
    if (!fromId || fromId === toId) return;
    const list = [...sponsors];
    const [item] = list.splice(list.findIndex((s) => s.id === fromId), 1);
    list.splice(list.findIndex((s) => s.id === toId), 0, item);
    setSponsors(list); void saveOrder(list);
  };

  const toggleVisible = async (sponsor: Sponsor) => {
    const active = !sponsor.active;
    setSponsors((list) => list.map((s) => s.id === sponsor.id ? { ...s, active } : s));
    setDraft((current) => current && current.id === sponsor.id ? { ...current, active } : current);
    try {
      const response = await fetch(`/api/highlights/sponsors/${sponsor.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active }) });
      if (!response.ok) throw new Error();
      flash(active ? `${sponsor.name} is now on the site` : `${sponsor.name} hidden from the site`);
    } catch {
      setSponsors((list) => list.map((s) => s.id === sponsor.id ? { ...s, active: !active } : s));
      setDraft((current) => current && current.id === sponsor.id ? { ...current, active: !active } : current);
      flash('Couldn’t change visibility');
    }
  };

  const uploadLogo = async (file: File) => {
    if (!LOGO_TYPES.split(',').includes(file.type)) { setFormError('Use a PNG, WebP, JPEG or GIF logo.'); return; }
    setFormError(''); setUploading(true);
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 5, maxWidthOrHeight: 1200, useWebWorker: true, initialQuality: 0.85, fileType: file.type });
      const body = new FormData();
      body.append('file', compressed, file.name);
      body.append('folder', 'sponsors');
      const response = await fetch('/api/upload/image', { method: 'POST', body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to upload logo');
      setD({ image: data.url });
    } catch (caught) { setFormError(caught instanceof Error ? caught.message : 'Failed to upload logo'); }
    finally { setUploading(false); if (fileInput.current) fileInput.current.value = ''; }
  };
  const pickLogo = () => { if (!uploading) fileInput.current?.click(); };
  const onDropLogo = (event: DragEvent) => { event.preventDefault(); setDropActive(false); const file = event.dataTransfer.files?.[0]; if (file) void uploadLogo(file); };

  const d = draft ?? emptyDraft();
  const isNew = !!draft && !draft.id;
  const url = checkUrl(d.link);
  const canSave = !!d.name.trim() && !!d.image.trim() && !url.err && !saving && !uploading;

  const save = async () => {
    if (!draft || !canSave) return;
    setSaving(true); setFormError('');
    try {
      const payload = { name: draft.name.trim(), image: draft.image.trim(), link: draft.link.trim() || null, active: draft.active };
      const response = await fetch(isNew ? '/api/highlights/sponsors' : `/api/highlights/sponsors/${draft.id}`, { method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to save sponsor');
      const list = await fetchSponsors();
      const saved = list.find((s) => s.id === (isNew ? data.id : draft.id));
      if (saved) openEdit(saved);
      flash(isNew ? 'Sponsor added' : 'Changes saved');
    } catch (caught) { setFormError(caught instanceof Error ? caught.message : 'Failed to save sponsor'); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (!draft?.id) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/highlights/sponsors/${draft.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete sponsor');
      setConfirmDelete(false); setDraft(null);
      await fetchSponsors();
      flash('Sponsor deleted');
    } catch (caught) { setFormError(caught instanceof Error ? caught.message : 'Failed to delete sponsor'); setConfirmDelete(false); }
    finally { setSaving(false); }
  };

  const heading = (
    <div className="eb-sp-heading">
      <div><div className="eb-sp-eyebrow">Editorial</div><h1>Sponsors</h1><p>Logos shown in the site footer carousel, in the order below.</p></div>
      <button type="button" className="eb-sp-primary" onClick={startNew}><Plus size={14} />Add sponsor</button>
    </div>
  );
  const firstLoad = useFirstLoad(loading);
  if (firstLoad) return <section className="eb-sp">{heading}<SkeletonRegion label="Loading sponsors"><Skeleton h={130} style={{ borderRadius: 16, marginBottom: 20 }} /><div className="eb-skel-split"><div className="eb-skel-region"><SkeletonTable rows={5} columns={2} pill={false} /></div><div className="eb-skel-region"><SkeletonPanel lines={3} fields={4} /></div></div></SkeletonRegion></section>;

  const visible = sponsors.filter((s) => s.active);
  const positions = new Map(visible.map((s, i) => [s.id, i + 1]));
  const counts: Record<Filter, number> = { All: sponsors.length, Visible: visible.length, Hidden: sponsors.length - visible.length };
  const rows = sponsors.map((s, index) => ({ s, index })).filter(({ s }) => filter === 'All' || (filter === 'Visible' ? s.active : !s.active));
  const editorOpen = !!draft;
  const position = draft?.id ? positions.get(draft.id) : undefined;
  const hasLogo = !!d.image.trim();

  return <section className="eb-sp">
    {heading}

    <div className="eb-sp-card eb-sp-preview">
      <div className="eb-sp-preview-head">
        <span className="eb-sp-label">Live footer preview</span>
        <span className="eb-sp-count">{visible.length} of {sponsors.length} visible</span>
        <div className="eb-sp-seg">{(['dark', 'light'] as const).map((mode) => <button type="button" key={mode} className={footer === mode ? 'on' : ''} onClick={() => setFooter(mode)}>{mode === 'dark' ? 'Dark footer' : 'Light footer'}</button>)}</div>
      </div>
      <div className={`eb-sp-preview-strip ${footer}`}>
        <span className="eb-sp-partners">Our partners</span>
        {visible.map((s) => <div key={s.id} className="eb-sp-preview-tile" title={s.name}>{s.image ? <img src={s.image} alt={s.name} /> : <span>{s.name}</span>}</div>)}
        {visible.length === 0 && <span className="eb-sp-preview-empty">No sponsors visible — the carousel is hidden on the site.</span>}
      </div>
    </div>

    {loadError && <div className="eb-sp-alert">{loadError}</div>}

    <div className={`eb-sp-grid ${editorOpen ? 'split' : ''}`}>
      <div className="eb-sp-card">
        <div className="eb-sp-list-head">
          <div className="eb-sp-filters">{(['All', 'Visible', 'Hidden'] as const).map((f) => <button type="button" key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>{f} <span>{counts[f]}</span></button>)}</div>
          <span className="eb-sp-drag-hint"><GripVertical size={13} />Drag to reorder</span>
        </div>
        <div>
          {rows.map(({ s, index }) => {
            const editing = editorOpen && draft?.id === s.id;
            const bad = !!checkUrl(s.link || '').err;
            const pos = positions.get(s.id);
            return <div
              key={s.id}
              draggable
              onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; try { event.dataTransfer.setData('text/plain', s.id); } catch { /* some browsers refuse */ } setDragId(s.id); }}
              onDragOver={(event) => { event.preventDefault(); if (overId !== s.id) setOverId(s.id); }}
              onDrop={(event) => { event.preventDefault(); reorder(dragId, s.id); setDragId(null); setOverId(null); }}
              onDragEnd={() => { setDragId(null); setOverId(null); }}
              className={`eb-sp-row ${editing ? 'editing' : ''} ${s.active ? '' : 'hidden'} ${dragId === s.id ? 'dragging' : ''} ${overId === s.id && dragId && dragId !== s.id ? 'over' : ''}`}
            >
              <span className="eb-sp-grip"><GripVertical size={15} /></span>
              <span className="eb-sp-pos">{pos ? pad(pos) : '—'}</span>
              <div className="eb-sp-logo">{s.image ? <img src={s.image} alt="" draggable={false} /> : <span>{s.name}</span>}</div>
              <div className="eb-sp-meta">
                <div className="eb-sp-name">{s.name}</div>
                <div className={`eb-sp-url ${bad ? 'bad' : ''}`}><span>{!s.link ? 'No link' : bad ? `⚠ ${s.link}` : s.link.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span></div>
              </div>
              <Switch on={s.active} label="Toggle visibility" title={s.active ? 'Visible on site' : 'Hidden from site'} onClick={() => void toggleVisible(s)} />
              <div className="eb-sp-arrows">
                <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => move(s.id, -1)}><ChevronUp size={13} /></button>
                <button type="button" aria-label="Move down" disabled={index === sponsors.length - 1} onClick={() => move(s.id, 1)}><ChevronDown size={13} /></button>
              </div>
              <button type="button" className={`eb-sp-edit ${editing ? 'on' : ''}`} onClick={() => openEdit(s)}>{editing ? 'Editing' : 'Edit'}</button>
            </div>;
          })}
          {rows.length === 0 && <div className="eb-sp-empty"><div>No sponsors here</div><p>Add a sponsor or change the filter.</p></div>}
        </div>
      </div>

      {draft && <div className="eb-sp-card eb-sp-editor">
        <div className="eb-sp-editor-head">
          <div><div className="eb-sp-label">{isNew ? 'New sponsor' : `Position ${position ? pad(position) : '— hidden'}`}</div><div className="eb-sp-editor-title">{isNew ? 'Add sponsor' : (d.name || 'Untitled')}</div></div>
          <button type="button" className="eb-sp-close" aria-label="Close editor" onClick={closeEditor}><X size={14} /></button>
        </div>

        <div className="eb-sp-editor-body">
          <label className="eb-sp-field">
            <span className="eb-sp-field-label">Sponsor name</span>
            <input type="text" value={d.name} onChange={(event) => setD({ name: event.target.value })} placeholder="e.g. Ubalozi Kenya" />
          </label>

          <div className="eb-sp-field">
            <div className="eb-sp-field-row">
              <span className="eb-sp-field-label">Logo</span>
              <div className="eb-sp-seg">{(['upload', 'url'] as const).map((mode) => <button type="button" key={mode} className={logoMode === mode ? 'on' : ''} onClick={() => setLogoMode(mode)}>{mode === 'upload' ? 'Upload' : 'URL'}</button>)}</div>
            </div>
            {hasLogo && <>
              <div className="eb-sp-logo-previews">
                <div className="light"><img src={d.image} alt={`${d.name || 'Sponsor'} logo on a light footer`} /></div>
                <div className="dark"><img src={d.image} alt={`${d.name || 'Sponsor'} logo on a dark footer`} /></div>
              </div>
              <div className="eb-sp-file">
                <span>{uploading ? 'Uploading…' : fileNameOf(d.image)}</span>
                <button type="button" onClick={pickLogo} disabled={uploading}>Replace</button>
                <button type="button" className="danger" onClick={() => setD({ image: '' })} disabled={uploading}>Remove</button>
              </div>
              <span className="eb-sp-hint">Check it reads on both light and dark footers.</span>
            </>}
            {!hasLogo && logoMode === 'upload' && <button
              type="button"
              className={`eb-sp-drop ${dropActive ? 'active' : ''}`}
              onClick={pickLogo}
              disabled={uploading}
              onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); setDropActive(true); }}
              onDragLeave={() => setDropActive(false)}
              onDrop={(event) => { event.stopPropagation(); onDropLogo(event); }}
            >
              <Upload size={20} />
              <strong>{uploading ? 'Uploading logo…' : 'Drop logo or click to upload'}</strong>
              <small>Transparent PNG or WebP · ~600px wide</small>
            </button>}
            {logoMode === 'url' && <input className="mono" type="text" value={d.image} onChange={(event) => setD({ image: event.target.value })} placeholder="https://…/logo.png" />}
            <input ref={fileInput} type="file" accept={LOGO_TYPES} hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadLogo(file); }} />
          </div>

          <label className="eb-sp-field">
            <span className="eb-sp-field-label">Website <em>optional</em></span>
            <input className={`mono ${url.err ? 'invalid' : ''}`} type="text" value={d.link} onChange={(event) => setD({ link: event.target.value })} placeholder="https://example.co.ke" />
            {url.err && <span className="eb-sp-url-error">{url.err}{url.fix && <button type="button" onClick={() => setD({ link: url.fix! })}>Use {url.fix}</button>}</span>}
          </label>

          <div className="eb-sp-visibility">
            <div><strong>Show on website</strong><small>{d.active ? 'Appears in the footer carousel' : 'Saved but hidden from the site'}</small></div>
            <Switch big on={d.active} label="Show on website" onClick={() => setD({ active: !d.active })} />
          </div>

          {formError && <div className="eb-sp-alert">{formError}</div>}
        </div>

        <div className="eb-sp-editor-foot">
          {!isNew && <button type="button" className="eb-sp-delete" onClick={() => setConfirmDelete(true)} disabled={saving}>Delete</button>}
          <button type="button" className="eb-sp-cancel" onClick={closeEditor}>Cancel</button>
          <button type="button" className="eb-sp-save" disabled={!canSave} onClick={() => void save()}>{saving ? 'Saving…' : isNew ? 'Add sponsor' : 'Save changes'}</button>
        </div>
      </div>}
    </div>

    <Presence>{confirmDelete && draft && <ActionDialog
      eyebrow="Delete sponsor"
      title={`Delete ${draft.name || 'this sponsor'}?`}
      body="Their logo comes off the footer carousel straight away. This can’t be undone — hide the sponsor instead if they might return."
      confirmLabel="Delete sponsor"
      danger
      busy={saving}
      onConfirm={() => void remove()}
      onCancel={() => setConfirmDelete(false)}
    />}</Presence>

    {toast && <div className="eb-sp-toast" role="status">{toast}</div>}
  </section>;
}
