import { useState, useEffect, useRef } from 'react';
import { GetSystemStats } from '../../wailsjs/go/main/App';
import type { SystemStats } from '../types';

interface UseSystemStatsResult {
  stats: SystemStats | null;
  error: string | null;
  loading: boolean;
}

export function useSystemStats(intervalMs: number): UseSystemStatsResult {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch = async () => {
      try {
        setError(null);
        const data = await GetSystemStats();
        if (mountedRef.current) {
          setStats(data);
          setLoading(false);
        }
      } catch (e) {
        if (mountedRef.current) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      }
    };
    fetch();
    const id = setInterval(fetch, intervalMs);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, [intervalMs]);

  return { stats, error, loading };
}
