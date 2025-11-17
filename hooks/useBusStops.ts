import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { BusStop } from '@/types/busStop';

export function useBusStops() {
  const [busStops, setBusStops] = useState<BusStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchBusStops();
  }, []);

  const fetchBusStops = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('bus_stops')
        .select('*')
        .order('stop_order', { ascending: true });

      if (fetchError) throw fetchError;

      setBusStops(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch bus stops'));
    } finally {
      setLoading(false);
    }
  };

  return { busStops, loading, error, refetch: fetchBusStops };
}
