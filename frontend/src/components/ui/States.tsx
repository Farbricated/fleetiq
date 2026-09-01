export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="state-container" data-testid="loading-state">
      <div className="spinner" />
      <div className="state-title">{message}</div>
    </div>
  );
}

export function EmptyState({
  icon = '📭',
  title = 'No data',
  message,
}: {
  icon?: string;
  title?: string;
  message?: string;
}) {
  return (
    <div className="state-container" data-testid="empty-state">
      <div className="state-icon">{icon}</div>
      <div className="state-title">{title}</div>
      {message && <div className="state-message">{message}</div>}
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
      <div className="state-icon">⚠️</div>
      <div className="state-title">Something went wrong</div>
      <div className="state-message">{error}</div>
      {onRetry && (
        <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
