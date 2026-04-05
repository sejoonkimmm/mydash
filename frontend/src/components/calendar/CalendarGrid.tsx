import type { Holiday, LocalEvent } from '../../types';
import { DAYS, getDaysInMonth, getFirstDayOfWeek, formatDateStr } from './holidays';

interface Props {
  viewYear: number;
  viewMonth: number;
  todayStr: string;
  selectedDate: string | null;
  holidayMap: Record<string, Holiday>;
  eventsByDate: Record<string, LocalEvent[]>;
  monthHolidays: Holiday[];
  onSelectDate: (date: string) => void;
  onDoubleClickDate: (date: string) => void;
}

export default function CalendarGrid({
  viewYear, viewMonth, todayStr, selectedDate,
  holidayMap, eventsByDate, monthHolidays,
  onSelectDate, onDoubleClickDate,
}: Props) {
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  return (
    <div>
      <div className="cal-grid">
        {DAYS.map(d => <div key={d} className="cal-day-header">{d}</div>)}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} className="cal-day empty" />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = formatDateStr(viewYear, viewMonth, day);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const holiday = holidayMap[dateStr];
          const hasEvents = !!eventsByDate[dateStr]?.length;
          const isWeekend = ((firstDay + i) % 7) >= 5;

          return (
            <div
              key={day}
              className={`cal-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${holiday ? 'holiday' : ''} ${isWeekend ? 'weekend' : ''}`}
              onClick={() => onSelectDate(dateStr)}
              onDoubleClick={() => onDoubleClickDate(dateStr)}
              title={holiday ? holiday.name : 'Double-click to add event'}
            >
              <span className="cal-day-num">{day}</span>
              <div className="cal-day-indicators">
                {holiday && <span className="cal-dot holiday-dot" />}
                {hasEvents && <span className="cal-dot event-dot" />}
              </div>
            </div>
          );
        })}
      </div>

      <div className="cal-month-holidays">
        {monthHolidays.map((h, i) => (
          <div key={i} className="cal-holiday-item" onClick={() => onSelectDate(h.date)}>
            <span className="cal-dot holiday-dot" />
            <span style={{ fontSize: 11, color: 'var(--sig-bad)', fontFamily: 'var(--f-mono)' }}>{h.date.slice(8)}</span>
            <span style={{ fontSize: 11, color: 'var(--t-secondary)' }}>{h.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
