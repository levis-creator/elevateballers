type Props = {
  dirtyCount: number;
  saving: boolean;
  canManage: boolean;
  onDiscard: () => void;
  onSave: () => void;
};

export default function SettingsSaveBar({
  dirtyCount,
  saving,
  canManage,
  onDiscard,
  onSave,
}: Props) {
  return (
    <div className="eb-settings-savebar">
      <span>
        {dirtyCount
          ? `${dirtyCount} unsaved change${dirtyCount === 1 ? '' : 's'}`
          : 'All changes saved'}
      </span>
      <div>
        <button type="button" onClick={onDiscard} disabled={!dirtyCount}>
          Discard
        </button>
        <button
          type="button"
          className="primary"
          onClick={onSave}
          disabled={saving || !canManage || !dirtyCount}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
