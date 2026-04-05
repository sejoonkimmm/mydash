interface Props {
  pod: string;
  ns: string;
  text: string;
  onClose: () => void;
}

export default function K8sLogViewer({ pod, ns, text, onClose }: Props) {
  return (
    <div style={{
      flex: '0 0 280px',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-0)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--teal)' }}>
          {ns}/{pod}
        </span>
        <button className="refresh-btn" onClick={onClose}>Close</button>
      </div>
      <pre style={{
        flex: 1,
        overflow: 'auto',
        padding: '12px 16px',
        margin: 0,
        fontFamily: 'var(--f-mono)',
        fontSize: 10,
        lineHeight: 1.6,
        color: 'var(--t-secondary)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
      }}>
        {text || 'No logs available'}
      </pre>
    </div>
  );
}
