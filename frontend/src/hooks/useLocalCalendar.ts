import { useState, useEffect, useCallback, useRef } from 'react';
import { GetLocalEvents, AddLocalEvent, DeleteLocalEvent } from '../../wailsjs/go/main/App';
import type { LocalEvent } from '../types';

interface UseLocalCalendarResult {
  events: LocalEvent[];
  error: string | null;
  loading: boolean;
  addEvent: (ev: LocalEvent) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  refresh: () => void;
}

export function useLocalCalendar(startDate: string, endDate: string): UseLocalCalendarResult {
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    if (!startDate || !endDate) return;
    try {
      setError(null);
      const data = await GetLocalEvents(startDate, endDate);
      if (mountedRef.current) {
        setEvents(data || []);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    mountedRef.current = true;
    fetch();
    return () => { mountedRef.current = false; };
  }, [fetch]);

  const addEvent = useCallback(async (ev: LocalEvent) => {
    try {
      await AddLocalEvent({ id: '', title: ev.title, start: ev.start, end: ev.end, allDay: ev.allDay, color: ev.color, notes: ev.notes, createdAt: '' });
      fetch();
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : String(e));
    }
  }, [fetch]);

  const deleteEvent = useCallback(async (id: string) => {
    try {
      await DeleteLocalEvent(id);
      fetch();
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : String(e));
    }
  }, [fetch]);

  return { events, error, loading, addEvent, deleteEvent, refresh: fetch };
}
