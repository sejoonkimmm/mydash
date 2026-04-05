import { ContextMenu } from '../../types';

interface Props {
  menu: ContextMenu;
  onAction: (action: string) => void;
}

function MenuItem({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '8px 16px',
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
        color: danger ? 'var(--sig-bad)' : 'var(--t-primary)',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-glass-hover)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {label}
    </div>
  );
}

export default function K8sContextMenu({ menu, onAction }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        left: menu.x,
        top: menu.y,
        zIndex: 1000,
        background: 'var(--surface-1)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        padding: '6px 0',
        minWidth: 180,
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {menu.type === 'pod' && (
        <>
          <MenuItem label="View Logs" onClick={() => onAction('logs')} />
          <MenuItem label="Delete Pod (Restart)" onClick={() => onAction('delete-pod')} danger />
        </>
      )}
      {menu.type === 'deployment' && (
        <>
          <MenuItem label="Rollout Restart" onClick={() => onAction('restart-deploy')} />
          <MenuItem label="Scale..." onClick={() => onAction('scale-deploy')} />
        </>
      )}
      {menu.type === 'node' && (
        <>
          <MenuItem label="Cordon" onClick={() => onAction('cordon')} />
          <MenuItem label="Uncordon" onClick={() => onAction('uncordon')} />
        </>
      )}
    </div>
  );
}
