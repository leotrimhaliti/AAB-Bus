import type { BusStop } from '@/types/busStop';
import { useState } from 'react';

// Static bus stops data
const BUS_STOPS: BusStop[] = [
  { id: 1, name: 'Kolegji AAB', latitude: 42.639249, longitude: 21.112887, stop_order: 1 },
  { id: 2, name: 'Stacioni i Autobusëve', latitude: 42.650944, longitude: 21.141129, stop_order: 2 },
  { id: 3, name: 'Rrethi me Flamur', latitude: 42.647707, longitude: 21.157072, stop_order: 3 },
  { id: 4, name: 'Ulpiana', latitude: 42.652762, longitude: 21.159083, stop_order: 4 },
  { id: 5, name: 'Katedralja', latitude: 42.655773, longitude: 21.158397, stop_order: 5 },
  { id: 6, name: 'Dardania', latitude: 42.654881, longitude: 21.154496, stop_order: 6 },
  { id: 7, name: 'Lakrishte', latitude: 42.653762, longitude: 21.150638, stop_order: 7 },
  { id: 8, name: 'Kolegji AAB (kthim)', latitude: 42.639176, longitude: 21.112654, stop_order: 8 },
];

export function useBusStops() {
  const [busStops] = useState<BusStop[]>(BUS_STOPS);
  const [loading] = useState(false);
  const [error] = useState<Error | null>(null);

  const refetch = () => {
    // No-op since data is static
  };

  return { busStops, loading, error, refetch };
}
