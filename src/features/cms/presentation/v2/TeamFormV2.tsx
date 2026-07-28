import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, Link2, Plus, RefreshCw, Save, Star, Trash2, Upload } from 'lucide-react';

type Registration = {
  seasonId: string;
  leagueSeasonId: string;
  season: string;
  league: string;
  structure: string;
  conferenceId: string | null;
  featured: boolean;
  status: string;
  conferences: Array<{ id: string; name: string }>;
};

type TeamFormState = {
  name: string;
  shortName: string;
  abbreviation: string;
  slug: string;
  venue: string;
  city: string;
  founded: string;
  contactEmail: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  description: string;
  approved: boolean;
};

const emptyForm: TeamFormState = {
  name: '', shortName: '', abbreviation: '', slug: '', venue: '', city: '', founded: '',
  contactEmail: '', logo: '', primaryColor: '#e4002b', secondaryColor: '#ffffff',
  description: '', approved: true,
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[()]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function asState(team: Record<string, any>): TeamFormState {
  return {
    name: team.name ?? '', shortName: team.shortName ?? '', abbreviation: team.abbreviation ?? '',
    slug: team.slug ?? '', venue: team.venue ?? '', city: team.city ?? '',
    founded: team.founded ? String(team.founded) : '', contactEmail: team.contactEmail ?? '',
    logo: team.logo ?? '', primaryColor: team.primaryColor ?? '#e4002b',
    secondaryColor: team.secondaryColor ?? '#ffffff', description: team.description ?? '',
    approved: Boolean(team.approved),
  };
}

export default function TeamFormV2({ teamId }: { teamId?: string }) {
  const [form, setForm] = useState<TeamFormState>(emptyForm);
  const [initial, setInitial] = useState<TeamFormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [logoTab, setLogoTab] = useState<'upload' | 'url'>('upload');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(Boolean(teamId));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadRegistrations = useCallback(async (id: string) => {
    const seasonResponse = await fetch('/api/seasons');
    if (!seasonResponse.ok) return;
    const seasonRows = await seasonResponse.json();
    setSeasons(seasonRows);
    const rows: Registration[] = [];
    await Promise.all(seasonRows.map(async (season: any) => {
      const response = await fetch(`/api/seasons/${season.id}/teams`);
      if (!response.ok) return;
      const teams = await response.json();
      for (const row of teams) {
        if (row.id !== id) continue;
        const leagueSeason = season.leagueSeasons?.find((entry: any) => entry.id === row.leagueSeasonId);
        rows.push({
          seasonId: season.id, leagueSeasonId: row.leagueSeasonId, season: season.name,
          league: leagueSeason?.league?.name ?? 'League',
          structure: leagueSeason?.competitionStructure ?? 'single',
          conferenceId: row.conferenceId ?? null, featured: Boolean(row.featured),
          status: leagueSeason?.status ?? 'Active',
          conferences: (season.conferences ?? []).filter((conference: any) => !leagueSeason || conference.leagueSeasonId === leagueSeason.id),
        });
      }
    }));
    setRegistrations(rows);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (teamId) {
          const response = await fetch(`/api/teams/${teamId}`);
          if (!response.ok) throw new Error('Failed to load team');
          const loaded = asState(await response.json());
          if (active) { setForm(loaded); setInitial(loaded); setSlugTouched(true); }
          await loadRegistrations(teamId);
        } else if (active) {
          const response = await fetch('/api/seasons');
          if (response.ok) setSeasons(await response.json());
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Failed to load team');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [loadRegistrations, teamId]);

  const update = <K extends keyof TeamFormState>(key: K, value: TeamFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const uploadLogo = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) { setError('Logo must be 2 MB or smaller.'); return; }
    setUploadingLogo(true); setError('');
    try {
      const payload = new FormData();
      payload.append('file', file, file.name);
      payload.append('folder', 'teams');
      const response = await fetch('/api/upload/image', { method: 'POST', body: payload });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Failed to upload logo');
      update('logo', body.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to upload logo');
    } finally { setUploadingLogo(false); }
  };

  const nameError = form.name.trim().length < 3 ? 'Use at least 3 characters.' : '';
  const abbreviationError = form.abbreviation && (form.abbreviation.length < 3 || form.abbreviation.length > 5) ? 'Use 3–5 letters.' : '';
  const colorError = !/^#[0-9a-f]{6}$/i.test(form.primaryColor) || !/^#[0-9a-f]{6}$/i.test(form.secondaryColor);
  const bioTooLong = form.description.length > 280;
  const blocking = Boolean(nameError || abbreviationError || colorError || bioTooLong);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const previewName = form.shortName || form.name || 'Untitled team';

  const save = async () => {
    if (!teamId || blocking || !dirty) return;
    setSaving(true); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, founded: form.founded ? Number(form.founded) : null, description: form.description || null }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Failed to save team');
      const saved = asState(body);
      setForm(saved); setInitial(saved); setMessage('Changes saved successfully.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to save team');
    } finally { setSaving(false); }
  };

  const create = async () => {
    if (blocking || !form.name.trim()) return;
    setSaving(true); setError('');
    try {
      const response = await fetch('/api/teams', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, founded: form.founded ? Number(form.founded) : undefined, description: form.description || undefined }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Failed to create team');
      window.location.href = `/admin/teams/${body.id}`;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to create team');
    } finally { setSaving(false); }
  };

  const addRegistration = async () => {
    if (!teamId) { setError('Save the team before adding a registration.'); return; }
    const existing = new Set(registrations.map((row) => row.leagueSeasonId));
    const candidate = seasons.flatMap((season) => (season.leagueSeasons ?? []).map((leagueSeason: any) => ({ season, leagueSeason }))).find((entry) => !existing.has(entry.leagueSeason.id));
    if (!candidate) { setError('This team is already registered in every available competition edition.'); return; }
    const response = await fetch(`/api/seasons/${candidate.season.id}/teams`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leagueSeasonId: candidate.leagueSeason.id, teamIds: [teamId] }) });
    if (!response.ok) { setError((await response.json().catch(() => ({}))).error || 'Failed to add registration'); return; }
    await loadRegistrations(teamId);
  };

  const removeRegistration = async (row: Registration) => {
    if (!teamId || !window.confirm(`Remove this team from ${row.season}?`)) return;
    const response = await fetch(`/api/seasons/${row.seasonId}/teams/${teamId}?leagueSeasonId=${encodeURIComponent(row.leagueSeasonId)}`, { method: 'DELETE' });
    if (!response.ok) { setError('Failed to remove registration'); return; }
    await loadRegistrations(teamId);
  };

  const updateRegistration = async (row: Registration, patch: Record<string, unknown>) => {
    if (!teamId) return;
    const response = await fetch(`/api/seasons/${row.seasonId}/teams/${teamId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leagueSeasonId: row.leagueSeasonId, ...patch }) });
    if (!response.ok) { setError('Failed to update registration'); return; }
    setRegistrations((current) => current.map((item) => item.leagueSeasonId === row.leagueSeasonId ? { ...item, ...patch } as Registration : item));
  };

  const checklist = useMemo(() => [
    ['Name and short name set', !nameError && Boolean(form.shortName.trim())],
    ['Crest uploaded', Boolean(form.logo)],
    ['Registered in a LeagueSeason', registrations.length > 0],
    ['About text under 280 chars', form.description.length > 0 && !bioTooLong],
    ['Team colours are valid hex', !colorError],
  ] as Array<[string, boolean]>, [bioTooLong, colorError, form.description.length, form.logo, form.shortName, nameError, registrations.length]);

  if (loading) return <div className="eb-form-loading"><div /><div /><div /></div>;

  return (
    <div className="eb-team-form">
      <div className="eb-form-breadcrumb"><a href="/admin/teams">Teams</a><span>/</span>{teamId && <><a href={`/admin/teams/view/${teamId}`}>{form.name || 'Team'}</a><span>/</span></>}<strong>{teamId ? 'Edit' : 'New team'}</strong></div>
      <div className="eb-form-heading"><div><div className="eb-form-eyebrow">Competition · Teams</div><h1>{teamId ? 'Edit team' : 'Create team'}</h1><p>Identity and branding live here. League and staff are relations—manage them in Registrations and Staff.</p></div><div className="eb-form-heading-actions"><span className={`eb-form-dirty ${dirty ? 'dirty' : ''}`}><i />{dirty ? 'Unsaved changes' : 'All changes saved'}</span><a href={teamId ? `/admin/teams/view/${teamId}` : '/admin/teams'}><ArrowLeft size={14} /> Back to team</a></div></div>

      {(error || message) && <div className={`eb-form-alert ${error ? 'error' : 'success'}`}>{error || message}</div>}

      <div className="eb-form-layout">
        <main className="eb-form-main">
          <section className="eb-form-card"><FormSection title="Identity" description="How this team is named across the public site and standings."><div className="eb-form-grid">
            <Field className="wide" label="Team name" required error={nameError}><input value={form.name} onChange={(e) => { const name = e.target.value; update('name', name); if (!slugTouched) update('slug', slugify(name)); }} placeholder="e.g. Alliance Girls High School (Queens)" /></Field>
            <Field label="Short name" hint={`${form.shortName.length}/18`}><input maxLength={18} value={form.shortName} onChange={(e) => update('shortName', e.target.value)} placeholder="AGHS Queens" /><small>Used in tables and fixtures.</small></Field>
            <Field label="Abbreviation" error={abbreviationError}><input maxLength={5} value={form.abbreviation} onChange={(e) => update('abbreviation', e.target.value.toUpperCase())} placeholder="AGHS" /><small>3–5 letters, shown on scoreboards.</small></Field>
            <Field className="wide" label="URL slug"><div className="eb-form-slug"><span>elevateballers.com/teams/</span><input value={form.slug} onChange={(e) => { setSlugTouched(true); update('slug', slugify(e.target.value)); }} /><button type="button" onClick={() => { setSlugTouched(false); update('slug', slugify(form.name)); }}>Reset</button></div></Field>
            <Field label="Home venue"><input value={form.venue} onChange={(e) => update('venue', e.target.value)} placeholder="Nyayo Gymnasium" /></Field><Field label="City"><input value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Nairobi" /></Field>
            <Field label="Founded"><input type="number" value={form.founded} onChange={(e) => update('founded', e.target.value)} placeholder="1948" /></Field><Field label="Contact email"><input type="email" value={form.contactEmail} onChange={(e) => update('contactEmail', e.target.value)} placeholder="sports@aghs.ac.ke" /><small>Admin-only contact information.</small></Field>
          </div></FormSection></section>

          <section className="eb-form-card"><FormSection title="Branding" description="Crest and colours. PNG or SVG, square, at least 512×512."><div className="eb-branding-layout"><div className="eb-crest-preview">{form.logo ? <img src={form.logo} alt="Team crest" /> : <span>{form.abbreviation || '—'}</span>}<small>Crest · square</small></div><div className="eb-branding-controls"><div className="eb-form-tabs"><button type="button" className={logoTab === 'upload' ? 'active' : ''} onClick={() => setLogoTab('upload')}>Upload image</button><button type="button" className={logoTab === 'url' ? 'active' : ''} onClick={() => setLogoTab('url')}><Link2 size={13} /> Use a URL</button></div>{logoTab === 'upload' ? <label className={`eb-upload-zone ${uploadingLogo ? 'uploading' : ''}`}><Upload size={22} /><strong>{uploadingLogo ? 'Uploading…' : <>Drop an image or <span>browse</span></>}</strong><small>PNG, SVG or JPG · max 2 MB</small><input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadLogo(file); e.currentTarget.value = ''; }} /></label> : <input value={form.logo} onChange={(e) => update('logo', e.target.value)} placeholder="https://…/crest.png" />}
            <div className="eb-colours"><label>Team colours</label><div><ColorInput label="Primary" value={form.primaryColor} onChange={(value) => update('primaryColor', value)} /><ColorInput label="Secondary" value={form.secondaryColor} onChange={(value) => update('secondaryColor', value)} /><span className="eb-colour-swatch"><i style={{ background: form.primaryColor }} /><i style={{ background: form.secondaryColor }} /></span><button type="button" onClick={() => setForm((current) => ({ ...current, primaryColor: current.secondaryColor, secondaryColor: current.primaryColor }))}>Swap</button></div><small>Used for crest fallback, standings accents and kit dots.</small></div></div></div></FormSection></section>

          <section className="eb-form-card"><div className="eb-form-card-heading"><div><h2>Registrations</h2><p>One record per competition edition. Conference is editable only when the edition uses conferences.</p></div><button type="button" onClick={addRegistration}><Plus size={14} /> Add registration</button></div><div className="eb-registration-list">{registrations.length === 0 ? <div className="eb-form-empty"><strong>No registrations yet</strong><p>This team will not appear in standings until it joins a LeagueSeason.</p></div> : registrations.map((row) => <div className="eb-registration" key={row.leagueSeasonId}><div><strong>{row.season}</strong><small>{row.league} · {row.structure.replaceAll('_', ' ')}</small></div>{row.conferences.length > 0 && <div className="eb-conference-pills">{row.conferences.map((conference) => <button className={row.conferenceId === conference.id ? 'active' : ''} key={conference.id} onClick={() => updateRegistration(row, { conferenceId: conference.id })}>{conference.name}</button>)}</div>}{row.conferences.length === 0 && <span className="eb-single-table">Single table · no conference</span>}<span className="eb-registration-status"><i />{row.status}</span><button className={`eb-feature-registration ${row.featured ? 'active' : ''}`} onClick={() => updateRegistration(row, { featured: !row.featured })} title="Feature in this season"><Star size={14} fill={row.featured ? 'currentColor' : 'none'} /></button><button className="eb-remove-registration" onClick={() => removeRegistration(row)}><Trash2 size={13} /> Remove</button></div>)}</div></section>

          <section className="eb-form-card"><FormSection title="About" description="Shown on the public team page. Keep it to a short paragraph."><textarea className="eb-form-about-textarea" rows={4} maxLength={280} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Two or three sentences about the programme, honours and playing style." /><div className="eb-form-counter"><span>Plain text · no league or staff details needed here</span><span className={bioTooLong ? 'invalid' : ''}>{form.description.length}/280</span></div></FormSection></section>
        </main>

        <aside className="eb-form-rail"><div className="eb-form-side-card"><header>Live preview</header><div className="eb-preview-content"><div className="eb-preview-team"><span style={{ background: `${form.primaryColor}22`, color: form.primaryColor, borderColor: `${form.secondaryColor}66` }}>{form.logo ? <img src={form.logo} alt="" /> : form.abbreviation || '—'}</span><div><strong>{previewName}</strong><small>/{form.slug || '—'}</small></div></div><dl><dt>Venue</dt><dd>{form.venue || '—'}</dd><dt>City</dt><dd>{form.city || '—'}</dd><dt>Registered</dt><dd>{registrations.length} edition{registrations.length === 1 ? '' : 's'}</dd></dl></div></div><div className="eb-form-side-card"><header>Team status</header><div className="eb-status-controls"><StatusToggle label="Approved" description="Visible on the public site" value={form.approved} onChange={(value) => update('approved', value)} /><div className="eb-updated">Contact email is kept private and visible only to administrators.</div></div></div><div className="eb-form-side-card"><header>Checklist</header><div className="eb-checklist">{checklist.map(([label, ok]) => <div key={label} className={ok ? 'ok' : ''}><span>{ok ? <Check size={11} /> : '!'}</span>{label}</div>)}</div></div></aside>
      </div>

      <div className="eb-form-savebar"><span className={blocking ? 'invalid' : ''}>{blocking ? 'Fix the highlighted field before saving.' : dirty ? 'Changes apply to the public team page immediately.' : 'Nothing to save.'}</span><div><button type="button" onClick={() => { setForm(initial); setError(''); }} disabled={!dirty}><RefreshCw size={14} /> Revert changes</button><a href={teamId ? `/admin/teams/view/${teamId}` : '/admin/teams'}>Cancel</a><button type="button" className="primary" onClick={teamId ? save : create} disabled={saving || blocking || (!dirty && Boolean(teamId))}><Save size={14} /> {saving ? 'Saving…' : teamId ? 'Save changes' : 'Create team'}</button></div></div>
    </div>
  );
}

function FormSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <><div className="eb-form-card-heading"><div><h2>{title}</h2><p>{description}</p></div></div><div className="eb-form-card-body">{children}</div></>; }
function Field({ label, required, hint, error, className = '', children }: { label: string; required?: boolean; hint?: string; error?: string; className?: string; children: React.ReactNode }) { return <label className={`eb-form-field ${className}`}><span>{label}{required && <em>*</em>}{hint && <b>{hint}</b>}</span>{children}{error ? <small className="invalid">{error}</small> : null}</label>; }
function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="eb-color-input"><input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'} onChange={(e) => onChange(e.target.value)} /><span><small>{label}</small><input value={value} onChange={(e) => onChange(e.target.value)} maxLength={7} /></span></label>; }
function StatusToggle({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (value: boolean) => void }) { return <div className="eb-status-toggle"><div><strong>{label}</strong><small>{description}</small></div><button type="button" className={value ? 'active' : ''} onClick={() => onChange(!value)}><i /></button></div>; }
