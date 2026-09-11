import {
  STALE_POSITION_THRESHOLD_MS,
  getBusPositionAgeMs,
  getBusPositionTimestamp,
  isBusPositionStale,
} from '../lib/busFreshness';

const NOW = new Date('2025-01-01T12:00:00.000Z').getTime();

describe('busFreshness', () => {
  describe('getBusPositionTimestamp', () => {
    it('prefers the numeric timestamp field', () => {
      const ts = getBusPositionTimestamp({ timestamp: 123, dt_tracker: '2020-01-01T00:00:00Z' });
      expect(ts).toBe(123);
    });

    it('falls back to dt_tracker when timestamp is missing', () => {
      const ts = getBusPositionTimestamp({ dt_tracker: '2025-01-01T11:59:00.000Z' });
      expect(ts).toBe(new Date('2025-01-01T11:59:00.000Z').getTime());
    });

    it('falls back to dt_server when dt_tracker is missing', () => {
      const ts = getBusPositionTimestamp({ dt_server: '2025-01-01T11:59:00.000Z' });
      expect(ts).toBe(new Date('2025-01-01T11:59:00.000Z').getTime());
    });

    it('returns null when nothing parses', () => {
      expect(getBusPositionTimestamp({})).toBeNull();
      expect(getBusPositionTimestamp({ dt_tracker: 'not-a-date' })).toBeNull();
    });
  });

  describe('getBusPositionAgeMs', () => {
    it('computes age from the timestamp field', () => {
      const age = getBusPositionAgeMs({ timestamp: NOW - 10_000 }, NOW);
      expect(age).toBe(10_000);
    });

    it('returns null when timestamp is unknown', () => {
      expect(getBusPositionAgeMs({}, NOW)).toBeNull();
    });
  });

  describe('isBusPositionStale', () => {
    it('is not stale just under the threshold', () => {
      const bus = { timestamp: NOW - (STALE_POSITION_THRESHOLD_MS - 1000) };
      expect(isBusPositionStale(bus, NOW)).toBe(false);
    });

    it('is stale just over the threshold', () => {
      const bus = { timestamp: NOW - (STALE_POSITION_THRESHOLD_MS + 1000) };
      expect(isBusPositionStale(bus, NOW)).toBe(true);
    });

    it('is never stale when age is unknown, since staleness can\'t be claimed without a timestamp', () => {
      expect(isBusPositionStale({}, NOW)).toBe(false);
    });

    it('respects a custom threshold', () => {
      const bus = { timestamp: NOW - 5000 };
      expect(isBusPositionStale(bus, NOW, 4000)).toBe(true);
      expect(isBusPositionStale(bus, NOW, 6000)).toBe(false);
    });
  });
});
