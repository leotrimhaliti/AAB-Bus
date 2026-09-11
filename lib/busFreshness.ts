import type { BusLocation } from '@/types/bus';

/**
 * A position older than this is no longer shown as "live" — it's shown as
 * "i fundit i njohur" (last known) instead. Matches the 30s threshold
 * proposed in the thesis (page 34) for distinguishing a fresh GPS fix from
 * a stale one once the map is already loaded.
 */
export const STALE_POSITION_THRESHOLD_MS = 30_000;

/**
 * Resolves the wall-clock time a bus position was reported, in ms since
 * epoch. Tries the fields the API may provide, in order of preference.
 * Returns null when none of them parse — age is then unknown, not stale.
 */
export function getBusPositionTimestamp(bus: Pick<BusLocation, 'timestamp' | 'dt_tracker' | 'dt_server'>): number | null {
  if (typeof bus.timestamp === 'number' && Number.isFinite(bus.timestamp)) {
    return bus.timestamp;
  }

  if (bus.dt_tracker) {
    const parsed = Date.parse(bus.dt_tracker);
    if (!Number.isNaN(parsed)) return parsed;
  }

  if (bus.dt_server) {
    const parsed = Date.parse(bus.dt_server);
    if (!Number.isNaN(parsed)) return parsed;
  }

  return null;
}

/**
 * Age of a bus position in ms, or null when it can't be determined
 * (no usable timestamp field on the record).
 */
export function getBusPositionAgeMs(
  bus: Pick<BusLocation, 'timestamp' | 'dt_tracker' | 'dt_server'>,
  now: number = Date.now()
): number | null {
  const reportedAt = getBusPositionTimestamp(bus);
  if (reportedAt === null) return null;
  return Math.max(0, now - reportedAt);
}

/**
 * Whether a bus position should stop being presented as the bus's current
 * location. A position with no parseable timestamp is treated as NOT stale
 * — we don't have grounds to claim it's outdated, so we don't relabel it.
 */
export function isBusPositionStale(
  bus: Pick<BusLocation, 'timestamp' | 'dt_tracker' | 'dt_server'>,
  now: number = Date.now(),
  thresholdMs: number = STALE_POSITION_THRESHOLD_MS
): boolean {
  const age = getBusPositionAgeMs(bus, now);
  if (age === null) return false;
  return age > thresholdMs;
}
