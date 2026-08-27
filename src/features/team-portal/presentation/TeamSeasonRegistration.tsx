import { useEffect, useState } from 'react';
import { AlertCircle, CalendarDays, Check, FileText, Send, Trophy } from 'lucide-react';

type Option = { id: string; seasonName: string; leagueName: string; status: string; registrationOpensAt: string | null; registrationClosesAt: string | null };
type HistoryRow = { id: string; seasonName: string; leagueName: string; status: string; date: string };
const inputClass = 'w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 font-body text-[13px] text-cream outline-none transition placeholder:text-[#6f665c] focus:border-brand focus:ring-2 focus:ring-brand/[0.15] portal-registration-input';

export default function TeamSeasonRegistration({ teamId, teamName }: { teamId: string; teamName: string }) {
  const [options, setOptions] = useState<Option[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [activeSeasonName, setActiveSeasonName] = useState('');
  const [registrationClosed, setRegistrationClosed] = useState(false);
  const [closedMessage, setClosedMessage] = useState<string | null>(null);
  const [editionId, setEditionId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ seasonName: string; leagueName: string } | null>(null);

  useEffect(() => {
    fetch(`/api/team-portal/registration?teamId=${encodeURIComponent(teamId)}`)
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to load registration options.'); return data as Option[]; })
    .then((data) => { setOptions(data.options); setHistory(data.history); setEditionId(data.options[0]?.id ?? ''); setActiveSeasonName(data.activeSeason?.name ?? ''); setRegistrationClosed(data.registrationClosed); setClosedMessage(data.closedMessage); })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load registration options.'))
      .finally(() => setLoading(false));
  }, [teamId]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editionId) return;
    setSubmitting(true); setError(null);
    try {
      const response = await fetch('/api/team-portal/registration', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teamId, leagueSeasonId: editionId, notes: notes.trim() || undefined }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to submit registration.');
      setSubmitted(data); setNotes('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to submit registration.'); } finally { setSubmitting(false); }
  }

  if (submitted) return <section className="portal-panel rounded-2xl border border-white/[0.08] bg-[#111010] p-8 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#4ea36a]/[0.14] text-[#4ea36a]"><Check size={24} /></span><p className="mt-4 font-mono text-[10px] uppercase tracking-[0.15em] text-brandsoft">Registration received</p><h2 className="mt-2 font-display text-[27px] uppercase text-cream">{teamName} is awaiting review</h2><p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-[#8a817a]">Your {submitted.seasonName} · {submitted.leagueName} registration request was sent to System Admins. The team will be added to the season after approval.</p></section>;

  return <><section className="portal-panel overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111010]"><div className="border-b border-white/[0.06] px-5 py-5"><p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-brandsoft">Team registration</p><h2 className="font-display text-[27px] uppercase text-cream">Register {teamName}</h2><p className="mt-1 text-[13px] text-[#8a817a]">Submit this team for the active season. System Admin approval is required before activation.</p></div><form onSubmit={submit} className="grid gap-5 p-5">{error && <div className="flex items-start gap-2 rounded-xl border border-brand/30 bg-brand/[0.08] px-3.5 py-3 text-[13px] text-[#ff9aaa]"><AlertCircle size={17} className="mt-0.5 flex-shrink-0" /><span>{error}</span></div>}{loading ? <p className="text-[13px] text-[#8a817a]">Loading active season…</p> : options.length === 0 ? <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-5 text-[13px] text-[#8a817a]">{registrationClosed ? (closedMessage || 'Registration is currently closed.') : 'No available registration option was found for the active season. Existing registrations and requests are excluded.'}</div> : <><div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3"><span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-[#8a817a]">Active season</span><strong className="mt-1 block text-[14px] text-cream">{activeSeasonName}</strong></div><label className="block"><span className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8a817a]"><Trophy size={13} className="text-brand" />League edition</span><select className={inputClass} value={editionId} onChange={(event) => setEditionId(event.target.value)} required><option value="">Select a league edition</option>{options.map((option) => <option value={option.id} key={option.id}>{option.leagueName}</option>)}</select></label><label className="block"><span className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8a817a]"><FileText size={13} className="text-brand" />Notes for System Admins</span><textarea className={`${inputClass} resize-y`} rows={5} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add any context about this season entry…" /></label><div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] pt-5"><div className="flex items-center gap-2 text-[12px] text-[#8a817a]"><CalendarDays size={15} className="text-brand" />Registration is subject to review</div><button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-[12px] font-bold uppercase tracking-[0.05em] text-white disabled:cursor-not-allowed disabled:opacity-60"><Send size={14} />{submitting ? 'Submitting…' : 'Submit registration'}</button></div></>}</form></section><section className="portal-panel mt-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111010]"><div className="border-b border-white/[0.06] px-5 py-4"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-brandsoft">Team history</p><h2 className="mt-1 font-display text-[22px] uppercase text-cream">Registration history</h2></div>{history.length === 0 ? <p className="px-5 py-6 text-[13px] text-[#8a817a]">No season registration history for this team yet.</p> : <div className="divide-y divide-white/[0.06]">{history.map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><strong className="block text-[13px] text-cream">{row.seasonName} · {row.leagueName}</strong><span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.08em] text-[#8a817a]">Submitted {new Date(row.date).toLocaleDateString()}</span></div><span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[#b8afa6]">{row.status.replaceAll('_', ' ')}</span></div>)}</div>}</section></>;
}
