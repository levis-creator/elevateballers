import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  ClipboardList,
  FileText,
  LockKeyhole,
  Send,
  Trophy,
} from 'lucide-react';

type Option = {
  id: string;
  seasonName: string;
  leagueName: string;
  status: string;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
};
type HistoryRow = {
  id: string;
  seasonName: string;
  leagueName: string;
  status: string;
  date: string;
};
const inputClass =
  'portal-registration-input w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 font-body text-[13px] text-cream outline-none transition placeholder:text-[#6f665c] focus:border-brand focus:ring-2 focus:ring-brand/[0.15]';
function formatDate(value: string | null | undefined) {
  return value
    ? new Date(value).toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Not configured';
}
const registrationStyles = `.portal-registration-card{background:#111010;border-color:rgba(255,255,255,.08)}.portal-registration-input{background:rgba(255,255,255,.03);border-color:rgba(255,255,255,.08);color:#f3efe9}.portal-registration-input::placeholder{color:#5f574e}.portal-light .portal-registration-card{background:#fff!important;border-color:#e6e1d8!important}.portal-light .portal-registration-input{background:#f4f1ea!important;border-color:#e6e1d8!important;color:#141009!important}.portal-light .portal-registration-card .text-cream{color:#141009!important}.portal-light .portal-registration-card .text-\[\\#b8afa6\\]{color:#4a443d!important}.portal-light .portal-registration-card .text-\[\\#8a817a\\]{color:#6f665c!important}.portal-light .portal-registration-card .text-\[\\#5f574e\\]{color:#9a9084!important}`;

export default function TeamSeasonRegistration({
  teamId,
  teamName,
}: {
  teamId: string;
  teamName: string;
}) {
  const [options, setOptions] = useState<Option[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [activeSeasonName, setActiveSeasonName] = useState('');
  const [windowOpensAt, setWindowOpensAt] = useState<string | null>(null);
  const [windowClosesAt, setWindowClosesAt] = useState<string | null>(null);
  const [registrationClosed, setRegistrationClosed] = useState(false);
  const [closedMessage, setClosedMessage] = useState<string | null>(null);
  const [editionId, setEditionId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{
    id: string;
    status: string;
    seasonName: string;
    leagueName: string;
  } | null>(null);
  const [waitlisted, setWaitlisted] = useState(false);
  useEffect(() => {
    fetch(`/api/team-portal/registration?teamId=${encodeURIComponent(teamId)}`, {
      cache: 'no-store',
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load registration options.');
        return data;
      })
      .then((data) => {
        const nextOptions = Array.isArray(data.options) ? data.options : [];
        const nextHistory: HistoryRow[] = Array.isArray(data.history) ? data.history : [];
        const pendingEntry = nextHistory.find(
          (row) => row.status === 'PENDING' || row.status === 'OWNERSHIP_VERIFICATION'
        );
        setOptions(nextOptions);
        setHistory(nextHistory);
        setEditionId(nextOptions[0]?.id ?? '');
        setActiveSeasonName(data.activeSeason?.name ?? '');
        setWindowOpensAt(data.registrationWindow?.opensAt ?? null);
        setWindowClosesAt(data.registrationWindow?.closesAt ?? null);
        setRegistrationClosed(data.registrationClosed);
        setClosedMessage(data.closedMessage);
        if (pendingEntry) {
          setSubmitted({
            id: pendingEntry.id,
            status: pendingEntry.status,
            seasonName: pendingEntry.seasonName,
            leagueName: pendingEntry.leagueName,
          });
        }
      })
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : 'Unable to load registration options.')
      )
      .finally(() => setLoading(false));
  }, [teamId]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editionId) {
      setError('There is no active season registration option available for this team.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/team-portal/registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          leagueSeasonId: editionId,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to submit registration.');
      setSubmitted(data);
      setHistory((current) => [
        {
          id: data.id,
          seasonName: data.seasonName,
          leagueName: data.leagueName,
          status: data.status,
          date: new Date().toISOString(),
        },
        ...current,
      ]);
      setNotes('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to submit registration.');
    } finally {
      setSubmitting(false);
    }
  }
  if (submitted)
    return (
      <div className="grid gap-4">
        <style>{registrationStyles}</style>
        <StatusBand
          title="Awaiting admin approval"
          eyebrow="Entry sent"
          body={`${teamName} was sent for ${submitted.seasonName} · ${submitted.leagueName}. Nothing is confirmed until a System Admin approves the entry.`}
          icon={<Check size={20} />}
          tone="success"
          statusLabel="Under review"
        />
        <div className="grid items-start gap-4 min-[980px]:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <div className="grid gap-4">
            <SubmittedSummary teamName={teamName} submitted={submitted} />
            <History history={history} />
          </div>
          <div className="grid gap-4">
            <EntryWindow
              activeSeasonName={submitted.seasonName}
              opensAt={windowOpensAt}
              closesAt={windowClosesAt}
              closed={false}
            />
            <Requirements teamName={teamName} closed={false} />
          </div>
        </div>
      </div>
    );
  const selectedOption = options.find((option) => option.id === editionId) ?? options[0];
  const isOpen = !loading && options.length > 0;
  const title = registrationClosed
    ? 'Registration window closed'
    : isOpen
      ? `Ready to enter ${activeSeasonName}`
      : 'No registration option available';
  const body = registrationClosed
    ? closedMessage || 'Registration is currently closed.'
    : isOpen
      ? 'Submit this team for the active season. Your entry is sent to System Admins for approval before the team is added.'
      : 'This team is already registered or has a pending entry for the active season.';
  return (
    <div className="grid gap-4">
      <style>{registrationStyles}</style>
      <StatusBand
        title={title}
        eyebrow={registrationClosed ? 'Window closed' : isOpen ? 'Window open' : 'Team entry'}
        body={body}
        icon={registrationClosed ? <LockKeyhole size={20} /> : <ClipboardList size={20} />}
        tone={registrationClosed ? 'brand' : 'success'}
        option={selectedOption}
      />
      <>
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-brand/30 bg-brand/[0.08] px-3.5 py-3 text-[13px] text-[#ff9aaa]">
            <AlertCircle size={17} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {loading ? (
          <section className="portal-registration-card rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-6 text-[13px] text-[#8a817a]">
            Loading the active season entry window…
          </section>
        ) : (
          <div className="grid items-start gap-4 min-[980px]:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
            <div className="grid gap-4">
              {isOpen && (
                <EntryForm
                  editionId={editionId}
                  options={options}
                  notes={notes}
                  setEditionId={setEditionId}
                  setNotes={setNotes}
                  onSubmit={submit}
                  submitting={submitting}
                />
              )}
              {!isOpen && registrationClosed && (
                <Waitlist waitlisted={waitlisted} onJoin={() => setWaitlisted(true)} />
              )}
              {!isOpen && !registrationClosed && (
                <section className="portal-registration-card rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-5 text-[12.5px] text-[#8a817a]">
                  There is no new entry to submit for this team in the active season.
                </section>
              )}
              <History history={history} />
            </div>
            <div className="grid gap-4">
              <EntryWindow
                option={selectedOption}
                activeSeasonName={activeSeasonName}
                opensAt={windowOpensAt}
                closesAt={windowClosesAt}
                closed={registrationClosed}
              />
              <Requirements teamName={teamName} closed={registrationClosed} />
            </div>
          </div>
        )}
      </>
    </div>
  );
}

