import { useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  requireTyped?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  danger = false, requireTyped, onConfirm, onCancel,
}: Props) {
  const [typed, setTyped] = useState('');
  const canConfirm = !requireTyped || typed === requireTyped;

  return createPortal(
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        <div className="modal-message">{message}</div>
        {requireTyped && (
          <div className="modal-typed-confirm">
            <label className="modal-typed-label">
              Type <strong>{requireTyped}</strong> to confirm:
            </label>
            <input
              type="text"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              className="modal-input"
              autoFocus
            />
          </div>
        )}
        <div className="modal-actions">
          <button className="modal-btn cancel" onClick={onCancel}>{cancelLabel}</button>
          <button
            className={`modal-btn ${danger ? 'danger' : 'primary'}`}
            onClick={onConfirm}
            disabled={!canConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
