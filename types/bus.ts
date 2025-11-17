export interface BusLocation {
  name?: string;
  dt_server?: string;
  dt_tracker?: string;
  lat: string;
  lng: string;
  altitude?: string;
  angle?: string;
  heading?: string;
  speed?: string;
  params?: Record<string, string>;
  loc_valid: '0' | '1';
  timestamp?: number;
}

export type BusData = Record<string, BusLocation>;
