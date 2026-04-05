import type { Holiday } from '../../types';

export function computeEaster(year: number): Date {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export function getHolidaysForYear(year: number): Holiday[] {
  const easter = computeEaster(year);
  const ed = (offset: number) => {
    const d = new Date(easter);
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  const f = (m: number, d: number) =>
    `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  return [
    { date: f(1, 1), name: 'Neujahr', nameEN: "New Year's Day" },
    { date: ed(-2), name: 'Karfreitag', nameEN: 'Good Friday' },
    { date: ed(1), name: 'Ostermontag', nameEN: 'Easter Monday' },
    { date: f(5, 1), name: 'Tag der Arbeit', nameEN: 'Labour Day' },
    { date: ed(39), name: 'Christi Himmelfahrt', nameEN: 'Ascension Day' },
    { date: ed(50), name: 'Pfingstmontag', nameEN: 'Whit Monday' },
    { date: f(10, 3), name: 'Tag der Deutschen Einheit', nameEN: 'German Unity Day' },
    { date: f(10, 31), name: 'Reformationstag', nameEN: 'Reformation Day' },
    { date: f(12, 25), name: '1. Weihnachtstag', nameEN: 'Christmas Day' },
    { date: f(12, 26), name: '2. Weihnachtstag', nameEN: "St. Stephen's Day" },
  ];
}

export function getDaysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}

export function getFirstDayOfWeek(y: number, m: number) {
  const d = new Date(y, m, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

export function formatDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const EVENT_COLORS = ['#22d3ee', '#a78bfa', '#fb7185', '#4ade80', '#fbbf24', '#60a5fa', '#f97316'];
