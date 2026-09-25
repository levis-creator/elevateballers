import { useEffect, useRef, useState } from 'react';

export type ActionDialogProps = {
  eyebrow?: string;
  title: string;
  /** Plain explanation of what happens; keep it to a sentence or two. */
  body: string;
  confirmLabel: string;
  /** Red confirm button for actions that are destructive or hard to undo. */
  danger?: boolean;
  /** Shows an optional free-text box (e.g. a reason) passed to onConfirm. */
  reasonLabel?: string;
  reasonPlaceholder?: string;
  busy?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
};

/**
 * In-page confirmation for admin actions. Replaces window.confirm/prompt,
 * which some embedded browsers block outright and which cannot be styled.
 */
export default function ActionDialog({
  eyebrow,
  title,
  body,
  confirmLabel,
  danger,
  reasonLabel,
  reasonPlaceholder,
  busy,
  onConfirm,
  onCancel,
}: ActionDialogProps) {
  const [reason, setReason] = useState('');
  const firstField = useRef<HTMLTextAreaElement & HTMLButtonElement>(null);

  useEffect(() => {
    firstField.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onCancel]);

  return (
    <div
      className="eb-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <form
        className="eb-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="eb-dialog-title"
        onSubmit={(event) => {
          event.preventDefault();
          if (!busy) onConfirm(reason.trim());
        }}
      >
        <div className="eb-dialog-head">
          {eyebrow && <div className="eb-dialog-eyebrow">{eyebrow}</div>}
          <h2 id="eb-dialog-title">{title}</h2>
        </div>
        <p className="eb-dialog-body">{body}</p>
        {reasonLabel && (
          <label className="eb-dialog-field">
            {reasonLabel}
            <textarea
              ref={firstField}
              rows={3}
              maxLength={500}
              value={reason}
              placeholder={reasonPlaceholder}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
        )}
        <div className="eb-dialog-actions">
          <button type="button" className="eb-dialog-button" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            type="submit"
            ref={reasonLabel ? undefined : firstField}
            className={`eb-dialog-button ${danger ? 'danger' : 'primary'}`}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
