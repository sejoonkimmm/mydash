import { useState } from 'react';
import type { Holiday, LocalEvent } from '../../types';
import ConfirmModal from '../shared/ConfirmModal';

interface Props {
  displayDate: string;
  dayHoliday: Holiday | undefined;
  dayEvents: LocalEvent[];
  onAddEvent: () => void;
  onDeleteEvent: (id: string) => void;
}

export default function DayDetail({ displayDate, dayHoliday, dayEvents, onAddEvent, onDeleteEvent }: Props) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const eventToDelete = confirmDeleteId ? dayEvents.find(ev => ev.id === confirmDeleteId) : null;

  return (
    <div style={{ flex: 1, borderLeft: '1px solid var(--border)', paddingLeft: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 13, fontWeight: 600, color: 'var(--t-bright)' }}>{displayDate}</span>
          {dayHoliday && (
            <span style={{ marginLeft: 10, color: 'var(--sig-bad)', fontSize: 12, fontWeight: 600 }}>{dayHoliday.name}</span>
          )}
        </div>
        <button
          className="refresh-btn"
          onClick={onAddEvent}
          style={{ background: 'var(--teal-glow)', borderColor: 'var(--border-focus)', color: 'var(--teal)' }}
        >
          + Add Event
        </button>
      </div>

      <div className="calendar-events">
        {dayEvents.length > 0 ? dayEvents.map(ev => (
          <div key={ev.id} className="calendar-event" style={{ position: 'relative' }}>
            <div className="calendar-event-dot" style={{ backgroundColor: ev.color }} />
            <span className="calendar-event-time">
              {ev.allDay ? 'All day' : `${ev.start.slice(11, 16)} - ${ev.end.slice(11, 16)}`}
            </span>
            <span className="calendar-event-title">{ev.title}</span>
            <span className="calendar-event-account">Local</span>
            <button
              onClick={() => setConfirmDeleteId(ev.id)}
              style={{ background: 'none', border: 'none', color: 'var(--t-ghost)', cursor: 'pointer', fontSize: 14, padding: '0 4px', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--sig-bad)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--t-ghost)'}
            >x</button>
          </div>
        )) : (
          <div className="calendar-empty">
            {dayHoliday ? dayHoliday.nameEN : 'No events — double-click a date or click "+ Add Event"'}
          </div>
        )}
      </div>

      {confirmDeleteId && eventToDelete && (
        <ConfirmModal
          title="Delete Event"
          message={`Delete "${eventToDelete.title}"?`}
          confirmLabel="Delete"
          danger
          onConfirm={() => { onDeleteEvent(confirmDeleteId); setConfirmDeleteId(null); }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
