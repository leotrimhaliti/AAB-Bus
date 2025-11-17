import { renderHook, waitFor } from '@testing-library/react-native';
import { useBusLocations } from '../hooks/useBusLocations';
import { cache } from '../lib/cache';
import { fetchWithRetry } from '../lib/fetchWithRetry';

// Mock dependencies
jest.mock('../lib/fetchWithRetry');
jest.mock('../lib/cache');
jest.mock('../hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    send: jest.fn(),
    attach: jest.fn(),
    readyState: WebSocket.OPEN,
    socketRef: { current: null },
  }),
}));
jest.mock('../hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({ isOffline: false }),
}));

const mockFetchWithRetry = fetchWithRetry as jest.MockedFunction<typeof fetchWithRetry>;
const mockCache = cache as jest.Mocked<typeof cache>;

describe('Bus Tracking Integration Tests', () => {
  const mockBusData = {
    'bus-1': {
      lat: '42.638',
      lng: '21.114',
      loc_valid: '1' as const,
      speed: '45',
      heading: '180',
      timestamp: '2025-11-15T10:30:00Z',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCache.saveBusLocations.mockResolvedValue(undefined);
    mockCache.getBusLocations.mockResolvedValue(null);
  });

  describe('Data Fetching Flow', () => {
    it('should fetch bus data and cache it', async () => {
      mockFetchWithRetry.mockResolvedValue({
        json: async () => mockBusData,
      } as Response);

      const { result } = renderHook(() =>
        useBusLocations({
          restUrl: 'https://api.example.com/buses',
          wsUrl: null,
          pollInterval: 10000,
          enableWebSocket: false,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockBusData);
      expect(result.current.error).toBeNull();
      expect(mockCache.saveBusLocations).toHaveBeenCalledWith(mockBusData);
    });

    it('should load from cache when fetch fails', async () => {
      const cachedData = {
        data: mockBusData,
        lastUpdate: new Date('2025-11-15T10:00:00Z'),
      };

      mockFetchWithRetry.mockRejectedValue(new Error('Network error'));
      mockCache.getBusLocations.mockResolvedValue(cachedData);

      const { result } = renderHook(() =>
        useBusLocations({
          restUrl: 'https://api.example.com/buses',
          wsUrl: null,
          pollInterval: 10000,
          enableWebSocket: false,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockBusData);
      expect(result.current.isFromCache).toBe(true);
      expect(result.current.error).toContain('Duke shfaqur të dhënat e ruajtura');
    });
  });

  describe('Refresh Flow', () => {
    it('should refresh data on demand', async () => {
      mockFetchWithRetry.mockResolvedValue({
        json: async () => mockBusData,
      } as Response);

      const { result } = renderHook(() =>
        useBusLocations({
          restUrl: 'https://api.example.com/buses',
          wsUrl: null,
          pollInterval: 10000,
          enableWebSocket: false,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updatedData = {
        'bus-1': { ...mockBusData['bus-1'], speed: '50' },
      };

      mockFetchWithRetry.mockResolvedValue({
        json: async () => updatedData,
      } as Response);

      result.current.refresh();

      await waitFor(() => {
        expect(result.current.data).toEqual(updatedData);
      });
    });
  });

  describe('Polling Mechanism', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should poll at specified interval', async () => {
      mockFetchWithRetry.mockResolvedValue({
        json: async () => mockBusData,
      } as Response);

      renderHook(() =>
        useBusLocations({
          restUrl: 'https://api.example.com/buses',
          wsUrl: null,
          pollInterval: 5000,
          enableWebSocket: false,
        })
      );

      await waitFor(() => {
        expect(mockFetchWithRetry).toHaveBeenCalledTimes(1);
      });

      // Fast-forward 5 seconds
      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(mockFetchWithRetry).toHaveBeenCalledTimes(2);
      });

      // Fast-forward another 5 seconds
      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(mockFetchWithRetry).toHaveBeenCalledTimes(3);
      });
    });
  });
});
