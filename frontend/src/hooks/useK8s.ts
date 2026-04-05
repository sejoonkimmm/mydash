import { useState, useEffect, useCallback, useRef } from 'react';
import { GetK8sStatuses } from '../../wailsjs/go/main/App';
import type { ClusterStatus } from '../types';

interface UseK8sResult {
  clusters: ClusterStatus[];
  error: string | null;
  loading: boolean;
  lastUpdated: Date | null;
  refresh: () => void;
}

export function useK8sClusters(kubeconfig: string, contexts: string[], intervalMs: number): UseK8sResult {
  const [clusters, setClusters] = useState<ClusterStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    if (contexts.length === 0) return;
    try {
      setError(null);
      const data = await GetK8sStatuses(kubeconfig, contexts);
      if (mountedRef.current) {
        setClusters(data || []);
        setLastUpdated(new Date());
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [kubeconfig, contexts]);

  useEffect(() => {
    mountedRef.current = true;
    fetch();
    const id = setInterval(fetch, intervalMs);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, [fetch, intervalMs]);

  return { clusters, error, loading, lastUpdated, refresh: fetch };
}
