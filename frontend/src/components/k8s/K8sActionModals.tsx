import { useState } from 'react';
import { PodInfo, DeploymentInfo, NodeInfo } from '../../types';
import ConfirmModal from '../shared/ConfirmModal';
import { createPortal } from 'react-dom';

export type PendingAction =
  | { type: 'delete-pod'; cluster: string; item: PodInfo }
  | { type: 'restart-deploy'; cluster: string; item: DeploymentInfo }
  | { type: 'cordon'; cluster: string; item: NodeInfo }
  | { type: 'uncordon'; cluster: string; item: NodeInfo }
  | { type: 'scale-deploy'; cluster: string; item: DeploymentInfo };

interface Props {
  action: PendingAction;
  onConfirm: (scaleCount?: number) => void;
  onCancel: () => void;
}

function isProdCluster(cluster: string): boolean {
  return /prod/i.test(cluster);
}

export default function K8sActionModals({ action, onConfirm, onCancel }: Props) {
  const [scaleCount, setScaleCount] = useState('');
  const isProd = isProdCluster(action.cluster);

  if (action.type === 'delete-pod') {
    return (
      <ConfirmModal
        title="Delete Pod"
        message={`Delete pod "${action.item.name}"?${isProd ? ' WARNING: This is a production cluster!' : ' It will be restarted by its controller.'}`}
        confirmLabel="Delete" danger
        requireTyped={isProd ? action.item.name : undefined}
        onConfirm={() => onConfirm()}
        onCancel={onCancel}
      />
    );
  }

  if (action.type === 'restart-deploy') {
    return (
      <ConfirmModal
        title="Rollout Restart"
        message={`Restart deployment "${action.item.name}"? This will perform a rolling restart.`}
        confirmLabel="Restart"
        onConfirm={() => onConfirm()}
        onCancel={onCancel}
      />
    );
  }

  if (action.type === 'cordon' || action.type === 'uncordon') {
    const verb = action.type === 'cordon' ? 'Cordon' : 'Uncordon';
    return (
      <ConfirmModal
        title={`${verb} Node`}
        message={`${verb} node "${action.item.name}"?`}
        confirmLabel={verb}
        onConfirm={() => onConfirm()}
        onCancel={onCancel}
      />
    );
  }

  if (action.type === 'scale-deploy') {
    const count = parseInt(scaleCount, 10);
    return createPortal(
      <div className="modal-overlay" onClick={onCancel}>
        <div className="modal-panel" onClick={e => e.stopPropagation()}>
          <div className="modal-title">Scale Deployment</div>
          <div className="modal-message">Set replica count for &ldquo;{action.item.name}&rdquo;:</div>
          <div className="modal-typed-confirm">
            <label className="modal-typed-label">Replica count:</label>
            <input type="number" min={0} value={scaleCount}
              onChange={e => setScaleCount(e.target.value)}
              className="modal-input" autoFocus />
          </div>
          <div className="modal-actions">
            <button className="modal-btn cancel" onClick={onCancel}>Cancel</button>
            <button className="modal-btn primary"
              onClick={() => onConfirm(count)}
              disabled={scaleCount === '' || isNaN(count) || count < 0 || count > 1000}>
              Scale
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return null;
}
