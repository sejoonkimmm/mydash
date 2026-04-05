import { useState, useEffect, useCallback, useRef } from 'react';
import { GetWeather } from '../../wailsjs/go/main/App';
import type { CityWeather } from '../types';

interface UseWeatherResult {
  data: CityWeather[];
  error: string | null;
  loading: boolean;
  lastUpdated: Date | null;
  refresh: () => void;
}

export function useWeather(cities: string[], forecastDays: number, intervalMs: number): UseWeatherResult {
  const [data, setData] = useState<CityWeather[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    if (cities.length === 0) return;
    try {
      setError(null);
      const result = await GetWeather(cities, forecastDays);
      if (mountedRef.current) {
        setData(result || []);
        setLastUpdated(new Date());
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [cities, forecastDays]);

  useEffect(() => {
    mountedRef.current = true;
    fetch();
    const id = setInterval(fetch, intervalMs);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, [fetch, intervalMs]);

  return { data, error, loading, lastUpdated, refresh: fetch };
}
