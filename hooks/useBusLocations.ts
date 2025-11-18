import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchWithRetry } from '../lib/fetchWithRetry';
import { useWebSocket } from './useWebSocket';
import { BusData } from '../types/bus';
import { cache } from '../lib/cache';
import { useNetworkStatus } from './useNetworkStatus';
import { syncBusLocationsToSupabase } from '../lib/busSync';

export function useBusLocations({
  restUrl,
  wsUrl,
  pollInterval = 10000,
  enableWebSocket = true,
}: {
  restUrl: string;
  wsUrl?: string | null;
  pollInterval?: number;
  enableWebSocket?: boolean;
}) {
  const [data, setData] = useState<BusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const pollingRef = useRef<number | null>(null);

  const { isOffline } = useNetworkStatus();

  const { send, attach, readyState } = useWebSocket(enableWebSocket ? wsUrl ?? null : null);

  const loadOnce = useCallback(
    async (signal?: AbortSignal) => {
      // If offline, try to load from cache
      if (isOffline) {
        const cached = await cache.getBusLocations();
        if (cached) {
          setData(cached.data);
          setIsFromCache(true);
          setLastUpdate(cached.lastUpdate);
          setError('Jeni offline. Duke shfaqur të dhënat e ruajtura.');
          setLoading(false);
        } else {
          setError('Nuk ka lidhje me internetin dhe nuk ka të dhëna të ruajtura.');
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setIsFromCache(false);
        const resp = await fetchWithRetry(restUrl, { method: 'GET', signal }, { retries: 2 });
        const json = await resp.json();
        const parsedData = typeof json === 'string' ? JSON.parse(json) : json;

        setData(parsedData);
        setLastUpdate(new Date());

        // Save to cache for offline use
        await cache.saveBusLocations(parsedData);

        // Sync to Supabase (insert new buses, update existing ones)
        // Don't let sync errors affect bus display
        syncBusLocationsToSupabase(parsedData).catch(err => {
          console.error('Background sync error:', err);
        });
      } catch (err: any) {
        if (signal?.aborted) return;

        // If fetch fails, try to load from cache
        const cached = await cache.getBusLocations();
        if (cached) {
          setData(cached.data);
          setIsFromCache(true);
          setLastUpdate(cached.lastUpdate);
          setError('Nuk mund të ngarkohen të dhënat e reja. Duke shfaqur të dhënat e ruajtura.');
        } else {
          setError(err?.message ?? String(err));
        }
      } finally {
        setLoading(false);
      }
    },
    [restUrl, isOffline]
  );

  useEffect(() => {
    attach({
      message: (payload: any) => {
        if (!payload) return;
        setData(payload);
        setError(null);

        // Sync WebSocket data to Supabase as well (in background)
        syncBusLocationsToSupabase(payload).catch(err => {
          console.error('Background sync error:', err);
        });
      },
    });
  }, [attach]);

  useEffect(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    loadOnce(controller.signal);

    if (!wsUrl || readyState !== WebSocket.OPEN) {
      pollingRef.current = window.setInterval(() => {
        const c = new AbortController();
        controllerRef.current = c;
        loadOnce(c.signal);
      }, pollInterval) as unknown as number;
    }

    return () => {
      controllerRef.current?.abort();
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [loadOnce, pollInterval, wsUrl, readyState]);

  const refresh = useCallback(() => {
    controllerRef.current?.abort();
    const c = new AbortController();
    controllerRef.current = c;
    loadOnce(c.signal);
  }, [loadOnce]);

  const canUseWS = useMemo(() => !!wsUrl && enableWebSocket, [wsUrl, enableWebSocket]);

  return {
    data,
    loading,
    error,
    refresh,
    sendWs: send,
    canUseWS,
    wsReadyState: readyState,
    isFromCache,
    lastUpdate,
    isOffline,
  };
}
