import { useState, useMemo } from 'react';
import { useLocalCalendar } from '../hooks/useLocalCalendar';
import { getHolidaysForYear, getDaysInMonth, MONTHS, formatDateStr } from './calendar/holidays';
import CalendarGrid from './calendar/CalendarGrid';
import DayDetail from './calendar/DayDetail';
import AddEventModal from './calendar/AddEventModal';
import ErrorBanner from './shared/ErrorBanner';

interface Props { fullView?: boolean; }

const DEFAULT_NEW_EVENT = { title: '', startH: '09', startM: '00', endH: '10', endM: '00', color: '#22d3ee', notes: '', allDay: false };

export default function CalendarPanel({ fullView }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState(DEFAULT_NEW_EVENT);
  const [actionError, setActionError] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const startDate = formatDateStr(viewYear, viewMonth, 1);
  const endDate = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${daysInMonth}T23:59:59`;

  const { events, error, addEvent, deleteEvent, refresh } = useLocalCalendar(startDate, endDate);

  const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const holidays = useMemo(() => getHolidaysForYear(viewYear), [viewYear]);
  const holidayMap = useMemo(() => {
    const m: Record<string, import('../types').Holiday> = {};
    holidays.forEach(h => { m[h.date] = h; });
    return m;
  }, [holidays]);

  const monthHolidays = useMemo(
    () => holidays.filter(h => h.date.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`)),
    [holidays, viewYear, viewMonth]
  );

  const eventsByDate = useMemo(() => {
    const m: Record<string, import('../types').LocalEvent[]> = {};
    events.forEach(ev => { const d = ev.start.slice(0, 10); if (!m[d]) m[d] = []; m[d].push(ev); });
    return m;
  }, [events]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleSelectDate = (date: string) => setSelectedDate(date);
  const handleDoubleClickDate = (date: string) => { setSelectedDate(date); setShowAddEvent(true); };

  const handleSaveEvent = async () => {
    if (!newEvent.title || !selectedDate) return;
    try {
      const start = newEvent.allDay ? selectedDate : `${selectedDate}T${newEvent.startH}:${newEvent.startM}:00`;
      const end = newEvent.allDay ? selectedDate : `${selectedDate}T${newEvent.endH}:${newEvent.endM}:00`;
      await addEvent({ id: '', title: newEvent.title, start, end, allDay: newEvent.allDay, color: newEvent.color, notes: newEvent.notes });
      setShowAddEvent(false);
      setNewEvent(DEFAULT_NEW_EVENT);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteEvent(id);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    }
  };

  const displayDate = selectedDate || todayStr;
  const dayEvents = eventsByDate[displayDate] || [];
  const dayHoliday = holidayMap[displayDate];

  return (
    <div className="card" style={fullView ? { height: '100%' } : {}}>
      <div className="card-header">
        <span className="card-title">Calendar</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="refresh-btn" onClick={() => setViewYear(y => y - 1)}>&laquo;</button>
          <button className="refresh-btn" onClick={prevMonth}>&lsaquo;</button>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 13, fontWeight: 600, color: 'var(--t-bright)', minWidth: 140, textAlign: 'center' }}>
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button className="refresh-btn" onClick={nextMonth}>&rsaquo;</button>
          <button className="refresh-btn" onClick={() => setViewYear(y => y + 1)}>&raquo;</button>
          <button className="refresh-btn" onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); }}>Today</button>
        </div>
      </div>

      {(error || actionError) && (
        <ErrorBanner
          message={error || actionError || ''}
          onRetry={error ? refresh : undefined}
          onDismiss={actionError ? () => setActionError(null) : undefined}
        />
      )}

      <div className="card-body" style={{ display: 'flex', gap: 20, padding: fullView ? '20px 22px' : '16px 18px' }}>
        <div style={{ flex: fullView ? '0 0 380px' : '1' }}>
          <CalendarGrid
            viewYear={viewYear}
            viewMonth={viewMonth}
            todayStr={todayStr}
            selectedDate={selectedDate}
            holidayMap={holidayMap}
            eventsByDate={eventsByDate}
            monthHolidays={monthHolidays}
            onSelectDate={handleSelectDate}
            onDoubleClickDate={handleDoubleClickDate}
          />
        </div>

        {fullView && (
          <DayDetail
            displayDate={displayDate}
            dayHoliday={dayHoliday}
            dayEvents={dayEvents}
            onAddEvent={() => { setSelectedDate(displayDate); setShowAddEvent(true); }}
            onDeleteEvent={handleDeleteEvent}
          />
        )}
      </div>

      {showAddEvent && selectedDate && (
        <AddEventModal
          selectedDate={selectedDate}
          newEvent={newEvent}
          onChange={setNewEvent}
          onSave={handleSaveEvent}
          onClose={() => setShowAddEvent(false)}
        />
      )}
    </div>
  );
}
