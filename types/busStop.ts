export interface BusStop {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  stop_order: number;
  created_at?: string;
}