function StatusBand({
  title,
  eyebrow,
  body,
  icon,
  tone,
  option,
  statusLabel,
}: {
  title: string;
  eyebrow: string;
  body: string;
  icon: React.ReactNode;
  tone: 'success' | 'brand';
  option?: Option;
  statusLabel?: string;
}) {
  return (
    <section
      className={`portal-registration-card overflow-hidden rounded-2xl border bg-white/[0.02] ${tone === 'brand' ? 'border-brand/30' : 'border-white/[0.08]'}`}
    >
      <div className="flex flex-wrap items-start gap-4 px-5 py-5">
        <span
          className={`flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-xl ${tone === 'brand' ? 'bg-brand/[0.14] text-brand' : 'bg-[#4ea36a]/[0.14] text-[#4ea36a]'}`}
        >
          {icon}
        </span>
        <div className="min-w-[250px] flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
            <span
              className={`font-mono text-[9.5px] uppercase tracking-[0.16em] ${tone === 'brand' ? 'text-brand' : 'text-[#4ea36a]'}`}
            >
              {eyebrow}
            </span>
            <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[#8a817a]">
              {statusLabel || (tone === 'brand' ? 'Missed' : 'Ready')}
            </span>
          </div>
          <h2 className="font-display text-[23px] uppercase leading-[1.05] text-cream">{title}</h2>
          <p className="mt-2 max-w-[620px] text-[13px] leading-relaxed text-[#8a817a]">{body}</p>
        </div>
        {option && (
          <div className="flex flex-col items-end gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#5f574e]">
              Active season
            </span>
            <span className="font-display text-[18px] leading-none text-cream">
              {option.seasonName}
            </span>
            <span className="font-mono text-[9.5px] text-[#8a817a]">
              Closes {formatDate(option.registrationClosesAt)}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

function SubmittedSummary({
  teamName,
  submitted,
}: {
  teamName: string;
  submitted: { status: string; seasonName: string; leagueName: string };
}) {
  return (
    <section className="portal-registration-card overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-[#5f574e]">
          What you sent
        </div>
        <h3 className="mt-1 font-display text-[19px] uppercase leading-none text-cream">
          Entry submitted
        </h3>
      </div>
      <div className="grid gap-0 px-5 py-2">
        <SubmittedRow label="Team" value={teamName} />
        <SubmittedRow
          label="League edition"
          value={`${submitted.leagueName} · ${submitted.seasonName}`}
        />
        <SubmittedRow
          label="Status"
          value={submitted.status === 'PENDING' ? 'Awaiting admin approval' : submitted.status}
        />
      </div>
      <div className="border-t border-white/[0.06] px-5 py-4 text-[11.5px] leading-relaxed text-[#8a817a]">
        Your entry is with the league office. It will not become active until a System Admin reviews
        it.
      </div>
    </section>
  );
}

function SubmittedRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] py-3 last:border-b-0">
      <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#5f574e]">
        {label}
      </span>
      <span className="text-right text-[12.5px] font-semibold text-cream">{value}</span>
    </div>
  );
}

function EntryForm({
  editionId,
  options,
  notes,
  setEditionId,
  setNotes,
  onSubmit,
  submitting,
}: {
  editionId: string;
  options: Option[];
  notes: string;
  setEditionId: (value: string) => void;
  setNotes: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  submitting: boolean;
}) {
  return (
    <section className="portal-registration-card overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <h3 className="font-display text-[17px] uppercase leading-none text-cream">Season entry</h3>
        <p className="mt-1 text-[12px] text-[#8a817a]">
          Sent to the league office for approval. Nothing is confirmed until your team is approved.
        </p>
      </div>
      <form onSubmit={onSubmit} className="grid gap-4 px-5 py-5">
        <label>
          <span className="mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.14em] text-[#8a817a]">
            League edition
          </span>
          <div className="relative">
            <Trophy
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand"
              size={15}
            />
            <select
              className={`${inputClass} pl-9`}
              value={editionId}
              onChange={(event) => setEditionId(event.target.value)}
              required
            >
              {options.map((option) => (
                <option value={option.id} key={option.id}>
                  {option.leagueName}
                </option>
              ))}
            </select>
          </div>
          <span className="mt-1.5 block text-[11px] text-[#5f574e]">
            Only editions available for this team are listed.
          </span>
        </label>
        <label>
          <span className="mb-1.5 flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-[#8a817a]">
            <FileText size={13} className="text-brand" />
            Notes for the league office
          </span>
          <textarea
            className={`${inputClass} resize-y`}
            rows={5}
            maxLength={400}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Dates you cannot play, venue context, or anything the office should know before the draw."
          />
          <span className="mt-1.5 flex justify-between text-[11px] text-[#5f574e]">
            <span>Optional. Read by System Admins, never published.</span>
            <span className="font-mono">{notes.length} / 400</span>
          </span>
        </label>
        <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-4">
          <span className="min-w-[180px] flex-1 text-[11.5px] text-[#8a817a]">
            This is a proposal. An admin approves it before your team enters the draw.
          </span>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-3 text-[11px] font-bold uppercase tracking-[0.05em] text-white disabled:opacity-60"
          >
            <Send size={14} />
            {submitting ? 'Sending…' : 'Send for approval'}
          </button>
        </div>
      </form>
    </section>
  );
}

function Waitlist({ waitlisted, onJoin }: { waitlisted: boolean; onJoin: () => void }) {
  return (
    <section className="portal-registration-card overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <h3 className="font-display text-[17px] uppercase leading-none text-cream">
          Get in line early
        </h3>
        <p className="mt-1 text-[12px] text-[#8a817a]">
          Join the list and we’ll contact you when the next registration window opens.
        </p>
      </div>
      <div className="grid gap-4 px-5 py-5">
        <div className="grid gap-2.5 text-[12.5px] text-[#b8afa6]">
          <div className="flex items-start gap-2.5">
            <Check size={15} className="mt-0.5 flex-shrink-0 text-[#4ea36a]" />
            <span>Places are offered in the order teams join the list.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <Check size={15} className="mt-0.5 flex-shrink-0 text-[#4ea36a]" />
            <span>Joining the list does not commit your team to registration.</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-4">
          <span className="min-w-[180px] flex-1 text-[11.5px] text-[#8a817a]">
            {waitlisted ? 'You are on the waitlist.' : 'One tap. No form.'}
          </span>
          <button
            type="button"
            disabled={waitlisted}
            onClick={onJoin}
            className="rounded-xl bg-brand px-4 py-3 text-[11px] font-bold uppercase tracking-[0.05em] text-white disabled:opacity-60"
          >
            {waitlisted ? 'On the waitlist ✓' : 'Join the waitlist'}
          </button>
        </div>
      </div>
    </section>
  );
}

function EntryWindow({
  option,
  activeSeasonName,
  opensAt,
  closesAt,
  closed,
}: {
  option?: Option;
  activeSeasonName: string;
  opensAt: string | null;
  closesAt: string | null;
  closed: boolean;
}) {
  return (
    <section className="portal-registration-card overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-[#5f574e]">
          Entry window
        </div>
      </div>
      <div className="grid gap-0 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center self-stretch">
            <span
              className={`mt-[3px] h-[11px] w-[11px] flex-shrink-0 rounded-full ${closed ? 'bg-brand' : 'bg-[#4ea36a]'}`}
            />
            <span className="w-[2px] flex-1 bg-white/[0.08]" />
          </div>
          <div className="pb-4">
            <div className="font-bold text-[12.5px] text-cream">Window opens</div>
            <div className="mt-0.5 font-mono text-[10.5px] text-[#8a817a]">
              {formatDate(opensAt ?? option?.registrationOpensAt)}
            </div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span
            className={`mt-[3px] h-[11px] w-[11px] flex-shrink-0 rounded-full ${closed ? 'bg-brand' : 'bg-white/[0.14]'}`}
          />
          <div>
            <div className="font-bold text-[12.5px] text-cream">Window closes</div>
            <div className="mt-0.5 font-mono text-[10.5px] text-[#8a817a]">
              {formatDate(closesAt ?? option?.registrationClosesAt)}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] px-5 py-3.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#5f574e]">
          Season
        </span>
        <span className="text-[11.5px] font-bold text-cream">
          {activeSeasonName || 'No active season'}
        </span>
      </div>
    </section>
  );
}

function Requirements({ teamName, closed }: { teamName: string; closed: boolean }) {
  return (
    <section className="portal-registration-card overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
        <div className="min-w-[140px] flex-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-[#5f574e]">
          Before you can enter
        </div>
        <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[#8a817a]">
          {closed ? 'Window closed' : 'All clear'}
        </span>
      </div>
      <div className="grid gap-3 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="flex h-[17px] w-[17px] items-center justify-center rounded bg-[#4ea36a]/[0.16] font-mono text-[9.5px] font-bold text-[#4ea36a]">
            ✓
          </span>
          <div>
            <div className="text-[12.5px] font-bold text-cream">Active team assignment</div>
            <div className="mt-0.5 text-[11.5px] text-[#8a817a]">
              Your entry is scoped to {teamName}.
            </div>
          </div>
        </div>
        <div className="flex items-start gap-3 border-t border-white/[0.06] pt-3">
          <span className="flex h-[17px] w-[17px] items-center justify-center rounded bg-[#4ea36a]/[0.16] font-mono text-[9.5px] font-bold text-[#4ea36a]">
            ✓
          </span>
          <div>
            <div className="text-[12.5px] font-bold text-cream">Admin approval required</div>
            <div className="mt-0.5 text-[11.5px] text-[#8a817a]">
              Nothing becomes active until reviewed.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function History({ history }: { history: HistoryRow[] }) {
  return (
    <section className="portal-registration-card overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-5 py-4">
        <h3 className="min-w-[180px] flex-1 font-display text-[17px] uppercase leading-none text-cream">
          Entry history
        </h3>
        <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-[#5f574e]">
          {history.length} previous {history.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>
      {history.length === 0 ? (
        <p className="px-5 py-5 text-[12.5px] text-[#8a817a]">
          This is your first season entry. Once the office actions it, the outcome will appear here.
        </p>
      ) : (
        <div>
          {history.map((row) => (
            <div
              key={row.id}
              className="flex flex-wrap items-center gap-4 border-b border-white/[0.06] px-5 py-3.5 last:border-b-0"
            >
              <div className="w-[74px] flex-shrink-0">
                <div className="font-display text-[16px] leading-none text-cream">
                  {new Date(row.date).getFullYear()}
                </div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[#8a817a]">
                  {row.leagueName}
                </div>
              </div>
              <div className="min-w-[170px] flex-1">
                <div className="font-bold text-[12.5px] text-cream">{row.seasonName}</div>
                <div className="mt-0.5 font-mono text-[10.5px] text-[#8a817a]">
                  Submitted {formatDate(row.date)}
                </div>
              </div>
              <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[#b8afa6]">
                {row.status.replaceAll('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
