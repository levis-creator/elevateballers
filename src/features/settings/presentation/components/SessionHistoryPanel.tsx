import { useCallback, useEffect, useState } from 'react';

type Session = {
  id: string;
  user: { id: string; name: string; email: string };
  createdAt: string;
  lastSeenAt: string | null;
  expiresAt: string;
  revokedAt: string | null;
  revokeReason: string | null;
  status: 'active' | 'expired' | 'revoked';
};

type Props = { canManage: boolean };

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : 'Not recorded';
}

export default function SessionHistoryPanel({ canManage }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (nextPage: number) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/settings/sessions?page=${nextPage}`, { cache: 'no-store' });
      const result = await response.json().catch(() => ({})) as { sessions?: Session[]; totalPages?: number; error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Unable to load session history');
      setSessions(result.sessions ?? []);
      setTotalPages(Math.max(1, result.totalPages ?? 1));
      setPage(nextPage);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load session history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(1); }, [load]);

  async function revoke(session: Session) {
    if (!window.confirm(`Revoke the session for ${session.user.email}? They will need to sign in again.`)) return;
    const response = await fetch(`/api/settings/sessions?id=${encodeURIComponent(session.id)}`, { method: 'DELETE' });
    if (!response.ok) {
      const result = await response.json().catch(() => ({})) as { error?: string };
      setError(result.error ?? 'Unable to revoke session');
      return;
    }
    void load(page);
  }

  return (
    <div className="eb-session-history">
      <div className="eb-session-history-intro">
        <p>Only durable sessions created after session tracking was enabled appear here. Legacy JWTs without a session record cannot be reconstructed.</p>
        {error && <p className="eb-session-history-error">{error}</p>}
      </div>
      {loading ? <p className="eb-session-history-muted">Loading session history…</p> : sessions.length === 0 ? <p className="eb-session-history-muted">No durable sessions found.</p> : (
        <div className="eb-session-history-list">
          {sessions.map((session) => (
            <article className="eb-session-history-item" key={session.id}>
              <div>
                <strong>{session.user.name}</strong>
                <span>{session.user.email}</span>
              </div>
              <div className="eb-session-history-meta">
                <span>Status: {session.status}</span>
                <span>Created: {formatDate(session.createdAt)}</span>
                <span>Last active: {formatDate(session.lastSeenAt)}</span>
                <span>Expires: {formatDate(session.expiresAt)}</span>
                {session.revokedAt && <span>Revoked: {formatDate(session.revokedAt)} ({session.revokeReason ?? 'unspecified'})</span>}
              </div>
              {canManage && session.status === 'active' && <button type="button" onClick={() => void revoke(session)}>Revoke</button>}
            </article>
          ))}
        </div>
      )}
      {totalPages > 1 && <div className="eb-session-history-pagination"><button type="button" disabled={page <= 1 || loading} onClick={() => void load(page - 1)}>Previous</button><span>Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages || loading} onClick={() => void load(page + 1)}>Next</button></div>}
    </div>
  );
}
