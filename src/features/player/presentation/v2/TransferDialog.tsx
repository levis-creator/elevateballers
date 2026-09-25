import { useEffect, useState } from 'react';
import ActionDialog from '../../../cms/presentation/v2/ActionDialog';

type Option = { rosterId: string; edition: string; fromTeam: string; teams: { seasonTeamId: string; name: string }[] };

/**
 * Admin "Transfer to another team" dialog: picks a team in the same edition
 * and moves the player at once (both coaches are emailed).
 */
export default function TransferDialog({
  playerId,
  playerName,
  onDone,
  onCancel,
}: {
  playerId: string;
  playerName: string;
  onDone: (message: string) => void;
  onCancel: () => void;
}) {
  const [options, setOptions] = useState<Option[] | null>(null);
  const [rosterId, setRosterId] = useState('');
  const [toSeasonTeamId, setToSeasonTeamId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/players/${playerId}/transfer`, { cache: 'no-store' })
      .then(async (response) => {
        const value = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(value.error || 'Unable to load teams.');
        return value as Option[];
      })
      .then((value) => {
        setOptions(value);
        setRosterId(value[0]?.rosterId ?? '');
      })
      .catch((cause) => {
        setOptions([]);
        setError(cause instanceof Error ? cause.message : 'Unable to load teams.');
      });
  }, [playerId]);

  const current = options?.find((option) => option.rosterId === rosterId);
  const nowhere = options !== null && !options.length;

  const submit = async (reason: string) => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/players/${playerId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toSeasonTeamId, reason: reason || undefined }),
      });
      const value = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(value.error || 'Unable to transfer the player.');
      onDone(`${playerName} transferred to ${value.toTeamName}. Both coaches have been notified.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to transfer the player.');
      setBusy(false);
    }
  };

  return (
    <ActionDialog
      eyebrow="Transfer"
      title={`Transfer ${playerName}`}
      body={
        nowhere && !error
          ? 'This player is not on an approved roster in any current edition, so there is nothing to transfer.'
          : 'Moves the player to another team in the same edition straight away, keeping their jersey, position and stats. Both teams’ coaches are emailed.'
      }
      reasonLabel={nowhere ? undefined : 'Reason (optional)'}
      reasonPlaceholder="e.g. Requested by both teams"
      confirmLabel="Transfer player"
      confirmDisabled={!toSeasonTeamId}
      busy={busy}
      error={error}
      onCancel={onCancel}
      onConfirm={(reason) => void submit(reason)}
    >
      {options === null && <p className="eb-dialog-note">Loading teams…</p>}
      {options && options.length > 1 && (
        <label className="eb-dialog-field">
          Edition
          <select
            value={rosterId}
            onChange={(event) => {
              setRosterId(event.target.value);
              setToSeasonTeamId('');
            }}
          >
            {options.map((option) => (
              <option key={option.rosterId} value={option.rosterId}>
                {option.edition} · currently {option.fromTeam}
              </option>
            ))}
          </select>
        </label>
      )}
      {current && (
        <label className="eb-dialog-field">
          {options && options.length === 1 ? `${current.edition} · from ${current.fromTeam} to` : 'Transfer to'}
          <select value={toSeasonTeamId} onChange={(event) => setToSeasonTeamId(event.target.value)}>
            <option value="">Choose a team…</option>
            {current.teams.map((team) => (
              <option key={team.seasonTeamId} value={team.seasonTeamId}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </ActionDialog>
  );
}
