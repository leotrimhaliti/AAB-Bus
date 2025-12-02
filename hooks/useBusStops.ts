import { supabase } from '@/lib/supabase';
import type { BusStop } from '@/types/busStop';
import { useEffect, useState } from 'react';

// Fallback static data if Supabase is not available
const STATIC_BUS_STOPS: BusStop[] = [
  { id: 1, name: 'Kolegji AAB', latitude: 42.639249, longitude: 21.112887, stop_order: 1 },
  { id: 2, name: 'Stacioni i Autobusëve', latitude: 42.650944, longitude: 21.141129, stop_order: 2 },
  { id: 3, name: 'Rrethi me Flamur', latitude: 42.647707, longitude: 21.157072, stop_order: 3 },
  { id: 4, name: 'Ulpiana', latitude: 42.652762, longitude: 21.159083, stop_order: 4 },
  { id: 5, name: 'Katedralja', latitude: 42.655773, longitude: 21.158397, stop_order: 5 },
  { id: 6, name: 'Dardania', latitude: 42.654881, longitude: 21.154496, stop_order: 6 },
  { id: 7, name: 'Lakrishte', latitude: 42.653762, longitude: 21.150638, stop_order: 7 },
  { id: 8, name: 'Kolegji AAB', latitude: 42.639249, longitude: 21.112887, stop_order: 8 },
];

export function useBusStops() {
  // Initialize with static data for instant display
  const [busStops, setBusStops] = useState<BusStop[]>(STATIC_BUS_STOPS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchBusStops();
  }, []);

  const fetchBusStops = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if supabase is available
      if (!supabase) {
        console.log('⚠️ Supabase not available, using static bus stops');
        setBusStops(STATIC_BUS_STOPS);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('bus_stops')
        .select('*')
        .order('stop_order', { ascending: true });

      if (fetchError) {
        console.log('⚠️ Supabase fetch failed, using static bus stops');
        setBusStops(STATIC_BUS_STOPS);
        return;
      }

      setBusStops(data || STATIC_BUS_STOPS);
    } catch (err) {
      console.log('⚠️ Error fetching bus stops, using static data');
      setBusStops(STATIC_BUS_STOPS);
      setError(null); // Don't show error, just use static data
    } finally {
      setLoading(false);
    }
  };

  return { busStops, loading, error, refetch: fetchBusStops };
}
