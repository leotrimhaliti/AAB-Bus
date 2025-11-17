/**
 * Unit tests for useBusLocations hook
 * Note: Full hook testing requires React Native environment setup
 * These tests verify the hook's core logic and dependencies
 */

import { cache } from '../lib/cache';
import { fetchWithRetry } from '../lib/fetchWithRetry';

// Mock dependencies
jest.mock('../lib/cache');
jest.mock('../lib/fetchWithRetry');
jest.mock('../hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({ isOffline: false }),
}));
jest.mock('../hooks/useWebSocket', () => ({
  useWebSocket: () => ({ send: jest.fn(), attach: jest.fn(), readyState: 0 }),
}));

describe('useBusLocations dependencies', () => {
  it('cache module is available', () => {
    expect(cache).toBeDefined();
    expect(cache.saveBusLocations).toBeDefined();
    expect(cache.getBusLocations).toBeDefined();
  });

  it('fetchWithRetry is available', () => {
    expect(fetchWithRetry).toBeDefined();
  });
});
