interface Props {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export default function ErrorBanner({ message, onRetry, onDismiss }: Props) {
  return (
    <div className="error-banner">
      <div className="error-banner-content">
        <span className="error-banner-icon">!</span>
        <span className="error-banner-text">{message}</span>
      </div>
      <div className="error-banner-actions">
        {onRetry && <button className="error-banner-btn retry" onClick={onRetry}>Retry</button>}
        {onDismiss && <button className="error-banner-btn dismiss" onClick={onDismiss}>Dismiss</button>}
      </div>
    </div>
  );
}
