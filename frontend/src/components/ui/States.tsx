export function LoadingState({ message = 'Loading data…' }: { message?: string }) {
  return (
    <div className="state-container" data-testid="loading-state">
      <div className="spinner" />
      <div className="state-title" style={{ letterSpacing: '1.5px' }}>{message.toUpperCase()}</div>
      {/* skeleton bars */}
      <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        <div className="skeleton" style={{ height: 12, width: '80%' }} />
        <div className="skeleton" style={{ height: 12, width: '60%' }} />
        <div className="skeleton" style={{ height: 12, width: '70%' }} />
      </div>
    </div>
  );
}

export function EmptyState({
  icon = '⬜',
  title = 'No Data',
  message,
}: {
  icon?: string;
  title?: string;
  message?: string;
}) {
  return (
    <div className="state-container" data-testid="empty-state">
      <div style={{
        width: 56, height: 56,
        background: 'var(--fleet-bg-elevated)',
        border: '2px solid var(--fleet-border)',
        borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24,
      }}>
        {icon}
      </div>
      <div className="state-title">{title.toUpperCase()}</div>
      {message && (
        <div className="state-message" style={{ textTransform: 'uppercase', letterSpacing: '0.3px', fontSize: 11 }}>
          {message}
        </div>
      )}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry?: () => void;
}) {
  return (
    <div className="state-container" data-testid="error-state">
      <div style={{
        width: 56, height: 56,
        background: 'var(--fleet-critical-dim)',
        border: '2px solid rgba(220,38,38,0.3)',
        borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24,
      }}>
        ⚠
      </div>
      <div className="state-title" style={{ color: 'var(--fleet-critical)' }}>Data Unavailable</div>
      <div className="state-message"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fleet-critical)', background: 'var(--fleet-critical-dim)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(220,38,38,0.2)' }}>
        {error}
      </div>
      {onRetry && (
        <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={onRetry}>
          ↺ Retry
        </button>
      )}
    </div>
  );
}