/**
 * Connection status pill shown in the stats recorder.
 * Displays online/offline state and queued event count.
 */
interface ConnectionStatusProps {
  isOnline: boolean;
  pendingCount: number;
  onSyncClick: () => void;
}

export default function ConnectionStatus({
  isOnline,
  pendingCount,
  onSyncClick,
}: ConnectionStatusProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '3px 10px',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.5px',
          background: isOnline ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
          color: isOnline ? '#059669' : '#dc2626',
          border: `1px solid ${isOnline ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}
      >
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: isOnline ? '#10b981' : '#ef4444',
            display: 'inline-block',
            boxShadow: isOnline ? '0 0 6px #10b981' : 'none',
          }}
        />
        {isOnline ? 'Online' : 'Offline'}
      </span>

      {pendingCount > 0 && (
        <button
          onClick={onSyncClick}
          title="Tap to retry syncing pending events"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 10px',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            background: 'rgba(245,158,11,0.12)',
            color: '#d97706',
            border: '1px solid rgba(245,158,11,0.3)',
            cursor: 'pointer',
          }}
        >
          <span>{pendingCount} pending</span>
          <span>↑</span>
        </button>
      )}
    </div>
  );
}
