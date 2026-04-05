import { createPortal } from 'react-dom';
import type { LocalEvent } from '../../types';
import { EVENT_COLORS } from './holidays';

interface NewEventForm {
  title: string;
  startH: string;
  startM: string;
  endH: string;
  endM: string;
  color: string;
  notes: string;
  allDay: boolean;
}

interface Props {
  selectedDate: string;
  newEvent: NewEventForm;
  onChange: (ev: NewEventForm) => void;
  onSave: () => void;
  onClose: () => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', marginBottom: 14,
  background: 'var(--surface-glass)', border: '1px solid var(--border)',
  borderRadius: 'var(--r-sm)', color: 'var(--t-bright)',
  fontFamily: 'var(--f-sans)', fontSize: 13, outline: 'none',
};

const selectStyle: React.CSSProperties = {
  padding: '6px 8px', background: 'var(--surface-glass)', border: '1px solid var(--border)',
  borderRadius: 'var(--r-sm)', color: 'var(--t-bright)',
  fontFamily: 'var(--f-mono)', fontSize: 12, outline: 'none',
};

export default function AddEventModal({ selectedDate, newEvent, onChange, onSave, onClose }: Props) {
  return createPortal(
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ width: 420, background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 28, boxShadow: 'var(--shadow-lg)', animation: 'appear 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t-bright)', marginBottom: 20 }}>
          New Event — {selectedDate}
        </div>

        <input
          type="text" placeholder="Event title..." value={newEvent.title}
          onChange={e => onChange({ ...newEvent, title: e.target.value })}
          autoFocus style={inputStyle}
        />

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, cursor: 'pointer', fontSize: 13, color: 'var(--t-secondary)' }}>
          <input type="checkbox" checked={newEvent.allDay} onChange={e => onChange({ ...newEvent, allDay: e.target.checked })} />
          All day event
        </label>

        {!newEvent.allDay && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--t-muted)', fontFamily: 'var(--f-mono)' }}>From</span>
              <select value={newEvent.startH} onChange={e => onChange({ ...newEvent, startH: e.target.value })} style={selectStyle}>
                {Array.from({ length: 24 }).map((_, h) => <option key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2, '0')}</option>)}
              </select>
              <span style={{ color: 'var(--t-muted)' }}>:</span>
              <select value={newEvent.startM} onChange={e => onChange({ ...newEvent, startM: e.target.value })} style={selectStyle}>
                {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--t-muted)', fontFamily: 'var(--f-mono)' }}>To</span>
              <select value={newEvent.endH} onChange={e => onChange({ ...newEvent, endH: e.target.value })} style={selectStyle}>
                {Array.from({ length: 24 }).map((_, h) => <option key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2, '0')}</option>)}
              </select>
              <span style={{ color: 'var(--t-muted)' }}>:</span>
              <select value={newEvent.endM} onChange={e => onChange({ ...newEvent, endM: e.target.value })} style={selectStyle}>
                {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {EVENT_COLORS.map(c => (
            <div
              key={c}
              onClick={() => onChange({ ...newEvent, color: c })}
              style={{ width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer', border: newEvent.color === c ? '2px solid var(--t-bright)' : '2px solid transparent', transition: 'border 0.15s', boxShadow: newEvent.color === c ? `0 0 10px ${c}40` : 'none' }}
            />
          ))}
        </div>

        <textarea
          placeholder="Notes (optional)" value={newEvent.notes}
          onChange={e => onChange({ ...newEvent, notes: e.target.value })}
          style={{ ...inputStyle, height: 60, resize: 'none' as const }}
        />

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="refresh-btn" onClick={onClose}>Cancel</button>
          <button
            className="refresh-btn" onClick={onSave}
            style={{ background: 'var(--teal-glow)', borderColor: 'var(--border-focus)', color: 'var(--teal)', fontWeight: 700 }}
          >
            Save Event
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
